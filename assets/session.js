(function (root) {
  'use strict';
  function validate(data) {
    if (!Array.isArray(data)) throw new Error('База должна содержать список пар.');
    const ids = new Set();
    for (const item of data) {
      if (!item || typeof item.id !== 'string' || !item.id.trim() ||
          typeof item.ru !== 'string' || !item.ru.trim() || typeof item.pl !== 'string' || !item.pl.trim() ||
          !Number.isFinite(item.level) || item.level < 0 || !Array.isArray(item.links)) {
        throw new Error('Проверь поля id, ru, pl, level и links в базе.');
      }
      if (ids.has(item.id)) throw new Error('В базе повторяется id: ' + item.id);
      ids.add(item.id);
    }
    return data;
  }
  function sample(ids, random = Math.random, data = []) {
    const levels = new Map(data.map(item => [item.id, item.level]));
    const candidates = ids.map(id => ({
      id,
      // Вес конкретной пары: level 0 → 1, level 1 → 1/2, level 9 → 1/10.
      weight: 1 / (1 + (levels.get(id) ?? 0)),
    }));
    const selected = [];
    while (selected.length < 5 && candidates.length > 0) {
      const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
      let threshold = random() * totalWeight;
      let index = 0;
      while (index < candidates.length - 1 && threshold >= candidates[index].weight) {
        threshold -= candidates[index].weight;
        index++;
      }
      selected.push(candidates[index].id);
      candidates.splice(index, 1);
    }
    return selected;
  }
  function restore(data, saved) {
    const ids = new Set(data.map(item => item.id));
    const clean = value => [...new Set(Array.isArray(value) ? value.filter(id => ids.has(id)) : [])];
    const seen = clean(saved?.seen);
    const batch = clean(saved?.batch).slice(0, 5);
    return { seen, batch: batch.length ? batch : sample([...ids].filter(id => !seen.includes(id)), Math.random, data) };
  }
  function reveal(state, id) {
    if (state.batch.includes(id) && !state.seen.includes(id)) state.seen.push(id);
  }
  function complete(state) { return state.batch.length > 0 && state.batch.every(id => state.seen.includes(id)); }
  function next(data, state) {
    if (!complete(state)) return false;
    state.batch = sample(data.map(item => item.id).filter(id => !state.seen.includes(id)), Math.random, data);
    return true;
  }
  const api = { validate, sample, restore, reveal, complete, next };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TrainerSession = api;
})(typeof window !== 'undefined' ? window : globalThis);
