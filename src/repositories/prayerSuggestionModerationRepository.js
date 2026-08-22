import { supabase } from "../lib/supabase";

export async function getModerationPrayerSuggestions() {
  const { data, error } = await supabase
    .from("prayer_suggestions")
    .select(
      "id, title, text, revised_title, revised_text, status, created_at, reviewed_at"
    )
    .in("status", ["pending", "reviewed"])
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function callModerationRpc(name, parameters) {
  const { error } = await supabase.rpc(name, parameters);

  if (error) {
    throw error;
  }
}

export function savePrayerSuggestionRevision(
  suggestionId,
  title,
  text
) {
  return callModerationRpc(
    "save_prayer_suggestion_revision",
    {
      p_suggestion_id: suggestionId,
      p_title: title,
      p_text: text,
    }
  );
}

export function markPrayerSuggestionReviewed(
  suggestionId
) {
  return callModerationRpc(
    "mark_prayer_suggestion_reviewed",
    { p_suggestion_id: suggestionId }
  );
}

export function publishPrayerSuggestion(suggestionId) {
  return callModerationRpc(
    "publish_prayer_suggestion",
    { p_suggestion_id: suggestionId }
  );
}

export function rejectPrayerSuggestion(suggestionId) {
  return callModerationRpc(
    "reject_prayer_suggestion",
    { p_suggestion_id: suggestionId }
  );
}
