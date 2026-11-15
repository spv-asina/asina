
(function(){
'use strict';
var L=window.SPV_LABS;if(!L)return;
function tableOrEmpty(s,headers,rows){return rows&&rows.length?L.table(headers,rows):'<div class="spv-lab__empty">Запустите сценарий, чтобы получить результаты.</div>';}
function splitLines(s){return String(s||'').split(/\r?\n/).map(function(x){return x.trim();}).filter(Boolean);}
function csv(s){return splitLines(s).map(function(x){return x.split(/[;,]/).map(function(t){return t.trim();});});}
var defs={
PIP:{
 title:'Конструктор интеграций',description:'Соберите цепочку триггер → преобразование → действие и запустите её на тестовом событии.',cta:'Выполнить сценарий',
 fields:[['event','Входящий webhook','textarea','{"order_id": 42, "amount": 12500}'],['map','Преобразование','select','add_tag',[['add_tag','Добавить тег'],['discount','Рассчитать скидку 10%'],['normal','Без изменений']]],['target','Получатель','select','crm',[['crm','CRM'],['telegram','Telegram'],['archive','Журнал событий']]]],
 init:function(s){s.data={steps:['Webhook','Преобразование','Получатель'],runs:[],active:true};},
 run:function(s){try{var obj=JSON.parse(s.values.event);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Ожидался JSON-объект');
 if(s.values.map==='discount')obj.discount=Math.round(L.n(obj.amount)*.1);if(s.values.map==='add_tag')obj.tag='new';
 s.data.runs.unshift({target:s.values.target,data:JSON.stringify(obj),status:'OK'});s.last='Доставлено в '+s.values.target;L.log(s,'Webhook принят → '+s.values.map+' → '+s.values.target);
 }catch(e){s.last='JSON не разобран: '+e.message;L.log(s,s.last);}},
 onAction:function(s,a,id){if(a==='clear'){s.data.runs=[];L.log(s,'История очищена');}},
 buttons:[['Очистить журнал','clear']],
 view:function(s){var d=s.data;return L.result(s.last&&s.last.startsWith('JSON не')?'Ошибка входного JSON':d.runs.length?'Сценарий выполнен':'Сценарий готов к запуску',s.last||'Измените JSON, выберите преобразование и назначение.',L.metrics([['Шагов',3],['Выполнений',d.runs.length]])+'<div class="spv-lab__tiles">'+d.steps.map(function(x,i){return L.tile((i+1)+'. '+x,i===0?'Триггер':i===1?s.values.map:s.values.target);}).join('')+'</div>'+tableOrEmpty(s,['Назначение','Результат'],d.runs.slice(0,3).map(function(r){return[r.target,r.data];})),s.done&&s.last.startsWith('JSON не')?'bad':s.done&&d.runs.length?'ok':s.done?'bad':'');}
},
DCM:{
 title:'Очистка набора данных',description:'Введите CSV-строки, выберите правило и посмотрите, какие записи сохранились.',cta:'Проверить и очистить',
 fields:[['raw','Данные: id;имя;сумма','textarea','1;Анна;120\n2;Иван;250\n2;Иван;250\n3;;500\n4;Олег;90'],['mode','Правило','select','both',[['both','Удалить дубликаты и неполные'],['dedupe','Только дубликаты'],['empty','Только неполные']]]],
 init:function(s){s.data={total:0,removed:0,rows:[]};},
 run:function(s){var lines=csv(s.values.raw),seen=new Set(),rows=[];lines.forEach(function(row){var empty=row.length<3||row.some(function(x){return !x;});var dup=seen.has(row.join('|'));seen.add(row.join('|'));if((s.values.mode!=='dedupe'&&empty)||(s.values.mode!=='empty'&&dup))return;rows.push(row);});s.data={total:lines.length,removed:lines.length-rows.length,rows:rows};s.last='Проверка завершена';L.log(s,'Обработано '+lines.length+' строк, исключено '+s.data.removed);},
 view:function(s){return L.result('Контроль качества',s.last||'Загрузите пример и запустите очистку.',L.metrics([['Исходных',s.data.total],['Удалено',s.data.removed]])+tableOrEmpty(s,['ID','Имя','Сумма'],s.data.rows),s.done?'ok':'');}
},
DMB:{
 title:'Миграция данных',description:'Проверьте преобразование записей и имитацию загрузки в целевую базу.',cta:'Перенести записи',
 fields:[['records','Источник: id;name;value','textarea','11;Order A;1400\n12;Order B;750\n13;Order C;2400'],['target','Целевая БД','select','document',[['document','Документная'],['sql','SQL-таблица']]],['mode','Поле суммы','select','int',[['int','Целое число'],['float','Число с дробной частью']]]],
 init:function(s){s.data={rows:[],errors:0};},
 run:function(s){var errors=0;var rows=csv(s.values.records).map(function(r){var n=Number(r[2]);if(!Number.isFinite(n)||!r[0]||!r[1]){errors++;return null;}return[r[0],r[1],s.values.mode==='int'?String(Math.round(n)):n.toFixed(2),s.values.target];}).filter(Boolean);s.data={rows:rows,errors:errors};s.last='Импорт: '+rows.length+' записей';L.log(s,s.last+'; ошибок '+errors);},
 view:function(s){return L.result('Пакет миграции',s.last||'Редактируйте исходные записи и выберите тип полей.',L.metrics([['Перенесено',s.data.rows.length],['Ошибок',s.data.errors]])+tableOrEmpty(s,['ID','Название','Сумма','Хранилище'],s.data.rows),s.done&&s.data.errors?'bad':s.done?'ok':'');}
},
DSB:{
 title:'Синхронизация двух баз',description:'Создайте конфликт записей и выберите, какое значение должно победить.',cta:'Синхронизировать',
 fields:[['key','Ключ записи','text','customer-17'],['left','База A: значение','text','Анна, телефон 123'],['right','База B: значение','text','Анна, телефон 999'],['policy','Политика конфликта','select','newer',[['newer','Выбрать B (новее)'],['source','Приоритет A'],['manual','Не объединять автоматически']]]],
 init:function(s){s.data={a:'Анна, телефон 123',b:'Анна, телефон 999',conflict:true};},
 run:function(s){var a=s.values.left,b=s.values.right, conflict=a!==b;var val=conflict&&s.values.policy==='manual'?null:conflict&&s.values.policy==='newer'?b:a;s.data={a:val===null?a:val,b:val===null?b:val,conflict:val===null&&conflict};s.last=val===null?'Конфликт оставлен для ручной проверки':'Обе базы согласованы';L.log(s,s.values.key+': '+s.last);},
 view:function(s){return L.result('Состояние реплик',s.last||'Запустите сравнение, чтобы применить правило конфликта.',L.metrics([['Различие',s.data.a!==s.data.b?'Есть':'Нет'],['Статус',s.data.conflict?'Конфликт':'Согласовано']])+L.table(['База','Значение'],[['A',s.data.a],['B',s.data.b]])+(s.data.conflict?L.note('Данные отличаются: нужен выбор победителя.'):' '),s.done&&s.data.conflict?'bad':s.done?'ok':'');}
},
ETL:{
 title:'Инкрементальный ETL',description:'Выполните загрузку изменений, управляя размером пакета и ошибкой соединения.',cta:'Запустить загрузку',
 fields:[['batch','Записей в пакете','number','25'],['source','Источник','select','orders',[['orders','orders'],['clients','clients'],['events','events']]],['fail','Имитация недоступности ClickHouse','check',false]],
 init:function(s){s.data={watermark:1200,loaded:0,status:'Готово к запуску',history:[]};},
 run:function(s){var n=Math.max(1,Math.min(200,Math.floor(L.n(s.values.batch,1))));if(s.values.fail){s.data.status='Retry: соединение недоступно';s.data.history.unshift('Ошибка соединения · пакет '+n);L.log(s,'Не удалось отправить пакет. Watermark сохранён.');return;}s.data.watermark+=n;s.data.loaded+=n;s.data.status='Пакет загружен';s.data.history.unshift('+'+n+' → '+s.values.source);L.log(s,'Загружено '+n+' новых строк');},
 view:function(s){return L.result('Монитор загрузки',s.data.status,L.metrics([['Watermark',s.data.watermark],['Всего загружено',s.data.loaded]])+L.progress(Math.min(100,s.data.loaded/2))+L.table(['Последние операции','Записей'],s.data.history.slice(0,4).map(function(r){return[r,'✓'];})),s.done&&s.values.fail?'bad':s.done?'ok':'');}
},
FPT:{
 title:'Пакетная обработка файлов',description:'Отфильтруйте файлы, проверьте расширение и отправьте корректные в архив.',cta:'Обработать пакет',
 fields:[['files','Файлы (по одному в строке)','textarea','contract.pdf\ninvoice.csv\nnotes.txt\nbackup.exe\nscan.pdf'],['allowed','Допустимые расширения','select','pdf-csv',[['pdf-csv','PDF и CSV'],['all','PDF, CSV, TXT']]],['archive','Архивировать успешные','check',true]],
 init:function(s){s.data={items:[]};},
 run:function(s){var allow=s.values.allowed==='all'?['pdf','csv','txt']:['pdf','csv'];var items=splitLines(s.values.files).map(function(name){var ext=name.split('.').pop().toLowerCase(),good=allow.indexOf(ext)>=0;return [name,good?(s.values.archive?'В архиве':'Проверен'):'Отклонён'];});s.data.items=items;s.last='Пакет проверен';L.log(s,'Успешно: '+items.filter(function(r){return r[1]!=='Отклонён';}).length);},
 view:function(s){var rows=s.data.items;return L.result('Очередь файлов',s.last||'Измените список файлов и обработайте пакет.',L.metrics([['Файлов',rows.length],['Отклонено',rows.filter(function(x){return x[1]==='Отклонён';}).length]])+tableOrEmpty(s,['Имя','Состояние'],rows),s.done?'ok':'');}
},
FLB:{
 title:'Конструктор признаков',description:'Преобразуйте числовой столбец и сохраните версию расчёта.',cta:'Пересчитать признаки',
 fields:[['values','Исходный числовой столбец','text','12, 25, 40, 10, 18'],['method','Преобразование','select','minmax',[['minmax','Min–Max [0; 1]'],['square','Квадрат'],['center','Вычитание среднего']]]],
 init:function(s){s.data={version:1,rows:[],valid:true};},
 run:function(s){var input=String(s.values.values).split(/[,;\s]+/).filter(Boolean).map(Number);var ok=input.length>0&&input.every(Number.isFinite);if(!ok){s.data.valid=false;s.last='Укажите только числа';return;}var min=Math.min.apply(null,input),max=Math.max.apply(null,input),mean=input.reduce(function(a,b){return a+b;},0)/input.length;var vals=input.map(function(x){return s.values.method==='square'?x*x:s.values.method==='center'?x-mean:(x-min)/(max-min||1);});s.data={version:s.data.version+1,rows:input.map(function(x,i){return[x,vals[i].toFixed(3)];}),valid:true};s.last='Набор признаков v'+s.data.version;L.log(s,'Расчёт '+s.values.method+' выполнен');},
 view:function(s){return L.result('Витрина признаков',s.last||'Выберите преобразование и пересчитайте выборку.',L.metrics([['Версия','v'+s.data.version],['Объектов',s.data.rows.length]])+tableOrEmpty(s,['Исходный','Результат'],s.data.rows),s.done?(s.data.valid?'ok':'bad'):'');}
},
WSC:{
 title:'Распределённый сбор URL',description:'Добавьте адреса, выберите число воркеров и выполните имитацию обхода без сетевых запросов.',cta:'Запустить воркеры',
 fields:[['urls','URL, каждый с новой строки','textarea','https://example.org/catalog\nhttps://example.org/about\nhttps://example.org/catalog'],['workers','Число воркеров','number','3']],
 init:function(s){s.data={items:[],total:0};},
 run:function(s){var input=splitLines(s.values.urls),dedup=[...new Set(input)],workers=Math.max(1,Math.min(8,Math.floor(L.n(s.values.workers,1))));s.data={total:input.length,items:dedup.map(function(url,i){try{var u=new URL(url);if(!/^https?:$/.test(u.protocol))throw Error();return [u.hostname+u.pathname,'Воркер '+(i%workers+1),'Сохранено'];}catch(e){return[url,'—','Некорректный URL'];}})};s.last='Очередь обработана';L.log(s,dedup.length+' уникальных адресов, воркеров: '+workers);},
 view:function(s){return L.result('Результаты обхода',s.last||'Сбор тестовый — сайты не запрашиваются.',L.metrics([['Адресов',s.data.total],['Уникальных',s.data.items.length]])+tableOrEmpty(s,['Адрес','Исполнитель','Статус'],s.data.items),s.done?'ok':'');}
}
};
L.add(defs);
}());
