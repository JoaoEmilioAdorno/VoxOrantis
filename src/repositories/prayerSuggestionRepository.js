import { supabase } from "../lib/supabase";
import { PRAYER_AUDIO_BUCKET, uploadPrayerAudio, withPrayerAudioUrls } from "../services/prayerAudio";

let ephemeralDeviceId;

const DEVICE_ID_KEY =
  "vox_orantis_device_id";

function getAnonymousDeviceId() {
  let deviceId = localStorage.getItem(
    DEVICE_ID_KEY
  );

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(
      DEVICE_ID_KEY,
      deviceId
    );
  }

  return deviceId;
}

export async function createPrayerSuggestion({
  title,
  text,
  audioFile = null,
  ephemeralDevice = false,
  devotionAudioFiles = [],
}) {
  const deviceId = ephemeralDevice ? (ephemeralDeviceId ??= crypto.randomUUID()) : getAnonymousDeviceId();
  const audioPath = audioFile ? await uploadPrayerAudio(audioFile, deviceId) : null;
  const uploadedSteps = [];
  let submittedText = text;
  try {
    for (const item of devotionAudioFiles) uploadedSteps.push({ ...item, path: await uploadPrayerAudio(item.file, deviceId) });
    if (uploadedSteps.length) {
      const newline = text.indexOf("\n");
      const devotion = JSON.parse(text.slice(newline + 1));
      for (const item of uploadedSteps) devotion.sections[item.sectionIndex].prayers[item.stepIndex].audioPath = item.path;
      submittedText = text.slice(0, newline + 1) + JSON.stringify(devotion);
    }
  const parameters = {
    p_title: title,
    p_text: submittedText,
    p_device_id: deviceId,
    p_audio_path: audioPath,
    ...(uploadedSteps.length ? { p_devotion_audio_paths: uploadedSteps.map(item => item.path) } : {}),
  };
  const { data, error } = await supabase.rpc(
    "submit_prayer_suggestion_with_audio",
    parameters
  );

  if (error) {
    if (audioPath) {
      // Only unlinked uploads can be deleted; a committed submission is protected.
      await supabase.storage.from(PRAYER_AUDIO_BUCKET).remove([audioPath, ...uploadedSteps.map(item => item.path)].filter(Boolean));
    }
    throw error;
  }

  return data;
  } catch (error) {
    const paths = [audioPath, ...uploadedSteps.map(item => item.path)].filter(Boolean);
    if (paths.length) await supabase.storage.from(PRAYER_AUDIO_BUCKET).remove(paths);
    throw error;
  }
}

export async function getPublishedPrayers() {
  let { data, error } = await supabase
    .from("public_prayer_suggestions")
    .select("id, title, text, published_at, audio_path, devotion_audio_paths")
    .order("title", { ascending: true });

  if (error?.code === "42703" || error?.code === "PGRST204") {
    ({ data, error } = await supabase
      .from("public_prayer_suggestions")
      .select("id, title, text, published_at, audio_path")
      .order("title", { ascending: true }));
  }

  if (error) {
    throw error;
  }

  return withPrayerAudioUrls(data ?? []);
}
