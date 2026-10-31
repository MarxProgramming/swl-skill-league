(() => {
  'use strict';
  const ID = 'first-250-v31', TARGET = 250;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number(value).toLocaleString('en-GB',{maximumFractionDigits:2});
  const isCoach = gymnast => String(gymnast?.coach || '').trim().toLowerCase() === 'coaches';
  const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

  function parseChallenge(value, gymnasts) {
    // Earlier clients keep their 200 record; the new page waits for the 250 record.
    if (value?.id === 'first-200-v31' && value.target === 200) return null;
    if (!value || value.id !== ID || value.target !== TARGET || !iso(value.startedAt) || !Array.isArray(value.finishers) || value.finishers.length > gymnasts.length) throw Error('The challenge record could not be read.');
    const people = new Map(gymnasts.map(g => [g.id,g]));
    const seen = new Set();
    const finishers = value.finishers.map(row => {
      if (!row || !people.has(row.gymnastId) || seen.has(row.gymnastId) || !iso(row.reachedAt) || Date.parse(row.reachedAt) < Date.parse(value.startedAt) || typeof row.points !== 'number' || !Number.isFinite(row.points) || row.points < TARGET || row.points > 10000) throw Error('A challenge finish could not be read.');
      seen.add(row.gymnastId);
      return {gymnastId:row.gymnastId,reachedAt:row.reachedAt,points:row.points};
    }).filter(row => !isCoach(people.get(row.gymnastId))).sort((a,b) => Date.parse(a.reachedAt)-Date.parse(b.reachedAt) || a.gymnastId.localeCompare(b.gymnastId));
    const earliest = finishers.length ? Date.parse(finishers[0].reachedAt) : null;
    return {id:ID,target:TARGET,startedAt:value.startedAt,finishers,winnerIds:finishers.filter(row => Date.parse(row.reachedAt) === earliest).map(row => row.gymnastId)};
  }

  function buildChallenge({gymnasts = [],summary = () => ({points:0}),isCoachParticipant = isCoach,challenge = null,hasLoaded = false,pending = false}) {
    // Display current totals, but only confirmed server receipts can decide a prize.
    const race = challenge ? parseChallenge(challenge,gymnasts) : null;
    const rows = gymnasts.filter(g => !isCoach(g) && !isCoachParticipant(g)).map(gymnast => {
      const value = summary(gymnast.id)?.points;
      const points = typeof value === 'number' && Number.isFinite(value) ? Math.max(0,value) : 0;
      return {gymnast:gymnast,points,remaining:Math.max(0,TARGET-points),progress:Math.min(100,points/TARGET*100)};
    }).sort((a,b) => b.points-a.points || a.gymnast.name.localeCompare(b.gymnast.name,'en-GB')).map((row,index) => ({...row,rank:index+1}));
    const eligible = new Set(rows.map(row => row.gymnast.id));
    const finishes = (race?.finishers || []).filter(row => eligible.has(row.gymnastId));
    const firstAt = finishes.length ? Math.min(...finishes.map(row => Date.parse(row.reachedAt))) : null;
    const winners = finishes.filter(row => Date.parse(row.reachedAt) === firstAt).map(finish => ({...rows.find(row => row.gymnast.id === finish.gymnastId),finish}));
    return {target:TARGET,rows,winners,finishers:finishes,race,hasLoaded,pending,startedAt:race?.startedAt || null};
  }

  function buildStandings({gymnasts = [],summary = () => ({points:0}),isCoachParticipant = isCoach,apparatus = 'floor',hasLoaded = false,pending = false}) {
    const selected = ['floor','vault','combined'].includes(apparatus) ? apparatus : 'floor';
    const category = selected === 'floor' ? 'overall' : selected;
    const rows = gymnasts.filter(g => !isCoach(g) && !isCoachParticipant(g)).map(gymnast => {
      const value = summary(gymnast.id,category)?.points;
      const points = typeof value === 'number' && Number.isFinite(value) ? Math.max(0,value) : 0;
      return {gymnast,points};
    }).sort((a,b) => b.points-a.points || a.gymnast.name.localeCompare(b.gymnast.name,'en-GB')).map((row,index) => ({...row,rank:index+1}));
    return {rows,apparatus:selected,hasLoaded,pending};
  }

  function render(host, config) {
    if (!host) return;
    const {rows,apparatus,hasLoaded,pending} = buildStandings(config);
    const groupLabel = config.groupLabel || (value => value);
    const heatClass = config.heatClass || (() => '');
    const personLabel = config.gymnastSquadLabel || (g => groupLabel(g.coach));
    const participantBadge = config.coachBadge || (() => '');
    const fireBadge = config.fireBadge || (() => '');
    const achievementBadge = config.achievementBadge || window.SWLAchievements?.badge || (() => '');
    const apparatusLabel = {floor:'Floor',vault:'Vault',combined:'Floor + Vault'}[apparatus];
    const maximum = Math.max(1,...rows.map(row => row.points));
    const html = `<div class="v2-page-head challenge-page-head"><div><p class="eyebrow">SWL · Full standings</p><h1>All gymnasts</h1><p>Every place. Every point.</p></div><button type="button" class="quiet" data-view="dashboard">← Leaderboards</button></div>
      <div class="standings-apparatus" role="group" aria-label="Standings apparatus">${[['floor','Floor'],['vault','Vault'],['combined','Combined']].map(([value,label]) => `<button type="button" data-apparatus="${value}" aria-pressed="${apparatus===value}">${label}</button>`).join('')}</div>
      <div class="challenge-list-head"><div><h2>${apparatusLabel} standings</h2><p>${hasLoaded ? rows.length+' gymnasts · all squads' : 'Waiting for saved scores'} · equal scores ordered alphabetically.</p></div><span>${apparatus==='combined'?'Floor and Vault added together':'Current '+apparatusLabel+' points'}</span></div>
      ${!hasLoaded ? '<p class="challenge-empty" role="status">Loading the saved standings. If the connection needs attention, use Refresh scores below.</p>' : ''}
      ${hasLoaded && pending ? '<p class="challenge-notice" role="status">Some score changes are still saving.</p>' : ''}
      ${hasLoaded && !rows.length ? '<p class="challenge-empty">No gymnasts are available yet.</p>' : hasLoaded ? `<ol class="challenge-list" aria-label="All gymnasts ranked by ${apparatusLabel} points">${rows.map(row => `<li${achievementBadge(row.gymnast)?' class="has-achievement"':''}><button type="button" class="challenge-row ${heatClass(row.gymnast.id)}" data-gymnast="${esc(row.gymnast.id)}" aria-label="Position ${row.rank}: ${esc(row.gymnast.name)}, ${number(row.points)} ${apparatusLabel} points. Open profile."><span class="challenge-rank">${String(row.rank).padStart(2,'0')}</span><span class="challenge-person"><strong>${esc(row.gymnast.name)} ${participantBadge(row.gymnast)} ${fireBadge(row.gymnast.id)}</strong><small>${esc(personLabel(row.gymnast))}</small></span><span class="challenge-row-progress" aria-hidden="true"><i style="width:${row.points/maximum*100}%"></i></span><span class="challenge-points"><b>${number(row.points)}</b><small>points</small></span><span class="challenge-arrow" aria-hidden="true">↗</span></button>${achievementBadge(row.gymnast)}</li>`).join('')}</ol>` : ''}
      <p class="challenge-footnote">All squads are shown here, independently of leaderboard filters. Coaches have their own category on the main leaderboards.</p>`;
    if (host._renderedHTML === html) return;
    const focused = document.activeElement;
    const focusID = host.contains(focused) ? focused?.dataset?.gymnast : null;
    const focusApparatus = host.contains(focused) ? focused?.dataset?.apparatus : null;
    const achievementFocused = host.contains(focused) && focused?.hasAttribute?.('data-swl-achievement');
    host.innerHTML = html;
    host._renderedHTML = html;
    if (document.activeElement === document.body) {
      if (focusID) Array.from(host.querySelectorAll('[data-gymnast]')).find(button => button.dataset.gymnast === focusID)?.focus({preventScroll:true});
      else if (focusApparatus) Array.from(host.querySelectorAll('[data-apparatus]')).find(button => button.dataset.apparatus === focusApparatus)?.focus({preventScroll:true});
      else if (achievementFocused) host.querySelector('[data-swl-achievement]')?.focus({preventScroll:true});
    }
  }
  window.SWLChallenge = Object.freeze({parseChallenge,buildChallenge,buildStandings,render});
})();
