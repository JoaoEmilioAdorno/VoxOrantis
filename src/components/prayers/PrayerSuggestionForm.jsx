import { useEffect, useState } from "react";
import { PRAYER_AUDIO_ACCEPT, validatePrayerAudio } from "../../services/prayerAudio";

import {
  PRAYER_SUGGESTION_LIMITS,
  submitPrayerSuggestion,
} from "../../services/prayerSuggestionService";

export default function PrayerSuggestionForm() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [submitted, setSubmitted] =
    useState(false);
  const [error, setError] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState("");
  const [audioError, setAudioError] = useState("");

  useEffect(() => {
    if (!audioFile) {
      setAudioPreview("");
      return;
    }
    const url = URL.createObjectURL(audioFile);
    setAudioPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  function handleAudioChange(event) {
    const file = event.target.files?.[0] ?? null;
    setAudioError("");
    try {
      validatePrayerAudio(file);
      setAudioFile(file);
    } catch (validationError) {
      setAudioFile(null);
      event.target.value = "";
      setAudioError(validationError.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await submitPrayerSuggestion({ title, text, audioFile });
      setTitle("");
      setText("");
      setAudioFile(null);
      setSubmitted(true);
    } catch (submissionError) {
      const isCooldown =
        submissionError.message?.includes(
          "Aguarde antes de enviar outra sugestão"
        );
      const validationMessages = [
        "Informe o título da oração.",
        "Escreva o texto da oração.",
        "O título deve ter no máximo 100 caracteres.",
        "A oração deve ter no máximo 5.000 caracteres.",
        "Não foi possível enviar o áudio. Tente novamente.",
      ];

      setError(
        isCooldown
          ? "Sua sugestão já foi recebida. Aguarde um minuto antes de enviar outra."
          : validationMessages.includes(
                submissionError.message
              )
            ? submissionError.message
            : "Não foi possível enviar a sugestão. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <section className="prayer-chapel">
        <div className="prayer-request-confirmation">
          <span
            className="prayer-request-confirmation-icon"
            aria-hidden="true"
          >
            ✓
          </span>
          <h2>Sugestão recebida</h2>
          <p>
            A oração e o áudio, quando enviado, passarão por revisão antes de entrar
            na biblioteca do Vox Orantis.
          </p>
          <button
            type="button"
            className="chapel-secondary-button"
            onClick={() => setSubmitted(false)}
          >
            Sugerir outra oração
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="prayer-chapel">
      <header className="prayer-chapel-header">
        <h2>Adicionar nova oração</h2>
        <p className="prayer-chapel-intro">
          Compartilhe uma oração para avaliação da equipe
          do Vox Orantis.
        </p>
      </header>

      <div className="prayer-chapel-divider" />

      <form
        className="prayer-request-form prayer-suggestion-form"
        onSubmit={handleSubmit}
      >
        <label
          className="prayer-request-label"
          htmlFor="prayer-suggestion-title"
        >
          Título
        </label>
        <input
          id="prayer-suggestion-title"
          type="text"
          value={title}
          maxLength={PRAYER_SUGGESTION_LIMITS.TITLE}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          required
        />
        <p className="prayer-request-counter">
          {title.length}/{PRAYER_SUGGESTION_LIMITS.TITLE}
        </p>

        <label
          className="prayer-request-label"
          htmlFor="prayer-suggestion-text"
        >
          Texto da oração
        </label>
        <textarea
          id="prayer-suggestion-text"
          value={text}
          maxLength={PRAYER_SUGGESTION_LIMITS.TEXT}
          rows={12}
          onChange={(event) =>
            setText(event.target.value)
          }
          required
        />
        <p className="prayer-request-counter">
          {text.length}/{PRAYER_SUGGESTION_LIMITS.TEXT}
        </p>

        <label className="prayer-request-label" htmlFor="prayer-suggestion-audio">
          Áudio da oração (opcional)
        </label>
        <input id="prayer-suggestion-audio" type="file" accept={PRAYER_AUDIO_ACCEPT}
          onChange={handleAudioChange} disabled={submitting} aria-describedby="prayer-audio-help" />
        <p id="prayer-audio-help" className="prayer-request-privacy">
          MP3, M4A, WAV, OGG, WebM ou AAC, até 20 MB. Após aprovação,
          o áudio tocará junto com a oração no globo.
        </p>
        {audioPreview && (
          <audio key={audioPreview} className="prayer-library-audio" src={audioPreview}
            controls preload="metadata" aria-label="Ouvir áudio antes de enviar"
            onError={() => setAudioError("Este áudio não pôde ser reproduzido. Escolha outro arquivo, de preferência MP3.")} />
        )}
        {audioError && <p role="alert" className="prayer-request-submit-error">{audioError}</p>}

        <p className="prayer-request-privacy">
          Envie somente a oração e sua gravação. Não inclua dados
          pessoais, pedidos particulares ou contatos.
        </p>

        {error && (
          <p className="prayer-request-submit-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="chapel-primary-button"
          disabled={
            submitting || !title.trim() || !text.trim() || Boolean(audioError)
          }
        >
          {submitting ? "Enviando..." : "Enviar para moderação"}
        </button>
      </form>
    </section>
  );
}
