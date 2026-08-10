import usePrayer, {
  PRAYER_STATUS,
} from "../../hooks/usePrayer";

import PrayerButton from "./PrayerButton";

export default function PrayerForm() {
  const {
    nickname,
    setNickname,
    loading,
    error,
    status,
    submitPrayer,
  } = usePrayer();

  async function handleSubmit() {
    await submitPrayer();
  }

  return (
    <section>
      <h2>Ofereça uma Ave Maria</h2>

      <input
        type="text"
        placeholder="Seu nome ou apelido (opcional)"
        value={nickname}
        onChange={(e) =>
          setNickname(e.target.value)
        }
        maxLength={40}
      />

      <PrayerButton
        loading={loading}
        status={status}
        onClick={handleSubmit}
      />

      {status === PRAYER_STATUS.SUCCESS && (
        <div className="prayer-success">
          <p className="prayer-success-title">
            ✨ Sua oração agora ilumina o mundo.
          </p>

          <p className="prayer-success-subtitle">
            Obrigado por fazer parte desta corrente de oração.
          </p>
        </div>
      )}

      {status === PRAYER_STATUS.COOLDOWN &&
        error && (
          <p className="prayer-cooldown">
            🙏 {error}
          </p>
        )}

      {status === PRAYER_STATUS.ERROR &&
        error && (
          <p className="prayer-error">
            {error}
          </p>
        )}
    </section>
  );
}