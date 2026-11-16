/* Mobile-only behavior; desktop DOM is restored at >=761px. */
(function(){
  'use strict';
  const media=window.matchMedia('(max-width:760px)');
  let rail=null;
  let parent=null;
  function update(){
    const toolbar=document.querySelector('.spv-tilda-page[data-spv-page="cases"] .filter-toolbar');
    if(!toolbar)return;
    if(media.matches&&!rail){
      const buttons=Array.from(toolbar.children).filter(x=>x.matches('.filter-btn'));
      if(!buttons.length)return;
      parent=toolbar;
      rail=document.createElement('div');
      rail.className='mobile-filter-rail';
      rail.setAttribute('role','group');
      rail.setAttribute('aria-label','Категории проектов');
      toolbar.insertBefore(rail,buttons[0]);
      buttons.forEach(x=>rail.appendChild(x));
      rail.addEventListener('click',function(event){
        const hit=event.target.closest('.filter-btn');
        if(hit&&rail.contains(hit))hit.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
      });
    }
    if(!media.matches&&rail&&parent){
      const nodes=Array.from(rail.children);
      nodes.forEach(x=>parent.insertBefore(x,rail));
      rail.remove();rail=null;parent=null;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});
  else update();
  if(media.addEventListener)media.addEventListener('change',update);
  else media.addListener(update);
}());
