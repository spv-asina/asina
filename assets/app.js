'use strict';
(() => {
  document.documentElement.classList.add('js');
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const storage = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch {} }, remove(key) { try { localStorage.removeItem(key); } catch {} } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let toastTimer;
  function toast(message) { const el = $('.toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 4000); }
  function updateTheme() { const dark = document.documentElement.dataset.theme === 'dark'; const button = $('.theme-toggle'); button.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему'); button.title = button.getAttribute('aria-label'); $('meta[name="theme-color"]').content = dark ? '#141518' : '#f7f7f2'; }
  $('.theme-toggle')?.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; storage.set('asina-theme', next); updateTheme(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => { if (!storage.get('asina-theme')) { document.documentElement.dataset.theme = event.matches ? 'dark' : 'light'; updateTheme(); } });
  updateTheme();

  // Content stays visible without JS. Only below-the-fold elements are progressively revealed.
  if ('IntersectionObserver' in window && !reduce.matches) { const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); } }), { rootMargin: '0px 0px 70px 0px', threshold: .04 }); $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pending'); observer.observe(el); } }); }

  const mascot = $('.mascot-button');
  if (mascot) {
    const pupils = $('.chibi-pupils', mascot), head = $('.chibi-head', mascot);
    let frame = 0, last = null, greetingTimer;
    const reset = () => { pupils.style.transform = ''; head.style.transform = ''; };
    function point(event) {
      if (reduce.matches || event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches || document.hidden) return;
      last = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; const r = mascot.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const x = Math.max(-1, Math.min(1, (last.x - (r.left + r.width / 2)) / 300)); const y = Math.max(-1, Math.min(1, (last.y - (r.top + r.height * .43)) / 240)); pupils.style.transform = `translate(${x * 5}px,${y * 3}px)`; head.style.transform = `rotate(${x * 3}deg)`; });
    }
    document.addEventListener('pointermove', point, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    reduce.addEventListener('change', reset);
    mascot.addEventListener('click', () => { clearTimeout(greetingTimer); mascot.classList.remove('greeting'); void mascot.offsetWidth; mascot.classList.add('greeting'); toast('Привет! Я Аси. Давайте превратим идею в работающий продукт ✦'); greetingTimer = setTimeout(() => mascot.classList.remove('greeting'), 1400); });
  }

  const demoData = {
    document: { title: 'Накладная → таблица', status: '✓ Готово', rows: [['Бумага А4 · 12 шт.', 'Проверено'], ['Картридж · 3 шт.', 'Проверено']] },
    lecture: { title: 'Лекция → конспект', status: '✦ Главное', rows: [['01 / Основные идеи', 'Собраны'], ['02 / Выводы и примеры', 'Структурированы']] },
    crm: { title: 'Заказы под контролем', status: '✓ В системе', rows: [['#104 · Москва → Тверь', 'В пути'], ['#098 · Тула → Москва', 'Доставлен']] }
  };
  function selectDemo(button, focus = false) {
    const data = demoData[button.dataset.demo]; if (!data) return;
    $$('[data-demo]').forEach(tab => { const active = tab === button; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; });
    const panel = $('#demo-panel'); panel.setAttribute('aria-labelledby', button.id);
    $('.demo-result-head b', panel).textContent = data.title; $('.demo-result-head span', panel).textContent = data.status;
    $$('.demo-row', panel).forEach((row, i) => { [...row.children].forEach((cell, j) => cell.textContent = data.rows[i][j]); });
    panel.classList.remove('changed'); void panel.offsetWidth; panel.classList.add('changed');
    if (focus) button.focus();
  }
  $$('[data-demo]').forEach(button => { button.addEventListener('click', () => selectDemo(button)); button.addEventListener('keydown', event => { const tabs = $$('[data-demo]'); const i = tabs.indexOf(button); const index = event.key === 'ArrowRight' ? (i + 1) % tabs.length : event.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null; if (index !== null) { event.preventDefault(); selectDemo(tabs[index], true); } }); });

  const catalog = $('[data-catalog]');
  if (catalog) {
    let count = 9;
    const filters = $$('[data-filter]'); const cards = $$('.project-card', catalog);
    const valid = new Set(filters.map(el => el.dataset.filter));
    const getCategory = () => { const c = new URL(location.href).searchParams.get('category') || 'all'; return valid.has(c) ? c : 'all'; };
    function render() { const category = getCategory(); const matches = cards.filter(card => category === 'all' || card.dataset.category === category); cards.forEach(card => card.hidden = !matches.includes(card) || matches.indexOf(card) >= count); filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category))); $('.catalog-count').textContent = `Показано ${Math.min(count, matches.length)} из ${matches.length} · превью на тестовых данных`; $('[data-more]').hidden = count >= matches.length; $('.empty').hidden = matches.length > 0; }
    filters.forEach(button => button.addEventListener('click', () => { const url = new URL(location.href); if (button.dataset.filter === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', button.dataset.filter); history.pushState({}, '', url); count = 9; render(); }));
    $('[data-more]').addEventListener('click', () => { count += 9; render(); });
    window.addEventListener('popstate', () => { count = 9; render(); });
    cards.forEach(card => card.addEventListener('click', () => { try { sessionStorage.setItem('asina-catalog', JSON.stringify({ url: location.href, count, y: scrollY })); } catch {} }));
    try { const saved = JSON.parse(sessionStorage.getItem('asina-catalog')); if (saved?.url === location.href && Number.isFinite(saved.count)) { count = saved.count; render(); requestAnimationFrame(() => window.scrollTo({ top: saved.y || 0, behavior: 'instant' })); } else render(); } catch { render(); }
  }
  $$('[data-back-catalog]').forEach(link => { try { const saved = JSON.parse(sessionStorage.getItem('asina-catalog')); if (saved?.url) { const url = new URL(saved.url); if (url.origin === location.origin && url.pathname.endsWith('/cases.html')) link.href = url.href; } } catch {} });

  const brief = $('[data-brief]');
  if (brief) {
    let draft = { choice: '', description: '', project: '' }, step = 1;
    try { const raw = JSON.parse(storage.get('asina-brief')); if (raw && typeof raw === 'object') { for (const key of Object.keys(draft)) if (typeof raw[key] === 'string') draft[key] = raw[key].slice(0,1500); } } catch {}
    const validChoices = $$('[data-choice]').map(button => button.dataset.choice);
    if (!validChoices.includes(draft.choice)) draft.choice = '';
    const project = new URL(location.href).searchParams.get('project');
    if (project && /^case-[a-z0-9-]{1,40}$/.test(project)) draft.project = project;
    const field = $('#brief-description'); field.value = draft.description;
    const save = () => storage.set('asina-brief', JSON.stringify(draft));
    const summary = () => `Здравствуйте, Павел!\n\nЗадача: ${draft.choice || 'Хочу обсудить идею'}.${draft.project ? `\nПохожий проект: ${new URL(draft.project + '.html', location.href).href}` : ''}\n\n${draft.description}\n\nДавайте обсудим возможное решение и первый этап.`;
    function render(focus = false) { $$('[data-step]').forEach(el => el.hidden = Number(el.dataset.step) !== step); $('[data-step-label]').textContent = `Шаг ${step} из 3`; $$('.brief-progress i').forEach((el,i) => el.classList.toggle('active', i < step)); $$('[data-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.choice === draft.choice))); $('[data-step="1"] [data-next]').disabled = !draft.choice; if (step === 3) { $('.brief-result').textContent = summary(); $('[data-send]').href = `https://t.me/spv_asina?text=${encodeURIComponent(summary())}`; } if (focus) $(`[data-step="${step}"] h2`).focus({ preventScroll: true }); }
    $$('[data-choice]').forEach(button => button.addEventListener('click', () => { draft.choice = button.dataset.choice; save(); render(); }));
    field.addEventListener('input', () => { draft.description = field.value.slice(0,1500); $('.form-error').textContent = ''; save(); });
    $$('[data-next]').forEach(button => button.addEventListener('click', () => { if (step === 1 && !draft.choice) return; if (step === 2 && draft.description.trim().length < 10) { $('.form-error').textContent = 'Добавьте хотя бы 10 символов, чтобы задача была понятнее.'; field.focus(); return; } step = Math.min(3, step + 1); save(); render(true); }));
    $$('[data-prev]').forEach(button => button.addEventListener('click', () => { step = Math.max(1, step - 1); render(true); }));
    $('[data-copy]').addEventListener('click', async () => { try { await navigator.clipboard.writeText(summary()); toast('Текст скопирован. Можно вставить в сообщение.'); } catch { const range = document.createRange(); range.selectNodeContents($('.brief-result')); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Выделил текст. Скопируйте его вручную.'); } });
    $('[data-clear]').addEventListener('click', () => { storage.remove('asina-brief'); draft = { choice: '', description: '', project: '' }; field.value = ''; step = 1; $('.form-error').textContent = ''; render(true); toast('Черновик удалён с этого устройства.'); });
    render();
  }
})();

// Reference-led gaze rig: sectors label the pose, CSS variables preserve the subtle in-between motion.
(() => {
  const mascot = document.querySelector('.mascot-button');
  if (!mascot) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, last = null;
  const sector = value => value < -.34 ? -1 : value > .34 ? 1 : 0;
  const name = (x, y) => { const gx = sector(x), gy = sector(y); if (!gx && !gy) return 'center'; const v = gy < 0 ? 'up' : gy > 0 ? 'down' : ''; const h = gx < 0 ? 'left' : gx > 0 ? 'right' : ''; return [v, h].filter(Boolean).join('-'); };
  const reset = () => { delete mascot.dataset.gaze; mascot.classList.remove('cursor-near'); mascot.style.removeProperty('--gaze-x'); mascot.style.removeProperty('--gaze-y'); };
  const point = event => {
    if (reduce.matches || event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches || document.hidden) return;
    last = {x: event.clientX, y: event.clientY}; if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; const rect = mascot.getBoundingClientRect(); if (rect.bottom < 0 || rect.top > innerHeight) return; const x = Math.max(-1, Math.min(1, (last.x - (rect.left + rect.width / 2)) / 300)); const y = Math.max(-1, Math.min(1, (last.y - (rect.top + rect.height * .43)) / 240)); mascot.dataset.gaze = name(x, y); mascot.style.setProperty('--gaze-x', x.toFixed(3)); mascot.style.setProperty('--gaze-y', y.toFixed(3)); mascot.classList.toggle('cursor-near', Math.hypot(last.x - (rect.left + rect.width / 2), last.y - (rect.top + rect.height * .43)) < 110); });
  };
  document.addEventListener('pointermove', point, {passive:true});
  document.documentElement.addEventListener('pointerleave', reset);
  document.addEventListener('visibilitychange', () => {if (document.hidden) reset();});
  reduce.addEventListener('change', reset);
})();
