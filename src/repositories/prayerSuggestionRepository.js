import { supabase } from "../lib/supabase";

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
}) {
  const { data, error } = await supabase.rpc(
    "submit_prayer_suggestion",
    {
      p_title: title,
      p_text: text,
      p_device_id: getAnonymousDeviceId(),
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getPublishedPrayers() {
  const { data, error } = await supabase
    .from("public_prayer_suggestions")
    .select("id, title, text, published_at")
    .order("title", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
