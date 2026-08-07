import { useEffect, useState } from "react";
import { getActivePrayers } from "../services/prayerService";

export default function usePrayerMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrayers() {
      try {
        const prayers = await getActivePrayers();

        const globePoints = prayers.map((prayer) => ({
          id: prayer.id,
          lat: prayer.latitude,
          lng: prayer.longitude,
          size: 0.25,
          color: "#FFD700",
        }));

        setPoints(globePoints);
      } catch (error) {
        console.error("Erro ao carregar orações:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPrayers();
  }, []);

  return {
    points,
    loading,
  };
}