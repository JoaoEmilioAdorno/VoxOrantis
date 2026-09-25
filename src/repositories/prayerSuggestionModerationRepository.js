import { supabase } from "../lib/supabase";
import { PRAYER_AUDIO_BUCKET, withPrayerAudioUrls } from "../services/prayerAudio";

export async function getModerationPrayerSuggestions() {
  let { data, error } = await supabase
    .from("prayer_suggestions")
    .select(
      "id, title, text, revised_title, revised_text, status, created_at, reviewed_at, published_at, audio_path, devotion_audio_paths"
    )
    .in("status", ["pending", "reviewed", "published"])
    .order("created_at", { ascending: true });

  if (error?.code === "42703" || error?.code === "PGRST204") {
    ({ data, error } = await supabase
      .from("prayer_suggestions")
      .select("id, title, text, revised_title, revised_text, status, created_at, reviewed_at, published_at, audio_path")
      .in("status", ["pending", "reviewed", "published"])
      .order("created_at", { ascending: true }));
  }

  if (error) {
    throw error;
  }

  return withPrayerAudioUrls(data ?? []);
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

export async function deletePublishedPrayer(suggestionId) {
  const { data: audioPath, error } = await supabase.rpc("delete_published_prayer", {
    p_suggestion_id: suggestionId,
  });
  if (error) throw error;
  if (audioPath) {
    try {
      const { data, error: storageError } = await supabase.storage
        .from(PRAYER_AUDIO_BUCKET).remove([audioPath]);
      if (storageError || !data?.length) throw storageError || new Error("Áudio não removido");
    } catch {
      return "A oração foi excluída. O arquivo de áudio ficou privado, mas sua remoção do armazenamento não foi concluída.";
    }
  }
  return "";
}
