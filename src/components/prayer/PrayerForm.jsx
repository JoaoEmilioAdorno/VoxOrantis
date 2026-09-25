import { useEffect, useMemo, useState } from "react";
import { getPrayers } from "../../content/prayers";
import { loadPublishedPrayers } from "../../services/prayerSuggestionService";
import usePrayer, {
  PRAYER_STATUS,
} from "../../hooks/usePrayer";

import PrayerButton from "./PrayerButton";

export default function PrayerForm({
  onPrayerStart,
}) {
  const [publishedPrayers, setPublishedPrayers] = useState([]);
  const [selectedId, setSelectedId] = useState("ave-maria");
  const [lastOfferedId, setLastOfferedId] = useState(null);
  const [libraryError, setLibraryError] = useState("");
  const prayers = useMemo(() => [
    { id: "ave-maria", title: "Ave Maria", original: true },
    ...[...getPrayers(), ...publishedPrayers]
      .filter(prayer => prayer.id !== "ave-maria")
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR")),
  ], [publishedPrayers]);
  const selectedPrayer = prayers.find(prayer => prayer.id === selectedId) ?? prayers[0];

  useEffect(() => {
    let active = true;
    async function refreshPrayers() {
      try {
        const published = await loadPublishedPrayers();
        if (active) {
          setPublishedPrayers(published);
          setLibraryError("");
        }
      } catch {
        if (active) setLibraryError("Não foi possível carregar as orações publicadas. Atualize a página para tentar novamente.");
      }
    }
    void refreshPrayers();
    window.addEventListener("focus", refreshPrayers);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshPrayers);
    };
  }, []);

  const {
    nickname,
    setNickname,
    loading,
    error,
    status,
    submitPrayer,
  } = usePrayer();

  async function handleSubmit() {
    setLastOfferedId(selectedPrayer.id);
    await submitPrayer({
      prayerType: selectedPrayer.id,
      onAccepted: () => onPrayerStart?.(selectedPrayer.original ? null : selectedPrayer),
    });
  }

  return (
    <section>
      <h2>Ofereça uma oração</h2>
      <label className="prayer-choice-label" htmlFor="globe-prayer-choice">Escolha a oração</label>
      <select id="globe-prayer-choice" className="prayer-choice"
        value={selectedPrayer.id} onChange={event => setSelectedId(event.target.value)} disabled={loading}>
        {prayers.map(prayer => <option key={prayer.id} value={prayer.id}>{prayer.title}</option>)}
      </select>
      {libraryError && <p role="status" className="prayer-error">{libraryError}</p>}

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
        status={status === PRAYER_STATUS.SUCCESS && lastOfferedId !== selectedPrayer.id ? PRAYER_STATUS.IDLE : status}
        prayerTitle={selectedPrayer.title}
        onClick={handleSubmit}
      />

      {status ===
        PRAYER_STATUS.SUCCESS && (
        <div className="prayer-success">
          <p className="prayer-success-title">
            ✨ Sua oração agora ilumina
            o mundo.
          </p>

          <p className="prayer-success-subtitle">
            Obrigado por fazer parte desta
            corrente de oração.
          </p>
        </div>
      )}

      {status ===
        PRAYER_STATUS.COOLDOWN &&
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
