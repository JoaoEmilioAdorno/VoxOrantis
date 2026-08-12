// src/services/prayerRequestService.js

import {
  createPrayerRequest,
  getApprovedPrayerRequests,
} from "../repositories/prayerRequestRepository";

export async function submitPrayerRequest({
  nickname,
  requestText,
}) {
  const cleanNickname = nickname.trim();
  const cleanRequestText = requestText.trim();

  if (!cleanRequestText) {
    throw new Error(
      "Escreva seu pedido de oração."
    );
  }

  if (cleanNickname.length > 40) {
    throw new Error(
      "O apelido deve ter no máximo 40 caracteres."
    );
  }

  if (cleanRequestText.length > 500) {
    throw new Error(
      "O pedido deve ter no máximo 500 caracteres."
    );
  }

  await createPrayerRequest({
    nickname: cleanNickname,
    requestText: cleanRequestText,
  });
}

export async function loadApprovedPrayerRequests() {
  const requests =
    await getApprovedPrayerRequests();

  return requests.map((request) => ({
    id: request.id,
    nickname:
      request.nickname?.trim() || "Anônimo",
    text: request.request_text,
    createdAt: request.created_at,
  }));
}