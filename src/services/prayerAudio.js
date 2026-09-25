import { supabase } from "../lib/supabase";

export const PRAYER_AUDIO_BUCKET = "prayer-audio";
export const MAX_PRAYER_AUDIO_BYTES = 20 * 1024 * 1024;
const AUDIO_TYPES = {
  mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4",
  wav: "audio/wav", ogg: "audio/ogg", webm: "audio/webm", aac: "audio/aac",
};
export const PRAYER_AUDIO_ACCEPT = Object.keys(AUDIO_TYPES).map(ext => `.${ext}`).join(",");

export function validatePrayerAudio(file) {
  if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  if (!AUDIO_TYPES[extension]) {
    throw new Error("Use um áudio MP3, M4A, WAV, OGG, WebM ou AAC.");
  }
  if (!file.size || file.size > MAX_PRAYER_AUDIO_BYTES) {
    throw new Error("O áudio deve ter conteúdo e no máximo 20 MB.");
  }
}

export async function uploadPrayerAudio(file, deviceId) {
  validatePrayerAudio(file);
  const extension = file.name.split(".").pop().toLowerCase();
  const path = `${deviceId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(PRAYER_AUDIO_BUCKET).upload(path, file, {
    contentType: AUDIO_TYPES[extension], upsert: false,
  });
  if (error) throw new Error("Não foi possível enviar o áudio. Tente novamente.");
  return path;
}

export async function withPrayerAudioUrls(prayers) {
  const paths = [...new Set(prayers.flatMap(prayer => [prayer.audio_path, ...(prayer.devotion_audio_paths || [])]).filter(Boolean))];
  if (!paths.length) return prayers;
  const { data, error } = await supabase.storage.from(PRAYER_AUDIO_BUCKET)
    .createSignedUrls(paths, 24 * 60 * 60);
  if (error) throw error;
  const urls = new Map(data.map(item => [item.path, item.signedUrl]));
  return prayers.map(prayer => ({ ...prayer, audio_url: urls.get(prayer.audio_path) || null, audio_urls: Object.fromEntries((prayer.devotion_audio_paths || []).map(path => [path, urls.get(path) || null])) }));
}
