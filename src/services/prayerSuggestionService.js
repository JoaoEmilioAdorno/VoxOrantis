import { attachDevotionAudio, decodeDevotion, DEVOTION_PREFIX } from "../content/devotions";
import {
  createPrayerSuggestion,
  getPublishedPrayers,
} from "../repositories/prayerSuggestionRepository";
import { validatePrayerAudio } from "./prayerAudio";

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
  audioFile = null,
  ephemeralDevice = false,
  devotionAudioFiles = [],
}) {
  validatePrayerAudio(audioFile);
  devotionAudioFiles.forEach(item => validatePrayerAudio(item.file));
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

  if (cleanText.startsWith(DEVOTION_PREFIX) && !decodeDevotion(cleanText)) throw new Error("O roteiro está inválido. Confira as etapas e repetições.");

  return createPrayerSuggestion({
    title: cleanTitle,
    text: cleanText,
    audioFile,
    ephemeralDevice,
    devotionAudioFiles,
  });
}

export async function loadPublishedPrayers({ includeDevotions = false } = {}) {
  const prayers = await getPublishedPrayers();
  return prayers.flatMap(prayer => {
    const devotion = decodeDevotion(prayer.text);
    if (prayer.text.startsWith(DEVOTION_PREFIX) && !devotion) return [];
    if (devotion && !includeDevotions) return [];
    return [{
      id: `community:${prayer.id}`, title: prayer.title, text: devotion ? "" : prayer.text,
      crawl: devotion ? [] : normalizeCrawl(prayer.text),
      audio: prayer.audio_url ?? null, offerable: true,
      source: "community", publishedAt: prayer.published_at, devotion: devotion ? attachDevotionAudio(devotion, prayer.audio_urls) : null,
    }];
  });
}
