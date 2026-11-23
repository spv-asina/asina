/* Mobile-only behavior; desktop DOM and catalog labels are restored at >=761px. */
(function(){
  'use strict';
  const media=window.matchMedia('(max-width:760px)');
  let rail=null;
  let parent=null;
  let resetButton=null;
  let catalogEventsBound=false;

  function titles(){
    const wanted=[
      ['.spv-tilda-page[data-spv-page="contacts"] .form-card h2','Коротко о вашей задаче'],
      ['.spv-tilda-page .case-demo-section .section-head h2[id^="demo-title-"]','Попробовать в работе']
    ];
    wanted.forEach(function(item){
      document.querySelectorAll(item[0]).forEach(function(heading){
        if(!heading.hasAttribute('data-spv-full-title')){
          heading.setAttribute('data-spv-full-title',heading.textContent);
        }
        heading.textContent=media.matches?item[1]:heading.getAttribute('data-spv-full-title');
      });
    });
  }

  function updateCount(){
    if(!media.matches)return;
    const root=document.querySelector('.spv-tilda-page[data-spv-page="cases"]');
    if(!root)return;
    const count=root.querySelector('[data-case-count]');
    if(!count)return;
    const visible=root.querySelectorAll('[data-case-card]:not([hidden])').length;
    count.textContent='Найдено проектов: '+visible;
    count.setAttribute('aria-live','polite');
    count.setAttribute('aria-atomic','true');
  }

  function bindCatalog(toolbar){
    if(catalogEventsBound)return;
    catalogEventsBound=true;
    toolbar.addEventListener('click',function(event){
      if(event.target.closest('[data-filter]')){
        window.requestAnimationFrame(updateCount);
      }
    });
    const search=toolbar.querySelector('[data-case-search]');
    if(search)search.addEventListener('input',updateCount);
  }

  function emptyState(toolbar){
    const empty=document.querySelector('.spv-tilda-page[data-spv-page="cases"] [data-case-empty]');
    if(!empty)return;
    if(media.matches&&!resetButton){
      resetButton=document.createElement('button');
      resetButton.type='button';
      resetButton.className='spv-reset-filters';
      resetButton.textContent='Сбросить поиск и фильтры';
      resetButton.addEventListener('click',function(){
        const search=toolbar.querySelector('[data-case-search]');
        if(search){
          search.value='';
          search.dispatchEvent(new Event('input',{bubbles:true}));
        }
        const all=toolbar.querySelector('[data-filter="all"]');
        if(all)all.click();
        updateCount();
      });
      empty.appendChild(resetButton);
    }else if(!media.matches&&resetButton){
      resetButton.remove();
      resetButton=null;
    }
  }

  function update(){
    titles();
    const toolbar=document.querySelector('.spv-tilda-page[data-spv-page="cases"] .filter-toolbar');
    if(!toolbar)return;
    bindCatalog(toolbar);
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
        if(hit&&rail.contains(hit)){
          hit.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});
        }
      });
    }
    if(!media.matches&&rail&&parent){
      const nodes=Array.from(rail.children);
      nodes.forEach(x=>parent.insertBefore(x,rail));
      rail.remove();
      rail=null;
      parent=null;
    }
    emptyState(toolbar);
    const count=toolbar.querySelector('[data-case-count]');
    if(media.matches){
      updateCount();
    }else{
      if(count){
        count.removeAttribute('aria-live');
        count.removeAttribute('aria-atomic');
      }
      const search=toolbar.querySelector('[data-case-search]');
      if(search)search.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});
  else update();
  if(media.addEventListener)media.addEventListener('change',update);
  else media.addListener(update);
}());
