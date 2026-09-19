"""Generate the static site from shared components and migrated content.
Usage: python scripts/build.py (stdlib only). GitHub Pages needs no runtime/build.
"""
from pathlib import Path
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content.json').read_text())
E = escape
ICONS = {
 'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
 'up': '<path d="M6 18L18 6M6 6h12v12"/>',
 'home': '<path d="M3 10l9-7 9 7v10H3zM9 20v-7h6v7"/>',
 'grid': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 'spark': '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
 'chat': '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0zM7 10h10M7 14h6"/>',
 'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 'back': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
}
def icon(name='arrow'):
    return f'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'
def btn(text, href, cls='', ico='arrow'):
    return f'<a class="btn {cls}" href="{E(href)}">{E(text)}{icon(ico)}</a>'
def eye(text):
    return f'<div class="eyebrow"><span class="dot"></span>{E(text)}</div>'
def category(page):
    cat = page.get('category','')
    return {'AI / ML':'ai','Автоматизация':'automation','Backend':'backend','Web / Full-stack':'web','Telegram / боты':'telegram','Сайты':'sites'}.get(cat,'web')
LABELS = {'all':'Все','ai':'ИИ','automation':'Автоматизация','web':'Приложения','sites':'Сайты','telegram':'Боты','backend':'Системы'}
def art(path):
    p = DATA[path]; cat = category(p)
    mode = 'lecture' if path == 'case-mgd.html' or cat=='ai' else 'document' if cat in ('automation','backend') else 'chat' if cat=='telegram' else 'site' if cat=='sites' else 'crm'
    color = 'violet' if mode in ('lecture','chat') else 'green' if mode=='document' else 'neutral'
    top = '<div class="art-top"><span>ASINA / '+ {'lecture':'КОНСПЕКТ','document':'ДОКУМЕНТЫ','crm':'WORKSPACE','chat':'АССИСТЕНТ','site':'WEB EXPERIENCE'}[mode]+'</span><span class="art-dots"><i></i><i></i><i></i></span></div>'
    if mode=='lecture':
        body = '<div class="art-video"><div class="art-play">▷</div><div class="art-lines"><i></i><i></i><i></i></div></div><div class="art-top"><span>Главное — уже здесь</span><span>✦</span></div><div class="art-lines"><i></i><i></i><i></i></div>'
    elif mode=='document':
        body = '<div class="art-table">'+''.join(f'<span>{v}</span>' for v in ['Наименование','Кол-во','Статус','Бумага А4','12','✓ Проверено','Картридж','3','✓ Проверено','Папка','24','✓ Проверено'])+'</div>'
    elif mode=='crm':
        body = '<div class="art-kanban">'+''.join(f'<div>{t}<div class="art-task">{d}</div></div>' for t,d in [('Новые','Заказ #104<br>Москва → Тверь'),('В работе','Заказ #102<br>Маршрут готов'),('Готово','Заказ #098<br>Доставлен ✓')])+'</div>'
    elif mode=='chat':
        body = '<div class="art-chat"><span>Поможешь с новым заказом?</span><span>Конечно. Давайте уточним задачу ✦</span><span>Собрать заявку и передать в CRM</span></div>'
    else:
        body = f'<div class="art-site-title">{E(p["title"])}</div><div class="art-lines"><i></i><i></i></div><div class="art-site-bottom"></div>'
    return f'<div class="project-art art-{color}" aria-hidden="true"><div class="art-shell">{top}{body}</div></div>'
def card(path):
    p = DATA[path]; code=path.removeprefix('case-').removesuffix('.html').upper()
    return f'<a class="project-card reveal" href="{path}" data-category="{category(p)}">{art(path)}<div class="project-meta"><span>{LABELS[category(p)]}</span><span>{E(code)}</span></div><h3>{E(p["title"])}</h3><p>{E(p["description"])}</p></a>'
def contact_panel():
    return f'<section class="wrap"><div class="contact-panel reveal"><div>{eye("Давайте знакомиться")}<h2>Есть идея?<br>Давайте сделаем.</h2><p>Можно без ТЗ. Начнём с того, что хочется изменить.</p></div>{btn("Обсудить задачу","contacts.html","primary")}</div></section>'
def shell(path, body, title=None, description=None):
    p = DATA.get(path,{})
    title = title or p.get('title','SPV ASINA')
    description = description or p.get('description') or 'Павел Асина — сайты, приложения, ИИ и автоматизация. От вашей задачи до работающего продукта.'
    active = 'cases.html' if path.startswith('case-') else 'services.html' if path in ['automation.html','backend.html','web.html','ml.html','new-product.html','existing-product.html'] else path
    nav=''.join(f'<a href="{f}"'+(' aria-current="page"' if active==f else '')+f'>{t}</a>' for f,t in [('cases.html','Проекты'),('services.html','Решения'),('about.html','Обо мне')])
    mobile=''.join(f'<a href="{f}"'+(' aria-current="page"' if active==f else '')+f'>{icon(i)}<span>{t}</span></a>' for f,t,i in [('index.html','Главная','home'),('cases.html','Проекты','grid'),('services.html','Решения','spark'),('contacts.html','Написать','chat')])
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>{E(title)} — SPV ASINA</title><meta name="description" content="{E(description)}"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f7f7f2"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="canonical" href="https://spv-asina.github.io/asina/{'' if path=='index.html' else path}"><meta property="og:title" content="{E(title)} — SPV ASINA"><meta property="og:description" content="{E(description)}"><meta property="og:type" content="website"><script src="assets/theme.js"></script><link rel="stylesheet" href="assets/style.css"><script src="assets/app.js" defer></script></head>
<body><a class="skip" href="#main">К содержимому</a><header class="topbar"><div class="wrap topbar-inner"><a class="brand" href="index.html" aria-label="SPV ASINA — главная"><span class="brand-mark">a</span>asina<span style="color:var(--accent)">.</span><small>Цифровые продукты</small></a><nav class="desktop-nav" aria-label="Основная навигация">{nav}</nav><div class="header-actions"><button class="theme-toggle" aria-label="Переключить тему" title="Переключить тему">{icon('sun')}</button>{btn('Обсудим проект','contacts.html','small')}</div></div></header>
<main id="main">{body}</main><footer class="footer"><div class="wrap footer-inner"><span>© 2026 SPV ASINA · Сделано с вниманием к деталям.</span><div class="footer-links"><a href="https://t.me/spv_asina">Telegram ↗</a><a href="mailto:spv_asina@mail.ru">Почта ↗</a><a href="privacy.html">Конфиденциальность</a></div></div></footer><nav class="mobile-nav" aria-label="Мобильная навигация">{mobile}</nav><div class="toast" role="status" hidden></div></body></html>'''
def demo():
    return '''<div class="demo-dock"><div class="demo-tabs" role="tablist" aria-label="Примеры решений"><button id="tab-document" role="tab" aria-selected="true" aria-controls="demo-panel" data-demo="document">Документ</button><button id="tab-lecture" role="tab" aria-selected="false" aria-controls="demo-panel" tabindex="-1" data-demo="lecture">Лекция</button><button id="tab-crm" role="tab" aria-selected="false" aria-controls="demo-panel" tabindex="-1" data-demo="crm">Заказы</button></div><div class="demo-view" id="demo-panel" role="tabpanel" aria-labelledby="tab-document" tabindex="0"><div class="demo-file" aria-hidden="true">▤<span></span><span></span><span></span></div><span class="demo-flow-arrow" aria-hidden="true">→</span><div class="demo-result"><div class="demo-result-head"><b>Накладная → таблица</b><span>✓ Готово</span></div><div class="demo-row"><span>Бумага А4 · 12 шт.</span><span>Проверено</span></div><div class="demo-row"><span>Картридж · 3 шт.</span><span>Проверено</span></div></div></div><div class="demo-caption"><span>Демо · тестовые данные</span><span>Попробуйте переключить ↗</span></div></div>'''
def home():
    mascot=(ROOT/'assets/mascot-personal.svg').read_text().replace('<svg ', '<svg aria-hidden="true" ')
    return f'''<section class="hero wrap"><div class="hero-grid"><div class="hero-copy">{eye('Павел Асина · независимый разработчик')}<h1>Сложные задачи.<br><em>Простые</em><br>решения.</h1><p class="hero-description">Превращаю идеи в сайты, приложения и ИИ-инструменты, которыми удобно пользоваться.</p><div class="actions">{btn('Смотреть проекты','cases.html','primary')}{btn('Есть задача','contacts.html','ghost','up')}</div><div class="hero-note"><i>✓</i> Лично веду проект — от идеи до запуска</div></div><div class="playground"><div class="playground-top"><span>МАЛЕНЬКАЯ ЛАБОРАТОРИЯ</span><span class="live-label"><span class="dot green-dot"></span>Можно трогать</span></div><div class="mascot-stage"><div class="orbital"></div><span class="orbit-star" aria-hidden="true">✦</span><span class="mascot-chip">Привет! Я Аси 👋</span><button class="mascot-button" aria-label="Поздороваться с Аси — интерактивным персонажем">{mascot}</button><span class="mascot-chip right">Идея → работает</span><span class="mascot-hint">СЛЕЖУ ЗА ВАШИМИ ИДЕЯМИ</span></div>{demo()}</div></div><div class="hero-bottom"><span>Чуть меньше рутины. Чуть больше возможностей.</span><span>Листайте, дальше — интереснее {icon('arrow')}</span></div></section>
<section class="section wrap" id="cases"><div class="section-head"><div>{eye('01 / Избранные проекты')}<h2>Не просто красиво.<br>Полезно.</h2></div><a class="text-link" href="cases.html" aria-label="Все проекты">Все проекты {icon('up')}</a></div><div class="project-grid">{''.join(card(x) for x in ['case-mgd.html','case-shp.html','case-fpl.html'])}</div><div class="projects-foot"><span>Превью — иллюстрации сценариев на тестовых данных.</span><a class="text-link" href="cases.html">Найти похожую задачу {icon()}</a></div></section>
{solutions_section()}
<section class="section wrap"><div class="about-grid"><div class="about-copy">{eye('03 / Человек за интерфейсом')}<h2>Привет, я Павел.<br>Будем знакомы.</h2><p>Помогаю пройти путь от «а что, если…» до работающего продукта. Объясняю решения простым языком и показываю результат по ходу работы.</p><a class="text-link" href="about.html">Немного обо мне {icon('up')}</a></div><div class="about-card reveal"><div><span class="about-small">ОТ ПЕРВОЙ ИДЕИ ДО ЗАПУСКА</span><div class="about-monogram">ПА.</div><h3>Один проект.<br>Личный подход.</h3><p>На связи напрямую, без цепочки менеджеров.</p></div><span style="font-size:75px;color:var(--accent)" aria-hidden="true">✳</span></div></div>{process()}</section>{contact_panel()}'''
def solutions_section():
    items=[('01','Убрать ручную работу','Документы, таблицы и сервисы работают вместе.','automation.html'),('02','Добавить умного помощника','ИИ для поиска, общения и обработки информации.','ml.html'),('03','Запустить свой продукт','От первого прототипа до полноценного приложения.','web.html'),('04','Сделать выразительный сайт','Чтобы вас понимали, запоминали и выбирали.','cases.html?category=sites')]
    rows=''.join(f'<a class="solution-row" href="{url}"><span>{n}</span><div><h3>{title}</h3><p>{desc}</p></div>{icon("up")}</a>' for n,title,desc,url in items)
    return f'<section class="section solutions"><div class="wrap solution-grid"><div class="solution-intro">{eye("02 / Начнём с вашей задачи")}<h2>Что хочется<br>изменить?</h2><p>Не обязательно знать название технологии. Достаточно понимать, что должно стать лучше.</p></div><div class="solution-list">{rows}</div></div></section>'
def process():
    return '<div class="process">'+''.join(f'<div class="process-item"><span>{n}</span><h3>{t}</h3><p>{d}</p></div>' for n,t,d in [('01','Разберёмся в задаче','Обсудим цель, ограничения и первый полезный результат.'),('02','Соберём и проверим','Покажу промежуточные версии. Проверим реальные сценарии.'),('03','Запустим и передадим','Код, инструкции и понятный план дальнейшего развития.')])+'</div>'
def page_head(label,title,desc=''):
    return f'<div class="wrap"><div class="page-head">{eye(label)}<h1>{E(title)}</h1>{f"<p>{E(desc)}</p>" if desc else ""}</div></div>'
def catalog():
    order=['case-mgd.html','case-shp.html','case-fpl.html']+[p for p in DATA if p.startswith('case-') and p not in ['case-mgd.html','case-shp.html','case-fpl.html']]
    filters=''.join(f'<button class="filter-btn" data-filter="{key}" aria-pressed="{str(key=="all").lower()}">{label}</button>' for key,label in LABELS.items())
    return page_head('Портфолио','Вместо тысячи слов — работа.','Выберите то, что ближе к вашей задаче. Подробности и техническая часть — внутри каждого проекта.')+f'<section class="wrap section compact"><div class="filter-bar" role="group" aria-label="Категории проектов">{filters}</div><p class="catalog-count" role="status">{len(order)} проектов · превью на тестовых данных</p><div class="project-grid catalog-grid" data-catalog>{"".join(card(p) for p in order)}</div><div class="empty" hidden>В этой категории пока нет проектов.</div><div class="load-more"><button class="btn ghost" data-more hidden>Показать ещё {icon()}</button></div></section>'+contact_panel()
def case(path):
    p=DATA[path]
    task=next((s for s in p['sections'] if s['title']=='Что требовалось изменить'),None)
    summary=''.join(f'<p>{E(x)}</p>' for x in (task['paragraphs'][:2] if task else [p['description']]))
    details=''.join(f'<details class="disclosure"><summary>{E(s["title"])}</summary><div class="disclosure-content">'+''.join(f'<p>{E(x)}</p>' for x in s['paragraphs'])+'</div></details>' for s in p['sections'] if s.get('paragraphs'))
    original = btn('Открыть оригинальную демонстрацию',f'demos/{path}','ghost','up') if path.startswith('case-site-') else ''
    return f'<div class="wrap"><div class="page-head"><a class="back-link" href="cases.html" data-back-catalog>{icon("back")}К проектам</a>{eye(LABELS[category(p)])}<h1>{E(p["title"])}</h1><p>{E(p["description"])}</p></div><div class="case-layout">{art(path)}<div class="case-summary"><div>{eye("Задача → решение")}<h2>Что меняется<br>для пользователя</h2>{summary}</div><div>{btn("Хочу похожее решение",f"contacts.html?project={path.removesuffix('.html')}","primary")}</div><p style="font-size:11px">Превью иллюстрирует сценарий на тестовых данных, это не рабочая система клиента.</p>{original}</div></div><section class="detail-block"><h2>Под капотом</h2><p style="margin-bottom:20px;font-size:13px">Сохранённые подробности проекта: от задачи до проверки результата.</p>{details}</section></div>'+contact_panel()
def services(path):
    definitions={
      'services.html':('Решения','Технологии — внутри. Польза — снаружи.','Выберите задачу. Вместе определим, какое решение действительно нужно.'),
      'automation.html':('Автоматизация','Пусть рутина работает сама.','Документы превращаются в данные, сервисы обмениваются информацией, а у команды остаётся время на важное.'),
      'ml.html':('Искусственный интеллект','ИИ, у которого есть работа.','Поиск по документам, помощники, конспекты и анализ информации. Начинаем с задачи, а не с модного названия.'),
      'web.html':('Приложения','Ваша идея. Рабочий продукт.','Внутренний сервис, CRM или новая платформа — с понятным интерфейсом и нужными функциями.'),
      'backend.html':('Системы','Надёжная основа вашего продукта.','Соединяем данные, сервисы и процессы, чтобы всё работало как одна система.'),
      'new-product.html':('Новый продукт','Из «хочу сделать» — в «можно попробовать».','Выделим главный сценарий и соберём первую полезную версию без лишнего объёма.'),
      'existing-product.html':('Развитие продукта','Хороший продукт может больше.','Добавим возможности, свяжем сервисы и разберёмся с тем, что мешает работать.')}
    label,title,desc=definitions[path]
    cat={'automation.html':'automation','ml.html':'ai','web.html':'web','backend.html':'backend'}.get(path)
    chosen=[p for p in DATA if p.startswith('case-') and (not cat or category(DATA[p])==cat)][:3]
    return page_head(label,title,desc)+(solutions_section() if path=='services.html' else '')+f'<section class="wrap section compact"><div class="section-head"><h2>Как это может выглядеть</h2></div><div class="project-grid">'+''.join(card(x) for x in chosen)+f'</div>{process()}</section>'+contact_panel()
def about():
    return page_head('Лично веду ваш проект','Я Павел. Делаю сложное понятным.','Разработчик цифровых продуктов: от первого разговора до запуска и передачи исходников.')+f'<section class="wrap section compact"><div class="about-grid"><div class="about-card"><div><span class="about-small">SPV ASINA</span><div class="about-monogram">ПА.</div><h3>Шилов Павел Васильевич</h3><p>Разработка · ИИ · Автоматизация</p></div></div><div class="about-copy"><h2>Разговор — на вашем языке.</h2><p>Вам не нужно разбираться во фреймворках, чтобы понимать, что происходит с проектом. Сначала обсуждаем результат, затем выбираем инструменты.</p><p style="margin-top:16px">Работаем по этапам: фиксируем объём, показываем промежуточный результат и проверяем то, что действительно важно.</p></div></div>{process()}</section><section class="wrap detail-block"><h2>Если хочется подробнее</h2>'+''.join(f'<details class="disclosure"><summary>{E(s["title"])}</summary><div class="disclosure-content">'+''.join(f'<p>{E(x)}</p>' for x in s['paragraphs'])+'</div></details>' for s in DATA['about.html']['sections'] if s['paragraphs'])+'</section>'+contact_panel()
def contacts():
    return page_head('Начнём с разговора','Что будем создавать?','Несколько коротких вопросов — и первый шаг уже сделан.')+f'''<section class="wrap brief-layout"><aside class="brief-aside">{eye('Без обязательного брифа')}<h2>Можно просто<br>написать.</h2><p>Расскажите, что есть сейчас и что хочется изменить. Техническое задание необязательно.</p><div class="contact-direct"><a class="text-link" href="https://t.me/spv_asina">Telegram · @spv_asina {icon('up')}</a><a class="text-link" href="mailto:spv_asina@mail.ru">spv_asina@mail.ru {icon('up')}</a></div><p style="font-size:11px;margin-top:22px">Стоимость и сроки обсуждаем после знакомства с задачей. Не обещаю оценку без понимания объёма.</p></aside><div class="brief-card" data-brief><div class="eyebrow" data-step-label>Шаг 1 из 3</div><div class="brief-progress" aria-hidden="true"><i class="active"></i><i></i><i></i></div><section data-step="1"><h2 tabindex="-1">С чего начнём?</h2><p>Выберите ближайший вариант. Детали уточним позже.</p><div class="choice-grid">{''.join(f'<button class="choice" data-choice="{E(t)}" aria-pressed="false">{E(t)}</button>' for t in ['Сайт','Приложение','ИИ-помощник','Автоматизация','Развитие продукта','Пока не знаю'])}</div><div class="brief-actions"><span></span><button class="btn primary" data-next>Дальше {icon()}</button></div></section><section data-step="2" hidden><h2 tabindex="-1">Немного о задаче</h2><label class="field-label" for="brief-description">Что должно стать лучше?</label><textarea id="brief-description" maxlength="1500" placeholder="Например: заявки приходят из разных каналов. Хочу видеть их в одном месте."></textarea><p class="form-error" role="alert"></p><div class="brief-actions"><button class="btn ghost" data-prev>Назад</button><button class="btn primary" data-next>Собрать обращение {icon()}</button></div></section><section data-step="3" hidden><h2 tabindex="-1">Готово к знакомству.</h2><p>Проверьте текст. Он ещё никуда не отправлен.</p><div class="brief-result" tabindex="0"></div><div class="brief-actions"><button class="btn ghost" data-copy>Скопировать</button><a class="btn primary" data-send href="https://t.me/spv_asina">В Telegram {icon('up')}</a><button class="text-link" data-prev style="background:none">← Изменить</button></div><p class="brief-notice">Если Telegram не подставит текст, скопируйте его и вставьте в сообщение.</p></section><p class="brief-notice">Черновик хранится только в этом браузере. <button data-clear style="padding:6px 0;background:none;text-decoration:underline">Удалить черновик</button></p><noscript><p class="no-js-note">Для пошагового брифа нужен JavaScript. Напишите напрямую в Telegram или на почту — ссылки рядом.</p></noscript></div></section>'''
def privacy():
    return page_head('Ваши данные','Без лишнего сбора данных.','Коротко о том, что сохраняет эта версия сайта.')+'''<section class="wrap detail-block"><details class="disclosure" open><summary>Тема и черновик</summary><div class="disclosure-content"><p>Выбранная тема и черновик обращения сохраняются в localStorage вашего браузера. Они не передаются владельцу сайта автоматически. Черновик можно удалить кнопкой в форме, остальные настройки — очисткой данных сайта.</p></div></details><details class="disclosure" open><summary>Обращение</summary><div class="disclosure-content"><p>Сайт не отправляет форму на сервер. Кнопка Telegram открывает внешний сервис с подготовленным текстом. Сообщение отправляете вы самостоятельно. Не указывайте пароли, платёжные реквизиты и другие чувствительные сведения.</p></div></details><details class="disclosure"><summary>Внешние сервисы</summary><div class="disclosure-content"><p>Страницы размещены на GitHub Pages. Шрифт загружается с Google Fonts; если он недоступен, используется системный. Эти сервисы могут получать технические данные запросов, включая IP-адрес. При переходе в Telegram действуют его правила. В новую версию не добавлены рекламные трекеры и аналитика.</p></div></details><details class="disclosure"><summary>Вопросы</summary><div class="disclosure-content"><p>По вопросам о сайте и данных: <a href="mailto:spv_asina@mail.ru">spv_asina@mail.ru</a>.</p></div></details></section>'''
for path in DATA:
    if path=='index.html': body=home()
    elif path=='cases.html': body=catalog()
    elif path.startswith('case-'): body=case(path)
    elif path=='contacts.html': body=contacts()
    elif path=='about.html': body=about()
    elif path=='privacy.html': body=privacy()
    elif path=='404.html': body=f'<section class="wrap error-page">{eye("Ошибка 404")}<h1>Кажется, мы<br>заблудились.</h1><p>Такой страницы нет. Но проекты и новые идеи никуда не делись.</p><div class="actions">{btn("На главную","/asina/index.html","primary")}{btn("К проектам","/asina/cases.html","ghost")}</div></section>'
    else: body=services(path)
    output=shell(path,body,title='Сложные задачи. Простые решения.' if path=='index.html' else None)
    output=output.replace('Шрифт загружается с Google Fonts; если он недоступен, используется системный. Эти сервисы могут получать технические данные запросов, включая IP-адрес.', 'Шрифт размещён вместе с сайтом, без обращения к Google Fonts. Хостинг может получать технические данные запросов, включая IP-адрес.')
    if path=='404.html': output=output.replace('<head>', '<head><base href="/asina/">',1)
    (ROOT/path).write_text(output)
print(f'Built {len(DATA)} pages. Shared CSS, JavaScript and vector mascot. No runtime dependencies.')
