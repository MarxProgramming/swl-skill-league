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

  const COMPLETION_CHALLENGES = Object.freeze([
    Object.freeze({id:'floor-achieved', apparatus:'floor', status:'achieved', title:'Achieve all Floor skills', shortTitle:'All Floor skills', description:'Achieved or Perfect on every Floor skill.', symbol:'✓'}),
    Object.freeze({id:'vault-achieved', apparatus:'vault', status:'achieved', title:'Achieve all Vault skills', shortTitle:'All Vault skills', description:'Achieved or Perfect on every Vault skill.', symbol:'✓'}),
    Object.freeze({id:'floor-perfect', apparatus:'floor', status:'perfect', title:'Perfect all Floor skills', shortTitle:'Perfect Floor', description:'Every Floor skill marked Perfect.', symbol:'✓✓'}),
    Object.freeze({id:'vault-perfect', apparatus:'vault', status:'perfect', title:'Perfect all Vault skills', shortTitle:'Perfect Vault', description:'Every Vault skill marked Perfect.', symbol:'✓✓'})
  ]);
  const finite = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0,value) : 0;
  const percentage = (value, maximum) => maximum > 0 ? Math.min(100,Math.max(0,value/maximum*100)) : 0;
  const percentageLabel = value => value === 100 ? '100' : value > 0 && value < .1 ? '<0.1' : (Math.floor(value*10)/10).toLocaleString('en-GB',{maximumFractionDigits:1});
  const apparatusName = apparatus => ({floor:'Floor',vault:'Vault',combined:'Floor + Vault'}[apparatus] || 'Floor');
  const peopleFor = config => (config.gymnasts || []).filter(g => !isCoach(g) && !(config.isCoachParticipant || isCoach)(g));

  function buildStandings(config = {}) {
    const {summary = () => ({points:0,max:0}),apparatus = 'floor',hasLoaded = false,pending = false} = config;
    const selected = ['floor','vault','combined'].includes(apparatus) ? apparatus : 'floor';
    const category = selected === 'floor' ? 'overall' : selected;
    const rows = peopleFor(config).map(gymnast => {
      const total = summary(gymnast.id,category) || {};
      const points = finite(total.points), maximum = finite(total.max);
      return {gymnast,points,maximum,achieved:finite(total.achieved),perfect:finite(total.perfect),remaining:Math.max(0,maximum-points),progress:percentage(points,maximum),complete:maximum > 0 && points >= maximum};
    }).sort((a,b) => b.points-a.points || a.gymnast.name.localeCompare(b.gymnast.name,'en-GB')).map((row,index) => ({...row,rank:index+1}));
    return {rows,apparatus:selected,hasLoaded,pending};
  }

  function buildCompletion(config = {}, challengeID = config.activeChallenge) {
    const definition = COMPLETION_CHALLENGES.find(item => item.id === challengeID);
    if (!definition) return null;
    const skills = (config.skills || []).filter(skill => definition.apparatus === 'vault' ? skill.category === 'vault' : skill.category !== 'vault');
    const mark = config.mark || ((id,skillID) => config.state?.marks?.[id]?.[skillID] || 0);
    const summary = config.summary || (() => ({points:0,max:0}));
    const rows = peopleFor(config).map(gymnast => {
      const total = summary(gymnast.id,definition.apparatus === 'floor' ? 'overall' : 'vault') || {};
      const achieved = skills.filter(skill => Number(mark(gymnast.id,skill.id)) >= 1).length;
      const perfect = skills.filter(skill => Number(mark(gymnast.id,skill.id)) === 2).length;
      const completed = definition.status === 'perfect' ? perfect : achieved;
      return {gymnast,points:finite(total.points),maximum:skills.length,achieved,perfect,completed,remaining:skills.length-completed,progress:percentage(completed,skills.length),complete:skills.length > 0 && completed === skills.length};
    }).sort((a,b) => b.completed-a.completed || b.points-a.points || a.gymnast.name.localeCompare(b.gymnast.name,'en-GB')).map((row,index) => ({...row,rank:index+1}));
    return {definition,rows,skillCount:skills.length,completedCount:rows.filter(row => row.complete).length,hasLoaded:!!config.hasLoaded,pending:!!config.pending};
  }

  function replaceHTML(host, html) {
    if (host._renderedHTML === html) return;
    const focused = document.activeElement;
    const focus = host.contains(focused) ? ['gymnast','apparatus','completionChallenge','swlAchievement'].map(key => [key,focused?.dataset?.[key]]).find(([,value]) => value != null) : null;
    host.innerHTML = html;
    host._renderedHTML = html;
    if (focus && document.activeElement === document.body) Array.from(host.querySelectorAll('button')).find(button => button.dataset[focus[0]] === focus[1])?.focus({preventScroll:true});
  }

  function renderChallenges(host, config = {}) {
    if (!host) return;
    const models = COMPLETION_CHALLENGES.map(definition => buildCompletion(config,definition.id));
    replaceHTML(host, `<section class="completion-challenges" aria-labelledby="completionChallengesHeading"><div class="completion-challenges-heading"><div><p class="eyebrow">The next milestone</p><h2 id="completionChallengesHeading">Complete the collection</h2></div><p>Four challenges. Every skill counts.</p></div><div class="completion-challenge-grid">${models.map(model => `<button type="button" class="completion-challenge-card is-${model.definition.status}" data-completion-challenge="${model.definition.id}" aria-label="${model.definition.title}. View progress for all gymnasts."><span class="completion-challenge-symbol" aria-hidden="true">${model.definition.symbol}</span><span class="completion-challenge-copy"><strong>${model.definition.title}</strong><small>${model.skillCount} skills · ${model.definition.status === 'perfect' ? 'All Perfect' : 'Achieved or Perfect'}</small><span class="completion-challenge-count">${model.hasLoaded ? `${model.completedCount} of ${model.rows.length} gymnasts complete` : 'Loading saved progress…'}</span></span><span class="completion-challenge-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section>`);
  }

  function renderRow(row, config, completion) {
    const groupLabel = config.groupLabel || (value => value);
    const personLabel = config.gymnastSquadLabel || (g => groupLabel(g.coach));
    const heatClass = config.heatClass || (() => '');
    const participantBadge = config.coachBadge || (() => '');
    const fireBadge = config.fireBadge || (() => '');
    const achievementBadge = config.achievementBadge || window.SWLAchievements?.badge || (() => '');
    const label = completion ? `${row.completed} of ${row.maximum} skills ${completion.definition.status === 'perfect' ? 'Perfect' : 'achieved'}` : `${number(row.points)} of ${number(row.maximum)} points`;
    const progressText = row.complete ? (completion ? 'Complete' : 'Full marks') : completion ? `${row.remaining} ${row.remaining === 1 ? 'skill' : 'skills'} to go` : `${number(row.remaining)} points to go`;
    return `<li><div class="challenge-row ${completion ? 'is-completion is-'+completion.definition.status : ''} ${row.complete ? 'is-complete' : ''} ${heatClass(row.gymnast.id)}"><span class="challenge-rank">${String(row.rank).padStart(2,'0')}</span><span class="challenge-person"><span class="challenge-person-line"><button type="button" class="challenge-profile-link" data-gymnast="${esc(row.gymnast.id)}" aria-label="Position ${row.rank}: ${esc(row.gymnast.name)}, ${label}. Open profile."><strong>${esc(row.gymnast.name)} ${participantBadge(row.gymnast)} ${fireBadge(row.gymnast.id)}</strong></button>${achievementBadge(row.gymnast)}</span><small>${esc(personLabel(row.gymnast))}</small></span><span class="challenge-progress-details"><span class="challenge-row-progress" role="progressbar" aria-label="${esc(row.gymnast.name)}: ${completion ? completion.definition.title : apparatusName(config.apparatus)+' full marks'}" aria-valuemin="0" aria-valuemax="${row.maximum || 1}" aria-valuenow="${Math.min(row.maximum,completion ? row.completed : row.points)}" aria-valuetext="${label}"><i style="width:${row.progress}%"></i></span><span class="challenge-progress-caption"><b>${percentageLabel(row.progress)}%</b><span>${row.complete ? '<span aria-hidden="true">✓ </span>' : ''}${progressText}</span></span></span><span class="challenge-points"><span><b>${number(completion ? row.completed : row.points)}</b><small> / ${number(row.maximum)}</small></span><small>${completion ? (completion.definition.status === 'perfect' ? 'Perfect skills' : 'skills achieved') : 'points'}</small></span><span class="challenge-arrow" aria-hidden="true">↗</span></div></li>`;
  }

  function render(host, config = {}) {
    if (!host) return;
    const completion = buildCompletion(config);
    const model = completion || buildStandings(config);
    const {rows,hasLoaded,pending} = model;
    const apparatus = completion?.definition.apparatus || model.apparatus;
    const title = completion?.definition.title || 'All gymnasts';
    const heading = completion ? `${completion.skillCount} skills. One complete collection.` : `${apparatusName(apparatus)} standings`;
    const description = completion?.definition.description || 'Every place. Every point. See how close everyone is to full marks.';
    const overview = completion ? `${completion.completedCount} of ${rows.length} gymnasts complete` : `${rows.length} gymnasts · all squads`;
    const html = `<div class="v2-page-head challenge-page-head"><div><p class="eyebrow">SWL · ${completion ? 'Skill challenge' : 'Full standings'}</p><h1>${title}</h1><p>${description}</p></div><button type="button" class="quiet" data-view="dashboard">← Leaderboards</button></div>
      ${completion ? `<nav class="completion-challenge-tabs" aria-label="Choose a challenge">${COMPLETION_CHALLENGES.map(item => `<button type="button" data-completion-challenge="${item.id}" aria-pressed="${item.id === completion.definition.id}">${item.shortTitle}</button>`).join('')}</nav>` : `<div class="standings-apparatus" role="group" aria-label="Standings apparatus">${[['floor','Floor'],['vault','Vault'],['combined','Combined']].map(([value,label]) => `<button type="button" data-apparatus="${value}" aria-pressed="${apparatus===value}">${label}</button>`).join('')}</div>`}
      <div class="challenge-list-head"><div><h2>${heading}</h2><p>${hasLoaded ? overview : 'Waiting for saved scores'}${completion ? '' : ' · equal scores ordered alphabetically.'}</p></div><span>${completion ? `${completion.definition.status === 'perfect' ? 'Perfect marks' : 'Achieved and Perfect marks'} count` : 'Progress towards full marks'}</span></div>
      ${!hasLoaded ? '<p class="challenge-empty" role="status">Loading saved progress. If the connection needs attention, use Refresh scores below.</p>' : ''}
      ${hasLoaded && pending ? '<p class="challenge-notice" role="status">Some score changes are still saving.</p>' : ''}
      ${hasLoaded && !rows.length ? '<p class="challenge-empty">No gymnasts are available yet.</p>' : hasLoaded ? `<ol class="challenge-list" aria-label="${completion ? completion.definition.title+' progress' : 'All gymnasts ranked by '+apparatusName(apparatus)+' points'}">${rows.map(row => renderRow(row,{...config,apparatus},completion)).join('')}</ol>` : ''}
      <p class="challenge-footnote">All squads are shown here, independently of leaderboard filters. Coaches have their own category on the main leaderboards.${completion ? ' Progress reflects current marks.' : ' Full marks include the complex completion bonuses.'}</p>`;
    replaceHTML(host, html);
  }
  window.SWLChallenge = Object.freeze({parseChallenge,buildChallenge,buildStandings,buildCompletion,renderChallenges,render,definitions:COMPLETION_CHALLENGES});
})();
