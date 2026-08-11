export default function PrayerCrawl({
  active,
  runId,
}) {
  if (!active) {
    return null;
  }

  return (
    <div
      key={runId}
      className="prayer-crawl-scene"
      aria-hidden="true"
    >
      <div className="prayer-crawl">
        <p>
          Ave Maria, cheia de graça,
          o Senhor é convosco.
        </p>

        <p>
          Bendita sois vós entre as mulheres,
          e bendito é o fruto do vosso ventre,
          Jesus.
        </p>

        <p>
          Santa Maria, Mãe de Deus,
          rogai por nós, pecadores,
          agora e na hora da nossa morte.
        </p>

        <p className="prayer-crawl-amen">
          Amém.
        </p>
      </div>
    </div>
  );
}