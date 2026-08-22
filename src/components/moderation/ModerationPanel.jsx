import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  loadPendingPrayerRequests,
  approvePendingPrayerRequest,
  rejectPendingPrayerRequest,
  loadPendingMiracleRequests,
  approvePendingMiracleRequest,
  rejectPendingMiracleRequest,
} from "../../services/moderationService";
import { loadPrayerSuggestionsForModeration } from "../../services/prayerSuggestionModerationService";
import PrayerSuggestionModeration from "./PrayerSuggestionModeration";

export default function ModerationPanel() {
  const [activeTab, setActiveTab] =
    useState("prayers");

  const [prayerRequests, setPrayerRequests] =
    useState([]);

  const [miracleRequests, setMiracleRequests] =
    useState([]);

  const [prayerSuggestions, setPrayerSuggestions] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setError("");

    try {
      const [prayerData, miracleData, suggestionData] =
        await Promise.all([
          loadPendingPrayerRequests(),
          loadPendingMiracleRequests(),
          loadPrayerSuggestionsForModeration(),
        ]);

      setPrayerRequests(prayerData);
      setMiracleRequests(miracleData);
      setPrayerSuggestions(suggestionData);
    } catch (err) {
      console.error(
        "Erro ao carregar itens para moderação:",
        err
      );

      setError(
        "Não foi possível carregar os itens para moderação."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleApprovePrayer(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await approvePendingPrayerRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao aprovar pedido de oração:",
        err
      );

      setError(
        "Não foi possível aprovar o pedido de oração."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectPrayer(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await rejectPendingPrayerRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao rejeitar pedido de oração:",
        err
      );

      setError(
        "Não foi possível rejeitar o pedido de oração."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleApproveMiracle(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await approvePendingMiracleRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao aprovar testemunho:",
        err
      );

      setError(
        "Não foi possível aprovar o testemunho."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejectMiracle(requestId) {
    setProcessingId(requestId);
    setError("");

    try {
      await rejectPendingMiracleRequest(requestId);
      await loadRequests();
    } catch (err) {
      console.error(
        "Erro ao rejeitar testemunho:",
        err
      );

      setError(
        "Não foi possível rejeitar o testemunho."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function formatDate(createdAt) {
    if (!createdAt) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(createdAt));
  }

  if (loading) {
    return (
      <div className="moderation-panel">
        <div className="moderation-loading">
          <p>Carregando moderação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moderation-panel">
      <header className="moderation-header">
        <div>
          <h2>Moderação</h2>

          <p>
            Revise os conteúdos enviados antes
            da publicação.
          </p>
        </div>

        <div className="moderation-total">
          <strong>
            {prayerRequests.length +
              miracleRequests.length +
              prayerSuggestions.length}
          </strong>

          <span>pendentes</span>
        </div>
      </header>

      {error && (
        <p className="moderation-error">
          {error}
        </p>
      )}

      <div
        className="moderation-tabs"
        role="tablist"
        aria-label="Tipos de conteúdo"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "prayers"
          }
          className={
            activeTab === "prayers"
              ? "moderation-tab active"
              : "moderation-tab"
          }
          onClick={() =>
            setActiveTab("prayers")
          }
        >
          <span>Pedidos de oração</span>

          <strong>
            {prayerRequests.length}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "miracles"
          }
          className={
            activeTab === "miracles"
              ? "moderation-tab active"
              : "moderation-tab"
          }
          onClick={() =>
            setActiveTab("miracles")
          }
        >
          <span>Testemunhos</span>

          <strong>
            {miracleRequests.length}
          </strong>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "suggestions"
          }
          className={
            activeTab === "suggestions"
              ? "moderation-tab active"
              : "moderation-tab"
          }
          onClick={() =>
            setActiveTab("suggestions")
          }
        >
          <span>Sugestões de orações</span>

          <strong>
            {prayerSuggestions.length}
          </strong>
        </button>
      </div>

      {activeTab === "prayers" && (
        <section className="moderation-section">
          <div className="moderation-section-header">
            <h3>Pedidos de oração</h3>

            <span>
              {prayerRequests.length} aguardando
            </span>
          </div>

          {prayerRequests.length === 0 ? (
            <div className="moderation-empty">
              <div
                className="moderation-empty-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h4>Nenhum pedido pendente</h4>

              <p>
                Todos os pedidos de oração foram
                revisados.
              </p>
            </div>
          ) : (
            <div className="moderation-list">
              {prayerRequests.map((request) => (
                <article
                  key={request.id}
                  className="moderation-request"
                >
                  <div className="moderation-request-meta">
                    <span>
                      Pedido de oração
                    </span>

                    <time>
                      {formatDate(
                        request.created_at
                      )}
                    </time>
                  </div>

                  <p className="moderation-request-text">
                    {request.request_text}
                  </p>

                  <p className="moderation-request-nickname">
                    —{" "}
                    {request.nickname?.trim() ||
                      "Anônimo"}
                  </p>

                  <div className="moderation-actions">
                    <button
                      type="button"
                      className="moderation-reject-button"
                      onClick={() =>
                        handleRejectPrayer(
                          request.id
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                    >
                      {processingId === request.id
                        ? "Processando..."
                        : "Rejeitar"}
                    </button>

                    <button
                      type="button"
                      className="moderation-approve-button"
                      onClick={() =>
                        handleApprovePrayer(
                          request.id
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                    >
                      {processingId === request.id
                        ? "Processando..."
                        : "Aprovar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "miracles" && (
        <section className="moderation-section">
          <div className="moderation-section-header">
            <h3>Testemunhos de graças</h3>

            <span>
              {miracleRequests.length} aguardando
            </span>
          </div>

          {miracleRequests.length === 0 ? (
            <div className="moderation-empty">
              <div
                className="moderation-empty-icon"
                aria-hidden="true"
              >
                ✓
              </div>

              <h4>Nenhum testemunho pendente</h4>

              <p>
                Todos os testemunhos foram
                revisados.
              </p>
            </div>
          ) : (
            <div className="moderation-list">
              {miracleRequests.map((request) => (
                <article
                  key={request.id}
                  className="moderation-request"
                >
                  <div className="moderation-request-meta">
                    <span>
                      Testemunho
                    </span>

                    <time>
                      {formatDate(
                        request.created_at
                      )}
                    </time>
                  </div>

                  <p className="moderation-request-text">
                    {request.testimony_text}
                  </p>

                  <p className="moderation-request-nickname">
                    —{" "}
                    {request.nickname?.trim() ||
                      "Anônimo"}
                  </p>

                  <div className="moderation-actions">
                    <button
                      type="button"
                      className="moderation-reject-button"
                      onClick={() =>
                        handleRejectMiracle(
                          request.id
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                    >
                      {processingId === request.id
                        ? "Processando..."
                        : "Rejeitar"}
                    </button>

                    <button
                      type="button"
                      className="moderation-approve-button"
                      onClick={() =>
                        handleApproveMiracle(
                          request.id
                        )
                      }
                      disabled={
                        processingId ===
                        request.id
                      }
                    >
                      {processingId === request.id
                        ? "Processando..."
                        : "Aprovar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "suggestions" && (
        <PrayerSuggestionModeration
          suggestions={prayerSuggestions}
          processingId={processingId}
          setProcessingId={setProcessingId}
          reload={loadRequests}
          setError={setError}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}
