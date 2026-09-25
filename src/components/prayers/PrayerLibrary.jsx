import { MARIAN_ROSARY } from "../../content/devotions";
import DevotionForm from "../devotions/DevotionForm";
import DevotionReader from "../devotions/DevotionReader";
import { useEffect, useMemo, useState } from "react";

import { getPrayers as getStaticPrayers } from "../../content/prayers";
import { loadPublishedPrayers } from "../../services/prayerSuggestionService";
import OfferablePrayer from "./OfferablePrayer";
import PrayerSuggestionForm from "./PrayerSuggestionForm";

export default function PrayerLibrary({
  onOfferPrayer,
}) {
  const [publishedPrayers, setPublishedPrayers] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingPrayer, setAddingPrayer] = useState(false);
  const [category, setCategory] = useState(null);
  const [creatingDevotion, setCreatingDevotion] = useState(false);

  const prayers = useMemo(
    () =>
      [...getStaticPrayers(), ...publishedPrayers].sort(
        (first, second) =>
          first.title.localeCompare(second.title, "pt-BR", {
            sensitivity: "base",
          })
      ),
    [publishedPrayers]
  );

  const [selectedPrayer, setSelectedPrayer] =
    useState(null);

  useEffect(() => {
    let active = true;

    async function loadPrayers() {
      try {
        const approvedPrayers =
          await loadPublishedPrayers({ includeDevotions: true });

        if (active) {
          setPublishedPrayers(approvedPrayers);
        }
      } catch (loadError) {
        console.error(
          "Erro ao carregar orações publicadas:",
          loadError
        );

        if (active) {
          setError(
            "As orações publicadas não puderam ser carregadas."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrayers();
    window.addEventListener("focus", loadPrayers);

    return () => {
      active = false;
      window.removeEventListener("focus", loadPrayers);
    };
  }, []);

  if (creatingDevotion) return <DevotionForm kind={category} onBack={() => setCreatingDevotion(false)} />;
  if (selectedPrayer?.devotion) return <DevotionReader key={selectedPrayer.id} title={selectedPrayer.title} prayerId={selectedPrayer.id} devotion={selectedPrayer.devotion} onOfferPrayer={onOfferPrayer} onBack={() => setSelectedPrayer(null)} />;
  if (category) {
    const collection = [...(category === "rosary" ? [MARIAN_ROSARY] : []), ...prayers.filter(prayer => prayer.devotion?.kind === category)];
    return <section className="prayer-chapel">
      <button className="chapel-secondary-button" onClick={() => setCategory(null)}>Voltar para outras orações</button>
      <header className="prayer-chapel-header"><h2>{category === "rosary" ? "Terços" : "Novenas"}</h2><p className="prayer-chapel-intro">{category === "rosary" ? "Roteiros com etapas, mistérios e repetições configuradas." : "Escolha uma novena e o dia que deseja ler, sem acompanhamento ou registro de progresso."}</p></header>
      <button className="chapel-primary-button" onClick={() => setCreatingDevotion(true)}>{category === "rosary" ? "Cadastrar terço" : "Cadastrar novena"}</button>
      <p className="prayer-chapel-moderation-note">Novos roteiros só aparecem após aprovação da moderação.</p>
      {loading && <p>Carregando roteiros publicados...</p>}{error && <p className="prayer-chapel-error">{error}</p>}
      <div className="prayer-request-list">{collection.map(prayer => <button className="prayer-library-card" key={prayer.id} onClick={() => setSelectedPrayer(prayer)}><div><strong>{prayer.title}</strong><p>{prayer.subtitle || (category === "novena" ? `${prayer.devotion.sections.length} dias` : `${prayer.devotion.sections.length} etapas`)}</p></div></button>)}</div>
      {!loading && !collection.length && <p className="prayer-chapel-empty">Ainda não há {category === "novena" ? "novenas publicadas" : "terços publicados"}. Cadastre um roteiro para revisão.</p>}
    </section>;
  }

  if (addingPrayer) {
    return (
      <>
        <button
          type="button"
          className="chapel-secondary-button"
          onClick={() => setAddingPrayer(false)}
        >
          Voltar para outras orações
        </button>
        <PrayerSuggestionForm />
      </>
    );
  }

  if (selectedPrayer) {
    return (
      <section className="prayer-chapel">
        <header className="prayer-chapel-header">
          <h2>{selectedPrayer.title}</h2>

          {selectedPrayer.subtitle && (
            <p className="prayer-chapel-intro">
              {selectedPrayer.subtitle}
            </p>
          )}
        </header>

        <div className="prayer-chapel-divider" />

        <article className="prayer-library-viewer">
          <p className="prayer-library-text">
            {selectedPrayer.text}
          </p>

          {selectedPrayer.audio && (
            <audio
              className="prayer-library-audio"
              controls
              preload="metadata"
              src={selectedPrayer.audio}
            >
              Seu navegador não suporta reprodução de áudio.
            </audio>
          )}

          {selectedPrayer.offerable && (
            <OfferablePrayer
              prayer={selectedPrayer}
              onPrayerStart={onOfferPrayer}
            />
          )}
        </article>

        <button
          type="button"
          className="chapel-secondary-button"
          onClick={() =>
            setSelectedPrayer(null)
          }
        >
          Voltar para outras orações
        </button>
      </section>
    );
  }

  return (
    <section className="prayer-chapel">
      <header className="prayer-chapel-header">
        <h2>Outras Orações</h2>

        <p className="prayer-chapel-intro">
          Escolha uma oração e reserve alguns instantes
          para rezar.
        </p>
      </header>

      <div className="devotion-categories">
        <button type="button" onClick={() => setCategory("rosary")}><strong>Terços</strong><span>Orações em sequência, mistérios e repetições.</span></button>
        <button type="button" onClick={() => setCategory("novena")}><strong>Novenas</strong><span>Orações organizadas por dia, para você escolher e ler.</span></button>
      </div>
      <button
        type="button"
        className="chapel-primary-button"
        onClick={() => setAddingPrayer(true)}
      >
        Adicionar nova oração
      </button>
      <p className="prayer-chapel-moderation-note">
        Novas orações só serão publicadas após aprovação da moderação.
      </p>

      <div className="prayer-chapel-divider" />

      <section className="prayer-chapel-requests">
        <h3>Orações disponíveis</h3>

        {loading && (
          <p className="prayer-chapel-empty">
            Carregando orações...
          </p>
        )}

        {error && (
          <p className="prayer-chapel-error">
            {error}
          </p>
        )}

        {!loading && prayers.filter(prayer => !prayer.devotion).length === 0 ? (
          <p className="prayer-chapel-empty">
            Ainda não há outras orações disponíveis.
          </p>
        ) : prayers.some(prayer => !prayer.devotion) ? (
          <div className="prayer-request-list">
            {prayers.filter(prayer => !prayer.devotion).map((prayer) => (
              <button
                key={prayer.id}
                type="button"
                className="prayer-library-card"
                onClick={() =>
                  setSelectedPrayer(prayer)
                }
              >
                <span
                  className="prayer-request-symbol"
                  aria-hidden="true"
                >
                  🙏
                </span>

                <div>
                  <strong>
                    {prayer.title}
                  </strong>

                  {prayer.subtitle && (
                    <p>
                      {prayer.subtitle}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
}
