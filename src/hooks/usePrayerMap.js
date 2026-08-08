import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { getActivePrayers } from "../services/prayerService";

function createGlobePoint(prayer) {
  return {
    id: prayer.id,

    lat:
      prayer.latitude +
      (Math.random() - 0.5) * 2.0,

    lng:
      prayer.longitude +
      (Math.random() - 0.5) * 2.0,

    size: 0.25,
    color: "#FFD700",

    opacity: 1,
    intensity: 1,

    createdAt: prayer.created_at,
    expiresAt: prayer.expires_at,
  };
}

function parseDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const normalizedDate = dateValue.replace(
    /(\.\d{3})\d+/,
    "$1"
  );

  const timestamp = new Date(normalizedDate).getTime();

  return Number.isNaN(timestamp)
    ? null
    : timestamp;
}

export default function usePrayerMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const serverOffsetRef = useRef(0);

  const syncServerClock = useCallback(async () => {
    try {
      const clientBefore = Date.now();

      const { data, error } = await supabase.rpc(
        "get_server_time"
      );

      const clientAfter = Date.now();

      if (error) {
        throw error;
      }

      const serverTime = parseDate(data);

      if (serverTime === null) {
        throw new Error(
          "Horário do servidor inválido."
        );
      }

      const clientMidpoint =
        (clientBefore + clientAfter) / 2;

      serverOffsetRef.current =
        serverTime - clientMidpoint;
    } catch (error) {
      console.error(
        "Erro ao sincronizar horário com o servidor:",
        error
      );

      serverOffsetRef.current = 0;
    }
  }, []);

  const getServerNow = useCallback(() => {
    return Date.now() + serverOffsetRef.current;
  }, []);

  const loadPrayers = useCallback(async () => {
    try {
      const prayers = await getActivePrayers();

      const globePoints =
        prayers.map(createGlobePoint);

      setPoints(globePoints);
    } catch (error) {
      console.error(
        "Erro ao carregar orações:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      await syncServerClock();

      if (!active) {
        return;
      }

      await loadPrayers();
    }

    initialize();

    const channel = supabase
      .channel("prayers-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prayers",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newPoint =
              createGlobePoint(payload.new);

            setPoints((currentPoints) => {
              const alreadyExists =
                currentPoints.some(
                  (point) =>
                    point.id === newPoint.id
                );

              if (alreadyExists) {
                return currentPoints;
              }

              return [
                ...currentPoints,
                newPoint,
              ];
            });

            return;
          }

          if (payload.eventType === "DELETE") {
            setPoints((currentPoints) =>
              currentPoints.filter(
                (point) =>
                  point.id !== payload.old.id
              )
            );

            return;
          }

          if (payload.eventType === "UPDATE") {
            setPoints((currentPoints) =>
              currentPoints.map((point) => {
                if (
                  point.id !== payload.new.id
                ) {
                  return point;
                }

                return {
                  ...point,

                  lat:
                    payload.new.latitude ??
                    point.lat,

                  lng:
                    payload.new.longitude ??
                    point.lng,

                  createdAt:
                    payload.new.created_at ??
                    point.createdAt,

                  expiresAt:
                    payload.new.expires_at ??
                    point.expiresAt,
                };
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      active = false;

      supabase.removeChannel(channel);
    };
  }, [
    loadPrayers,
    syncServerClock,
  ]);

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    const serverNow = getServerNow();

    const hasExpiredPoints =
      points.some((point) => {
        const expirationTime =
          parseDate(point.expiresAt);

        return (
          expirationTime !== null &&
          expirationTime <= serverNow
        );
      });

    if (hasExpiredPoints) {
      setPoints((currentPoints) =>
        currentPoints.filter((point) => {
          const expirationTime =
            parseDate(point.expiresAt);

          if (expirationTime === null) {
            return true;
          }

          return (
            expirationTime >
            getServerNow()
          );
        })
      );

      return;
    }

    const expirationTimes =
      points
        .map((point) =>
          parseDate(point.expiresAt)
        )
        .filter(
          (time) =>
            time !== null &&
            time > serverNow
        );

    if (expirationTimes.length === 0) {
      return;
    }

    const nextExpiration =
      Math.min(...expirationTimes);

    const delay =
      Math.max(
        nextExpiration -
          getServerNow(),
        0
      ) + 50;

    const expirationTimer =
      setTimeout(() => {
        setPoints((currentPoints) =>
          currentPoints.filter((point) => {
            const expirationTime =
              parseDate(point.expiresAt);

            if (expirationTime === null) {
              return true;
            }

            return (
              expirationTime >
              getServerNow()
            );
          })
        );
      }, delay);

    return () => {
      clearTimeout(expirationTimer);
    };
  }, [
    points,
    getServerNow,
  ]);

  return {
    points,
    loading,
  };
}