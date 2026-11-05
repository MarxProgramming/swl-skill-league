/* Directory selection stays on this visit; it never changes marks or squads. */
(function(){
  'use strict';
  let root=null,getGymnasts=()=>[],onChange=()=>{},onAnalyse=()=>{},active=false;
  const selected=new Set();
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const people=()=>{const list=getGymnasts();return Array.isArray(list)?list:[];};
  const ids=()=>[...selected];
  function control(g){
    if(!active||!g||g.id==null)return '';
    const id=String(g.id),chosen=selected.has(id);
    return `<button type="button" class="directory-selection-control" data-directory-select="${escape(id)}" aria-pressed="${chosen}" aria-label="${escape((chosen?'Deselect ':'Select ')+g.name)}"><span aria-hidden="true">${chosen?'✓':''}</span></button>`;
  }
  function refresh(options={}){
    if(!root)return;
    // Only a confirmed, fully loaded roster can remove a remembered selection.
    if(options.loaded===true){
      const known=new Set(people().map(g=>String(g.id)));
      selected.forEach(id=>{if(!known.has(id))selected.delete(id);});
    }
    const host=root.querySelector('#directorySelectionToolbar');if(!host)return;
    const focus=document.activeElement,action=host.contains(focus)?focus?.dataset?.directorySelectionAction:null;
    const count=selected.size,button=(key,label,style='',disabled=false)=>`<button type="button" data-directory-selection-action="${key}" class="${style}"${disabled?' disabled':''}>${label}</button>`;
    const html=`<div class="directory-selection-bar${active||count?' has-selection':''}" role="group" aria-label="Select gymnasts">${active||count?`<span class="directory-selection-count" role="status" aria-live="polite">${count} selected</span><div class="directory-selection-actions">${button('analyse','Analyse selected','directory-selection-primary',!count)}${button('hide','Hide for 24 hours','',!count||!window.SWLDirectoryAttendance?.hideMany)}${button('clear','Clear','directory-selection-quiet',!count)}${button(active?'done':'start',active?'Done':'Select','directory-selection-quiet')}</div>`:button('start','Select','directory-selection-start')}${active?'<p class="directory-selection-hint">Tap the boxes to select gymnasts. Your selection stays when you change squads or search.</p>':''}</div>`;
    if(host.innerHTML!==html)host.innerHTML=html;
    if(action)[...host.querySelectorAll('[data-directory-selection-action]')].find(b=>b.dataset.directorySelectionAction===action&&!b.disabled)?.focus({preventScroll:true});
  }
  function changed(reason){
    onChange({reason,ids:ids(),active});refresh();
  }
  function clear(){
    selected.clear();changed('clear');
  }
  function focusAction(action){
    [...root.querySelectorAll('[data-directory-selection-action]')].find(b=>b.dataset.directorySelectionAction===action&&!b.disabled)?.focus({preventScroll:true});
  }
  function click(event){
    const button=event.target.closest?.('[data-directory-select],[data-directory-selection-action]');
    if(!button||!root.contains(button)||button.disabled)return;
    event.preventDefault();event.stopPropagation();
    if(button.hasAttribute('data-directory-select')){
      const id=button.dataset.directorySelect;
      if(!active||!people().some(g=>String(g.id)===id))return;
      if(selected.has(id))selected.delete(id);else selected.add(id);
      changed('select');
      [...root.querySelectorAll('[data-directory-select]')].find(b=>b.dataset.directorySelect===id)?.focus({preventScroll:true});
      return;
    }
    switch(button.dataset.directorySelectionAction){
      case 'start':active=true;changed('start');focusAction('done');break;
      case 'done':active=false;changed('done');focusAction('start');break;
      case 'clear':clear();focusAction(active?'done':'start');break;
      case 'analyse':if(selected.size)onAnalyse(ids());break;
      case 'hide':
        if(selected.size)window.SWLDirectoryAttendance?.hideMany(ids(),{onComplete:()=>{selected.clear();active=false;changed('hidden');}});
        break;
    }
  }
  function mount(options){
    if(root)root.removeEventListener('click',click);
    root=options.root;getGymnasts=options.getGymnasts||(()=>[]);onChange=options.onChange||(()=>{});onAnalyse=options.onAnalyse||(()=>{});
    if(root){root.addEventListener('click',click);refresh();}
  }
  window.SWLDirectorySelection={mount,refresh,control,isActive:()=>active,ids,clear};
})();
