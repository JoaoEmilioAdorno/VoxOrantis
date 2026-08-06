import { supabase } from "../lib/supabase";

export async function fetchStats() {
  const { data, error } = await supabase
    .from("stats")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    throw error;
  }

  return data;
}