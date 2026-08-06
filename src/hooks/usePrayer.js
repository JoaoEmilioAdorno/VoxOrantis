import { useState } from "react";
import { savePrayer } from "../services/prayerService";

export default function usePrayer() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submitPrayer(latitude, longitude) {
    setLoading(true);
    setError(null);

    try {
      await savePrayer({
        nickname,
        latitude,
        longitude,
      });

      setNickname("");
      return true;
    } catch (err) {
      console.error(err);
      setError(err.message);
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