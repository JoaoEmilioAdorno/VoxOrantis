import { useEffect, useState } from "react";

import {
  submitMiracleRequest,
  loadApprovedMiracleRequests,
} from "../../services/miracleRequestService";

export default function MiracleChapel() {
  const [formOpen, setFormOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [testimonyText, setTestimonyText] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [testimonies, setTestimonies] = useState([]);
  const [loadingTestimonies, setLoadingTestimonies] =
    useState(true);

  useEffect(() => {
    async function loadTestimonies() {
      try {
        const data =
          await loadApprovedMiracleRequests();

        setTestimonies(data);
      } catch (error) {
        console.error(
          "Erro ao carregar testemunhos:",
          error
        );
      } finally {
        setLoadingTestimonies(false);
      }
    }

    loadTestimonies();
  }, []);

  function handleOpenForm() {
    setSubmitted(false);
    setSubmitError("");
    setFormOpen(true);
  }

  function handleBackToChapel() {
    setFormOpen(false);
    setSubmitted(false);

    setNickname("");
    setTestimonyText("");
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!testimonyText.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await submitMiracleRequest({
        nickname,
        testimonyText,
      });

      setSubmitted(true);

      setNickname("");
      setTestimonyText("");
    } catch (error) {
      console.error(
        "Erro ao enviar testemunho:",
        error
      );

      setSubmitError(
        error?.message ||
          "Não foi possível enviar o testemunho."
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
          <h2>Capela de Milagres</h2>
        </header>

        {!submitted ? (
          <div className="prayer-request-form-wrapper">
            <form
              className="prayer-request-form"
              onSubmit={handleSubmit}
            >
              <h3>
                Compartilhe uma graça alcançada
              </h3>

              <p className="prayer-request-form-intro">
                Conte brevemente a graça que deseja
                compartilhar. O apelido é opcional.
              </p>

              <label
                className="prayer-request-label"
                htmlFor="miracle-nickname"
              >
                Apelido
              </label>

              <input
                id="miracle-nickname"
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
                htmlFor="miracle-testimony"
              >
                Testemunho
              </label>

              <textarea
                id="miracle-testimony"
                value={testimonyText}
                onChange={(event) =>
                  setTestimonyText(
                    event.target.value
                  )
                }
                maxLength={1000}
                rows={9}
                placeholder="Conte aqui sua graça alcançada..."
                required
              />

              <p className="prayer-request-counter">
                {testimonyText.length}/1000
              </p>

              <p className="prayer-request-privacy">
                Não informe telefone, endereço,
                e-mail ou outros dados pessoais.
              </p>

              {submitError && (
                <p className="prayer-request-error">
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
                    submitting ||
                    !testimonyText.trim()
                  }
                >
                  {submitting
                    ? "Enviando..."
                    : "Enviar testemunho"}
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

              <h3>
                Seu testemunho foi recebido.
              </h3>

              <p>
                Ele será encaminhado para
                moderação antes de ser publicado
                na Capela de Milagres.
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
        <h2>Capela de Milagres</h2>

        <blockquote className="prayer-chapel-verse">
          “Grandes coisas fez por mim o
          Todo-Poderoso.”
          <span>Lucas 1,49</span>
        </blockquote>

        <p className="prayer-chapel-intro">
          Um espaço para compartilhar graças
          alcançadas e testemunhos de fé.
        </p>
      </header>

      <button
        type="button"
        className="chapel-primary-button"
        onClick={handleOpenForm}
      >
        Compartilhar uma graça alcançada
      </button>

      <div className="prayer-chapel-divider" />

      <section className="prayer-chapel-requests">
        <h3>Testemunhos de graças</h3>

        <p className="prayer-chapel-community-message">
          Testemunhos aprovados pela moderação
          serão compartilhados neste espaço.
        </p>

        {loadingTestimonies ? (
          <p className="prayer-chapel-empty">
            Carregando testemunhos...
          </p>
        ) : testimonies.length === 0 ? (
          <p className="prayer-chapel-empty">
            Ainda não há testemunhos publicados
            nesta capela.
          </p>
        ) : (
          <div className="prayer-chapel-request-list">
            {testimonies.map((testimony) => (
              <article
                key={testimony.id}
                className="prayer-chapel-request-card"
              >
                <p>{testimony.text}</p>

                <span>
                  — {testimony.nickname}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="prayer-chapel-moderation-note">
        Todos os testemunhos passam por moderação
        antes de serem publicados.
      </p>
    </section>
  );
}