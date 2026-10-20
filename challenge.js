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

  function render(host, config) {
    if (!host) return;
    const model = buildChallenge(config);
    const {rows,winners,race,hasLoaded,pending} = model;
    const groupLabel = config.groupLabel || (value => value);
    const heatClass = config.heatClass || (() => '');
    const personLabel = config.gymnastSquadLabel || (g => groupLabel(g.coach));
    const participantBadge = config.coachBadge || (() => '');
    const date = value => new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/London'}).format(new Date(value));
    const names = winners.map(row => row.gymnast.name).join(' & ');
    const winnerIDs = new Set(winners.map(row => row.gymnast.id));
    const finishedIDs = new Set(model.finishers.map(row => row.gymnastId));
    const status = !hasLoaded ? 'Loading the challenge…' : !race ? 'Preparing the new race…' : winners.length ? 'Prize secured' : 'The race is on';
    const heading = winners.length ? `${names} ${winners.length === 1 ? 'wins' : 'share first place'}` : 'First to 250.';
    const body = winners.length
      ? `${winners.length === 1 ? 'The first gymnast' : 'These gymnasts were first in the same saved update'} to reach 250 in this challenge ${winners.length === 1 ? 'has' : 'have'} won a prize. Recorded on ${date(winners[0].finish.reachedAt)}.`
      : 'One target. Every squad. The first gymnast to reach 250 points wins a prize.';
    const html = `<div class="v2-page-head challenge-page-head"><div><p class="eyebrow">SWL · The prize challenge</p><h1>The 250 Challenge</h1></div><button type="button" class="quiet" data-view="dashboard">← Leaderboards</button></div>
      <section class="challenge-hero${winners.length ? ' challenge-won' : ''}" aria-labelledby="challengeHeadline"><div class="challenge-copy"><span class="challenge-status">${status}</span><h2 id="challengeHeadline">${esc(heading)}</h2><p>${esc(body)}</p><p class="challenge-rules">All squads compete together. Coaches are excluded.<br>Current points carry over; earlier prize milestones do not count.</p>${race ? `<span class="challenge-start">Started ${date(race.startedAt)} · Results are saved with the league</span>` : ''}</div><div class="challenge-target" aria-hidden="true"><span>THE TARGET</span><strong>250</strong><span>POINTS</span></div></section>
      <div class="challenge-list-head"><div><h2>Every gymnast. One finish line.</h2><p>${hasLoaded ? rows.length+' gymnasts · highest current score first' : 'Waiting for saved scores'} · equal scores ordered alphabetically.</p></div><span>250 pts to win</span></div>
      ${!hasLoaded ? '<p class="challenge-empty" role="status">Loading the saved standings. If the connection needs attention, use Refresh scores below.</p>' : !race ? '<p class="challenge-notice" role="status">The new challenge is being connected. These are current scores; a prize will only be confirmed once the race is ready.</p>' : ''}
      ${hasLoaded && pending ? '<p class="challenge-notice" role="status">Some score changes are still saving. A finish counts once it is confirmed in the shared record.</p>' : ''}
      ${hasLoaded && !rows.length ? '<p class="challenge-empty">No gymnasts are available yet.</p>' : hasLoaded ? `<ol class="challenge-list" aria-label="All gymnasts ranked by points towards 250">${rows.map(row => `<li><button type="button" class="challenge-row ${heatClass(row.gymnast.id)}${winnerIDs.has(row.gymnast.id)?' challenge-winner':''}" data-gymnast="${esc(row.gymnast.id)}" aria-label="Position ${row.rank}: ${esc(row.gymnast.name)}, ${number(row.points)} points, ${number(row.remaining)} points to 250${winnerIDs.has(row.gymnast.id)?', confirmed challenge winner':''}. Open profile."><span class="challenge-rank">${String(row.rank).padStart(2,'0')}</span><span class="challenge-person"><strong>${esc(row.gymnast.name)} ${participantBadge(row.gymnast)}</strong><small>${esc(personLabel(row.gymnast))}${winnerIDs.has(row.gymnast.id)?' · Prize winner':finishedIDs.has(row.gymnast.id)?' · Reached 250':''}</small></span><span class="challenge-row-progress" aria-hidden="true"><i style="width:${row.progress}%"></i></span><span class="challenge-points"><b>${number(row.points)}</b><small>${row.remaining?number(row.remaining)+' to go':finishedIDs.has(row.gymnast.id)?'Target reached':'Confirming finish'}</small></span><span class="challenge-arrow" aria-hidden="true">↗</span></button></li>`).join('')}</ol>` : ''}
      <p class="challenge-footnote">This list always shows all eligible gymnasts, regardless of leaderboard filters. A confirmed winner keeps their place in the challenge record even if their league score changes later.</p>`;
    if (host._renderedHTML === html) return;
    const focused = document.activeElement;
    const focusID = host.contains(focused) ? focused?.dataset?.gymnast : null;
    host.innerHTML = html;
    host._renderedHTML = html;
    if (focusID && document.activeElement === document.body) Array.from(host.querySelectorAll('[data-gymnast]')).find(button => button.dataset.gymnast === focusID)?.focus({preventScroll:true});
  }
  window.SWLChallenge = Object.freeze({parseChallenge,buildChallenge,render});
})();
