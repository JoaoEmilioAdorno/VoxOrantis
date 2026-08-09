import { useEffect, useRef, useState } from "react";
import { savePrayer } from "../services/prayerService";
import useGeolocation from "./useGeolocation";

export const PRAYER_STATUS = {
  IDLE: "idle",
  LOCATING: "locating",
  SENDING: "sending",
  SUCCESS: "success",
  COOLDOWN: "cooldown",
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
  const cooldownTimerRef = useRef(null);

  const {
    getCurrentLocation,
    resetLocation,
  } = useGeolocation();

  function startCooldownTimer(remainingMs) {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      setError(null);
      setStatus(PRAYER_STATUS.IDLE);

      cooldownTimerRef.current = null;
    }, remainingMs);
  }

  async function submitPrayer() {
    const now = Date.now();

    // Impede dois envios simultâneos
    if (submitLockRef.current) {
      console.log(
        "🙏 Envio ignorado: oração já está sendo processada."
      );

      return false;
    }

    // Proteção local contra cliques repetidos
    const elapsed = now - lastPrayerRef.current;

    if (elapsed < PRAYER_COOLDOWN_MS) {
      const remainingMs =
        PRAYER_COOLDOWN_MS - elapsed;

      const remainingSeconds = Math.ceil(
        remainingMs / 1000
      );

      setError(
        `Sua oração já foi registrada. Aguarde ${remainingSeconds}s para oferecer outra.`
      );

      setStatus(PRAYER_STATUS.COOLDOWN);

      startCooldownTimer(remainingMs);

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

      lastPrayerRef.current = Date.now();

      setNickname("");
      resetLocation();

      setStatus(PRAYER_STATUS.SUCCESS);

      return true;
    } catch (err) {
      console.error(err);

      // Bloqueio realizado pelo backend
      if (
        err.message?.includes(
          "Aguarde alguns segundos antes de enviar outra oração"
        )
      ) {
        setError(
          "Sua oração já foi registrada. Aguarde alguns segundos para oferecer outra."
        );

        setStatus(PRAYER_STATUS.COOLDOWN);

        // Como o backend não informa exatamente quanto tempo resta,
        // usamos novamente o período completo de segurança.
        startCooldownTimer(PRAYER_COOLDOWN_MS);

        return false;
      }

      // Erro verdadeiro
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

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

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