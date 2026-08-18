import { useCallback, useEffect, useState } from "react";

import {
  loadPendingPrayerRequests,
  approvePendingPrayerRequest,
  rejectPendingPrayerRequest,
} from "../../services/moderationService";

export default function ModerationPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setError("");

    try {
      const data = await loadPendingPrayerRequests();
      setRequests(data);
    } catch (err) {
      console.error(
        "Erro ao carregar pedidos para moderação:",
        err
      );

      setError(
        "Não foi possível carregar os pedidos de oração."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleApprove(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await approvePendingPrayerRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao aprovar pedido:",
        err
      );

      setError(
        "Não foi possível aprovar o pedido."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await rejectPendingPrayerRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao rejeitar pedido:",
        err
      );

      setError(
        "Não foi possível rejeitar o pedido."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="moderation-panel">
        <p>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="moderation-panel">
      <h2>Pedidos aguardando moderação</h2>

      {error && (
        <p className="moderation-error">
          {error}
        </p>
      )}

      {requests.length === 0 ? (
        <p>
          Não existem pedidos aguardando moderação.
        </p>
      ) : (
        <div className="moderation-list">
          {requests.map((request) => (
            <article
              key={request.id}
              className="moderation-request"
            >
              <p className="moderation-request-text">
                {request.request_text}
              </p>

              {request.nickname && (
                <p className="moderation-request-nickname">
                  — {request.nickname}
                </p>
              )}

              <div className="moderation-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleApprove(request.id)
                  }
                  disabled={
                    processingId === request.id
                  }
                >
                  {processingId === request.id
                    ? "Processando..."
                    : "Aprovar"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleReject(request.id)
                  }
                  disabled={
                    processingId === request.id
                  }
                >
                  {processingId === request.id
                    ? "Processando..."
                    : "Rejeitar"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}