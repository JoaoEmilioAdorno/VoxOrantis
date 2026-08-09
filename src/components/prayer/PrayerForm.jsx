import usePrayer, { PRAYER_STATUS } from "../../hooks/usePrayer";
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
        placeholder="Digite seu nome ou apelido"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={40}
      />

      <PrayerButton
        loading={loading}
        status={status}
        onClick={handleSubmit}
      />

      {status === PRAYER_STATUS.LOCATING && (
        <p>
          📍 Obtendo sua localização...
        </p>
      )}

      {status === PRAYER_STATUS.SENDING && (
        <p>
          🙏 Enviando sua oração...
        </p>
      )}

      {status === PRAYER_STATUS.SUCCESS && (
        <p>
          ✨ Ave Maria registrada.
        </p>
      )}

      {status === PRAYER_STATUS.COOLDOWN && error && (
        <p>
          🙏 {error}
        </p>
      )}

      {status === PRAYER_STATUS.ERROR && error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </section>
  );
}