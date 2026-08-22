import {
  getPendingPrayerRequests,
  approvePrayerRequest,
  rejectPrayerRequest,
  getPendingMiracleRequests,
  approveMiracleRequest,
  rejectMiracleRequest,
} from "../repositories/moderationRepository";

/*
 * =====================================================
 * PEDIDOS DE ORAÇÃO
 * =====================================================
 */

export async function loadPendingPrayerRequests() {
  return getPendingPrayerRequests();
}

export async function approvePendingPrayerRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Pedido de oração inválido.");
  }

  await approvePrayerRequest(requestId);
}

export async function rejectPendingPrayerRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Pedido de oração inválido.");
  }

  await rejectPrayerRequest(requestId);
}

/*
 * =====================================================
 * TESTEMUNHOS / MILAGRES
 * =====================================================
 */

export async function loadPendingMiracleRequests() {
  return getPendingMiracleRequests();
}

export async function approvePendingMiracleRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Testemunho inválido.");
  }

  await approveMiracleRequest(requestId);
}

export async function rejectPendingMiracleRequest(
  requestId
) {
  if (!requestId) {
    throw new Error("Testemunho inválido.");
  }

  await rejectMiracleRequest(requestId);
}