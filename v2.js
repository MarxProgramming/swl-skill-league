(() => {
  'use strict';
  const DAY=86400000, esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let directory,analytics,actions,data,directoryGroup='all',analyticsGroup='all',analyticsGymnast='all';
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const number=n=>Number(n||0).toLocaleString('en-GB',{maximumFractionDigits:1});
  const initials=name=>name.trim().split(/\s+/).filter((_,i,a)=>i===0||i===a.length-1).map(s=>Array.from(s)[0]).join('');
  function groupOptions() {return [...new Set(data.gymnasts.map(g=>g.coach))];}
  function focusKey(root) {const e=document.activeElement;return e&&root.contains(e)?{id:e.id,group:e.dataset.directoryGroup,selection:e.selectionStart}:null;}
  function restore(root,key) {if(!key)return;const el=key.id?root.querySelector('#'+key.id):[...root.querySelectorAll('[data-directory-group]')].find(e=>e.dataset.directoryGroup===key.group);el?.focus({preventScroll:true});if(typeof key.selection==='number')try{el.setSelectionRange(key.selection,key.selection);}catch(_){}}
  function mount(config) {
    if(directory)return;actions=config;directory=config.directory;analytics=config.analytics;
    directory.innerHTML=`<div class="v2-page-head"><div><p class="eyebrow">Every squad. Every gymnast.</p><h1>Find your gymnast</h1><p>A quick route from a name to their next skill.</p></div><button class="insights-button" data-view="analytics">◈ Analytics ↗</button></div><div class="directory-tools"><label class="directory-search" for="directorySearch"><span aria-hidden="true">⌕</span><input id="directorySearch" type="search" aria-label="Search gymnasts" placeholder="Search any gymnast…" autocomplete="off"></label><div id="directoryGroups" class="directory-groups" role="group" aria-label="Filter gymnast directory by squad"></div></div><div id="directoryResults"></div>`;
    directory.querySelector('#directorySearch').addEventListener('input',renderDirectory);
    directory.addEventListener('click',e=>{const b=e.target.closest('[data-directory-group]');if(b){directoryGroup=b.dataset.directoryGroup;renderDirectory();}});
    analytics.innerHTML=`<div class="v2-page-head analytics-heading"><div><p class="eyebrow">SWL Squad Training · 2.0</p><h1>Progress, in focus.</h1><p>Strong foundations. Fresh skills. Momentum you can see.</p></div><button class="quiet" data-view="dashboard">← Leaderboards</button></div><div class="analytics-filters"><label>Squad<select id="analyticsGroup"></select></label><label>Gymnast<select id="analyticsGymnast"></select></label><p>Live from your skill records<br><span>Scores use the same league rules.</span></p></div><div id="analyticsContent"></div>`;
    analytics.querySelector('#analyticsGroup').addEventListener('change',e=>{analyticsGroup=e.target.value;analyticsGymnast='all';renderAnalytics();});
    analytics.querySelector('#analyticsGymnast').addEventListener('change',e=>{analyticsGymnast=e.target.value;renderAnalytics();});
    analytics.addEventListener('click',e=>{const b=e.target.closest('[data-analytics-group]');if(b){analyticsGroup=b.dataset.analyticsGroup;analyticsGymnast='all';renderAnalytics();analytics.scrollIntoView({behavior:'instant',block:'start'});}});
  }
  function render(next) {data=next;if(!directory)return;renderDirectory();renderAnalytics();}
  function renderDirectory() {
    if(!data)return;const key=focusKey(directory),groups=groupOptions();
    if(directoryGroup!=='all'&&!groups.includes(directoryGroup))directoryGroup='all';
    directory.querySelector('#directoryGroups').innerHTML=[['all','All squads'],...groups.map(g=>[g,data.shortGroupLabel(g)])].map(([id,name])=>`<button type="button" data-directory-group="${esc(id)}" aria-pressed="${id===directoryGroup}">${esc(name)}</button>`).join('');
    const query=directory.querySelector('#directorySearch').value.trim().toLocaleLowerCase('en-GB');
    const people=data.gymnasts.filter(g=>(directoryGroup==='all'||g.coach===directoryGroup)&&(g.name+' '+data.groupLabel(g.coach)).toLocaleLowerCase('en-GB').includes(query));
    directory.querySelector('#directoryResults').innerHTML=!data.hasLoaded?'<p class="v2-empty" role="status">Loading your squads…</p>':people.length?groups.map(group=>{
      const gymnasts=people.filter(g=>g.coach===group).sort((a,b)=>a.name.localeCompare(b.name,'en-GB'));if(!gymnasts.length)return'';
      return `<section class="directory-section"><div class="directory-section-head"><h2>${esc(data.groupLabel(group))}</h2><span>${gymnasts.length} ${gymnasts.length===1?'gymnast':'gymnasts'}</span></div><div class="directory-grid">${gymnasts.map(g=>{const s=data.summary(g.id),due=data.skills.filter(k=>data.skillFreshness(g.id,k.id).due).length;return `<button class="directory-card${data.fireCount(g.id)>=3?' is-on-fire':''}" data-gymnast="${esc(g.id)}" aria-label="Open skills for ${esc(g.name)}"><span class="directory-avatar" aria-hidden="true">${esc(initials(g.name))}</span><span class="directory-person"><strong>${esc(g.name)}</strong>${data.fireBadge(g.id)}<small>${s.achieved}/${data.skills.length} skills · ${s.perfect} perfect</small>${due?`<span class="due-badge">${due} due for renewal</span>`:''}</span><span class="directory-points"><b>${number(s.points)}</b><small>pts ↗</small></span></button>`;}).join('')}</div></section>`;
    }).join(''):'<p class="v2-empty" role="status">No matching gymnasts. Try another name or squad.</p>';
    restore(directory,key);
  }
  function aggregate(people,at=Date.now()) {
    const counts={unticked:0,achieved:0,perfect:0,points:0,due:0,gains:0,onFire:0};
    const horizon=[0,0,0,0],momentum=Array(7).fill(0);
    const categories=data.categories.map(c=>({...c,total:0,achieved:0,perfect:0}));
    const duePeople=[];
    people.forEach(g=>{
      counts.points+=data.summary(g.id).points;let due=0;
      if(data.fireCount(g.id,at)>=3)counts.onFire++;
      data.skills.forEach(skill=>{
        const level=data.mark(g.id,skill.id),fresh=data.skillFreshness(g.id,skill.id,at),cat=categories.find(c=>c.id===skill.category);cat.total++;
        counts[['unticked','achieved','perfect'][level]]++;if(level)cat.achieved++;if(level===2)cat.perfect++;
        if(fresh.due){counts.due++;due++;}
        if(level&&fresh.days!==null)horizon[Math.min(3,Math.max(0,Math.ceil(fresh.days/7)-1))]++;
        const earned=Date.parse(data.state.skillDates?.[g.id]?.[skill.id]?.earnedAt||'');
        if(level&&Number.isFinite(earned)&&earned<=at&&earned>at-7*DAY){counts.gains++;momentum[Math.max(0,Math.min(6,6-Math.floor((at-earned)/DAY)))]++;}
      });if(due)duePeople.push({g,due});
    });
    return {counts,horizon,momentum,categories,duePeople,total:people.length*data.skills.length};
  }
  function renderAnalytics() {
    if(!data)return;
    const groups=groupOptions();if(analyticsGroup!=='all'&&!groups.includes(analyticsGroup))analyticsGroup='all';
    const candidates=data.gymnasts.filter(g=>analyticsGroup==='all'||g.coach===analyticsGroup);
    if(analyticsGymnast!=='all'&&!candidates.some(g=>g.id===analyticsGymnast))analyticsGymnast='all';
    const groupSelect=analytics.querySelector('#analyticsGroup'),personSelect=analytics.querySelector('#analyticsGymnast');
    const gHTML='<option value="all">All squads</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(data.groupLabel(g))}</option>`).join('');
    const pHTML='<option value="all">All gymnasts</option>'+candidates.slice().sort((a,b)=>a.name.localeCompare(b.name,'en-GB')).map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');
    if(groupSelect.innerHTML!==gHTML)groupSelect.innerHTML=gHTML;if(personSelect.innerHTML!==pHTML)personSelect.innerHTML=pHTML;
    groupSelect.value=analyticsGroup;personSelect.value=analyticsGymnast;
    const host=analytics.querySelector('#analyticsContent');if(!data.hasLoaded){host.innerHTML='<p class="v2-empty" role="status">Loading your training picture…</p>';return;}
    const people=candidates.filter(g=>analyticsGymnast==='all'||g.id===analyticsGymnast),a=aggregate(people),c=a.counts;
    const achieved=c.achieved+c.perfect,perfectPercent=pct(c.perfect,a.total),achievedPercent=pct(c.achieved,a.total),scope=analyticsGymnast==='all'?(analyticsGroup==='all'?'All squads':data.groupLabel(analyticsGroup)):people[0]?.name;
    const maxH=Math.max(1,...a.horizon),maxM=Math.max(1,...a.momentum);
    host.innerHTML=`<p class="analytics-scope">${esc(scope)} <span>· ${people.length} ${people.length===1?'gymnast':'gymnasts'}</span></p>
      <div class="analytics-stat-grid"><article><span>Retained skills</span><strong>${achieved}<small> / ${a.total}</small></strong><p>${pct(achieved,a.total)}% achieved or perfect</p></article><article><span>Perfect skills</span><strong>${c.perfect}<small> ✦</small></strong><p>${perfectPercent}% of all skills</p></article><article class="stat-renew"><span>Due within 7 days</span><strong>${c.due}<small> ↻</small></strong><p>Revisit these to keep the level</p></article><article><span>League points</span><strong>${number(c.points)}</strong><p>Skills, linking and completion bonuses</p></article></div>
      <div class="analytics-grid"><section class="analytics-panel mastery-panel"><div class="analytics-panel-head"><div><p class="eyebrow">The complete picture</p><h2>Skill mix</h2></div><span class="analytics-symbol">◉</span></div><div class="mastery-layout"><div class="mastery-donut" style="--perfect:${perfectPercent}%;--retained:${perfectPercent+achievedPercent}%" role="img" aria-label="${c.perfect} perfect, ${c.achieved} achieved and ${c.unticked} unticked skills"><div><strong>${pct(achieved,a.total)}<small>%</small></strong><span>retained</span></div></div><ul class="chart-key"><li><i class="key-perfect"></i>Perfect<strong>${c.perfect}</strong></li><li><i class="key-achieved"></i>Achieved<strong>${c.achieved}</strong></li><li><i></i>Unticked<strong>${c.unticked}</strong></li></ul></div></section>
      <section class="analytics-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Build from the basics</p><h2>Across the skills</h2></div><span class="analytics-symbol">↗</span></div><div class="category-bars">${a.categories.map(cat=>`<div><div class="bar-label"><strong>${esc(cat.name)}</strong><span>${cat.achieved}/${cat.total} retained</span></div><div class="stacked-bar" role="img" aria-label="${esc(cat.name)}: ${cat.perfect} perfect, ${cat.achieved-cat.perfect} achieved, ${cat.total-cat.achieved} unticked"><i style="width:${pct(cat.perfect,cat.total)}%;background:#bd9bff"></i><i style="width:${pct(cat.achieved-cat.perfect,cat.total)}%;background:#d5fa70"></i></div></div>`).join('')}</div><p class="chart-note">Purple is Perfect. Mint is Achieved. Each skill counts once here, regardless of its points.</p></section>
      <section class="analytics-panel"><div class="analytics-panel-head"><div><p class="eyebrow">Keep the good work fresh</p><h2>Renewal horizon</h2></div><span class="analytics-symbol">↻</span></div><div class="column-chart" role="img" aria-label="Renewals: ${a.horizon.map((n,i)=>n+' in '+['0 to 7','8 to 14','15 to 21','22 to 30'][i]+' days').join(', ')}">${a.horizon.map((n,i)=>`<div class="chart-column ${i===0?'is-due':''}"><strong>${n}</strong><div class="chart-track"><i style="height:${n?Math.max(4,n/maxH*100):0}%"></i></div><span>${['0–7','8–14','15–21','22–30'][i]}<small>days</small></span></div>`).join('')}</div><p class="chart-note">Only achieved and perfect skills have a timer. Renewing keeps the level and starts a fresh 30 days.</p></section>
      <section class="analytics-panel momentum-panel"><div class="analytics-panel-head"><div><p class="eyebrow">The last seven days</p><h2>Building momentum</h2></div><span class="analytics-symbol">🔥</span></div><div class="momentum-total"><strong>${c.gains}</strong><span>different skills gained<br><b>${c.onFire} ${c.onFire===1?'gymnast':'gymnasts'} on fire</b></span></div><div class="momentum-chart" role="img" aria-label="Latest skill gains by age, oldest to newest: ${a.momentum.join(', ')}">${a.momentum.map((n,i)=>`<div title="${i===6?'Past 24 hours':(6-i)+'–'+(7-i)+' days ago'}: ${n} latest skill gains"><strong>${n}</strong><i style="height:${n?Math.max(6,n/maxM*85):2}px"></i><small>${i===6?'Today':6-i+'d'}</small></div>`).join('')}</div><p class="chart-note">Each currently retained skill appears on its latest gain date. Renewals do not count. Tracking begins with version 2.0.</p></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">A fair view of every squad</p><h2>Squad foundations</h2></div><span class="analytics-symbol">≋</span></div><div class="squad-comparison">${groups.map(group=>{const gs=data.gymnasts.filter(g=>g.coach===group),ga=aggregate(gs),retained=ga.counts.achieved+ga.counts.perfect;return `<button data-analytics-group="${esc(group)}"><span class="squad-comparison-name"><strong>${esc(data.groupLabel(group))}</strong><small>${gs.length} gymnasts · ${number(ga.counts.points/gs.length)} average points</small></span><span class="comparison-track"><i style="width:${pct(retained,ga.total)}%"></i></span><b>${pct(retained,ga.total)}%<small>retained ↗</small></b></button>`;}).join('')}</div><p class="chart-note">Percentages make different squad sizes easier to compare. Select a squad to explore it above.</p></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">Every small step adds up</p><h2>Squad skill map</h2></div><span class="map-key">○ Unticked · <b>● Achieved</b> · <em>● Perfect</em> · <strong>● Due</strong></span></div><div class="skill-map-scroll" tabindex="0" role="region" aria-label="Skill map, scroll horizontally if needed"><table class="skill-map"><thead><tr><th>Gymnast</th>${data.skills.map((k,i)=>`<th title="${esc(k.name)}">${i+1}</th>`).join('')}</tr></thead><tbody>${people.map(g=>`<tr><th><button data-gymnast="${esc(g.id)}">${esc(g.name)} ${data.fireBadge(g.id)}</button></th>${data.skills.map(k=>{const l=data.mark(g.id,k.id),due=data.skillFreshness(g.id,k.id).due;return `<td><span class="map-dot level-${l}${due?' due':''}" tabindex="0" title="${esc(k.name)} · ${['Unticked','Achieved','Perfect'][l]}${due?' · renewal due':''}" aria-label="${esc(k.name)}: ${['Unticked','Achieved','Perfect'][l]}${due?', renewal due':''}"></span></td>`;}).join('')}</tr>`).join('')}</tbody></table></div><details class="map-legend"><summary>Show the skill key</summary><ol>${data.skills.map(k=>`<li>${esc(k.name)}</li>`).join('')}</ol></details></section>
      <section class="analytics-panel analytics-wide"><div class="analytics-panel-head"><div><p class="eyebrow">The next useful practice</p><h2>Ready to revisit</h2></div><span class="analytics-symbol">◎</span></div>${a.duePeople.length?`<div class="revisit-grid">${a.duePeople.sort((x,y)=>y.due-x.due).map(({g,due})=>`<button data-gymnast="${esc(g.id)}"><strong>${esc(g.name)} ${data.fireBadge(g.id)}</strong><span>${due} ${due===1?'skill':'skills'} due ↗</span></button>`).join('')}</div>`:'<p class="v2-empty small">No renewals due in this view. Keep building those foundations.</p>'}</section></div>`;
  }
  function resetAnalytics() {analyticsGroup='all';analyticsGymnast='all';}
  function selectGymnast(id) {analyticsGroup='all';analyticsGymnast=id;}
  window.SWLV2=Object.freeze({mount,render,selectGymnast,resetAnalytics});
})();
