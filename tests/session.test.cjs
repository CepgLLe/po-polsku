const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const engine = require('../assets/session.js');
const context = { window: {} };
for (const name of ['words', 'phrases', 'common']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data/', name + '.js'), 'utf8'), context);
const words = Array.from(context.window.TRAINER_WORDS);
const phrases = Array.from(context.window.TRAINER_PHRASES);
const common = Array.from(context.window.TRAINER_COMMON);
test('все базы корректны; все связи ведут к существующим парам', () => {
  for (const pairs of [words, phrases, common]) engine.validate(pairs);
  const pairs = [...words, ...phrases, ...common];
  const ids = new Set(pairs.map(item => item.id));
  assert.equal(ids.size, pairs.length);
  const vocabulary = new Set(words.map(item => item.pl));
  for (const item of common) {
    assert.match(item.id, /^c-[a-z-]+$/);
    assert.ok(!vocabulary.has(item.pl), item.pl);
  }
  for (const item of pairs) for (const link of item.links) assert.ok(ids.has(link.id));
});
test('полная сессия: уникальные пятёрки, блокировка Далее, остаток и завершение', () => {
  const pairs = words.slice(0, 17);
  const state = engine.restore(pairs, null);
  const visited = new Set();
  const sizes = [];
  while (state.batch.length) {
    sizes.push(state.batch.length);
    assert.equal(engine.next(pairs, state), false);
    for (const id of state.batch) {
      assert.equal(visited.has(id), false);
      visited.add(id);
      engine.reveal(state, id); engine.reveal(state, id);
    }
    assert.equal(state.seen.length, visited.size);
    assert.equal(engine.complete(state), true);
    assert.equal(engine.next(pairs, state), true);
  }
  assert.deepEqual(sizes, [5, 5, 5, 2]);
  assert.equal(visited.size, pairs.length);
  assert.equal(engine.complete(state), false);
});
test('перезагрузка сохраняет открытую карточку и текущую пятёрку', () => {
  const state = engine.restore(words, null);
  engine.reveal(state, state.batch[0]);
  assert.deepEqual(engine.restore(words, JSON.parse(JSON.stringify(state))), state);
  const reset = engine.restore(words, null);
  assert.equal(reset.seen.length, 0); assert.equal(reset.batch.length, 5);
});
test('правка базы удаляет устаревшие id, новый материал доступен после завершения', () => {
  const saved = { seen: ['removed', words[0].id, words[0].id], batch: ['removed'] };
  const state = engine.restore(words, saved);
  assert.deepEqual(state.seen, [words[0].id]);
  assert.equal(state.batch.length, 5);
  assert.ok(!state.batch.includes(words[0].id));
  const finished = { seen: words.map(item => item.id), batch: [] };
  const added = [...words, { id: 'new', ru: 'новое', pl: 'nowe', level: 0, links: [] }];
  assert.deepEqual(engine.restore(added, finished).batch, ['new']);
});
test('пустая и маленькая базы; чужой id не засчитывается', () => {
  assert.deepEqual(engine.restore([], null), { seen: [], batch: [] });
  const state = engine.restore(words.slice(0, 2), null);
  assert.equal(state.batch.length, 2);
  engine.reveal(state, 'unknown'); assert.equal(state.seen.length, 0);
});
test('выборка без дубликатов; разные значения генератора меняют порядок', () => {
  const ids = words.map(item => item.id);
  assert.notDeepEqual(engine.sample(ids, () => 0), engine.sample(ids, () => .99));
  for (let i = 0; i < 100; i++) assert.equal(new Set(engine.sample(ids)).size, 5);
});
test('невалидные пары и повторные id обнаруживаются', () => {
  assert.throws(() => engine.validate([words[0], words[0]]), /id/);
  assert.throws(() => engine.validate([{ id: 'x', ru: '', pl: 'x' }]), /Проверь/);
});
