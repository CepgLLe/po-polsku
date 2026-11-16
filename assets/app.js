(() => {
  'use strict';
  const engine = window.TrainerSession;
  const datasets = { words: window.TRAINER_WORDS, phrases: window.TRAINER_PHRASES };
  const $ = selector => document.querySelector(selector);
  let active, data, state;
  let storageAvailable = true;
  const memory = {};
  const key = () => 'po-polsku.session.v1.' + active;
  function read() {
    if (memory[active]) return memory[active];
    try { return JSON.parse(localStorage.getItem(key())); }
    catch { return memory[active] || null; }
  }
  function save() {
    memory[active] = state;
    try { localStorage.setItem(key(), JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('#notice').hidden = storageAvailable;
    $('#notice').textContent = 'Браузер не разрешает сохранение. Сессия работает до закрытия или перезагрузки страницы.';
  }
  function updateProgress() {
    $('#read-count').textContent = state.seen.length;
    $('#total-count').textContent = ' / ' + data.length;
    $('#progress-fill').style.width = (data.length ? state.seen.length / data.length * 100 : 0) + '%';
    const progress = $('.progress-track');
    progress.setAttribute('aria-valuenow', state.seen.length);
    progress.setAttribute('aria-valuemax', data.length || 1);
    $('#next').disabled = !engine.complete(state);
    const opened = state.batch.filter(id => state.seen.includes(id)).length;
    $('#batch-status').textContent = state.batch.length ? (engine.complete(state) ? 'Все карточки открыты. Можно идти дальше.' : `Открыто ${opened} из ${state.batch.length} · Нажми на карточку, чтобы увидеть перевод`) : '';
  }
  function renderCard(item, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card';
    const top = document.createElement('span'); top.className = 'card-top';
    const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
    const indicator = document.createElement('span'); indicator.className = 'card-indicator';
    top.append(number, indicator);
    const content = document.createElement('span'); content.className = 'card-content';
    const language = document.createElement('span'); language.className = 'card-language';
    const primary = document.createElement('span'); primary.className = 'card-primary';
    const hint = document.createElement('span'); hint.className = 'card-hint';
    content.append(language, primary, hint);
    const bottom = document.createElement('span'); bottom.className = 'card-bottom';
    button.append(top, content, bottom);
    function paint() {
      const opened = state.seen.includes(item.id);
      button.classList.toggle('is-open', opened);
      button.setAttribute('aria-pressed', String(opened));
      button.setAttribute('aria-label', opened ? `${item.pl} — ${item.ru}. Повторено` : `${item.ru}. Показать польский перевод`);
      indicator.textContent = opened ? '✓' : '↗';
      language.textContent = opened ? 'POLSKI' : 'РУССКИЙ';
      primary.lang = opened ? 'pl' : 'ru';
      primary.textContent = opened ? item.pl : item.ru;
      hint.textContent = opened ? item.ru : '';
      bottom.textContent = opened ? 'Повторено' : 'Открыть перевод';
    }
    button.addEventListener('click', () => {
      if (state.seen.includes(item.id)) return;
      engine.reveal(state, item.id); save(); paint(); updateProgress();
    });
    paint(); return button;
  }
  function render() {
    $('#cards').replaceChildren(...state.batch.map((id, index) => renderCard(data.find(item => item.id === id), index)));
    $('#empty-state').hidden = state.batch.length > 0;
    if (!data.length) {
      $('#empty-state h2').textContent = 'Здесь пока нет карточек';
      $('#empty-state p').textContent = `Добавь пары в data/${active}.js и обнови страницу.`;
    } else {
      $('#empty-state h2').textContent = 'Всё повторено. Świetnie!';
      $('#empty-state p').textContent = 'Хорошая работа. Нажми «Сброс», чтобы начать новую сессию.';
    }
    updateProgress();
  }
  function activate() {
    active = location.hash === '#phrases' ? 'phrases' : 'words';
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tab === active)));
    $('#training-label').textContent = active === 'words' ? 'СЛОВАРНЫЙ ЗАПАС' : 'ЖИВОЙ ПОЛЬСКИЙ';
    $('#training-title').textContent = active === 'words' ? 'Одна карточка — один шаг' : 'От слов — к разговору';
    try {
      data = engine.validate(datasets[active]);
      state = engine.restore(data, read()); save(); render();
    } catch (error) {
      $('#cards').replaceChildren(); $('#empty-state').hidden = true;
      $('#notice').hidden = false; $('#notice').textContent = 'Не удалось загрузить базу. ' + error.message;
      $('#reset').disabled = true; $('#next').disabled = true;
      return;
    }
    $('#reset').disabled = false;
  }
  function refresh() { save(); if (storageAvailable) location.reload(); else render(); }
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.tab; }));
  window.addEventListener('hashchange', activate);
  $('#reset').addEventListener('click', () => { state = engine.restore(data, null); refresh(); });
  $('#next').addEventListener('click', () => { if (engine.next(data, state)) refresh(); });
  for (const name of ['words', 'phrases']) $('#' + name + '-total').textContent = Array.isArray(datasets[name]) ? datasets[name].length : '—';
  activate();
})();
