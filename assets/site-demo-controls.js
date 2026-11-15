
(function(){
'use strict';
function init(){
 document.querySelectorAll('.site-demo-shell').forEach(function(shell){
  var frame=shell.querySelector('iframe.site-demo-frame');
  if(!frame || shell.querySelector('.site-demo-devicebar'))return;
  var bar=document.createElement('div');
  bar.className='site-demo-devicebar';
  bar.innerHTML='<span class="site-demo-devicebar__label">Размер предпросмотра</span>'+
   '<div class="site-demo-devicebar__actions" role="group" aria-label="Размер демонстрационного сайта">'+
   '<button type="button" data-site-width="desktop" aria-pressed="true">Десктоп</button>'+
   '<button type="button" data-site-width="phone" aria-pressed="false">Телефон</button>'+
   '<button type="button" data-site-reset title="Вернуть исходное состояние демонстрации">Сброс</button></div>';
  shell.insertBefore(bar,shell.firstChild);
  var original=frame.getAttribute('srcdoc');
  function resize(mode){
   frame.dataset.device=mode;
   bar.querySelectorAll('[data-site-width]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.siteWidth===mode));});
  }
  bar.addEventListener('click',function(e){
   var btn=e.target.closest('button');if(!btn)return;
   if(btn.dataset.siteWidth)resize(btn.dataset.siteWidth);
   if(btn.hasAttribute('data-site-reset')){
    frame.srcdoc=original;
    resize(frame.dataset.device||'desktop');
   }
  });
  resize('desktop');
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
}());
