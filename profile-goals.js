/* Profile goals share catalogue marks. Apparatus-only checks never award points. */
(function(root){
  'use strict';
  const extraNames = Object.freeze({
    'beam-walkover':'Walkover on high beam','beam-handstand-roll':'Handstand forwards roll on high beam',
    'beam-split-jump':'Split jump on high beam','beam-second-dance':'Second dance element on high beam',
    'beam-full-spin':'Full spin on high beam','beam-b-dismount':'B dismount · coach’s choice',
    'bars-squat-stand':'Squat-on → stand for 3 seconds','bars-catch':'Jump to catch the high bar',
    'bars-cast-horizontal':'Cast to horizontal','bars-baby-giant':'Baby giant',
    'bars-b-dismount':'B dismount · coach’s choice','bars-tap-swings':'Tap swings','bars-undershoot':'Undershoot from high bar',
    'floor-back-tuck':'Back tuck on floor · round-off → flick → tuck',
    'airtrack-tumble':'Round-off → flick → tuck on AirTrack',
    'tramp-straight-back':'Straight back on trampoline','tramp-half-twist':'Half twist in dish on trampoline',
    'tramp-full-twist':'Full twist on trampoline · with Marx’s approval','floor-korbut':'Korbut flick'
  });
  const extraIds=Object.keys(extraNames), DAY=86400000;
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const skill=(id,label)=>({id,label,kind:'skill'}), extra=id=>({id,label:extraNames[id],kind:'goal'});
  const cr=(id,title,items,any=false,note='')=>({id,title,items,any,note});
  const section=(id,title,requirements)=>({id,title,requirements});
  const acro=()=>cr('acro','CR 1 · Acro line',[skill('acro-pro-roundoff-flick','Round-off flick')]);
  const dance=(upgrade=false)=>cr('dance','CR 2 · Leap series',[skill(upgrade?'leaps-base-2':'leaps-base-0',upgrade?'Split change':'Split leap'),skill('leaps-base-1','Cat leap full turn')]);
  const mixed=()=>cr('mixed','CR 3 · Mixed series',[skill('acro-base-0','Backwards walkover'),skill('rolls-base-full-turn','Full turn jump')]);
  const spin=()=>cr('spin','CR 4 · Spin',[skill('acro-upgrade-1','1½ spin')]);
  const vault=level=>section('vault','Vault',[cr('vault','Vault target',[
    ...(level===8?[skill('vault-vaults-0','Handspring')]:[]),
    ...(level>=7?[skill('vault-vaults-1','Half on')]:[]),skill('vault-vaults-2','Half on half off')],true,level===6?'Half on half off':'Perfect any one of these vaults')]);
  const level8={id:'level8',label:'Level 8 · Floor & Vault',sections:[section('floor','Floor',[acro(),dance(),mixed(),spin()]),vault(8)]};
  const level7={id:'level7',label:'Level 7 · All-around',sections:[
    section('floor','Floor',[acro(),dance(true),mixed(),spin()]),vault(7),
    section('beam','Beam',[
      cr('beam-acro','CR 1 · B acro',[extra('beam-walkover'),extra('beam-handstand-roll')],true,'Perfect either skill on high beam'),
      cr('beam-dance','CR 2 · Dance series',[extra('beam-split-jump'),extra('beam-second-dance')],false,'Two dance elements, including a split'),
      cr('beam-spin','CR 3 · B spin',[extra('beam-full-spin')]),
      cr('beam-dismount','CR 4 · B dismount',[extra('beam-b-dismount')])]),
    section('bars','Bars',[
      cr('bars-transition','CR 1 · Low to high bar',[extra('bars-squat-stand'),extra('bars-catch')]),
      cr('bars-cast','CR 2 · Cast to horizontal',[extra('bars-cast-horizontal')]),
      cr('bars-circle','CR 3 · Circling element',[extra('bars-baby-giant')]),
      cr('bars-dismount','CR 4 · B dismount',[extra('bars-b-dismount')])])
  ]};
  const level6={id:'level6',label:'Level 6 · Floor & Vault',sections:[section('floor','Floor',[
    cr('tumble','CR 1 · Backwards tumble',[skill('acro-pro-roundoff-flick','Round-off flick'),extra('floor-back-tuck')],false,'Round-off → flick → tuck'),dance(true),
    cr('forward','CR 3 · Forwards flighted acro',[skill('acro-pro-handspring','Handspring')]),spin()]),vault(6)]};
  const practice=section('practice','RF1 practice goals',[
    cr('tumble-prep','AirTrack tumble',[extra('airtrack-tumble')],false,'Build the full line towards floor'),
    cr('tramp','Trampoline progression',[extra('tramp-straight-back'),extra('tramp-half-twist'),extra('tramp-full-twist')]),
    cr('bars-practice','Bars connections',[extra('bars-tap-swings'),extra('bars-undershoot')]),
    cr('floor-standout','Floor standout',[extra('floor-korbut'),skill('rolls-upgrade-2','Backwards roll to handstand')],true,'Perfect either skill')
  ]);
  function assignment(g){
    const squads=[g?.coach,...(g?.squads||[])].filter(Boolean);
    if(squads.some(s=>/^coaches$/i.test(s)))return null;
    if(squads.includes('Marx'))return 'senior';
    return squads.some(s=>/floor.*vault/i.test(s))?'floor-vault':null;
  }
  function cleanMarks(input,ids){
    const out={};
    if(!input||typeof input!=='object'||Array.isArray(input))return out;
    for(const [g,marks] of Object.entries(input)){
      if(!ids.has(g)||!marks||typeof marks!=='object'||Array.isArray(marks))continue;
      for(const [key,entry] of Object.entries(marks)){
        if(!extraIds.includes(key)||!entry||![0,1,2].includes(entry.value)||typeof entry.updatedAt!=='string'||!Number.isFinite(Date.parse(entry.updatedAt)))continue;
        (out[g]??={})[key]={value:entry.value,updatedAt:entry.updatedAt};
      }
    }
    return out;
  }
  function goalValue(entry,now=Date.now()){
    if(!entry||![0,1,2].includes(entry.value))return 0;
    return entry.value===2&&(!Number.isFinite(Date.parse(entry.updatedAt))||now-Date.parse(entry.updatedAt)>=30*DAY)?1:entry.value;
  }
  function build(config={}){
    const group=assignment(config.gymnast),plans=group==='senior'?[level7,level6]:group?[level8]:[];
    const plan=plans.find(p=>p.id===config.plan)||plans[0];
    const evaluate=r=>{
      const items=r.items.map(item=>({...item,value:item.kind==='skill'?Number(config.mark?.(config.gymnast.id,item.id)||0):goalValue(config.goalMarks?.[config.gymnast.id]?.[item.id],config.now)}));
      const total=r.any?1:items.length,done=r.any?Number(items.some(i=>i.value===2)):items.filter(i=>i.value===2).length;
      return {...r,items,done,total,ready:done===total};
    };
    const sections=plan?plan.sections.map(s=>({...s,requirements:s.requirements.map(evaluate)})):[];
    const requirements=sections.flatMap(s=>s.requirements);
    return {group,plans,plan,sections,done:requirements.filter(r=>r.ready).length,total:requirements.length,
      practice:group==='senior'?{...practice,requirements:practice.requirements.map(evaluate)}:null};
  }
  const chevron='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>';
  function itemHTML(item,config,optional){
    const status=item.value===2?'Ready':item.value===1?'Achieved · perfect next':'Not yet achieved';
    return `<button type="button" id="goal-${esc(config.gymnast.id)}-${item.kind}-${esc(item.id)}" class="pg-skill is-${item.value}" data-goal-kind="${item.kind}" data-goal-id="${esc(item.id)}" aria-label="${esc(item.label)}: ${status}. ${item.value===2?'Remove mark':item.value===1?'Mark perfect':'Mark achieved'}" ${config.canEdit?'':'disabled'}><span class="pg-tick" aria-hidden="true">${item.value===2?'✓✓':item.value===1?'✓':'−'}</span><span class="pg-skill-copy"><strong>${esc(item.label)}</strong><small>${status}${optional?' · alternative':''}</small></span>${item.kind==='skill'?'<span class="pg-linked" title="Uses the same mark as Skills" aria-label="Linked to Skills">↗</span>':''}</button>`;
  }
  function sectionHTML(s,config){
    return `<section class="pg-apparatus" aria-label="${esc(s.title)} goals"><header><h3>${esc(s.title)}</h3><span>${s.requirements.filter(r=>r.ready).length} / ${s.requirements.length} ready</span></header><div class="pg-requirements">${s.requirements.map(r=>`<details class="pg-cr${r.ready?' is-ready':''}" data-goal-details="${esc(s.id+'-'+r.id)}"${r.ready?'':' open'}><summary><span class="pg-cr-check" aria-hidden="true">${r.ready?'✓':'·'}</span><strong>${esc(r.title)}</strong><span class="pg-cr-count">${r.ready?'Ready':`${r.done}/${r.total}`}</span>${chevron}</summary><div class="pg-cr-body">${r.note?`<p>${esc(r.note)}</p>`:''}<div class="pg-skill-list">${r.items.map(i=>itemHTML(i,config,r.any)).join('')}</div></div></details>`).join('')}</div></section>`;
  }
  function capture(host){return host?{id:host.dataset.gymnast,plan:host.dataset.goalPlan,open:Object.fromEntries([...host.querySelectorAll('details[data-goal-details]')].map(d=>[d.dataset.goalDetails,d.open]))}:null;}
  function restore(host,saved){if(!host||saved?.id!==host.dataset.gymnast||saved?.plan!==host.dataset.goalPlan)return;for(const d of host.querySelectorAll('details[data-goal-details]'))if(Object.hasOwn(saved.open||{},d.dataset.goalDetails))d.open=saved.open[d.dataset.goalDetails];}
  function update(host,config){
    if(!host||!config.gymnast)return;
    const prior=capture(host),plan=config.plan||(prior?.id===config.gymnast.id?prior.plan:null),model=build({...config,plan});
    const signature=JSON.stringify([config.gymnast.id,model,config.canEdit]);
    if(host._goalSignature===signature)return model;
    host._goalSignature=signature;host.dataset.gymnast=config.gymnast.id;host.dataset.goalPlan=model.plan?.id||'';
    const focused=host.contains(document.activeElement)?document.activeElement.id:null;
    if(!model.plan){host.innerHTML='<section class="pg-empty"><h2>No goals assigned yet</h2><p>Skills and awards are still available for this gymnast.</p></section>';return model;}
    host.innerHTML=`<div class="pg-overview"><div><p class="pg-kicker">${model.group==='senior'?'Marx’s senior squad · RF1 plan':'Floor & Vault'}</p><h2>${esc(model.plan.label)}</h2><p>Perfect skills count as ready. Marks stay linked to Skills.</p></div><div class="pg-total"><strong>${model.done}<span> / ${model.total}</span></strong><small>requirements ready</small></div><div class="pg-progress" role="progressbar" aria-label="Goal requirements ready" aria-valuemin="0" aria-valuemax="${model.total}" aria-valuenow="${model.done}"><i style="width:${100*model.done/model.total}%"></i></div>${model.plans.length>1?`<div class="pg-plan-switch" role="group" aria-label="Goal pathway">${model.plans.map(p=>`<button type="button" data-goal-plan="${p.id}" aria-pressed="${model.plan.id===p.id}">${esc(p.label)}</button>`).join('')}</div>`:''}<span class="pg-lock-note">${config.canEdit?'Scoring unlocked':'Unlock scoring to update goals'}</span></div><div class="pg-sections">${model.sections.map(s=>sectionHTML(s,config)).join('')}</div>${model.practice?`<details class="pg-practice" data-goal-details="practice"><summary><strong>Training focus from your plan</strong>${chevron}</summary>${sectionHTML(model.practice,config)}</details>`:''}<details class="pg-method" data-goal-details="method"><summary>How these goals work ${chevron}</summary><p>These are your coach’s skill targets, grouped by composition requirement (CR). Series connections are assumed. Ready means the individual skills are perfect; it is not a complete competition-entry assessment.</p><p>Marks from complexes are shared automatically. Beam, bars and other goal-only checks are separate and add no league points. Perfect checks renew after 30 days, just like skills.</p>${model.group==='senior'?'<p>The RF1 sheet supplies your training focus. Additional Regional CR checks, such as cast to horizontal and B dismounts, stay separate so they are not mistaken for practice exercises.</p>':''}<a href="https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-Regional-Pathway-Handbook-Information-04.02-2_compressed.pdf" target="_blank" rel="noopener">IGA Regional requirements ↗</a></details>`;
    restore(host,prior);if(focused)host.querySelector('#'+CSS.escape(focused))?.focus({preventScroll:true});return model;
  }
  const api={assignment,extraNames,extraIds,cleanMarks,goalValue,build,update,capture,restore,plans:{level8,level7,level6}};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SWLProfileGoals=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
