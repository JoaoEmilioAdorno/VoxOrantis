import { PRAYER_STATUS } from "../../hooks/usePrayer";

export default function PrayerButton({
  loading,
  status,
  onClick,
}) {
  const isCooldown =
    status === PRAYER_STATUS.COOLDOWN;

  const disabled =
    loading || isCooldown;

  function getLabel() {
    switch (status) {
      case PRAYER_STATUS.LOCATING:
        return "Obtendo localização...";

      case PRAYER_STATUS.SENDING:
        return "Enviando oração...";

      case PRAYER_STATUS.SUCCESS:
        return "Oração enviada ✓";

      case PRAYER_STATUS.COOLDOWN:
        return "Aguarde para oferecer outra";

      default:
        return "Oferecer Ave Maria";
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {getLabel()}
    </button>
  );
}