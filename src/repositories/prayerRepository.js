import { supabase } from "../lib/supabase";

export async function fetchActivePrayers() {
  const { data, error } = await supabase
    .from("prayers")
    .select("*")
    .gt("expires_at", new Date().toISOString());

  if (error) {
    throw error;
  }

  return data;
}

export async function createPrayer({
  latitude,
  longitude,
  nickname,
}) {
  const { data, error } = await supabase.rpc("create_prayer", {
    p_latitude: latitude,
    p_longitude: longitude,
    p_nickname: nickname,
  });

  if (error) {
    throw error;
  }

  return data;
}