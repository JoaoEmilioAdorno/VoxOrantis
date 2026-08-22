import { useState } from "react";

import {
  publishSuggestion,
  rejectSuggestion,
  reviewSuggestion,
  saveSuggestionRevision,
} from "../../services/prayerSuggestionModerationService";

export default function PrayerSuggestionModeration({
  suggestions,
  processingId,
  setProcessingId,
  reload,
  setError,
  formatDate,
}) {
  const [drafts, setDrafts] = useState({});

  const pending = suggestions.filter(
    (suggestion) => suggestion.status === "pending"
  );
  const reviewed = suggestions.filter(
    (suggestion) => suggestion.status === "reviewed"
  );

  function getDraft(suggestion) {
    return (
      drafts[suggestion.id] ?? {
        title:
          suggestion.revised_title ?? suggestion.title,
        text: suggestion.revised_text ?? suggestion.text,
      }
    );
  }

  function updateDraft(suggestion, field, value) {
    setDrafts((current) => ({
      ...current,
      [suggestion.id]: {
        ...getDraft(suggestion),
        ...current[suggestion.id],
        [field]: value,
      },
    }));
  }

  async function runAction(suggestionId, action, message) {
    setProcessingId(suggestionId);
    setError("");

    try {
      await action();
      await reload();
    } catch (error) {
      console.error(message, error);
      setError(message);
    } finally {
      setProcessingId(null);
    }
  }

  function renderPendingSuggestion(suggestion) {
    const draft = getDraft(suggestion);
    const busy = processingId === suggestion.id;

    return (
      <article
        key={suggestion.id}
        className="moderation-request"
      >
        <div className="moderation-request-meta">
          <span>Aguardando revisão</span>
          <time>{formatDate(suggestion.created_at)}</time>
        </div>

        <label className="moderation-editor-label">
          Título
          <input
            type="text"
            value={draft.title}
            maxLength={100}
            disabled={busy}
            onChange={(event) =>
              updateDraft(
                suggestion,
                "title",
                event.target.value
              )
            }
          />
        </label>

        <label className="moderation-editor-label">
          Texto
          <textarea
            value={draft.text}
            maxLength={5000}
            rows={10}
            disabled={busy}
            onChange={(event) =>
              updateDraft(
                suggestion,
                "text",
                event.target.value
              )
            }
          />
        </label>

        <div className="moderation-actions moderation-actions-wide">
          <button
            type="button"
            className="moderation-reject-button"
            disabled={busy}
            onClick={() =>
              runAction(
                suggestion.id,
                () => rejectSuggestion(suggestion.id),
                "Não foi possível rejeitar a sugestão."
              )
            }
          >
            Rejeitar
          </button>
          <button
            type="button"
            className="moderation-secondary-button"
            disabled={busy}
            onClick={() =>
              runAction(
                suggestion.id,
                () =>
                  saveSuggestionRevision(
                    suggestion.id,
                    draft.title,
                    draft.text
                  ),
                "Não foi possível salvar a revisão."
              )
            }
          >
            Salvar alterações
          </button>
          <button
            type="button"
            className="moderation-approve-button"
            disabled={busy}
            onClick={() =>
              runAction(
                suggestion.id,
                () =>
                  reviewSuggestion(
                    suggestion.id,
                    draft.title,
                    draft.text
                  ),
                "Não foi possível concluir a revisão."
              )
            }
          >
            {busy ? "Processando..." : "Marcar como revisada"}
          </button>
        </div>
      </article>
    );
  }

  function renderReviewedSuggestion(suggestion) {
    const busy = processingId === suggestion.id;

    return (
      <article
        key={suggestion.id}
        className="moderation-request"
      >
        <div className="moderation-request-meta">
          <span>Revisada</span>
          <time>{formatDate(suggestion.reviewed_at)}</time>
        </div>
        <h4 className="moderation-suggestion-title">
          {suggestion.revised_title}
        </h4>
        <p className="moderation-request-text">
          {suggestion.revised_text}
        </p>
        <div className="moderation-actions">
          <button
            type="button"
            className="moderation-reject-button"
            disabled={busy}
            onClick={() =>
              runAction(
                suggestion.id,
                () => rejectSuggestion(suggestion.id),
                "Não foi possível rejeitar a sugestão."
              )
            }
          >
            Rejeitar
          </button>
          <button
            type="button"
            className="moderation-approve-button"
            disabled={busy}
            onClick={() =>
              runAction(
                suggestion.id,
                () => publishSuggestion(suggestion.id),
                "Não foi possível publicar a oração."
              )
            }
          >
            {busy ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <section className="moderation-section">
      <div className="moderation-section-header">
        <h3>Sugestões de orações</h3>
        <span>{suggestions.length} em andamento</span>
      </div>

      <h4 className="moderation-subsection-title">
        Aguardando revisão ({pending.length})
      </h4>
      {pending.length > 0 ? (
        <div className="moderation-list">
          {pending.map(renderPendingSuggestion)}
        </div>
      ) : (
        <p className="moderation-empty-compact">
          Nenhuma sugestão aguardando revisão.
        </p>
      )}

      <h4 className="moderation-subsection-title">
        Aguardando publicação ({reviewed.length})
      </h4>
      {reviewed.length > 0 ? (
        <div className="moderation-list">
          {reviewed.map(renderReviewedSuggestion)}
        </div>
      ) : (
        <p className="moderation-empty-compact">
          Nenhuma oração revisada aguardando publicação.
        </p>
      )}
    </section>
  );
}
