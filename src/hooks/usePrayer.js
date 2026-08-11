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

  async function submitPrayer({
    onAccepted,
  } = {}) {
    const now = Date.now();

    if (submitLockRef.current) {
      console.log(
        "🙏 Envio ignorado: oração já está sendo processada."
      );

      return false;
    }

    const elapsed =
      now - lastPrayerRef.current;

    if (elapsed < PRAYER_COOLDOWN_MS) {
      const remainingMs =
        PRAYER_COOLDOWN_MS - elapsed;

      const remainingSeconds =
        Math.ceil(remainingMs / 1000);

      setError(
        `Sua oração já foi registrada. Aguarde ${remainingSeconds}s para oferecer outra.`
      );

      setStatus(PRAYER_STATUS.COOLDOWN);

      startCooldownTimer(remainingMs);

      return false;
    }

    submitLockRef.current = true;

    /*
     * A oração foi aceita pelo frontend.
     *
     * Disparamos áudio + legenda aqui,
     * ainda dentro do clique do usuário
     * e antes da geolocalização assíncrona.
     */
    onAccepted?.();

    setLoading(true);
    setError(null);
    setStatus(PRAYER_STATUS.LOCATING);

    try {
      const position =
        await getCurrentLocation();

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

      if (
        err.message?.includes(
          "Aguarde alguns segundos antes de enviar outra oração"
        )
      ) {
        setError(
          "Sua oração já foi registrada. Aguarde alguns segundos para oferecer outra."
        );

        setStatus(PRAYER_STATUS.COOLDOWN);

        startCooldownTimer(
          PRAYER_COOLDOWN_MS
        );

        return false;
      }

      setError(
        err.message ||
          "Erro ao enviar oração."
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
        clearTimeout(
          cooldownTimerRef.current
        );
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