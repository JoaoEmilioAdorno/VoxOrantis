import { useState } from "react";
import { savePrayer } from "../services/prayerService";
import useGeolocation from "./useGeolocation";

export const PRAYER_STATUS = {
  IDLE: "idle",
  LOCATING: "locating",
  SENDING: "sending",
  SUCCESS: "success",
  ERROR: "error",
};

export default function usePrayer() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(PRAYER_STATUS.IDLE);

  const {
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  async function submitPrayer() {
    setLoading(true);
    setError(null);
    setStatus(PRAYER_STATUS.LOCATING);

    try {
      const position = await getCurrentLocation();

      setStatus(PRAYER_STATUS.SENDING);

      await savePrayer({
        nickname,
        latitude: position.latitude,
        longitude: position.longitude,
      });

      setNickname("");
      resetLocation();

      setStatus(PRAYER_STATUS.SUCCESS);

      return true;
    } catch (err) {
      console.error(err);

      setError(err.message || "Erro ao enviar oração.");
      setStatus(PRAYER_STATUS.ERROR);

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
    status,
    submitPrayer,
    prayerStatus: PRAYER_STATUS,
  };
}
