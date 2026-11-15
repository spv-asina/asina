/* SPV ASINA — interactive product sandboxes.
 * Each demo runs in-browser with synthetic data and no network, keys, or real customer records.
 * The existing "Как работает" tab remains available.
 */
(() => {
  'use strict';
  const T = (id, label, value, placeholder) => ({id,label,type:'text',value,placeholder:placeholder||''});
  const N = (id, label, value, min, max) => ({id,label,type:'number',value,min,max});
  const S = (id, label, value, options) => ({id,label,type:'select',value,options:options.map(x=>Array.isArray(x)?x:[x,x])});
  const A = (id,label,value) => ({id,label,type:'textarea',value});
  const B = (id,label,value) => ({id,label,type:'check',value});
  const def = (name,hint,fields,actions) => ({name,hint,fields,actions:actions.map(x=>Array.isArray(x)?x:[x,x])});
  const CASES = {
    APG:def('API Gateway · запросы','Проверяйте авторизацию, маршрутизацию и лимит запросов.',[
      S('route','Маршрут','/api/orders',['/api/orders','/api/admin','/health']),
      S('token','Авторизация','valid',[['valid','Корректный токен'],['missing','Без токена'],['expired','Истёкший токен']]),
      N('count','Запросов подряд',3,1,20)], [['request','Отправить запросы'],['quota','Сбросить лимит']]),
    BTA:def('CRM · квалификация лида','Соберите BANT-профиль и создайте тестовую карточку CRM.',[
      T('company','Компания','ООО Спектр'),N('budget','Бюджет, ₽',500000,0,10000000),
      S('authority','Контакт','ЛПР',[['ЛПР','Принимает решение'],['сотрудник','Сотрудник']]),
      S('timing','Запуск','2 месяца',['2 месяца','полгода','пока неизвестно']),
      T('need','Задача','Автоматизировать входящие обращения')],[['qualify','Оценить лид'],['transfer','Передать в CRM']]),
    CCH:def('Омниканальный inbox','Выбирайте диалог, отвечайте и закрывайте обращения.',[
      S('channel','Канал','Telegram',['Telegram','WhatsApp','Email','VK']),
      T('reply','Сообщение','Ваш запрос принят. Уточните удобное время.')],
      [['open','Открыть диалог'],['send','Отправить ответ'],['close','Закрыть обращение']]),
    CDP:def('Панель релизов','Выкатите канареечный релиз и проверьте сценарий отката.',[
      T('version','Версия','v2.4.1'),
      S('environment','Среда','staging',[['staging','Staging'],['production','Production']]),
      N('canary','Canary-трафик, %',10,1,100),
      S('health','Health-check','ok',[['ok','Успешно'],['fail','Не пройден']])],
      [['deploy','Запустить релиз'],['rollback','Откатить']]),
    DCM:def('Очистка табличных данных','Запускайте профилирование, исправление пропусков и дедупликацию.',[
      A('csv','Входные строки (имя,email)', 'Анна,anna@example.com\nОлег,oleg@example.com\nАнна,anna@example.com\nМария,\nИван,ivan@example.com'),
      S('missing','Заполнение пропусков','unknown',[['unknown','unknown@example.test'],['drop','Удалить строку']])],
      [['profile','Профилировать'],['clean','Очистить набор']]),
    DET:def('Контроль качества · CV','Выберите синтетический кадр и порог детекции.',[
      S('sample','Образец','scratch',[['scratch','Царапина'],['crack','Трещина'],['clean','Без дефекта']]),
      N('threshold','Порог уверенности, %',75,1,100)],
      [['inspect','Проверить изделие'],['accept','Подтвердить решение']]),
    DMB:def('Миграция схемы и данных','Перенесите тестовые записи и проверьте повторную синхронизацию.',[
      S('target','Целевая БД','MongoDB',['MongoDB','PostgreSQL','ClickHouse']),
      N('batch','Размер партии',25,1,100),
      S('mapping','Преобразование id','string',[['string','Строка'],['integer','Целое число']])],
      [['migrate','Выполнить миграцию'],['resync','Resync изменений']]),
    DSB:def('Синхронизация БД','Воспроизведите конфликт версий и настройте правило разрешения.',[
      T('key','Ключ записи','order-481'),
      S('policy','Приоритет','newest',[['newest','Последнее изменение'],['a','База A'],['b','База B']])],
      [['conflict','Создать конфликт'],['sync','Синхронизировать']]),
    ETL:def('ETL · инкрементальная загрузка','Запускайте партии, контролируйте checkpoint и повтор после ошибки.',[
      N('batch','Записей за запуск',30,1,200),
      S('failure','Состояние источника','ok',[['ok','Доступен'],['fail','Таймаут']])],
      [['run','Запустить ETL'],['retry','Повторить шаг']]),
    FDS:def('Проверка транзакции','Проверьте риск по детерминированным тестовым правилам (не реальная ML-модель).',[
      N('amount','Сумма, ₽',14500,1,10000000),
      S('region','Регион','RU',[['RU','Обычный регион'],['foreign','Нетипичный регион']]),
      B('newDevice','Новое устройство',true)],
      [['score','Оценить риск'],['review','Отправить на проверку']]),
    FLB:def('Feature engineering','Применяйте преобразования к выборке и сохраняйте версии.',[
      S('operation','Преобразование','scale',[['scale','Нормализация 0–1'],['log','log(1 + x)'],['clip','Ограничить максимум']]),
      N('clip','Максимум для clip',20,1,100)],
      [['calculate','Рассчитать признаки'],['version','Сохранить версию']]),
    FPL:def('Логистическая CRM','Создавайте заказы, назначайте водителя и изменяйте статус.',[
      T('client','Клиент','Северный склад'),
      S('driver','Водитель','Мария',['Мария','Алексей','Денис'])],
      [['create','Создать заказ'],['dispatch','Назначить маршрут'],['complete','Завершить заказ']]),
    FPT:def('Пакетная обработка файлов','Проверьте форматы, конвертацию и формирование архива.',[
      A('files','Файлы (через запятую)','report.csv, goods.xlsx, readme.txt, image.png'),
      S('format','Результат','json',[['json','JSON'],['csv','CSV']]),
      B('strict','Строгая проверка расширений',true)],
      [['validate','Проверить файлы'],['process','Обработать партию']]),
    IDM:def('Identity & Access','Проверяйте RBAC-политики и изменение уровня доступа.',[
      S('role','Роль','viewer',[['viewer','Читатель'],['editor','Редактор'],['admin','Администратор']]),
      S('operation','Операция','read',[['read','Чтение'],['write','Изменение'],['users','Управление пользователями']]),
      B('mfa','2FA подтверждена',false)],
      [['check','Проверить доступ'],['signIn','Войти по SSO']]),
    K8S:def('GPU scheduler','Разместите задачу с учётом памяти, очереди и приоритета.',[
      S('gpu','GPU','T4',['T4','A100']),
      N('memory','Требуется VRAM, GB',12,1,80),
      S('priority','Приоритет','normal',[['normal','Обычный'],['high','Высокий']])],
      [['submit','Добавить задачу'],['schedule','Распределить очередь'],['release','Завершить задачу']]),
    LMS:def('Учебный кабинет','Пройдите мини-тест, получите прогресс и условный сертификат.',[
      S('answer','Ответ','A',[['A','Вариант A'],['B','Вариант B'],['C','Вариант C']])],
      [['answer','Ответить'],['next','Следующий вопрос']]),
    ME:def('Калькулятор сметы','Изменяйте параметры и получайте расчёт по демонстрационным тарифам.',[
      N('area','Площадь, м²',80,1,10000),
      S('finish','Отделка','standard',[['basic','Базовая'],['standard','Стандартная'],['premium','Премиальная']]),
      N('rooms','Помещений',5,1,100)],
      [['estimate','Рассчитать смету'],['compare','Сравнить тарифы']]),
    MFE:def('Прогнозный стенд','Сравните средние цены и мини-бэктест на фиксированном наборе данных.',[
      N('window','Окно средней, свечей',5,2,10),
      S('strategy','Правило','trend',[['trend','По тренду'],['mean','Возврат к средней']])],
      [['forecast','Рассчитать'],['backtest','Проверить на истории']]),
    MGD:def('Конспект видеолекции','Работайте с текстовым фрагментом вместо настоящего ASR.',[
      A('transcript','Тестовая расшифровка','Градиентный спуск минимизирует функцию потерь. На каждом шаге вычисляется градиент. Скорость обучения влияет на сходимость. Слишком большой шаг может привести к расходимости. Для проверки используют валидационную выборку.'),
      S('style','Формат','short',[['short','Краткий конспект'],['tasks','Основные тезисы']])],
      [['summarize','Создать конспект'],['segments','Разбить на части']]),
    MPA:def('Панель микросервисов','Отключайте сервис, наблюдайте circuit breaker и восстанавливайте его.',[
      S('service','Сервис','payments',['payments','catalog','auth','notifications']),
      S('incident','Инцидент','latency',[['latency','Высокая задержка'],['down','Недоступен']])],
      [['inject','Сымитировать инцидент'],['restore','Восстановить сервис']]),
    NTF:def('Центр уведомлений','Ставьте отправки в очередь и тестируйте fallback-каналы.',[
      S('channel','Канал','Telegram',['Telegram','Email','SMS']),
      T('recipient','Получатель','demo@example.test'),
      S('template','Шаблон','order',[['order','Заказ подтверждён'],['remind','Напоминание']]),
      B('fail','Симулировать сбой канала',false)],
      [['send','Отправить'],['retry','Повторить доставку']]),
    OCS:def('OCR · распознавание накладных','Извлекайте данные из двух синтетических образцов и проверяйте поля.',[
      S('sample','Образец','one',[['one','Накладная №481'],['two','Накладная №482']]),
      T('supplier','Поставщик','ООО Поставка')],
      [['extract','Извлечь поля'],['validate','Проверить документ']]),
    PIP:def('Конструктор сценариев','Соберите webhook → преобразование → действие и выполните тест.',[
      S('trigger','Триггер','webhook',['webhook','schedule']),
      S('destination','Действие','crm',[['crm','Создать лид в CRM'],['mail','Отправить Email']]),
      A('payload','Входящий JSON','{"name":"Анна","email":"anna@example.test","source":"site"}')],
      [['validate','Проверить JSON'],['execute','Запустить сценарий']]),
    RAG:def('Учебный поиск и тесты','Поиск по мини-корпусу учебных материалов с цитированием фрагментов.',[
      T('question','Запрос','Что такое градиентный спуск?'),
      S('mode','Режим','search',[['search','Поиск ответа'],['quiz','Сгенерировать вопрос']])],
      [['search','Найти в материалах'],['quiz','Создать тест']]),
    RCC:def('Рекомендательная лента','Меняйте предпочтения и наблюдайте перерасчёт рейтинга.',[
      S('interest','Интерес','AI',['AI','Web','Backend','Data']),
      S('feedback','Позиция каталога','1',[['1','Карточка 1'],['2','Карточка 2'],['3','Карточка 3']])],
      [['recommend','Обновить ленту'],['like','Нравится'],['dislike','Не интересно']]),
    S2I:def('Маршрутизация обращений','Введите реплику, чтобы проверить классификацию намерения и fallback.',[
      T('utterance','Фраза абонента','Хочу узнать статус моего заказа')],
      [['route','Распознать намерение'],['fallback','Проверить fallback']]),
    SHP:def('Обработка накладной','Разберите тестовые позиции, сверьте сумму и передайте в учётный журнал.',[
      T('supplier','Контрагент','ООО Тестовая поставка'),
      A('items','Позиции (товар;количество;цена)','Кабель;2;1500\nКрепёж;5;180'),
      N('declared','Сумма в документе, ₽',3900,0,10000000)],
      [['extract','Разобрать документ'],['validate','Проверить сумму'],['post','Передать в учёт']]),
    SNB:def('Социальная лента','Создавайте посты, ставьте реакцию и управляйте подпиской.',[
      A('post','Текст публикации','Сегодня запустили первую рабочую версию приложения.'),
      S('audience','Видимость','public',[['public','Всем'],['followers','Подписчикам']])],
      [['publish','Опубликовать'],['like','Поставить лайк'],['follow','Подписаться']]),
    STB:def('Видеоплатформа','Сымитируйте обработку тестового файла и управление субтитрами.',[
      S('file','Видео','demo-lecture.mp4',['demo-lecture.mp4','interview.mp4','tutorial.mov']),
      S('quality','Профиль','720p',['480p','720p','1080p'])],
      [['upload','Загрузить в очередь'],['encode','Выполнить транскодинг'],['captions','Переключить субтитры']]),
    SVC:def('Синтез речи · локальное демо','Озвучка выполняется голосом браузера, без клонирования реального голоса.',[
      A('text','Текст для озвучки','Здравствуйте! Это демонстрация синтеза речи в браузере.'),
      N('speed','Скорость × 100',100,50,180)],
      [['speak','Воспроизвести'],['stop','Остановить']]),
    TSP:def('Поиск по документам','Проверяйте полнотекстовый поиск и разграничение доступа.',[
      T('question','Поисковый запрос','Как оформить доступ к API?'),
      S('role','Уровень доступа','employee',[['guest','Гость'],['employee','Сотрудник'],['admin','Администратор']])],
      [['search','Найти ответ'],['logout','Сбросить сессию']]),
    VTR:def('Поиск по транскрипту','Ищите фразы по таймкодам и переходите к найденному фрагменту.',[
      T('term','Поисковая фраза','архитектура'),
      S('speaker','Спикер','all',[['all','Все'],['A','Спикер А'],['B','Спикер Б']])],
      [['search','Найти момент'],['seek','Перейти к фрагменту']]),
    WLB:def('Трекер времени','Добавьте активность и посмотрите баланс рабочего дня.',[
      S('category','Активность','work',[['work','Работа'],['rest','Отдых'],['health','Здоровье']]),
      N('minutes','Продолжительность, мин',45,5,480)],
      [['add','Добавить запись'],['undo','Отменить последнюю']]),
    WSC:def('Очередь веб-сбора','Обрабатывайте только локальные тестовые HTML-страницы.',[
      S('source','Источник','shop',[['shop','Каталог магазина'],['news','Лента новостей'],['duplicate','Повторный URL']]),
      N('workers','Воркеров',3,1,12)],
      [['enqueue','Добавить URL'],['crawl','Обработать очередь'],['dedupe','Удалить повторы']])
  };
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => new Intl.NumberFormat('ru-RU').format(Number(value)||0) + ' ₽';
  const number = (v,lo,hi) => Math.min(hi,Math.max(lo,Number(v)||0));
  const human = items => items.map(x=>escape(x)).join(' · ');
  const table = (headers,rows) => '<div class="live-table-scroll"><table class="live-table"><thead><tr>'+headers.map(v=>'<th>'+escape(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const bars = (labels,values) => '<div class="live-bars">'+labels.map((label,i)=>'<div><div class="live-bar-label"><span>'+escape(label)+'</span><b>'+escape(values[i])+'</b></div><div class="live-bar-track"><i style="width:'+Math.max(3,Math.min(100,Number(values[i])||0))+'%"></i></div></div>').join('')+'</div>';
  const chips = items => '<div class="live-chips">'+items.map(v=>'<span>'+escape(v)+'</span>').join('')+'</div>';
  const bullets = items => '<ul class="live-bullets">'+items.map(v=>'<li>'+escape(v)+'</li>').join('')+'</ul>';
  function createState(code,conf) {
    return {code,params:Object.fromEntries(conf.fields.map(f=>[f.id,f.value])),data:{},runs:0,log:[],result:{title:'Готово к работе',message:'Измените параметры и выполните действие. Все данные в этом окне тестовые.',metrics:[],rows:null,visual:'',tone:'info'}};
  }
  function finish(st,title,message,metrics,headers,rows,visual,tone) {
    st.runs++;
    st.result={title,message,metrics:metrics||[],rows:headers?{headers,rows:rows||[]}:null,visual:visual||'',tone:tone||'ok'};
    st.log.unshift({number:st.runs,action:title,detail:message});
    st.log=st.log.slice(0,6);
  }
  function perform(st,action) {
    const p=st.params,d=st.data;
    let title='',message='',metrics=[],headers=null,rows=null,visual='',tone='ok';
    const n=(x,lo,hi)=>number(p[x],lo,hi);
    switch(st.code) {
      case 'APG': {
        d.calls=d.calls||0;d.blocked=d.blocked||0;
        if(action==='quota'){d.calls=0;d.blocked=0;title='Лимит сброшен';message='Окно лимитирования очищено.';break;}
        const num=n('count',1,20),status=[],needToken=p.route!=='/health';
        for(let i=0;i<num;i++){d.calls++;let code=needToken&&p.token!=='valid'?'401':d.calls>8?'429':p.route==='/api/admin'?'200':'200';if(code!=='200')d.blocked++;status.push('REQ-'+String(d.calls).padStart(3,'0')+' → '+code);}
        title='Ответ API Gateway';message=status[status.length-1];headers=['Запрос','HTTP'];rows=status.map(x=>x.split(' → '));metrics=[['Всего вызовов',d.calls],['Отклонено',d.blocked],['Лимит','8 / окно']];visual=chips([p.route,p.token==='valid'?'Bearer OK':'Проверка доступа',message]);tone=status.some(x=>!x.endsWith('200'))?'warn':'ok';break;
      }
      case 'BTA': {
        d.last=d.last||null;const score=(n('budget',0,1e9)>=300000?35:10)+(p.authority==='ЛПР'?30:5)+(p.timing==='2 месяца'?25:10)+(String(p.need||'').trim().length>8?10:0);
        d.last={name:p.company,score,stage:score>=70?'Готов к контакту':'Требует уточнений'};
        if(action==='transfer'){if(!d.last){tone='warn';title='Сначала оцените лид';message='';break;}d.last.stage='В демо-CRM';}
        title=action==='transfer'?'Создана карточка CRM':'Лид оценён';message=d.last.stage;metrics=[['BANT',score+'/100'],['Бюджет',money(n('budget',0,1e9))],['Статус',d.last.stage]];headers=['Поле','Значение'];rows=[['Компания',p.company],['ЛПР',p.authority],['Задача',p.need],['Срок',p.timing]];break;
      }
      case 'CCH': {
        d.threads=d.threads||Object.fromEntries(['Telegram','WhatsApp','Email','VK'].map((x,i)=>[x,{customer:['Анна','Борис','Ирина','Олег'][i],messages:[['Клиент','Подскажите статус обращения №'+(481+i)]],closed:false}]));
        const t=d.threads[p.channel];if(action==='send'){if(!String(p.reply).trim()){tone='warn';title='Пустое сообщение';message='Введите ответ';break;}t.messages.push(['Менеджер',p.reply]);t.closed=false;}if(action==='close')t.closed=true;
        title=action==='send'?'Ответ добавлен':action==='close'?'Обращение закрыто':'Диалог открыт';message=t.customer+' · '+p.channel;
        metrics=[['Сообщений',t.messages.length],['Открытых',Object.values(d.threads).filter(x=>!x.closed).length],['Состояние',t.closed?'Закрыто':'В работе']];
        headers=['Участник','Сообщение'];rows=t.messages;visual=chips(Object.keys(d.threads).map(ch=>ch+(d.threads[ch].closed?' ✓':'')));break;
      }
      case 'CDP': {
        d.releases=d.releases||[];if(action==='rollback'){d.releases.unshift({version:p.version,env:p.environment,status:'ОТКАТ',traffic:'0%'});title='Выполнен откат';message='Трафик возвращён на предыдущую версию.';}else{
          const bad=p.health==='fail';d.releases.unshift({version:p.version,env:p.environment,status:bad?'ROLLBACK':'CANARY',traffic:bad?'0%':n('canary',1,100)+'%'});
          title=bad?'Canary отклонён':'Релиз применён';message=bad?'Health-check не пройден; откат автоматический.':'Версия развернута на канареечном трафике.';tone=bad?'warn':'ok';
        }
        metrics=[['Релизов',d.releases.length],['Среда',p.environment],['Текущая версия',p.version]];headers=['Версия','Среда','Трафик','Итог'];rows=d.releases.slice(0,5).map(x=>[x.version,x.env,x.traffic,x.status]);break;
      }
      case 'DCM': {
        const raw=String(p.csv||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
        const unique=[...new Set(raw)];
        const cleaned=unique.map(x=>{const a=x.split(',');return a[1]?x:p.missing==='drop'?'':a[0]+',unknown@example.test'}).filter(Boolean);
        d.rows=action==='clean'?cleaned:raw;
        title=action==='clean'?'Данные очищены':'Профилирование завершено';message=action==='clean'?'Дубли и пропуски обработаны.':'Найдены повторы и неполные строки.';
        metrics=[['Строк',raw.length],['Дубликатов',raw.length-unique.length],['После обработки',cleaned.length]];
        headers=['Строка','Содержимое'];rows=d.rows.map((x,i)=>[i+1,x]);break;
      }
      case 'DET': {
        const confidence={scratch:89,crack:96,clean:14}[p.sample];
        const detected=p.sample!=='clean'&&confidence>=n('threshold',1,100);
        d.last=detected?'Найден '+(p.sample==='scratch'?'царапина':'дефект-контур'):'Дефектов выше порога нет';
        title=action==='accept'?'Решение подтверждено':'Анализ образца завершён';message=d.last;
        metrics=[['Уверенность',confidence+'%'],['Порог',n('threshold',1,100)+'%'],['Решение',detected?'Проверить':'Пропустить']];
        visual='<div class="live-vision '+(detected?'is-defect':'')+'"><div class="live-vision__object"><span>'+escape(p.sample==='clean'?'Эталон':p.sample==='crack'?'Образец B':'Образец A')+'</span><i></i></div><small>'+escape(d.last)+' · синтетический образец</small></div>';break;
      }
      case 'DMB': {
        d.count=d.count||0;const add=action==='resync'?3:n('batch',1,100);d.count+=add;title=action==='resync'?'Resync выполнен':'Миграция партии';message='Переданы записи в '+p.target;
        metrics=[['Перенесено',d.count],['Последняя партия',add],['Ошибок типов',0]];
        headers=['Исходное поле','Тип','Целевое поле'];rows=[['id','int','_id ('+p.mapping+')'],['name','varchar','name'],['created_at','timestamp','createdAt']];break;
      }
      case 'DSB': {
        d.revision=(d.revision||0)+1;d.conflict=action==='conflict';
        const winner=p.policy==='newest'?'DB B':p.policy==='a'?'DB A':'DB B';
        title=d.conflict?'Конфликт воспроизведён':'Состояния согласованы';message=d.conflict?'Две версии ключа '+p.key:'Победитель: '+winner;
        metrics=[['Ревизия',d.revision],['Политика',p.policy],['Статус',d.conflict?'Конфликт':'Синхронизировано']];
        headers=['База','Значение','Ревизия'];rows=[['DB A','Готовится','r'+d.revision],['DB B','В пути','r'+(d.revision+1)],['Результат',d.conflict?'Ожидает правила':winner,'—']];tone=d.conflict?'warn':'ok';break;
      }
      case 'ETL': {
        d.offset=d.offset||0;d.retries=d.retries||0;
        if(p.failure==='fail'){d.retries++;title='Загрузка прервана';message='Источник недоступен. Checkpoint '+d.offset+' сохранён.';tone='warn';}
        else{d.offset+=n('batch',1,200);title=action==='retry'?'Повтор выполнен':'ETL завершён';message='Новая контрольная точка: '+d.offset+'.';}
        metrics=[['Checkpoint',d.offset],['Повторов',d.retries],['Источник',p.failure==='fail'?'Ошибка':'Доступен']];
        headers=['Участок','Состояние'];rows=[['PostgreSQL',p.failure==='fail'?'Таймаут':'Успешно'],['Transform','Валидация схемы'],['ClickHouse','offset='+d.offset]];break;
      }
      case 'FDS': {
        const amount=n('amount',1,1e8);const risk=Math.min(100,5+(amount>200000?40:amount>50000?22:0)+(p.region==='foreign'?35:0)+(p.newDevice?25:0));
        const decision=risk>=70?'Блокировать':risk>=40?'Ручная проверка':'Пропустить';
        title=action==='review'?'Отправлено аналитику':'Транзакция оценена';message=decision+' · тестовые правила, не CatBoost';
        metrics=[['Риск',risk+'/100'],['Сумма',money(amount)],['Решение',decision]];
        visual=bars(['Риск', 'Порог блокировки'],[risk,70]);tone=risk>=40?'warn':'ok';break;
      }
      case 'FLB': {
        d.version=d.version||1;const dataset=[4,12,20,50];
        let transformed=dataset.map(v=>p.operation==='scale'?+(v/50).toFixed(3):p.operation==='log'?+Math.log1p(v).toFixed(3):Math.min(v,n('clip',1,100)));
        if(action==='version')d.version++;
        title=action==='version'?'Версия опубликована':'Преобразование рассчитано';message='Операция '+p.operation+' применена к 4 элементам.';
        metrics=[['Версия','v'+d.version],['Признаков',4],['Операция',p.operation]];
        headers=['Исходное','Значение'];rows=dataset.map((v,i)=>[v,transformed[i]]);visual=bars(['Исходный масштаб','Результат (норм.)'],[50,Math.min(100,transformed[3]*2)]);break;
      }
      case 'FPL': {
        d.orders=d.orders||[{id:480,client:'Склад №2',driver:'Алексей',status:'В пути'}];
        d.next=d.next||481;
        if(action==='create'){d.orders.unshift({id:d.next++,client:p.client||'Без названия',driver:'Не назначен',status:'Новый'});}
        if(action==='dispatch'&&d.orders[0]){d.orders[0].driver=p.driver;d.orders[0].status='В пути';}
        if(action==='complete'&&d.orders[0])d.orders[0].status='Доставлен';
        const order=d.orders[0];title=action==='create'?'Заказ создан':action==='dispatch'?'Маршрут назначен':'Доставка завершена';message='Заказ №'+order.id+' · '+order.status;
        metrics=[['Заказов',d.orders.length],['В пути',d.orders.filter(x=>x.status==='В пути').length],['Доставлено',d.orders.filter(x=>x.status==='Доставлен').length]];
        headers=['№','Клиент','Водитель','Статус'];rows=d.orders.slice(0,6).map(x=>[x.id,x.client,x.driver,x.status]);break;
      }
      case 'FPT': {
        const files=String(p.files||'').split(',').map(x=>x.trim()).filter(Boolean);
        const allowed=/\.(csv|xlsx|txt|json)$/i;
        const good=files.filter(x=>allowed.test(x)),bad=files.filter(x=>!allowed.test(x));
        const ok=action==='process'&&!p.strict?files:good;
        title=action==='validate'?'Проверка завершена':'Пакет обработан';message=bad.length+' файлов требуют внимания.';
        metrics=[['Всего',files.length],['В обработке',ok.length],['Ошибок',bad.length]];
        headers=['Файл','Статус'];rows=files.map(x=>[x,allowed.test(x)?action==='process'?'→ '+p.format:'Готов':'Неподдерживаемый формат']);tone=bad.length?'warn':'ok';break;
      }
      case 'IDM': {
        const roles={viewer:['read'],editor:['read','write'],admin:['read','write','users']};
        const allowed=roles[p.role].includes(p.operation)&&!(p.operation==='users'&&!p.mfa);
        title=action==='signIn'?'SSO-сессия проверена':'RBAC-политика проверена';message=allowed?'Операция разрешена':'Отказ: недостаточно прав или 2FA';
        metrics=[['Роль',p.role],['2FA',p.mfa?'Да':'Нет'],['Доступ',allowed?'Разрешён':'Запрещён']];
        headers=['Разрешение','Состояние'];rows=['read','write','users'].map(x=>[x,roles[p.role].includes(x)?x==='users'&&!p.mfa?'Нужна 2FA':'Есть':'Нет']);tone=allowed?'ok':'warn';break;
      }
      case 'K8S': {
        d.queue=d.queue||[];d.completed=d.completed||0;d.next=d.next||101;
        if(action==='submit')d.queue.push({id:d.next++,gpu:p.gpu,mem:n('memory',1,80),priority:p.priority,status:'В очереди'});
        if(action==='schedule'){const job=d.queue.find(x=>x.status==='В очереди');if(job){const cap=job.gpu==='A100'?80:16;job.status=job.mem<=cap?'Работает':'Недостаточно VRAM';}}
        if(action==='release'){const idx=d.queue.findIndex(x=>x.status==='Работает');if(idx>=0){d.queue.splice(idx,1);d.completed++;}}
        title=action==='submit'?'Задача добавлена':action==='schedule'?'Ресурсы распределены':'GPU освобождён';message='Планировщик обновил состояние очереди.';
        metrics=[['В очереди',d.queue.filter(x=>x.status==='В очереди').length],['На GPU',d.queue.filter(x=>x.status==='Работает').length],['Готово',d.completed]];
        headers=['JOB','GPU','VRAM','Состояние'];rows=d.queue.slice(-6).map(x=>['#'+x.id,x.gpu,x.mem+' GB',x.status]);break;
      }
      case 'LMS': {
        const questions=[['Что делает градиентный спуск?','A','Минимизирует функцию потерь'],['Как предотвращать переобучение?','B','С помощью регуляризации'],['Для чего нужна валидация?','C','Для оценки обобщения']];
        d.index=d.index||0;d.correct=d.correct||0;d.done=d.done||[];
        if(action==='answer'&&!d.done.includes(d.index)){if(p.answer===questions[d.index][1])d.correct++;d.done.push(d.index);}
        if(action==='next')d.index=(d.index+1)%questions.length;
        title=action==='next'?'Следующий вопрос':'Ответ зафиксирован';message=questions[d.index][0];
        metrics=[['Вопрос',d.index+1+'/3'],['Верных',d.correct],['Пройдено',d.done.length+'/3']];
        visual=chips([questions[d.index][0],'A · Минимизировать', 'B · Регуляризация','C · Проверка обобщения']);
        if(d.done.length===3)message+=' · условный сертификат доступен';break;
      }
      case 'ME': {
        const area=n('area',1,10000),rate={basic:8500,standard:14000,premium:24000},cost=area*rate[p.finish],rooms=n('rooms',1,100),total=cost+rooms*5500;
        title=action==='compare'?'Сравнение вариантов':'Смета рассчитана';message='Предварительная стоимость по учебным ставкам, не коммерческое предложение.';
        metrics=[['Стоимость',money(total)],['Площадь',area+' м²'],['Помещений',rooms]];
        headers=['Статья','Сумма'];rows=[['Отделка',money(cost)],['Работы по помещениям',money(rooms*5500)],['Всего',money(total)]];
        if(action==='compare')visual=bars(['Базовая','Стандарт','Премиум'],Object.values(rate).map(v=>Math.round(100*v/24000)));break;
      }
      case 'MFE': {
        const prices=[99,101,100,104,103,107,106,109,111,108,114,116],w=n('window',2,10);
        const avg=prices.slice(-w).reduce((a,b)=>a+b,0)/w,delta=(prices.at(-1)-prices[0])/prices[0]*100;
        const signal=p.strategy==='trend'?prices.at(-1)>=avg?'Рост':'Снижение':prices.at(-1)>=avg?'Откат вниз':'Откат вверх';
        title=action==='backtest'?'Мини-бэктест завершён':'Индикаторы рассчитаны';message='Иллюстративные цены без рыночного API. Это не торговый сигнал.';
        metrics=[['SMA ('+w+')',avg.toFixed(2)],['Динамика',delta.toFixed(1)+'%'],['Учебный сценарий',signal]];
        headers=['Период','Цена'];rows=prices.map((v,i)=>['T'+(i+1),v]);visual=bars(['Начальная','Последняя'],[prices[0]/1.16,prices.at(-1)/1.16]);break;
      }
      case 'MGD': {
        const sentences=String(p.transcript||'').split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);
        const selected=p.style==='short'?sentences.slice(0,3):sentences.filter(x=>/провер|шаг|важн|нужно|использ/i.test(x)).slice(0,4);
        title=action==='segments'?'Расшифровка разбита':'Текстовый конспект готов';message=sentences.length+' предложений · без распознавания видео';
        metrics=[['Предложений',sentences.length],['В конспекте',selected.length],['Режим',p.style]];
        visual=bullets(action==='segments'?sentences:selected.length?selected:['Нет достаточных данных. Введите расшифровку.']);tone=selected.length?'ok':'warn';break;
      }
      case 'MPA': {
        d.services=d.services||Object.fromEntries(['payments','catalog','auth','notifications'].map(x=>[x,'Healthy']));
        d.services[p.service]=action==='inject'?p.incident==='down'?'Circuit open':'Degraded':'Healthy';
        title=action==='inject'?'Инцидент создан':'Сервис восстановлен';message=p.service+' → '+d.services[p.service];
        metrics=[['Сервисов',4],['Healthy',Object.values(d.services).filter(x=>x==='Healthy').length],['Инцидентов',Object.values(d.services).filter(x=>x!=='Healthy').length]];
        headers=['Сервис','Состояние'];rows=Object.entries(d.services);tone=action==='inject'?'warn':'ok';break;
      }
      case 'NTF': {
        d.sent=d.sent||[];d.next=d.next||700;
        let row={id:d.next++,channel:p.channel,to:p.recipient,status:p.fail?'Ошибка':'Доставлено'};
        if(action==='retry'&&d.sent.some(x=>x.status==='Ошибка')){row=d.sent.find(x=>x.status==='Ошибка');row.status=p.fail?'Ошибка':'Доставлено';}
        else d.sent.unshift(row);
        title=action==='retry'?'Повтор отправки':'Уведомление поставлено';message=row.channel+' · '+row.status;
        metrics=[['Событий',d.sent.length],['Доставлено',d.sent.filter(x=>x.status==='Доставлено').length],['Ошибок',d.sent.filter(x=>x.status==='Ошибка').length]];
        headers=['ID','Канал','Получатель','Статус'];rows=d.sent.slice(0,5).map(x=>[x.id,x.channel,x.to,x.status]);tone=p.fail?'warn':'ok';break;
      }
      case 'OCS': {
        const samples={one:{number:'481',sum:3900,items:2},two:{number:'482',sum:12800,items:4}},sample=samples[p.sample];
        d.last=sample;
        title=action==='validate'?'Поля проверены':'Образец разобран';message='Накладная №'+sample.number+' · данные взяты из встроенного образца';
        metrics=[['Позиции',sample.items],['Сумма',money(sample.sum)],['Статус','Проверено']];
        headers=['Поле','Извлечённое значение'];rows=[['Номер',sample.number],['Контрагент',p.supplier],['Сумма',money(sample.sum)],['Позиции',sample.items]];break;
      }
      case 'PIP': {
        try{
          const payload=JSON.parse(p.payload);if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Нужен JSON-объект');
          d.count=(d.count||0)+(action==='execute'?1:0);
          title=action==='execute'?'Сценарий выполнен':'Входящий JSON проверен';message=action==='execute'?'Результат добавлен в локальную историю':'Поля корректны, сценарий готов';
          metrics=[['Запусков',d.count||0],['Триггер',p.trigger],['Действие',p.destination]];
          headers=['Поле','Значение'];rows=Object.entries(payload).slice(0,8).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):v]);
          visual=chips([p.trigger,'Mapping: name / email',p.destination==='crm'?'CRM · тестовая запись':'Email · очередь']);
        }catch(err){title='Ошибка проверки JSON';message=String(err.message);tone='warn';headers=['Подсказка','Что исправить'];rows=[['Формат','Используйте JSON вида {"name":"Анна"}']];}break;
      }
      case 'RAG': {
        const docs=[['Лекция 01','Градиентный спуск вычисляет градиент и обновляет параметры, чтобы уменьшить функцию потерь.'],['Лекция 02','Регуляризация ограничивает сложность модели и помогает бороться с переобучением.'],['Лекция 03','Валидация нужна для выбора гиперпараметров и оценки обобщения.']];
        const words=String(p.question||'').toLowerCase().split(/[\s,?.!]+/).filter(x=>x.length>3);
        const ranked=docs.map(x=>({...{title:x[0],text:x[1]},score:words.filter(w=>x[1].toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score);
        title=action==='quiz'?'Тестовый вопрос':'Поиск завершён';message=ranked[0].score?'Найден релевантный фрагмент':'Точных совпадений нет — показаны ближайшие фрагменты';
        metrics=[['Документов',docs.length],['Совпадений',ranked.filter(x=>x.score).length],['Режим',p.mode]];
        headers=['Источник','Фрагмент'];rows=ranked.slice(0,3).map(x=>[x.title,x.text]);
        if(action==='quiz')visual=bullets(['Вопрос: Как обновляются параметры при градиентном спуске?','A. По направлению отрицательного градиента','B. Случайно','C. Не изменяются']);break;
      }
      case 'RCC': {
        const catalog=[['Система поиска','AI'],['Сервис задач','Backend'],['Личный кабинет','Web'],['Витрина данных','Data'],['Помощник','AI']];
        d.likes=d.likes||0;d.dislikes=d.dislikes||0;
        if(action==='like')d.likes++;if(action==='dislike')d.dislikes++;
        const ranked=catalog.slice().sort((a,b)=>Number(b[1]===p.interest)-Number(a[1]===p.interest));
        title=action==='like'?'Реакция учтена':action==='dislike'?'Предпочтения скорректированы':'Лента обновлена';message='Ранжирование на основе выбранной категории.';
        metrics=[['Рекомендаций',ranked.length],['Нравится',d.likes],['Скрыто',d.dislikes]];
        headers=['Позиция','Проект','Категория'];rows=ranked.map((x,i)=>[i+1,x[0],x[1]]);break;
      }
      case 'S2I': {
        const txt=String(p.utterance||'').toLowerCase();
        const intent=action==='fallback'?'fallback':/заказ|достав/i.test(txt)?'Отследить заказ':/счет|счёт|оплат/i.test(txt)?'Оплата':/оператор|специалист|менеджер/i.test(txt)?'Оператор':'fallback';
        title='Намерение распознано';message=intent==='fallback'?'Передача оператору':'Направление: '+intent;
        metrics=[['Intent',intent],['Источник','Текстовый ввод'],['Маршрут',intent==='fallback'?'Поддержка':'Сценарий']];
        headers=['Этап','Состояние'];rows=[['ASR','Использован текст без аудио'],['NLU',intent],['Routing',message]];tone=intent==='fallback'?'warn':'ok';break;
      }
      case 'SHP': {
        const items=String(p.items||'').split(/\r?\n/).map(line=>line.split(';')).filter(a=>a.length===3);
        const valid=items.map(([name,count,cost])=>({name,count:Number(count),cost:Number(cost)})).filter(x=>x.name&&Number.isFinite(x.count)&&x.count>0&&Number.isFinite(x.cost)&&x.cost>=0);
        const total=valid.reduce((sum,x)=>sum+x.count*x.cost,0);
        const match=total===n('declared',0,1e9);
        title=action==='post'?(match?'В учётном журнале':'Передача отклонена'):action==='extract'?'Позиции извлечены':'Сумма проверена';message=match?'Итог совпал с суммой документа.':'Расхождение: '+money(total-n('declared',0,1e9));
        metrics=[['Позиций',valid.length],['Итог',money(total)],['Проверка',match?'Совпало':'Расхождение']];
        headers=['Товар','Кол-во','Цена','Сумма'];rows=valid.map(x=>[x.name,x.count,money(x.cost),money(x.count*x.cost)]);tone=match?'ok':'warn';break;
      }
      case 'SNB': {
        d.posts=d.posts||[{text:'Добро пожаловать в ленту!',likes:3,audience:'public'}];d.follow=d.follow||false;
        if(action==='publish'&&String(p.post).trim())d.posts.unshift({text:p.post,likes:0,audience:p.audience});
        if(action==='like')d.posts[0].likes++;
        if(action==='follow')d.follow=!d.follow;
        title=action==='publish'?'Публикация создана':action==='like'?'Реакция добавлена':'Подписка обновлена';message=action==='follow'?(d.follow?'Подписан':'Отписан'):'Лента обновлена';
        metrics=[['Постов',d.posts.length],['Лайков',d.posts.reduce((sum,x)=>sum+x.likes,0)],['Подписка',d.follow?'Да':'Нет']];
        headers=['Публикация','Лайки','Видимость'];rows=d.posts.slice(0,6).map(x=>[x.text,x.likes,x.audience]);break;
      }
      case 'STB': {
        d.jobs=d.jobs||[];d.captions=d.captions||false;const last=d.jobs[0];
        if(action==='upload')d.jobs.unshift({file:p.file,quality:p.quality,status:'В очереди'});
        if(action==='encode'&&last)last.status='HLS готов';if(action==='captions')d.captions=!d.captions;
        title=action==='upload'?'Видео добавлено':action==='encode'?'Транскодирование завершено':'Настройки плеера';message=action==='captions'?'Субтитры '+(d.captions?'включены':'выключены'):'Локальная имитация обработки без загрузки на сервер';
        metrics=[['Файлов',d.jobs.length],['HLS готово',d.jobs.filter(x=>x.status==='HLS готов').length],['Субтитры',d.captions?'Вкл':'Выкл']];
        headers=['Файл','Качество','Статус'];rows=d.jobs.map(x=>[x.file,x.quality,x.status]);break;
      }
      case 'SVC': {
        const supported=('speechSynthesis' in window)&&('SpeechSynthesisUtterance' in window);
        if(action==='stop'&&supported)window.speechSynthesis.cancel();
        if(action==='speak'&&supported&&String(p.text).trim()){window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(String(p.text).slice(0,500));utter.rate=n('speed',50,180)/100;utter.lang='ru-RU';window.speechSynthesis.speak(utter);}
        title=action==='stop'?'Воспроизведение остановлено':supported?'Проигрывание начато':'Синтез не поддерживается';
        message='Системный голос браузера. Клонирование голоса и серверный TTS не выполняются.';
        metrics=[['Скорость',n('speed',50,180)+'%'],['Длина текста',String(p.text).length],['TTS',supported?'В браузере':'Недоступен']];
        tone=supported?'ok':'warn';break;
      }
      case 'TSP': {
        const docs=[['Регламент API','Для доступа к API нужно запросить токен в кабинете.', 'employee'],['Политика расходов','Платежи согласуются с финансовым директором.', 'admin'],['Справка','Служба поддержки отвечает в рабочие дни.', 'guest']];
        const words=String(p.question||'').toLowerCase().split(/\s+/).filter(w=>w.length>3);
        const access={guest:0,employee:1,admin:2},rank={guest:0,employee:1,admin:2};
        const eligible=docs.filter(x=>rank[x[2]]<=access[p.role]);
        const matches=eligible.filter(x=>words.some(w=>x[1].toLowerCase().includes(w)||x[0].toLowerCase().includes(w)));
        title=action==='logout'?'Сессия сброшена':'Поиск выполнен';message=matches.length?'Показаны доступные фрагменты':'По доступным документам совпадений нет';
        metrics=[['Доступных документов',eligible.length],['Совпадений',matches.length],['Роль',p.role]];
        headers=['Документ','Фрагмент'];rows=(matches.length?matches:eligible).map(x=>[x[0],x[1]]);tone=matches.length?'ok':'warn';break;
      }
      case 'VTR': {
        const segments=[['00:12','A','В начале объясняем архитектуру системы'],['00:44','B','Важен выбор модели и качество данных'],['01:15','A','Проверяем интерфейс и API'],['02:08','B','Подведём итоги эксперимента']];
        const found=segments.filter(x=>(p.speaker==='all'||x[1]===p.speaker)&&x[2].toLowerCase().includes(String(p.term||'').toLowerCase()));
        d.found=found;title=action==='seek'?'Переход к таймкоду':'Поиск по видео';message=found.length?'Фрагмент: '+found[0][0]:'Совпадений не найдено';
        metrics=[['Сегментов',segments.length],['Найдено',found.length],['Таймкод',found[0]?.[0]||'—']];
        headers=['Время','Спикер','Текст'];rows=(found.length?found:segments).map(x=>x);tone=found.length?'ok':'warn';break;
      }
      case 'WLB': {
        d.entries=d.entries||[{category:'work',minutes:90},{category:'rest',minutes:20}];
        if(action==='add')d.entries.push({category:p.category,minutes:n('minutes',5,480)});
        if(action==='undo'&&d.entries.length)d.entries.pop();
        const sum=x=>d.entries.filter(e=>e.category===x).reduce((n,e)=>n+e.minutes,0);
        title=action==='add'?'Активность добавлена':'Последняя запись отменена';message='Дневной баланс обновлён.';
        metrics=[['Работа',sum('work')+' мин'],['Отдых',sum('rest')+' мин'],['Здоровье',sum('health')+' мин']];
        headers=['№','Активность','Мин'];rows=d.entries.map((x,i)=>[i+1,x.category,x.minutes]);
        visual=bars(['Работа','Отдых','Здоровье'],['work','rest','health'].map(x=>Math.round(sum(x)/Math.max(1,sum('work')+sum('rest')+sum('health'))*100)));break;
      }
      case 'WSC': {
        d.queue=d.queue||[];d.results=d.results||[];const urls={shop:'https://example.test/catalog',news:'https://example.test/news',duplicate:'https://example.test/catalog'};
        if(action==='enqueue')d.queue.push(urls[p.source]);
        if(action==='dedupe')d.queue=[...new Set(d.queue)];
        if(action==='crawl'){for(const u of d.queue){if(!d.results.some(r=>r.url===u))d.results.push({url:u,title:u.endsWith('news')?'Тестовая новость':'Каталог товаров'});}d.queue=[];}
        title=action==='enqueue'?'URL поставлен в очередь':action==='dedupe'?'Дубликаты удалены':'Тестовый HTML обработан';
        message='Нет внешних HTTP-запросов: используются встроенные образцы.';
        metrics=[['Очередь',d.queue.length],['Обработано',d.results.length],['Воркеров',n('workers',1,12)]];
        headers=['URL','Результат'];rows=d.results.map(x=>[x.url,x.title]).concat(d.queue.map(x=>[x,'В очереди']));break;
      }
    }
    finish(st,title||'Действие выполнено',message,metrics,headers,rows,visual,tone);
  }
  function fieldHTML(f,st){
    const id='live-'+st.code+'-'+f.id, val=st.params[f.id],label='<span>'+escape(f.label)+'</span>';
    let input='';
    if(f.type==='select')input='<select id="'+id+'" data-live-field="'+escape(f.id)+'">'+f.options.map(([v,t])=>'<option value="'+escape(v)+'"'+(String(val)===String(v)?' selected':'')+'>'+escape(t)+'</option>').join('')+'</select>';
    else if(f.type==='textarea')input='<textarea id="'+id+'" data-live-field="'+escape(f.id)+'" rows="4">'+escape(val)+'</textarea>';
    else if(f.type==='check')input='<input type="checkbox" id="'+id+'" data-live-field="'+escape(f.id)+'"'+(val?' checked':'')+' />';
    else if(f.type==='number')input='<input type="number" id="'+id+'" data-live-field="'+escape(f.id)+'" value="'+escape(val)+'" min="'+f.min+'" max="'+f.max+'" step="1"/>';
    else input='<input type="text" id="'+id+'" data-live-field="'+escape(f.id)+'" value="'+escape(val)+'" placeholder="'+escape(f.placeholder)+'"/>';
    return '<label class="live-field'+(f.type==='check'?' is-checkbox':'')+'" for="'+id+'">'+label+input+'</label>';
  }
  function draw(st,conf,root){
    const r=st.result;
    root.innerHTML='<div class="live-head"><div><span class="live-eyebrow">РАБОЧАЯ ПЕСОЧНИЦА · '+escape(st.code)+'</span><h3>'+escape(conf.name)+'</h3><p>'+escape(conf.hint)+'</p></div><span class="live-local">Тестовые данные · локально</span></div>'+
      '<div class="live-layout"><section class="live-controls" aria-label="Управление демонстрацией"><h4>Параметры сценария</h4><div class="live-fields">'+conf.fields.map(f=>fieldHTML(f,st)).join('')+'</div>'+
      '<div class="live-buttons">'+conf.actions.map((a,i)=>'<button type="button" data-live-action="'+escape(a[0])+'" class="live-btn'+(i===0?' is-primary':'')+'">'+escape(a[1])+'</button>').join('')+
      '<button type="button" data-live-action="reset" class="live-btn is-reset">Сбросить демо</button></div><p class="live-hint">Действия изменяют состояние интерфейса. Ничего не отправляется на сервер.</p></section>'+
      '<section class="live-results" aria-label="Результат"><div class="live-result-status is-'+escape(r.tone)+'" data-live-status aria-live="polite" data-live-runs="'+st.runs+'"><span>Результат действия №'+st.runs+'</span><h4>'+escape(r.title)+'</h4><p>'+escape(r.message)+'</p></div>'+
      (r.metrics?.length?'<div class="live-metrics">'+r.metrics.map(([label,value])=>'<div class="live-metric"><span>'+escape(label)+'</span><strong>'+escape(value)+'</strong></div>').join('')+'</div>':'')+
      (r.visual||'')+
      (r.rows?table(r.rows.headers,r.rows.rows):'<div class="live-empty"><span>01 / Настройте параметры</span><span>02 / Нажмите действие</span><span>03 / Изучите результат</span></div>')+
      '<div class="live-history"><h4>История действий</h4>'+(st.log.length?st.log.map(x=>'<p><b>#'+x.number+' · '+escape(x.action)+'</b> '+escape(x.detail)+'</p>').join(''):'<p>История появится после первого действия.</p>')+'</div></section></div>';
  }
  function mount(section){
    const rootOriginal=section.querySelector('[data-demo-panel="product"] .demo-app');
    const code=section.dataset.demoCode,conf=CASES[code];
    if(!rootOriginal||!conf||rootOriginal.dataset.liveMounted)return false;
    const root=document.createElement('div');
    root.className='live-demo';
    root.setAttribute('data-live-demo',code);
    let st=createState(code,conf);
    rootOriginal.replaceWith(root);
    const disclaimer=section.querySelector('.demo-disclaimer');
    if(disclaimer)disclaimer.textContent='Интерактивная песочница · синтетические данные';
    draw(st,conf,root);
    root.addEventListener('input',event=>{
      const node=event.target.closest('[data-live-field]');
      if(!node)return;
      st.params[node.dataset.liveField]=node.type==='checkbox'?node.checked:node.value;
    });
    root.addEventListener('change',event=>{
      const node=event.target.closest('[data-live-field]');
      if(!node)return;
      st.params[node.dataset.liveField]=node.type==='checkbox'?node.checked:node.value;
    });
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-live-action]');
      if(!button)return;
      const action=button.dataset.liveAction;
      if(action==='reset'){
        if(code==='SVC'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
        st=createState(code,conf);
        draw(st,conf,root);return;
      }
      try{perform(st,action);}
      catch(error){finish(st,'Ошибка в демо',String(error?.message||error),[],null,null,'','warn');}
      draw(st,conf,root);
    });
    return true;
  }
  function init(){
    document.querySelectorAll('.case-demo-section[data-case-demo]').forEach(mount);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
