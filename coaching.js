(() => {
  'use strict';
  const el = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  function button(label, action) {
    const item = el('button',label,'quiet');
    item.type = 'button';
    item.addEventListener('click',action);
    return item;
  }
  function dialog(title) {
    const panel = el('dialog',undefined,'coach-dialog');
    panel.setAttribute('aria-label',title);
    const head = el('header');
    head.append(el('h2',title),button('Close',()=>panel.close()));
    panel.append(head);
    document.body.append(panel);
    panel.addEventListener('close',()=>panel.remove(),{once:true});
    return panel;
  }
  function highlight(target) {
    target.classList.remove('coach-return');
    requestAnimationFrame(()=>target.classList.add('coach-return'));
    setTimeout(()=>target.classList.remove('coach-return'),1500);
  }
  function mountPicker(root,api) {
    const picker = root.querySelector('.directory-quick-switch');
    const jump = root.querySelector('#complexJump');
    const mini = el('div',undefined,'coach-mini');
    mini.hidden = true;
    const title = button('Choose a complex',open);
    const previous = button('‹',()=>api.step(-1)), next = button('›',()=>api.step(1));
    previous.setAttribute('aria-label','Previous training complex');
    next.setAttribute('aria-label','Next training complex');
    mini.append(previous,title,next);
    root.append(mini);
    function open() {
      const panel = dialog('Choose a training complex');
      const grid = el('div',undefined,'coach-grid');
      for (const option of [...api.options(),{id:'',label:'No complex'}]) {
        const pick = button(option.label,()=>{api.choose(option.id);panel.close();});
        pick.setAttribute('aria-pressed',String(option.id===api.selected()));
        grid.append(pick);
      }
      panel.append(grid);
      panel.showModal();
      grid.querySelector('[aria-pressed="true"]')?.focus();
    }
    jump.addEventListener('click',open);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function measure() {
      frame = 0;
      const headerBottom = document.querySelector('.header')?.getBoundingClientRect().bottom || 0;
      const bounds = picker.getBoundingClientRect();
      const rootBounds = root.getBoundingClientRect();
      const active = rootBounds.height > 0 && rootBounds.bottom >= headerBottom + 60;
      const reduced = reducedMotion.matches || document.body.classList.contains('no-motion');
      // Follow the original picker for its last few pixels, then settle under the header.
      const progress = active ? (reduced ? Number(bounds.bottom <= headerBottom) :
        Math.min(1,Math.max(0,(headerBottom + 42 - bounds.bottom) / 50))) : 0;
      const originalFocused = picker.contains(document.activeElement);
      const stickyFocused = mini.contains(document.activeElement);
      mini.hidden = progress === 0;
      mini.inert = progress < 0.65;
      if (!progress) {
        picker.style.removeProperty('opacity');
        if(stickyFocused && active)jump.focus({preventScroll:true});
        return;
      }
      const eased = progress * progress * (3 - 2 * progress);
      const compact = Math.min(540,window.innerWidth - 28);
      const center = bounds.left + bounds.width / 2;
      mini.style.left = center + (window.innerWidth / 2 - center) * eased + 'px';
      mini.style.width = bounds.width + (compact - bounds.width) * eased + 'px';
      mini.style.top = headerBottom - 10 * (1 - eased) + 'px';
      mini.style.opacity = eased;
      picker.style.opacity = 1 - eased;
      if(eased >= 0.99 && originalFocused)title.focus({preventScroll:true});
    }
    function schedule() { if(!frame)frame=requestAnimationFrame(measure); }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    if(window.ResizeObserver)new ResizeObserver(schedule).observe(picker);
    return (label,ready)=>{title.textContent=label;jump.disabled=!ready;schedule();};
  }
  function points(name,floor,vault) {
    const panel=dialog(name+' · points');
    const list=el('dl');
    for (const [label,value] of [['Floor skills',floor.points-floor.completion],['Vault skills',vault.points-vault.completion],['Perfect complex bonuses',floor.completion+vault.completion],['Combined total',floor.points+vault.points]]) {
      list.append(el('dt',label),el('dd',String(value)));
    }
    panel.append(list);panel.showModal();
  }
  let dismissUndo=()=>{};
  function clearUndo(){dismissUndo();}
  function offerUndo({button:source,gymnastId,skillId,label,valid,run}) {
    clearUndo();
    const id = source.id;
    const locate = ()=>source.isConnected ? source : (id && document.getElementById(id)) ||
      [...document.querySelectorAll('[data-priority-skill]')].find(n=>n.dataset.prioritySkill===skillId && n.dataset.priorityGymnast===gymnastId && n.getClientRects().length);
    const anchor=locate();
    if(!anchor)return;
    const chip=button('↶ Undo',()=>{if(valid())run();clearUndo();});
    chip.classList.add('coach-undo');
    chip.setAttribute('aria-label','Undo mark for '+label);
    chip.title='Undo mark for '+label;
    document.body.append(chip);
    function position(){
      const r=locate()?.getBoundingClientRect();
      if(!r||!r.height||!valid()){clearUndo();return;}
      const top=document.querySelector('.header')?.getBoundingClientRect().bottom||0;
      chip.hidden=r.bottom<=top||r.top>=innerHeight;
      chip.style.left=Math.max(6,Math.min(innerWidth-chip.offsetWidth-6,r.right-chip.offsetWidth))+'px';
      chip.style.top=Math.max(top+2,Math.min(innerHeight-chip.offsetHeight-8,r.top-chip.offsetHeight+1))+'px';
    }
    function nextAction(event) {
      if(!chip.contains(event.target))clearUndo();
    }
    function escapeUndo(event) { if(event.key==='Escape')clearUndo(); }
    const timer=setTimeout(clearUndo,8000);
    document.addEventListener('pointerdown',nextAction,true);
    document.addEventListener('keydown',escapeUndo);

    dismissUndo=()=>{
      clearTimeout(timer);chip.remove();
      document.removeEventListener('pointerdown',nextAction,true);
      document.removeEventListener('keydown',escapeUndo);
      window.removeEventListener('scroll',position);window.removeEventListener('resize',position);
      dismissUndo=()=>{};
    };
    window.addEventListener('scroll',position,{passive:true});
    window.addEventListener('resize',position);position();
  }
  const storageKey='swl-term-snapshots-v1';
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let context, scopeKey='', startId='', finishId='live', message='';
  function snapshots() {
    const rows=JSON.parse(localStorage.getItem(storageKey)||'[]');
    if (!Array.isArray(rows)) throw Error('Invalid saved snapshots');
    return rows;
  }
  function capture({people,data,group},name) {
    return {version:1,id:crypto.randomUUID(),date:new Date().toISOString(),name,group,
      skills:data.skills.map(k=>({id:k.id,category:k.category,tier:k.tier,points:k.points})),
      marks:Object.fromEntries(people.map(g=>[g.id,Object.fromEntries(data.skills.map(k=>[k.id,data.mark(g.id,k.id)]))]))};
  }
  function compareTerms(a,b,scope) {
    const athletes=Object.keys(a.marks).filter(id=>Object.hasOwn(b.marks,id));
    const common=new Set(b.skills.map(s=>s.id));
    const skills=a.skills.filter(k=>common.has(k.id)&&(scope==='combined'||(scope==='vault')===(k.category==='vault')));
    const triples=new Map();
    for(const k of skills){
      const key=k.category+'|'+k.tier;
      if(!triples.has(key))triples.set(key,[]);
      triples.get(key).push(k);
    }
    function stats(snapshot) {
      let points=0, achieved=0, perfect=0;
      for(const id of athletes){
        const marks=snapshot.marks[id];
        for(const k of skills){const n=marks[k.id]||0;points+=n*k.points;achieved+=Number(n>0);perfect+=Number(n===2);}
        for(const keys of triples.values())if(keys.length===3 && keys.every(k=>marks[k.id]===2))points++;
      }
      return {average:athletes.length?points/athletes.length:0,achieved,perfect};
    }
    return {count:athletes.length,skills:skills.length,first:stats(a),last:stats(b)};
  }
  const fmt=n=>n.toLocaleString('en-GB',{maximumFractionDigits:2});
  function termPanel(next) {
    context=next;
    if(scopeKey!==next.group){scopeKey=next.group;startId='';finishId='live';message='';}
    let rows;
    try { rows=snapshots().filter(s=>s.group===next.group).sort((a,b)=>a.date.localeCompare(b.date)); }
    catch { return '<p>Saved snapshots could not be read on this device.</p>'; }
    const live=capture(next,'Current squad');
    const start=rows.find(s=>s.id===startId)||rows[0];
    const finish=rows.find(s=>s.id===finishId)||live;
    const option=(s,id)=>'<option value="'+escape(s.id)+'"'+(s.id===id?' selected':'')+'>'+escape(s.name)+' · '+escape(new Date(s.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}))+'</option>';
    let detail='<p>Save the first snapshot to start tracking this squad across terms.</p>';
    if(start) {
      const result=compareTerms(start,finish,next.apparatus);
      detail='<div class="coach-term-fields"><label>From<select data-term-from>'+rows.map(s=>option(s,start.id)).join('')+'</select></label><label>To<select data-term-to><option value="live">Current squad</option>'+rows.filter(s=>s.date>start.date).map(s=>option(s,finishId)).join('')+'</select></label></div>';
      if(!result.count||!result.skills)detail+='<p>No gymnasts or skills appear in both snapshots.</p>';
      else {
        detail+='<p>'+result.count+' matched '+(result.count===1?'gymnast':'gymnasts')+' · '+result.skills+' shared skills · '+escape(next.apparatus)+'</p><table><thead><tr><th>Measure</th><th>From</th><th>To</th><th>Change</th></tr></thead><tbody>';
        for(const [k,label] of [['average','Points per gymnast'],['achieved','Skills achieved or better'],['perfect','Perfect marks']]){
          const first=result.first[k],last=result.last[k],delta=last-first;
          detail+='<tr><th>'+label+'</th><td>'+fmt(first)+'</td><td>'+fmt(last)+'</td><td>'+(delta>0?'+':'')+fmt(delta)+'</td></tr>';
        }
        detail+='</tbody></table>';
      }
    }
    return '<div class="coach-terms">'+detail+'<div class="coach-term-actions"><button type="button" class="quiet" data-term-save '+(!next.data.canEdit||!next.people.length?'disabled':'')+'>Save snapshot</button>'+(rows.length?'<button type="button" class="quiet" data-term-export>Export snapshots</button>':'')+'<label class="quiet coach-import">Import snapshots<input type="file" data-term-import accept=".json,application/json"></label></div><small>Saved on this device. Export a copy to compare on another device.</small><p role="status">'+escape(message)+'</p></div>';
  }
  function validate(s) {
    const text=v=>typeof v==='string'&&v.length>0&&v.length<=256;
    return s && s.version===1 && [s.id,s.name,s.group].every(text)&&text(s.date)&&Number.isFinite(Date.parse(s.date))&&Array.isArray(s.skills)&&s.skills.length>0&&s.skills.length<500&&s.skills.every(k=>k&&[k.id,k.category,k.tier].every(text)&&Number.isFinite(k.points)&&k.points>=0)&&s.marks&&typeof s.marks==='object'&&!Array.isArray(s.marks)&&Object.entries(s.marks).every(([id,m])=>text(id)&&m&&s.skills.every(k=>[0,1,2].includes(m[k.id])));
  }
  function mountTerms(root,refresh){
    root.addEventListener('change',async e=>{
      if(e.target.matches('[data-term-from]')){startId=e.target.value;finishId='live';refresh();}
      if(e.target.matches('[data-term-to]')){finishId=e.target.value;refresh();}
      if(e.target.matches('[data-term-import]')){
        const file=e.target.files[0];if(!file)return;
        try{
          if(file.size>5e6)throw Error();
          const batch=JSON.parse(await file.text());
          if(!Array.isArray(batch)||!batch.length||!batch.every(validate))throw Error();
          const rows=snapshots(),ids=new Set(rows.map(s=>s.id));
          for(const s of batch)if(!ids.has(s.id)){rows.push(s);ids.add(s.id);}
          localStorage.setItem(storageKey,JSON.stringify(rows));message='Snapshots imported.';
        }catch{message='Could not import this snapshot file.';}
        refresh();
      }
    });
    root.addEventListener('click',e=>{
      if(e.target.closest('[data-term-export]')){
        const url=URL.createObjectURL(new Blob([JSON.stringify(snapshots().filter(s=>s.group===context.group))],{type:'application/json'}));
        const link=el('a');link.href=url;link.download='swl-term-snapshots.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
      }
      if(!e.target.closest('[data-term-save]')||!context.data.canEdit)return;
      const group=context.group, panel=dialog('Save squad snapshot'), field=el('input');
      field.maxLength=64;field.placeholder='e.g. Autumn term';field.setAttribute('aria-label','Snapshot name');
      panel.append(el('p',context.label),field,button('Save snapshot',()=>{
        if(!field.value.trim()){field.focus();return;}
        if(!context.data.canEdit||context.group!==group){panel.close();return;}
        try{
          const row=capture(context,field.value.trim());
          localStorage.setItem(storageKey,JSON.stringify([...snapshots(),row]));
          startId=row.id;finishId='live';message='Snapshot saved.';
        }catch{message='Could not save on this device.';}
        panel.close();refresh();
      }));
      panel.showModal();field.focus();
    });
  }
  window.SWLCoaching=Object.freeze({mountPicker,points,highlight,clearUndo,offerUndo,termPanel,mountTerms,compareTerms});
})();
