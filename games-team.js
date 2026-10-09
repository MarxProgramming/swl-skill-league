(() => {
  'use strict';
  if (window.SWLTeam?.version === 2) return;
  const DEFAULTS = ['Mint', 'Purple', 'Gold', 'Coral'];
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#ffab9e'];
  const ROUNDS = 5;
  const ROUND_MS = 10000;
  const CARDS = [
    { title: 'Floating handstand', task: 'Show one gymnast in a handstand with no floor contact.', cue: 'Only a practised, coach-led support. Floor alternative: show a long handstand shape lying down. No new lifts.', icon: '↟' },
    { title: 'Star jump together', task: 'Everyone performs one star jump at exactly the same time.', cue: 'Choose the moment together, leave space, and finish with a quiet landing. A step-out star works too.', icon: '✦' },
    { title: 'Spell MARX', task: 'Use your bodies to spell M A R X before the time is up.', cue: 'Build the letters standing, seated or lying on the floor. Everyone has a part.', icon: 'M' },
    { title: 'Headstand finish', task: 'Everyone is in their headstand shape when the boop sounds.', cue: 'Use only coach-approved, practised headstands. A familiar upright or floor balance is an equal alternative.', icon: '◇' },
    { title: 'Balance mix', task: 'Everyone chooses a different balance and holds it to the end.', cue: 'Pick familiar shapes you can control. No two shapes the same.', icon: '⋈' },
    { title: 'Split jump together', task: 'Perform one synchronised split jump as a team.', cue: 'Use a comfortable range and a controlled landing in your own space. A split-shaped step is an alternative.', icon: '↗' },
    { title: 'Connected floor star', task: 'Make one big connected star with every gymnast on the floor.', cue: 'Lie or sit in your own space and lightly connect hands or feet. Nobody supports another person’s weight.', icon: '☆' },
    { title: 'Connected floor circle', task: 'Make a connected circle with every gymnast on the floor.', cue: 'Sit or lie in a ring with a light hand or foot connection. Keep everyone comfortable.', icon: '◯' },
    { title: 'Mirror balances', task: 'Make matching balances in pairs, like reflections in a mirror.', cue: 'An odd-numbered team can make a trio. Hold your own weight and match the shapes.', icon: '↔' },
    { title: 'Shape dominoes', task: 'Send a shape along the team, one gymnast after another.', cue: 'Choose tuck, pike or star. The last gymnast finishes the wave before the boop.', icon: '⋮' },
    { title: 'Giant floor arrow', task: 'Use the whole team to make one giant arrow on the floor.', cue: 'Choose seated or lying shapes. Point the arrow towards the coach.', icon: '➜' },
    { title: 'Tuck, pike, star', task: 'Show tuck, pike and star shapes in perfect team unison.', cue: 'Choose standing or seated versions. Finish together in your star.', icon: '✧' },
    { title: 'Level ladder', task: 'Create a team picture with low, middle and tall shapes.', cue: 'Use lying, seated, kneeling or standing shapes. Each gymnast holds their own position.', icon: '▥' },
    { title: 'Quiet landing', task: 'Do one small straight jump together and freeze the landing.', cue: 'Leave space and land softly. A rise onto toes and lower is an equal alternative.', icon: '↓' },
    { title: 'Pointed-toe gallery', task: 'Make a floor gallery of different shapes with pointed toes.', cue: 'Try familiar seated or lying shapes. Show a different outline from the person beside you.', icon: '⌁' },
    { title: 'Arabesque line', task: 'Make a line of matching arabesque-style balances.', cue: 'Choose a comfortable leg height. A toe resting on the floor is welcome.', icon: '━' },
    { title: 'Rock and freeze', task: 'Rock once in a tucked floor shape, then freeze together.', cue: 'Use your own clear space and a familiar small rock. A seated tuck without rocking works too.', icon: '⌒' },
    { title: 'Arm ripple', task: 'Send one smooth arm wave along the whole team.', cue: 'Stay in your own standing or seated space. Finish with everyone in a matching shape.', icon: '≈' },
    { title: 'Human compass', task: 'Make a group compass with everyone pointing a different way.', cue: 'Keep feet or seats on the floor. Use long arms and clear directions.', icon: '✣' },
    { title: 'Longest floor line', task: 'Create one long, tidy line of team shapes on the floor.', cue: 'Sit or lie next to each other with space. Line up fingertips or toes without pulling.', icon: '—' },
    { title: 'Tiny to tall', task: 'Grow from a tiny shape to a tall shape in complete unison.', cue: 'Move slowly from a comfortable low shape. Finish still, with everyone reaching together.', icon: '↕' },
    { title: 'Symmetry squad', task: 'Make a team picture that matches on both sides.', cue: 'Choose a centre point and mirror your teammates. Keep every shape on the floor or standing.', icon: '⋄' }
  ];
  const cleanName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')).slice(0, 24).join('');
  let instance = null, mountedContainer = null;

  function createGame(container, initialOptions) {
    let options = initialOptions || {}, active = true, destroyed = false;
    let phase = 'setup', teamCount = 2, names = DEFAULTS.slice();
    let teams = [], turn = 0, card = null, deck = [], awardedStars = 0;
    let remainingMs = 0, timer = null, lastTick = 0, observedSeconds = 10, timerGeneration = 0;
    let statusText = '', errorText = '', resetPrompt = false, wasPlayingBeforePrompt = false;
    let clockNumber = null, clockText = null, clockFace = null, stage = null;
    const now = () => typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const motionOff = () => {
      let preference = false;
      try { preference = typeof options.motionOff === 'function' ? options.motionOff() : Boolean(options.motionOff); } catch (_) {}
      return preference || Boolean(media?.matches);
    };
    function node(tag, className, text) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    }
    function button(label, action, className = 'swl-team-button', disabled = false) {
      const element = node('button', className, label);
      element.type = 'button'; element.disabled = disabled;
      element.dataset.teamAction = action;
      element.addEventListener('click', () => perform(action));
      return element;
    }
    function sound(payload) { try { options.playSound?.(payload); } catch (_) {} }
    function showStage() { stage?.scrollIntoView?.({ block: 'start', behavior: motionOff() ? 'instant' : 'smooth' }); }
    function showClock() { clockFace?.scrollIntoView?.({ block: 'center', behavior: motionOff() ? 'instant' : 'smooth' }); }
    function cancelTimer() { timerGeneration++; clearTimeout(timer); timer = null; }
    function syncTime() {
      if (phase !== 'playing' || remainingMs <= 0) return;
      const next = now(); remainingMs = Math.max(0, remainingMs - Math.max(0, next - lastTick)); lastTick = next;
    }
    function displayClock() {
      if (clockNumber) clockNumber.textContent = String(Math.ceil(remainingMs / 1000)).padStart(2, '0');
      if (clockText) clockText.textContent = phase === 'paused' ? 'Paused' : phase === 'ready' ? 'Ready when you are' : remainingMs > 0 ? 'seconds left' : 'Time!';
      if (clockFace) { clockFace.dataset.final = String(phase === 'playing' && remainingMs <= 3000); clockFace.dataset.paused = String(phase === 'paused'); }
    }
    function scheduleTick() {
      cancelTimer();
      if (!active || destroyed || phase !== 'playing' || remainingMs <= 0) return;
      const generation = timerGeneration;
      timer = setTimeout(() => {
        if (generation !== timerGeneration || !active || destroyed || phase !== 'playing') return;
        timer = null;
        if (document.hidden) { pause(); render(); return; }
        syncTime(); const seconds = Math.ceil(remainingMs / 1000); displayClock();
        // A delayed callback emits only the current cue, never a burst of missed tones.
        if (seconds > 0 && seconds <= 3 && seconds < observedSeconds) sound({ kind: 'countdown', remaining: seconds });
        observedSeconds = seconds;
        if (remainingMs <= 0) { phase = 'review'; statusText = 'Time! Coach, award the teamwork stars.'; render(true); sound({ kind: 'timer-end' }); }
        else scheduleTick();
      }, Math.min(remainingMs, remainingMs % 1000 || 1000));
    }
    function pause() {
      if (phase !== 'playing' || remainingMs <= 0) return false;
      syncTime(); cancelTimer();
      observedSeconds = Math.ceil(remainingMs / 1000);
      if (remainingMs > 0) { phase = 'paused'; statusText = 'Round paused. Resume when your team is ready.'; }
      else { phase = 'review'; statusText = 'Time! Coach, award the teamwork stars.'; }
      return true;
    }
    function drawCard() {
      if (!deck.length) {
        deck = CARDS.map((_, index) => index);
        for (let index = deck.length - 1; index > 0; index--) {
          const other = Math.floor(Math.random() * (index + 1));
          [deck[index], deck[other]] = [deck[other], deck[index]];
        }
      }
      card = { ...CARDS[deck.pop()] };
    }
    function prepareTurn() {
      cancelTimer(); awardedStars = 0; remainingMs = ROUND_MS; observedSeconds = 10;
      phase = 'ready'; drawCard(); statusText = `${teams[turn % teams.length].name}, read the challenge together. Coach, press Go when everyone is ready.`;
    }
    function startGame(replay = false) {
      if (destroyed || !active || (phase !== 'setup' && !(replay && phase === 'finished'))) return;
      if (!replay) {
        const chosen = names.slice(0, teamCount).map((name, index) => cleanName(name) || DEFAULTS[index]);
        if (new Set(chosen.map(name => name.toLocaleLowerCase())).size !== chosen.length) {
          errorText = 'Give each team a different name so the scoreboard stays clear.'; render(); return;
        }
        teams = chosen.map((name, index) => ({ name, color: COLORS[index], score: 0, turns: 0 }));
      } else teams = teams.map(team => ({ ...team, score: 0, turns: 0 }));
      turn = 0; deck = []; resetPrompt = false; errorText = ''; prepareTurn(); render(true); showStage();
    }
    function startTurn() {
      if (phase !== 'ready' || !active || resetPrompt) return;
      phase = 'playing'; lastTick = now(); statusText = 'Go! Ten seconds to make it happen together.';
      render(true); showClock(); scheduleTick();
    }
    function resume() {
      if (phase !== 'paused' || !active || resetPrompt) return;
      phase = 'playing'; lastTick = now(); statusText = 'Round resumed. Work together.'; render(true); showClock(); scheduleTick();
    }
    function award(stars) {
      if (!active || destroyed || resetPrompt || phase !== 'review' || !Number.isInteger(stars) || stars < 1 || stars > 3) return;
      cancelTimer();
      const team = teams[turn % teams.length]; team.score += stars; team.turns++; awardedStars = stars; phase = 'awarded';
      statusText = `${team.name} earns ${stars} ${stars === 1 ? 'star' : 'stars'}.`;
      render(true); sound({ kind: 'award', stars, perfect: stars === 3 });
    }
    function nextTurn() {
      if (!active || phase !== 'awarded' || resetPrompt) return;
      if (turn + 1 >= teams.length * ROUNDS) { phase = 'finished'; statusText = 'Five rounds complete. Celebrate the teamwork.'; render(true); showStage(); sound({ kind: 'finish', perfect: true }); return; }
      turn++; prepareTurn(); render(true); showStage();
    }
    function undoAward() {
      if (!active || phase !== 'awarded' || resetPrompt || !awardedStars) return;
      const team = teams[turn % teams.length]; team.score -= awardedStars; team.turns--; awardedStars = 0;
      phase = 'review';
      statusText = 'Award undone. Coach, choose the stars again.'; render(true);
    }
    function requestReset() {
      if (destroyed || !active || resetPrompt) return;
      if (phase === 'setup' || phase === 'finished') { reset(); return; }
      wasPlayingBeforePrompt = pause() && phase === 'paused'; resetPrompt = true; render(true);
    }
    function reset() {
      cancelTimer(); phase = 'setup'; teams = []; turn = 0; card = null; deck = []; awardedStars = 0; remainingMs = 0;
      resetPrompt = false; wasPlayingBeforePrompt = false; statusText = ''; errorText = ''; render(true);
    }
    function perform(action) {
      if (destroyed || !active || document.hidden) return;
      if (action.startsWith('count-') && phase === 'setup') {
        const count = Number(action.slice(6)); if ([2, 3, 4].includes(count)) { teamCount = count; errorText = ''; render(); } return;
      }
      if (action.startsWith('award-')) { award(Number(action.slice(6))); return; }
      if (action === 'start-game') startGame();
      else if (action === 'start-turn') startTurn();
      else if (action === 'change-card' && phase === 'ready' && !resetPrompt) { drawCard(); statusText = 'New challenge ready. Coach, read it together before Go.'; render(true); showStage(); }
      else if (action === 'resume') resume();
      else if (action === 'pause' && pause()) render(true);
      else if (action === 'next') nextTurn();
      else if (action === 'undo') undoAward();
      else if (action === 'reset') requestReset();
      else if (action === 'confirm-reset' && resetPrompt) reset();
      else if (action === 'cancel-reset' && resetPrompt) {
        resetPrompt = false;
        if (wasPlayingBeforePrompt) statusText = 'Round paused. Resume when your team is ready.';
        wasPlayingBeforePrompt = false; render(true);
      } else if (action === 'replay') startGame(true);
    }
    function setupView(root) {
      const panel = node('section', 'swl-team-setup');
      panel.append(node('p', 'swl-team-kicker', '22 CARDS · ONE TEAM SPIRIT'), node('h3', '', 'Choose your squads'), node('p', 'swl-team-muted', 'Read the card together. Press Go. You have ten seconds to make it happen.'));
      const count = node('div', 'swl-team-count'); count.setAttribute('role', 'group'); count.setAttribute('aria-label', 'Number of teams');
      [2, 3, 4].forEach(value => { const control = button(`${value} teams`, `count-${value}`, 'swl-team-choice'); control.setAttribute('aria-pressed', String(teamCount === value)); count.append(control); });
      const fields = node('div', 'swl-team-names');
      for (let index = 0; index < teamCount; index++) {
        const label = node('label', 'swl-team-name'); label.style.setProperty('--team-color', COLORS[index]);
        label.append(node('span', '', `Team ${index + 1}`));
        const input = node('input'); input.type = 'text'; input.value = names[index]; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.teamName = String(index);
        input.setAttribute('aria-label', `Team ${index + 1} name`);
        input.addEventListener('input', () => { names[index] = input.value; }); label.append(input); fields.append(label);
      }
      const error = node('p', 'swl-team-error', errorText); error.setAttribute('role', 'alert');
      panel.append(count, fields, error, button('Draw the first challenge ↗', 'start-game', 'swl-team-button swl-team-primary'));
      const rules = node('aside', 'swl-team-rules'); rules.append(node('span', 'swl-team-rule-icon', '10'), node('h3', '', 'Seconds to shine'), node('p', '', 'Five challenges per team. A quiet start, three countdown tones, then a finish boop. After each challenge, the coach awards 1, 2 or 3 stars for teamwork.'), node('p', 'swl-team-muted', 'Choose familiar shapes and leave space. Team names and stars stay in this session; Skill League points stay the same.'));
      const grid = node('div', 'swl-team-setup-grid'); grid.append(panel, rules); root.append(grid);
    }
    function scoreboard(root) {
      const board = node('div', 'swl-team-board'); board.setAttribute('aria-label', 'Team scoreboard');
      teams.forEach((team, index) => {
        const item = node('div', `swl-team-score${phase !== 'finished' && index === turn % teams.length ? ' is-current' : ''}`); item.style.setProperty('--team-color', team.color);
        item.append(node('span', 'swl-team-score-name', team.name), node('strong', '', String(team.score)), node('span', 'swl-team-score-unit', `${team.score === 1 ? 'star' : 'stars'} · ${team.turns}/${ROUNDS} rounds`)); board.append(item);
      }); root.append(board);
    }
    function playView(root) {
      const team = teams[turn % teams.length], round = Math.floor(turn / teams.length) + 1;
      const progress = node('div', 'swl-team-progress'); progress.append(node('span', '', `ROUND ${round} / ${ROUNDS}`), node('span', '', `TEAM ${turn % teams.length + 1} / ${teams.length}`));
      const track = node('div', 'swl-team-track'); const bar = node('span'); bar.style.width = `${(turn + (phase === 'awarded' ? 1 : 0)) / (teams.length * ROUNDS) * 100}%`; track.append(bar); root.append(progress, track);
      stage = node('section', 'swl-team-stage'); stage.style.setProperty('--team-color', team.color); stage.tabIndex = -1;
      const top = node('div', 'swl-team-stage-top'); top.append(node('p', 'swl-team-turn-name', `${team.name}’s turn`), node('span', 'swl-team-card-symbol', card.icon));
      const body = node('div', 'swl-team-challenge'); const text = node('div', 'swl-team-card-copy');
      text.append(node('p', 'swl-team-card-step', phase === 'ready' ? 'READ TOGETHER · THEN GO' : phase === 'paused' ? 'TAKE A BREATHER' : ['review', 'awarded'].includes(phase) ? 'CHALLENGE COMPLETE' : 'MAKE IT HAPPEN'));
      text.append(node('h3', '', card.title), node('p', 'swl-team-task', card.task), node('p', 'swl-team-muted swl-team-coach-hint', card.cue));
      clockFace = node('div', 'swl-team-clock'); clockFace.setAttribute('role', 'timer'); clockFace.setAttribute('aria-live', 'off');
      clockNumber = node('b'); clockText = node('span'); clockFace.append(clockNumber, clockText); displayClock();
      body.append(text, clockFace); stage.append(top, body);
      const actionArea = node('div', 'swl-team-turn-controls');
      if (phase === 'ready') actionArea.append(button('Go · 10 seconds →', 'start-turn', 'swl-team-button swl-team-primary swl-team-go'), button('Change card ↻', 'change-card', 'swl-team-text-button'));
      else if (phase === 'paused') actionArea.append(button('Resume round ▶', 'resume', 'swl-team-button swl-team-primary'));
      else if (phase === 'playing') actionArea.append(button('Pause Ⅱ', 'pause', 'swl-team-button swl-team-secondary'));
      else if (phase === 'review') actionArea.append(node('p', 'swl-team-review-note', 'Time! Coach, choose the teamwork stars.'));
      if (phase === 'awarded') {
        const awardLabel = node('p', 'swl-team-award-result', `${'★'.repeat(awardedStars)}  +${awardedStars} ${awardedStars === 1 ? 'star' : 'stars'}`); actionArea.append(awardLabel, button(turn + 1 === teams.length * ROUNDS ? 'See the results ↗' : `Next: ${teams[(turn + 1) % teams.length].name} →`, 'next', 'swl-team-button swl-team-primary'), button('Undo award', 'undo', 'swl-team-text-button'));
      }
      stage.append(actionArea);
      const award = node('div', 'swl-team-awards'); award.setAttribute('role', 'group'); award.setAttribute('aria-label', 'Coach awards teamwork stars');
      [1, 2, 3].forEach(stars => { const control = button('', `award-${stars}`, 'swl-team-award', phase !== 'review' || resetPrompt); control.setAttribute('aria-label', `Award ${stars} ${stars === 1 ? 'star' : 'stars'}`); control.append(node('span', '', '★'.repeat(stars)), node('b', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`), node('small', '', ['Working together', 'Strong teamwork', 'In sync, all together'][stars - 1])); award.append(control); });
      stage.append(node('p', 'swl-team-awards-label', 'COACH’S STARS · CONTROL + TIMING + ENCOURAGEMENT'), award); root.append(stage);
    }
    function finishView(root) {
      const high = Math.max(...teams.map(team => team.score)); const winners = teams.filter(team => team.score === high);
      const result = node('section', 'swl-team-finish'); result.tabIndex = -1; stage = result;
      result.append(node('div', 'swl-team-trophy', '✦'), node('p', 'swl-team-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : 'TEAM CHALLENGE CHAMPIONS'), node('h3', '', winners.map(team => team.name).join(' + ')), node('p', 'swl-team-winner-points', `${high} ${high === 1 ? 'star' : 'stars'}`), node('p', 'swl-team-muted', winners.length === teams.length ? 'A team effort all round. Everyone finishes together.' : winners.length > 1 ? 'A brilliant tie. Celebrate both the effort and the teamwork.' : 'Control, rhythm and encouragement — that is a winning team.'));
      const actions = node('div', 'swl-team-finish-actions'); actions.append(button('Play again ↻', 'replay', 'swl-team-button swl-team-primary'), button('Change teams', 'reset', 'swl-team-button swl-team-secondary')); result.append(actions); root.append(result);
    }
    function render(focus = false) {
      if (destroyed) return;
      clockNumber = null; clockText = null; clockFace = null; stage = null;
      const root = node('div', 'swl-team'); root.dataset.static = String(motionOff()); root.dataset.phase = phase;
      const head = node('div', 'swl-team-heading'); const titles = node('div'); titles.append(node('p', 'swl-team-kicker', 'ONE CARD · TEN SECONDS · TOGETHER'), node('h2', '', 'Team Challenge'));
      head.append(titles); if (phase !== 'setup') head.append(button('New game', 'reset', 'swl-team-text-button')); root.append(head);
      if (phase === 'setup') setupView(root);
      else { scoreboard(root); if (phase === 'finished') finishView(root); else playView(root); }
      const live = node('p', 'swl-team-live', statusText); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.append(live);
      if (resetPrompt) {
        const confirm = node('div', 'swl-team-reset-prompt'); confirm.setAttribute('role', 'alertdialog'); confirm.setAttribute('aria-label', 'Start a new team game?');
        confirm.append(node('strong', '', 'Start a new game?'), node('p', '', 'This clears the stars from this team game.'), button('Keep this game', 'cancel-reset', 'swl-team-button swl-team-primary'), button('Clear and restart', 'confirm-reset', 'swl-team-button swl-team-secondary')); root.append(confirm);
      }
      container.replaceChildren(root);
      if (focus) { const target = resetPrompt ? root.querySelector('[data-team-action="cancel-reset"]') : phase === 'paused' ? root.querySelector('[data-team-action="resume"]') : stage; try { target?.focus({ preventScroll: true }); } catch (_) {} }
    }
    function deactivate() {
      if (destroyed) return;
      pause(); active = false; cancelTimer(); render();
    }
    function activate() { if (destroyed) return; active = true; render(); }
    function onVisibility() { if (document.hidden) { pause(); cancelTimer(); render(); } }
    document.addEventListener('visibilitychange', onVisibility);
    const controller = {
      deactivate, activate,
      get destroyed() { return destroyed; },
      updateOptions(next) { options = next || {}; },
      destroy() { if (destroyed) return; destroyed = true; active = false; cancelTimer(); document.removeEventListener('visibilitychange', onVisibility); container.replaceChildren(); },
      getState() { return { phase, active, teamCount, timerSeconds: ROUND_MS / 1000, cardCount: CARDS.length, turn, round: teams.length ? Math.min(ROUNDS, Math.floor(turn / teams.length) + 1) : 0, teams: teams.map(team => ({ ...team })), card: card ? { ...card } : null, remainingMs, awardedStars, resetPrompt }; }
    };
    render(); return controller;
  }
  window.SWLTeam = Object.freeze({
    version: 2,
    mount(container, options = {}) {
      if (!container || typeof container.replaceChildren !== 'function') throw Error('A team game container is required.');
      if (instance && !instance.destroyed && mountedContainer === container) { instance.updateOptions(options); instance.activate(); return instance; }
      instance?.destroy(); mountedContainer = container; instance = createGame(container, options); return instance;
    },
    deactivate() { instance?.deactivate(); },
    destroy() { instance?.destroy(); instance = null; mountedContainer = null; }
  });
})();
