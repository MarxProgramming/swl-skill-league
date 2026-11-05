/* A profile-local training picture. Main analytics filters and saved records are never changed here. */
(() => {
  'use strict';
  const hosts=new WeakMap(),scopes=['floor','vault','combined'],ranges=[7,28,56];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>Number(value||0).toLocaleString('en-GB',{maximumFractionDigits:1});
  const signed=value=>(value>0?'+':value<0?'−':'')+number(Math.abs(value));
  const label=scope=>scope==='combined'?'Combined':scope==='vault'?'Vault':'Floor';
  const category=scope=>scope==='floor'?'overall':scope;
  const shortDate=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  const dayLabel=day=>shortDate.format(new Date(day+'T00:00:00Z'));
  const arrow='<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5 7.5 5 5 5-5"/></svg>';
  const markNames=['Not achieved','Achieved','Perfect'],markSymbols=['○','✓','✓✓'];
  function skillScope(skills,scope){return skills.filter(skill=>scope==='combined'||(scope==='vault'?skill.category==='vault':skill.category!=='vault'));}
  function build(config={},options={}) {
    const data=config.data,gymnast=data?.gymnasts?.find(g=>g.id===config.gymnastId);
    const scope=scopes.includes(options.scope)?options.scope:'combined',days=ranges.includes(options.days)?options.days:28;
    const model={gymnast,scope,days,showMore:!!options.showMore,loaded:!!data?.hasLoaded,categories:[],priorities:[],weekly:null,series:null};
    if(!gymnast||!model.loaded)return model;
    const skills=skillScope(data.skills||[],scope);
    model.score=data.summary(gymnast.id,category(scope));
    model.categories=(data.categories||[]).filter(c=>skills.some(s=>s.category===c.id)).map(c=>{
      const members=skills.filter(s=>s.category===c.id),perfect=members.filter(s=>data.mark(gymnast.id,s.id)===2).length;
      const achieved=members.filter(s=>data.mark(gymnast.id,s.id)>=1).length;
      return {...c,total:members.length,achieved,perfect,points:data.summary(gymnast.id,c.id).points};
    });
    const all=config.priorities?.([gymnast],{scope,includeComplete:!!options.pinnedIds?.length,limit:options.pinnedIds?.length?Infinity:10})||[];
    model.priorities=(options.pinnedIds?.length?options.pinnedIds.map(id=>all.find(row=>row.skill.id===id)).filter(Boolean):all).slice(0,10);
    model.priorities=model.priorities.map(row=>({...row,level:data.mark(gymnast.id,row.skill.id),category:data.categories.find(c=>c.id===row.skill.category)}));
    model.weekly=window.SWLGymnastProgress?.buildSeries({progress:data.state?.weeklyProgress,gymnastId:gymnast.id,days:7})||null;
    model.series=window.SWLGymnastProgress?.buildSeries({progress:data.state?.weeklyProgress,gymnastId:gymnast.id,days})||null;
    model.savedFloorPoints=data.confirmedPoints?.(gymnast.id,'overall')??data.summary(gymnast.id,'overall').points;
    return model;
  }
  function stack(achieved,perfect,total){return `<span class="pi-stack" aria-hidden="true"><i class="pi-perfect" style="width:${total?perfect/total*100:0}%"></i><i class="pi-achieved" style="width:${total?(achieved-perfect)/total*100:0}%"></i></span>`;}
  function priorities(model,data){
    const visible=model.priorities.slice(0,model.showMore?10:5),listId='pi-priorities-'+model.gymnast.id;
    return `<section class="pi-panel pi-priorities"><div class="pi-panel-heading"><h3>Next skills to work on</h3><span>Biggest points gain</span></div>${model.priorities.length?`<ol class="pi-priority-list" id="${esc(listId)}">${visible.map(row=>{
      const skill=row.skill,key=model.gymnast.id+':priority:'+skill.id,tier=row.category?.tiers.find(t=>t[0]===skill.tier)?.[1]||skill.tier;
      return `<li><details data-personal-detail="${esc(key)}" data-personal-priority="${esc(skill.id)}"><summary data-personal-focus="${esc(key)}"><span>${esc(skill.name)}</span><b class="pi-priority-gain">${row.level===2?'✓✓':`+${number(row.availablePoints)}`}</b><span class="pi-chevron">${arrow}</span></summary><div class="pi-priority-content"><p>${esc(row.category?.name||skill.category)} · ${esc(tier)}</p><div class="pi-priority-status"><span>${markNames[row.level]}${row.level<2?` · ${row.level===1?'Perfect':'Achieve'} next`:''}</span><div class="pi-mark-controls" role="group" aria-label="${esc(skill.name)} for ${esc(model.gymnast.name)}">${markNames.map((name,value)=>`<button type="button" id="pi-mark-${esc(model.gymnast.id)}-${esc(skill.id)}-${value}" class="pi-mark mark-${value}" data-priority-mark="${value}" data-priority-skill="${esc(skill.id)}" data-priority-gymnast="${esc(model.gymnast.id)}" data-personal-focus="mark-${esc(model.gymnast.id)}-${esc(skill.id)}-${value}" aria-label="${esc(skill.name)}: ${name}" aria-pressed="${row.level===value}"${data.canEdit===false?' disabled':''}><span aria-hidden="true">${markSymbols[value]}</span></button>`).join('')}</div></div></div></details></li>`;
    }).join('')}</ol>${model.priorities.length>5?`<button type="button" class="pi-more-button" data-personal-more="true" data-personal-focus="priorities-more" aria-expanded="${model.showMore}" aria-controls="${esc(listId)}">${model.showMore?'Show less':'Show more'}<span class="pi-chevron">${arrow}</span></button>`:''}`:'<p class="pi-empty">All recommended skills in this view are Perfect.</p>'}<p class="pi-note">${data.canEdit===false?'Scoring is locked. Unlock it above to update marks.':'Choose a mark to update this gymnast’s skill.'}${model.scope!=='vault'?' Handstands are excluded from recommendations.':''}</p></section>`;
  }
  function categories(model){
    return `<section class="pi-panel"><div class="pi-panel-heading"><h3>Across the skills</h3></div><div class="pi-key"><span><i class="pi-achieved"></i>Achieved</span><span><i class="pi-perfect"></i>Perfect</span></div><div class="pi-categories">${model.categories.map(c=>`<div class="pi-category"><div><h4>${esc(c.name)}</h4><strong>${number(c.points)} <small>pts</small></strong></div>${stack(c.achieved,c.perfect,c.total)}<p>${c.achieved} / ${c.total} achieved <span>${c.perfect} Perfect</span></p></div>`).join('')}</div></section>`;
  }
  function weekly(model){
    const week=model.weekly;
    if(!week?.available)return '<section class="pi-panel pi-weekly"><h3>This week · Floor</h3><p class="pi-note">Recorded point gains are not available yet.</p></section>';
    const changes=week.rows.filter(r=>!r.baseline),positive=changes.filter(r=>r.delta>0).length;
    return `<section class="pi-panel pi-weekly"><div class="pi-panel-heading"><h3>This week · Floor</h3><span>${dayLabel(week.firstDay)}–${dayLabel(week.lastDay)}</span></div><div class="pi-week-stats"><div><strong>${signed(week.net)}</strong><span>net points gained</span></div><div><strong>${positive}</strong><span>${positive===1?'day':'days'} with gains</span></div></div><p class="pi-note">${week.partial?`${week.coverageDays} days of records available. `:''}${week.stale?'Saved through '+dayLabel(week.lastDay)+'. ':''}Gains minus manual corrections. Vault history is not recorded yet.</p></section>`;
  }
  function graph(model){
    const series=model.series,key=model.gymnast.id+':graph',periods=`<div class="pi-periods" role="group" aria-label="Personal progress period">${[[7,'7 days'],[28,'4 weeks'],[56,'8 weeks']].map(([value,text])=>`<button type="button" data-personal-period="${value}" data-personal-focus="period-${value}" aria-pressed="${model.days===value}">${text}</button>`).join('')}</div>`;
    let content='<p class="pi-note">Point history is not available in this saved record yet.</p>';
    if(series?.available){
      const values=series.rows.map(r=>r.total),min=Math.min(0,...values),max=Math.max(0,...values),span=Math.max(10,max-min),step=span/4;
      const lo=Math.floor(min/step)*step,hi=Math.max(lo+10,Math.ceil(max/step)*step),x=i=>i/Math.max(1,series.rows.length-1)*680,y=n=>212-(n-lo)/(hi-lo)*196;
      const points=series.rows.map((row,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(row.total).toFixed(2)}`).join(' '),ticks=Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4);
      const description=`${model.gymnast.name}: ${signed(series.net)} net Floor points gained from ${dayLabel(series.firstDay)} to ${dayLabel(series.lastDay)}. Starts at zero for this period, not a historical total score.`;
      content=`<div class="pi-history-stats"><span><strong>${signed(series.net)}</strong> points gained</span><span><strong>${signed(series.weeklyRate)}</strong> per week</span><span><strong>${number(model.savedFloorPoints)}</strong> current saved Floor points</span></div><div class="pi-graph"><div class="pi-y-labels" aria-hidden="true">${ticks.map(n=>`<span style="top:${y(n)/228*100}%">${number(n)}</span>`).join('')}</div><svg viewBox="0 0 680 228" preserveAspectRatio="none" role="img" aria-label="${esc(description)}">${ticks.map(n=>`<line class="pi-gridline" x1="0" x2="680" y1="${y(n)}" y2="${y(n)}"/>`).join('')}<path class="pi-chart-area" d="${points} L680,${y(0)} L0,${y(0)} Z"/><path class="pi-chart-line" d="${points}"/></svg><div class="pi-x-labels" aria-hidden="true"><span>${dayLabel(series.firstDay)}</span><span>${dayLabel(series.lastDay)}</span></div></div><p class="pi-note">${series.partial?`${series.coverageDays} days of available records. `:''}${series.stale?'Saved through '+dayLabel(series.lastDay)+'. ':''}The line starts at zero for the chosen period. It shows recorded Floor gains, not historical total scores.</p><details class="pi-values" data-personal-detail="${esc(model.gymnast.id+':values')}"><summary data-personal-focus="${esc(model.gymnast.id+':values')}">Daily values <span class="pi-chevron">${arrow}</span></summary><div class="pi-table-scroll"><table><caption class="sr">${esc(model.gymnast.name)}: recorded Floor gains</caption><thead><tr><th scope="col">Date</th><th scope="col">Daily change</th><th scope="col">Gained so far</th></tr></thead><tbody>${series.rows.filter(r=>!r.baseline).map(row=>`<tr><th scope="row">${dayLabel(row.day)}</th><td>${signed(row.delta)}</td><td>${signed(row.total)}</td></tr>`).join('')}</tbody></table></div></details>`;
    }
    return `<details class="pi-panel pi-history" data-personal-detail="${esc(key)}"><summary data-personal-focus="${esc(key)}"><span>Points over time <small>Floor gains</small></span><span class="pi-chevron">${arrow}</span></summary><div class="pi-history-content">${periods}${content}</div></details>`;
  }
  function capture(host){
    const state=host&&hosts.get(host);if(!state)return null;
    const active=document.activeElement;
    return {id:state.id,scope:state.scope,days:state.days,showMore:state.showMore,pinnedIds:state.pinnedIds?[...state.pinnedIds]:null,open:Array.from(host.querySelectorAll('details[data-personal-detail][open]')).map(e=>e.dataset.personalDetail),focus:host.contains(active)?active?.dataset?.personalFocus||null:null};
  }
  function restoreDOM(host,snapshot){
    if(!snapshot)return;
    const open=new Set(snapshot.open||[]);
    host.querySelectorAll('details[data-personal-detail]').forEach(el=>{el.open=open.has(el.dataset.personalDetail);});
    if(snapshot.focus&&document.activeElement===document.body){
      const controls=Array.from(host.querySelectorAll('[data-personal-focus]'));
      const match=controls.find(el=>el.dataset.personalFocus===snapshot.focus&&!el.disabled)||controls.find(el=>el.tagName==='SUMMARY');
      match?.focus({preventScroll:true});
    }
  }
  function restore(host,snapshot){
    const state=host&&hosts.get(host);if(!state||!snapshot||snapshot.id!==state.id)return;
    state.scope=scopes.includes(snapshot.scope)?snapshot.scope:'combined';state.days=ranges.includes(snapshot.days)?snapshot.days:28;
    state.showMore=!!snapshot.showMore;
    state.pinnedIds=Array.isArray(snapshot.pinnedIds)?snapshot.pinnedIds:null;
    render(host,state.config);restoreDOM(host,snapshot);
  }
  function render(host,config={}) {
    if(!host)return null;
    let state=hosts.get(host);
    if(!state){
      state={id:null,scope:'combined',days:28,showMore:false,pinnedIds:null,renderedIds:[],config:null,html:null};hosts.set(host,state);
      host.addEventListener('click',event=>{
        const control=event.target.closest?.('button');if(!control||!host.contains(control)||control.disabled)return;
        if(scopes.includes(control.dataset.personalScope)){if(state.scope!==control.dataset.personalScope){state.scope=control.dataset.personalScope;state.pinnedIds=null;state.showMore=false;}render(host,state.config);}
        else if(ranges.includes(Number(control.dataset.personalPeriod))){state.days=Number(control.dataset.personalPeriod);render(host,state.config);}
        else if(control.dataset.personalMore==='true'){
          state.showMore=!state.showMore;
          // Collapsing closes hidden disclosures; keep the order pinned only for visible open rows.
          if(!state.showMore&&state.pinnedIds&&!Array.from(host.querySelectorAll('details[data-personal-priority]')).some(el=>el.open&&state.renderedIds.slice(0,5).includes(el.dataset.personalPriority)))state.pinnedIds=null;
          render(host,state.config);
        }
      });
      host.addEventListener('toggle',event=>{
        if(!event.target.isConnected||!event.target.matches?.('details[data-personal-priority]'))return;
        const open=Array.from(host.querySelectorAll('details[data-personal-priority]')).some(el=>el.open);
        if(open&&!state.pinnedIds)state.pinnedIds=[...state.renderedIds];
        else if(!open&&state.pinnedIds){state.pinnedIds=null;render(host,state.config);}
      },true);
    }
    const same=state.id===config.gymnastId,snapshot=same?capture(host):null;
    if(!same){state.id=config.gymnastId;state.scope='combined';state.days=28;state.showMore=false;state.pinnedIds=null;}
    state.config=config;
    const model=build(config,state);state.renderedIds=model.priorities.map(row=>row.skill.id);
    const html=!model.gymnast?'<p class="pi-empty">Choose a gymnast to see their insights.</p>':!model.loaded?'<p class="pi-empty" role="status">Loading personal insights…</p>':`<div class="profile-insights" data-personal-gymnast="${esc(model.gymnast.id)}"><div class="pi-toolbar"><h2>Insights</h2><div class="pi-scopes" role="group" aria-label="Personal insights apparatus">${scopes.map(scope=>`<button type="button" data-personal-scope="${scope}" data-personal-focus="scope-${scope}" aria-pressed="${state.scope===scope}">${label(scope)}</button>`).join('')}</div></div><div class="pi-totals"><div><strong>${number(model.score.points)}</strong><span>${label(state.scope)} points</span></div><div><strong>${model.score.achieved}<small> / ${skillScope(config.data.skills,state.scope).length}</small></strong><span>skills achieved</span></div><div><strong>${model.score.perfect}</strong><span>Perfect</span></div></div>${priorities(model,config.data)}<div class="pi-overview">${categories(model)}${weekly(model)}</div>${graph(model)}</div>`;
    if(state.html!==html){host.innerHTML=html;state.html=html;restoreDOM(host,snapshot);}
    return model;
  }
  window.SWLProfileInsights=Object.freeze({build,render,capture,restore});
})();
