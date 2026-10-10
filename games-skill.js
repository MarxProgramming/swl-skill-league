(() => {
  'use strict';
  if (window.SWLSkillShuffle?.version === 1 && window.SWLLetterDuel?.version === 1) return;
  const COLORS = ['#d5fa70', '#bd9bff'];
  const DEFAULTS = ['Mint', 'Purple'];
  const ROUNDS = 5, TARGET = 7, SHUFFLE_MS = 1250;
  const node = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    element.className = className; element.textContent = text;
    return element;
  };
  const cleanName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 24).join('');
  function catalogue(value) {
    const ids = new Set();
    return (Array.isArray(value) ? value : []).filter(skill => {
      if (!skill || typeof skill.id !== 'string' || !skill.id.trim() || typeof skill.label !== 'string' || !skill.label.trim() || ids.has(skill.id)) return false;
      ids.add(skill.id); return true;
    }).map(skill => ({ id: skill.id, label: skill.label.trim(), category: typeof skill.category === 'string' ? skill.category : '', tier: typeof skill.tier === 'string' ? skill.tier : '' }));
  }
  function randomBelow(maximum) {
    try {
      if (typeof window.crypto?.getRandomValues === 'function') {
        const value = new Uint32Array(1), ceiling = 0x100000000 - 0x100000000 % maximum;
        for (let attempt = 0; attempt < 8; attempt++) {
          window.crypto.getRandomValues(value);
          if (value[0] < ceiling) return value[0] % maximum;
        }
      }
    } catch (_) {}
    return Math.floor(Math.random() * maximum);
  }
  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) { const j = randomBelow(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }
  function letterPool(skills) {
    const letters = new Map();
    const common = ['Arabesque balance', 'Jumping jack', 'Leap', 'Pike jump', 'Pike shape', 'Round-off', 'Roll', 'Tuck jump', 'Walkover'].map((label, index) => ({ id: `letter-hint-${index}`, label, category: 'Floor skills & shapes', tier: '' }));
    [...skills, ...common].forEach(skill => {
      // Numbered skills use their first word: “1½ spin” belongs to S.
      const letter = skill.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]/i)?.[0].toUpperCase();
      if (letter) {
        if (!letters.has(letter)) letters.set(letter, []);
        if (!letters.get(letter).some(item => item.label.toLocaleLowerCase() === skill.label.toLocaleLowerCase())) letters.get(letter).push(skill);
      }
    });
    return [...letters].map(([letter, matches]) => ({ id: letter, label: letter, matches }));
  }
  function createGame(container, supplied, mode) {
    let options = supplied || {}, skills = catalogue(options.skills);
    const duel = mode === 'letter', title = duel ? 'Letter Duel' : 'Skill Shuffle';
    let pool = duel ? letterPool(skills) : skills, bag = [], previous = '';
    let active = true, destroyed = false, phase = 'setup', names = DEFAULTS.slice(), teams = [];
    let turn = 0, selected = null, awardValue = 0, awardTeam = null, skipped = false, hints = false;
    let timer = null, timerGeneration = 0, renderGeneration = 0, remainingMs = SHUFFLE_MS, lastTick = 0;
    let preview = null, previewNumber = 0, resetPrompt = false, errorText = '', statusText = '', stage = null;
    const now = () => performance.now();
    const motionOff = () => {
      try { return !!(typeof options.motionOff === 'function' ? options.motionOff() : options.motionOff) || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
      catch (_) { return true; }
    };
    const sound = payload => { try { options.playSound?.(payload); } catch (_) {} };
    const showStage = () => stage?.scrollIntoView?.({ block: 'start', behavior: motionOff() ? 'instant' : 'smooth' });
    function cancelTimer() { timerGeneration++; clearTimeout(timer); timer = null; }
    function button(text, action, className = 'swl-skill-button swl-skill-secondary', disabled = false) {
      const element = node('button', className, text), generation = renderGeneration;
      element.type = 'button'; element.disabled = disabled; element.dataset.skillAction = action;
      element.addEventListener('click', () => { if (generation === renderGeneration) perform(action); });
      return element;
    }
    function nextChoice() {
      if (!bag.length) {
        bag = shuffled(pool);
        if (bag.length > 1 && bag[bag.length - 1].id === previous) {
          const swap = randomBelow(bag.length - 1); [bag[swap], bag[bag.length - 1]] = [bag[bag.length - 1], bag[swap]];
        }
      }
      const choice = bag.pop(); previous = choice?.id || ''; return choice;
    }
    function prepareTurn() {
      cancelTimer(); phase = 'ready'; selected = null; preview = null; awardValue = 0; awardTeam = null; skipped = false; hints = false;
      remainingMs = SHUFFLE_MS;
      statusText = duel ? 'Both teams ready? Draw the next letter.' : `${teams[turn % 2].name}, front gymnast ready? Shuffle your skill.`;
    }
    function startGame(replay = false) {
      if (!pool.length || (phase !== 'setup' && !(replay && phase === 'finished'))) return;
      if (!replay) {
        const chosen = names.map((name, index) => cleanName(name) || DEFAULTS[index]);
        if (chosen[0].toLocaleLowerCase() === chosen[1].toLocaleLowerCase()) { errorText = 'Give each team a different name so the scores stay clear.'; render(); return; }
        teams = chosen.map((name, index) => ({ name, color: COLORS[index], score: 0, turns: 0 }));
      } else teams = teams.map(team => ({ ...team, score: 0, turns: 0 }));
      turn = 0; errorText = ''; resetPrompt = false; prepareTurn(); render(true); showStage();
    }
    function reveal() {
      cancelTimer(); remainingMs = 0; phase = 'revealed'; preview = selected;
      statusText = duel ? `Letter ${selected.label}. Both teams, show a gymnastics skill beginning with ${selected.label}.` : `${teams[turn % 2].name}: ${selected.label}. Coach, rate the attempt.`;
      render(true); sound({ kind: 'wheel-finish' });
    }
    function syncTime() {
      if (phase !== 'shuffling') return;
      const next = now(); remainingMs = Math.max(0, remainingMs - Math.max(0, next - lastTick)); lastTick = next;
    }
    function pause() {
      if (phase !== 'shuffling') return false;
      syncTime(); cancelTimer(); phase = 'paused'; statusText = 'Shuffle paused. Resume when everyone is ready.'; return true;
    }
    function scheduleFrame() {
      cancelTimer();
      if (!active || destroyed || phase !== 'shuffling') return;
      const generation = timerGeneration;
      timer = setTimeout(() => {
        if (generation !== timerGeneration || !active || destroyed || phase !== 'shuffling') return;
        timer = null;
        if (document.hidden) { pause(); render(); return; }
        syncTime();
        if (remainingMs <= 0 || motionOff()) { reveal(); return; }
        previewNumber++; preview = pool[previewNumber % pool.length];
        // A delayed frame only plays this tick, never a burst of missed ticks.
        sound({ kind: 'wheel-tick' }); render(); scheduleFrame();
      }, Math.min(remainingMs, 140));
    }
    function draw() {
      if (phase !== 'ready' || !pool.length) return;
      selected = nextChoice(); previewNumber = randomBelow(pool.length); preview = pool[previewNumber];
      hints = false; phase = 'shuffling'; remainingMs = SHUFFLE_MS; lastTick = now();
      if (motionOff()) { reveal(); showStage(); return; }
      statusText = duel ? 'Choosing your letter…' : 'Shuffling all Skill League skills…';
      render(true); showStage(); sound({ kind: 'wheel-start' }); scheduleFrame();
    }
    function resume() {
      if (phase !== 'paused') return;
      phase = 'shuffling'; lastTick = now();
      if (motionOff() || remainingMs <= 0) { reveal(); return; }
      statusText = 'Shuffle resumed…'; render(true); showStage(); scheduleFrame();
    }
    function award(value, teamIndex) {
      if (phase !== 'revealed') return;
      if (duel ? value !== 1 || ![0, 1].includes(teamIndex) : ![1, 2, 3].includes(value)) return;
      const index = duel ? teamIndex : turn % 2;
      teams[index].score += value; teams[index].turns++; awardTeam = index; awardValue = value; skipped = false;
      phase = duel && teams[index].score >= TARGET ? 'finished' : 'awarded';
      statusText = `${teams[index].name} earns ${value} ${duel ? 'point' : value === 1 ? 'star' : 'stars'}.`;
      if (phase === 'finished') statusText = `${teams[index].name} wins with ${TARGET} points.`;
      render(true); sound({ kind: 'award', ...(duel ? { points: 1, perfect: true } : { stars: value, perfect: value === 3 }) });
      if (phase === 'finished') { showStage(); sound({ kind: 'wheel-finish', perfect: true }); }
    }
    function undoAward() {
      if (!['awarded', 'finished'].includes(phase) || (!awardValue && !skipped)) return;
      if (awardValue && awardTeam !== null) { teams[awardTeam].score -= awardValue; teams[awardTeam].turns--; }
      awardTeam = null; awardValue = 0; skipped = false; phase = 'revealed';
      statusText = 'Last award undone. Coach, choose again.'; render(true);
    }
    function nextTurn() {
      if (phase !== 'awarded') return;
      if (!duel && turn + 1 >= ROUNDS * 2) {
        phase = 'finished'; statusText = 'Five turns each complete. Here are the team totals.'; render(true); showStage(); sound({ kind: 'wheel-finish', perfect: true }); return;
      }
      turn++; prepareTurn(); render(true); showStage();
      if (duel) draw();
    }
    function reset() {
      cancelTimer(); phase = 'setup'; teams = []; turn = 0; selected = preview = null; awardValue = 0; awardTeam = null;
      skipped = hints = resetPrompt = false; errorText = statusText = ''; remainingMs = SHUFFLE_MS; render(true);
    }
    function perform(action) {
      if (destroyed || !active || document.hidden) return;
      if (resetPrompt) {
        if (action === 'confirm-reset') reset();
        else if (action === 'cancel-reset') { resetPrompt = false; render(true); }
        return;
      }
      if (action === 'start-game') startGame();
      else if (action === 'draw') draw();
      else if (action === 'redraw' && !duel && phase === 'revealed') { phase = 'ready'; draw(); }
      else if (action === 'pause' && pause()) render(true);
      else if (action === 'resume') resume();
      else if (action.startsWith('rate-') && !duel) award(Number(action.slice(5)));
      else if (action.startsWith('point-') && duel) award(1, Number(action.slice(6)));
      else if (action === 'next') nextTurn();
      else if (action === 'undo') undoAward();
      else if (action === 'skip' && duel && phase === 'revealed') { skipped = true; awardValue = 0; awardTeam = null; phase = 'awarded'; statusText = 'Letter skipped. No points awarded.'; render(true); }
      else if (action === 'hint' && duel && phase === 'revealed') { hints = !hints; render(false, 'hint'); }
      else if (action === 'reset') {
        if (phase === 'setup' || phase === 'finished') reset();
        else { pause(); resetPrompt = true; render(true); }
      } else if (action === 'replay') startGame(true);
    }
    function setupView(root) {
      const panel = node('section', 'swl-skill-setup');
      panel.append(node('p', 'swl-skill-kicker', duel ? `${pool.length} LETTERS · FIRST TO ${TARGET}` : `${skills.length} SKILLS · FIVE TURNS EACH`), node('h3', '', 'Two teams. Everyone in.'), node('p', 'swl-skill-muted', duel ? 'Draw a letter. Think of a gymnastics skill beginning with it, then show the coach.' : 'Take turns at the front of your team. Shuffle a skill, give it a go, then let the coach rate it.'));
      const fields = node('div', 'swl-skill-names');
      names.forEach((name, index) => {
        const label = node('label', 'swl-skill-name'); label.style.setProperty('--squad-color', COLORS[index]); label.append(node('span', '', `Team ${index + 1}`));
        const input = node('input'); input.type = 'text'; input.value = name; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.skillName = String(index);
        input.setAttribute('aria-label', `${title} team ${index + 1} name`);
        input.addEventListener('input', () => { if (phase === 'setup' && active && !destroyed) names[index] = input.value; });
        label.append(input); fields.append(label);
      });
      const error = node('p', 'swl-skill-error', pool.length ? errorText : 'The skill list is not available yet. Return to this game once it has loaded.'); error.setAttribute('role', 'alert');
      panel.append(fields, error, button('Let’s play ↗', 'start-game', 'swl-skill-button swl-skill-primary', !pool.length));
      const rules = node('aside', 'swl-skill-rules'); rules.append(node('span', 'swl-skill-rule-icon', duel ? 'A↗' : '↝'), node('h3', '', duel ? 'Quick thinking. Real skills.' : 'Your skill. Your moment.'));
      if (duel) rules.append(node('p', '', 'Both teams play every letter. The coach awards 1 point to either team, or skips. First to 7 wins.'), node('p', 'swl-skill-muted', 'Use a familiar gymnastics floor skill or shape approved by the coach. Hints include the skill list and other floor basics. For numbered skills, use the first word.'));
      else {
        const list = node('ul', 'swl-skill-rating-guide');
        [[3, 'Almost perfect'], [2, 'Did it, messy'], [1, 'Does not count']].forEach(([stars, label]) => { const item = node('li'); item.append(node('b', '', '★'.repeat(stars)), node('span', '', label)); list.append(item); });
        rules.append(list, node('p', 'swl-skill-muted', 'Teams alternate, with five turns each. Every skill is in the shuffle. Coach chooses a familiar skill to attempt, or draws another.'));
      }
      rules.append(node('p', 'swl-skill-session-note', 'Game points stay here. Skill League marks and points stay the same.'));
      const grid = node('div', 'swl-skill-setup-grid'); grid.append(panel, rules); root.append(grid);
    }
    function scoreboard(root) {
      const board = node('div', 'swl-skill-board'); board.setAttribute('aria-label', `${title} scoreboard`);
      teams.forEach((team, index) => {
        const item = node('div', `swl-skill-score${!duel && phase !== 'finished' && index === turn % 2 ? ' is-current' : ''}`); item.style.setProperty('--squad-color', team.color);
        item.append(node('span', 'swl-skill-score-name', team.name), node('strong', '', String(team.score)), node('span', 'swl-skill-score-unit', duel ? `points · first to ${TARGET}` : `stars · ${team.turns}/${ROUNDS} turns`));
        if (duel) { const track = node('div', 'swl-skill-track'), fill = node('span'); fill.style.width = `${team.score / TARGET * 100}%`; track.append(fill); item.append(track); }
        board.append(item);
      }); root.append(board);
    }
    function metaText(skill) {
      const category = ({ rolls: 'Rolls', acro: 'Acro & spins', leaps: 'Leaps' })[skill.category] || skill.category;
      const tier = ({ base: 'Base', upgrade: 'Upgrade', pro: 'Pro' })[skill.tier] || skill.tier;
      return [category, tier].filter(Boolean).join(' · ');
    }
    function playView(root) {
      const progress = node('div', 'swl-skill-progress');
      progress.append(node('span', '', duel ? `LETTER ${turn + 1}` : `ROUND ${Math.floor(turn / 2) + 1} / ${ROUNDS}`), node('span', '', duel ? 'BOTH TEAMS PLAY' : 'TEAMS TAKE TURNS')); root.append(progress);
      stage = node('section', 'swl-skill-stage'); stage.tabIndex = -1; stage.style.setProperty('--squad-color', duel ? COLORS[0] : teams[turn % 2].color);
      stage.append(node('p', 'swl-skill-turn', duel ? 'Think it. Show it.' : `${teams[turn % 2].name}’s turn`));
      const face = node('div', `swl-skill-face${duel ? ' swl-skill-letter-face' : ''}`);
      if (['ready', 'paused'].includes(phase)) {
        face.append(node('span', 'swl-skill-placeholder', phase === 'paused' ? 'Ⅱ' : duel ? 'A–Z' : '↝'), node('h3', '', phase === 'paused' ? 'A little pause.' : duel ? 'What’s your letter?' : 'What’s your skill?'), node('p', 'swl-skill-muted', phase === 'paused' ? 'Your choice is saved. Resume the shuffle when everyone is ready.' : duel ? 'A fresh letter. One point up for grabs.' : 'Front gymnast ready? Let the shuffle choose.'));
      } else if (phase === 'shuffling') {
        const spinning = node('div', 'swl-skill-spinning'); spinning.setAttribute('aria-hidden', 'true');
        spinning.append(node('span', 'swl-skill-kicker', 'SHUFFLING'), node(duel ? 'div' : 'h3', duel ? 'swl-skill-letter' : 'swl-skill-chosen', preview.label)); face.append(spinning);
        face.append(node('p', 'swl-skill-muted', 'Here it comes…'));
      } else {
        if (!duel) face.append(node('span', 'swl-skill-badge', metaText(selected)));
        face.append(node(duel ? 'div' : 'h3', duel ? 'swl-skill-letter' : 'swl-skill-chosen', selected.label));
        face.append(node('p', 'swl-skill-instruction', duel ? `Show a gymnastics skill beginning with ${selected.label}.` : 'One attempt. Then join the back of your team.'));
      }
      stage.append(face);
      const controls = node('div', 'swl-skill-controls');
      if (phase === 'ready') controls.append(button(duel ? 'Draw a letter ↝' : 'Shuffle my skill ↝', 'draw', 'swl-skill-button swl-skill-primary swl-skill-go'));
      else if (phase === 'shuffling') controls.append(button('Pause Ⅱ', 'pause', 'swl-skill-text-button'));
      else if (phase === 'paused') controls.append(button('Resume shuffle ▶', 'resume', 'swl-skill-button swl-skill-primary'));
      else if (phase === 'awarded') {
        controls.append(node('p', 'swl-skill-award-result', skipped ? 'No points this letter' : duel ? `${teams[awardTeam].name} +1 point` : `${'★'.repeat(awardValue)} +${awardValue} ${awardValue === 1 ? 'star' : 'stars'}`));
        controls.append(button(!duel && turn + 1 === ROUNDS * 2 ? 'See the results ↗' : duel ? 'Next letter ↝' : `Next: ${teams[(turn + 1) % 2].name} →`, 'next', 'swl-skill-button swl-skill-primary'), button(skipped ? 'Undo skip' : 'Undo rating', 'undo', 'swl-skill-text-button'));
      }
      stage.append(controls);
      if (phase === 'revealed') {
        stage.append(node('p', 'swl-skill-awards-label', duel ? 'COACH · WHO EARNED THE POINT?' : 'COACH · RATE THE ATTEMPT'));
        const awards = node('div', duel ? 'swl-skill-duel-awards' : 'swl-skill-awards'); awards.setAttribute('role', 'group'); awards.setAttribute('aria-label', duel ? 'Coach awards a point' : 'Coach rates the attempt');
        if (duel) {
          teams.forEach((team, index) => { const control = button('', `point-${index}`, 'swl-skill-point'); control.style.setProperty('--squad-color', team.color); control.setAttribute('aria-label', `Award 1 point to ${team.name}`); control.append(node('b', '', '+1'), node('span', '', team.name)); awards.append(control); });
          stage.append(awards);
          const extras = node('div', 'swl-skill-extras'), hint = button(hints ? 'Hide coach hints' : 'Coach hints', 'hint', 'swl-skill-text-button'); hint.setAttribute('aria-expanded', String(hints));
          extras.append(button('Skip this letter', 'skip', 'swl-skill-text-button'), hint); stage.append(extras);
          if (hints) { const hintBox = node('aside', 'swl-skill-hints'); hintBox.append(node('p', 'swl-skill-kicker', 'FAMILIAR FLOOR SKILLS & SHAPES')); const list = node('ul'); selected.matches.forEach(skill => list.append(node('li', '', skill.label))); hintBox.append(list); stage.append(hintBox); }
        } else {
          [[3, 'Almost perfect'], [2, 'Did it, messy'], [1, 'Does not count']].forEach(([stars, label]) => { const control = button('', `rate-${stars}`, 'swl-skill-rate'); control.setAttribute('aria-label', `${stars} ${stars === 1 ? 'star' : 'stars'}: ${label}`); control.append(node('span', '', '★'.repeat(stars)), node('b', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`), node('small', '', label)); awards.append(control); });
          stage.append(awards);
          const alternatives = node('div', 'swl-skill-extras'); alternatives.append(button('Coach: draw another skill', 'redraw', 'swl-skill-text-button'));
          stage.append(alternatives, node('p', 'swl-skill-familiar', 'Coach chooses a familiar skill to attempt.'));
        }
      }
      root.append(stage);
    }
    function finishView(root) {
      const high = Math.max(...teams.map(team => team.score)), winners = teams.filter(team => team.score === high);
      stage = node('section', 'swl-skill-finish'); stage.tabIndex = -1;
      stage.append(node('span', 'swl-skill-trophy', '✦'), node('p', 'swl-skill-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : duel ? 'LETTER DUEL WINNERS' : 'SKILL SHUFFLE WINNERS'), node('h3', '', winners.map(team => team.name).join(' + ')), node('p', 'swl-skill-result-points', `${high} ${duel ? 'points' : 'stars'}`), node('p', 'swl-skill-muted', winners.length > 1 ? 'A tie! Both teams share the celebration.' : 'A team effort worth celebrating.'));
      const controls = node('div', 'swl-skill-controls'); controls.append(button('Play again ↝', 'replay', 'swl-skill-button swl-skill-primary'), button('Change teams', 'reset'), button('Undo last rating', 'undo', 'swl-skill-text-button')); stage.append(controls); root.append(stage);
    }
    function render(focus = false, focusAction = '') {
      if (destroyed) return;
      renderGeneration++; stage = null;
      const root = node('div', `swl-skill-game swl-skill-${mode}-game`); root.dataset.static = String(motionOff()); root.dataset.phase = phase;
      const heading = node('div', 'swl-skill-heading'), titles = node('div'); titles.append(node('p', 'swl-skill-kicker', duel ? 'ONE LETTER · TWO TEAMS · FIRST TO SEVEN' : 'SHUFFLE · SHOW IT · SCORE'), node('h2', '', title)); heading.append(titles);
      if (phase !== 'setup') heading.append(button('New game', 'reset', 'swl-skill-text-button')); root.append(heading);
      if (phase === 'setup') setupView(root); else { scoreboard(root); if (phase === 'finished') finishView(root); else playView(root); }
      const live = node('p', 'swl-skill-live', statusText); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.append(live);
      if (resetPrompt) {
        const prompt = node('div', 'swl-skill-reset-prompt'); prompt.setAttribute('role', 'alertdialog'); prompt.setAttribute('aria-label', `Start a new ${title} game?`);
        prompt.append(node('strong', '', 'Start a new game?'), node('p', '', 'This clears the scores from this game.'), button('Keep this game', 'cancel-reset', 'swl-skill-button swl-skill-primary'), button('Clear and restart', 'confirm-reset'));
        prompt.addEventListener('keydown', event => {
          if (event.key === 'Escape') { event.preventDefault(); perform('cancel-reset'); }
          else if (event.key === 'Tab') {
            const first = prompt.querySelector('[data-skill-action="cancel-reset"]'), last = prompt.querySelector('[data-skill-action="confirm-reset"]');
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }); root.append(prompt);
      }
      container.replaceChildren(root);
      if (focus || focusAction) {
        const target = resetPrompt ? root.querySelector('[data-skill-action="cancel-reset"]') : focusAction ? root.querySelector(`[data-skill-action="${focusAction}"]`) : phase === 'paused' ? root.querySelector('[data-skill-action="resume"]') : stage || root.querySelector('[data-skill-name="0"]');
        try { target?.focus({ preventScroll: true }); } catch (_) {}
      }
    }
    function deactivate() { if (destroyed) return; pause(); active = false; cancelTimer(); render(); }
    function onVisibility() { if (document.hidden) { pause(); cancelTimer(); render(); } }
    document.addEventListener('visibilitychange', onVisibility);
    const controller = {
      deactivate,
      activate() { if (!destroyed) { active = true; render(); } },
      get destroyed() { return destroyed; },
      updateOptions(next) {
        options = { ...options, ...(next || {}) };
        if (phase === 'setup' && Array.isArray(next?.skills)) {
          const incoming = catalogue(next.skills);
          if (JSON.stringify(incoming) !== JSON.stringify(skills)) { skills = incoming; pool = duel ? letterPool(skills) : skills; bag = []; previous = ''; }
        }
      },
      destroy() { if (destroyed) return; destroyed = true; active = false; cancelTimer(); document.removeEventListener('visibilitychange', onVisibility); container.replaceChildren(); },
      getState() {
        return { mode, phase, active, turn, round: teams.length ? Math.floor(turn / 2) + 1 : 0, teams: teams.map(team => ({ ...team })), selected: selected ? { ...selected, ...(selected.matches ? { matches: selected.matches.map(skill => ({ ...skill })) } : {}) } : null, poolSize: pool.length, skillCount: skills.length, remainingMs, awardValue, awardTeam, skipped, hints, resetPrompt };
      }
    };
    render(); return controller;
  }
  function moduleFor(mode) {
    let instance = null, mountedContainer = null;
    return Object.freeze({
      version: 1,
      mount(container, options = {}) {
        if (!container || typeof container.replaceChildren !== 'function') throw Error('A game container is required.');
        if (instance && !instance.destroyed && mountedContainer === container) { instance.updateOptions(options); instance.activate(); return instance; }
        instance?.destroy(); mountedContainer = container; instance = createGame(container, options, mode); return instance;
      },
      deactivate() { instance?.deactivate(); },
      destroy() { instance?.destroy(); instance = mountedContainer = null; }
    });
  }
  window.SWLSkillShuffle = moduleFor('shuffle');
  window.SWLLetterDuel = moduleFor('letter');
})();
