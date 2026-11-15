
(function(){
'use strict';var L=window.SPV_LABS;if(!L)return;
var all={
APG:{
 title:'API Gateway',description:'Отправляйте тестовые запросы через политики авторизации и ограничения частоты.',cta:'Отправить запрос',
 fields:[['route','Маршрут','select','orders',[['orders','GET /api/orders'],['users','GET /api/users'],['payments','POST /api/payments']]],['token','OAuth2 token','select','valid',[['valid','Действительный'],['invalid','Недействительный']]],['limit','Лимит запросов','number','3']],
 init:function(s){s.data={requests:0,logs:[],status:0};},
 run:function(s){s.data.requests++;var status=s.values.token==='invalid'?401:s.data.requests>L.n(s.values.limit)?429:200;var msg={200:'OK',401:'Unauthorized',429:'Too Many Requests'}[status];s.data.status=status;s.data.logs.unshift([s.data.requests,s.values.route,status,msg]);s.last=status+' '+msg;L.log(s,s.values.route+' → '+s.last);},
 onAction:function(s,a){if(a==='clear'){s.data.requests=0;s.data.logs=[];s.data.status=0;L.log(s,'Rate limit сброшен');}},
 buttons:[['Сбросить лимитер','clear']],
 view:function(s){return L.result('Запросы к шлюзу',s.last||'Изменяйте маршрут и OAuth2 token.',L.metrics([['Всего запросов',s.data.requests],['HTTP статус',s.data.status||'—']])+(s.data.logs.length?L.table(['№','Маршрут','Код','Ответ'],s.data.logs.slice(0,5)):L.note('Пока не отправлено ни одного запроса.')),s.done?(s.data.status===200?'ok':'bad'):'');}
},
CDP:{
 title:'Управление релизом',description:'Разверните canary-версию, проверьте health и выберите promote или rollback.',cta:'Запустить canary',
 fields:[['version','Версия релиза','text','v2.3.1'],['traffic','Процент трафика','select','10',[['10','10%'],['25','25%'],['50','50%']]],['health','Состояние health-check','select','ok',[['ok','Все проверки проходят'],['fail','Ошибки в health-check']]]],
 init:function(s){s.data={stage:'production',stable:'v2.3.0',canary:null,events:['v2.3.0 · production стабильна']};},
 run:function(s){s.data.canary=s.values.version;s.data.stage=s.values.health==='ok'?'canary':'failed';s.data.events.unshift(s.values.version+' · '+s.data.stage+' · '+s.values.traffic+'%');s.last=s.values.health==='ok'?'Canary запущен':'Health-check не прошёл';L.log(s,s.last);},
 onAction:function(s,a){if(a==='promote'&&s.data.stage==='canary'){s.data.stable=s.data.canary;s.data.stage='production';s.last='Продвижение в production';}else if(a==='rollback'){s.data.canary=null;s.data.stage='production';s.last='Откат к '+s.data.stable;}else return;s.data.events.unshift(s.last);L.log(s,s.last);},
 buttons:[['Promote','promote'],['Rollback','rollback']],
 view:function(s){return L.result('Панель доставки',s.last||'Стабильная версия работает.',L.metrics([['Production',s.data.stable],['Этап',s.data.stage]])+'<div class="spv-lab__tiles">'+s.data.events.slice(0,5).map(function(x,i){return L.tile('Событие '+(i+1),x);}).join('')+'</div>',s.done?(s.data.stage==='failed'?'bad':'ok'):'');}
},
K8S:{
 title:'Планировщик GPU-заданий',description:'Добавьте задачу, укажите GPU и приоритет, затем распределите по доступным узлам.',cta:'Поставить задачу',
 fields:[['task','Название задания','text','train-nlp'],['type','Тип GPU','select','T4',[['T4','NVIDIA T4'],['A100','NVIDIA A100']]],['priority','Приоритет','select','normal',[['normal','Обычный'],['high','Высокий']]]],
 init:function(s){s.data={jobs:[{id:1,name:'segment-cv',gpu:'T4',priority:'normal',status:'В очереди'}],next:2,capacity:{T4:2,A100:1}};},
 run:function(s){s.data.jobs.push({id:s.data.next++,name:s.values.task||'new-job',gpu:s.values.type,priority:s.values.priority,status:'В очереди'});s.last='Задание добавлено в очередь';L.log(s,s.last);},
 onAction:function(s,a){if(a==='schedule'){var jobs=s.data.jobs.filter(function(x){return x.status==='В очереди';}).sort(function(a,b){return (a.priority==='high'?-1:1)-(b.priority==='high'?-1:1);});var free={T4:s.data.capacity.T4,A100:s.data.capacity.A100};jobs.forEach(function(x){if(free[x.gpu]>0){x.status='Выполняется';free[x.gpu]--;}});s.last='Очередь распределена';L.log(s,s.last);}},
 buttons:[['Распределить задачи','schedule']],
 view:function(s){return L.result('Очередь ресурсов',s.last||'Добавляйте задания и запускайте планировщик.',L.metrics([['Всего заданий',s.data.jobs.length],['Запущено',s.data.jobs.filter(function(x){return x.status==='Выполняется';}).length]])+L.table(['Задание','GPU','Приоритет','Статус'],s.data.jobs.map(function(x){return[x.name,x.gpu,x.priority,x.status];})),s.done?'ok':'');}
},
MPA:{
 title:'Монитор микросервисов',description:'Изменяйте статус сервиса, смотрите зависимые компоненты и проверяйте защиту circuit breaker.',cta:'Проверить контур',
 fields:[['service','Сервис','select','auth',[['auth','Auth service'],['api','API service'],['db','Database']]],['command','Операция','select','restart',[['restart','Перезапустить'],['fail','Имитация сбоя'],['recover','Восстановить']]]],
 init:function(s){s.data={services:{auth:'healthy',api:'healthy',db:'healthy'},requests:0};},
 run:function(s){var target=s.values.service;s.data.services[target]=s.values.command==='fail'?'down':'healthy';s.data.requests++;s.last=target+' → '+s.data.services[target];L.log(s,s.last);},
 view:function(s){var down=Object.values(s.data.services).filter(function(x){return x==='down';}).length;return L.result('Состояние сервисов',s.last||'Отправьте команду одному из сервисов.',L.metrics([['Работает',3-down+'/3'],['Тестовых команд',s.data.requests]])+L.table(['Сервис','Состояние','Circuit breaker'],Object.keys(s.data.services).map(function(k){return[k,s.data.services[k],s.data.services[k]==='down'?'Открыт':'Закрыт'];})),s.done?(down?'bad':'ok'):'');}
}
};
L.add(all);
}());
