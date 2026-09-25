import { attachDevotionAudio, decodeDevotion, DEVOTION_PREFIX } from "../../content/devotions";
import DevotionEditor from "../devotions/DevotionEditor";
import DevotionReader from "../devotions/DevotionReader";
import { useState } from "react";

import {
  deletePublishedSuggestion,
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const published = suggestions.filter(suggestion => suggestion.status === "published");
  const getDevotion = (suggestion, text) => {
    const devotion = decodeDevotion(text);
    return devotion ? attachDevotionAudio(devotion, suggestion.audio_urls) : null;
  };

  async function confirmDelete(suggestion) {
    await runAction(suggestion.id, async () => {
      const warning = await deletePublishedSuggestion(suggestion.id);
      setDeleteTarget(null);
      return warning;
    }, "Não foi possível excluir a oração. Tente novamente.");
  }

  function renderAudio(suggestion) {
    if (!suggestion.audio_path) return null;
    return (
      <div>
        <p>Ouça também o áudio antes de aprovar esta oração.</p>
        {suggestion.audio_url ? (
          <audio className="prayer-library-audio" controls preload="metadata"
            src={suggestion.audio_url} aria-label={`Áudio de ${suggestion.title}`} />
        ) : (
          <p className="moderation-error">Áudio indisponível. Atualize a página antes de aprovar.</p>
        )}
      </div>
    );
  }

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
        devotion: decodeDevotion(suggestion.revised_text ?? suggestion.text),
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
        ...(field === "devotion" ? { text: DEVOTION_PREFIX + JSON.stringify(value) } : {}),
      },
    }));
  }

  async function runAction(suggestionId, action, message) {
    setProcessingId(suggestionId);
    setError("");

    try {
      const warning = await action();
      await reload();
      if (warning) setError(warning);
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

        {draft.devotion ? <DevotionEditor value={draft.devotion} disabled={busy} onChange={value => updateDraft(suggestion, "devotion", value)} /> : <label className="moderation-editor-label">
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
        </label>}

        {renderAudio(suggestion)}
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
            disabled={busy || Boolean(suggestion.audio_path && !suggestion.audio_url)}
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
        {getDevotion(suggestion, suggestion.revised_text) ? <DevotionReader key={suggestion.id} title={suggestion.revised_title} devotion={getDevotion(suggestion, suggestion.revised_text)} /> : <p className="moderation-request-text">{suggestion.revised_text}</p>}
        {renderAudio(suggestion)}
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
            disabled={busy || Boolean(suggestion.audio_path && !suggestion.audio_url)}
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
        <span>{pending.length + reviewed.length} em andamento</span>
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
      <h4 className="moderation-subsection-title">Orações publicadas ({published.length})</h4>
      <p className="moderation-empty-compact">Orações enviadas pelo formulário e aprovadas para a biblioteca.</p>
      {published.length === 0 ? (
        <p className="moderation-empty-compact">Nenhuma oração enviada foi publicada ainda.</p>
      ) : (
        <div className="moderation-list">
          {published.map(suggestion => (
            <article key={suggestion.id} className="moderation-request">
              <div className="moderation-request-meta">
                <span>Publicada</span><time>{formatDate(suggestion.published_at)}</time>
              </div>
              <h4 className="moderation-suggestion-title">{suggestion.revised_title || suggestion.title}</h4>
              {getDevotion(suggestion, suggestion.revised_text || suggestion.text) ? <details><summary>Conferir roteiro publicado</summary><DevotionReader title={suggestion.revised_title || suggestion.title} devotion={getDevotion(suggestion, suggestion.revised_text || suggestion.text)} /></details> : <p className="moderation-request-text">{suggestion.revised_text || suggestion.text}</p>}
              {deleteTarget === suggestion.id ? (
                <div role="group" aria-label="Confirmar exclusão da oração">
                  <p>Excluir “{suggestion.revised_title || suggestion.title}” e seu áudio? A oração sairá da biblioteca e da seleção no globo. Esta ação não pode ser desfeita.</p>
                  <div className="moderation-actions">
                    <button type="button" className="moderation-secondary-button" disabled={processingId !== null} onClick={() => setDeleteTarget(null)}>Cancelar</button>
                    <button type="button" className="moderation-reject-button" disabled={processingId !== null} onClick={() => confirmDelete(suggestion)}>
                      {processingId === suggestion.id ? "Excluindo..." : "Confirmar exclusão"}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="moderation-reject-button" disabled={processingId !== null} onClick={() => setDeleteTarget(suggestion.id)}>Excluir oração</button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
