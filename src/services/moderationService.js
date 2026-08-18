import {
  getPendingPrayerRequests,
  approvePrayerRequest,
  rejectPrayerRequest,
} from "../repositories/moderationRepository";

export async function loadPendingPrayerRequests() {
  return getPendingPrayerRequests();
}

export async function approvePendingPrayerRequest(requestId) {
  if (!requestId) {
    throw new Error("Pedido de oração inválido.");
  }

  await approvePrayerRequest(requestId);
}

export async function rejectPendingPrayerRequest(requestId) {
  if (!requestId) {
    throw new Error("Pedido de oração inválido.");
  }

  await rejectPrayerRequest(requestId);
}