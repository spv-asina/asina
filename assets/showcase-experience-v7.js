/* SPV ASINA / eleven bespoke standalone showcase homepages, v7.
   Original interactive product models and all downstream sections remain intact. */
(function () {
  'use strict';
  var DATA = {
    lexforma: {
      name:'LEXFORMA', field:'ЮРИДИЧЕСКОЕ БЮРО', no:'01',
      title:['Сильная','позиция.'],
      lead:'Договоры, конфликты и решения, в которых важны детали. Показываем логику до того, как начинается спор.',
      primary:['Разобрать ситуацию','#lex-route'],
      model:'Открыть карту спора', more:['Практики','#lex-practices'],
      photo:'photo-1497366811353-6870744d04b2',
      caption:'Решение начинается с ясности', series:['Анализ','Стратегия','Защита']
    },
    aeris: {
      name:'AERIS', field:'ЦИФРОВАЯ СТОМАТОЛОГИЯ', no:'02',
      title:['Естественно.','Точно.'],
      lead:'Эстетика без шаблонных решений. Сначала диагностика и понятный план, затем бережное лечение.',
      primary:['Подобрать маршрут','#aer-route'],
      model:'Открыть 3D-модель', more:['Наш подход','#aer-system'],
      photo:'photo-1704455306251-b4634215d98f',
      caption:'Улыбка с характером', series:['Диагностика','Планирование','Эстетика']
    },
    meridian: {
      name:'MERIDIAN', field:'ЧАСТНЫЙ КАПИТАЛ', no:'03',
      title:['Капитал','требует ясности.'],
      lead:'Структурируем сложные финансовые решения через цели, горизонты и понятные сценарии.',
      primary:['Построить сценарий','#mer-planner'],
      model:'Открыть модель', more:['Архитектура','#mer-architecture'],
      photo:'photo-1486406146926-c627a92ad1ab',
      caption:'Долгий горизонт. Точные решения.', series:['Сохранить','Развить','Передать']
    },
    axis: {
      name:'ОСЬ', field:'АРХИТЕКТУРА И СТРОИТЕЛЬСТВО', no:'04',
      title:['Форма','следует смыслу.'],
      lead:'Пространства создаются не ради картинки. Они начинаются с контекста, человека и задач.',
      primary:['Смотреть проекты','#axis-projects'],
      model:'Открыть чертёж', more:['Метод','#axis-system'],
      photo:'photo-1487958449943-2429e8be8625',
      caption:'Контекст / Конструкция / Человек', series:['Замысел','Материал','Результат']
    },
    verdict: {
      name:'VERDICT', field:'БЮРО СЛОЖНЫХ СПОРОВ', no:'05',
      title:['Не эмоция.','Позиция.'],
      lead:'Сложные споры требуют собранной картины: фактов, доказательств, сроков и выверенной стратегии.',
      primary:['Выбрать ситуацию','#situations'],
      more:['Увидеть метод','#method'],
      photo:'photo-1773544015678-58d09366ad6e',
      caption:'Факты сильнее предположений', series:['Позиция','Доказательства','Решение']
    },
    atelier: {
      name:'ATELIER DENTAIRE', field:'ЭСТЕТИЧЕСКАЯ СТОМАТОЛОГИЯ', no:'06',
      title:['Красота','в деталях.'],
      lead:'Не одинаковые улыбки, а точная работа с формой, функцией и индивидуальными особенностями.',
      primary:['Узнать подход','#approach'],
      model:'Открыть диагностику', more:['Услуги','#services'],
      photo:'photo-1745434159123-5b99b94206ca',
      caption:'Естественная эстетика начинается с точного плана', series:['Форма','Функция','Баланс']
    },
    monolith: {
      name:'MONOLITH', field:'АРХИТЕКТУРНОЕ БЮРО', no:'07',
      title:['Не просто дом.','Ваш мир.'],
      lead:'Архитектура как продолжение образа жизни. Материалы, свет и пропорции образуют единое целое.',
      primary:['Смотреть проекты','#m-projects'],
      model:'Открыть объёмную модель', more:['Подход','#m-method'],
      photo:'photo-1600607687920-4e2a09cf159d',
      caption:'Пространство, к которому хочется возвращаться', series:['Свет','Форма','Тишина']
    },
    lumen: {
      name:'LUMEN', field:'СОВРЕМЕННЫЙ ТЕАТР', no:'08',
      title:['Свет','говорит.'],
      lead:'Театр — это встреча. Текст, тишина и движение каждый вечер складываются в новую историю.',
      primary:['Смотреть репертуар','#l-repertoire'],
      more:['Посетить театр','#l-visit'],
      photo:'photo-1507676184212-d03ab07a01bf',
      caption:'Когда память становится сценой', series:['Постановки','Программа','Встречи']
    },
    kinetic: {
      name:'KINETIC', field:'МУЗЕЙ СОВРЕМЕННОГО ДВИЖЕНИЯ', no:'09',
      title:['Не смотри.','Действуй.'],
      lead:'Пространство, где жест, свет и движение меняют саму экспозицию.',
      primary:['Открыть выставку','#k-exhibition'],
      model:'Включить сцену', more:['Спланировать визит','#k-visit'],
      photo:'photo-1531058020387-3be344556be6',
      caption:'Вы — часть экспоната', series:['Движение','Свет','Ощущение']
    },
    bloom: {
      name:'BLOOM', field:'ДЕТСКИЙ ЦЕНТР РАЗВИТИЯ', no:'10',
      title:['Маленькие','открытия.'],
      lead:'Здесь интерес важнее правильного ответа. Пробуем, играем, удивляемся — каждый в своём ритме.',
      primary:['Выбрать программу','#bl-programs'],
      model:'Открыть карту занятий', more:['Один день','#bl-day'],
      photo:'photo-1503454537195-1dcabb73ffb9',
      caption:'Детство — время открытий', series:['Исследовать','Создавать','Расти']
    },
    lapka: {
      name:'ЛАПКА', field:'ВЕТЕРИНАРНАЯ КЛИНИКА', no:'11',
      title:['Забота','по-настоящему.'],
      lead:'Когда питомцу нужна помощь, важно понимать каждый шаг. Без лишней тревоги и сложных слов.',
      primary:['Выбрать услугу','#lap-services'],
      model:'Посмотреть маршрут визита', more:['Срочная помощь','#lap-urgent'],
      photo:'photo-1556647034-7aa9a4ea7437',
      caption:'Для тех, кто часть семьи', series:['Бережно','Понятно','Рядом']
    }
  };
  var HERO = {
    lexforma:'.lex-hero',aeris:'.aer-hero',meridian:'.mer-hero',
    axis:'.axis-hero',verdict:'.verdict-hero',atelier:'main > .hero',
    monolith:'.m-hero',lumen:'.l-hero',kinetic:'.k-hero',
    bloom:'.bl-hero',lapka:'.lap-hero'
  };
  var MODEL = {
    lexforma:'.lex-case-board',aeris:'.aer-twin',
    meridian:'.mer-capital-map',axis:'.axis-drawing',
    atelier:'.scan',monolith:'.m-hero-model',kinetic:'.k-signal-field',
    bloom:'.bl-atlas',lapka:'.lap-record'
  };
  var brand = document.documentElement.getAttribute('data-spv-showcase');
  var d = DATA[brand];
  if (!d) return;
  document.documentElement.classList.add('v7-experience');

  function mk(tag, classname, txt) {
    var el = document.createElement(tag);
    if (classname) el.className=classname;
    if (txt !== undefined) el.textContent=txt;
    return el;
  }
  function a(text,href,cls) {
    var el=mk('a',cls||'',text);
    el.href=href;
    return el;
  }
  function init() {
    if (document.querySelector('[data-v7-hero]')) return true;
    var old=document.querySelector(HERO[brand]);
    if (!old) return false;
    var hero=mk('section','v7-hero v7-'+brand);
    hero.setAttribute('data-v7-hero','');
    hero.setAttribute('aria-label','Главная — '+d.name);
    hero.id='v7-hero';
    var over=mk('div','v7-noise');
    over.setAttribute('aria-hidden','true');
    var rail=mk('div','v7-rail');
    rail.append(mk('span','v7-rail-index',d.no+' / 11'),mk('span','v7-rail-title',d.name),mk('span','v7-rail-vertical','КОНЦЕПТ · 2026'));
    var grid=mk('div','v7-grid');
    var copy=mk('div','v7-copy');
    copy.append(mk('div','v7-eyebrow',d.field));
    var h=mk('h1','v7-title');
    h.append(mk('span','',d.title[0]),mk('em','',d.title[1]));
    copy.append(h,mk('p','v7-lead',d.lead));
    var acts=mk('div','v7-actions');
    acts.append(a(d.primary[0],d.primary[1],'v7-btn v7-btn-primary'));
    if(d.model) {
      var button=mk('button','v7-btn v7-btn-secondary',d.model);
      button.type='button';button.setAttribute('data-v7-open','');
      button.setAttribute('aria-controls','v7-original-demo');
      button.setAttribute('aria-expanded','false');
      acts.append(button);
    } else {
      acts.append(a(d.more[0],d.more[1],'v7-btn v7-btn-secondary'));
    }
    copy.append(acts);
    var fine=mk('div','v7-micro');
    fine.append(mk('span','v7-micro-rule'),mk('span','v7-micro-text','Демонстрационный проект · данные и бренд вымышлены'));
    copy.append(fine);
    var fig=mk('figure','v7-media');
    var img=mk('img','v7-image');
    img.alt='Иллюстрация концепции '+d.name;
    img.loading='eager';img.decoding='async';img.fetchPriority='high';
    var base='https://images.unsplash.com/'+d.photo+'?auto=format&fit=crop';
    img.sizes='(max-width: 760px) 100vw, (max-width: 1100px) 85vw, 65vw';
    img.srcset=[480,760,1080,1600].map(function(w){return base+'&w='+w+'&q=78 '+w+'w';}).join(', ');
    img.src=base+'&w=1080&q=78';
    img.addEventListener('error',function(){fig.classList.add('v7-media-fallback');},{once:true});
    fig.append(img);
    var figcap=mk('figcaption','v7-caption');
    figcap.append(mk('span','v7-caption-index',d.no+' — '+d.name),mk('span','v7-caption-text',d.caption));
    fig.append(figcap);
    var seal=mk('span','v7-seal',d.name+' / SHOWCASE');
    seal.setAttribute('aria-hidden','true');
    fig.append(seal);
    grid.append(copy,fig);
    var foot=mk('div','v7-footer');
    var steps=mk('div','v7-points');
    d.series.forEach(function(x,i){
      var el=mk('span','v7-point');
      el.append(mk('b','',String(i+1).padStart(2,'0')),mk('span','',x));
      steps.append(el);
    });
    foot.append(steps,a('Листать дальше ↓',d.more[1],'v7-scroll'));
    hero.append(over,rail,grid,foot);
    old.before(hero);
    old.classList.add('v7-original-hero');
    old.id='v7-original-demo';
    old.hidden=true;
    var bar=mk('div','v7-demo-bar');
    var description=mk('div','v7-demo-bar-text');
    description.append(mk('span','','ИНТЕРАКТИВНОЕ ДЕМО'),mk('strong','',d.name+' — интерфейс в работе'));
    bar.append(description);
    var close=mk('button','v7-demo-close','Закрыть пример ↑');
    close.type='button';
    close.setAttribute('data-v7-close','');
    bar.append(close);
    old.insertBefore(bar,old.firstChild);
    var modelSel=MODEL[brand];
    if(modelSel) {
      var model=document.querySelector(modelSel);
      if(model) {
        model.classList.add('v7-model-node');
        model.setAttribute('data-spv-hero-mode','model');
        model.querySelectorAll('.spv-photo-story,.spv-photo-story__back').forEach(function(n){n.remove();});
        Array.from(model.children).forEach(function(n){n.inert=false;});
      }
    }
    var trigger=hero.querySelector('[data-v7-open]');
    function setExpanded(expanded) {
      old.hidden=!expanded;
      old.classList.toggle('v7-show-demo',expanded);
      if(trigger) trigger.setAttribute('aria-expanded',String(expanded));
      if(expanded) {
        requestAnimationFrame(function(){
          old.scrollIntoView({behavior:'smooth',block:'start'});
          close.focus({preventScroll:true});
        });
      } else {
        hero.scrollIntoView({behavior:'smooth',block:'start'});
        if(trigger)trigger.focus({preventScroll:true});
      }
    }
    if(trigger)trigger.addEventListener('click',function(){setExpanded(true);});
    close.addEventListener('click',function(){setExpanded(false);});
    // Existing navigation and sub-page interactions stay under Preact control.
    return true;
  }
  if(!init()) {
    var observer=new MutationObserver(function(){if(init())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }
}());