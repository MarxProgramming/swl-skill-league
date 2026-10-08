(() => {
  'use strict';
  if (window.SWLTeam?.version === 1) return;
  const DEFAULTS = ['Mint', 'Purple', 'Gold', 'Coral'];
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#ffab9e'];
  const ROUNDS = 5;
  const CARDS = [
    { title: 'Synchronised squats', task: '10 squats together', cue: 'Find one rhythm. Start and finish as a team.', icon: '↕', count: '10', unit: 'together' },
    { title: 'Balance squad', task: '10 seconds on one leg', cue: 'Stand tall, choose your balance, and support each other.', icon: '◇', count: '10', unit: 'seconds' },
    { title: 'Plank crew', task: '15-second plank', cue: 'Keep a controlled shape. Knees down is welcome.', icon: '━', count: '15', unit: 'seconds' },
    { title: 'Star jump sync', task: '10 star jumps together', cue: 'Match the timing and finish together. Step out if preferred.', icon: '✦', count: '10', unit: 'together' },
    { title: 'Hollow hold', task: '10-second hollow hold', cue: 'Use a shape you can control. Bent knees are welcome.', icon: '⌒', count: '10', unit: 'seconds' },
    { title: 'Quick feet', task: '15 seconds of quick feet', cue: 'Stay in your own space. Light steps, team energy.', icon: '⋮', count: '15', unit: 'seconds' }
  ];
  const cleanName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')).slice(0, 24).join('');
  let instance = null, mountedContainer = null;

  function createGame(container, initialOptions) {
    let options = initialOptions || {}, active = true, destroyed = false;
    let phase = 'setup', teamCount = 2, names = DEFAULTS.slice(), timerSeconds = 0;
    let teams = [], turn = 0, card = null, previousCard = -1, awardedStars = 0;
    let remainingMs = 0, timer = null, lastTick = 0, timerWasUsed = false;
    let statusText = '', errorText = '', resetPrompt = false, wasPlayingBeforePrompt = false;
    let clockNumber = null, clockText = null, stage = null;
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
    function cancelTimer() { clearTimeout(timer); timer = null; }
    function syncTime() {
      if (phase !== 'playing' || !timerWasUsed || remainingMs <= 0) return;
      const next = now(); remainingMs = Math.max(0, remainingMs - Math.max(0, next - lastTick)); lastTick = next;
    }
    function displayClock() {
      if (clockNumber) clockNumber.textContent = String(Math.ceil(remainingMs / 1000)).padStart(2, '0');
      if (clockText) clockText.textContent = phase === 'paused' ? 'Paused' : remainingMs > 0 ? 'seconds left' : 'Coach chooses the stars';
    }
    function scheduleTick() {
      cancelTimer();
      if (!active || destroyed || phase !== 'playing' || !timerWasUsed || remainingMs <= 0) return;
      timer = setTimeout(() => {
        timer = null; syncTime(); displayClock();
        if (remainingMs <= 0) { statusText = 'Time is up. Coach, award the teamwork stars.'; render(); }
        else scheduleTick();
      }, 200);
    }
    function pause() {
      if (phase !== 'playing' || !timerWasUsed || remainingMs <= 0) return false;
      syncTime(); cancelTimer();
      if (remainingMs > 0) { phase = 'paused'; statusText = 'Round paused. Resume when your team is ready.'; }
      return phase === 'paused';
    }
    function drawCard() {
      let index = Math.floor(Math.random() * CARDS.length);
      if (index === previousCard) index = (index + 1 + Math.floor(Math.random() * (CARDS.length - 1))) % CARDS.length;
      previousCard = index; card = { ...CARDS[index] };
    }
    function prepareTurn() {
      cancelTimer(); awardedStars = 0; remainingMs = timerSeconds * 1000; timerWasUsed = timerSeconds > 0;
      phase = 'ready'; drawCard(); statusText = `${teams[turn % teams.length].name}, your challenge is ready.`;
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
      turn = 0; previousCard = -1; resetPrompt = false; errorText = ''; prepareTurn(); render(true);
    }
    function startTurn() {
      if (phase !== 'ready' || !active || resetPrompt) return;
      phase = 'playing'; lastTick = now(); statusText = 'Go together. Coach, look for control, timing and encouragement.';
      render(true); scheduleTick();
    }
    function resume() {
      if (phase !== 'paused' || !active || resetPrompt) return;
      phase = 'playing'; lastTick = now(); statusText = 'Round resumed. Work together.'; render(true); scheduleTick();
    }
    function award(stars) {
      if (!active || destroyed || resetPrompt || phase !== 'playing' || !Number.isInteger(stars) || stars < 1 || stars > 3) return;
      syncTime(); cancelTimer();
      const team = teams[turn % teams.length]; team.score += stars; team.turns++; awardedStars = stars; phase = 'awarded';
      statusText = `${team.name} earns ${stars} ${stars === 1 ? 'star' : 'stars'}.`;
      render(true); sound({ kind: 'award', stars, perfect: stars === 3 });
    }
    function nextTurn() {
      if (!active || phase !== 'awarded' || resetPrompt) return;
      if (turn + 1 >= teams.length * ROUNDS) { phase = 'finished'; statusText = 'Five rounds complete. Celebrate the teamwork.'; render(true); sound({ kind: 'finish', perfect: true }); return; }
      turn++; prepareTurn(); render(true);
    }
    function undoAward() {
      if (!active || phase !== 'awarded' || resetPrompt || !awardedStars) return;
      const team = teams[turn % teams.length]; team.score -= awardedStars; team.turns--; awardedStars = 0;
      phase = timerWasUsed && remainingMs > 0 ? 'paused' : 'playing';
      statusText = 'Award undone. Coach, choose the stars again.'; render(true);
    }
    function requestReset() {
      if (destroyed || !active || resetPrompt) return;
      if (phase === 'setup' || phase === 'finished') { reset(); return; }
      wasPlayingBeforePrompt = pause(); resetPrompt = true; render(true);
    }
    function reset() {
      cancelTimer(); phase = 'setup'; teams = []; turn = 0; card = null; awardedStars = 0; remainingMs = 0;
      resetPrompt = false; wasPlayingBeforePrompt = false; statusText = ''; errorText = ''; render(true);
    }
    function perform(action) {
      if (destroyed || !active) return;
      if (action.startsWith('count-') && phase === 'setup') {
        const count = Number(action.slice(6)); if ([2, 3, 4].includes(count)) { teamCount = count; errorText = ''; render(); } return;
      }
      if (action.startsWith('award-')) { award(Number(action.slice(6))); return; }
      if (action === 'start-game') startGame();
      else if (action === 'start-turn') startTurn();
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
      panel.append(node('p', 'swl-team-kicker', 'TEAMWORK TAKES THE PODIUM'), node('h3', '', 'Choose your squads'), node('p', 'swl-team-muted', 'Five rounds each. One shared rhythm. Every team can earn up to 15 stars.'));
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
      const timerLabel = node('label', 'swl-team-timer-choice'); timerLabel.append(node('span', '', 'Optional round timer'));
      const select = node('select'); select.dataset.teamTimer = 'true'; select.setAttribute('aria-label', 'Round timer');
      [0, 15, 20, 30].forEach(value => { const option = node('option', '', value ? `${value} seconds` : 'No timer'); option.value = String(value); select.append(option); });
      select.value = String(timerSeconds); select.addEventListener('change', () => { const value = Number(select.value); if ([0, 15, 20, 30].includes(value)) timerSeconds = value; }); timerLabel.append(select);
      const error = node('p', 'swl-team-error', errorText); error.setAttribute('role', 'alert');
      panel.append(count, fields, timerLabel, error, button('Start showdown ↗', 'start-game', 'swl-team-button swl-team-primary'));
      const rules = node('aside', 'swl-team-rules'); rules.append(node('span', 'swl-team-rule-icon', '✦'), node('h3', '', 'Coach the teamwork'), node('p', '', 'Look for control, shared timing and encouragement. Award 1, 2 or 3 stars after each turn. The timer never awards points.'), node('p', 'swl-team-muted', 'Pick a comfortable version of each movement and leave space between teammates. This game stays on this device and does not change Skill League scores.'));
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
      const body = node('div', 'swl-team-challenge'); const text = node('div'); text.append(node('h3', '', card.title), node('p', 'swl-team-task', card.task), node('p', 'swl-team-muted', card.cue));
      const metric = node('div', 'swl-team-metric'); metric.append(node('b', '', card.count), node('span', '', card.unit)); body.append(text, metric); stage.append(top, body);
      const actionArea = node('div', 'swl-team-turn-controls');
      if (timerWasUsed) {
        const clock = node('div', 'swl-team-clock'); clock.setAttribute('role', 'timer'); clock.setAttribute('aria-live', 'off'); clockNumber = node('b'); clockText = node('span'); clock.append(clockNumber, clockText); actionArea.append(clock); displayClock();
      }
      if (phase === 'ready') actionArea.append(button(timerWasUsed ? `Start ${timerSeconds}-second round` : 'Ready · start round', 'start-turn', 'swl-team-button swl-team-primary'));
      else if (phase === 'paused') actionArea.append(button('Resume round ▶', 'resume', 'swl-team-button swl-team-primary'));
      else if (phase === 'playing' && timerWasUsed && remainingMs > 0) actionArea.append(button('Pause timer Ⅱ', 'pause', 'swl-team-button swl-team-secondary'));
      if (phase === 'awarded') {
        const awardLabel = node('p', 'swl-team-award-result', `${'★'.repeat(awardedStars)}  +${awardedStars} ${awardedStars === 1 ? 'star' : 'stars'}`); actionArea.append(awardLabel, button(turn + 1 === teams.length * ROUNDS ? 'See the results ↗' : `Next: ${teams[(turn + 1) % teams.length].name} →`, 'next', 'swl-team-button swl-team-primary'), button('Undo award', 'undo', 'swl-team-text-button'));
      }
      stage.append(actionArea);
      const award = node('div', 'swl-team-awards'); award.setAttribute('role', 'group'); award.setAttribute('aria-label', 'Coach awards teamwork stars');
      [1, 2, 3].forEach(stars => { const control = button('', `award-${stars}`, 'swl-team-award', phase !== 'playing' || resetPrompt); control.setAttribute('aria-label', `Award ${stars} ${stars === 1 ? 'star' : 'stars'}`); control.append(node('span', '', '★'.repeat(stars)), node('b', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`), node('small', '', ['Working together', 'Strong teamwork', 'In sync, all together'][stars - 1])); award.append(control); });
      stage.append(node('p', 'swl-team-awards-label', 'COACH’S STARS · CONTROL + TIMING + ENCOURAGEMENT'), award); root.append(stage);
    }
    function finishView(root) {
      const high = Math.max(...teams.map(team => team.score)); const winners = teams.filter(team => team.score === high);
      const result = node('section', 'swl-team-finish'); result.tabIndex = -1; stage = result;
      result.append(node('div', 'swl-team-trophy', '✦'), node('p', 'swl-team-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : 'SHOWDOWN CHAMPIONS'), node('h3', '', winners.map(team => team.name).join(' + ')), node('p', 'swl-team-winner-points', `${high} ${high === 1 ? 'star' : 'stars'}`), node('p', 'swl-team-muted', winners.length === teams.length ? 'A team effort all round. Everyone finishes together.' : winners.length > 1 ? 'A brilliant tie. Celebrate both the effort and the teamwork.' : 'Control, rhythm and encouragement — that is a winning team.'));
      const actions = node('div', 'swl-team-finish-actions'); actions.append(button('Play again ↻', 'replay', 'swl-team-button swl-team-primary'), button('Change teams', 'reset', 'swl-team-button swl-team-secondary')); result.append(actions); root.append(result);
    }
    function render(focus = false) {
      if (destroyed) return;
      clockNumber = null; clockText = null; stage = null;
      const root = node('div', 'swl-team'); root.dataset.static = String(motionOff());
      const head = node('div', 'swl-team-heading'); const titles = node('div'); titles.append(node('p', 'swl-team-kicker', 'TEAM GAME · 2–4 SQUADS'), node('h2', '', 'Squad Showdown'));
      head.append(titles); if (phase !== 'setup') head.append(button('New game', 'reset', 'swl-team-text-button')); root.append(head);
      if (phase === 'setup') setupView(root);
      else { scoreboard(root); if (phase === 'finished') finishView(root); else playView(root); }
      const live = node('p', 'swl-team-live', statusText); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.append(live);
      if (resetPrompt) {
        const confirm = node('div', 'swl-team-reset-prompt'); confirm.setAttribute('role', 'alertdialog'); confirm.setAttribute('aria-label', 'Start a new team game?');
        confirm.append(node('strong', '', 'Start a new game?'), node('p', '', 'This clears the stars from this showdown.'), button('Keep this game', 'cancel-reset', 'swl-team-button swl-team-primary'), button('Clear and restart', 'confirm-reset', 'swl-team-button swl-team-secondary')); root.append(confirm);
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
      getState() { return { phase, active, teamCount, timerSeconds, turn, round: teams.length ? Math.min(ROUNDS, Math.floor(turn / teams.length) + 1) : 0, teams: teams.map(team => ({ ...team })), card: card ? { ...card } : null, remainingMs, awardedStars, resetPrompt }; }
    };
    render(); return controller;
  }
  window.SWLTeam = Object.freeze({
    version: 1,
    mount(container, options = {}) {
      if (!container || typeof container.replaceChildren !== 'function') throw Error('A team game container is required.');
      if (instance && !instance.destroyed && mountedContainer === container) { instance.updateOptions(options); instance.activate(); return instance; }
      instance?.destroy(); mountedContainer = container; instance = createGame(container, options); return instance;
    },
    deactivate() { instance?.deactivate(); },
    destroy() { instance?.destroy(); instance = null; mountedContainer = null; }
  });
})();
