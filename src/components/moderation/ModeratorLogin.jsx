import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ModeratorLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.session) {
        throw new Error(
          "Não foi possível iniciar a sessão."
        );
      }

      onLogin?.(data.session);
    } catch (err) {
      console.error(
        "Erro no login do moderador:",
        err
      );

      setError(
        "Acesso não autorizado. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="moderator-login-wrapper">
      <div className="moderator-login-card">
        <div
          className="moderator-login-icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            width="34"
            height="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>

        <div className="moderator-login-heading">
          <span>VOX ORANTIS</span>

          <h2>Área de Moderação</h2>

          <p>
            Acesso reservado aos responsáveis pela
            revisão dos conteúdos enviados às capelas.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            className="moderator-login-label"
            htmlFor="moderator-email"
          >
            E-mail
          </label>

          <input
            id="moderator-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            placeholder="Seu e-mail"
            required
          />

          <label
            className="moderator-login-label"
            htmlFor="moderator-password"
          >
            Senha
          </label>

          <input
            id="moderator-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            placeholder="Sua senha"
            required
          />

          {error && (
            <p className="moderator-login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="moderator-login-button"
            disabled={loading}
          >
            {loading
              ? "Verificando acesso..."
              : "Entrar na moderação"}
          </button>
        </form>

        <div className="moderator-login-security">
          <span aria-hidden="true">🔒</span>

          <p>
            Área restrita. Todas as ações de
            moderação são protegidas e exigem
            autorização.
          </p>
        </div>
      </div>
    </div>
  );
}