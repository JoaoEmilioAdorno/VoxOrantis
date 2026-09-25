import { supabase } from "../lib/supabase";

export async function canAccessModeration() {
  const { data, error } = await supabase.rpc("can_moderate");
  if (error) throw error;
  return data === true;
}
