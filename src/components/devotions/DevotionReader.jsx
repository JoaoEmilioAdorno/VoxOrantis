import { useState } from "react";
import { expandSection, remainingDays } from "../../content/devotions";
import OfferablePrayer from "../prayers/OfferablePrayer";
import "./devotions.css";

export default function DevotionReader({ devotion, title, prayerId, onOfferPrayer, onBack, backLabel }) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const novena = devotion.kind === "novena";
  const section = devotion.sections[sectionIndex];
  const sequence = expandSection(section);
  const current = sequence[position];
  const last = position === sequence.length - 1;
  const offerable = Boolean(prayerId && onOfferPrayer);
  const offeredPrayer = offerable && !current.reading ? { id: `${prayerId}:${sectionIndex}:${current.stepIndex}`, title: current.title, audio: current.audio || null, crawl: [current.text], offerable: true } : null;
  function selectSection(index) { setSectionIndex(index); setPosition(0); }
  function next() {
    if (!last) setPosition(position + 1);
    else if (!novena && sectionIndex < devotion.sections.length - 1) selectSection(sectionIndex + 1);
  }
  function previous() {
    if (position > 0) setPosition(position - 1);
    else if (!novena && sectionIndex > 0) { setSectionIndex(sectionIndex - 1); setPosition(expandSection(devotion.sections[sectionIndex - 1]).length - 1); }
  }
  return <section className="prayer-chapel devotion-reader">
    {onBack && <button className="chapel-secondary-button" onClick={onBack}>{backLabel || `Voltar para ${novena ? "novenas" : "terços"}`}</button>}
    <header className="prayer-chapel-header"><h2>{title}</h2><p className="prayer-chapel-intro">{novena ? "Escolha o dia que deseja rezar. Não há registro nem acompanhamento dos dias rezados." : "Acompanhe cada oração na ordem do roteiro. A posição de leitura não é salva."}</p></header>
    <label className="devotion-field">{novena ? "Escolha o dia da novena" : "Escolha a etapa do terço"}
      <select value={sectionIndex} onChange={event => selectSection(Number(event.target.value))}>{devotion.sections.map((item, index) => <option key={index} value={index}>{novena && item.title !== `Dia ${index + 1}` ? `Dia ${index + 1} — ` : ""}{item.title}</option>)}</select>
    </label>
    {novena && <p className="devotion-status" role="status">Dia {sectionIndex + 1} de {devotion.sections.length} · {remainingDays(devotion, sectionIndex)} {remainingDays(devotion, sectionIndex) === 1 ? "dia restante" : "dias restantes"} depois deste dia no roteiro. Isso não indica dias já rezados.</p>}
    <article className="devotion-reading" aria-live="polite" aria-atomic="true">
      <p className="devotion-status">{section.title} · Leitura {position + 1} de {sequence.length}{section.repetitions > 1 ? ` · Sequência ${current.cycle} de ${section.repetitions}` : ""}</p>
      <h3>{current.title}</h3>
      {!current.reading && <p>{current.repetition} de {current.repetitions} {current.repetitions === 1 ? "repetição" : "repetições"}</p>}
      <p className="prayer-library-text">{current.text}</p>
      {current.audio && <audio className="prayer-library-audio" controls preload="metadata" src={current.audio}>Seu navegador não suporta reprodução de áudio.</audio>}
      {offeredPrayer && <div className="devotion-prayer-offer"><OfferablePrayer prayer={offeredPrayer} onPrayerStart={onOfferPrayer} /></div>}
    </article>
    <nav className="devotion-actions" aria-label="Navegação da leitura">
      <button className="chapel-secondary-button" disabled={position === 0 && (novena || sectionIndex === 0)} onClick={previous}>Oração anterior</button>
      <button className="chapel-primary-button" disabled={last && (novena || sectionIndex === devotion.sections.length - 1)} onClick={next}>{last && !novena && sectionIndex < devotion.sections.length - 1 ? "Próxima etapa" : "Próxima oração"}</button>
    </nav>
    {last && (novena || sectionIndex === devotion.sections.length - 1) && <p className="devotion-status">Fim da leitura {novena ? "deste dia. Você pode escolher qualquer outro dia acima." : "do terço."}</p>}
    <details className="devotion-outline"><summary>Ver roteiro completo {novena ? "deste dia" : "do terço"}</summary>{(novena ? [section] : devotion.sections).map((item, index) => <div key={index}><h3>{item.title}</h3>{item.reading && <p>{item.reading}</p>}<p>Repetir sequência: {item.repetitions}×</p><ol>{item.prayers.map((step, i) => <li key={i}>{step.repetitions}× {step.prayer === "custom" ? step.title : ({ creio: "Creio", "ave-maria": "Ave-Maria", "pai-nosso": "Pai-Nosso", gloria: "Glória ao Pai" })[step.prayer]}</li>)}</ol></div>)}</details>
  </section>;
}
