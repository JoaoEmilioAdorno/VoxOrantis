// src/repositories/miracleRequestRepository.js

import { supabase } from "../lib/supabase";

export async function createMiracleRequest({
  nickname,
  testimonyText,
}) {
  const cleanNickname = nickname.trim();
  const cleanTestimonyText = testimonyText.trim();

  const { error } = await supabase
    .from("miracle_requests")
    .insert({
      nickname: cleanNickname || null,
      testimony_text: cleanTestimonyText,
    });

  if (error) {
    throw error;
  }
}

export async function getApprovedMiracleRequests() {
  const { data, error } = await supabase
    .from("miracle_requests")
    .select(
      "id, nickname, testimony_text, created_at"
    )
    .eq("status", "approved")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}