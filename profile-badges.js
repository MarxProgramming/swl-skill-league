/* A personal, read-only view of the progressive badge collection. */
(() => {
  'use strict';
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
    for (const definition of window.SWLChallenge.definitions) {
      const completion = window.SWLChallenge.buildCompletion({gymnasts:[gymnast],skills:config.skills || [],mark,hasLoaded:loaded},definition.id);
      const row = completion?.rows?.[0];
      if (!row) continue;
      const savedAt = earnedAt(gymnast,receipts,definition.id);
      const threshold = definition.status === 'perfect' ? 2 : 1;
      result.badges.push({definition,...row,earnedAt:savedAt,earned:!!savedAt,needed:row.skillMarks.filter(item => item.level < threshold)});
    }
    result.earnedCount = result.badges.filter(badge => badge.earned).length;
    return result;
  }

  function requirements(badge, gymnast) {
    const {definition} = badge;
    const key = `${gymnast.id}:${definition.id}`;
    const perfect = definition.status === 'perfect';
    const groups = new Map();
    for (const item of badge.skillMarks) {
      const group = `${item.skill.category}:${item.skill.tier}`;
      if (!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(item);
    }
    const action = badge.remaining ? `${badge.remaining} ${badge.remaining === 1 ? 'skill' : 'skills'} to ${perfect ? 'perfect' : 'achieve'}` : 'View all skills';
    return `<details class="pb-requirements" data-profile-badge-details="${esc(key)}"><summary data-profile-badge-toggle="${esc(key)}"><span>${action}</span><span class="pb-chevron">${chevron}</span></summary><div class="pb-requirement-content"><p class="pb-requirement-rule">${perfect ? 'Every skill below needs two ticks.' : 'One or two ticks on every skill below.'}${badge.earned ? ' Your earned badge stays in your collection.' : ''}</p>${Array.from(groups.values()).map(items => `<section class="pb-skill-group"><h4>${categoryNames[items[0].skill.category] || esc(items[0].skill.category)} <span>· ${tierNames[items[0].skill.tier] || esc(items[0].skill.tier)}</span></h4><ul>${items.map(({skill,level}) => `<li class="pb-skill is-${level === 2 ? 'perfect' : level === 1 ? 'achieved' : 'unachieved'}${level >= (perfect ? 2 : 1) ? ' meets-requirement' : ' needs-work'}"><span class="pb-skill-mark" aria-label="${level === 2 ? 'Perfect' : level === 1 ? 'Achieved' : 'Not achieved'}">${level === 2 ? '✓✓' : level === 1 ? '✓' : '—'}</span><span class="pb-skill-name">${esc(skill.name)}</span>${level < (perfect ? 2 : 1) ? `<small>${level === 1 ? 'Perfect next' : 'Achieve'+(perfect ? ' + perfect' : '')}</small>` : ''}</li>`).join('')}</ul></section>`).join('')}</div></details>`;
  }

  function badgeCard(badge, model) {
    const {definition} = badge;
    const perfect = definition.status === 'perfect';
    const floor = definition.apparatus === 'floor';
    const title = floor ? ({basics:'Foundations',upgrades:'Upgrades',pro:'Complete Floor'}[definition.level] || 'Floor') : 'Complete Vault';
    const subtitle = perfect ? 'All Perfect' : 'All Achieved';
    const scope = floor ? ({basics:'Basic Rolls, Acro & Leaps',upgrades:'Basics + upgrades',pro:'Basics + upgrades + Pro'}[definition.level]) : 'Run, hurdle & vaults';
    const artwork = window.SWLAchievements?.challengeIcon?.(definition.id) || `<span class="pb-icon-fallback">${floor ? 'F' : 'V'}</span>`;
    const state = badge.earned ? `<span class="pb-earned"><span aria-hidden="true">✓</span> Earned</span>` : badge.complete ? '<span class="pb-pending">Confirming…</span>' : `<span class="pb-progress-label">${badge.completed}<small> / ${badge.maximum}</small></span>`;
    const caption = badge.earned ? `Earned <time datetime="${esc(badge.earnedAt)}">${dateLabel(badge.earnedAt)}</time>` : badge.complete ? (model.pending ? 'Saving this achievement' : 'Waiting for saved confirmation') : `${badge.completed} of ${badge.maximum} ${perfect ? 'Perfect' : 'achieved'}`;
    return `<article class="pb-card is-${definition.status}${badge.earned ? ' is-earned' : ''}" data-profile-badge="${definition.id}" data-badge-stage="${definition.level || 'vault'}"><div class="pb-card-head"><span class="pb-art" aria-hidden="true">${artwork}</span><div class="pb-card-title"><h3>${title}</h3><p>${subtitle}</p></div>${state}</div><p class="pb-scope">${scope}</p><div class="pb-progress" role="progressbar" aria-label="${esc(title+' '+subtitle+': current marks')}" aria-valuemin="0" aria-valuemax="${badge.maximum || 1}" aria-valuenow="${badge.completed}" aria-valuetext="${badge.completed} of ${badge.maximum} ${perfect ? 'Perfect' : 'achieved'}${badge.earned ? '. Badge already earned.' : ''}"><span style="width:${badge.progress}%"></span></div><p class="pb-caption">${caption}${badge.earned && !badge.complete ? `<span>Current marks ${badge.completed}/${badge.maximum}</span>` : ''}</p>${requirements(badge,model.gymnast)}</article>`;
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

  function render(host, config = {}) {
    if (!host) return null;
    const model = build(config);
    if (!model.gymnast?.id) { replace(host,''); return model; }
    if (model.excluded) { replace(host,'<section class="pb-empty"><h2>Gymnast badges</h2><p>These challenges are for gymnasts. Coaches can still track all their skills.</p></section>'); return model; }
    if (!model.loaded) { replace(host,'<p class="pb-empty" role="status">Loading badge progress…</p>'); return model; }
    if (!model.badges.length) { replace(host,'<p class="pb-empty" role="status">Badge progress is unavailable right now.</p>'); return model; }
    replace(host,`<div class="profile-badge-collection"><div class="pb-heading"><h2>Your collection</h2><span>${model.earnedCount} of ${model.badges.length} earned</span></div>${['floor','vault'].map(apparatus => `<section class="pb-journey" aria-label="${apparatus === 'floor' ? 'Floor' : 'Vault'} badge progress"><div class="pb-journey-heading"><h2>${apparatus === 'floor' ? 'Floor' : 'Vault'}</h2>${apparatus === 'floor' ? '<p>Build through each level · handstands excluded</p>' : '<p>A separate collection</p>'}</div><div class="pb-grid">${model.badges.filter(badge => badge.definition.apparatus === apparatus).map(badge => badgeCard(badge,model)).join('')}</div></section>`).join('')}</div>`);
    return model;
  }

  window.SWLProfileBadges = Object.freeze({build,render,mount:render,update:render,capture,restore});
})();
