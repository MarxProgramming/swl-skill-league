/* Profile goals share catalogue marks. Apparatus-only checks never award points. */
(function(root){
  'use strict';
  const extraNames = Object.freeze({
 'junior-arabesque':'Arabesque','junior-chasse':'Chassé','junior-headstand':'Headstand','junior-white-block':'Handspring over the white block',
"floor-v-sit":"V-sit","floor-one-hand-walkover":"One-handed forward walkover","floor-straddle-jump":"Straddle jump","floor-straight-jump":"Straight jump","floor-handstand":"Handstand","floor-flick":"Flick",
"bars-straddle-undershoot":"Straddle undershoot","bars-pike-undershoot":"Pike undershoot","beam-straddle-dismount":"Straddle jump dismount","beam-front-handspring":"Front handspring dismount","beam-back-somersault":"Back somersault dismount","floor-forward-walkover":"Forward walkover","floor-tuck-half":"Tuck jump half","floor-roundoff":"Round-off","floor-cartwheel":"Cartwheel","floor-half-pirouette":"Handstand half pirouette","floor-full-pirouette":"Handstand full pirouette",
    'beam-walkover':'Walkover on high beam','beam-handstand-roll':'Handstand forwards roll on high beam',
    'beam-split-jump':'Split jump on high beam','beam-second-dance':'Earlier dance check (archived)',
    'beam-straight-jump':'Straight jump on high beam','beam-tuck-jump':'Tuck jump on high beam',
    'beam-full-spin':'Full spin on high beam','beam-b-dismount':'B dismount · coach’s choice',
    'bars-squat-stand':'Squat-on → stand for 3 seconds','bars-catch':'Jump to catch the high bar',
    'bars-cast-horizontal':'Cast to horizontal','bars-baby-giant':'Baby giant',
    'bars-back-hip-circle':'Back hip circle','bars-upstart':'Upstart on high bar',
    'bars-b-dismount':'B dismount · coach’s choice','bars-tap-swings':'Tap swings','bars-undershoot':'Undershoot from high bar',
    'floor-front-somersault':'Front somersault on floor',
    'floor-straight-back':'Straight back on floor · round-off → flick → straight back',
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
  const mixed=()=>cr('mixed','CR 3 · Mixed series',[{kind:'sequence',id:'mixed-11',label:'Cat leap full turn → one-handed cartwheel',items:[skill('leaps-base-1','Cat leap full turn'),skill('acro-base-one-hand','One-handed cartwheel')]},{kind:'sequence',id:'mixed-0',label:"Cat leap \u2192 one-handed cartwheel",items:[skill('leaps-base-cat','Cat leap'),skill('acro-base-one-hand','One-handed cartwheel')]},{kind:'sequence',id:'mixed-1',label:"Cat leap \u2192 forward walkover",items:[skill('leaps-base-cat','Cat leap'),extra('floor-forward-walkover')]},{kind:'sequence',id:'mixed-2',label:"Backward walkover \u2192 tuck jump half",items:[skill('acro-base-0','Backwards walkover'),extra('floor-tuck-half')]},{kind:'sequence',id:'mixed-3',label:"Cat leap full \u2192 forward walkover",items:[skill('leaps-base-1','Cat leap full turn'),extra('floor-forward-walkover')]},{kind:'sequence',id:'mixed-4',label:"Cat leap full \u2192 round-off",items:[skill('leaps-base-1','Cat leap full turn'),extra('floor-roundoff')]},{kind:'sequence',id:'mixed-5',label:"Flick step-out \u2192 tuck jump half",items:[skill('acro-upgrade-0','Flick step-out'),extra('floor-tuck-half')]},{kind:'sequence',id:'mixed-6',label:"Backward walkover \u2192 full-turn jump",items:[skill('acro-base-0','Backwards walkover'),skill('rolls-base-full-turn','Full-turn jump')]},{kind:'sequence',id:'mixed-7',label:"Cartwheel \u2192 flick step-out \u2192 full-turn jump",items:[extra('floor-cartwheel'),skill('acro-upgrade-0','Flick step-out'),skill('rolls-base-full-turn','Full-turn jump')]},{kind:'sequence',id:'mixed-8',label:"Handstand half pirouette \u2192 full-turn jump",items:[extra('floor-half-pirouette'),skill('rolls-base-full-turn','Full-turn jump')]},{kind:'sequence',id:'mixed-9',label:"Handstand half pirouette \u2192 tuck jump half",items:[extra('floor-half-pirouette'),extra('floor-tuck-half')]},{kind:'sequence',id:'mixed-10',label:"Handstand full pirouette \u2192 tuck jump half",items:[extra('floor-full-pirouette'),extra('floor-tuck-half')]}],true,'Perfect every skill in any one combination');
  const spin=(double=false)=>cr('spin','CR 4 · Spin',[skill(double?'acro-pro-1':'acro-upgrade-1',double?'Double spin':'1½ spin')]);
  const vault=level=>section('vault','Vault',[cr('vault','Arm circle & vault',[
    skill('vault-run-2','Arm circle'),choice('vault-choice','Plus one of these vaults',[
      ...(level===8?[skill('vault-vaults-0','Handspring')]:[]),
      ...(level>=7?[skill('vault-vaults-1','Half on')]:[]),skill('vault-vaults-2','Half on half off')])],false,'Perfect the arm circle and one eligible vault')]);
  const level8Acro=()=>cr('acro','CR 1 · Acro line',[skill('acro-pro-roundoff-flick','Round-off flick'),{kind:'sequence',id:'acro-dive-roll',label:'Dive forwards roll → handstand forwards roll',items:[skill('rolls-upgrade-dive','Dive forwards roll'),skill('rolls-base-0','Handstand forwards roll')]},{kind:'sequence',id:'acro-handspring-dive',label:'Front handspring → dive forwards roll',items:[skill('acro-pro-handspring','Front handspring'),skill('rolls-upgrade-dive','Dive forwards roll')]}],true,'Perfect every skill in any one option');
  const standoutOptions = [["rolls-base-2", "Backward roll to front support", "B", 0], ["floor-v-sit", "V-sit", "A", 1], ["floor-forward-walkover", "Forward walkover", "B", 1], ["acro-base-0", "Backward walkover", "B", 0], ["floor-one-hand-walkover", "One-handed forward walkover", "C", 1], ["rolls-upgrade-2", "Backward roll to handstand", "C", 0], ["floor-straddle-jump", "Straddle jump", "B", 1], ["rolls-pro-1", "Split jump", "B", 0], ["leaps-base-2", "Split change", "C", 0], ["floor-straight-jump", "Straight jump", "A", 1], ["leaps-base-scissor", "Scissor kick", "A", 0], ["acro-pro-handspring", "Front handspring", "B", 0], ["floor-korbut", "Korbut flick", "C", 1], ["leaps-base-cat", "Cat leap", "A", 0], ["floor-flick", "Flick", "B", 1], ["rolls-upgrade-dive", "Dive forward roll", "B", 0], ["leaps-base-0", "Split leap", "B", 0], ["leaps-base-1", "Cat leap full turn", "C", 0]];
  const standout=(cOnly=false)=>cr('standout','Standout skill',standoutOptions.filter(o=>!['floor-straddle-jump','rolls-pro-1','leaps-base-2','floor-straight-jump','leaps-base-scissor','leaps-base-cat','leaps-base-0','leaps-base-1'].includes(o[0])).filter(o=>!cOnly||o[2]==='C').map(([id,label,grade,isExtra])=>({... (isExtra?extra(id):skill(id,label)),label:label+' · '+grade})),true,cOnly?'Perfect one C-grade option. Choose a distinct standout when planning the routine.':'Perfect any one option. Choose a distinct standout when planning the routine.');
  const level8Dance=()=>cr('dance','CR 2 · Leap series',[skill('leaps-base-0','Split leap'),choice('level8-leap-choice','Plus either skill',[skill('leaps-base-scissor','Scissor kick'),skill('leaps-base-1','Cat leap full turn')])],false,'Split leap + scissor kick or cat leap full turn');
  const level8Spin=()=>cr('spin','CR 4 · Spin',[skill('acro-base-full-spin','Full spin'),skill('acro-upgrade-1','1½ spin'),skill('acro-pro-1','Double spin')],true,'Perfect a full spin or higher');
  const level8={id:'level8',label:'Level 8 · Floor & Vault',sections:[section('floor','Floor',[level8Acro(),level8Dance(),mixed(),level8Spin(),standout()]),vault(8)]};
  const level7fv={id:'level7fv',label:'Level 7 · Floor & Vault',sections:[section('floor','Floor',[acro(),dance(true),mixed(),spin(),standout(true)]),vault(7)]};
  const level7={id:'level7',label:'Level 7 · All-around',sections:[
    section('floor','Floor',[acro(),dance(true),mixed(),spin(),standout(true)]),vault(7),
    section('beam','Beam',[
      cr('beam-acro','CR 1 · B acro',[extra('beam-walkover'),extra('beam-handstand-roll')],true,'Perfect either skill on high beam'),
      cr('beam-dance','CR 2 · Dance series',[extra('beam-split-jump'),choice('beam-jump-choice','Plus either jump',[extra('beam-straight-jump'),extra('beam-tuck-jump')])],false,'Split jump + straight jump or tuck jump'),
      cr('beam-spin','CR 3 · B spin',[extra('beam-full-spin')]),
      cr('beam-dismount','CR 4 · B dismount',[extra('beam-straddle-dismount'),extra('beam-front-handspring'),extra('beam-back-somersault')],true)]),
    section('bars','Bars',[
      cr('bars-cast','CR 1 · Cast to horizontal',[extra('bars-cast-horizontal')]),
      cr('bars-circle','CR 2 · Circling element',[extra('bars-back-hip-circle')]),
      cr('bars-transition','CR 3 · High-bar sequence',[extra('bars-squat-stand'),extra('bars-catch'),choice('bars-high-choice','Then either skill',[extra('bars-baby-giant'),extra('bars-upstart')])],false,'Stand 3 seconds → jump to catch → baby giant or upstart'),
      cr('bars-dismount','CR 4 · B dismount',[extra('bars-straddle-undershoot'),extra('bars-pike-undershoot')],true)])
  ]};
  const level6={id:'level6',label:'Level 6 · Floor & Vault',sections:[section('floor','Floor',[
    cr('tumble','CR 1 · Backwards tumble',[skill('acro-pro-roundoff-flick','Round-off flick'),extra('floor-straight-back')],false,'Round-off → flick → straight back'),dance(true),
    cr('forward','CR 3 · Forwards acro',[skill('acro-pro-handspring','Handspring'),extra('floor-front-somersault'),skill('rolls-upgrade-dive','Dive forwards roll')],true,'Perfect any one of these skills'),spin(true),standout(true)]),vault(6)]};
  const junior={id:'junior',label:'Junior · Floor & Vault',sections:[section('floor','Floor',[
    cr('arabesque','1 · Arabesque',[extra('junior-arabesque')]),
    cr('cat-series','2 · Chassé → cat leap',[extra('junior-chasse'),skill('leaps-base-cat','Cat leap')]),
    cr('cartwheel-series','3 · Cartwheel → chassé → round-off',[extra('floor-cartwheel'),extra('junior-chasse'),extra('floor-roundoff')]),
    cr('back-roll','4 · Backward roll → front support',[skill('rolls-base-2','Backward roll to front support')]),
    cr('headstand','5 · Headstand',[extra('junior-headstand')]),
    cr('turn','6 · Full-turn jump',[skill('rolls-base-full-turn','Full-turn jump')])
  ]),section('vault','Vault',[cr('junior-vault','Arm circle & white-block handspring',[skill('vault-run-2','Arm circle'),extra('junior-white-block')])])]};
  const practice=section('practice','RF1 practice goals',[
    cr('tumble-prep','AirTrack tumble',[extra('airtrack-tumble')],false,'Build the full line towards floor'),
    cr('tramp','Trampoline progression',[extra('tramp-straight-back'),extra('tramp-half-twist'),extra('tramp-full-twist')]),
    cr('bars-practice','Bars connections',[extra('bars-tap-swings'),extra('bars-undershoot')]),
    cr('floor-standout','Floor standout',[extra('floor-korbut'),skill('rolls-upgrade-2','Backwards roll to handstand')],true,'Perfect either skill')
  ]);
  function assignment(g){
    const squads=[g?.coach,...(g?.squads||[])].filter(Boolean);
    if(squads.some(s=>/^coaches$/i.test(s)))return null;
    if(squads.some(s=>s==='Marx'||s==='Dan'))return 'senior';
    if(squads.some(s=>/junior squad/i.test(s)))return 'junior';
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
  // Find the smallest distinct skill set still to perfect across valid alternatives.
  function readiness(requirements){
    const values=new Map();
    const prune=sets=>{
      const unique=[...new Map(sets.map(s=>[[...s].sort().join('|'),s])).values()].sort((a,b)=>a.size-b.size);
      const keep=[];for(const s of unique)if(!keep.some(k=>[...k].every(id=>s.has(id))))keep.push(s);return keep;
    };
    const combine=(a,b)=>prune(a.flatMap(x=>b.map(y=>new Set([...x,...y]))));
    const paths=item=>{
      if(item.items){const children=item.items.map(paths);return item.kind==='choice'?prune(children.flat()):children.reduce(combine,[new Set()]);}
      const id=item.kind+':'+item.id;values.set(id,item.value);return [new Set(item.value===2?[]:[id])];
    };
    const required=requirements.map(r=>{const children=r.items.map(paths);return r.any?prune(children.flat()):children.reduce(combine,[new Set()]);});
    const achieved=required.map(options=>options.filter(s=>[...s].every(id=>values.get(id)>=1)));
    if(!requirements.length||achieved.some(options=>!options.length))return {status:'developing',remaining:null,unachieved:true,label:'Working towards'};
    let candidates=[new Set()];
    for(const options of achieved){candidates=prune(candidates.flatMap(a=>options.map(b=>new Set([...a,...b]))).filter(s=>s.size<=2));if(!candidates.length)break;}
    if(!candidates.length)return {status:'achieved',remaining:null,unachieved:false,label:'All skills achieved'};
    const remaining=Math.min(...candidates.map(s=>s.size));
    return {status:remaining?'ready':'super',remaining,unachieved:false,label:remaining?'Ready':'Super ready'};
  }

  function build(config={}){
    const group=assignment(config.gymnast),plans=group==='senior'?[level8,level7fv,level7,level6]:group==='junior'?[junior]:group?[level8]:[];
    const plan=plans.find(p=>p.id===config.plan)||plans[0];
    const evaluateItem=item=>{
      if(item.kind==='sequence'){const items=item.items.map(evaluateItem);return {...item,items,value:items.every(i=>i.value===2)?2:items.some(i=>i.value>0)?1:0};}
      if(item.kind==='choice'){const items=item.items.map(evaluateItem);return {...item,items,value:items.some(i=>i.value===2)?2:items.some(i=>i.value===1)?1:0};}
      return {...item,value:item.kind==='skill'?Number(config.mark?.(config.gymnast.id,item.id)||0):goalValue(config.goalMarks?.[config.gymnast.id]?.[item.id],config.now)};
    };
    const achievedItem=item=>item.items?(item.kind==='choice'?item.items.some(achievedItem):item.items.every(achievedItem)):item.value>=1;
    const evaluate=r=>{
      const items=r.items.map(evaluateItem);
      const total=r.any?1:items.length,done=r.any?Number(items.some(i=>i.value===2)):items.filter(i=>i.value===2).length;
      const achieved=r.any?items.some(achievedItem):items.every(achievedItem),ready=done===total;
      const matches=item=>ready?item.value===2:achievedItem(item);
      const labels=item=>item.kind==='choice'?labels(item.items.find(matches)):item.kind==='sequence'?item.items.flatMap(labels):[item.label];
      const fulfilledSkills=achieved?(r.any?labels(items.find(matches)):items.flatMap(labels)):[];
      return {...r,items,done,total,achieved,ready,fulfilledSkills};
    };
    const sections=plan?plan.sections.map(s=>({...s,requirements:s.requirements.map(evaluate)})):[];
    const requirements=sections.flatMap(s=>s.requirements);
    return {group,plans,plan,sections,readiness:readiness(requirements),done:requirements.filter(r=>r.ready).length,total:requirements.length,
      practice:group==='senior'&&[config.gymnast.coach,...(config.gymnast.squads||[])].includes('Marx')?{...practice,requirements:practice.requirements.map(evaluate)}:null};
  }
  const chevron='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>';
  function planLabel(plan){const [level,...rest]=plan.label.split(' · ');return `<strong>${esc(level)}</strong><span>${esc(rest.join(' · '))}</span>`;}
  function itemHTML(item,config,optional){
    if(item.kind==='sequence')return `<details class="pg-choice${item.value===2?' option-ready':''}" data-goal-details="${esc(item.id)}"><summary><span class="pg-option-label">${esc(item.label)}</span><span class="pg-option-progress${item.value===2?' is-ready':''}">${item.value===2?'✓ Ready':item.items.filter(i=>i.value===2).length+'/'+item.items.length+' perfect'}</span></summary><div class="pg-option-skills">${item.items.map(i=>itemHTML(i,{...config,idPrefix:item.id},false)).join('')}</div></details>`;
    if(item.kind==='choice')return `<div class="pg-choice" role="group" aria-label="${esc(item.label)}"><p>${esc(item.label)}</p>${item.items.map(i=>itemHTML(i,config,item.items.length>1)).join('')}</div>`;
    const status=item.value===2?'Ready':item.value===1?'Achieved · perfect next':'Not yet achieved';
    return `<button type="button" id="goal-${esc(config.idPrefix||'single')}-${esc(config.gymnast.id)}-${item.kind}-${esc(item.id)}" class="pg-skill is-${item.value}" data-goal-kind="${item.kind}" data-goal-id="${esc(item.id)}" aria-label="${esc(item.label)}: ${status}. ${item.value===2?'Remove mark':item.value===1?'Mark perfect':'Mark achieved'}" ${config.canEdit?'':'disabled'}><span class="pg-tick" aria-hidden="true">${item.value===2?'✓✓':item.value===1?'✓':'−'}</span><span class="pg-skill-copy"><strong>${esc(item.label)}${item.kind==='skill'&&root.SWLStarredSkills?.has(item.id)?'<span class="skill-star" title="Starred competition skill · achievement bonus">★</span>':''}</strong><small>${status}${optional?' · alternative':''}</small></span>${item.kind==='skill'?'<span class="pg-linked" title="Uses the same mark as Skills" aria-label="Linked to Skills">↗</span>':''}</button>`;
  }
  function sectionHTML(s,config){
    return `<section class="pg-apparatus" aria-label="${esc(s.title)} goals"><header><h3>${esc(s.title)}</h3><span class="pg-apparatus-progress"><span class="pg-progress-dots" aria-hidden="true">${s.requirements.map(r=>`<i class="${r.ready?'filled':''}"></i>`).join('')}</span>${s.requirements.filter(r=>r.ready).length} / ${s.requirements.length} ready</span></header><div class="pg-requirements">${s.requirements.map(r=>`<details class="pg-cr${r.ready?' is-ready':r.achieved?' is-achieved':''}" data-goal-details="${esc(s.id+'-'+r.id)}"><summary><span class="pg-cr-check" aria-hidden="true">${r.ready||r.achieved?'✓':'·'}</span><strong class="pg-cr-title">${r.title.includes(' · ')?`<small>${esc(r.title.split(' · ')[0])}</small><span>${esc(r.title.split(' · ').slice(1).join(' · '))}</span>`:esc(r.title)}${r.fulfilledSkills?.length?`<small class="pg-cr-fulfilled">${esc(r.fulfilledSkills.join(' + '))}</small>`:''}</strong><span class="pg-cr-count">${r.ready?'Ready':r.achieved?'Achieved':`${r.done}/${r.total}`}</span>${chevron}</summary><div class="pg-cr-body">${r.achieved&&!r.ready?'<p class="pg-perfect-next">Achieved · perfect the skills below</p>':''}${r.note?`<p>${esc(r.note)}</p>`:''}<div class="pg-skill-list">${r.items.map(i=>itemHTML(i,config,r.any)).join('')}</div></div></details>`).join('')}</div></section>`;
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
    host.innerHTML=`<div class="pg-overview"><div><p class="pg-kicker">${model.group==='senior'?'Senior squad · Competition goals':model.group==='junior'?'Junior squad · Routine goals':'Floor & Vault'}</p><h2>${esc(model.plan.label)}</h2><p>Perfect skills count as ready. Marks stay linked to Skills.</p></div><div class="pg-total"><strong>${model.done}<span> / ${model.total}</span></strong><small>requirements ready</small></div><div class="pg-progress" role="progressbar" aria-label="Goal requirements ready" aria-valuemin="0" aria-valuemax="${model.total}" aria-valuenow="${model.done}"><i style="width:${100*model.done/model.total}%"></i></div>${model.plans.length>1?`<div class="pg-plan-switch" role="group" aria-label="Goal pathway">${model.plans.map(p=>`<button type="button" data-goal-plan="${p.id}" aria-pressed="${model.plan.id===p.id}">${planLabel(p)}</button>`).join('')}</div>`:''}<span class="pg-lock-note">${config.canEdit?'Scoring unlocked':'Unlock scoring to update goals'}</span></div><div class="pg-sections">${model.sections.map(s=>sectionHTML(s,config)).join('')}</div><details class="pg-method" data-goal-details="method"><summary>How these goals work ${chevron}</summary><p>These are your coach’s skill targets, grouped by composition requirement (CR). Series connections are assumed. Ready means the individual skills are perfect; it is not a complete competition-entry assessment.</p><p>Marks from complexes are shared automatically. Beam, bars and other goal-only checks are separate and add no league points. Perfect checks renew after 30 days, just like skills.</p><a href="https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-Regional-Pathway-Handbook-Information-04.02-2_compressed.pdf" target="_blank" rel="noopener">IGA Regional requirements ↗</a></details>`;
    restore(host,prior);if(focused)host.querySelector('#'+CSS.escape(focused))?.focus({preventScroll:true});return model;
  }
  function overviewModel(config={}){
    const unique=people=>[...new Map((people||[]).map(g=>[g.id,g])).values()];
    const primary=unique(config.people),comparison=unique(config.comparisonPeople);
    const available=[level8,level7fv,level7,level6,junior].filter(plan=>primary.some(g=>build({gymnast:g}).plans.some(p=>p.id===plan.id)));
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
      rows.sort((a,b)=>(config.order==='least'?1:-1)*(({super:3,ready:2,achieved:1,developing:0}[a.model.readiness.status]-{super:3,ready:2,achieved:1,developing:0}[b.model.readiness.status])||(a.model.done/a.model.total-b.model.done/b.model.total)||(steps(a)-steps(b)))||a.gymnast.name.localeCompare(b.gymnast.name,'en-GB'));
      return {rows,sections,total,done,percent:total?Math.round(100*done/total):0,ready:rows.filter(r=>['super','ready'].includes(r.model.readiness.status)).length,excluded:people.length-rows.length};
    };
    return {available,plan,primary:cohort(primary),comparison:config.compare?cohort(comparison):null};
  }
  // Pick the nearest valid option, never demand every alternative in a CR.
  function nextGoalSkills(requirement){
    const weight=items=>items.reduce((n,i)=>n+(i.value===0?100:i.value===1?1:0),0);
    const leaves=item=>{
      if(item.kind==='choice')return item.items.map(leaves).sort((a,b)=>weight(a)-weight(b))[0]||[];
      if(item.kind==='sequence')return item.items.flatMap(leaves);
      return [item];
    };
    const paths=requirement.items.map(leaves);
    return (requirement.any?paths.sort((a,b)=>weight(a)-weight(b))[0]||[]:paths.flat()).filter(i=>i.value<2);
  }
  function analyticsHTML(config={}){
    const m=overviewModel({...config,order:'most'}),scope=esc(config.label||'This squad');
    const head='<div class="analytics-panel-head"><h2>Competition readiness</h2></div>';
    if(!m.plan)return `<section class="analytics-panel analytics-wide pg-analytics">${head}<p class="pg-analytics-empty">No competition goals assigned to this squad yet.</p></section>`;
    const p=m.primary,c=m.comparison,compact=s=>s.replace(/^CR \d+ · /,'').replace(/^\d+ · /,'');
    const statusLabel={super:'Super ready',ready:'Ready',achieved:'All achieved',developing:'Building skills'};
    const person=({gymnast:g,model},rank)=>{
      const needs=[...new Map(model.sections.flatMap(s=>s.requirements.filter(r=>!r.ready).flatMap(nextGoalSkills)).map(i=>[i.id,i])).values()].sort((a,b)=>a.value-b.value);
      const text=needs.length?needs.slice(0,2).map(i=>(i.value===0?'Achieve ':'Perfect ')+i.label).join(' · ')+(needs.length>2?` +${needs.length-2} more`:''):'Every requirement Perfect';
      return `<li><button type="button" data-open-goals="${esc(g.id)}" data-goals-target="${m.plan.id}" class="pg-coach-person pg-ranked-person pg-readiness-${model.readiness.status}" aria-label="${rank+1}. ${esc(g.name)}: ${statusLabel[model.readiness.status]}. Open goals"><span class="pg-ranked-number">${rank+1}</span><span class="pg-ranked-name"><strong>${esc(g.name)}</strong><small>${esc(text)}</small></span><span class="pg-ranked-result"><strong>${statusLabel[model.readiness.status]}</strong><small>${model.done}/${model.total} requirements Perfect</small></span><span class="pg-ranked-arrow" aria-hidden="true">↗</span></button></li>`;
    };
    const breakdown=cohort=>cohort.sections.map(section=>`<section class="pg-breakdown-apparatus"><h3>${esc(section.title)}</h3>${section.requirements.map(r=>{
      const rows=cohort.rows.map(row=>row.model.sections.find(s=>s.id===section.id).requirements.find(x=>x.id===r.id)),total=rows.length,achieved=rows.filter(x=>x.achieved).length,perfect=rows.filter(x=>x.ready).length;
      const ap=total?Math.round(achieved/total*100):0,pp=total?Math.round(perfect/total*100):0;
      return `<div class="pg-breakdown-cr"><strong>${esc(compact(r.title))}</strong><div class="pg-breakdown-track" aria-hidden="true"><i style="width:${ap}%"></i><b style="width:${pp}%"></b></div><div class="pg-breakdown-values"><span>${ap}% achieved <small>(${achieved}/${total})</small></span><span>${pp}% Perfect <small>(${perfect}/${total})</small></span></div></div>`;
    }).join('')}</section>`).join('');
    return `<section class="analytics-panel analytics-wide pg-analytics pg-coach" id="competitionGoalsOverview">${head}<details class="pg-coach-target" data-analytics-disclosure="competition-target"><summary><span><small>Working towards</small><strong>${esc(m.plan.label)}</strong></span>${m.available.length>1?'<span>Change '+chevron+'</span>':chevron}</summary><div class="pg-plan-switch pg-a-plan" role="group" aria-label="Competition goal target">${m.available.map(plan=>`<button type="button" data-analytics-goal-plan="${plan.id}" aria-pressed="${m.plan.id===plan.id}">${planLabel(plan)}</button>`).join('')}</div></details><p class="pg-coach-scope">${scope} · Most ready first${p.excluded?` · ${p.excluded} without this target`:''}</p><ol class="pg-ranked-list" aria-label="Gymnasts ordered by competition readiness">${p.rows.map(person).join('')||'<li class="pg-analytics-empty">No gymnasts have this target assigned.</li>'}</ol><details class="pg-coach-more pg-requirement-breakdown" data-analytics-disclosure="readiness-${m.plan.id}-breakdown"><summary>Requirement breakdown ${chevron}</summary><div class="pg-breakdown-content"><p>Percentage of this squad meeting each requirement. Achieved includes Perfect.</p>${breakdown(p)}${c?`<details class="pg-coach-more"><summary>Compare: ${esc(config.comparisonLabel||'Comparison squad')} ${chevron}</summary>${breakdown(c)}</details>`:''}<details class="pg-coach-help" data-analytics-disclosure="readiness-guide"><summary>How readiness works ${chevron}</summary><p>Gold: every requirement Perfect. Green: all skills achieved, with only 1–2 left to perfect. Purple: all skills achieved, with more than two left to perfect. Otherwise, some skills are still to achieve.</p><p>These are your coaching targets; connections are assumed. Tap a gymnast to see and update their goals.</p></details></div></details></section>`;
  }

  const api={overviewModel,analyticsHTML,nextGoalSkills,assignment,extraNames,extraIds,cleanMarks,goalValue,build,update,capture,restore,plans:{level8,level7fv,level7,level6,junior}};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SWLProfileGoals=Object.freeze(api);
})(typeof window==='object'?window:globalThis);
