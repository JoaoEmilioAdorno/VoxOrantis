import { decodeDevotion, DEVOTION_PREFIX } from "../content/devotions";
import {
  deletePublishedPrayer,
  getModerationPrayerSuggestions,
  markPrayerSuggestionReviewed,
  publishPrayerSuggestion,
  rejectPrayerSuggestion,
  savePrayerSuggestionRevision,
} from "../repositories/prayerSuggestionModerationRepository";
import { PRAYER_SUGGESTION_LIMITS } from "./prayerSuggestionService";

export async function loadPrayerSuggestionsForModeration() {
  return getModerationPrayerSuggestions();
}

function validateSuggestion(title, text) {
  const cleanTitle = title.trim();
  const cleanText = text.trim();

  if (!cleanTitle || !cleanText) {
    throw new Error("Título e texto são obrigatórios.");
  }

  if (
    cleanTitle.length > PRAYER_SUGGESTION_LIMITS.TITLE ||
    cleanText.length > PRAYER_SUGGESTION_LIMITS.TEXT
  ) {
    throw new Error("A versão revisada excede os limites permitidos.");
  }

  if (cleanText.startsWith(DEVOTION_PREFIX) && !decodeDevotion(cleanText)) throw new Error("O roteiro está inválido. Confira as etapas e repetições.");
  return { title: cleanTitle, text: cleanText };
}

export async function saveSuggestionRevision(
  suggestionId,
  title,
  text
) {
  const clean = validateSuggestion(title, text);
  await savePrayerSuggestionRevision(
    suggestionId,
    clean.title,
    clean.text
  );
}

export async function reviewSuggestion(
  suggestionId,
  title,
  text
) {
  await saveSuggestionRevision(suggestionId, title, text);
  await markPrayerSuggestionReviewed(suggestionId);
}

export async function publishSuggestion(suggestionId) {
  await publishPrayerSuggestion(suggestionId);
}

export async function rejectSuggestion(suggestionId) {
  await rejectPrayerSuggestion(suggestionId);
}

export function deletePublishedSuggestion(suggestionId) {
  return deletePublishedPrayer(suggestionId);
}
