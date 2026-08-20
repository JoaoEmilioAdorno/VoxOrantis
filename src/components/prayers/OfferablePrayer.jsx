import usePrayer, {
  PRAYER_STATUS,
} from "../../hooks/usePrayer";

export default function OfferablePrayer({
  prayer,
  onPrayerStart,
}) {
  const {
    loading,
    error,
    status,
    submitPrayer,
  } = usePrayer();

  async function handleOffer() {
    await submitPrayer({
      prayerType: prayer.id,
      onAccepted: () =>
        onPrayerStart?.(prayer),
    });
  }

  return (
    <>
      <button
        type="button"
        className="chapel-primary-button"
        onClick={handleOffer}
        disabled={loading}
      >
        {loading
          ? "Oferecendo..."
          : `Oferecer ${prayer.title}`}
      </button>

      {status ===
        PRAYER_STATUS.SUCCESS && (
        <p className="prayer-success-title">
          ✨ Sua oração agora ilumina
          o mundo.
        </p>
      )}

      {status ===
        PRAYER_STATUS.COOLDOWN &&
        error && (
          <p className="prayer-cooldown">
            🙏 {error}
          </p>
        )}

      {status ===
        PRAYER_STATUS.ERROR &&
        error && (
          <p className="prayer-error">
            {error}
          </p>
        )}
    </>
  );
}