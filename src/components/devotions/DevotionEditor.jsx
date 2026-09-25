import { newSection, newStep, PRAYERS } from "../../content/devotions";
import { PRAYER_AUDIO_ACCEPT } from "../../services/prayerAudio";
import "./devotions.css";
export default function DevotionEditor({ value, onChange, disabled = false, audioFiles = {}, onAudioChange }) {
  const novena = value.kind === "novena";
  const update = (index, change) => onChange({ ...value, sections: value.sections.map((section, i) => i === index ? { ...section, ...change } : section) });
  function resize(raw) {
    const count = Number(raw);
    if (!Number.isInteger(count) || count < 1 || count > 31) return;
    onChange({ ...value, sections: Array.from({ length: count }, (_, i) => value.sections[i] || newSection(novena ? `Dia ${i + 1}` : `Etapa ${i + 1}`)) });
  }
  return <fieldset className="devotion-editor" disabled={disabled} onInvalidCapture={event => { const details = event.target.closest("details"); if (details) details.open = true; }}><legend>{novena ? "Dias e orações da novena" : "Regras e sequência do terço"}</legend>
    <label className="devotion-field">{novena ? "Quantidade de dias" : "Quantidade de etapas (incluindo a abertura)"}<input type="number" min="1" max="31" value={value.sections.length} onChange={event => resize(event.target.value)} /></label>
    <p>As orações serão lidas na ordem em que aparecem. {novena ? "Cada dia pode ter orações diferentes." : "Use uma etapa para a abertura e outra para cada mistério ou conjunto de orações."} Ao reduzir a quantidade de etapas ou dias, os últimos itens são removidos do rascunho.</p>
    {value.sections.map((section, index) => <details className="devotion-editor-section" key={index}>
      <summary>{novena ? `Dia ${index + 1}` : `Etapa ${index + 1}`} · {section.title || "Sem título"} · {section.prayers.length} {section.prayers.length === 1 ? "oração" : "orações"}</summary>
      <label className="devotion-field">Título {novena ? "do dia" : "da etapa"}<input required maxLength={100} value={section.title} onChange={event => update(index, { title: event.target.value })} /></label>
      <label className="devotion-field">{novena ? "Leitura inicial do dia (opcional)" : "Leitura do mistério ou instrução (opcional)"}<textarea maxLength={3000} rows={3} value={section.reading} onChange={event => update(index, { reading: event.target.value })} /></label>
      {!novena && <label className="devotion-field">Quantas vezes repetir esta sequência<input type="number" min="1" max="100" required value={section.repetitions} onChange={event => update(index, { repetitions: Number(event.target.value) })} /></label>}
      {section.prayers.map((step, stepIndex) => {
        const change = fields => update(index, { prayers: section.prayers.map((item, i) => i === stepIndex ? { ...item, ...fields } : item) });
        const move = delta => { const prayers = [...section.prayers]; [prayers[stepIndex], prayers[stepIndex + delta]] = [prayers[stepIndex + delta], prayers[stepIndex]]; update(index, { prayers }); };
        return <div className="devotion-step-editor" key={stepIndex}>
          <label className="devotion-field">Oração {stepIndex + 1}<select value={step.prayer} onChange={event => change(event.target.value === "custom" ? { prayer: "custom", title: "", text: "" } : { prayer: event.target.value, title: undefined, text: undefined })}>{Object.entries(PRAYERS).map(([id, prayer]) => <option key={id} value={id}>{prayer.title}</option>)}<option value="custom">Escrever outra oração</option></select></label>
          {step.prayer === "custom" && <><label className="devotion-field">Nome da oração<input required maxLength={100} value={step.title} onChange={event => change({ title: event.target.value })} /></label><label className="devotion-field">Texto da oração<textarea required maxLength={3000} rows={5} value={step.text} onChange={event => change({ text: event.target.value })} /></label></>}
          <label className="devotion-field">Repetições desta oração<input type="number" min="1" max="100" required value={step.repetitions} onChange={event => change({ repetitions: Number(event.target.value) })} /></label>
          {onAudioChange && <label className="devotion-field">Áudio individual desta oração (opcional)<input type="file" accept={PRAYER_AUDIO_ACCEPT} onChange={event => onAudioChange(index, stepIndex, event.target.files?.[0] || null, event.target)} /><span className="devotion-audio-name">{audioFiles[`${index}:${stepIndex}`]?.name || "Nenhum áudio selecionado"}</span></label>}
          <div className="devotion-actions"><button type="button" disabled={stepIndex === 0} onClick={() => move(-1)}>Subir oração {stepIndex + 1}</button><button type="button" disabled={stepIndex === section.prayers.length - 1} onClick={() => move(1)}>Descer oração {stepIndex + 1}</button><button type="button" disabled={section.prayers.length === 1} onClick={() => update(index, { prayers: section.prayers.filter((_, i) => i !== stepIndex) })}>Remover oração {stepIndex + 1}</button></div>
        </div>;
      })}
      <button type="button" className="chapel-secondary-button" disabled={section.prayers.length >= 30} onClick={() => update(index, { prayers: [...section.prayers, newStep()] })}>Adicionar oração a {novena ? `dia ${index + 1}` : `etapa ${index + 1}`}</button>
    </details>)}
  </fieldset>;
}
