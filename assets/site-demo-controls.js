/* Immersive website previews: device switch, standalone view, safe reset. */
(function(){
  'use strict';
  function init(){
    document.querySelectorAll('.site-demo-shell').forEach(function(shell){
      const frame=shell.querySelector('iframe.site-demo-frame');
      if(!frame||shell.querySelector('.site-demo-devicebar'))return;
      const originalSrc=frame.getAttribute('src');
      const originalDoc=frame.getAttribute('srcdoc');
      const bar=document.createElement('div');
      bar.className='site-demo-devicebar';
      const label=document.createElement('span');
      label.className='site-demo-devicebar__label';
      label.textContent='Рабочий сайт';
      const actions=document.createElement('div');
      actions.className='site-demo-devicebar__actions';
      actions.setAttribute('role','group');
      actions.setAttribute('aria-label','Просмотр и управление демонстрационным сайтом');
      actions.innerHTML='<button type="button" data-site-width="desktop">Компьютер</button>'+
        '<button type="button" data-site-width="phone">Телефон</button>'+
        '<button type="button" data-site-reset title="Вернуть исходное состояние сайта">Сброс</button>';
      bar.append(label,actions);
      if(originalSrc){
        const open=document.createElement('a');
        open.className='site-demo-devicebar__open';
        open.href=originalSrc;
        open.target='_blank';
        open.rel='noopener noreferrer';
        open.textContent='Открыть сайт целиком ↗';
        open.setAttribute('aria-label','Открыть демонстрационный сайт на отдельной странице');
        bar.append(open);
      }
      shell.insertBefore(bar,shell.firstChild);
      function resize(mode){
        frame.dataset.device=mode;
        actions.querySelectorAll('[data-site-width]').forEach(function(button){
          button.setAttribute('aria-pressed',String(button.dataset.siteWidth===mode));
        });
      }
      actions.addEventListener('click',function(event){
        const button=event.target.closest('button');
        if(!button)return;
        if(button.dataset.siteWidth)resize(button.dataset.siteWidth);
        if(button.hasAttribute('data-site-reset')){
          if(originalSrc){
            frame.removeAttribute('srcdoc');
            frame.src=originalSrc;
          }else if(originalDoc!==null){
            frame.srcdoc=originalDoc;
          }
          resize(frame.dataset.device||'desktop');
        }
      });
      resize(window.matchMedia('(max-width:760px)').matches?'phone':'desktop');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
}());
