
(function(){
'use strict';var L=window.SPV_LABS;if(!L)return;
function readOnly(t){return L.esc(t);}
function rowsMarkup(items,get){return '<div class="spv-lab__tiles">'+items.map(get).join('')+'</div>';}
var all={
FPL:{
 title:'Логистическая CRM',description:'Создавайте заявки, назначайте водителя и продвигайте заказ по этапам.',cta:'Создать заказ',
 fields:[['client','Клиент','text','ООО Логистика'],['route','Маршрут','text','Санкт-Петербург → Москва'],['driver','Водитель','select','Иван',[['Иван','Иван'],['Мария','Мария'],['Не назначен','Не назначен']]]],
 init:function(s){s.data={seq:103,orders:[{id:101,client:'ООО Север',route:'СПб → Выборг',driver:'Мария',status:1},{id:102,client:'Магазин 24',route:'Москва → Тверь',driver:'Иван',status:0}]};},
 run:function(s){s.data.orders.unshift({id:s.data.seq++,client:String(s.values.client).trim()||'Новый клиент',route:s.values.route,driver:s.values.driver,status:0});L.log(s,'Заявка добавлена в CRM');s.last='Заказ создан';},
 onAction:function(s,a,id){var item=s.data.orders.find(function(x){return String(x.id)===id;});if(a==='next'&&item){item.status=Math.min(3,item.status+1);L.log(s,'Заказ #'+item.id+': '+['Новый','В пути','Доставлен','Закрыт'][item.status]);}},
 view:function(s){var names=['Новый','В пути','Доставлен','Закрыт'];return L.result('Диспетчерская',s.last||'Все заявки демонстрационные.',L.metrics([['Заказов',s.data.orders.length],['В пути',s.data.orders.filter(function(x){return x.status===1;}).length]])+rowsMarkup(s.data.orders,function(x){return L.tile('#'+x.id+' · '+x.client,x.route+' · '+x.driver+' · '+names[x.status],x.status<3?'next':'',x.id,'Следующий статус');}),s.done?'ok':'');}
},
IDM:{
 title:'Управление ролями',description:'Изменяйте доступ пользователя и проверяйте матрицу разрешений.',cta:'Применить право',
 fields:[['user','Пользователь','select','anna',[['anna','Анна · менеджер'],['oleg','Олег · аналитик'],['admin','Администратор']]],['permission','Разрешение','select','reports',[['reports','Просмотр отчётов'],['edit','Редактирование заказов'],['billing','Счета и оплата']]],['mode','Действие','select','grant',[['grant','Разрешить'],['revoke','Отозвать']]]],
 init:function(s){s.data={users:{anna:['reports','edit'],oleg:['reports'],admin:['reports','edit','billing']},changes:0};},
 run:function(s){var values=s.data.users[s.values.user],p=s.values.permission;values=values.filter(function(x){return x!==p;});if(s.values.mode==='grant')values.push(p);s.data.users[s.values.user]=values;s.data.changes++;s.last='Политика доступа изменена';L.log(s,s.values.user+' · '+p+' · '+s.values.mode);},
 view:function(s){return L.result('Права доступа',s.last||'Выберите сотрудника и примените правило.',L.metrics([['Пользователей',3],['Изменений',s.data.changes]])+L.table(['Учётная запись','Отчёты','Заказы','Счета'],Object.keys(s.data.users).map(function(user){return[user].concat(['reports','edit','billing'].map(function(p){return s.data.users[user].includes(p)?'Разрешено':'—';}));})),s.done?'ok':'');}
},
LMS:{
 title:'Учебный кабинет',description:'Пройдите урок, ответьте на вопрос и получите локальное подтверждение результата.',cta:'Проверить ответ',
 fields:[['answer','Чему равна производная x²?','select','2x',[['2x','2x'],['x','x'],['x2','x²'],['0','0']]]],
 init:function(s){s.data={completed:0,attempts:0,correct:false,cert:false};},
 run:function(s){s.data.attempts++;s.data.correct=s.values.answer==='2x';if(s.data.correct)s.data.completed=1;s.last=s.data.correct?'Ответ верный. Урок пройден.':'Ответ неверный. Попробуйте ещё раз.';L.log(s,s.last);},
 onAction:function(s,a){if(a==='certificate'&&s.data.completed){s.data.cert=true;L.log(s,'Учебный сертификат сформирован локально');}},
 buttons:[['Получить сертификат','certificate']],
 view:function(s){return L.result('Прогресс обучения',s.data.cert?'Сертификат № DEMO-001 готов.':s.last||'Откройте тест и выберите правильный ответ.',L.metrics([['Пройдено уроков',s.data.completed+'/1'],['Попыток',s.data.attempts]])+L.progress(s.data.completed*100)+L.note(s.data.cert?'Ученик: тестовый пользователь · курс: основы математики.':'После успешного теста нажмите «Получить сертификат».')+(s.data.correct?L.tile('Производная x²','2x — применено правило степени'):' '),s.done?(s.data.correct?'ok':'bad'):'');}
},
SNB:{
 title:'Социальная лента',description:'Опубликуйте запись и поставьте реакции внутри демонстрационного профиля.',cta:'Опубликовать',
 fields:[['text','Текст публикации','textarea','Сегодня запустили первую версию приложения!']],
 init:function(s){s.data={posts:[{id:1,text:'Добро пожаловать в сообщество!',likes:3},{id:2,text:'Показываем первые прототипы.',likes:1}],following:false,seq:3};},
 run:function(s){if(!String(s.values.text).trim()){s.last='Введите текст публикации';return;}s.data.posts.unshift({id:s.data.seq++,text:s.values.text,likes:0});s.last='Пост появился в ленте';L.log(s,s.last);},
 onAction:function(s,a,id){if(a==='like'){var post=s.data.posts.find(function(x){return String(x.id)===id;});if(post){post.likes++;L.log(s,'Реакция на публикацию');}}if(a==='follow'){s.data.following=!s.data.following;L.log(s,s.data.following?'Подписка оформлена':'Подписка отменена');}},
 buttons:[['Подписаться / отменить','follow']],
 view:function(s){return L.result('Публикации',s.last||'Все записи и реакции хранятся только в этой вкладке.',L.metrics([['Постов',s.data.posts.length],['Подписка',s.data.following?'Да':'Нет']])+rowsMarkup(s.data.posts,function(x){return L.tile(x.text,x.likes+' реакций','like',x.id,'Нравится');}),s.done?'ok':'');}
},
STB:{
 title:'Видеоплатформа',description:'Поставьте файл в очередь транскодинга и переключайте состояние воспроизведения.',cta:'Начать обработку',
 fields:[['video','Название видео','text','Вводная лекция'],['quality','Профиль HLS','select','720',[['360','360p'],['720','720p'],['1080','1080p']]],['subtitles','Субтитры','check',true]],
 init:function(s){s.data={video:'Вводная лекция',progress:0,playing:false,quality:'720p',sub:true};},
 run:function(s){s.data={video:s.values.video,progress:100,playing:false,quality:s.values.quality+'p',sub:s.values.subtitles};s.last='Тестовый HLS-манифест готов';L.log(s,'Очередь транскодинга: завершено');},
 onAction:function(s,a){if(a==='toggle'){s.data.playing=!s.data.playing;L.log(s,s.data.playing?'Предпросмотр запущен':'Предпросмотр остановлен');}},
 buttons:[['Воспроизвести / пауза','toggle']],
 view:function(s){return L.result('Очередь видео',s.data.playing?'Предпросмотр воспроизводится (без медиапотока).':s.last||'Запустите обработку тестового видео.',L.metrics([['Качество',s.data.quality],['Обработка',s.data.progress+'%']])+L.progress(s.data.progress)+'<div class="spv-lab__tile"><div><strong>'+readOnly(s.data.video)+'</strong><small>Субтитры: '+(s.data.sub?'включены':'выключены')+'</small></div>'+L.pill(s.data.playing?'Пауза':'Готово')+'</div>'+L.note('Демо моделирует очередь, HLS-профили и состояние плеера; реальное видео не транскодируется.'),s.done?'ok':'');}
},
WLB:{
 title:'Баланс активности',description:'Записывайте время работы и отдыха и наблюдайте изменение соотношения.',cta:'Добавить активность',
 fields:[['type','Тип активности','select','work',[['work','Работа'],['rest','Отдых'],['sport','Спорт']]],['minutes','Длительность, мин','number','45']],
 init:function(s){s.data={items:[['Работа',120],['Отдых',40]],totals:{work:120,rest:40,sport:0}};},
 run:function(s){var n=Math.max(1,Math.min(600,L.n(s.values.minutes,1))),type=s.values.type;s.data.totals[type]+=n;s.data.items.unshift([{work:'Работа',rest:'Отдых',sport:'Спорт'}[type],n]);s.last='Активность сохранена';L.log(s,'Добавлено '+n+' мин');},
 view:function(s){var d=s.data.totals,total=d.work+d.rest+d.sport;return L.result('Личный дашборд',s.last||'Добавьте активность и сравните доли.',L.metrics([['Работа',d.work+' мин'],['Не работа',d.rest+d.sport+' мин']])+L.progress(total?Math.round(d.work/total*100):0)+L.table(['Событие','Минуты'],s.data.items.slice(0,5)),s.done?'ok':'');}
},
BTA:{
 title:'BANT-квалификация лида',description:'Ответьте на уточняющий вопрос — карточка лида заполнится, как в CRM.',cta:'Отправить ответ',
 fields:[['message','Ваше сообщение','text','Бюджет 500 тыс. рублей, хотим запустить за месяц']],
 init:function(s){s.data={chat:[['bot','Здравствуйте! Какой у вас бюджет и когда нужен запуск?']],fields:{budget:'—',need:'—',deadline:'—'},stage:0};},
 run:function(s){var v=String(s.values.message).trim();if(!v){s.last='Введите ответ';return;}s.data.chat.push(['me',v]);var lower=v.toLowerCase();if(/\d/.test(lower)&&(/бюдж|тыс|млн|руб/.test(lower)))s.data.fields.budget=v.match(/[\d., ]+(?:тыс|млн)?/i)?.[0]?.trim()||'Уточнён';if(/сайт|бот|crm|сервис|продукт|автоматиз/.test(lower))s.data.fields.need=v.slice(0,60);if(/месяц|недел|срок|завтра|день/.test(lower))s.data.fields.deadline=v.slice(0,55);var prompts=['Что именно нужно автоматизировать?','Кто утверждает решение?','Спасибо. Я сохраню ответы в тестовой CRM.'];var reply=prompts[Math.min(s.data.stage++,2)];s.data.chat.push(['bot',reply]);s.last='Диалог обновлён';L.log(s,'Ответ сохранён');},
 view:function(s){return L.result('Диалог с лидом',s.last||'Никаких сообщений в реальную CRM не отправляется.',L.metrics([['Полей заполнено',Object.values(s.data.fields).filter(function(x){return x!=='—';}).length+'/3'],['Сообщений',s.data.chat.length]])+'<div class="spv-lab__chat">'+s.data.chat.map(function(x){return'<div class="spv-lab__bubble'+(x[0]==='me'?' spv-lab__bubble--self':'')+'">'+readOnly(x[1])+'</div>';}).join('')+'</div>'+L.table(['Поле','Значение'],Object.entries(s.data.fields)),s.done?'ok':'');}
},
CCH:{
 title:'Единый центр сообщений',description:'Выберите канал, отправьте ответ и посмотрите, как меняется общий диалог.',cta:'Ответить клиенту',
 fields:[['channel','Канал','select','tg',[['tg','Telegram'],['wa','WhatsApp'],['email','Email'],['vk','ВКонтакте']]],['message','Сообщение','textarea','Здравствуйте! Уточним детали вашего заказа.']],
 init:function(s){s.data={messages:[{channel:'tg',sender:'Клиент',text:'Добрый день, где мой заказ?'},{channel:'email',sender:'Клиент',text:'Пожалуйста, пришлите документы.'}],unread:2};},
 run:function(s){var text=String(s.values.message).trim();if(!text){s.last='Введите ответ';return;}s.data.messages.unshift({channel:s.values.channel,sender:'Менеджер',text:text});s.last='Ответ добавлен в общую ленту';L.log(s,'Канал: '+s.values.channel);},
 onAction:function(s,a){if(a==='read'){s.data.unread=0;L.log(s,'Все обращения прочитаны');}},
 buttons:[['Отметить прочитанными','read']],
 view:function(s){return L.result('Омниканальная лента',s.last||'Все сообщения существуют только в песочнице.',L.metrics([['Сообщений',s.data.messages.length],['Непрочитано',s.data.unread]])+rowsMarkup(s.data.messages,function(x){return L.tile(x.sender+' · '+x.channel,x.text);}),s.done?'ok':'');}
},
ME:{
 title:'Конструктор сметы',description:'Введите площадь, тариф и дополнительную работу. Сумма пересчитывается локально.',cta:'Рассчитать смету',
 fields:[['area','Площадь, м²','number','48'],['rate','Цена работ за м², ₽','number','2100'],['material','Материалы','select','medium',[['economy','Эконом (850 ₽/м²)'],['medium','Стандарт (1400 ₽/м²)'],['premium','Премиум (2400 ₽/м²)']]],['extra','Доставка материалов','check',true]],
 init:function(s){s.data={sum:0,works:0,materials:0,delivery:0};},
 run:function(s){var area=Math.max(0,L.n(s.values.area)),rate=Math.max(0,L.n(s.values.rate)),mp={economy:850,medium:1400,premium:2400}[s.values.material],works=area*rate,material=area*mp,delivery=s.values.extra?3500:0;s.data={sum:works+material+delivery,works:works,materials:material,delivery:delivery};s.last='Смета пересчитана';L.log(s,L.fmt(s.data.sum)+' ₽');},
 view:function(s){return L.result('Предварительный расчёт',s.last||'Не является коммерческой офертой.',L.metrics([['Итого, ₽',L.fmt(s.data.sum)],['Работы, ₽',L.fmt(s.data.works)]])+L.table(['Статья','Стоимость, ₽'],[['Работы',L.fmt(s.data.works)],['Материалы',L.fmt(s.data.materials)],['Доставка',L.fmt(s.data.delivery)]]),s.done?'ok':'');}
},
NTF:{
 title:'Отправка уведомлений',description:'Выберите канал, адресата и текст. Сообщение появится в локальном журнале доставки.',cta:'Добавить в очередь',
 fields:[['channel','Канал','select','tg',[['tg','Telegram'],['email','Email'],['sms','SMS']]],['contact','Контакт (тестовый)','text','demo@example.org'],['message','Текст уведомления','textarea','Ваш заказ принят и передан в обработку.']],
 init:function(s){s.data={queue:[],count:0};},
 run:function(s){if(!String(s.values.message).trim()){s.last='Введите сообщение';return;}s.data.queue.unshift({id:++s.data.count,channel:s.values.channel,contact:s.values.contact,status:'В очереди',message:s.values.message});s.last='Уведомление поставлено в очередь';L.log(s,s.last);},
 onAction:function(s,a,id){if(a==='deliver'){var item=s.data.queue.find(function(x){return String(x.id)===id;});if(item){item.status='Доставлено (эмуляция)';L.log(s,'Тестовая доставка #'+id);}}},
 view:function(s){return L.result('Монитор рассылки',s.last||'Ни один контакт не получает настоящих сообщений.',L.metrics([['В очереди',s.data.queue.filter(function(x){return x.status==='В очереди';}).length],['Уведомлений',s.data.count]])+rowsMarkup(s.data.queue,function(x){return L.tile('#'+x.id+' · '+x.channel+' · '+x.contact,x.status+' · '+x.message,x.status==='В очереди'?'deliver':'',x.id,'Доставить');}),s.done?'ok':'');}
}
};
L.add(all);
}());
