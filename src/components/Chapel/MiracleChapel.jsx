import { useState } from "react";

export default function MiracleChapel() {
  const [formOpen, setFormOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [testimonyText, setTestimonyText] = useState("");

  const [submitted, setSubmitted] = useState(false);

  function handleOpenForm() {
    setSubmitted(false);
    setFormOpen(true);
  }

  function handleBackToChapel() {
    setFormOpen(false);
    setSubmitted(false);
    setNickname("");
    setTestimonyText("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!testimonyText.trim()) {
      return;
    }

    /*
     * Integração com Supabase será adicionada
     * quando a conexão com o projeto estiver normalizada.
     */

    setSubmitted(true);
    setNickname("");
    setTestimonyText("");
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
              <h3>Compartilhe uma graça alcançada</h3>

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
                  setTestimonyText(event.target.value)
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

              <div className="prayer-request-form-actions">
                <button
                  type="button"
                  className="chapel-cancel-button"
                  onClick={handleBackToChapel}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="chapel-primary-button"
                  disabled={!testimonyText.trim()}
                >
                  Enviar testemunho
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

              <h3>Seu testemunho foi recebido.</h3>

              <p>
                Ele será encaminhado para moderação
                antes de ser publicado na Capela de Milagres.
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
          “Grandes coisas fez por mim o Todo-Poderoso.”
          <span>Lucas 1,49</span>
        </blockquote>

        <p className="prayer-chapel-intro">
          Um espaço para compartilhar graças alcançadas
          e testemunhos de fé.
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

        <p className="prayer-chapel-empty">
          Ainda não há testemunhos publicados nesta capela.
        </p>
      </section>

      <p className="prayer-chapel-moderation-note">
        Todos os testemunhos passam por moderação antes
        de serem publicados.
      </p>
    </section>
  );
}