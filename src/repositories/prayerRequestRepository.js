// src/repositories/prayerRequestRepository.js

import { supabase } from "../lib/supabase";

export async function createPrayerRequest({
  nickname,
  requestText,
}) {
  const cleanNickname = nickname.trim();
  const cleanRequestText = requestText.trim();

  const { error } = await supabase
    .from("prayer_requests")
    .insert({
      nickname: cleanNickname || null,
      request_text: cleanRequestText,
    });

  if (error) {
    throw error;
  }
}

export async function getApprovedPrayerRequests() {
  const { data, error } = await supabase
    .from("prayer_requests")
    .select(
      "id, nickname, request_text, created_at"
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