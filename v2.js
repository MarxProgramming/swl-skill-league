(() => {
  'use strict';
  const DAY=86400000, esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let directory,analytics,actions,data,directoryGroup='all',directoryComplex='',analyticsGroup='all',analyticsGymnast='all',analyticsAge='all';
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
  function groupOptions() {return [...new Set(data.gymnasts.map(g=>groupKey(g.coach)))].sort((a,b)=>Number(a==='coaches')-Number(b==='coaches'));}
  const htmlCache=new WeakMap();
  const focusControls='button,input,select,summary,a,[tabindex]';
  const focusData=['gymnast','directoryGroup','analyticsAge','analyticsGroup','quickSkill','quickRenew','quickGymnast','mapGymnast','mapSkill','v2Focus'];
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
    directory.innerHTML=`<div class="v2-page-head"><div><p class="eyebrow">Every squad. Every gymnast.</p><h1>Find your gymnast</h1><p>Find a gymnast, or add a complex to mark the whole squad at a glance.</p></div><button class="insights-button" data-view="analytics">◈ Analytics ↗</button></div><div class="directory-tools"><label class="directory-search" for="directorySearch"><span aria-hidden="true">⌕</span><input id="directorySearch" type="search" aria-label="Search gymnasts" placeholder="Search any gymnast…" autocomplete="off"></label><div id="directoryGroups" class="directory-groups" role="group" aria-label="Filter gymnast directory by squad"></div><div class="directory-complex-tools"><label for="directoryComplex">Add a complex <span>⌄</span></label><select id="directoryComplex" aria-describedby="directoryComplexHint"><option value="">No complex selected</option></select><p id="directoryComplexHint">One complex at a time. Your choice appears below every gymnast.</p></div></div><div id="directoryResults"></div>`;
    directory.querySelector('#directorySearch').addEventListener('input',renderDirectory);
    directory.querySelector('#directoryComplex').addEventListener('change',e=>{directoryComplex=e.target.value;renderDirectory();});
    directory.addEventListener('click',e=>{const b=e.target.closest('[data-directory-group]');if(b){directoryGroup=b.dataset.directoryGroup;renderDirectory();}});
    analytics.innerHTML=`<div class="v2-page-head analytics-heading"><div><p class="eyebrow">SWL Squad Training · 3.0</p><h1>Progress, in focus.</h1><p>Strong foundations. Fresh skills. Momentum you can see.</p></div><button class="quiet" data-view="dashboard">← Leaderboards</button></div><div class="analytics-filters"><label>Squad<select id="analyticsGroup"></select></label><label>Age group<select id="analyticsAge" aria-describedby="analyticsAgeNote"></select></label><label>Gymnast<select id="analyticsGymnast"></select></label><p>Live from your skill records<br><span>Scores use the same league rules.</span></p></div><p id="analyticsAgeNote" class="analytics-age-note"></p><div id="analyticsContent"></div>`;
    analytics.querySelector('#analyticsGroup').addEventListener('change',e=>{analyticsGroup=e.target.value;if(analyticsGroup==='coaches')analyticsAge='all';analyticsGymnast='all';renderAnalytics();});
    analytics.querySelector('#analyticsAge')?.addEventListener('change',e=>{analyticsAge=e.target.value;analyticsGymnast='all';renderAnalytics();});
    analytics.querySelector('#analyticsGymnast').addEventListener('change',e=>{analyticsGymnast=e.target.value;renderAnalytics();});
    analytics.addEventListener('click',e=>{const age=e.target.closest('[data-analytics-age]');if(age){analyticsAge=age.dataset.analyticsAge;analyticsGymnast='all';renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});return;}const b=e.target.closest('[data-analytics-group]');if(b){analyticsGroup=b.dataset.analyticsGroup;if(analyticsGroup==='coaches')analyticsAge='all';analyticsGymnast='all';renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});}});
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
    if(!['all','overall'].includes(directoryGroup)&&!groups.includes(directoryGroup))directoryGroup='all';
    const complexes=complexOptions(),select=directory.querySelector('#directoryComplex');
    if(directoryComplex&&!complexes.some(c=>c.id===directoryComplex))directoryComplex='';
    const options='<option value="">No complex · names only</option>'+complexes.map(c=>`<option value="${esc(c.id)}">${esc(c.label)}</option>`).join('');
    commitHTML(select,options);
    select.value=directoryComplex;select.disabled=!data.hasLoaded;
    const complex=complexes.find(c=>c.id===directoryComplex);
    directory.querySelector('#directoryComplexHint').textContent=complex?(data.canEdit===false?'Scoring is locked. You can view the three marks below each name.':'✓ Achieved · ✓✓ Perfect. HS = handstand · CW = cartwheel.'): 'One complex at a time. Your choice appears below every gymnast.';
    commitHTML(directory.querySelector('#directoryGroups'),[['all','All squads'],...groups.map(g=>[g,g==='coaches'?'Coaches':data.shortGroupLabel(g)]),['overall','Overall · all squads + coaches']].map(([id,name])=>`<button type="button" data-directory-group="${esc(id)}" aria-pressed="${id===directoryGroup}">${esc(name)}</button>`).join(''));
    const query=directory.querySelector('#directorySearch').value.trim().toLocaleLowerCase('en-GB');
    const people=data.gymnasts.filter(g=>inGroup(g,directoryGroup)&&(g.name+' '+data.groupLabel(g.coach)).toLocaleLowerCase('en-GB').includes(query));
    commitHTML(directory.querySelector('#directoryResults'),!data.hasLoaded?'<p class="v2-empty" role="status">Loading your squads…</p>':people.length?groups.map(group=>{
      const gymnasts=people.filter(g=>groupKey(g.coach)===group).sort((a,b)=>a.name.localeCompare(b.name,'en-GB'));if(!gymnasts.length)return'';
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
  function renderAgePanels(people) {
    const groups=ageGroups();if(!groups.length)return '';
    const baseSkills=data.skills.filter(k=>k.tier==='base');
    const cohorts=groups.map(category=>{
      const members=people.filter(g=>ageOf(g)===category.id),a=aggregate(members);
      const levels=members.reduce((sum,g)=>sum+baseSkills.reduce((total,k)=>total+data.mark(g.id,k.id),0),0);
      return {category,count:members.length,average:members.length?a.counts.points/members.length:0,retained:pct(a.counts.achieved+a.counts.perfect,a.total),perfect:pct(a.counts.perfect,a.total),foundation:pct(levels,members.length*baseSkills.length*2)};
    });
    const unknown=people.filter(g=>ageOf(g)==='unknown').length,max=Math.max(1,...cohorts.map(c=>c.count));
    return `<section class="analytics-panel analytics-wide age-distribution"><div class="analytics-panel-head"><div><p class="eyebrow">Age groups · ${esc(data.londonYear?.()||new Date().getFullYear())}</p><h2>Who's training?</h2></div><span class="analytics-symbol" aria-hidden="true">◫</span></div><div class="age-distribution-grid" role="group" aria-label="Age distribution in the selected squad and gymnast scope">${cohorts.map(({category,count})=>`<button type="button" class="age-bar" data-analytics-age="${esc(category.id)}" aria-pressed="${analyticsAge===category.id}" aria-label="${esc(ageLabel(category))}: ${count} ${count===1?'gymnast':'gymnasts'}. Filter this age group."><strong>${count}</strong><span class="age-bar-track" aria-hidden="true"><i style="height:${count?Math.max(4,count/max*100):0}%"></i></span><b>${esc(category.name)}</b><small>${esc(category.range)}</small></button>`).join('')}</div><p class="age-coverage"><strong>${people.length-unknown} of ${people.length}</strong> with a current age group · <strong>${unknown}</strong> unknown${unknown?' (kept in All ages)':''}</p><p class="chart-note">Age groups compare the selected squad, or the selected gymnast. Choose a bar to filter the other charts. Unknown ages are never guessed.</p></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">Compare the same foundations</p><h2>Progress by age</h2></div><span class="analytics-symbol" aria-hidden="true">↗</span></div>${cohorts.some(c=>c.count)?`<div class="age-cohort-grid">${cohorts.filter(c=>c.count).map(c=>`<button type="button" class="age-cohort" data-analytics-age="${esc(c.category.id)}" aria-pressed="${analyticsAge===c.category.id}"><span class="age-cohort-title"><strong>${esc(c.category.name)}</strong><small>${esc(c.category.range)} · ${c.count} ${c.count===1?'gymnast':'gymnasts'}</small></span><span class="age-cohort-metrics"><span><b>${number(c.average)}</b><small>avg points</small></span><span><b>${c.retained}%</b><small>retained</small></span><span><b>${c.perfect}%</b><small>perfect</small></span></span><span class="age-foundation"><span>Base progress <b>${c.foundation}%</b></span><i aria-hidden="true"><i style="width:${c.foundation}%"></i></i></span></button>`).join('')}</div>`:'<p class="v2-empty small">Age comparisons will appear when current-year age groups are available. Scores above still include everyone in All ages.</p>'}<p class="chart-note">Average points include skill points and completion bonuses. Retained and perfect rates use all ${data.skills.length} skills per gymnast. Base progress uses base skills, basic leaps and handstand holds: Achieved is halfway, Perfect is complete. This is a current snapshot, not an age target or historical trend.</p></section>`;
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
  function renderMomentum(people,counts) {
    const series=weeklySeries(people),max=Math.max(1,...series.values.map(Math.abs));
    const dateLabel=day=>chartDayFormat.format(new Date(day*DAY));
    const range=i=>`${dateLabel(series.end-(7-i)*7-6)}–${dateLabel(series.end-(7-i)*7)}`;
    const unit=series.tracked?'net league points':'latest retained gains';
    const total=series.values[7];
    return `<section class="analytics-panel momentum-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Eight seven-day windows</p><h2>Building momentum</h2></div><span class="analytics-symbol" aria-hidden="true">🔥</span></div><div class="momentum-total"><strong>${number(total)}</strong><span>${series.tracked?'net league points in the last 7 days':'latest retained gains in 7 days'}<br><b>${counts.onFire} on fire · ${counts.hot} hot</b></span></div><div class="momentum-chart" style="height:auto;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));align-items:start;gap:7px" role="img" aria-label="${esc((series.tracked?'Net league point history':'Retained skill gain dates')+', oldest to newest. '+series.values.map((n,i)=>range(i)+': '+(series.known[i]?number(n)+' '+unit:'not tracked')).join('; '))}">${series.values.map((n,i)=>`<div title="${esc(range(i)+': '+(series.known[i]?number(n)+' '+unit:'not tracked'))}" style="min-width:0;gap:6px"><strong style="min-height:14px;font-size:9px">${series.known[i]?number(n):'—'}</strong><span aria-hidden="true" style="height:104px;width:100%;display:grid;grid-template-rows:1fr 1fr;position:relative"><span style="position:absolute;inset:50% 0 auto;height:1px;background:#ffffff30"></span><i style="grid-row:${n<0?2:1};align-self:${n<0?'start':'end'};height:${series.known[i]&&n?Math.max(3,Math.abs(n)/max*49):0}px;background:${n<0?'linear-gradient(#db7184,#965765)':'linear-gradient(#ffcf83,#c9834d)'};border-radius:${n<0?'0 0 4px 4px':'4px 4px 0 0'}"></i></span><small style="font-size:8px;line-height:1.4;text-align:center">${i===7?'Last 7d':8-i+'w'}</small></div>`).join('')}</div><p class="chart-note">${series.tracked?'The chart includes all league points. Each bar is a seven-day window ending with the latest window today (London time). Positive points sit above zero; reductions sit below. Untracked weeks show —.': 'Point history is not available in this snapshot. These bars show only each currently retained skill’s latest gain date; they are not a historical point total.'}${series.tracked&&data.state.weeklyProgress.complete===false?' Tracking began partway through the first window, so earlier points are not included.':''} Heat uses a separate qualifying total. Basic Rolls never count. Other basics and basic leaps count only their Perfect increment (+10 per skill); handstand holds add +5 for Perfect. Their all-Perfect bonus adds +1; Achieved and mixed groups earn no completion bonus. Upgrades, pro upgrades and their completion bonuses count. Hot starts at 10 qualifying points in seven days; On fire starts at 15. Earned heat stays visible for seven days.</p></section>`;
  }
  function renderAnalytics() {
    if(!data)return;
    const groups=groupOptions();if(!['all','senior','overall'].includes(analyticsGroup)&&!groups.includes(analyticsGroup))analyticsGroup='all';
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
    const gHTML='<option value="all">All squads</option><option value="senior">All senior squad</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(groupName(g))}</option>`).join('')+'<option value="overall">Overall · all squads + coaches</option>';
    const pHTML='<option value="all">All gymnasts</option>'+candidates.slice().sort((a,b)=>a.name.localeCompare(b.name,'en-GB')).map(g=>`<option value="${esc(g.id)}">${esc(g.name)}${isCoach(g)?' · Coach':''}</option>`).join('');
    commitHTML(groupSelect,gHTML);commitHTML(personSelect,pHTML);
    groupSelect.value=analyticsGroup;personSelect.value=analyticsGymnast;
    const host=analytics.querySelector('#analyticsContent');if(!data.hasLoaded){commitHTML(host,'<p class="v2-empty" role="status">Loading your training picture…</p>');return;}
    const people=candidates.filter(g=>analyticsGymnast==='all'||g.id===analyticsGymnast),a=aggregate(people),c=a.counts;
    const achieved=c.achieved+c.perfect,perfectPercent=pct(c.perfect,a.total),achievedPercent=pct(c.achieved,a.total),scope=analyticsGymnast==='all'?(analyticsGroup==='all'?'All squads':analyticsGroup==='senior'?'All senior squad':analyticsGroup==='overall'?'Overall · all squads + coaches':groupName(analyticsGroup)):people[0]?.name;
    const cohortPeople=squadPeople.filter(g=>analyticsGymnast==='all'||g.id===analyticsGymnast);
    const maxH=Math.max(1,...a.horizon);
    commitHTML(host,`<p class="analytics-scope${analyticsGymnast!=='all'&&heatClass(analyticsGymnast)?' '+heatClass(analyticsGymnast):''}">${esc(scope)} ${analyticsGymnast!=='all'?coachBadge(people[0]):''} ${analyticsGymnast!=='all'?data.fireBadge(analyticsGymnast):''}<span>${analyticsAge!=='all'?'· '+esc(ageLabel(ageGroups().find(c=>c.id===analyticsAge)))+' ':''}· ${people.length} ${countNoun(analyticsGroup,people.length)}</span></p>
      <div class="analytics-stat-grid"><article><span>Retained skills</span><strong>${achieved}<small> / ${a.total}</small></strong><p>${pct(achieved,a.total)}% achieved or perfect</p></article><article><span>Perfect skills</span><strong>${c.perfect}<small> ✓✓</small></strong><p>${perfectPercent}% of all skills</p></article><article class="stat-renew"><span>Due within 7 days</span><strong>${c.due}<small> ↻</small></strong><p>Revisit these to keep Perfect</p></article><article><span>League points</span><strong>${number(c.points)}</strong><p>Skills and completion bonuses</p></article></div>
      <div class="analytics-grid">${renderAgePanels(cohortPeople)}<section class="analytics-panel mastery-panel"><div class="analytics-panel-head"><div><p class="eyebrow">The complete picture</p><h2>Skill mix</h2></div><span class="analytics-symbol">◉</span></div><div class="mastery-layout"><div class="mastery-donut" style="--perfect:${perfectPercent}%;--retained:${perfectPercent+achievedPercent}%" role="img" aria-label="${c.perfect} perfect, ${c.achieved} achieved and ${c.unticked} unticked skills"><div><strong>${pct(achieved,a.total)}<small>%</small></strong><span>retained</span></div></div><ul class="chart-key"><li><i class="key-perfect"></i>Perfect<strong>${c.perfect}</strong></li><li><i class="key-achieved"></i>Achieved<strong>${c.achieved}</strong></li><li><i></i>Unticked<strong>${c.unticked}</strong></li></ul></div></section>
      <section class="analytics-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Build from the basics</p><h2>Across the skills</h2></div><span class="analytics-symbol">↗</span></div><div class="category-bars">${a.categories.map(cat=>`<div><div class="bar-label"><strong>${esc(cat.name)}</strong><span>${cat.achieved}/${cat.total} retained</span></div><div class="stacked-bar" role="img" aria-label="${esc(cat.name)}: ${cat.perfect} perfect, ${cat.achieved-cat.perfect} achieved, ${cat.total-cat.achieved} unticked"><i style="width:${pct(cat.perfect,cat.total)}%;background:#d5fa70"></i><i style="width:${pct(cat.achieved-cat.perfect,cat.total)}%;background:#bd9bff"></i></div></div>`).join('')}</div><p class="chart-note">Purple is Achieved. Mint is Perfect. Each skill counts once here, regardless of its points.</p></section>
      <section class="analytics-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Keep the good work fresh</p><h2>Renewal horizon</h2></div><span class="analytics-symbol">↻</span></div><div class="column-chart" role="img" aria-label="Renewals: ${a.horizon.map((n,i)=>n+' in '+['0 to 7','8 to 14','15 to 21','22 to 30'][i]+' days').join(', ')}">${a.horizon.map((n,i)=>`<div class="chart-column ${i===0?'is-due':''}"><strong>${n}</strong><div class="chart-track"><i style="height:${n?Math.max(4,n/maxH*100):0}%"></i></div><span>${['0–7','8–14','15–21','22–30'][i]}<small>days</small></span></div>`).join('')}</div><p class="chart-note">Only Perfect marks have a timer. Renewing keeps Perfect for a fresh 30 days. When it expires, the mark becomes Achieved. Achieved stays until unticked.</p></section>
      ${renderMomentum(people,c)}
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">A fair view of every squad</p><h2>Squad foundations</h2></div><span class="analytics-symbol">≋</span></div><div class="squad-comparison">${comparisonGroups.map(group=>{const gs=data.gymnasts.filter(g=>groupKey(g.coach)===group&&(analyticsAge==='all'||ageOf(g)===analyticsAge)),ga=aggregate(gs),retained=ga.counts.achieved+ga.counts.perfect;return `<button data-analytics-group="${esc(group)}"><span class="squad-comparison-name"><strong>${esc(groupName(group))}</strong><small>${gs.length} ${countNoun(group,gs.length)} · ${number(gs.length?ga.counts.points/gs.length:0)} average points</small></span><span class="comparison-track"><i style="width:${pct(retained,ga.total)}%"></i></span><b>${pct(retained,ga.total)}%<small>retained ↗</small></b></button>`;}).join('')}</div><p class="chart-note">Percentages make different squad sizes easier to compare. Select a squad to explore it above.</p></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">Every small step adds up</p><h2>Squad skill map</h2></div><span class="map-key">○ Unticked · <b>● Achieved</b> · <em>● Perfect</em> · <strong>● Due</strong></span></div><div id="analyticsSkillMap" class="skill-map-scroll" tabindex="0" role="region" aria-label="Skill map, scroll horizontally if needed"><table class="skill-map"><thead><tr><th>Gymnast</th>${data.skills.map((k,i)=>`<th title="${esc(k.name)}">${i+1}</th>`).join('')}</tr></thead><tbody>${people.map(g=>`<tr><th><button class="${heatClass(g.id)}" data-gymnast="${esc(g.id)}" data-v2-focus="map">${esc(g.name)} ${coachBadge(g)} ${data.fireBadge(g.id)}</button></th>${data.skills.map(k=>{const l=data.mark(g.id,k.id),due=data.skillFreshness(g.id,k.id).due;return `<td><span class="map-dot level-${l}${due?' due':''}" data-map-gymnast="${esc(g.id)}" data-map-skill="${esc(k.id)}" tabindex="0" title="${esc(k.name)} · ${['Unticked','Achieved','Perfect'][l]}${due?' · renewal due':''}" aria-label="${esc(k.name)}: ${['Unticked','Achieved','Perfect'][l]}${due?', renewal due':''}"></span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div><details class="map-legend"><summary>Show the skill key</summary><ol>${data.skills.map(k=>`<li>${esc(k.name)}</li>`).join('')}</ol></details></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">The next useful practice</p><h2>Ready to revisit</h2></div><span class="analytics-symbol">◎</span></div>${a.duePeople.length?`<div class="revisit-grid">${a.duePeople.sort((x,y)=>y.due-x.due).map(({g,due})=>`<button class="${heatClass(g.id)}" data-gymnast="${esc(g.id)}" data-v2-focus="revisit"><strong>${esc(g.name)} ${coachBadge(g)} ${data.fireBadge(g.id)}</strong><span>${due} ${due===1?'skill':'skills'} due ↗</span></button>`).join('')}</div>`:'<p class="v2-empty small">No renewals due in this view. Keep building those foundations.</p>'}</section></div>`);
  }
  function resetAnalytics() {analyticsGroup='all';analyticsGymnast='all';analyticsAge='all';}
  function selectGymnast(id) {analyticsGroup=isCoach(data?.gymnasts.find(g=>g.id===id))?'coaches':'all';analyticsAge='all';analyticsGymnast=id;}
  function showGymnastInDirectory(id) {
    const gymnast=data?.gymnasts.find(g=>g.id===id);if(!gymnast)return;
    if(!inGroup(gymnast,directoryGroup))directoryGroup=isCoach(gymnast)?'coaches':'all';
  }
  window.SWLV2=Object.freeze({mount,render,selectGymnast,resetAnalytics,showGymnastInDirectory});
})();
