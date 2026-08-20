const AVE_MARIA_CRAWL = [
  "Ave Maria, cheia de graça, o Senhor é convosco.",
  "Bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus.",
  "Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte.",
];

export default function PrayerCrawl({
  active,
  runId,
  lines = AVE_MARIA_CRAWL,
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
        {lines.map((line, index) => (
          <p key={`${runId}-${index}`}>
            {line}
          </p>
        ))}

        <p className="prayer-crawl-amen">
          Amém.
        </p>
      </div>
    </div>
  );
}