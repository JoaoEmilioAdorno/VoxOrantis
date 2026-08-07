import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getActivePrayers } from "../services/prayerService";

export default function usePrayerMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPrayers = useCallback(async () => {
    try {
      const prayers = await getActivePrayers();

      const globePoints = prayers.map((prayer) => ({
        id: prayer.id,
        lat: prayer.latitude + (Math.random() - 0.5) * 0.2,
        lng: prayer.longitude + (Math.random() - 0.5) * 0.2,
        size: 0.25,
        color: "#FFD700",
      }));

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
        loadPrayers();
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