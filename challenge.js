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

  const FLOOR_CATEGORIES = Object.freeze(['rolls','acro','leaps']);
  const FLOOR_LEVELS = Object.freeze([
    Object.freeze({key:'basics',label:'Foundations',tiers:['base'],scope:'All basic Rolls, Acro and Leaps skills.'}),
    Object.freeze({key:'upgrades',label:'Upgrades',tiers:['base','upgrade'],scope:'All basic and upgraded Rolls, Acro and Leaps skills.'}),
    Object.freeze({key:'pro',label:'Complete Floor',tiers:['base','upgrade','pro'],scope:'Every Rolls, Acro and Leaps skill, including Pro upgrades.'})
  ]);
  const COMPLETION_CHALLENGES = Object.freeze([
    ...FLOOR_LEVELS.flatMap((level,index) => ['achieved','perfect'].map((status,step) => Object.freeze({
      id:`floor-${level.key}-${status}`, apparatus:'floor', status, level:level.key, levelNumber:index+1, stage:index*2+step+1,
      title:`${level.label} · ${status === 'perfect' ? 'Perfect' : 'Achieved'}`,
      shortTitle:`${level.label} ${status === 'perfect' ? 'Perfect' : 'Achieved'}`,
      description:`${level.scope} ${status === 'perfect' ? 'Every skill must be Perfect.' : 'Achieved or Perfect marks count.'} Handstand holds are not included.`,
      tiers:level.tiers, symbol:status === 'perfect' ? '✓✓' : '✓'
    }))),
    Object.freeze({id:'vault-achieved', apparatus:'vault', status:'achieved', title:'Achieve all Vault skills', shortTitle:'Vault Achieved', description:'Achieved or Perfect on every Vault skill.', symbol:'✓'}),
    Object.freeze({id:'vault-perfect', apparatus:'vault', status:'perfect', title:'Perfect all Vault skills', shortTitle:'Vault Perfect', description:'Every Vault skill marked Perfect.', symbol:'✓✓'})
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
    const skills = (config.skills || []).filter(skill => definition.apparatus === 'vault' ? skill.category === 'vault' : FLOOR_CATEGORIES.includes(skill.category) && definition.tiers.includes(skill.tier));
    const mark = config.mark || ((id,skillID) => config.state?.marks?.[id]?.[skillID] || 0);
    const summary = config.summary || (() => ({points:0,max:0}));
    const rows = peopleFor(config).map(gymnast => {
      const total = summary(gymnast.id,definition.apparatus === 'floor' ? 'overall' : 'vault') || {};
      const skillMarks = skills.map(skill => ({skill,level:Math.max(0,Math.min(2,Number(mark(gymnast.id,skill.id)) || 0))}));
      const achieved = skillMarks.filter(item => item.level >= 1).length;
      const perfect = skillMarks.filter(item => item.level === 2).length;
      const completed = definition.status === 'perfect' ? perfect : achieved;
      return {gymnast,points:finite(total.points),maximum:skills.length,achieved,perfect,completed,skillMarks,remaining:skills.length-completed,progress:percentage(completed,skills.length),complete:skills.length > 0 && completed === skills.length};
    }).sort((a,b) => b.completed-a.completed || b.points-a.points || a.gymnast.name.localeCompare(b.gymnast.name,'en-GB')).map((row,index) => ({...row,rank:index+1}));
    return {definition,rows,skillCount:skills.length,completedCount:rows.filter(row => row.complete).length,hasLoaded:!!config.hasLoaded,pending:!!config.pending};
  }

  function replaceHTML(host, html) {
    if (host._renderedHTML === html) return;
    const focused = document.activeElement;
    const focus = host.contains(focused) ? ['gymnast','apparatus','completionChallenge','swlAchievement','checklistToggle'].map(key => [key,focused?.dataset?.[key]]).find(([,value]) => value != null) : null;
    const achievementGymnast = focus?.[0] === 'swlAchievement' ? focused.dataset.achievementGymnast : null;
    const openChecklists = new Set(Array.from(host.querySelectorAll('details[data-challenge-checklist][open]')).map(item => item.dataset.challengeChecklist));
    host.innerHTML = html;
    host._renderedHTML = html;
    // A score refresh must not close the checklist a coach is reading.
    for (const details of host.querySelectorAll('details[data-challenge-checklist]')) if (openChecklists.has(details.dataset.challengeChecklist)) details.open = true;
    if (focus && document.activeElement === document.body) Array.from(host.querySelectorAll('button,summary')).find(control => control.dataset[focus[0]] === focus[1] && (focus[0] !== 'swlAchievement' || control.dataset.achievementGymnast === achievementGymnast))?.focus({preventScroll:true});
  }

  function challengeCard(model) {
    const definition = model.definition;
    const icon = window.SWLAchievements?.challengeIcon?.(definition.id) || definition.symbol;
    return `<button type="button" class="completion-challenge-card is-${definition.status}" data-completion-challenge="${definition.id}" aria-label="${definition.title}. View progress for all gymnasts."><span class="completion-challenge-symbol" aria-hidden="true">${icon}</span><span class="completion-challenge-copy"><strong>${definition.status === 'perfect' ? 'All Perfect' : 'All Achieved'}</strong><small>${model.skillCount} skills${definition.apparatus === 'floor' ? ' · '+(definition.level === 'basics' ? 'Basics' : definition.level === 'upgrades' ? 'Basics + upgrades' : 'Basics + upgrades + pro') : ' · Vault'}</small><span class="completion-challenge-count">${model.hasLoaded ? `<span aria-hidden="true">${definition.symbol}</span> ${model.completedCount} of ${model.rows.length} complete` : 'Loading saved progress…'}</span></span><span class="completion-challenge-arrow" aria-hidden="true">↗</span></button>`;
  }

  function renderChallenges(host, config = {}) {
    if (!host) return;
    const models = COMPLETION_CHALLENGES.map(definition => buildCompletion(config,definition.id));
    replaceHTML(host, `<section class="completion-challenges" aria-labelledby="completionChallengesHeading"><div class="completion-challenges-heading"><div><p class="eyebrow">The next milestone</p><h2 id="completionChallengesHeading">Build your collection</h2></div><p>Your emblem upgrades as you progress.</p></div><section class="completion-journey" aria-labelledby="floorJourneyHeading"><div class="completion-journey-heading"><h3 id="floorJourneyHeading">Floor journey</h3><p>Start with the basics. Build through each level.</p></div><div class="completion-floor-levels">${FLOOR_LEVELS.map((level,index) => `<section class="completion-level" aria-label="Floor level ${index+1}: ${level.label}"><h4><span>${index+1}</span>${level.label}</h4><div class="completion-challenge-grid">${models.filter(model => model.definition.level === level.key).map(challengeCard).join('')}</div></section>`).join('')}</div><p class="completion-journey-note">Each level includes the skills before it. Handstand holds do not count.</p></section><section class="completion-journey completion-vault-journey" aria-labelledby="vaultJourneyHeading"><div class="completion-journey-heading"><h3 id="vaultJourneyHeading">Vault journey</h3><p>Your separate Vault emblem.</p></div><div class="completion-challenge-grid">${models.filter(model => model.definition.apparatus === 'vault').map(challengeCard).join('')}</div></section></section>`);
  }

  function renderChecklist(row, completion) {
    const key = `${completion.definition.id}:${row.gymnast.id}`;
    const categoryNames = {rolls:'Rolls',acro:'Acro & spins',leaps:'Leaps',vault:'Vault'};
    const tierNames = {base:'Basics',upgrade:'Upgrades',pro:'Pro upgrades',run:'Run & hurdle',vaults:'Vaults'};
    const groups = new Map();
    for (const item of row.skillMarks) {
      const group = item.skill.category+':'+item.skill.tier;
      if (!groups.has(group)) groups.set(group,[]);
      groups.get(group).push(item);
    }
    return `<details class="challenge-skill-checklist" data-challenge-checklist="${esc(key)}"><summary data-checklist-toggle="${esc(key)}"><span>View skills</span><span class="challenge-checklist-summary"><span class="is-achieved" aria-label="${row.achieved-row.perfect} achieved"><b aria-hidden="true">✓</b> ${row.achieved-row.perfect}</span><span class="is-perfect" aria-label="${row.perfect} perfect"><b aria-hidden="true">✓✓</b> ${row.perfect}</span><span class="challenge-checklist-chevron" aria-hidden="true">⌄</span></span></summary><div class="challenge-checklist-content"><p>Saved marks · <span class="is-achieved">✓ Achieved</span> · <span class="is-perfect">✓✓ Perfect</span></p><div class="challenge-checklist-groups">${Array.from(groups.values()).map(items => `<section><h3>${categoryNames[items[0].skill.category] || esc(items[0].skill.category)} · ${tierNames[items[0].skill.tier] || esc(items[0].skill.tier)}</h3><ul>${items.map(({skill,level}) => `<li class="is-${level === 2 ? 'perfect' : level === 1 ? 'achieved' : 'unachieved'}"><span class="challenge-skill-mark" aria-label="${level === 2 ? 'Perfect' : level === 1 ? 'Achieved' : 'Not achieved'}">${level === 2 ? '✓✓' : level === 1 ? '✓' : '–'}</span><span>${esc(skill.name)}</span></li>`).join('')}</ul></section>`).join('')}</div></div></details>`;
  }

  function renderRow(row, config, completion) {
    const groupLabel = config.groupLabel || (value => value);
    const personLabel = config.gymnastSquadLabel || (g => groupLabel(g.coach));
    const heatClass = config.heatClass || (() => '');
    const participantBadge = config.coachBadge || (() => '');
    const fireBadge = config.fireBadge || (() => '');
    const achievementBadge = config.achievementBadge || (gymnast => window.SWLAchievements?.allBadges?.(gymnast,config.completionAchievements || config.state?.completionAchievements) || window.SWLAchievements?.badge?.(gymnast) || '');
    const label = completion ? `${row.completed} of ${row.maximum} skills ${completion.definition.status === 'perfect' ? 'Perfect' : 'achieved'}` : `${number(row.points)} of ${number(row.maximum)} points`;
    const progressText = row.complete ? (completion ? 'Complete' : 'Full marks') : completion ? `${row.remaining} ${row.remaining === 1 ? 'skill' : 'skills'} to go` : `${number(row.remaining)} points to go`;
    return `<li class="challenge-list-item"><div class="challenge-row ${completion ? 'is-completion is-'+completion.definition.status : ''} ${row.complete ? 'is-complete' : ''} ${heatClass(row.gymnast.id)}"><span class="challenge-rank">${String(row.rank).padStart(2,'0')}</span><span class="challenge-person"><span class="challenge-person-line"><button type="button" class="challenge-profile-link" data-gymnast="${esc(row.gymnast.id)}" aria-label="Position ${row.rank}: ${esc(row.gymnast.name)}, ${label}. Open profile."><strong>${esc(row.gymnast.name)} ${participantBadge(row.gymnast)} ${fireBadge(row.gymnast.id)}</strong></button>${achievementBadge(row.gymnast)}</span><small>${esc(personLabel(row.gymnast))}</small></span><span class="challenge-progress-details"><span class="challenge-row-progress" role="progressbar" aria-label="${esc(row.gymnast.name)}: ${completion ? completion.definition.title : apparatusName(config.apparatus)+' full marks'}" aria-valuemin="0" aria-valuemax="${row.maximum || 1}" aria-valuenow="${Math.min(row.maximum,completion ? row.completed : row.points)}" aria-valuetext="${label}"><i style="width:${row.progress}%"></i></span><span class="challenge-progress-caption"><b>${percentageLabel(row.progress)}%</b><span>${row.complete ? '<span aria-hidden="true">✓ </span>' : ''}${progressText}</span></span></span><span class="challenge-points"><span><b>${number(completion ? row.completed : row.points)}</b><small> / ${number(row.maximum)}</small></span><small>${completion ? (completion.definition.status === 'perfect' ? 'Perfect skills' : 'skills achieved') : (config.streakLabel?.(row.gymnast.id)||'points')}</small></span><span class="challenge-arrow" aria-hidden="true">↗</span></div>${completion ? renderChecklist(row,completion) : ''}</li>`;
  }

  function render(host, config = {}) {
    if (!host) return;
    const completion = buildCompletion(config);
    const model = completion || buildStandings(config);
    const {rows,hasLoaded,pending} = model;
    const apparatus = completion?.definition.apparatus || model.apparatus;
    const title = completion?.definition.title || 'All gymnasts';
    const heading = completion ? `${completion.skillCount} skills to ${completion.definition.status === 'perfect' ? 'Perfect' : 'Achieve'}.` : `${apparatusName(apparatus)} standings`;
    const description = completion?.definition.description || 'Every place. Every point. See how close everyone is to full marks.';
    const overview = completion ? `${completion.completedCount} of ${rows.length} gymnasts complete` : `${rows.length} gymnasts · all squads`;
    const html = `<div class="v2-page-head challenge-page-head"><div><p class="eyebrow">SWL · ${completion ? 'Skill challenge' : 'Full standings'}</p><h1>${title}</h1><p>${description}</p></div><button type="button" class="quiet" data-view="dashboard">← Leaderboards</button></div>
      ${completion ? `<nav class="completion-challenge-tabs" aria-label="Choose a challenge">${COMPLETION_CHALLENGES.map(item => `<button type="button" data-completion-challenge="${item.id}" aria-pressed="${item.id === completion.definition.id}">${item.shortTitle}</button>`).join('')}</nav>` : `<div class="standings-apparatus" role="group" aria-label="Standings apparatus">${[['floor','Floor'],['vault','Vault'],['combined','Combined']].map(([value,label]) => `<button type="button" data-apparatus="${value}" aria-pressed="${apparatus===value}">${label}</button>`).join('')}</div>`}
      <div class="challenge-list-head"><div><h2>${heading}</h2><p>${hasLoaded ? overview : 'Waiting for saved scores'}${completion ? '' : ' · equal scores ordered alphabetically.'}</p></div><span>${completion ? `${completion.definition.status === 'perfect' ? 'Perfect marks' : 'Achieved and Perfect marks'} count` : 'Progress towards full marks'}</span></div>
      ${!hasLoaded ? '<p class="challenge-empty" role="status">Loading saved progress. If the connection needs attention, use Refresh scores below.</p>' : ''}
      ${hasLoaded && pending ? '<p class="challenge-notice" role="status">Some score changes are still saving.</p>' : ''}
      ${hasLoaded && !rows.length ? '<p class="challenge-empty">No gymnasts are available yet.</p>' : hasLoaded ? `<ol class="challenge-list" aria-label="${completion ? completion.definition.title+' progress' : 'All gymnasts ranked by '+apparatusName(apparatus)+' points'}">${rows.map(row => renderRow(row,{...config,apparatus},completion)).join('')}</ol>` : ''}
      <p class="challenge-footnote">All squads are shown here, independently of leaderboard filters. Coaches have their own category on the main leaderboards.${completion ? ' Open View skills for the individual checkmarks. Progress reflects current marks.' : ' Full marks include the complex completion bonuses.'}</p>`;
    replaceHTML(host, html);
  }
  window.SWLChallenge = Object.freeze({parseChallenge,buildChallenge,buildStandings,buildCompletion,renderChallenges,render,definitions:COMPLETION_CHALLENGES});
})();
