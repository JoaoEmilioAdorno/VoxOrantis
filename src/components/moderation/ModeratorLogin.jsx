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
        throw new Error("Não foi possível iniciar a sessão.");
      }

      onLogin?.(data.session);
    } catch (err) {
      console.error("Erro no login do moderador:", err);

      setError(
        "Não foi possível entrar. Verifique seu e-mail e sua senha."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="moderator-login">
      <h2>Moderação</h2>

      <p>
        Acesso restrito ao moderador.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          E-mail

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            required
          />
        </label>

        <label>
          Senha

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="moderator-login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>
    </div>
  );
}