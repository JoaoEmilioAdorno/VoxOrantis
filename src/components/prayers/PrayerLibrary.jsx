import { useEffect, useMemo, useState } from "react";

import { getPrayers as getStaticPrayers } from "../../content/prayers";
import { loadPublishedPrayers } from "../../services/prayerSuggestionService";
import OfferablePrayer from "./OfferablePrayer";

export default function PrayerLibrary({
  onOfferPrayer,
}) {
  const [publishedPrayers, setPublishedPrayers] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const communityPrayers =
          await loadPublishedPrayers();

        if (active) {
          setPublishedPrayers(communityPrayers);
        }
      } catch (loadError) {
        console.error(
          "Erro ao carregar orações publicadas:",
          loadError
        );

        if (active) {
          setError(
            "As orações da comunidade não puderam ser carregadas."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrayers();

    return () => {
      active = false;
    };
  }, []);

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

        {!loading && prayers.length === 0 ? (
          <p className="prayer-chapel-empty">
            Ainda não há outras orações disponíveis.
          </p>
        ) : prayers.length > 0 ? (
          <div className="prayer-request-list">
            {prayers.map((prayer) => (
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
