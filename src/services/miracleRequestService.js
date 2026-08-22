// src/services/miracleRequestService.js

import {
  createMiracleRequest,
  getApprovedMiracleRequests,
} from "../repositories/miracleRequestRepository";

export async function submitMiracleRequest({
  nickname,
  testimonyText,
}) {
  const cleanNickname = nickname.trim();
  const cleanTestimonyText = testimonyText.trim();

  if (!cleanTestimonyText) {
    throw new Error(
      "Escreva seu testemunho."
    );
  }

  if (cleanNickname.length > 40) {
    throw new Error(
      "O apelido deve ter no máximo 40 caracteres."
    );
  }

  if (cleanTestimonyText.length > 1000) {
    throw new Error(
      "O testemunho deve ter no máximo 1000 caracteres."
    );
  }

  await createMiracleRequest({
    nickname: cleanNickname,
    testimonyText: cleanTestimonyText,
  });
}

export async function loadApprovedMiracleRequests() {
  const requests =
    await getApprovedMiracleRequests();

  return requests.map((request) => ({
    id: request.id,
    nickname:
      request.nickname?.trim() || "Anônimo",
    text: request.testimony_text,
    createdAt: request.created_at,
  }));
}