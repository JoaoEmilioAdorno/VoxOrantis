import { useRef, useState } from "react";
import { savePrayer } from "../services/prayerService";
import useGeolocation from "./useGeolocation";

export const PRAYER_STATUS = {
  IDLE: "idle",
  LOCATING: "locating",
  SENDING: "sending",
  SUCCESS: "success",
  ERROR: "error",
};

const PRAYER_COOLDOWN_MS = 10000;

export default function usePrayer() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(PRAYER_STATUS.IDLE);

  const submitLockRef = useRef(false);
  const lastPrayerRef = useRef(0);

  const {
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  async function submitPrayer() {
    const now = Date.now();

    // Proteção 1:
    // impede dois envios acontecendo ao mesmo tempo
    if (submitLockRef.current) {
      console.log(
        "🙏 Envio ignorado: oração já está sendo processada."
      );

      return false;
    }

    // Proteção 2:
    // impede várias orações em sequência muito rápida
    const elapsed = now - lastPrayerRef.current;

    if (elapsed < PRAYER_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (PRAYER_COOLDOWN_MS - elapsed) / 1000
      );

      console.log(
        `🙏 Aguarde ${remainingSeconds}s antes de enviar outra oração.`
      );

      return false;
    }

    submitLockRef.current = true;

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

      // Marca o horário somente depois que a oração
      // foi realmente salva com sucesso
      lastPrayerRef.current = Date.now();

      setNickname("");
      resetLocation();

      setStatus(PRAYER_STATUS.SUCCESS);

      return true;
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Erro ao enviar oração."
      );

      setStatus(PRAYER_STATUS.ERROR);

      return false;
    } finally {
      setLoading(false);
      submitLockRef.current = false;
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