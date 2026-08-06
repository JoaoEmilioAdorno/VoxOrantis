import { useEffect, useState } from "react";
import { getStats } from "../services/statsService";

export default function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return {
    stats,
    loading,
    error,
  };
}