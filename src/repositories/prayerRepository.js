import { supabase } from "../lib/supabase";

const DEVICE_ID_KEY = "vox_orantis_device_id";

function getAnonymousDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export async function getActivePrayers() {
  const { data, error } = await supabase
    .from("prayers")
    .select(
      "id, latitude, longitude, created_at, expires_at"
    )
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createPrayer({
  latitude,
  longitude,
  nickname,
}) {
  const deviceId = getAnonymousDeviceId();

  const { data, error } = await supabase.rpc(
    "create_prayer",
    {
      p_latitude: latitude,
      p_longitude: longitude,
      p_nickname: nickname,
      p_device_id: deviceId,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}