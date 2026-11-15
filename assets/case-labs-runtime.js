/* SPV ASINA · accessible, functional local workbench for each technical case. */
(function(){
'use strict';
const catalog=window.SPV_CASE_LABS;
const run=window.SPV_CASE_LABS_RUN;
if(!catalog||typeof run!=='function')return;
const e=x=>String(x===undefined||x===null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const asString=x=>String(x===undefined||x===null?'':x);
const iso=()=>new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const clone=x=>JSON.parse(JSON.stringify(x));
const tabs=[['work','Сценарий'],['history','История'],['data','Данные'],['guide','О системе']];
function objectFromFields(config){const v={};config.fields.forEach(field=>v[field[0]]=field[3]);return v;}
function makeField(field){
 const id=field[0],label=field[1],type=field[2],val=field[3],opts=field[4]||[];
 const attr=' name="'+e(id)+'" data-lab-input="'+e(id)+'" id="lab-'+e(id)+'"';
 let control='';
 if(type==='select')control='<select'+attr+'>'+opts.map(x=>'<option value="'+e(x)+'"'+(String(x)===String(val)?' selected':'')+'>'+e(x)+'</option>').join('')+'</select>';
 else if(type==='textarea')control='<textarea rows="4"'+attr+'>'+e(val)+'</textarea>';
 else control='<input'+attr+' type="'+(type==='number'?'number':'text')+'"'+(type==='number'?' step="any"':'')+' value="'+e(val)+'" autocomplete="off">';
 return '<label class="lab-field" for="lab-'+e(id)+'"><span>'+e(label)+'</span>'+control+'</label>';
}
function rowsHTML(rows){return (rows||[]).map((row,i)=>'<div class="lab-detail"><span>'+e(row[0])+'</span><strong>'+e(row[1])+'</strong></div>').join('');}
function setTab(root,tab){
 root.querySelectorAll('[data-lab-tab]').forEach(el=>{const active=el.dataset.labTab===tab;el.classList.toggle('is-active',active);el.setAttribute('aria-current',active?'page':'false');});
 root.querySelectorAll('[data-lab-screen]').forEach(el=>{el.hidden=el.dataset.labScreen!==tab;});
}
function init(section){
 if(section.dataset.labAttached==='1')return;
 const code=section.dataset.demoCode;
 const config=catalog[code], shell=section.querySelector('.demo-shell');
 const panel=shell&&shell.querySelector('[data-demo-panel="product"]');
 if(!config||!panel)return;
 section.dataset.labAttached='1';
 const initial=objectFromFields(config);
 const state={values:clone(initial),runs:[],last:null,alternate:false,tab:'work'};
 const title=section.dataset.demoTitle||code;
 const features=(section.dataset.demoFeatures||'').split('|').filter(Boolean);
 const steps=(section.dataset.demoFlow||'').split('|').filter(Boolean);
 panel.innerHTML='<div class="lab-app" data-lab-code="'+e(code)+'">'+
   '<aside class="lab-sidebar"><div class="lab-identity"><span class="lab-monogram">'+e(code)+'</span><div><strong>Демо-стенд</strong><small>Локальная песочница</small></div></div>'+
   '<nav aria-label="Разделы тестового интерфейса">'+tabs.map(x=>'<button type="button" class="lab-nav'+(x[0]==='work'?' is-active':'')+'" data-lab-tab="'+x[0]+'" aria-current="'+(x[0]==='work'?'page':'false')+'">'+e(x[1])+'</button>').join('')+'</nav>'+
   '<div class="lab-sidebar-foot"><span class="lab-signal"></span> Только тестовые данные<br>Без внешних API</div></aside>'+
   '<div class="lab-main"><header class="lab-header"><div><div class="lab-kicker">SPV ASINA · '+e(code)+' / ИНТЕРАКТИВНЫЙ ПРОТОТИП</div><h3>'+e(title)+'</h3><p>'+e(config.prompt)+'</p></div><span class="lab-live">Работает локально</span></header>'+
   '<section class="lab-screen" data-lab-screen="work"><div class="lab-layout"><form data-lab-form class="lab-form" novalidate><div class="lab-panel-heading"><b>Входные данные</b><span>Можно изменять</span></div>'+
   '<div class="lab-fields">'+config.fields.map(makeField).join('')+'</div><p class="lab-validation" data-lab-error role="alert" hidden></p>'+
   '<div class="lab-actions"><button class="lab-button lab-primary" type="submit" data-lab-run>'+e(config.action)+'</button><button class="lab-button lab-secondary" type="button" data-lab-alt>Другой пример</button></div>'+
   '</form><div class="lab-result" data-lab-result aria-live="polite" aria-atomic="true"><div class="lab-empty">Запустите сценарий, чтобы увидеть результат обработки данных.</div></div></div></section>'+
   '<section class="lab-screen" data-lab-screen="history" hidden><div class="lab-panel-heading"><b>История действий</b><span data-lab-count>0 запусков</span></div><p class="lab-help">Результаты доступны только в этой вкладке браузера. Данные не отправляются на сервер.</p><div data-lab-history class="lab-history"></div><div class="lab-actions"><button class="lab-button lab-secondary" data-lab-export type="button">Экспорт истории JSON</button><button class="lab-button lab-subtle" data-lab-clear type="button">Очистить журнал</button></div></section>'+
   '<section class="lab-screen" data-lab-screen="data" hidden><div class="lab-panel-heading"><b>Текущие данные сценария</b><span>JSON / read-only</span></div><p class="lab-help">Сначала измените значения во вкладке «Сценарий». Здесь можно проверить текущий payload.</p><pre class="lab-json" data-lab-json></pre><div class="lab-actions"><button class="lab-button lab-secondary" data-lab-copy type="button">Копировать JSON</button><button class="lab-button lab-subtle" data-lab-reset type="button">Вернуть пример</button></div><p class="lab-small-status" data-lab-copy-status role="status"></p></section>'+
   '<section class="lab-screen" data-lab-screen="guide" hidden><div class="lab-panel-heading"><b>Как работает демонстрация</b><span>'+e(code)+'</span></div><p class="lab-help">'+e(section.dataset.demoSummary||config.prompt)+'</p><div class="lab-steps">'+steps.map((x,i)=>'<div><span>'+String(i+1).padStart(2,'0')+'</span><b>'+e(x)+'</b></div>').join('')+'</div><h4>Что можно проверить</h4><div class="lab-tags">'+features.map(x=>'<span>'+e(x)+'</span>').join('')+'</div><p class="lab-disclosure">Это учебная симуляция интерфейса и логики отдельных операций. Она не подключается к данным клиента, платёжным сервисам, ML-моделям или производственной инфраструктуре. Результат не является подтверждением качества или точности реальной системы.</p><button class="lab-button lab-secondary" data-lab-guide-alt type="button">Загрузить альтернативный сценарий</button></section>'+
   '</div></div>';
 const root=panel.querySelector('.lab-app');
 const form=root.querySelector('[data-lab-form]');
 const setValues=vals=>{state.values=clone(vals);config.fields.forEach(field=>{const input=form.elements.namedItem(field[0]);if(input)input.value=asString(vals[field[0]]);});updateJson();};
 const readValues=()=>{const vals={};config.fields.forEach(field=>{const input=form.elements.namedItem(field[0]);vals[field[0]]=input?input.value:'';});state.values=vals;updateJson();return vals;};
 const updateJson=()=>{root.querySelector('[data-lab-json]').textContent=JSON.stringify(state.values,null,2);};
 const setError=message=>{const err=root.querySelector('[data-lab-error]');err.hidden=!message;err.textContent=message||'';};
 const renderHistory=()=>{
   root.querySelector('[data-lab-count]').textContent=state.runs.length+' запусков';
   const target=root.querySelector('[data-lab-history]');
   target.innerHTML=state.runs.length?state.runs.slice().reverse().map((item,i)=>
     '<article class="lab-history-item"><div><span class="lab-history-index">'+e(item.when)+' · #'+(state.runs.length-i)+'</span><strong>'+e(item.result.title)+'</strong><small>'+e(item.result.detail)+'</small></div><button type="button" class="lab-button lab-secondary" data-lab-replay="'+(state.runs.length-1-i)+'">Повторить</button></article>').join(''):'<div class="lab-empty">Запусков пока нет.</div>';
 };
 const renderResult=output=>{
   const metrics=(output.metrics||[]).map(pair=>'<div class="lab-metric"><span>'+e(pair[0])+'</span><strong>'+e(pair[1])+'</strong></div>').join('');
   const status=output.status==='warn'?'lab-status-warn':output.status==='fail'?'lab-status-fail':'lab-status-ok';
   root.querySelector('[data-lab-result]').innerHTML='<div class="lab-result-heading"><span>РЕЗУЛЬТАТ ЗАПУСКА</span><b class="'+status+'">'+e(output.status==='warn'?'Требует внимания':output.status==='fail'?'Ошибка':'Выполнено')+'</b></div>'+
      '<h4>'+e(output.title)+'</h4><p>'+e(output.detail)+'</p>'+
      '<div class="lab-metrics">'+metrics+'</div>'+
      '<div class="lab-details">'+rowsHTML(output.rows)+'</div>'+
      '<details class="lab-log"><summary>Показать шаги выполнения ('+(output.trace||[]).length+')</summary><ol>'+ (output.trace||[]).map(x=>'<li>'+e(x)+'</li>').join('')+'</ol></details>';
 };
 const execute=()=>{
   const values=readValues();
   const missing=config.fields.filter(x=>x[2]!=='number'&&!String(values[x[0]]||'').trim());
   if(missing.length){setError('Заполните поле «'+missing[0][1]+'».');return false;}
   setError('');
   let result;
   try{result=run(code,values);}catch(error){setError('Ошибка демонстрации: '+String(error.message||error));return false;}
   if(!result||!Array.isArray(result.metrics)){setError('Сценарий не вернул результат.');return false;}
   const entry={when:iso(),code,values:clone(values),result:clone(result)};
   state.runs.push(entry);state.last=entry;renderResult(result);renderHistory();return true;
 };
 const alternative=()=>{state.alternate=!state.alternate;const data=state.alternate?Object.assign({},initial,config.alt||{}):initial;setValues(data);setTab(root,'work');setError('');};
 root.addEventListener('click',event=>{
   const btn=event.target.closest('button');if(!btn||!root.contains(btn))return;
   if(btn.hasAttribute('data-lab-tab')){state.tab=btn.dataset.labTab;readValues();setTab(root,state.tab);renderHistory();return;}
   if(btn.hasAttribute('data-lab-alt')||btn.hasAttribute('data-lab-guide-alt')){alternative();return;}
   if(btn.hasAttribute('data-lab-reset')){state.alternate=false;setValues(initial);setTab(root,'work');setError('');return;}
   if(btn.hasAttribute('data-lab-replay')){const saved=state.runs[Number(btn.dataset.labReplay)];if(saved){setValues(saved.values);setTab(root,'work');execute();}return;}
   if(btn.hasAttribute('data-lab-clear')){state.runs=[];renderHistory();return;}
   if(btn.hasAttribute('data-lab-export')){
     const json=JSON.stringify(state.runs,null,2),blob=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob);
     const link=document.createElement('a');link.href=url;link.download='asina-'+code.toLowerCase()+'-demo-history.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);return;
   }
   if(btn.hasAttribute('data-lab-copy')){
     const json=JSON.stringify(state.values,null,2);
     const status=root.querySelector('[data-lab-copy-status]');
     if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(json).then(()=>status.textContent='JSON скопирован.',()=>status.textContent='Копирование запрещено браузером. Выделите JSON вручную.');}
     else status.textContent='Выделите JSON и скопируйте вручную.';
   }
 });
 form.addEventListener('input',()=>{readValues();setError('');});
 form.addEventListener('change',readValues);
 form.addEventListener('submit',event=>{event.preventDefault();execute();});
 setValues(initial);execute();renderHistory();
}
const attach=()=>document.querySelectorAll('.case-demo-section[data-case-demo]').forEach(init);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();