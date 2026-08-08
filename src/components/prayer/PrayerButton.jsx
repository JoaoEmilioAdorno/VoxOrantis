import { PRAYER_STATUS } from "../../hooks/usePrayer";

export default function PrayerButton({
  loading,
  status,
  onClick,
}) {
  function getLabel() {
    switch (status) {
      case PRAYER_STATUS.LOCATING:
        return "Obtendo localização...";

      case PRAYER_STATUS.SENDING:
        return "Enviando oração...";

      case PRAYER_STATUS.SUCCESS:
        return "Oração enviada ✓";

      default:
        return "Oferecer Ave Maria";
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
    >
      {getLabel()}
    </button>
  );
}