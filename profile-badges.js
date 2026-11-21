/* A personal, read-only view of the progressive badge collection. */
(() => {
  'use strict';
  const sightings = new WeakMap();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isCoach = gymnast => [gymnast?.coach,...(Array.isArray(gymnast?.squads) ? gymnast.squads : [])].some(value => String(value || '').trim().toLowerCase() === 'coaches');
  const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  const dateLabel = value => new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}).format(new Date(value));
  const legacyReceipt = {'floor-pro-achieved':'floor-achieved','floor-pro-perfect':'floor-perfect'};
  const categoryNames = {rolls:'Rolls',acro:'Acro & spins',leaps:'Leaps',vault:'Vault'};
  const tierNames = {base:'Basics',upgrade:'Upgrades',pro:'Pro',run:'Run & hurdle',vaults:'Vaults'};
  const chevron = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m5.5 7.75 4.5 4.5 4.5-4.5"/></svg>';

  function earnedAt(gymnast, receipts, id) {
    if (!gymnast?.id || !receipts || typeof receipts !== 'object' || !Object.hasOwn(receipts,gymnast.id)) return null;
    const awards = receipts[gymnast.id];
    if (!awards || typeof awards !== 'object' || Array.isArray(awards)) return null;
    return [id,legacyReceipt[id]].filter(Boolean).filter(key => Object.hasOwn(awards,key)).map(key => awards[key]).filter(validDate).sort()[0] || null;
  }

  function markReader(config) {
    if (typeof config.mark === 'function') return config.mark;
    if (typeof config.marks === 'function') return config.marks;
    const marks = config.marks || config.state?.marks || {};
    return (gymnastID, skillID) => {
      const row = Object.hasOwn(marks,gymnastID) && marks[gymnastID] && typeof marks[gymnastID] === 'object' ? marks[gymnastID] : marks;
      return Object.hasOwn(row,skillID) ? row[skillID] : 0;
    };
  }

  function build(config = {}) {
    const gymnast = config.gymnast;
    const loaded = config.hasLoaded !== false;
    const excluded = isCoach(gymnast) || !!(gymnast && config.isCoachParticipant?.(gymnast));
    const result = {gymnast,loaded,excluded,pending:!!config.pending,badges:[],earnedCount:0};
    if (!gymnast?.id || excluded || !window.SWLChallenge?.buildCompletion) return result;
    const receipts = config.completionAchievements || config.state?.completionAchievements;
    const mark = markReader(config);
    const expiredPerfect = config.expiredPerfect || config.state?.expiredPerfect || {};
    for (const definition of window.SWLChallenge.definitions) {
      const completion = window.SWLChallenge.buildCompletion({gymnasts:[gymnast],skills:config.skills || [],mark,hasLoaded:loaded},definition.id);
      const row = completion?.rows?.[0];
      if (!row) continue;
      const savedAt = earnedAt(gymnast,receipts,definition.id);
      const threshold = definition.status === 'perfect' ? 2 : 1;
      result.badges.push({definition,...row,skillMarks:row.skillMarks.map(item=>({...item,previouslyPerfect:item.level<2&&!!expiredPerfect[gymnast.id]?.[item.skill.id]})),earnedAt:savedAt,earned:!!savedAt,isNew:!!savedAt && config.newAwards?.[definition.id] === savedAt,needed:row.skillMarks.filter(item => item.level < threshold)});
    }
    result.earnedCount = result.badges.filter(badge => badge.earned).length;
    return result;
  }

  function requirements(badge, gymnast) {
    const {definition} = badge;
    const key = `${gymnast.id}:${definition.id}`;
    const perfect = definition.status === 'perfect';
    const groups = new Map();
    const target = perfect ? 2 : 1;
    const ordered = [...badge.skillMarks].sort((a,b)=>Number(a.level>=target)-Number(b.level>=target));
    for (const item of ordered) {
      const group = `${item.level>=target}:${item.skill.category}:${item.skill.tier}`;
      if (!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(item);
    }
    const action = badge.remaining ? `${badge.remaining} ${badge.remaining === 1 ? 'skill' : 'skills'} to ${perfect ? 'perfect' : 'achieve'}` : 'View all skills';
    return `<details class="pb-requirements" data-profile-badge-details="${esc(key)}"><summary data-profile-badge-toggle="${esc(key)}"><span>${action}</span><span class="pb-chevron">${chevron}</span></summary><div class="pb-requirement-content"><p class="pb-requirement-rule">${perfect ? 'Every skill below needs two ticks.' : 'One or two ticks on every skill below.'}${badge.earned ? ' Your earned badge stays in your collection.' : ''}</p>${Array.from(groups.values()).map(items => `<section class="pb-skill-group"><h4>${categoryNames[items[0].skill.category] || esc(items[0].skill.category)} <span>· ${tierNames[items[0].skill.tier] || esc(items[0].skill.tier)}</span></h4><ul>${items.map(({skill,level,previouslyPerfect}) => `<li class="pb-skill is-${level === 2 ? 'perfect' : level === 1 ? 'achieved' : 'unachieved'}${level >= (perfect ? 2 : 1) ? ' meets-requirement' : ' needs-work'}"><span class="pb-skill-mark" aria-label="${level === 2 ? 'Perfect' : level === 1 ? 'Achieved' : 'Not achieved'}">${level === 2 ? '✓✓' : level === 1 ? '✓' : '—'}</span><button type="button" class="pb-skill-name coach-skill-link" data-badge-skill="${esc(skill.id)}">${esc(skill.name)}${previouslyPerfect?'<span class="pb-previous-perfect">Previously Perfect</span>':''}</button>${level < (perfect ? 2 : 1) ? `<small>${level === 1 ? 'Perfect next' : 'Achieve'+(perfect ? ' + perfect' : '')}</small>` : ''}</li>`).join('')}</ul></section>`).join('')}</div></details>`;
  }

  function badgeCard(badge, model) {
    const {definition} = badge;
    const perfect = definition.status === 'perfect';
    const floor = definition.apparatus === 'floor';
    const collection = floor ? ({basics:'Foundations',upgrades:'Upgrades',pro:'Complete Floor'}[definition.level] || 'Floor') : 'Complete Vault';
    const title = `${perfect ? 'Perfect' : 'Achieved'} ${collection}`;
    const scope = floor ? ({basics:'Basic Rolls, Acro & Leaps',upgrades:'Basics + upgrades',pro:'Basics + upgrades + Pro'}[definition.level]) : 'Run, hurdle & vaults';
    const artwork = window.SWLAchievements?.challengeIcon?.(definition.id) || `<span class="pb-icon-fallback">${floor ? 'F' : 'V'}</span>`;
    const state = badge.isNew ? '<span class="pb-new-label" aria-label="Newly earned badge">New</span>' : badge.earned ? `<span class="pb-earned"><span aria-hidden="true">✓</span> Earned</span>` : badge.complete ? '<span class="pb-pending">Confirming…</span>' : `<span class="pb-progress-label">${badge.completed}<small> / ${badge.maximum}</small></span>`;
    const caption = badge.earned ? `Earned <time datetime="${esc(badge.earnedAt)}">${dateLabel(badge.earnedAt)}</time>` : badge.complete ? (model.pending ? 'Saving this achievement' : 'Waiting for saved confirmation') : `${badge.completed} of ${badge.maximum} ${perfect ? 'Perfect' : 'achieved'}`;
    return `<article class="pb-card is-${definition.status}${badge.earned ? ' is-earned' : ''}${badge.isNew ? ' is-new' : ''}" data-profile-badge="${definition.id}" data-badge-stage="${definition.level || 'vault'}"><div class="pb-card-head"><span class="pb-art" aria-hidden="true">${artwork}</span><div class="pb-card-title"><h3>${title}</h3></div>${state}</div><p class="pb-scope">${scope}</p><div class="pb-progress" role="progressbar" aria-label="${esc(title+': current marks')}" aria-valuemin="0" aria-valuemax="${badge.maximum || 1}" aria-valuenow="${badge.completed}" aria-valuetext="${badge.completed} of ${badge.maximum} ${perfect ? 'Perfect' : 'achieved'}${badge.earned ? '. Badge already earned.' : ''}"><span style="width:${badge.progress}%"></span></div><p class="pb-caption">${caption}${badge.earned ? `<span class="pb-current-marks">Current marks ${badge.completed}/${badge.maximum}</span>` : ''}</p>${badge.earned&&!badge.complete?'<p class="pb-earned-note">Badge earned and kept. The bar shows your current marks.</p>':''}${requirements(badge,model.gymnast)}</article>`;
  }

  function capture(host) {
    if (!host) return {open:[],focusKey:null};
    const active = document.activeElement;
    return {
      open:Array.from(host.querySelectorAll('details[data-profile-badge-details][open]')).map(item => item.dataset.profileBadgeDetails),
      focusKey:host.contains(active) ? active?.dataset?.profileBadgeToggle || null : null
    };
  }

  function restore(host, state = {}) {
    if (!host) return;
    const open = new Set(state.open || []);
    for (const details of host.querySelectorAll('details[data-profile-badge-details]')) if (open.has(details.dataset.profileBadgeDetails)) details.open = true;
    if (state.focusKey && document.activeElement === document.body) Array.from(host.querySelectorAll('[data-profile-badge-toggle]')).find(item => item.dataset.profileBadgeToggle === state.focusKey)?.focus({preventScroll:true});
  }

  function replace(host, html) {
    if (host._swlProfileBadgeHTML === html) return;
    const state = capture(host);
    host.innerHTML = html;
    host._swlProfileBadgeHTML = html;
    restore(host,state);
  }

  function watchVisible(host,config){
    const Observer=window.IntersectionObserver;
    if(typeof Observer!=='function'||typeof config.onBadgeSeen!=='function')return;
    let sight=sightings.get(host);
    if(!sight){
      sight={config:null,observer:null,entries:new Map(),timers:new Map(),seen:new Set()};
      const eligible=card=>{
        if(!card?.isConnected||document.hidden||card.closest?.('[hidden]')||sight.config?.visible===false)return false;
        const box=card.getBoundingClientRect(),header=document.querySelector?.('header, [role="banner"]');
        const top=Math.max(0,header?.getBoundingClientRect().bottom||0),bottom=window.innerHeight||document.documentElement?.clientHeight||0;
        const width=window.innerWidth||document.documentElement?.clientWidth||0;
        const visibleHeight=Math.max(0,Math.min(box.bottom,bottom-70)-Math.max(box.top,top));
        const visibleWidth=Math.max(0,Math.min(box.right,width)-Math.max(box.left,0));
        return box.width>0&&box.height>0&&visibleWidth*visibleHeight/(box.width*box.height)>=.5;
      };
      sight.observer=new Observer(entries=>{
        for(const entry of entries){
          const card=entry.target,key=sight.entries.get(card);
          if(!key)continue;
          if(!card.isConnected){clearTimeout(sight.timers.get(card));sight.timers.delete(card);sight.entries.delete(card);sight.observer.unobserve(card);continue;}
          if(!entry.isIntersecting||entry.intersectionRatio<.5){clearTimeout(sight.timers.get(card));sight.timers.delete(card);continue;}
          if(sight.seen.has(key)||sight.timers.has(card))continue;
          sight.timers.set(card,setTimeout(()=>{
            sight.timers.delete(card);
            if(sight.entries.get(card)!==key||!eligible(card))return;
            sight.seen.add(key);sight.observer.unobserve(card);
            sight.config.onBadgeSeen(card.dataset.profileBadge);
          },650));
        }
      },{threshold:[0,.5],rootMargin:'-80px 0px -70px 0px'});
      sightings.set(host,sight);
    }
    sight.config=config;
    for(const [card] of sight.entries)if(!card.isConnected||!host.contains(card)){
      clearTimeout(sight.timers.get(card));sight.timers.delete(card);sight.observer.unobserve(card);sight.entries.delete(card);
    }
    for(const card of host.querySelectorAll('.pb-card.is-new[data-profile-badge]')){
      const id=card.dataset.profileBadge,at=config.newAwards?.[id];
      const key=config.gymnast?.id+':'+id+':'+at;
      if(!at||sight.seen.has(key)||sight.entries.get(card)===key)continue;
      sight.entries.set(card,key);sight.observer.observe(card);
    }
  }
  const splitSeries='Dance series including a split element';
  const mixedSeries='Connect a dance element and an acrobatic element';
  const regionalLevels=[
    {level:8,colour:'#c4adff',range:'A–C · up to four C elements · no saltos',checks:[
      'Connect two acrobatic elements',splitSeries,mixedSeries,'Perform a B spin']},
    {level:7,colour:'#8cd9ef',range:'A–C · full floor with music',checks:[
      'Show a backward flighted acro line of at least two elements',splitSeries,mixedSeries,'Perform a C spin']},
    {level:6,colour:'#eeb2a8',range:'A–D · up to two D elements · full floor with music',checks:[
      'Connect three backward acro elements including a somersault',splitSeries,'Perform forward flighted acro valued B or higher','Perform a C spin or higher']}
  ];
  const regionalGuide='https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-Regional-Pathway-Handbook-Information-04.02-2_compressed.pdf';
  const routineCheck='Review the full routine and its eight counting skills';
  function reviewKey(id,level,i){return 'swl-regional-floor-2026:'+id+':'+level+':'+i;}
  function observed(id,level,i){try{return localStorage.getItem(reviewKey(id,level,i))==='1';}catch{return false;}}
  function reviewEditable(){
    const lock=document.getElementById?.('lockButton');
    return lock?.dataset.locked==='false'&&!lock.disabled&&!document.body.classList.contains('scoring-locked');
  }
  function crest(level,earned){
    return `<svg class="regional-crest" viewBox="0 0 80 86" aria-hidden="true"><path fill="currentColor" opacity=".14" d="M40 3 71 16v28Q71 64 40 82 9 64 9 44V16Z"/><g fill="none" stroke="currentColor"><path stroke-width="2" d="M40 5 69 17v26q0 20-29 36Q11 63 11 43V17Z"/><path opacity=".45" d="m40 11 23 10v23q0 15-23 29-23-14-23-29V21Z"/><path d="m26 24 14-5 14 5M32 62l8 5 8-5"/></g><text x="40" y="54" text-anchor="middle" font-size="32" font-weight="800" fill="currentColor">${level}</text></svg>`;
  }
  function regionalCard(config) {
    const id=config.gymnast.id,mark=markReader(config);
    const unlocked=reviewEditable();
    const levels=regionalLevels.map(l=>({...l,items:[...l.checks,routineCheck],count:Array.from({length:5},(_,i)=>Number(observed(id,l.level,i))).reduce((a,b)=>a+b,0)}));
    const highest=levels.filter(l=>l.count===5).pop();
    return `<section class="regional-award" aria-label="Regional floor readiness"><div class="regional-head"><div style="color:${highest?.colour||'#b5a1db'}">${crest(highest?.level||'F',!!highest)}</div><div><small>SWL AWARDS · REGIONAL 2026</small><h2>${highest?'Level '+highest.level+' floor ready':'Floor readiness'}</h2><p>${highest?'Routine confirmed by a coach':'Coach assessment · Levels 8, 7 and 6'}</p></div></div><div class="regional-levels">${levels.map(l=>{
      const spinId=l.level===8?'acro-base-full-spin':'acro-upgrade-1';
      const logged=mark(id,spinId)>0?(l.level===8?'Full spin':'1½ spin'):'';
      return `<details style="--level-ink:${l.colour}" data-profile-badge-details="${esc(id)}:regional:${l.level}"><summary><b>Level ${l.level}</b><span>${l.count===5?'✓ Ready':l.count+' / 5'}</span><i aria-hidden="true">⌄</i></summary><div class="regional-checks"><p>${l.range}</p>${logged?`<p>Recorded skill · ${logged}</p>`:''}${l.items.map((label,i)=>`<label><input type="checkbox" data-regional-check="${i}" data-level="${l.level}" data-person="${esc(id)}" ${observed(id,l.level,i)?'checked':''} ${unlocked?'':'disabled'}><span>${label}</span></label>`).join('')}</div></details>`;
    }).join('')}</div><footer><span>${unlocked?'Tick what you have seen':'Unlock scoring to assess'} · Saved on this device</span><a href="${regionalGuide}" target="_blank" rel="noopener">IGA guide ↗</a></footer></section>`;
  }
  const reviewConfigs=new WeakMap();
  function bindRegional(host,config){
    if(!reviewConfigs.has(host))host.addEventListener?.('change',event=>{
      const box=event.target,active=reviewConfigs.get(host);
      if(!box.matches?.('[data-regional-check]')||!active)return;
      if(!reviewEditable()||box.dataset.person!==active.gymnast.id){box.checked=!box.checked;return;}
      try{localStorage.setItem(reviewKey(active.gymnast.id,box.dataset.level,box.dataset.regionalCheck),box.checked?'1':'0');}
      catch{box.checked=!box.checked;window.alert('This browser could not save the assessment.');return;}
      render(host,active);
      host.querySelector(`input[data-level="${box.dataset.level}"][data-regional-check="${box.dataset.regionalCheck}"]`)?.focus({preventScroll:true});
    });
    reviewConfigs.set(host,config);
  }
  function render(host, config = {}) {
    if (!host) return null;
    const model = build(config);
    if (!model.gymnast?.id) { replace(host,''); return model; }
    if (model.excluded) { replace(host,'<section class="pb-empty"><h2>Gymnast badges</h2><p>These challenges are for gymnasts. Coaches can still track all their skills.</p></section>'); return model; }
    if (!model.loaded) { replace(host,'<p class="pb-empty" role="status">Loading badge progress…</p>'); return model; }
    if (!model.badges.length) { replace(host,'<p class="pb-empty" role="status">Badge progress is unavailable right now.</p>'); return model; }
    bindRegional(host,config);
    replace(host,`${regionalCard(config)}${window.SWLCompetitionAwards?.html(model.gymnast) || ''}<div class="profile-badge-collection"><div class="pb-heading"><h2>Skill badges</h2><span>${model.earnedCount} of ${model.badges.length} earned</span></div>${['floor','vault'].map(apparatus => `<section class="pb-journey" aria-label="${apparatus === 'floor' ? 'Floor' : 'Vault'} badge progress"><div class="pb-journey-heading"><h2>${apparatus === 'floor' ? 'Floor' : 'Vault'}</h2>${apparatus === 'floor' ? '<p>Build through each level · handstands excluded</p>' : '<p>A separate collection</p>'}</div><div class="pb-grid">${model.badges.filter(badge => badge.definition.apparatus === apparatus).map(badge => badgeCard(badge,model)).join('')}</div></section>`).join('')}</div>`);
    watchVisible(host,config);
    return model;
  }

  window.SWLProfileBadges = Object.freeze({build,render,mount:render,update:render,capture,restore});
})();
