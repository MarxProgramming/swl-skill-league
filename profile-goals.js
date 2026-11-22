/* Profile goals share catalogue marks. Apparatus-only checks never award points. */
(function(root){
  'use strict';
  const extraNames = Object.freeze({
    'beam-walkover':'Walkover on high beam','beam-handstand-roll':'Handstand forwards roll on high beam',
    'beam-split-jump':'Split jump on high beam','beam-second-dance':'Earlier dance check (archived)',
    'beam-straight-jump':'Straight jump on high beam','beam-tuck-jump':'Tuck jump on high beam',
    'beam-full-spin':'Full spin on high beam','beam-b-dismount':'B dismount · coach’s choice',
    'bars-squat-stand':'Squat-on → stand for 3 seconds','bars-catch':'Jump to catch the high bar',
    'bars-cast-horizontal':'Cast to horizontal','bars-baby-giant':'Baby giant',
    'bars-back-hip-circle':'Back hip circle','bars-upstart':'Upstart on high bar',
    'bars-b-dismount':'B dismount · coach’s choice','bars-tap-swings':'Tap swings','bars-undershoot':'Undershoot from high bar',
    'floor-front-somersault':'Front somersault on floor',
    'floor-back-tuck':'Back tuck on floor · round-off → flick → tuck',
    'airtrack-tumble':'Round-off → flick → tuck on AirTrack',
    'tramp-straight-back':'Straight back on trampoline','tramp-half-twist':'Half twist in dish on trampoline',
    'tramp-full-twist':'Full twist on trampoline · with Marx’s approval','floor-korbut':'Korbut flick'
  });
  const extraIds=Object.keys(extraNames), DAY=86400000;
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const skill=(id,label)=>({id,label,kind:'skill'}), extra=id=>({id,label:extraNames[id],kind:'goal'});
  const choice=(id,label,items)=>({id,label,items,kind:'choice'});
  const cr=(id,title,items,any=false,note='')=>({id,title,items,any,note});
  const section=(id,title,requirements)=>({id,title,requirements});
  const acro=()=>cr('acro','CR 1 · Acro line',[skill('acro-pro-roundoff-flick','Round-off flick')]);
  const dance=(upgrade=false)=>cr('dance','CR 2 · Leap series',[skill(upgrade?'leaps-base-2':'leaps-base-0',upgrade?'Split change':'Split leap'),skill('leaps-base-1','Cat leap full turn')]);
  const mixed=()=>cr('mixed','CR 3 · Mixed series',[skill('acro-base-0','Backwards walkover'),skill('rolls-base-full-turn','Full turn jump')]);
  const spin=()=>cr('spin','CR 4 · Spin',[skill('acro-upgrade-1','1½ spin')]);
  const vault=level=>section('vault','Vault',[cr('vault','Arm circle & vault',[
    skill('vault-run-2','Arm circle'),choice('vault-choice','Plus one of these vaults',[
      ...(level===8?[skill('vault-vaults-0','Handspring')]:[]),
      ...(level>=7?[skill('vault-vaults-1','Half on')]:[]),skill('vault-vaults-2','Half on half off')])],false,'Perfect the arm circle and one eligible vault')]);
  const level8={id:'level8',label:'Level 8 · Floor & Vault',sections:[section('floor','Floor',[acro(),dance(),mixed(),spin()]),vault(8)]};
  const level7={id:'level7',label:'Level 7 · All-around',sections:[
    section('floor','Floor',[acro(),dance(true),mixed(),spin()]),vault(7),
    section('beam','Beam',[
      cr('beam-acro','CR 1 · B acro',[extra('beam-walkover'),extra('beam-handstand-roll')],true,'Perfect either skill on high beam'),
      cr('beam-dance','CR 2 · Dance series',[extra('beam-split-jump'),choice('beam-jump-choice','Plus either jump',[extra('beam-straight-jump'),extra('beam-tuck-jump')])],false,'Split jump + straight jump or tuck jump'),
      cr('beam-spin','CR 3 · B spin',[extra('beam-full-spin')]),
      cr('beam-dismount','CR 4 · B dismount',[extra('beam-b-dismount')])]),
    section('bars','Bars',[
      cr('bars-cast','CR 1 · Cast to horizontal',[extra('bars-cast-horizontal')]),
      cr('bars-circle','CR 2 · Circling element',[extra('bars-back-hip-circle')]),
      cr('bars-transition','CR 3 · High-bar sequence',[extra('bars-squat-stand'),extra('bars-catch'),choice('bars-high-choice','Then either skill',[extra('bars-baby-giant'),extra('bars-upstart')])],false,'Stand 3 seconds → jump to catch → baby giant or upstart'),
      cr('bars-dismount','CR 4 · B dismount',[extra('bars-b-dismount')])])
  ]};
  const level6={id:'level6',label:'Level 6 · Floor & Vault',sections:[section('floor','Floor',[
    cr('tumble','CR 1 · Backwards tumble',[skill('acro-pro-roundoff-flick','Round-off flick'),extra('floor-back-tuck')],false,'Round-off → flick → tuck'),dance(true),
    cr('forward','CR 3 · Forwards acro',[skill('acro-pro-handspring','Handspring'),extra('floor-front-somersault'),skill('rolls-upgrade-dive','Dive forwards roll')],true,'Perfect any one of these skills'),spin()]),vault(6)]};
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
    const evaluateItem=item=>{
      if(item.kind==='choice'){const items=item.items.map(evaluateItem);return {...item,items,value:items.some(i=>i.value===2)?2:items.some(i=>i.value===1)?1:0};}
      return {...item,value:item.kind==='skill'?Number(config.mark?.(config.gymnast.id,item.id)||0):goalValue(config.goalMarks?.[config.gymnast.id]?.[item.id],config.now)};
    };
    const evaluate=r=>{
      const items=r.items.map(evaluateItem);
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
    if(item.kind==='choice')return `<div class="pg-choice" role="group" aria-label="${esc(item.label)}"><p>${esc(item.label)}</p>${item.items.map(i=>itemHTML(i,config,item.items.length>1)).join('')}</div>`;
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
  function overviewModel(config={}){
    const unique=people=>[...new Map((people||[]).map(g=>[g.id,g])).values()];
    const primary=unique(config.people),comparison=unique(config.comparisonPeople);
    const available=[level8,level7,level6].filter(plan=>primary.some(g=>build({gymnast:g}).plans.some(p=>p.id===plan.id)));
    const plan=available.find(p=>p.id===config.plan)||available[0];
    if(!plan)return {available,plan:null,unassigned:primary.length};
    const cohort=people=>{
      const rows=people.filter(g=>build({gymnast:g}).plans.some(p=>p.id===plan.id)).map(g=>({gymnast:g,model:build({gymnast:g,plan:plan.id,mark:config.mark,goalMarks:config.goalMarks,now:config.now})}));
      const total=rows.reduce((n,r)=>n+r.model.total,0),done=rows.reduce((n,r)=>n+r.model.done,0);
      const sections=plan.sections.map(section=>({...section,requirements:section.requirements.map(r=>{
        const ready=rows.filter(row=>row.model.sections.find(s=>s.id===section.id).requirements.find(c=>c.id===r.id).ready).length;
        return {id:r.id,title:r.title,ready,total:rows.length,percent:rows.length?Math.round(100*ready/rows.length):0};
      })}));
      const steps=row=>row.model.sections.flatMap(s=>s.requirements).reduce((n,r)=>n+r.done/r.total,0);
      rows.sort((a,b)=>(config.order==='least'?1:-1)*((a.model.done/a.model.total-b.model.done/b.model.total)||(steps(a)-steps(b)))||a.gymnast.name.localeCompare(b.gymnast.name,'en-GB'));
      return {rows,sections,total,done,percent:total?Math.round(100*done/total):0,ready:rows.filter(r=>r.model.done===r.model.total).length,excluded:people.length-rows.length};
    };
    return {available,plan,primary:cohort(primary),comparison:config.compare?cohort(comparison):null};
  }
  function analyticsHTML(config={}){
    const m=overviewModel(config),scope=esc(config.label||'This view');
    const head=`<div class="analytics-panel-head"><div><p class="eyebrow">Perfect marks only</p><h2>Competition goals</h2></div><span class="pg-analytics-tag">Full target</span></div>`;
    if(!m.plan)return `<section class="analytics-panel analytics-wide pg-analytics">${head}<p class="pg-analytics-empty">No competition goals assigned in ${scope} yet.</p></section>`;
    const p=m.primary,c=m.comparison;
    const compareName=esc(config.comparisonLabel||'Comparison squad');
    const compact=s=>s.replace(/^CR \d+ · /,'');
    const bar=(value,kind='primary')=>`<span class="pg-a-track pg-a-${kind}" aria-hidden="true"><i style="width:${value}%"></i></span>`;
    const meter=(cohort,label,kind)=>`<div class="pg-a-cohort pg-a-${kind}"><strong>${label}</strong><span class="pg-a-percent">${cohort.rows.length?cohort.percent+'%':'—'}</span>${bar(cohort.percent,kind)}<small>${cohort.rows.length?`${cohort.ready} / ${cohort.rows.length} gymnasts ready · ${cohort.done} / ${cohort.total} requirements`:'No gymnasts assigned this target'}</small></div>`;
    return `<section class="analytics-panel analytics-wide pg-analytics" id="competitionGoalsOverview">${head}${m.available.length>1?`<div class="pg-plan-switch pg-a-plan" role="group" aria-label="Competition goal target">${m.available.map(plan=>`<button type="button" data-analytics-goal-plan="${plan.id}" aria-pressed="${m.plan.id===plan.id}">${esc(plan.label)}</button>`).join('')}</div>`:`<h3 class="pg-a-target">${esc(m.plan.label)}</h3>`}<p class="pg-a-scope">${scope} · ${p.rows.length} assigned · ${m.plan.id==='level7'?'Floor, vault, beam & bars':'Floor & vault'}${p.excluded?`<span>${p.excluded} not assigned this target</span>`:''}</p><div class="pg-a-summary${c?' is-comparing':''}">${meter(p,scope,'primary')}${c?meter(c,compareName,'comparison'):''}</div><div class="pg-a-apparatus">${p.sections.map((s,index)=>{
      const ready=s.requirements.reduce((n,r)=>n+r.ready,0),total=p.rows.length*s.requirements.length;
      return `<details data-analytics-disclosure="goals-${m.plan.id}-${s.id}" class="pg-a-piece"><summary><strong>${esc(s.title)}</strong><span>${total?Math.round(100*ready/total):0}% ready</span>${chevron}</summary><div class="pg-a-requirements">${s.requirements.map((r,i)=>`<div class="pg-a-requirement"><strong>${esc(compact(r.title))}</strong><div class="pg-a-bar-row"><small>${c?scope:'Ready'}</small>${bar(r.percent)}<span>${r.ready}/${r.total}</span></div>${c?`<div class="pg-a-bar-row"><small>${compareName}</small>${bar(c.sections[index].requirements[i].percent,'comparison')}<span>${c.sections[index].requirements[i].ready}/${c.rows.length}</span></div>`:''}</div>`).join('')}</div></details>`;
    }).join('')}</div><details class="pg-a-gymnasts" data-analytics-disclosure="goals-${m.plan.id}-gymnasts"><summary><strong>Readiness ranking</strong><span>${config.order==='least'?'Least ready first':'Most ready first'}</span>${chevron}</summary><div class="pg-a-rank-tools" role="group" aria-label="Readiness ranking order">${[['most','Most ready'],['least','Least ready']].map(([id,label])=>`<button type="button" data-analytics-goal-order="${id}" aria-pressed="${(config.order||'most')===id}">${label}</button>`).join('')}</div><p class="pg-a-rank-note">Ready requirements first; ties use progress within the remaining requirements.</p><div class="pg-a-people">${p.rows.map(({gymnast:g,model},rank)=>{
      const missing=model.sections.flatMap(s=>s.requirements.filter(r=>!r.ready).map(r=>s.title+' · '+compact(r.title)));
      return `<button type="button" data-open-goals="${esc(g.id)}" data-goals-target="${m.plan.id}" class="pg-a-person" aria-label="Open ${esc(g.name)}’s goals"><span class="pg-a-rank">${rank+1}</span><span class="pg-a-person-name"><strong>${esc(g.name)}</strong><small>${missing.length?esc(missing.slice(0,2).join(' / '))+(missing.length>2?` +${missing.length-2} more`:''):'All requirements ready'}</small></span><b>${model.done}<small> / ${model.total}</small></b><span aria-hidden="true">↗</span></button>`;
    }).join('')}</div></details><p class="pg-a-footnote">Requirements ready, not league points. These are coaching targets; connections are assumed. Comparisons use percentages of the same target.</p></section>`;
  }

  const api={overviewModel,analyticsHTML,assignment,extraNames,extraIds,cleanMarks,goalValue,build,update,capture,restore,plans:{level8,level7,level6}};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SWLProfileGoals=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
