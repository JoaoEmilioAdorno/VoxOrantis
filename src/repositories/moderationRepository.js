import { supabase } from "../lib/supabase";

/*
 * =====================================================
 * PEDIDOS DE ORAÇÃO
 * =====================================================
 */

export async function getPendingPrayerRequests() {
  const { data, error } = await supabase
    .from("prayer_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function approvePrayerRequest(requestId) {
  const { error } = await supabase.rpc(
    "approve_prayer_request",
    {
      request_id: requestId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function rejectPrayerRequest(requestId) {
  const { error } = await supabase.rpc(
    "reject_prayer_request",
    {
      request_id: requestId,
    }
  );

  if (error) {
    throw error;
  }
}

/*
 * =====================================================
 * TESTEMUNHOS / MILAGRES
 * =====================================================
 */

export async function getPendingMiracleRequests() {
  const { data, error } = await supabase
    .from("miracle_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function approveMiracleRequest(requestId) {
  const { error } = await supabase.rpc(
    "approve_miracle_request",
    {
      request_id: requestId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function rejectMiracleRequest(requestId) {
  const { error } = await supabase.rpc(
    "reject_miracle_request",
    {
      request_id: requestId,
    }
  );

  if (error) {
    throw error;
  }
}