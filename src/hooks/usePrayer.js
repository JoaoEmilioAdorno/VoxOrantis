import { useState } from "react";
import { savePrayer } from "../services/prayerService";
import useGeolocation from "./useGeolocation";

export default function usePrayer() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  async function submitPrayer() {
    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentLocation();

      await savePrayer({
        nickname,
        latitude: position.latitude,
        longitude: position.longitude,
      });

      setNickname("");
      resetLocation();

      return true;
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao enviar oração.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    nickname,
    setNickname,
    loading,
    error,
    submitPrayer,
  };
}