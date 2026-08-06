import usePrayer from "../../hooks/usePrayer";
import PrayerButton from "./PrayerButton";

export default function PrayerForm() {
  const {
    nickname,
    setNickname,
    loading,
    error,
    submitPrayer,
  } = usePrayer();

  async function handleSubmit() {
    // Coordenadas provisórias
    // No Commit 6 serão substituídas pela Geolocalização.
    await submitPrayer(-15.601, -56.097);
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
        onClick={handleSubmit}
      />

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </section>
  );
}