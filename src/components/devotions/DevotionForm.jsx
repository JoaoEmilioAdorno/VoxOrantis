import { useState } from "react";
import { createDevotion, encodeDevotion } from "../../content/devotions";
import { submitPrayerSuggestion } from "../../services/prayerSuggestionService";
import { validatePrayerAudio } from "../../services/prayerAudio";
import DevotionEditor from "./DevotionEditor";
import DevotionReader from "./DevotionReader";

export default function DevotionForm({ kind, onBack }) {
  const [title, setTitle] = useState("");
  const [draft, setDraft] = useState(() => createDevotion(kind));
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [audioFiles, setAudioFiles] = useState({});
  const [audioError, setAudioError] = useState("");
  function handleAudioChange(sectionIndex, stepIndex, file, input) {
    setAudioError("");
    try { validatePrayerAudio(file); setAudioFiles(current => ({ ...current, [`${sectionIndex}:${stepIndex}`]: file })); }
    catch (validationError) {
      input.value = ""; setAudioError(validationError.message);
    }
  }
  function checkPreview() { try { encodeDevotion(draft); setError(""); setPreview(true); } catch (err) { setError(err.message); } }
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const devotionAudioFiles = Object.entries(audioFiles).filter(([, file]) => file).map(([key, file]) => { const [sectionIndex, stepIndex] = key.split(":").map(Number); return { sectionIndex, stepIndex, file }; });
      await submitPrayerSuggestion({ title, text: encodeDevotion(draft), devotionAudioFiles, ephemeralDevice: true }); setSent(true);
    }
    catch (err) { setError(err.message?.includes("Aguarde") ? "Aguarde um minuto antes de enviar outra sugestão." : err.message?.includes("roteiro") || err.message?.includes("Preencha") || err.message?.includes("repeti") ? err.message : "Não foi possível enviar. Confira os campos e sua conexão e tente novamente."); }
    finally { setBusy(false); }
  }
  if (sent) return <section className="prayer-chapel"><h2>Roteiro enviado para moderação</h2><p>O conteúdo só aparecerá na biblioteca depois da revisão e publicação. Nenhum progresso de oração foi registrado.</p><button className="chapel-secondary-button" onClick={onBack}>Voltar à biblioteca</button></section>;
  if (preview) return <><p className="devotion-status">Prévia do rascunho · ainda não publicado</p><DevotionReader key="preview" devotion={draft} title={title || "Prévia"} backLabel="Voltar à edição" onBack={() => setPreview(false)} /></>;
  return <section className="prayer-chapel"><button className="chapel-secondary-button" onClick={onBack} disabled={busy}>Voltar à biblioteca</button><h2>{kind === "novena" ? "Cadastrar novena" : "Cadastrar terço"}</h2><p>Configure o roteiro e envie para moderação. O rascunho fica apenas nesta tela até o envio.</p>{kind === "rosary" && <p>O exemplo inicial usa os mistérios gozosos e a ordem: Creio, três Ave-Marias, Glória; depois, em cada dezena, mistério, Pai-Nosso, Glória e dez Ave-Marias. Você pode editar cada etapa.</p>}
    <form className="prayer-request-form" onSubmit={submit}>
      <label className="devotion-field">Título<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} /></label>
      <DevotionEditor value={draft} onChange={setDraft} disabled={busy} audioFiles={audioFiles} onAudioChange={handleAudioChange} />
      <p className="prayer-request-privacy">Cada oração possui seu próprio campo de áudio. Formatos: MP3, M4A, WAV, OGG, WebM ou AAC, até 20 MB por arquivo. A moderação ouvirá os arquivos antes da publicação.</p>
      {audioError && <p className="prayer-chapel-error" role="alert">{audioError}</p>}
      <p className="prayer-request-privacy">Envie somente o conteúdo das orações, sem informações pessoais. Use as orações prontas ou escreva seus textos. Roteiros muito longos precisam ser resumidos antes do envio.</p>
      {error && <p className="prayer-chapel-error" role="alert">{error}</p>}
      <div className="devotion-actions"><button type="button" className="chapel-secondary-button" disabled={busy} onClick={checkPreview}>Conferir leitura</button><button className="chapel-primary-button" disabled={busy || Boolean(audioError)}>{busy ? "Enviando..." : "Enviar para moderação"}</button></div>
    </form></section>;
}
