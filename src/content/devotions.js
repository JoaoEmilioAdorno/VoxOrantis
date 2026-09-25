export const DEVOTION_PREFIX = "VOX-DEVOTION/1\n";
export const CONTENT_LIMIT = 5000;
export const PRAYERS = {
  creio: { title: "Creio", text: "Creio em Deus Pai todo-poderoso, Criador do céu e da terra; e em Jesus Cristo, seu único Filho, nosso Senhor; que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, de onde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo; na Santa Igreja Católica; na comunhão dos santos; na remissão dos pecados; na ressurreição da carne; na vida eterna. Amém." },
  "ave-maria": { title: "Ave-Maria", text: "Ave Maria, cheia de graça, o Senhor é convosco. Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém." },
  "pai-nosso": { title: "Pai-Nosso", text: "Pai nosso que estais nos céus, santificado seja o vosso nome. Venha a nós o vosso reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje. Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido. E não nos deixeis cair em tentação, mas livrai-nos do mal. Amém." },
  gloria: { title: "Glória ao Pai", text: "Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém." },
};
export const newStep = () => ({ prayer: "ave-maria", repetitions: 1 });
export const newSection = title => ({ title, reading: "", repetitions: 1, prayers: [newStep()] });
export function createDevotion(kind) {
  if (kind === "novena") return { version: 1, kind, sections: Array.from({ length: 9 }, (_, i) => ({ ...newSection(`Dia ${i + 1}`), prayers: [{ prayer: "custom", title: "", text: "", repetitions: 1 }] })) };
  const mysteries = ["A anunciação do anjo a Maria", "A visita de Maria a Isabel", "O nascimento de Jesus", "A apresentação de Jesus no templo", "O encontro de Jesus no templo"];
  return { version: 1, kind: "rosary", sections: [
    { title: "Orações iniciais", reading: "", repetitions: 1, prayers: [{ prayer: "creio", repetitions: 1 }, { prayer: "ave-maria", repetitions: 3 }, { prayer: "gloria", repetitions: 1 }] },
    ...mysteries.map((reading, i) => ({ title: `${i + 1}ª dezena`, reading: `${i + 1}º mistério gozoso — ${reading}.`, repetitions: 1, prayers: [{ prayer: "pai-nosso", repetitions: 1 }, { prayer: "gloria", repetitions: 1 }, { prayer: "ave-maria", repetitions: 10 }] })),
  ] };
}
function integer(value, max, message) {
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(message);
}
export function validateDevotion(value) {
  if (!value || value.version !== 1 || !["rosary", "novena"].includes(value.kind) || !Array.isArray(value.sections)) throw new Error("Estrutura de oração inválida.");
  integer(value.sections.length, 31, "Informe entre 1 e 31 etapas ou dias.");
  let total = 0;
  for (const section of value.sections) {
    if (typeof section.title !== "string" || !section.title.trim() || section.title.length > 100 || typeof section.reading !== "string" || section.reading.length > 3000) throw new Error("Preencha o título da etapa e limite a leitura a 3.000 caracteres.");
    integer(section.repetitions, 100, "A repetição da etapa deve ser de 1 a 100.");
    if (value.kind === "novena" && section.repetitions !== 1) throw new Error("Cada dia da novena deve ter uma única sequência.");
    if (!Array.isArray(section.prayers)) throw new Error("Informe as orações da etapa.");
    integer(section.prayers.length, 30, "Cada etapa precisa de 1 a 30 orações.");
    for (const step of section.prayers) {
      integer(step.repetitions, 100, "Cada oração deve ter de 1 a 100 repetições.");
      if (step.audioPath !== undefined && (typeof step.audioPath !== "string" || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp3|m4a|mp4|wav|ogg|webm|aac)$/.test(step.audioPath))) throw new Error("O áudio individual da oração é inválido.");
      if (step.prayer === "custom") {
        if (typeof step.title !== "string" || !step.title.trim() || step.title.length > 100 || typeof step.text !== "string" || !step.text.trim() || step.text.length > 3000) throw new Error("Preencha o título e o texto de cada oração personalizada (até 3.000 caracteres).");
      } else if (!Object.hasOwn(PRAYERS, step.prayer)) throw new Error("Escolha uma oração válida.");
      total += section.repetitions * step.repetitions;
    }
  }
  if (total > 3000) throw new Error("O roteiro deve ter no máximo 3.000 repetições no total.");
  if ((DEVOTION_PREFIX + JSON.stringify(value)).length > CONTENT_LIMIT) throw new Error("O roteiro excede o limite de 5.000 caracteres. Reduza os textos ou use as orações prontas.");
  return value;
}
export function encodeDevotion(value) { return DEVOTION_PREFIX + JSON.stringify(validateDevotion(value)); }
export function decodeDevotion(text) {
  if (typeof text !== "string" || !text.startsWith(DEVOTION_PREFIX)) return null;
  try { return validateDevotion(JSON.parse(text.slice(DEVOTION_PREFIX.length))); } catch { return null; }
}
export function getStepPrayer(step) { return step.prayer === "custom" ? { title: step.title, text: step.text } : PRAYERS[step.prayer]; }
export function expandSection(section) {
  const sequence = [];
  for (let cycle = 0; cycle < section.repetitions; cycle++) {
    if (section.reading.trim()) sequence.push({ title: section.title, text: section.reading, reading: true, cycle: cycle + 1 });
    for (const step of section.prayers) for (let repetition = 1; repetition <= step.repetitions; repetition++) {
      sequence.push({ ...getStepPrayer(step), audioPath: step.audioPath, audio: step.audio, stepIndex: section.prayers.indexOf(step), repetition, repetitions: step.repetitions, cycle: cycle + 1 });
    }
  }
  return sequence;
}
export function attachDevotionAudio(devotion, audioUrls = {}) {
  return { ...devotion, sections: devotion.sections.map(section => ({ ...section, prayers: section.prayers.map(step => ({ ...step, audio: step.audioPath ? audioUrls[step.audioPath] || null : null })) })) };
}
export function remainingDays(devotion, day) {
  if (!Number.isInteger(day) || day < 0 || day >= devotion.sections.length) throw new Error("Dia inválido.");
  return devotion.sections.length - day - 1;
}
export const MARIAN_ROSARY = { id: "devotion:terco-maria", title: "Terço a Maria", subtitle: "Mistérios gozosos · 5 dezenas", devotion: createDevotion("rosary") };
