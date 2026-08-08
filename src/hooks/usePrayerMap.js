import { useCallback, useEffect, useState } from "react";
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
  };
}

export default function usePrayerMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPrayers = useCallback(async () => {
    try {
      const prayers = await getActivePrayers();

      const globePoints = prayers.map(createGlobePoint);

      setPoints(globePoints);
    } catch (error) {
      console.error("Erro ao carregar orações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrayers();

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
          console.log("🔥 EVENTO REALTIME:", payload);

          if (payload.eventType === "INSERT") {
            const newPoint = createGlobePoint(payload.new,0.01);

            setPoints((currentPoints) => {
              const alreadyExists = currentPoints.some(
                (point) => point.id === newPoint.id
              );

              if (alreadyExists) {
                return currentPoints;
              }

              return [...currentPoints, newPoint];
            });

            return;
          }

          if (payload.eventType === "DELETE") {
            setPoints((currentPoints) =>
              currentPoints.filter(
                (point) => point.id !== payload.old.id
              )
            );

            return;
          }
          //
          setTimeout(() => {
          setPoints((currentPoints) =>
            currentPoints.map((point) =>
            point.id === newPoint.id
            ? { ...point, size: 0.25 }
            : point
               )
            );
          }, 50);

          if (payload.eventType === "UPDATE") {
            setPoints((currentPoints) =>
              currentPoints.map((point) => {
                if (point.id !== payload.new.id) {
                  return point;
                }

                return {
                  ...point,
                  lat: payload.new.latitude ?? point.lat,
                  lng: payload.new.longitude ?? point.lng,
                  createdAt:
                    payload.new.created_at ?? point.createdAt,
                };
              })
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPrayers]);

  return {
    points,
    loading,
  };
}