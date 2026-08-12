import { useEffect, useState } from "react";

import {
  loadApprovedPrayerRequests,
  submitPrayerRequest,
} from "../../services/prayerRequestService";

export default function PrayerChapel() {
  const [formOpen, setFormOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [requestText, setRequestText] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [prayerRequests, setPrayerRequests] =
    useState([]);

  const [requestsLoading, setRequestsLoading] =
    useState(true);

  const [requestsError, setRequestsError] =
    useState(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        setRequestsLoading(true);
        setRequestsError(null);

        const requests =
          await loadApprovedPrayerRequests();

        setPrayerRequests(requests);
      } catch (error) {
        console.error(
          "Erro ao carregar pedidos de oração:",
          error
        );

        setRequestsError(
          "Não foi possível carregar as intenções de oração."
        );
      } finally {
        setRequestsLoading(false);
      }
    }

    loadRequests();
  }, []);

  function handleOpenForm() {
    setSubmitted(false);
    setSubmitError(null);
    setFormOpen(true);
  }

  function handleBackToChapel() {
    setFormOpen(false);
    setSubmitted(false);
    setSubmitError(null);
    setNickname("");
    setRequestText("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!requestText.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      await submitPrayerRequest({
        nickname,
        requestText,
      });

      setSubmitted(true);
      setNickname("");
      setRequestText("");
    } catch (error) {
      console.error(
        "Erro ao enviar pedido de oração:",
        error
      );

      setSubmitError(
        "Não foi possível enviar seu pedido. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /*
   * =====================================================
   * FORMULÁRIO / CONFIRMAÇÃO
   * =====================================================
   */

  if (formOpen) {
    return (
      <section className="prayer-chapel">

        <header className="prayer-chapel-header">
          <h2>Capela de Orações</h2>
        </header>

        {!submitted ? (
          <div className="prayer-request-form-wrapper">

            <form
              className="prayer-request-form"
              onSubmit={handleSubmit}
            >
              <h3>Deixe sua intenção</h3>

              <p className="prayer-request-form-intro">
                Escreva sua intenção de oração.
                O apelido é opcional.
              </p>

              <label
                className="prayer-request-label"
                htmlFor="prayer-request-nickname"
              >
                Apelido
              </label>

              <input
                id="prayer-request-nickname"
                type="text"
                value={nickname}
                onChange={(event) =>
                  setNickname(event.target.value)
                }
                maxLength={40}
                placeholder="Opcional"
              />

              <label
                className="prayer-request-label"
                htmlFor="prayer-request-text"
              >
                Pedido de oração
              </label>

              <textarea
                id="prayer-request-text"
                value={requestText}
                onChange={(event) =>
                  setRequestText(event.target.value)
                }
                maxLength={500}
                rows={7}
                placeholder="Escreva aqui sua intenção..."
                required
              />

              <p className="prayer-request-counter">
                {requestText.length}/500
              </p>

              <p className="prayer-request-privacy">
                Não informe telefone, endereço,
                e-mail ou outros dados pessoais.
              </p>

              {submitError && (
                <p className="prayer-request-submit-error">
                  {submitError}
                </p>
              )}

              <div className="prayer-request-form-actions">

                <button
                  type="button"
                  className="chapel-cancel-button"
                  onClick={handleBackToChapel}
                  disabled={submitting}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="chapel-primary-button"
                  disabled={
                    !requestText.trim() ||
                    submitting
                  }
                >
                  {submitting
                    ? "Enviando..."
                    : "Enviar pedido"}
                </button>

              </div>

            </form>

          </div>
        ) : (
          <div className="prayer-request-form-wrapper">

            <div className="prayer-request-confirmation">

              <div
                className="prayer-request-confirmation-icon"
                aria-hidden="true"
              >
                🙏
              </div>

              <h3>Seu pedido foi recebido.</h3>

              <p>
                Ele será encaminhado para moderação
                antes de ser publicado na Capela de Orações.
              </p>

              <button
                type="button"
                className="chapel-secondary-button"
                onClick={handleBackToChapel}
              >
                Voltar para a Capela
              </button>

            </div>

          </div>
        )}

      </section>
    );
  }

  /*
   * =====================================================
   * CAPELA
   * =====================================================
   */

  return (
    <section className="prayer-chapel">

      <header className="prayer-chapel-header">

        <h2>Capela de Orações</h2>

        <blockquote className="prayer-chapel-verse">
          “Orai uns pelos outros.”
          <span>Tiago 5,16</span>
        </blockquote>

        <p className="prayer-chapel-intro">
          Um espaço para confiar suas intenções à oração
          da comunidade Vox Orantis.
        </p>

      </header>

      <button
        type="button"
        className="chapel-primary-button"
        onClick={handleOpenForm}
      >
        Deixar um pedido de oração
      </button>

      <div className="prayer-chapel-divider" />

      <section className="prayer-chapel-requests">

        <h3>Intenções de oração</h3>

        <p className="prayer-chapel-community-message">
          Una sua oração às intenções compartilhadas
          nesta capela.
        </p>

        {requestsLoading && (
          <p className="prayer-chapel-empty">
            Carregando intenções...
          </p>
        )}

        {!requestsLoading && requestsError && (
          <p className="prayer-chapel-error">
            {requestsError}
          </p>
        )}

        {!requestsLoading &&
          !requestsError &&
          prayerRequests.length === 0 && (
            <p className="prayer-chapel-empty">
              Ainda não há intenções publicadas nesta capela.
            </p>
          )}

        {!requestsLoading &&
          !requestsError &&
          prayerRequests.length > 0 && (
            <div className="prayer-request-list">

              {prayerRequests.map((request) => (
                <article
                  key={request.id}
                  className="prayer-request-card"
                >

                  <span
                    className="prayer-request-symbol"
                    aria-hidden="true"
                  >
                    🙏
                  </span>

                  <div>

                    <p className="prayer-request-text">
                      {request.text}
                    </p>

                    <p className="prayer-request-author">
                      — {request.nickname}
                    </p>

                  </div>

                </article>
              ))}

            </div>
          )}

      </section>

      {prayerRequests.length > 0 && (
        <button
          type="button"
          className="chapel-secondary-button"
        >
          Rezar por estas intenções
        </button>
      )}

      <p className="prayer-chapel-moderation-note">
        Todos os pedidos passam por moderação antes
        de serem publicados.
      </p>

    </section>
  );
}