import { useState } from "react";

import { getPrayers } from "../../content/prayers";
import OfferablePrayer from "./OfferablePrayer";

export default function PrayerLibrary({
  onOfferPrayer,
}) {
  const prayers = getPrayers();

  const [selectedPrayer, setSelectedPrayer] =
    useState(null);

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

        {prayers.length === 0 ? (
          <p className="prayer-chapel-empty">
            Ainda não há outras orações disponíveis.
          </p>
        ) : (
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
        )}
      </section>
    </section>
  );
}