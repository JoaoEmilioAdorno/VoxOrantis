import test from 'node:test';
import assert from 'node:assert/strict';
import {attachDevotionAudio, createDevotion, encodeDevotion, decodeDevotion, expandSection, remainingDays, validateDevotion} from '../src/content/devotions.js';

test('terço solicitado: Creio, 3 Ave-Marias, Glória e cinco mistérios com a ordem exata', () => {
 const d = createDevotion('rosary');
 assert.deepEqual(expandSection(d.sections[0]).map(x => x.title), ['Creio','Ave-Maria','Ave-Maria','Ave-Maria','Glória ao Pai']);
 assert.equal(d.sections.length, 6);
 for (const section of d.sections.slice(1)) {
  const steps = expandSection(section);
  assert.equal(steps.length, 13);
  assert.equal(steps[0].reading, true);
  assert.equal(steps[0].text, section.reading);
  assert.equal(steps[1].title, 'Pai-Nosso');
  assert.equal(steps[2].title, 'Glória ao Pai');
  assert.equal(steps.slice(3).filter(x => x.title === 'Ave-Maria').length, 10);
  assert.equal(steps.at(-1).repetition, 10);
 }
 assert.equal(d.sections.flatMap(expandSection).filter(x => !x.reading).length, 65);
});
test('repetições da sequência e da oração se compõem e preservam a leitura', () => {
 const section = {title:'Etapa',reading:'Mistério',repetitions:2,prayers:[{prayer:'gloria',repetitions:3}]};
 const steps = expandSection(section);
 assert.equal(steps.length, 8); assert.equal(steps[4].reading, true);
 assert.equal(steps.at(-1).cycle, 2); assert.equal(steps.at(-1).repetition, 3);
});
test('novena permite dias independentes e restantes sem histórico', () => {
 const d = createDevotion('novena');
 d.sections.forEach((day,i) => {day.prayers = [{prayer:'custom',title:'Oração do dia '+(i+1),text:'Texto '+(i+1),repetitions:1}];});
 assert.equal(remainingDays(d,0),8); assert.equal(remainingDays(d,4),4); assert.equal(remainingDays(d,8),0);
 assert.equal(expandSection(d.sections[4])[0].text,'Texto 5');
 assert.deepEqual(decodeDevotion(encodeDevotion(d)),d);
 assert.throws(() => remainingDays(d,-1));
});
test('formato versionado preserva roteiros e não interpreta oração avulsa', () => {
 const d = createDevotion('rosary'); assert.deepEqual(decodeDevotion(encodeDevotion(d)),d);
 assert.equal(decodeDevotion('Oração comum'),null); assert.equal(decodeDevotion('VOX-DEVOTION/1\n{}'),null);
});
test('áudio individual acompanha somente a oração correspondente', () => {
 const d = createDevotion('rosary');
 const path = '123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174001.mp3';
 d.sections[0].prayers[1].audioPath = path;
 const hydrated = attachDevotionAudio(decodeDevotion(encodeDevotion(d)), {[path]:'https://audio.test/ave.mp3'});
 const steps = expandSection(hydrated.sections[0]);
 assert.equal(steps[0].audio, null);
 assert.equal(steps[1].audio, 'https://audio.test/ave.mp3');
 assert.equal(steps[3].audio, 'https://audio.test/ave.mp3');
 assert.equal(steps[4].audio, null);
});
test('novena usa a mesma associação individual de áudio por oração', () => {
 const d = createDevotion('novena');
 d.sections[0].prayers[0] = {prayer:'custom',title:'Oração do primeiro dia',text:'Texto do primeiro dia',repetitions:2};
 for (const day of d.sections.slice(1)) day.prayers[0] = {prayer:'custom',title:'Oração',text:'Texto',repetitions:1};
 const path = '123e4567-e89b-12d3-a456-426614174000/123e4567-e89b-12d3-a456-426614174002.mp3';
 d.sections[0].prayers[0].audioPath = path;
 const hydrated = attachDevotionAudio(decodeDevotion(encodeDevotion(d)), {[path]:'https://audio.test/novena.mp3'});
 const steps = expandSection(hydrated.sections[0]);
 assert.equal(steps.length, 2);
 assert.equal(steps[0].text, 'Texto do primeiro dia');
 assert.equal(steps[0].audio, 'https://audio.test/novena.mp3');
 assert.equal(steps[1].audio, 'https://audio.test/novena.mp3');
});
test('rejeita contagens, tipos, textos vazios e expansão excessiva', () => {
 for (const count of [0,-1,1.5,101,NaN]) { const d = createDevotion('rosary'); d.sections[0].prayers[0].repetitions=count; assert.throws(() => validateDevotion(d)); }
 const bad = createDevotion('rosary'); bad.sections[0].prayers[0].prayer='__proto__'; assert.throws(() => validateDevotion(bad));
 assert.throws(() => encodeDevotion(createDevotion('novena')));
 const huge = createDevotion('rosary'); huge.sections.forEach(s => s.repetitions=100); assert.throws(() => encodeDevotion(huge));
 const long = createDevotion('rosary'); long.sections.forEach(s => s.reading='a'.repeat(1000)); assert.throws(() => encodeDevotion(long));
});
