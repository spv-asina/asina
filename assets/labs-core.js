
(function () {
  'use strict';
  var all = Object.create(null);
  var lab = {
    add: function (map) { Object.keys(map).forEach(function (code) { all[code] = map[code]; }); },
    esc: function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); },
    n: function (v, fallback) { var x=Number(v); return Number.isFinite(x) ? x : (fallback || 0); },
    fmt: function (v) { return Number(v || 0).toLocaleString('ru-RU'); },
    log: function (s, line) { if (!s.logs) s.logs=[]; s.logs.unshift(String(line)); s.logs=s.logs.slice(0,5); },
    metric: function (name, value) { return '<div class="spv-lab__metric"><span>'+lab.esc(name)+'</span><strong>'+lab.esc(value)+'</strong></div>'; },
    metrics: function (items) { return '<div class="spv-lab__metrics">'+items.map(function (x) { return lab.metric(x[0],x[1]); }).join('')+'</div>'; },
    pill: function (value) { return '<span class="spv-lab__pill">'+lab.esc(value)+'</span>'; },
    note: function (value) { return '<div class="spv-lab__note">'+lab.esc(value)+'</div>'; },
    code: function (value) { return '<code class="spv-lab__code">'+lab.esc(value)+'</code>'; },
    spark: function (values) { return '<div class="spv-lab__spark" role="img" aria-label="График на тестовых данных">'+values.map(function (v) { return '<i style="height:'+Math.min(100,Math.max(4,lab.n(v)))+'%"></i>'; }).join('')+'</div>'; },
    progress: function (pct) { return '<div class="spv-lab__seg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(lab.n(pct))+'"><i style="width:'+Math.max(0,Math.min(100,lab.n(pct)))+'%"></i></div>'; },
    tile: function (title, meta, action, id, label) {
      return '<div class="spv-lab__tile spv-lab__tile--stack"><div><strong>'+lab.esc(title)+'</strong><small>'+lab.esc(meta || '')+'</small></div>'+(action?lab.button(label || 'Открыть',action,id):'')+'</div>';
    },
    button: function (label, action, id) {
      return '<button type="button" class="spv-lab__button" data-lab-action="'+lab.esc(action)+'" data-id="'+lab.esc(id == null?'':id)+'">'+lab.esc(label)+'</button>';
    },
    table: function (headers, rows) {
      return '<div class="spv-lab__tableWrap"><table class="spv-lab__table"><thead><tr>'+headers.map(function (h) { return '<th scope="col">'+lab.esc(h)+'</th>'; }).join('')+'</tr></thead><tbody>'+rows.map(function (row) { return '<tr>'+row.map(function (value) { return '<td>'+lab.esc(value)+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table></div>';
    },
    result: function (title, description, content, status) {
      var cls=status==='ok'?' spv-lab__status--ok':status==='bad'?' spv-lab__status--bad':'';
      return '<div class="spv-lab__resultHead"><div class="spv-lab__kicker" style="margin:0">Результат</div><span class="spv-lab__status'+cls+'">'+lab.esc(status==='ok'?'Готово':status==='bad'?'Требует внимания':'Песочница')+'</span></div><h4>'+lab.esc(title)+'</h4><p>'+lab.esc(description || '')+'</p>'+(content || '');
    }
  };

  function field(spec, value) {
    var id=spec[0],label=spec[1],kind=spec[2]||'text',options=spec[4]||[],hint=spec[5]||'';
    var name='lab-field-'+id,attr=' data-lab-field="'+lab.esc(id)+'" id="'+name+'"';
    if(kind==='check')return '<div class="spv-lab__field spv-lab__field--check"><input type="checkbox"'+attr+(value?' checked':'')+'><label for="'+name+'">'+lab.esc(label)+'</label></div>';
    var html='';
    if(kind==='textarea')html='<textarea rows="3"'+attr+'>'+lab.esc(value)+'</textarea>';
    else if(kind==='select')html='<select'+attr+'>'+options.map(function (x) { var key=Array.isArray(x)?x[0]:x,text=Array.isArray(x)?x[1]:x;return '<option value="'+lab.esc(key)+'"'+(String(value)===String(key)?' selected':'')+'>'+lab.esc(text)+'</option>'; }).join('')+'</select>';
    else if(kind==='range'||kind==='number')html='<input'+attr+' type="'+kind+'" value="'+lab.esc(value)+'" min="'+(kind==='range'?'0':'0')+'" max="'+(kind==='range'?'100':'1000000')+'" step="1">';
    else html='<input'+attr+' type="text" value="'+lab.esc(value)+'" maxlength="350">';
    return '<div class="spv-lab__field'+(kind==='textarea'?' spv-lab__field--wide':'')+'"><label for="'+name+'">'+lab.esc(label)+'</label>'+html+(hint?'<small class="spv-lab__hint">'+lab.esc(hint)+'</small>':'')+'</div>';
  }
  function makeState(config) {
    var s={values:{},logs:[],done:false,last:'',data:{}};
    (config.fields||[]).forEach(function (f) {s.values[f[0]]=f[3];});
    if(config.init)config.init(s,lab);
    return s;
  }
  function shortcut(section) {
    var intro=document.querySelector('.case-hero .case-hero__grid > div:first-child');
    if(!intro || intro.querySelector('.spv-demo-shortcut'))return;
    var anchor=document.createElement('a');
    anchor.className='btn bronze spv-demo-shortcut';
    anchor.href='#demo-title-'+section.dataset.demoCode;
    anchor.textContent='Попробовать интерактивное демо';
    anchor.style.marginTop='22px';
    intro.appendChild(anchor);
  }
  function mount(section, cfg) {
    shortcut(section);
    var product=section.querySelector('[data-demo-panel="product"]');
    if(!product||product.dataset.labMounted)return;
    product.dataset.labMounted='true';
    var code=section.dataset.demoCode, s=makeState(cfg);
    var disclaimer=section.querySelector('.demo-disclaimer');
    if(disclaimer)disclaimer.textContent='Интерактивная песочница · тестовые данные';
    function draw() {
      var oldHistory=product.querySelector('.spv-lab__log');
      if(oldHistory)s.historyOpen=oldHistory.open;
      var fields=(cfg.fields||[]).map(function (f) {return field(f,s.values[f[0]]);}).join('');
      var extra=(cfg.buttons||[]).map(function (b) {return lab.button(b[0],b[1]);}).join('');
      var view=cfg.view(s,lab);
      var history=s.logs.length?
        '<details class="spv-lab__log" aria-label="Журнал действий"'+(s.historyOpen?' open':'')+'>'+
        '<summary>История действий <span class="spv-lab__logCount">'+s.logs.length+'</span></summary>'+
        '<div class="spv-lab__logEntries">'+s.logs.map(function (x) {return '<span>• '+lab.esc(x)+'</span>';}).join('')+'</div></details>':'';
      var group=section.dataset.demoCategory||'product';
      var groupNames={ai:'ML / AI',automation:'Автоматизация',backend:'Инфраструктура',fullstack:'Приложение',telegram:'Коммуникации'};
      var html='<div class="spv-lab" data-lab="'+lab.esc(code)+'" data-lab-kind="'+lab.esc(group)+'">'+
        '<div class="spv-lab__top"><div class="spv-lab__identity">'+
        '<div class="spv-lab__eyebrow"><span class="spv-lab__live-dot" aria-hidden="true"></span>'+
        lab.esc(groupNames[group]||'Рабочий интерфейс')+' · '+lab.esc(code)+'</div>'+
        '<h3>'+lab.esc(cfg.title||section.dataset.demoTitle||code)+'</h3>'+
        '<p>'+lab.esc(cfg.description||'Меняйте параметры и проверяйте результат в браузере.')+'</p></div>'+
        '<button type="button" class="spv-lab__reset" data-lab-action="reset" aria-label="Сбросить демонстрацию">↺ <span>Сброс</span></button></div>'+
        '<div class="spv-lab__layout"><div class="spv-lab__controls"><div class="spv-lab__kicker">Параметры</div>'+
        '<div class="spv-lab__fields">'+fields+'</div><div class="spv-lab__buttons">'+
        '<button type="button" class="spv-lab__button spv-lab__button--main" data-lab-action="run">'+lab.esc(cfg.cta||'Запустить сценарий')+'</button>'+extra+'</div>'+
        (s.last==='Ошибка проверки'?'<div class="spv-lab__action-error" role="alert">Ошибка выполнения. Подробности в истории действий.</div>':'')+
        history+'</div><div class="spv-lab__result" role="status" aria-live="polite">'+view+'</div></div>'+
        '<details class="spv-lab__foot"><summary>Как работает эта демонстрация</summary>'+
        '<p>Все операции выполняются локально в браузере на тестовых данных. Настоящие внешние API, аккаунты клиентов и ML-модели не вызываются.</p></details></div>';
      product.innerHTML=html;
    }
    function collect() {
      product.querySelectorAll('[data-lab-field]').forEach(function (e) {s.values[e.dataset.labField]=e.type==='checkbox'?e.checked:e.value;});
    }
    product.addEventListener('click',function (event) {
      var button=event.target.closest('[data-lab-action]');
      if(!button||!product.contains(button))return;
      collect();
      var action=button.dataset.labAction, id=button.dataset.id||'';
      if(action==='reset'){s=makeState(cfg);lab.log(s,'Демо возвращено к исходным данным');}
      else {
        try {
          if(action==='run'){if(cfg.run)cfg.run(s,lab);s.done=true;}
          else if(cfg.onAction)cfg.onAction(s,action,id,lab);
        } catch(err){lab.log(s,'Ошибка локального сценария: '+String(err.message||err));s.last='Ошибка проверки';}
      }
      draw();
    });
    product.addEventListener('submit',function (e) {e.preventDefault();});
    draw();
  }
  function init() {
    document.querySelectorAll('[data-case-demo]').forEach(function (section) {
      var cfg=all[section.dataset.demoCode];
      if(cfg)mount(section,cfg);
    });
  }
  lab.init=init;
  window.SPV_LABS=lab;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,0);},{once:true});
  else setTimeout(init,0);
}());
