(() => {
  'use strict';
  if (window.SWLAddOn?.version === 1) return;
  const NAMES = ['Mint', 'Purple', 'Gold', 'Sky', 'Rose'], COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#83d9ff', '#ffafcb'];
  const BASICS = ['Forward roll', 'Backward roll', 'Cartwheel', 'Handstand', 'Straight jump', 'Star jump', 'Tuck jump', 'Pike jump', 'Straddle jump', 'Split jump', 'Half turn jump', 'Arabesque balance', 'Pike shape', 'Straddle shape', 'V-sit balance', 'Chassé'];
  let instance = null, mounted = null, sessionSequence = 0;
  const el = (tag, className = '', text = '') => { const node = document.createElement(tag); node.className = className; node.textContent = text; return node; };
  const safeName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 24).join('');
  const sizeOf = value => { const text = String(value).trim(), n = Number(text); return text && Number.isInteger(n) && n >= 1 && n <= 20 ? n : null; };
  const average = team => team.turns ? String(Number((team.score / team.turns).toFixed(3))) : '—';
  function randomBelow(max) {
    try {
      if (window.crypto?.getRandomValues) {
        const value = new Uint32Array(1), limit = 0x100000000 - 0x100000000 % max;
        for (let i = 0; i < 8; i++) { window.crypto.getRandomValues(value); if (value[0] < limit) return value[0] % max; }
      }
    } catch (_) {}
    return Math.floor(Math.random() * max);
  }
  function shuffle(values) { const result = values.slice(); for (let i = result.length - 1; i > 0; i--) { const j = randomBelow(i + 1); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  function sessionId() {
    try { if (window.crypto?.randomUUID) return `addon-${window.crypto.randomUUID()}`; } catch (_) {}
    return `addon-${Date.now().toString(36)}-${++sessionSequence}-${randomBelow(0x100000000).toString(36)}`;
  }
  function catalogue(skills) {
    const seen = new Set();
    const basics = BASICS.map((label, index) => ({ id: `addon-basic-${index}`, label, category: 'Floor basics', tier: 'base' }));
    return [...(Array.isArray(skills) ? skills : []), ...basics].filter(skill => {
      if (!skill || typeof skill.id !== 'string' || !skill.id.trim() || typeof skill.label !== 'string' || !skill.label.trim()) return false;
      const label = skill.label.trim().toLocaleLowerCase();
      if (seen.has(label) || /\b(lunge|teddy|log roll|tuck rock)\b/i.test(label)) return false;
      seen.add(label); return true;
    }).map(skill => ({ id: skill.id, label: skill.label.trim(), category: typeof skill.category === 'string' ? skill.category : '', tier: typeof skill.tier === 'string' ? skill.tier : '' }));
  }
  function create(container, supplied) {
    let options = supplied || {}, pool = catalogue(options.skills), active = true, destroyed = false, phase = 'setup';
    let names = NAMES.slice(), sizes = NAMES.map(()=>'5'), teamCount = 2, teams = [], order = [], turn = 0;
    let choices = [], previousChoices = [], awardValue = 0, awardedTeam = null, resetPrompt = false, error = '', status = '', generation = 0, stage = null;
    let session = null, completionSent = false, podium = null;
    const teamIndex = () => order[turn] ?? 0;
    const gymnast = () => teams.length ? teams[teamIndex()].turns + (['awarded', 'finished'].includes(phase) ? 0 : 1) : 0;
    const completed = () => teams.reduce((n, team) => n + team.turns, 0);
    const sound = payload => { try { options.playSound?.(payload); } catch (_) {} };
    const reduced = () => { try { return !!(typeof options.motionOff === 'function' ? options.motionOff() : options.motionOff) || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch (_) { return true; } };
    const showStage = () => stage?.scrollIntoView?.({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });
    function button(text, action, className = 'swl-addon-button swl-addon-secondary') {
      const node = el('button', className, text), token = generation; node.type = 'button'; node.dataset.addonAction = action;
      node.addEventListener('click', () => { if (token === generation) perform(action); }); return node;
    }
    function notifyComplete(details={}) {
      if (phase !== 'finished' || completionSent || !session) return;
      completionSent = true;
      try { options.onComplete?.({ gameId: 'addon', sessionId: session, participantCount: order.length, ...(details.promptRating===false?{promptRating:false}:{}) }); } catch (_) {}
    }
    function drawChoices() {
      const team = teams[teamIndex()], count = team.chain.length ? 3 : 1;
      const used = new Set(team.chain.map(skill => skill.label.toLocaleLowerCase()));
      const old = new Set(previousChoices.map(skill => skill.id));
      let eligible = pool.filter(skill => !used.has(skill.label.toLocaleLowerCase()) && !old.has(skill.id));
      if (eligible.length < count) eligible = pool.filter(skill => !used.has(skill.label.toLocaleLowerCase()));
      if (eligible.length < count) eligible = pool.filter(skill => !old.has(skill.id));
      if (eligible.length < count) eligible = pool;
      choices = shuffle(eligible).slice(0, count); previousChoices = choices.slice();
    }
    function prepareTurn() {
      phase = 'choosing'; awardValue = 0; awardedTeam = null; previousChoices = []; drawChoices();
      const team = teams[teamIndex()]; status = `${team.name}, gymnast ${gymnast()} of ${team.size}. ${team.chain.length ? 'Coach, choose one skill to add.' : 'Choose your starting skill.'}`;
    }
    function start(replay = false) {
      if (phase !== 'setup' && !(phase === 'finished' && replay)) return;
      podium?.destroy();podium=null;
      if (!replay) {
        const chosen = names.slice(0, teamCount).map((name, index) => safeName(name) || NAMES[index]);
        if (new Set(chosen.map(name => name.toLocaleLowerCase())).size !== teamCount) { error = 'Give each team a different name.'; render(); return; }
        const counts = sizes.slice(0, teamCount).map(sizeOf);
        if (counts.some(size => size === null)) { error = 'Enter a whole number from 1 to 20 gymnasts for each team.'; render(); return; }
        teams = chosen.map((name, index) => ({ name, size: counts[index], color: COLORS[index], score: 0, turns: 0, chain: [] }));
      } else teams = teams.map(team => ({ ...team, score: 0, turns: 0, chain: [] }));
      order = Array.from({ length: Math.max(...teams.map(team => team.size)) }, (_, n) => teams.flatMap((team, index) => n < team.size ? [index] : [])).flat();
      session = sessionId(); completionSent = false; turn = 0; resetPrompt = false; error = ''; prepareTurn(); render(true); showStage();
    }
    function choose(index) {
      if (phase !== 'choosing' || !Number.isInteger(index) || !choices[index]) return;
      const skill = choices[index]; teams[teamIndex()].chain.push({ ...skill }); choices = []; phase = 'perform';
      status = `${teams[teamIndex()].name}: perform the whole ${teams[teamIndex()].chain.length}-skill routine, in order.`;
      render(true); showStage(); sound({ kind: 'choice' });
    }
    function grade(stars) {
      if (phase !== 'perform' || ![1, 2, 3].includes(stars)) return;
      const team = teams[teamIndex()]; team.score += stars; team.turns++; awardValue = stars; awardedTeam = teamIndex(); phase = 'awarded';
      status = `${team.name} earns ${stars} ${stars === 1 ? 'star' : 'stars'} for the whole routine.`; render(true); sound({ kind: 'award', stars, perfect: stars === 3 });
    }
    function undo() {
      if (!['awarded', 'finished'].includes(phase) || !awardValue || awardedTeam === null) return;
      podium?.finish(true);podium?.destroy();podium=null;
      const team = teams[awardedTeam]; team.score -= awardValue; team.turns--; awardValue = 0; awardedTeam = null; phase = 'perform';
      status = 'Last grade undone. The same gymnast can perform the same routine again.'; render(true);
    }
    function next() {
      if (phase !== 'awarded') return;
      if (turn + 1 >= order.length) {
        phase = 'finished'; status = 'Everyone has had one turn. Highest average stars per gymnast wins.';
        const entries=teams.map((team,index)=>({id:String(index),name:team.name,color:team.color,value:team.score/team.size,unit:'stars per gymnast',detail:`${team.score} total stars`,rank:1+teams.filter(other=>other.score*team.size>team.score*other.size).length}));
        podium=window.SWLShuffleShowcase.createPodium(entries,{motionOff:reduced,sound,onDone:details=>{render(true);notifyComplete(details);}});render(true);showStage();podium.start();return;
      }
      turn++; prepareTurn(); render(true); showStage();
    }
    function reset() {
      podium?.finish(true);podium?.destroy();podium=null;
      phase = 'setup'; teams = []; order = []; turn = 0; choices = previousChoices = []; awardValue = 0; awardedTeam = null; resetPrompt = false; error = status = ''; session = null; completionSent = false; render(true);
    }
    function perform(action) {
      if (destroyed || !active || document.hidden) return;
      if (resetPrompt) { if (action === 'confirm-reset') reset(); else if (action === 'cancel-reset') { resetPrompt = false; render(true); } return; }
      if (phase === 'setup') {
        if (/^teams-[2-5]$/.test(action)) { teamCount = Number(action.slice(6)); error = ''; render(false, action); return; }
        const step = action.match(/^size-(\d)-(less|more)$/);
        if (step && Number(step[1]) < teamCount) { const index = Number(step[1]), n = sizeOf(sizes[index]); sizes[index] = String(n === null ? 5 : Math.min(20, Math.max(1, n + (step[2] === 'more' ? 1 : -1)))); error = ''; render(false, action); return; }
      }
      if (action === 'start-game') start();
      else if (action.startsWith('choose-')) choose(Number(action.slice(7)));
      else if (action === 'redraw' && phase === 'choosing') { drawChoices(); status = 'Fresh options. Coach, choose a familiar skill.'; render(true); }
      else if (action.startsWith('grade-')) grade(Number(action.slice(6)));
      else if (action === 'next') next();
      else if (action === 'undo') undo();
      else if (action === 'replay') start(true);
      else if (action === 'reset') { if (phase === 'setup' || phase === 'finished') reset(); else { resetPrompt = true; render(true); } }
    }
    function setup(root) {
      const panel = el('section', 'swl-addon-setup');
      panel.append(el('p', 'swl-addon-kicker', 'ONE MORE SKILL · EVERY GYMNAST'), el('h3', '', 'Build it together.'), el('p', 'swl-addon-muted', 'Each team builds its own routine. Every gymnast adds a skill, then performs the whole chain.'));
      panel.append(window.SWLShuffleShowcase.teamCountView(teamCount,5,value=>{perform(`teams-${value}`);container.querySelector('[data-game-team-count]')?.focus();},'Number of Add-On teams'));
      const fields = el('div', 'swl-addon-fields');
      for (let index = 0; index < teamCount; index++) {
        const row = el('div', 'swl-addon-field-row'); row.style.setProperty('--squad-color', COLORS[index]);
        const label = el('label', 'swl-addon-name'); label.append(el('span', '', `Team ${index + 1}`));
        const input = el('input'); input.type = 'text'; input.value = names[index]; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.addonName = String(index); input.setAttribute('aria-label', `Add-On team ${index + 1} name`); input.addEventListener('input', () => { if (active && !destroyed && phase === 'setup') names[index] = input.value; }); label.append(input);
        const size = el('div', 'swl-addon-size'); size.append(el('span', '', 'Gymnasts')); const controls = el('div', 'swl-addon-stepper');
        const number = el('input'); number.type = 'number'; number.min = '1'; number.max = '20'; number.step = '1'; number.inputMode = 'numeric'; number.value = sizes[index]; number.dataset.addonSize = String(index); number.setAttribute('aria-label', `Add-On team ${index + 1} gymnast count`); number.addEventListener('input', () => { if (active && !destroyed && phase === 'setup') sizes[index] = number.value; });
        const less = button('−', `size-${index}-less`, 'swl-addon-step'), more = button('+', `size-${index}-more`, 'swl-addon-step'); less.setAttribute('aria-label', `Fewer gymnasts in team ${index + 1}`); more.setAttribute('aria-label', `More gymnasts in team ${index + 1}`); controls.append(less, number, more); size.append(controls); row.append(label, size); fields.append(row);
      }
      const errors = el('p', 'swl-addon-error', error); errors.setAttribute('role', 'alert'); panel.append(fields, errors, button('Start building ↗', 'start-game', 'swl-addon-button swl-addon-primary'));
      const guide = el('aside', 'swl-addon-guide'); guide.append(el('span', 'swl-addon-icon', '+'), el('h3', '', 'Remember. Add. Perform.'), el('p', '', 'Start with one familiar skill. On each return, the coach chooses one of three new options to add. The next gymnast performs every skill in order.'), el('p', '', 'Coach grades the whole routine: 1 star poor, 2 okay, 3 clean.'), el('p', 'swl-addon-fair-rule', 'Highest average wins: total stars ÷ gymnasts. Every gymnast gets one turn, even with different-sized teams.'), el('p', 'swl-addon-session-note', 'Choose familiar skills and comfortable links. Game stars stay here; Skill League marks and points stay the same.'));
      const grid = el('div', 'swl-addon-setup-grid'); grid.append(panel, guide); root.append(grid);
    }
    function scoreboard(root) {
      const board = el('div', 'swl-addon-board'); board.dataset.teamCount = String(teams.length);board.style.setProperty('--game-teams',String(teams.length)); board.setAttribute('aria-label', 'Add-On team scoreboard');
      teams.forEach((team, index) => {
        const card = el('div', `swl-addon-score${phase !== 'finished' && index === teamIndex() ? ' is-current' : ''}`); card.style.setProperty('--squad-color', team.color);
        card.append(el('span', 'swl-addon-score-name', team.name), el('strong', '', average(team)), el('span', 'swl-addon-score-unit', `avg stars / gymnast${phase === 'finished' ? '' : ' so far'}`), el('span', 'swl-addon-score-detail', `${team.score} total ${team.score === 1 ? 'star' : 'stars'} · ${team.turns}/${team.size} gymnasts`)); board.append(card);
      }); root.append(board, el('p', 'swl-addon-fair-note', 'Highest average wins · each team keeps its own routine.'));
    }
    function chainView(parent, team) {
      const wrap = el('section', 'swl-addon-chain'); wrap.setAttribute('aria-label', `${team.name}’s routine`);
      const heading = el('div', 'swl-addon-chain-heading'); heading.append(el('h4', '', `${team.name}’s routine`), el('span', '', `${team.chain.length} ${team.chain.length === 1 ? 'skill' : 'skills'}`)); wrap.append(heading);
      if (!team.chain.length) wrap.append(el('p', 'swl-addon-muted', 'Your first skill starts the chain.'));
      else {
        const list = el('ol', 'swl-addon-chain-list');
        team.chain.forEach((skill, index) => { const item = el('li', index === team.chain.length - 1 && phase !== 'choosing' ? 'is-new' : ''); item.append(el('span', 'swl-addon-chain-number', String(index + 1)), el('span', 'swl-addon-chain-label', skill.label)); if (index === team.chain.length - 1 && phase === 'perform') item.append(el('span', 'swl-addon-new-tag', 'NEW')); list.append(item); }); wrap.append(list);
      }
      parent.append(wrap);
    }
    function gameView(root) {
      const team = teams[teamIndex()];
      const progress = el('div', 'swl-addon-progress'); progress.append(el('span', '', `${completed()} / ${order.length} GYMNASTS COMPLETE`), el('span', '', `${teams.length} TEAMS`)); root.append(progress);
      const track = el('div', 'swl-addon-progress-track'), fill = el('span'); track.setAttribute('role', 'progressbar'); track.setAttribute('aria-label', 'Gymnasts who completed their turn'); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', String(order.length)); track.setAttribute('aria-valuenow', String(completed())); fill.style.width = `${completed() / order.length * 100}%`; track.append(fill); root.append(track);
      stage = el('section', 'swl-addon-stage'); stage.tabIndex = -1; stage.style.setProperty('--squad-color', team.color);
      stage.append(el('p', 'swl-addon-turn', `${team.name}’s turn`), el('p', 'swl-addon-gymnast', `Gymnast ${gymnast()} of ${team.size}`));
      if (phase === 'choosing') {
        stage.append(el('h3', '', team.chain.length ? 'One more. Make it yours.' : 'Your routine starts here.'), el('p', 'swl-addon-muted', team.chain.length ? 'Coach, choose one familiar skill to add to this team’s routine.' : 'Coach, use this familiar starting skill or draw another.'));
        const cards = el('div', 'swl-addon-choices'); cards.dataset.count = String(choices.length);
        choices.forEach((skill, index) => { const card = button('', `choose-${index}`, 'swl-addon-choice'); card.dataset.skillId = skill.id; card.append(el('span', 'swl-addon-choice-kicker', team.chain.length ? `OPTION ${index + 1}` : 'STARTING SKILL'), el('b', '', skill.label), el('span', 'swl-addon-choice-category', skill.category === 'rolls' ? 'Rolls' : skill.category === 'acro' ? 'Acro & spins' : skill.category === 'leaps' ? 'Leaps' : skill.category === 'handstands' ? 'Handstands' : skill.category), el('span', 'swl-addon-choice-cta', team.chain.length ? 'Add this skill +' : 'Use this skill →')); cards.append(card); });
        stage.append(cards, button(team.chain.length ? 'Draw three fresh options ↻' : 'Draw another starting skill ↻', 'redraw', 'swl-addon-text-button')); chainView(stage, team);
      } else {
        stage.append(el('h3', '', phase === 'awarded' ? 'Routine rated.' : 'Now show the whole chain.'), el('p', 'swl-addon-muted', 'Perform every skill below in order. The coach grades this whole attempt.')); chainView(stage, team);
        if (phase === 'perform') {
          const grades = el('div', 'swl-addon-grades'); grades.setAttribute('role', 'group'); grades.setAttribute('aria-label', 'Coach grades the whole routine');
          [[1, 'Poor'], [2, 'Okay'], [3, 'Clean']].forEach(([stars, label]) => { const card = button('', `grade-${stars}`, 'swl-addon-grade'); card.setAttribute('aria-label', `${stars} ${stars === 1 ? 'star' : 'stars'}: ${label}`); card.append(el('span', '', '★'.repeat(stars)), el('b', '', label), el('small', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`)); grades.append(card); }); stage.append(el('p', 'swl-addon-kicker', 'COACH · GRADE THE WHOLE ROUTINE'), grades);
        } else {
          const controls = el('div', 'swl-addon-controls'); controls.append(el('p', 'swl-addon-award', `${'★'.repeat(awardValue)} +${awardValue} ${awardValue === 1 ? 'star' : 'stars'}`), button(turn + 1 === order.length ? 'See the results ↗' : `Next: ${teams[order[turn + 1]].name} →`, 'next', 'swl-addon-button swl-addon-primary'), button('Undo grade', 'undo', 'swl-addon-text-button')); stage.append(controls);
        }
      }
      root.append(stage);
    }
    function results(root) {
      if(podium){stage=el('section','swl-addon-results swl-game-podium-finish');stage.tabIndex=-1;podium.render(stage);if(podium.getState().finished){const controls=el('div','swl-addon-controls');controls.append(button('Build again +','replay','swl-addon-button swl-addon-primary'),button('Change teams','reset'),button('Undo last grade','undo','swl-addon-text-button'));stage.append(controls);}root.append(stage);return;}
      const compare = (a, b) => a.score * b.size - b.score * a.size, best = teams.reduce((a, b) => compare(b, a) > 0 ? b : a, teams[0]), winners = teams.filter(team => compare(team, best) === 0);
      stage = el('section', 'swl-addon-results'); stage.tabIndex = -1;
      stage.append(el('span', 'swl-addon-trophy', '✦'), el('p', 'swl-addon-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : 'ADD-ON WINNERS'), el('h3', '', winners.map(team => team.name).join(' + ')), el('p', 'swl-addon-result-average', `${average(best)} stars per gymnast`), el('p', 'swl-addon-muted', `All ${order.length} gymnasts had one turn. Teams ranked by total stars ÷ gymnasts.`));
      const controls = el('div', 'swl-addon-controls'); controls.append(button('Build again +', 'replay', 'swl-addon-button swl-addon-primary'), button('Change teams', 'reset'), button('Undo last grade', 'undo', 'swl-addon-text-button')); stage.append(controls); root.append(stage);
    }
    function render(focus = false, action = '') {
      if (destroyed) return; generation++; stage = null;
      const root = el('div', 'swl-addon'); root.dataset.phase = phase; root.dataset.static = String(reduced());
      const heading = el('div', 'swl-addon-heading'), titles = el('div'); titles.append(el('p', 'swl-addon-kicker', 'A ROUTINE THAT GROWS WITH YOUR TEAM'), el('h2', '', 'Add-On')); heading.append(titles); if (phase !== 'setup') heading.append(button('New game', 'reset', 'swl-addon-text-button')); root.append(heading);
      if (phase === 'setup') setup(root); else { if(phase!=='finished')scoreboard(root); if (phase === 'finished') results(root); else gameView(root); }
      const live = el('p', 'swl-addon-live', status); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.append(live);
      if (resetPrompt) {
        const prompt = el('div', 'swl-addon-reset-prompt'); prompt.setAttribute('role', 'alertdialog'); prompt.setAttribute('aria-label', 'Start a new Add-On game?');
        prompt.append(el('strong', '', 'Start a new game?'), el('p', '', 'This clears the routines and stars from this game.'), button('Keep this game', 'cancel-reset', 'swl-addon-button swl-addon-primary'), button('Clear and restart', 'confirm-reset'));
        prompt.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); perform('cancel-reset'); } else if (event.key === 'Tab') { const first = prompt.querySelector('[data-addon-action="cancel-reset"]'), last = prompt.querySelector('[data-addon-action="confirm-reset"]'); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }); root.append(prompt);
      }
      container.replaceChildren(root);
      if (focus || action) { const target = resetPrompt ? root.querySelector('[data-addon-action="cancel-reset"]') : action ? root.querySelector(`[data-addon-action="${action}"]`) : stage || root.querySelector('[data-addon-name="0"]'); try { target?.focus({ preventScroll: true }); } catch (_) {} }
    }
    const controller = {
      get destroyed() { return destroyed; },
      activate() { if (!destroyed) { active = true; render(); } },
      deactivate() { if (!destroyed) { podium?.finish(true);active = false; render(); } },
      updateOptions(next) { options = { ...options, ...(next || {}) }; if (phase === 'setup' && Array.isArray(next?.skills)) pool = catalogue(next.skills); },
      destroy() { if (destroyed) return; podium?.finish(true);podium?.destroy();podium=null;destroyed = true; active = false; container.replaceChildren(); },
      getState() { return { podium:podium?.getState()||null,phase, active, teamCount, turn, currentTeam: teams.length ? teamIndex() : null, currentGymnast: gymnast(), totalGymnasts: order.length, completedGymnasts: completed(), teams: teams.map(team => ({ ...team, average: team.turns ? team.score / team.turns : null, chain: team.chain.map(skill => ({ ...skill })) })), choices: choices.map(skill => ({ ...skill })), poolSize: pool.length, awardValue, resetPrompt, sessionId: session, completionSent }; }
    }; render(); return controller;
  }
  window.SWLAddOn = Object.freeze({
    version: 1,
    mount(container, options = {}) { if (!container || typeof container.replaceChildren !== 'function') throw Error('An Add-On game container is required.'); if (instance && !instance.destroyed && mounted === container) { instance.updateOptions(options); instance.activate(); return instance; } instance?.destroy(); mounted = container; instance = create(container, options); return instance; },
    deactivate() { instance?.deactivate(); }, destroy() { instance?.destroy(); instance = mounted = null; }, getState() { return instance?.getState() || null; }
  });
})();
