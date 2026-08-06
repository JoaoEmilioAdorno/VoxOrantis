import { supabase } from "../lib/supabase";
//  testes de git
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