
(function(){
'use strict';var L=window.SPV_LABS;if(!L)return;
function lines(x){return String(x||'').split(/\n/).map(function(t){return t.trim();}).filter(Boolean);}
function words(x){return String(x||'').toLowerCase().match(/[a-zа-яё0-9]{3,}/gi)||[];}
function esc(x){return L.esc(x);}
function searchDocs(query,corpus){var q=words(query);return corpus.map(function(d,i){var text=d[1].toLowerCase(),title=d[0].toLowerCase();var points=q.reduce(function(a,w){return a+(text.includes(w)?2:0)+(title.includes(w)?3:0);},0);return{index:i,title:d[0],text:d[1],points:points};}).filter(function(x){return x.points>0;}).sort(function(a,b){return b.points-a.points;});}
function renderHits(h){return h.length?'<div class="spv-lab__tiles">'+h.slice(0,4).map(function(d){return L.tile(d.title,'Источник '+(d.index+1)+' · '+d.text.slice(0,125));}).join('')+'</div>':L.note('Совпадений нет. Измените запрос или данные.');
}
function docResult(s,title,description){return L.result(title,description,L.metrics([['Найдено',s.data.hits.length],['Запросов',s.data.queries]])+renderHits(s.data.hits),s.done?'ok':'');}
var lesson=[['Теорема Пифагора','В прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов.'],['Производная','Производная функции показывает скорость изменения значения и наклон касательной.'],['Интеграл','Определённый интеграл используется для вычисления площади под графиком функции.'],['Матрица','Умножение матриц выполняется по строкам первой матрицы и столбцам второй.']];
var legal=[['Регламент закупок','Закупки свыше 250 000 рублей требуют согласования финансового отдела.'],['Порядок отпусков','Отпуск согласуется с руководителем не позднее чем за две недели.'],['Политика ИБ','Доступ предоставляется по ролям; журнал действий хранится 90 дней.'],['Счёт и оплата','Первичный платёж выполняется после подписания акта приёмки.']];
function docsConfig(code,title,corpus){
return {title:title,description:'Введите вопрос — локальный поисковик найдёт фрагменты по словам и покажет источники.',cta:'Найти в документах',
 fields:[['query','Запрос','text',code==='RAG'?'Что такое производная?':'Как согласовать закупку?']],
 init:function(s){s.data={hits:[],queries:0,quiz:false};},
 run:function(s){s.data.hits=searchDocs(s.values.query,corpus);s.data.queries++;s.data.quiz=false;s.last='Поиск: '+s.values.query;L.log(s,s.data.hits.length+' совпадений');},
 onAction:function(s,a){if(a==='quiz'){s.data.quiz=!s.data.quiz;L.log(s,'Переключена контрольная проверка');}},
 buttons:code==='RAG'?[['Сформировать вопрос','quiz']]:[],
 view:function(s){return docResult(s,'Поиск с источниками',s.last||'Спросите об учебном материале.')+(code==='RAG'&&s.data.quiz&&s.data.hits.length?L.note('Контрольный вопрос: объясните своими словами понятие «'+s.data.hits[0].title+'».'): '');}};
}
function invoiceConfig(code){
var isOCR=code==='OCS';
return {title:isOCR?'OCR и передача в 1С':'Разбор товарной накладной',description:'Исправьте текст распознанного документа, проверьте поля и подтвердите выгрузку в тестовый учёт.',cta:'Извлечь и проверить',
 fields:[['doc','Распознанный текст документа','textarea','Накладная № 129\nПоставщик: ООО Альфа\nДата: 15.11.2026\nСумма: 12450.50\nНДС: 20%'],['strict','Требовать сумму и номер','check',true]],
 init:function(s){s.data={fields:[],ok:false,exported:false};},
 run:function(s){var text=String(s.values.doc),number=(text.match(/(?:№|номер)\s*[:№]?\s*([a-zа-я0-9-]+)/i)||[])[1]||'',supplier=(text.match(/поставщик\s*:\s*([^\n]+)/i)||[])[1]||'',amt=(text.match(/сумма\s*:\s*([\d., ]+)/i)||[])[1]||'',date=(text.match(/дата\s*:\s*([^\n]+)/i)||[])[1]||'';var parsed=Number(amt.replace(/\s/g,'').replace(',','.'));var valid=(!s.values.strict||(number&&Number.isFinite(parsed)&&parsed>0))&&supplier;s.data={fields:[['Номер',number||'Не найден'],['Поставщик',supplier||'Не найден'],['Дата',date||'Не найдена'],['Сумма',Number.isFinite(parsed)?parsed.toFixed(2):'Ошибка']],ok:!!valid,exported:false};s.last=valid?'Проверка пройдена':'Не все обязательные поля найдены';L.log(s,s.last);},
 onAction:function(s,a){if(a==='send'&&s.data.ok){s.data.exported=true;L.log(s,'Данные отправлены в тестовый журнал интеграции');}},
 buttons:[['Передать в учёт','send']],
 view:function(s){return L.result('Распознанные реквизиты',s.data.exported?'Данные сохранены в локальном журнале.':s.last||'Данные можно исправлять до проверки.',L.metrics([['Полей',s.data.fields.length],['Экспорт',s.data.exported?'Выполнен':'Не выполнен']])+(s.data.fields.length?L.table(['Поле','Значение'],s.data.fields):'<div class="spv-lab__empty">Запустите разбор документа.</div>')+(s.done&&!s.data.ok?L.note('Проверьте номер, сумму и поставщика.'):' '),s.done?(s.data.ok?'ok':'bad'):'');}};
}
var d={
MFE:{
 title:'Прогноз и бэктест',description:'Синтетические котировки, скользящая средняя, оценка тренда и проверка на истории.',cta:'Пересчитать прогноз',
 fields:[['prices','Цены через запятую','text','100, 103, 102, 108, 112, 115, 114, 119'],['window','Окно средней','select','3',[['3','3 периода'],['5','5 периодов']]],['horizon','Горизонт','select','1',[['1','1 период'],['2','2 периода'],['3','3 периода']]]],
 init:function(s){s.data={points:[],predict:0,change:0,error:null};},
 run:function(s){var p=String(s.values.prices).split(/[,;\s]+/).filter(Boolean).map(Number),w=Number(s.values.window),h=Number(s.values.horizon);if(p.length<w+1||p.some(function(x){return !Number.isFinite(x)||x<=0;})){s.data.error='Нужно не менее '+(w+1)+' положительных котировок.';s.last=s.data.error;return;}var avg=p.slice(-w).reduce(function(a,b){return a+b;},0)/w,prior=p.slice(-w-1,-1).reduce(function(a,b){return a+b;},0)/w,delta=avg-prior,forecast=avg+delta*h;s.data={points:p,predict:forecast,change:(forecast/p[p.length-1]-1)*100,error:null};s.last='Прогноз рассчитан на тестовом ряде';L.log(s,'Окно '+w+', горизонт '+h);},
 view:function(s){return L.result('Рыночная модель',s.last||'Прогноз иллюстративный, не торговый сигнал.',L.metrics([['Прогноз',s.data.error?'—':s.data.predict?s.data.predict.toFixed(2):'—'],['Изменение',s.data.error?'—':s.data.predict?s.data.change.toFixed(1)+'%':'—']])+(s.data.points.length?L.spark(s.data.points.map(function(x){return x/Math.max.apply(null,s.data.points)*100;})):L.note(s.data.error||'Укажите ряд цен и нажмите пересчёт.'))+L.note('Используется простая средняя и тренд, а не настоящая ML-модель. Никаких инвестиционных рекомендаций.'),s.done?(s.data.error?'bad':'ok'):'');}
},
FDS:{
 title:'Проверка транзакции',description:'Измените параметры платежа — правило оценки риска пересчитает решение.',cta:'Оценить риск',
 fields:[['amount','Сумма операции, ₽','number','35000'],['region','Регион','select','local',[['local','Обычный'],['foreign','Новый регион']]],['device','Устройство','select','known',[['known','Известное'],['new','Новое']]],['auth','3-D Secure пройден','check',true]],
 init:function(s){s.data={risk:0,flags:[],decision:'—'};},
 run:function(s){var amount=L.n(s.values.amount),flags=[],score=5;if(amount>50000){score+=35;flags.push('Большая сумма');}if(amount>150000){score+=20;}if(s.values.region==='foreign'){score+=25;flags.push('Новый регион');}if(s.values.device==='new'){score+=20;flags.push('Новое устройство');}if(!s.values.auth){score+=20;flags.push('Нет 3-D Secure');}score=Math.min(100,score);s.data={risk:score,flags:flags,decision:score>=65?'На дополнительную проверку':score>=35?'Запросить подтверждение':'Одобрить'};s.last='Оценён платёж '+L.fmt(amount)+' ₽';L.log(s,'Риск '+score+'/100');},
 view:function(s){return L.result('Риск-скоринг',s.data.decision==='—'?'Проверьте тестовую транзакцию.':s.data.decision,L.metrics([['Баллы риска',s.data.risk+'/100'],['Сработало правил',s.data.flags.length]])+L.progress(s.data.risk)+(s.data.flags.length?L.note(s.data.flags.join(' · ')):L.note('Критичные признаки отсутствуют.'))+L.note('Баллы вычислены демонстрационными правилами, без вызова CatBoost.'),s.done?(s.data.risk>=65?'bad':'ok'):'');}
},
DET:{
 title:'Проверка дефектов изделия',description:'Выберите тестовый образец и порог уверенности — получите решение контроля качества.',cta:'Проверить образец',
 fields:[['sample','Образец','select','scratch',[['scratch','Деталь A · царапина'],['dent','Деталь B · вмятина'],['clean','Деталь C · без дефекта']]],['threshold','Порог уверенности, %','number','75']],
 init:function(s){s.data={kind:'—',confidence:0,flag:false};},
 run:function(s){var data={scratch:['Царапина',91],dent:['Вмятина',83],clean:['Без дефекта',98]}[s.values.sample],threshold=Math.min(100,Math.max(0,L.n(s.values.threshold)));s.data={kind:data[0],confidence:data[1],flag:data[0]!=='Без дефекта'&&data[1]>=threshold};s.last='Образец проанализирован';L.log(s,s.data.kind+' · '+data[1]+'%');},
 view:function(s){return L.result('Контроль качества',s.last||'Симуляция на трёх заранее размеченных образцах.',L.metrics([['Класс',s.data.kind],['Уверенность',s.data.confidence+'%']])+L.progress(s.data.confidence)+L.note(s.done?(s.data.flag?'Отправить изделие на ручную проверку.':'Порог не превышен, автоматическая блокировка не требуется.'):'Выберите образец и порог. Реальное изображение моделью не обрабатывается.'),s.done?(s.data.flag?'bad':'ok'):'');}
},
MGD:{
 title:'Конспект видеолекции',description:'Измените текст транскрипта и соберите короткое извлечение по смысловым предложениям.',cta:'Собрать конспект',
 fields:[['text','Транскрипт фрагмента','textarea','Сегодня изучаем производную. Производная показывает скорость изменения функции. На слайде изображена касательная к графику. Для функции x в квадрате производная равна двум x.'],['max','Сколько тезисов','select','2',[['2','Два'],['3','Три'],['4','Четыре']]]],
 init:function(s){s.data={sentences:[],words:0};},
 run:function(s){var raw=String(s.values.text).trim(),sentences=raw.split(/[.!?]+/).map(function(x){return x.trim();}).filter(Boolean),n=Math.min(4,Number(s.values.max));s.data={sentences:sentences.sort(function(a,b){return b.length-a.length;}).slice(0,n),words:words(raw).length};s.last='Извлечение готово';L.log(s,'Обработано '+sentences.length+' предложений');},
 view:function(s){return L.result('Краткий конспект',s.last||'Вставьте транскрипт и получите выдержку.',L.metrics([['Слов в исходнике',s.data.words],['Тезисов',s.data.sentences.length]])+(s.data.sentences.length?'<div class="spv-lab__tiles">'+s.data.sentences.map(function(x,i){return L.tile('Тезис '+(i+1),x+'.');}).join('')+'</div>':L.note('Демо работает как локальное извлечение предложений, без ASR и LLM.')),s.done?'ok':'');}
},
RAG:docsConfig('RAG','Поиск и учебные тесты',lesson),
TSP:docsConfig('TSP','Поиск по корпоративным документам',legal),
RCC:{
 title:'Персональные рекомендации',description:'Укажите интерес и управляя разнообразием, получите динамическую подборку.',cta:'Пересчитать ленту',
 fields:[['topic','Основной интерес','select','tech',[['tech','Технологии'],['art','Дизайн'],['sport','Спорт']]],['diversity','Разнообразие, %','range','35']],
 init:function(s){s.data={items:[],requested:false};},
 run:function(s){var all=[['Как работает AI','tech',98],['Нейросети без сложных слов','tech',92],['Прототипирование интерфейсов','art',90],['Современная типографика','art',83],['Бег и восстановление','sport',86],['Тренировки на неделю','sport',78]];var d=L.n(s.values.diversity),topic=s.values.topic;var rows=all.map(function(x){return{x:x,score:x[2]+(x[1]===topic?30:Math.round(d*.45))};}).sort(function(a,b){return b.score-a.score;}).slice(0,4);s.data.items=rows;s.last='Лента обновлена';L.log(s,'Тема: '+topic+', разнообразие '+d+'%');},
 view:function(s){return L.result('Подборка для пользователя',s.last||'Измените тему и пересчитайте ранжирование.',L.metrics([['Рекомендаций',s.data.items.length],['Разнообразие',s.values.diversity+'%']])+'<div class="spv-lab__tiles">'+s.data.items.map(function(item,i){return L.tile((i+1)+'. '+item.x[0],item.x[1]+' · балл '+item.score);}).join('')+'</div>',s.done?'ok':'');}
},
S2I:{
 title:'Маршрутизация обращения',description:'Напишите фразу клиента — классификатор правил выберет направление обращения.',cta:'Определить намерение',
 fields:[['phrase','Фраза звонящего','textarea','Хочу узнать статус моей доставки'],['fallback','При неизвестном намерении','select','operator',[['operator','Соединить с оператором'],['menu','Вернуть в голосовое меню']]]],
 init:function(s){s.data={intent:'—',route:'—'};},
 run:function(s){var x=String(s.values.phrase).toLowerCase(),k=/достав|заказ|посылк|трек/.test(x)?['Доставка','Отдел логистики']:/оплат|счет|платеж|возврат/.test(x)?['Оплата','Бухгалтерия']:/поддерж|ошибк|не работа|слом/.test(x)?['Поддержка','Техническая линия']:['Не распознано',s.values.fallback==='operator'?'Оператор':'Главное меню'];s.data={intent:k[0],route:k[1]};s.last='Маршрут выбран';L.log(s,x.slice(0,45)+' → '+k[1]);},
 view:function(s){return L.result('Результат NLU',s.last||'Напишите фразу или измените сценарий.',L.metrics([['Намерение',s.data.intent],['Маршрут',s.data.route]])+L.note('Локальные словарные правила, не аудиозвонок и не настоящая ML-модель.'),s.done?(s.data.intent==='Не распознано'?'bad':'ok'):'');}
},
SVC:{
 title:'Редактор фрагмента речи',description:'Проверьте исправляемый текст и прослушайте системный синтез вместо реального клонирования голоса.',cta:'Подготовить исправление',
 fields:[['original','Исходная фраза','textarea','Встреча состоится в среду в десять часов.'],['new','Исправленная фраза','textarea','Встреча состоится в пятницу в одиннадцать часов.']],
 init:function(s){s.data={changes:[],prepared:false};},
 run:function(s){var a=words(s.values.original),b=words(s.values.new),changes=b.filter(function(w){return a.indexOf(w)<0;});s.data={changes:changes,prepared:!!String(s.values.new).trim()};s.last='Фрагмент подготовлен';L.log(s,'Отличающихся слов: '+changes.length);},
 onAction:function(s,a){if(a==='listen'&&s.data.prepared&&'speechSynthesis'in window){window.speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(s.values.new));u.lang='ru-RU';window.speechSynthesis.speak(u);L.log(s,'Запущен голос браузера (не клонированный)');}},
 buttons:[['Прослушать голос браузера','listen']],
 view:function(s){return L.result('Редактор речи',s.last||'Подготовьте текст, чтобы сравнить изменения.',L.metrics([['Новых слов',s.data.changes.length],['Статус',s.data.prepared?'Подготовлен':'Черновик']])+(s.data.prepared?L.note('Изменено: '+s.data.changes.join(', ')):L.note('Синтез в браузере не сохраняет голос спикера.'))+L.spark([25,42,70,32,65,87,50,75,43,62,30,51,73,25]),s.done?'ok':'');}
},
VTR:{
 title:'Поиск внутри видеозаписи',description:'Введите термин, найдите его среди таймкодированных фрагментов и выберите момент.',cta:'Найти фрагмент',
 fields:[['term','Поиск по речи','text','архитектура']],
 init:function(s){s.data={segments:[['00:12','Начнём с архитектуры программного комплекса.'],['01:25','Затем подключим базу данных и API.'],['03:40','Проверим очереди и обработку ошибок.'],['05:10','Подведём итоги и оценим архитектуру.']],hits:[],selected:null};},
 run:function(s){var q=String(s.values.term).toLowerCase();s.data.hits=s.data.segments.filter(function(x){return x[1].toLowerCase().includes(q)&&q.length>0;});s.last='Найдено '+s.data.hits.length+' фрагментов';L.log(s,s.last);},
 onAction:function(s,a,id){if(a==='seek'){s.data.selected=id;L.log(s,'Выбран таймкод '+id);}},
 view:function(s){return L.result('Транскрипт с таймкодами',s.data.selected?'Выбран фрагмент '+s.data.selected:s.last||'Поиск по готовым тестовым субтитрам.',L.metrics([['Всего фрагментов',s.data.segments.length],['Совпадений',s.data.hits.length]])+'<div class="spv-lab__tiles">'+(s.done?s.data.hits:s.data.segments).map(function(x){return L.tile(x[0],x[1],'seek',x[0],'Перейти');}).join('')+'</div>',s.done?'ok':'');}
},
OCS:invoiceConfig('OCS'),
SHP:invoiceConfig('SHP')
};
L.add(d);
}());
