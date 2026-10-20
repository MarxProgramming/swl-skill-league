(() => {
  'use strict';
  const DAY=86400000, esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let directory,analytics,actions,data,directoryGroup='all',directoryComplex='',analyticsGroup='all',analyticsGymnast='all',analyticsAge='all',analyticsComparison='foundation',analyticsRankCategory='overall',analyticsRankMetric='points';
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const number=n=>Number(n||0).toLocaleString('en-GB',{maximumFractionDigits:1});
  const initials=name=>name.trim().split(/\s+/).filter((_,i,a)=>i===0||i===a.length-1).map(s=>Array.from(s)[0]).join('');
  const heatClass=(id,at)=>{const level=data.heatLevel?.(id,at)||(data.isOnFire(id,at)?'fire':'none');return level==='fire'?'is-on-fire':level==='hot'?'is-hot':'';};
  const ageGroups=()=>data.ageCategories||[];
  const ageOf=g=>data.ageCategory?.(g)||'unknown';
  const ageLabel=c=>c.name+' · '+c.range;
  const groupKey=coach=>data.coachingGroupKey?.(coach)||(String(coach||'').trim().toLowerCase()==='coaches'?'coaches':coach);
  const isCoach=g=>data.isCoachParticipant?.(g)??(groupKey(g?.coach)==='coaches');
  const coachBadge=g=>data.coachBadge?.(g)||'';
  const inGroup=(g,group)=>data.inGroup?.(g,group)??(group==='overall'||(group==='all'?!isCoach(g):group==='senior'?['Marx','Dan'].includes(g.coach):groupKey(g.coach)===groupKey(group)));
  const groupName=group=>group==='coaches'?'Coaches':data.groupLabel(group);
  const countNoun=(group,n)=>group==='coaches'?(n===1?'coach':'coaches'):group==='overall'?(n===1?'participant':'participants'):(n===1?'gymnast':'gymnasts');
  const memberships=g=>data.squadMemberships?.(g)||[groupKey(g.coach)];
  const personGroups=g=>data.gymnastSquadLabel?.(g)||data.groupLabel(g.coach);
  function groupOptions() {return [...new Set(data.gymnasts.flatMap(memberships))].sort((a,b)=>Number(a==='coaches')-Number(b==='coaches'));}
  const htmlCache=new WeakMap();
  const focusControls='button,input,select,summary,a,[tabindex]';
  const focusData=['gymnast','directoryGroup','analyticsAge','analyticsGroup','quickSkill','quickRenew','quickGymnast','mapGymnast','mapSkill','v2Focus','analyticsComparison','analyticsCategory','analyticsPerson'];
  function focusKey(root) {
    const e=document.activeElement;if(!e||!root.contains(e))return null;
    const dataset=Object.fromEntries(focusData.filter(key=>e.dataset?.[key]!==undefined).map(key=>[key,e.dataset[key]]));
    const kind=['age-bar','age-cohort','directory-profile','directory-quick-skill','directory-quick-renew'].find(name=>e.classList?.contains(name))||'';
    return {element:e,id:e.id,dataset,kind,tag:e.tagName,selection:e.selectionStart,end:e.selectionEnd,
      summary:e.tagName==='SUMMARY'?[...root.querySelectorAll('summary')].indexOf(e):-1};
  }
  function restore(root,key) {
    if(!key)return;
    if(key.element.isConnected&&root.contains(key.element))return;
    let el=key.id?root.querySelector('#'+key.id):null;
    if(!el&&Object.keys(key.dataset).length)el=[...root.querySelectorAll(focusControls)].find(e=>
      (!key.tag||e.tagName===key.tag)&&(!key.kind||e.classList?.contains(key.kind))&&Object.entries(key.dataset).every(([k,v])=>e.dataset?.[k]===v));
    if(!el&&key.summary>=0)el=root.querySelectorAll('summary')[key.summary];
    if(!el||el.disabled)return;
    el.focus({preventScroll:true});
    if(typeof key.selection==='number')try{el.setSelectionRange(key.selection,key.end??key.selection);}catch(_){}
  }
  function commitHTML(host,html) {
    if(!host||htmlCache.get(host)===html)return false;
    const focus=focusKey(host);
    const scroll=[...host.querySelectorAll('.skill-map-scroll')].map(el=>({left:el.scrollLeft,top:el.scrollTop}));
    const legends=[...host.querySelectorAll('details.map-legend')].map(el=>el.open);
    host.innerHTML=html;htmlCache.set(host,html);
    host.querySelectorAll('.skill-map-scroll').forEach((el,i)=>{if(scroll[i]){el.scrollLeft=scroll[i].left;el.scrollTop=scroll[i].top;}});
    host.querySelectorAll('details.map-legend').forEach((el,i)=>{if(legends[i]!==undefined)el.open=legends[i];});
    restore(host,focus);return true;
  }
  function mount(config) {
    if(directory)return;actions=config;directory=config.directory;analytics=config.analytics;
    directory.innerHTML=`<div class="v2-page-head"><div><p class="eyebrow">Every squad. Every gymnast.</p><h1>Find your gymnast</h1><p>Find a gymnast, or add a complex to mark the whole squad at a glance.</p></div><button class="insights-button" data-view="analytics">◈ Analytics ↗</button></div><div class="directory-tools"><label class="directory-search" for="directorySearch"><span aria-hidden="true">⌕</span><input id="directorySearch" type="search" aria-label="Search gymnasts" placeholder="Search any gymnast…" autocomplete="off"></label><div class="directory-complex-tools directory-squad-tools"><label for="directoryGroups">Squad <span aria-hidden="true">⌄</span></label><select id="directoryGroups"><option value="all">All squads</option></select></div><div class="directory-complex-tools"><label for="directoryComplex">Add a complex <span>⌄</span></label><select id="directoryComplex" aria-describedby="directoryComplexHint"><option value="">No complex selected</option></select><p id="directoryComplexHint">One complex at a time. Your choice appears below every gymnast.</p></div></div><div id="directoryResults"></div>`;
    directory.querySelector('#directorySearch').addEventListener('input',renderDirectory);
    directory.querySelector('#directoryComplex').addEventListener('change',e=>{directoryComplex=e.target.value;renderDirectory();});
    directory.querySelector('#directoryGroups').addEventListener('change',e=>{directoryGroup=e.target.value;renderDirectory();});
    analytics.innerHTML=`<div class="v2-page-head analytics-heading"><div><p class="eyebrow">SWL Squad Training · 3.1</p><h1>Progress, in focus.</h1><p>Compare squads. Find strengths. See what is moving.</p></div><button class="quiet" data-view="dashboard">← Leaderboards</button></div><div class="analytics-filters"><label>Squad<select id="analyticsGroup"></select></label><label>Age group<select id="analyticsAge" aria-describedby="analyticsAgeNote"></select></label><label>Gymnast<select id="analyticsGymnast"></select></label><p>Live from your skill records<br><span>Scores use the same league rules.</span></p></div><p id="analyticsAgeNote" class="analytics-age-note"></p><div id="analyticsContent"></div>`;
    analytics.querySelector('#analyticsGroup').addEventListener('change',e=>{analyticsGroup=e.target.value;if(analyticsGroup==='coaches')analyticsAge='all';analyticsGymnast='all';renderAnalytics();});
    analytics.querySelector('#analyticsAge')?.addEventListener('change',e=>{analyticsAge=e.target.value;analyticsGymnast='all';renderAnalytics();});
    analytics.querySelector('#analyticsGymnast').addEventListener('change',e=>{analyticsGymnast=e.target.value;renderAnalytics();});
    analytics.addEventListener('change',e=>{if(e.target.id==='analyticsRankMetric'){analyticsRankMetric=e.target.value;renderAnalytics();}});
    analytics.addEventListener('click',e=>{
      const comparison=e.target.closest('[data-analytics-comparison]');if(comparison){analyticsComparison=comparison.dataset.analyticsComparison;renderAnalytics();return;}
      const category=e.target.closest('[data-analytics-category]');if(category){analyticsRankCategory=category.dataset.analyticsCategory;analyticsRankMetric='points';renderAnalytics();if(category.dataset.v2Focus==='category-chart')analytics.querySelector('#analyticsStandings')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
      const person=e.target.closest('[data-analytics-person]');if(person){selectGymnast(person.dataset.analyticsPerson);renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});return;}
      const age=e.target.closest('[data-analytics-age]');if(age){analyticsAge=age.dataset.analyticsAge;analyticsGymnast='all';renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});return;}const b=e.target.closest('[data-analytics-group]');if(b){analyticsGroup=b.dataset.analyticsGroup;if(analyticsGroup==='coaches')analyticsAge='all';analyticsGymnast='all';renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});}});
  }
  function render(next) {data=next;if(!directory)return;renderDirectory();renderAnalytics();}
  const shortSkills={
    'rolls-base-0':'HS → fwd roll','rolls-base-full-turn':'Full turn jump','rolls-base-2':'Bwd roll → support',
    'rolls-upgrade-0':'HS roll → pike','rolls-upgrade-1':'1½ turn jump','rolls-upgrade-2':'Bwd roll → HS',
    'rolls-pro-0':'HS pir. → fwd roll','rolls-pro-1':'Split jump','rolls-pro-2':'Bwd roll → HS pir.',
    'acro-base-0':'Bwd walkover','acro-base-full-spin':'Full spin','acro-base-2':'Fwd walkover',
    'acro-upgrade-0':'Split flick','acro-upgrade-1':'1½ spin','acro-upgrade-2':'Chassé free CW',
    'acro-pro-0':'Back tuck','acro-pro-1':'Double spin','acro-pro-2':'Front somi',
    'leaps-base-0':'Split leap','leaps-base-cat':'Cat leap','leaps-base-scissor':'Scissor kick',
    'leaps-base-1':'Cat leap 1/1','leaps-base-2':'Split change','leaps-upgrade-w-hop':'W hop',
    'handstands-base-0':'HS · 5s','handstands-base-1':'HS · 10s','handstands-base-2':'HS · 30s'
  };
  function complexOptions() {
    return data.categories.flatMap(c=>c.tiers.map(([tier,label])=>({id:c.id+'-'+tier,label:c.name+' · '+label,skills:data.skills.filter(k=>k.category===c.id&&k.tier===tier)}))).filter(c=>c.skills.length===3);
  }
  function quickMarks(g,complex) {
    if(!complex)return '';
    return `<div class="directory-quick" role="group" aria-label="${esc(complex.label)} for ${esc(g.name)}"><span class="directory-quick-label">${esc(complex.label)}</span><div class="directory-quick-grid">${complex.skills.map(k=>{
      const level=data.mark(g.id,k.id),fresh=data.skillFreshness(g.id,k.id),status=['Unticked','Achieved','Perfect'][level],next=['Achieved','Perfect','Unticked'][level];
      return `<div class="directory-quick-cell${fresh.due?' is-due':''}"><button type="button" id="quick-${esc(g.id)}-${esc(k.id)}" class="directory-quick-skill level-${level}" data-quick-skill="${esc(k.id)}" data-quick-gymnast="${esc(g.id)}" aria-label="${esc(g.name)} · ${esc(k.name)}: ${status}. Mark ${next}${fresh.due?'. Renewal due':''}" title="${esc(k.name)} · ${status}${fresh.due?' · due for renewal':''}"${data.canEdit===false?' disabled':''}><span aria-hidden="true">${['○','✓','✓✓'][level]}</span><strong>${esc(shortSkills[k.id]||k.name)}</strong></button>${fresh.due?`<button type="button" id="quick-renew-${esc(g.id)}-${esc(k.id)}" class="directory-quick-renew" data-quick-renew="${esc(k.id)}" data-quick-gymnast="${esc(g.id)}" aria-label="Renew ${esc(k.name)} for ${esc(g.name)}"${data.canEdit===false?' disabled':''}>↻ Renew</button>`:''}</div>`;
    }).join('')}</div></div>`;
  }
  function renderDirectory() {
    if(!data)return;const key=focusKey(directory),groups=groupOptions();
    if(!['all','floor','senior','overall'].includes(directoryGroup)&&!groups.includes(directoryGroup))directoryGroup='all';
    const complexes=complexOptions(),select=directory.querySelector('#directoryComplex');
    if(directoryComplex&&!complexes.some(c=>c.id===directoryComplex))directoryComplex='';
    const options='<option value="">No complex · names only</option>'+complexes.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
    commitHTML(select,options);
    select.value=directoryComplex;select.disabled=!data.hasLoaded;
    const complex=complexes.find(c=>c.id===directoryComplex);
    directory.querySelector('#directoryComplexHint').textContent=complex?(data.canEdit===false?'Scoring is locked. You can view the three marks below each name.':'✓ Achieved · ✓✓ Perfect. HS = handstand · CW = cartwheel.'): 'One complex at a time. Your choice appears below every gymnast.';
    const squadSelect=directory.querySelector('#directoryGroups');
    commitHTML(squadSelect,[['all','All squads'],['floor','All floor & vault'],['senior','All senior squad'],...groups.map(g=>[g,g==='coaches'?'Coaches':data.shortGroupLabel(g)]),['overall','Overall · all squads + coaches']].map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join(''));
    squadSelect.value=directoryGroup;squadSelect.disabled=!data.hasLoaded;
    const query=directory.querySelector('#directorySearch').value.trim().toLocaleLowerCase('en-GB');
    const people=data.gymnasts.filter(g=>inGroup(g,directoryGroup)&&(g.name+' '+personGroups(g)).toLocaleLowerCase('en-GB').includes(query));
    commitHTML(directory.querySelector('#directoryResults'),!data.hasLoaded?'<p class="v2-empty" role="status">Loading your squads…</p>':people.length?groups.map(group=>{
      const gymnasts=people.filter(g=>groups.includes(directoryGroup) ? group===directoryGroup&&inGroup(g,group) : groupKey(g.coach)===group).sort((a,b)=>a.name.localeCompare(b.name,'en-GB'));if(!gymnasts.length)return'';
      return `<section class="directory-section"><div class="directory-section-head"><h2>${esc(groupName(group))}</h2><span>${gymnasts.length} ${countNoun(group,gymnasts.length)}</span></div><div class="directory-grid">${gymnasts.map(g=>{const s=data.summary(g.id),due=data.skills.filter(k=>data.skillFreshness(g.id,k.id).due).length;return `<article class="directory-card${heatClass(g.id)?' '+heatClass(g.id):''}${complex?' has-complex':''}"><button type="button" class="directory-profile" data-gymnast="${esc(g.id)}" aria-label="Open skills for ${esc(g.name)}${isCoach(g)?', coach':''}"><span class="directory-avatar" aria-hidden="true">${esc(initials(g.name))}</span><span class="directory-person"><strong>${esc(g.name)} ${coachBadge(g)}</strong><small class="heat-meta"><span class="heat-meta-text">${s.achieved}/${data.skills.length} skills · ${s.perfect} perfect</span>${data.fireBadge(g.id)}</small>${due?`<span class="due-badge">${due} due for renewal</span>`:''}</span><span class="directory-points"><b>${number(s.points)}</b><small>pts ↗</small></span></button>${quickMarks(g,complex)}</article>`;}).join('')}</div></section>`;
    }).join(''):'<p class="v2-empty" role="status">No matching gymnasts. Try another name or squad.</p>');
    restore(directory,key);
  }
  function aggregate(people,at=Date.now()) {
    const counts={unticked:0,achieved:0,perfect:0,points:0,due:0,gains:0,onFire:0,hot:0,weeklyPoints:0};
    const horizon=[0,0,0,0],momentum=Array(7).fill(0);
    const categories=data.categories.map(c=>({...c,total:0,achieved:0,perfect:0}));
    const duePeople=[];
    people.forEach(g=>{
      counts.points+=data.summary(g.id).points;let due=0;
      if(heatClass(g.id,at)==='is-on-fire')counts.onFire++;else if(heatClass(g.id,at)==='is-hot')counts.hot++;
      counts.weeklyPoints+=data.weeklyPoints?.(g.id,at)||0;
      data.skills.forEach(skill=>{
        const level=data.mark(g.id,skill.id),fresh=data.skillFreshness(g.id,skill.id,at),cat=categories.find(c=>c.id===skill.category);cat.total++;
        counts[['unticked','achieved','perfect'][level]]++;if(level)cat.achieved++;if(level===2)cat.perfect++;
        if(fresh.due){counts.due++;due++;}
        if(level===2&&fresh.days!==null)horizon[Math.min(3,Math.max(0,Math.ceil(fresh.days/7)-1))]++;
        const earned=Date.parse(data.state.skillDates?.[g.id]?.[skill.id]?.earnedAt||'');
        if(level&&Number.isFinite(earned)&&earned<=at&&earned>at-7*DAY){counts.gains++;momentum[Math.max(0,Math.min(6,6-Math.floor((at-earned)/DAY)))]++;}
      });if(due)duePeople.push({g,due});
    });
    return {counts,horizon,momentum,categories,duePeople,total:people.length*data.skills.length};
  }
  function cohortStats(people,skills=data.skills) {
    let achieved=0,perfect=0,levels=0;
    people.forEach(g=>skills.forEach(k=>{const level=data.mark(g.id,k.id);if(level===1)achieved++;if(level===2)perfect++;levels+=level;}));
    const total=people.length*skills.length;
    return {achieved,perfect,total,retained:achieved+perfect,foundation:total?levels/(total*2)*100:0,
      average:people.length?people.reduce((sum,g)=>sum+data.summary(g.id).points,0)/people.length:0};
  }
  function stackedTrack(stats,extra='') {
    return `<span class="a31-stack ${extra}" aria-hidden="true"><i class="a31-perfect" style="width:${stats.total?stats.perfect/stats.total*100:0}%"></i><i class="a31-achieved" style="width:${stats.total?stats.achieved/stats.total*100:0}%"></i></span>`;
  }
  function chartKey() {return '<div class="a31-key"><span><i class="a31-perfect"></i>Perfect</span><span><i class="a31-achieved"></i>Achieved</span><span><i></i>Not yet</span></div>';}
  function squadComparisons(groups) {
    const baseSkills=data.skills.filter(k=>k.tier==='base');
    return groups.map(group=>{
      const members=data.gymnasts.filter(g=>inGroup(g,group)&&(analyticsAge==='all'||ageOf(g)===analyticsAge));
      const all=cohortStats(members),base=cohortStats(members,baseSkills);
      const value=analyticsComparison==='average'?all.average:analyticsComparison==='retained'?(all.total?all.retained/all.total*100:0):base.foundation;
      return {group,members,all,base,value};
    }).sort((a,b)=>b.value-a.value||groupName(a.group).localeCompare(groupName(b.group),'en-GB'));
  }
  function renderSquadComparison(groups) {
    const rows=squadComparisons(groups),active=rows.filter(r=>r.members.length),lead=active[0],max=analyticsComparison==='average'?Math.max(1,...rows.map(r=>r.value)):100;
    const metric=analyticsComparison==='average'?'average points':analyticsComparison==='retained'?'skills retained':'foundation progress';
    const ageScope=analyticsAge==='all'?'All ages':ageLabel(ageGroups().find(c=>c.id===analyticsAge));
    const suffix=analyticsComparison==='average'?'pts':'%';
    const joint=lead&&active.filter(r=>Math.abs(r.value-lead.value)<0.00001).length>1;
    const insight=lead&&lead.value>0?`${joint?'Joint lead':'Leading'} · ${groupName(lead.group)}`:'A fresh starting line';
    return `<section class="analytics-panel analytics-wide a31-squad-panel"><div class="analytics-panel-head"><div><p class="eyebrow">A fair view of every squad</p><h2>Squad foundations</h2></div><span class="a31-panel-index" aria-hidden="true">01 / COMPARE</span></div>
      <div class="a31-comparison-lead"><div><span>${esc(insight)}</span><strong>${lead&&lead.value>0?number(lead.value):'0'}<small>${suffix}</small></strong><p>${esc(metric)}${joint?' · tied at the top':''}</p></div><div class="a31-segments" role="group" aria-label="Squad comparison measure">${[['foundation','Foundations'],['average','Average points'],['retained','Skills retained']].map(([id,label])=>`<button type="button" data-analytics-comparison="${id}" aria-pressed="${analyticsComparison===id}">${label}</button>`).join('')}</div></div>
      <p class="a31-chart-scope">${esc(ageScope)} · Whole-squad comparison${analyticsGymnast!=='all'?' · personal selection applies to the charts below':''}</p>
      <div class="a31-squad-chart">${rows.map((r,i)=>`<button type="button" class="a31-squad-row${r.group===analyticsGroup?' is-selected':''}" data-analytics-group="${esc(r.group)}" aria-pressed="${r.group===analyticsGroup}" aria-label="${esc(groupName(r.group))}: ${number(r.value)} ${metric}, ${r.members.length} ${countNoun(r.group,r.members.length)}. Explore squad."${r.members.length?'':' disabled'}><span class="a31-chart-rank">${String(i+1).padStart(2,'0')}</span><span class="a31-chart-name"><strong>${esc(groupName(r.group))}</strong><small>${r.members.length} ${countNoun(r.group,r.members.length)} · ${number(r.all.average)} average points</small></span><span class="a31-comparison-track" aria-hidden="true"><i style="width:${r.value/max*100}%"></i></span><span class="a31-chart-value">${r.members.length?number(r.value):'—'}<small>${r.members.length?suffix:'no records'}</small></span></button>`).join('')}</div>
      <p class="chart-note">${analyticsComparison==='foundation'?'Base skills, basic leaps and handstands only. Achieved counts halfway; Perfect counts fully.':analyticsComparison==='average'?'Total league points divided by the number of gymnasts in each squad. Completion bonuses are included.':'The percentage of all available skills that are Achieved or Perfect.'} Every gymnast has the same available skills, so a larger squad does not get a size advantage. Choose a squad to explore it below.</p></section>`;
  }
  function renderAgePanels(people) {
    const groups=ageGroups();if(!groups.length)return '';
    const cohorts=groups.map(category=>({category,members:people.filter(g=>ageOf(g)===category.id)})).map(c=>({...c,stats:cohortStats(c.members)})).filter(c=>c.members.length);
    const unknown=people.filter(g=>ageOf(g)==='unknown').length;
    return `<section class="analytics-panel analytics-wide a31-age-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Current progress · ${esc(data.londonYear?.()||new Date().getFullYear())}</p><h2>Progress by age</h2></div><span class="a31-panel-index" aria-hidden="true">04 / AGE GROUPS</span></div>${chartKey()}
      ${cohorts.length?`<div class="a31-age-chart">${cohorts.map(({category,members,stats})=>`<button type="button" class="a31-age-row age-cohort" data-analytics-age="${esc(category.id)}" aria-pressed="${analyticsAge===category.id}" aria-label="${esc(ageLabel(category))}: ${members.length} ${members.length===1?'gymnast':'gymnasts'}, ${number(stats.average)} average points, ${pct(stats.retained,stats.total)} percent of skills retained. Filter age group."><span class="a31-chart-name"><strong>${esc(category.name)}</strong><small>${esc(category.range)} · ${members.length} ${members.length===1?'gymnast':'gymnasts'}</small></span><span class="a31-age-bar">${stackedTrack(stats)}<small>${pct(stats.retained,stats.total)}% retained · ${pct(stats.perfect,stats.total)}% perfect</small></span><span class="a31-chart-value">${number(stats.average)}<small>avg points</small></span></button>`).join('')}</div>`:'<p class="v2-empty small">No current-year age groups are available in this view. Everyone remains included when All ages is selected.</p>'}
      <p class="chart-note">Compares all age groups in the selected squad${analyticsGymnast!=='all'?' for the selected gymnast':''}. Select a row to filter the other charts. Bars show the share of available skills, so group sizes are comparable. ${unknown?`${unknown} ${unknown===1?'gymnast has':'gymnasts have'} no age group recorded and ${unknown===1?'is':'are'} included in All ages only. `:''}A current snapshot, not an age target.</p></section>`;
  }
  const londonDayFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
  const chartDayFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  function londonDay(value=Date.now()) {
    const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
    const p=Object.fromEntries(londonDayFormat.formatToParts(date).map(part=>[part.type,part.value]));return `${p.year}-${p.month}-${p.day}`;
  }
  function dayNumber(day) {
    if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
    const time=Date.parse(day+'T00:00:00Z');return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===day?time/DAY:null;
  }
  function weeklySeries(people) {
    const progress=data.state.weeklyProgress;
    const end=dayNumber(londonDay()),values=Array(8).fill(0);
    const tracked=Boolean(progress&&progress.history&&typeof progress.history==='object');
    const started=tracked?dayNumber(londonDay(progress.startedAt)):null;
    const known=values.map((_,i)=>!tracked||started===null||end-(7-i)*7>=started);
    people.forEach(g=>{
      if(tracked){
        const perDay=new Map();
        (Array.isArray(progress.history[g.id])?progress.history[g.id]:[]).forEach(record=>{
          const day=dayNumber(record?.day);if(day===null||day>end||day<end-55||!Number.isFinite(record.points))return;
          perDay.set(day,record.points);
        });
        perDay.forEach((points,day)=>{values[7-Math.floor((end-day)/7)]+=points;});
      }else data.skills.forEach(skill=>{
        if(!data.mark(g.id,skill.id))return;
        const earned=Date.parse(data.state.skillDates?.[g.id]?.[skill.id]?.earnedAt||'');
        if(!Number.isFinite(earned)||earned>Date.now())return;
        const day=dayNumber(londonDay(earned));
        if(day===null||day>end||day<end-55)return;
        values[7-Math.floor((end-day)/7)]++;
      });
    });
    return {values,known,tracked,started,end};
  }
  function renderMomentum(people) {
    const series=weeklySeries(people),max=Math.max(1,...series.values.map(Math.abs));
    const dateLabel=day=>chartDayFormat.format(new Date(day*DAY));
    const range=i=>`${dateLabel(series.end-(7-i)*7-6)}–${dateLabel(series.end-(7-i)*7)}`;
    const unit=series.tracked?'net league points':'latest retained gains',total=series.values[7],delta=total-series.values[6];
    return `<section class="analytics-panel momentum-panel a31-momentum"><div class="analytics-panel-head"><div><p class="eyebrow">Eight seven-day windows</p><h2>Building momentum</h2></div><span class="analytics-symbol" aria-hidden="true">↗</span></div><div class="momentum-total"><strong>${number(total)}</strong><span>${series.tracked?'net league points in the last 7 days':'latest retained gains in 7 days'}${series.known[6]&&series.tracked?`<small class="a31-delta${delta<0?' negative':''}">${delta>0?'+':''}${number(delta)} vs previous 7 days</small>`:''}</span></div><div class="a31-momentum-chart" role="img" aria-label="${esc((series.tracked?'Net league point history':'Retained skill gain dates')+', oldest to newest. '+series.values.map((n,i)=>range(i)+': '+(series.known[i]?number(n)+' '+unit:'not tracked')).join('; '))}">${series.values.map((n,i)=>`<div class="a31-week${i===7?' is-current':''}" title="${esc(range(i)+': '+(series.known[i]?number(n)+' '+unit:'not tracked'))}"><strong>${series.known[i]?number(n):'—'}</strong><span class="a31-week-track" aria-hidden="true"><i style="grid-row:${n<0?2:1};align-self:${n<0?'start':'end'};height:${series.known[i]&&n?Math.max(3,Math.abs(n)/max*72):0}px" class="${n<0?'negative':''}"></i></span><small>${i===7?'Latest':dateLabel(series.end-(7-i)*7)}</small></div>`).join('')}</div><p class="chart-note">${series.tracked?'The chart includes all league points. Each bar covers seven days, ending on the date below it; the latest window ends today (London time). Gains sit above zero; reductions sit below. Untracked weeks show —.':'Point history is not available in this snapshot. These bars show only each currently retained skill’s latest gain date; they are not a historical point total.'}${series.tracked&&data.state.weeklyProgress.complete===false?' Tracking began partway through the first window, so earlier points are not included.':''}</p></section>`;
  }
  function renderCategories(a) {
    return `<section class="analytics-panel a31-categories"><div class="analytics-panel-head"><div><p class="eyebrow">Where the strengths are</p><h2>Across the skills</h2></div><span class="analytics-symbol" aria-hidden="true">≋</span></div>${chartKey()}<div class="a31-category-chart">${a.categories.map(cat=>{const stats={perfect:cat.perfect,achieved:cat.achieved-cat.perfect,total:cat.total};return `<button type="button" data-analytics-category="${esc(cat.id)}" data-v2-focus="category-chart" aria-label="${esc(cat.name)}: ${cat.achieved} of ${cat.total} skills retained, ${cat.perfect} perfect. View full ${esc(cat.name)} standings."><span class="a31-category-label"><strong>${esc(cat.name)}</strong><b>${pct(cat.achieved,cat.total)}<small>%</small></b></span>${stackedTrack(stats)}<span class="a31-category-detail">${cat.achieved}/${cat.total} retained · ${cat.perfect} perfect<span aria-hidden="true">Standings ↗</span></span></button>`;}).join('')}</div><p class="chart-note">Purple is Achieved. Mint is Perfect. Every skill counts once, whatever its points. Select a category to see its full standings below.</p></section>`;
  }
  function rankedPeople(people,category='overall',metric='points') {
    const tracked=Boolean(data.state.weeklyProgress?.history&&typeof data.state.weeklyProgress.history==='object');
    return people.map(g=>{const score=data.summary(g.id,category),weekly=tracked?weeklySeries([g]).values[7]:null;return {g,score,weekly,value:metric==='weekly'?weekly:score.points};}).sort((a,b)=>(b.value??0)-(a.value??0)||a.g.name.localeCompare(b.g.name,'en-GB'));
  }
  function renderStandings(people,scope) {
    if(!['overall',...data.categories.map(c=>c.id)].includes(analyticsRankCategory))analyticsRankCategory='overall';
    const tracked=Boolean(data.state.weeklyProgress?.history&&typeof data.state.weeklyProgress.history==='object');
    if(!tracked)analyticsRankMetric='points';
    const weekly=analyticsRankMetric==='weekly',category=weekly?'overall':analyticsRankCategory,rows=rankedPeople(people,category,analyticsRankMetric),max=Math.max(1,...rows.map(r=>Math.abs(r.value||0)));
    const categoryName=category==='overall'?'Overall league':data.categories.find(c=>c.id===category)?.name;
    return `<section class="analytics-panel analytics-wide a31-standings" id="analyticsStandings"><div class="analytics-panel-head"><div><p class="eyebrow">The whole field</p><h2>Every place. Every point.</h2></div><span class="a31-panel-index" aria-hidden="true">05 / STANDINGS</span></div>
      <div class="a31-standing-controls"><div class="a31-segments" role="group" aria-label="Standings category">${[{id:'overall',name:'Overall'},...data.categories].map(c=>`<button type="button" data-analytics-category="${esc(c.id)}" data-v2-focus="standings" aria-pressed="${!weekly&&analyticsRankCategory===c.id}">${esc(c.name)}</button>`).join('')}</div><label>Order by<select id="analyticsRankMetric"><option value="points"${!weekly?' selected':''}>League points</option><option value="weekly"${weekly?' selected':''}${tracked?'':' disabled'}>Last 7 days · net points</option></select></label></div>
      <p class="a31-chart-scope">${esc(scope)} · ${weekly?'Net league points in the last 7 days':esc(categoryName)} · highest to lowest</p>
      ${rows.length?`<div class="a31-standing-list" role="list">${rows.map((r,i)=>`<div class="a31-standing-row${heatClass(r.g.id)?' '+heatClass(r.g.id):''}" role="listitem"><span class="a31-standing-rank">${i+1}</span><button type="button" class="a31-standing-person" data-analytics-person="${esc(r.g.id)}" aria-label="Explore analytics for ${esc(r.g.name)}"><strong>${esc(r.g.name)} ${coachBadge(r.g)}</strong><small>${esc(personGroups(r.g))}</small></button><span class="a31-standing-bar" aria-hidden="true"><i class="${r.value<0?'negative':''}" style="width:${Math.abs(r.value||0)/max*100}%"></i></span><span class="a31-standing-value${r.value<0?' negative':''}">${weekly&&r.value>0?'+':''}${number(r.value)}<small>${weekly?'net pts':'pts'}</small></span><button type="button" class="a31-open-profile" data-gymnast="${esc(r.g.id)}" data-v2-focus="standings-profile" aria-label="Open skills for ${esc(r.g.name)}">↗</button></div>`).join('')}</div>`:'<p class="v2-empty small">No gymnasts match these filters. Try All ages or another squad.</p>'}
      <p class="chart-note">${weekly?'Includes gains and reductions across all skills. Each bar shows the size of the net change; reductions are rose-coloured. '+(data.state.weeklyProgress.complete===false?'Tracking began partway through the first window. ':''):'Uses the same scores as the league, including completion bonuses. '}Matching scores are ordered alphabetically. Select a name to explore their analytics, or ↗ to open their skills.</p></section>`;
  }
  function renderAnalytics() {
    if(!data)return;
    const groups=groupOptions();if(!['all','floor','senior','overall'].includes(analyticsGroup)&&!groups.includes(analyticsGroup))analyticsGroup='all';
    if(analyticsAge!=='all'&&!ageGroups().some(c=>c.id===analyticsAge))analyticsAge='all';
    const squadPeople=data.gymnasts.filter(g=>inGroup(g,analyticsGroup));
    const comparisonGroups=groups.filter(group=>group!=='coaches'||['coaches','overall'].includes(analyticsGroup));
    const candidates=squadPeople.filter(g=>analyticsAge==='all'||ageOf(g)===analyticsAge);
    if(analyticsGymnast!=='all'&&!candidates.some(g=>g.id===analyticsGymnast))analyticsGymnast='all';
    const ageSelect=analytics.querySelector('#analyticsAge');
    const ageHTML='<option value="all">All ages · includes unknown</option>'+ageGroups().map(c=>`<option value="${esc(c.id)}">${esc(ageLabel(c))}</option>`).join('');
    if(ageSelect){commitHTML(ageSelect,ageHTML);ageSelect.value=analyticsAge;}
    const ageNote=analytics.querySelector('#analyticsAgeNote');if(ageNote)ageNote.textContent=`Age is the age a gymnast turns during ${data.londonYear?.()||new Date().getFullYear()} (London calendar year). ${analyticsAge==='all'?'All ages includes gymnasts whose age is not available.':'This age filter excludes gymnasts whose current-year age is not available.'} Full dates of birth are never shown.`;
    const groupSelect=analytics.querySelector('#analyticsGroup'),personSelect=analytics.querySelector('#analyticsGymnast');
    const gHTML='<option value="all">All squads</option><option value="floor">All floor &amp; vault squads</option><option value="senior">All senior squad</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(groupName(g))}</option>`).join('')+'<option value="overall">Overall · all squads + coaches</option>';
    const pHTML='<option value="all">All gymnasts</option>'+candidates.slice().sort((a,b)=>a.name.localeCompare(b.name,'en-GB')).map(g=>`<option value="${esc(g.id)}">${esc(g.name)}${isCoach(g)?' · Coach':''}</option>`).join('');
    commitHTML(groupSelect,gHTML);commitHTML(personSelect,pHTML);
    groupSelect.value=analyticsGroup;personSelect.value=analyticsGymnast;
    const host=analytics.querySelector('#analyticsContent');if(!data.hasLoaded){commitHTML(host,'<p class="v2-empty" role="status">Loading your training picture…</p>');return;}
    const people=candidates.filter(g=>analyticsGymnast==='all'||g.id===analyticsGymnast),a=aggregate(people),c=a.counts;
    const scope=analyticsGymnast==='all'?(analyticsGroup==='all'?'All squads':analyticsGroup==='senior'?'All senior squad':analyticsGroup==='overall'?'Overall · all squads + coaches':groupName(analyticsGroup)):people[0]?.name;
    const ageScope=analyticsAge==='all'?'All ages':ageLabel(ageGroups().find(c=>c.id===analyticsAge)),fullScope=scope+' · '+ageScope;
    const cohortPeople=squadPeople.filter(g=>analyticsGymnast==='all'||g.id===analyticsGymnast);
    commitHTML(host,`<div class="analytics-grid a31-grid">${renderSquadComparison(comparisonGroups)}
      <div class="analytics-wide a31-selected-scope"><div><p class="eyebrow">Exploring below</p><p class="analytics-scope${analyticsGymnast!=='all'&&heatClass(analyticsGymnast)?' '+heatClass(analyticsGymnast):''}">${esc(scope)} ${analyticsGymnast!=='all'?coachBadge(people[0]):''}<span>· ${esc(ageScope)} · ${people.length} ${countNoun(analyticsGroup,people.length)}</span></p></div>${analyticsGymnast!=='all'?`<button type="button" class="quiet" data-gymnast="${esc(analyticsGymnast)}">Open skills ↗</button>`:''}</div>
      <div class="analytics-stat-grid analytics-wide a31-stats"><article><span>Average points</span><strong>${number(people.length?c.points/people.length:0)}</strong><p>Per ${analyticsGroup==='coaches'?'coach':'gymnast'} in this view</p></article><article><span>Skills retained</span><strong>${pct(c.achieved+c.perfect,a.total)}<small>%</small></strong><p>${c.achieved+c.perfect} of ${a.total} available skills</p></article><article><span>Perfect marks</span><strong>${c.perfect}</strong><p>${pct(c.perfect,a.total)}% of available skills</p></article><article><span>League points</span><strong>${number(c.points)}</strong><p>Combined points in this view</p></article></div>
      ${!people.length?'<p class="v2-empty analytics-wide" role="status">No gymnasts match these filters. Try All ages or another squad.</p>':''}
      ${renderCategories(a)}${renderMomentum(people)}${renderAgePanels(cohortPeople)}${renderStandings(people,fullScope)}</div>`);
  }
  function resetAnalytics() {analyticsGroup='all';analyticsGymnast='all';analyticsAge='all';analyticsComparison='foundation';analyticsRankCategory='overall';analyticsRankMetric='points';}
  function selectGymnast(id) {analyticsGroup=isCoach(data?.gymnasts.find(g=>g.id===id))?'coaches':'all';analyticsAge='all';analyticsGymnast=id;}
  function showGymnastInDirectory(id) {
    const gymnast=data?.gymnasts.find(g=>g.id===id);if(!gymnast)return;
    if(!inGroup(gymnast,directoryGroup))directoryGroup=isCoach(gymnast)?'coaches':'all';
  }
  window.SWLV2=Object.freeze({mount,render,selectGymnast,resetAnalytics,showGymnastInDirectory});
})();
