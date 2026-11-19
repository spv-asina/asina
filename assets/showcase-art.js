/* SPV ASINA / photography-led heroes. Existing product models remain available. */
(function () {
  'use strict';
  var presets = {
    lexforma: {
      target: '.lex-case-board', title: 'Сначала стратегия.', kicker: 'LEXFORMA / LEGAL',
      note: 'Для решений, в которых важна каждая деталь.', action: 'Показать карту спора',
      photo: 'photo-1497366811353-6870744d04b2'
    },
    aeris: {
      target: '.aer-twin', title: 'Точность в деталях.', kicker: 'AERIS / DENTAL',
      note: 'Здоровье, эстетика и уверенность в результате.', action: 'Показать цифровую модель',
      photo: 'photo-1606811971618-4486d14f3f99'
    },
    meridian: {
      target: '.mer-capital-map', title: 'Думать на годы вперёд.', kicker: 'MERIDIAN / PRIVATE CAPITAL',
      note: 'Архитектура капитала начинается с ясности.', action: 'Посмотреть карту капитала',
      photo: 'photo-1486406146926-c627a92ad1ab'
    },
    axis: {
      target: '.axis-drawing', title: 'Пространство с характером.', kicker: 'ОСЬ / ARCHITECTURE',
      note: 'Замысел, материал и конструкция — единая система.', action: 'Посмотреть чертёж',
      photo: 'photo-1487958449943-2429e8be8625'
    },
    atelier: {
      target: '.scan', title: 'Эстетика без компромиссов.', kicker: 'ATELIER DENTAIRE',
      note: 'Индивидуальный подход от диагностики до результата.', action: 'Показать цифровую модель',
      photo: 'photo-1609840114035-3c981b782dfe'
    },
    monolith: {
      target: '.m-hero-model', title: 'Жить в своём пространстве.', kicker: 'MONOLITH / ARCHITECTS',
      note: 'Архитектура, которую хочется чувствовать.', action: 'Посмотреть объёмную модель',
      photo: 'photo-1600607687920-4e2a09cf159d'
    },
    kinetic: {
      target: '.k-signal-field', title: 'Искусство в движении.', kicker: 'KINETIC / EXHIBITION',
      note: 'Здесь зритель становится частью произведения.', action: 'Открыть интерактивную сцену',
      photo: 'photo-1531058020387-3be344556be6'
    },
    bloom: {
      target: '.bl-atlas', title: 'Детство — время открытий.', kicker: 'BLOOM / KIDS',
      note: 'Место, где можно пробовать, играть и расти.', action: 'Посмотреть карту занятий',
      photo: 'photo-1503454537195-1dcabb73ffb9'
    },
    lapka: {
      target: '.lap-record', title: 'Забота — в каждом прикосновении.', kicker: 'ЛАПКА / VET CLINIC',
      note: 'Помогаем питомцам чувствовать себя лучше.', action: 'Посмотреть карту визита',
      photo: 'photo-1517849845537-4d257902454a'
    }
  };
  var brand = document.documentElement.getAttribute('data-spv-showcase');
  var preset = presets[brand];

  function moveDemoNotice() {
    var notice = document.querySelector('.spv-concept-notice');
    if (!notice || notice.classList.contains('spv-concept-notice--footer')) return;
    // Keep demo disclosure visible at the end, without a generic black bar above every brand.
    notice.classList.add('spv-concept-notice--footer');
    document.body.appendChild(notice);
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function init() {
    moveDemoNotice();
    if (!preset) return;
    var host = document.querySelector(preset.target);
    if (!host || host.querySelector('.spv-photo-story')) return;
    host.classList.add('spv-photo-host');
    host.setAttribute('data-spv-hero-mode', 'photo');

    var poster = make('div', 'spv-photo-story');
    var image = make('img', 'spv-photo-story__image');
    image.alt = '';
    image.loading = 'eager';
    image.decoding = 'async';
    image.src = 'https://images.unsplash.com/' + preset.photo + '?auto=format&fit=crop&w=1400&q=84';
    image.addEventListener('error', function () {
      poster.classList.add('spv-photo-story--fallback');
    }, {once: true});

    var eyebrow = make('span', 'spv-photo-story__eyebrow', preset.kicker);
    var body = make('div', 'spv-photo-story__body');
    body.appendChild(make('h2', 'spv-photo-story__title', preset.title));
    body.appendChild(make('p', 'spv-photo-story__note', preset.note));
    var button = make('button', 'spv-photo-story__action', preset.action);
    button.type = 'button';
    button.setAttribute('aria-label', preset.action);
    body.appendChild(button);
    poster.append(image, eyebrow, body);

    var back = make('button', 'spv-photo-story__back', '← Вернуться к фотографии');
    back.type = 'button';
    back.hidden = true;

    var originalChildren = Array.from(host.children);
    function setMode(mode) {
      var showPhoto = mode === 'photo';
      host.setAttribute('data-spv-hero-mode', showPhoto ? 'photo' : 'model');
      poster.hidden = !showPhoto;
      back.hidden = showPhoto;
      originalChildren.forEach(function (node) { node.inert = showPhoto; });
      if (!showPhoto) back.focus({preventScroll: true});
      else button.focus({preventScroll: true});
    }
    button.addEventListener('click', function () { setMode('model'); });
    back.addEventListener('click', function () { setMode('photo'); });

    host.append(poster, back);
    originalChildren.forEach(function (node) { node.inert = true; });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
}());
