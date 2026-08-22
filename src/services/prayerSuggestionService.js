import {
  createPrayerSuggestion,
  getPublishedPrayers,
} from "../repositories/prayerSuggestionRepository";

export const PRAYER_SUGGESTION_LIMITS = {
  TITLE: 100,
  TEXT: 5000,
};

function normalizeCrawl(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function submitPrayerSuggestion({
  title,
  text,
}) {
  const cleanTitle = title.trim();
  const cleanText = text.trim();

  if (!cleanTitle) {
    throw new Error("Informe o título da oração.");
  }

  if (!cleanText) {
    throw new Error("Escreva o texto da oração.");
  }

  if (
    cleanTitle.length >
    PRAYER_SUGGESTION_LIMITS.TITLE
  ) {
    throw new Error(
      "O título deve ter no máximo 100 caracteres."
    );
  }

  if (
    cleanText.length >
    PRAYER_SUGGESTION_LIMITS.TEXT
  ) {
    throw new Error(
      "A oração deve ter no máximo 5.000 caracteres."
    );
  }

  return createPrayerSuggestion({
    title: cleanTitle,
    text: cleanText,
  });
}

export async function loadPublishedPrayers() {
  const prayers = await getPublishedPrayers();

  return prayers.map((prayer) => ({
    id: `community:${prayer.id}`,
    title: prayer.title,
    text: prayer.text,
    crawl: normalizeCrawl(prayer.text),
    audio: null,
    offerable: true,
    source: "community",
    publishedAt: prayer.published_at,
  }));
}
