import { useCallback, useState } from "react";

export default function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = "Geolocalização não suportada pelo navegador.";

        setError(message);
        setLoading(false);

        reject(new Error(message));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setLocation(coords);
          setLoading(false);

          resolve(coords);
        },
        (err) => {
          let message = "Erro ao obter localização.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = "Permissão de localização negada.";
              break;

            case err.POSITION_UNAVAILABLE:
              message = "Localização indisponível.";
              break;

            case err.TIMEOUT:
              message = "Tempo esgotado ao obter localização.";
              break;

            default:
              message = "Erro desconhecido ao obter localização.";
          }

          setError(message);
          setLoading(false);

          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const resetLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    resetLocation,
  };
}