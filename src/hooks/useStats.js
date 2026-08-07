import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getStats } from "../services/statsService";

export default function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stats",
        },
        (payload) => {
          console.log("📊 Stats atualizadas:", payload);
          loadStats();
        }
      )
      .subscribe((status) => {
        console.log("📡 Stats Realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
  };
}