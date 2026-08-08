import { supabase } from "../lib/supabase";

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
  const { data, error } = await supabase.rpc(
    "create_prayer",
    {
      p_latitude: latitude,
      p_longitude: longitude,
      p_nickname: nickname,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}