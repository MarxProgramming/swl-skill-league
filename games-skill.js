(() => {
  'use strict';
  if (window.SWLSkillShuffle?.version === 3 && window.SWLLetterDuel?.version === 3) return;
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782'];
  const DEFAULTS = ['Mint', 'Purple', 'Gold'];
  const DEFAULT_SIZE = 5, TARGET = 7, LETTER_MS = 1250, REEL_MS = 4000;
  const REEL_START = 2, REEL_TARGET = 26, REEL_GAP = 12;
  let sessionSequence = 0;
  function newSessionId(gameId) {
    try { if (window.crypto?.randomUUID) return `${gameId}-${window.crypto.randomUUID()}`; } catch (_) {}
    return `${gameId}-${Date.now().toString(36)}-${++sessionSequence}-${randomBelow(0x100000000).toString(36)}`;
  }
  const node = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    element.className = className; element.textContent = text;
    return element;
  };
  const cleanName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 24).join('');
  function teamSize(value) {
    const text = String(value).trim(), size = Number(text);
    return text && Number.isInteger(size) && size >= 1 && size <= 20 ? size : null;
  }
  const averageText = team => team.turns ? String(Number((team.score / team.turns).toFixed(3))) : '—';
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
    const duration = duel ? LETTER_MS : REEL_MS;
    let pool = duel ? letterPool(skills) : skills, bag = [], previous = '';
    let active = true, destroyed = false, phase = 'setup', names = DEFAULTS.slice(), teams = [];
    let teamCount = 2, sizes = DEFAULTS.map(() => String(DEFAULT_SIZE)), turnOrder = [];
    let turn = 0, selected = null, awardValue = 0, awardTeam = null, skipped = false, hints = false;
    let timer = null, timerGeneration = 0, renderGeneration = 0, remainingMs = duration, lastTick = 0;
    let preview = null, previewNumber = 0, resetPrompt = false, errorText = '', statusText = '', stage = null;
    let sessionId = null, completionSent = false, reelCards = [], reelViewport = null, reelTrack = null, reelBoundary = REEL_START;
    let reelWidth = 360, reelCardWidth = 223.2, reelOffset = 0, gameRoot = null, ownsImmersive = false;
    const now = () => performance.now();
    const currentTeamIndex = () => duel ? 0 : turnOrder[turn] ?? 0;
    const currentGymnast = () => teams.length && !duel ? teams[currentTeamIndex()].turns + (['awarded', 'finished'].includes(phase) ? 0 : 1) : 0;
    const completedGymnasts = () => teams.reduce((count, team) => count + team.turns, 0);
    function resultWinners() {
      // Compare integer ratios, so rounded display values never decide a tie.
      const compare = (a, b) => duel ? a.score - b.score : a.score * b.size - b.score * a.size;
      const best = teams.reduce((leader, team) => compare(team, leader) > 0 ? team : leader, teams[0]);
      return teams.filter(team => compare(team, best) === 0);
    }
    const motionOff = () => {
      try { return !!(typeof options.motionOff === 'function' ? options.motionOff() : options.motionOff) || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
      catch (_) { return true; }
    };
    const sound = payload => { try { options.playSound?.(payload); } catch (_) {} };
    function complete() {
      if (completionSent || !sessionId || phase !== 'finished') return;
      completionSent = true;
      try { options.onComplete?.({ gameId: duel ? 'letters' : 'shuffle', sessionId, ...(!duel ? { participantCount: turnOrder.length } : {}) }); } catch (_) {}
    }
    const immersive = () => !duel && active && !destroyed && phase !== 'setup';
    const showStage = () => { if (!immersive()) stage?.scrollIntoView?.({ block: 'start', behavior: motionOff() ? 'instant' : 'smooth' }); };
    function updateLayout() {
      if (duel) return;
      const body = document.body, playing = immersive();
      if (!playing) {
        if (ownsImmersive) {
          body?.classList?.remove('swl-shuffle-playing');
          body?.style?.removeProperty('--swl-shuffle-header-bottom');
          body?.style?.removeProperty('--swl-shuffle-bottom-space');
          ownsImmersive = false;
        }
        return;
      }
      body?.classList?.add('swl-shuffle-playing'); ownsImmersive = true;
      const viewport = window.visualViewport;
      const viewportTop = Math.max(0, Number(viewport?.offsetTop) || 0);
      const viewportHeight = Number(viewport?.height) || window.innerHeight || document.documentElement?.clientHeight || 768;
      const viewportBottom = viewportTop + viewportHeight;
      const header = document.querySelector?.('.header')?.getBoundingClientRect?.();
      const headerBottom = Math.max(viewportTop, Number(header?.bottom) || 76);
      const nav = document.querySelector?.('.nav')?.getBoundingClientRect?.();
      // Desktop navigation sits in the header; only a bottom navigation bar reserves space here.
      const bottomNav = nav && nav.height > 0 && nav.top > headerBottom + 48 && nav.top > viewportTop + viewportHeight / 2;
      const playBottom = Math.min(viewportBottom - 10, bottomNav ? nav.top - 8 : viewportBottom - 10);
      const top = headerBottom + 48, height = Math.max(100, playBottom - top);
      body?.style?.setProperty('--swl-shuffle-header-bottom', `${headerBottom}px`);
      body?.style?.setProperty('--swl-shuffle-bottom-space', `${Math.max(0, viewportBottom - playBottom)}px`);
      gameRoot?.style.setProperty('--swl-shuffle-play-top', `${top}px`);
      gameRoot?.style.setProperty('--swl-shuffle-play-height', `${height}px`);
      gameRoot?.style.setProperty('--swl-shuffle-card-font', `${Math.max(12, Math.min(29, height * .052))}px`);
      if (gameRoot) gameRoot.dataset.fit = height < 300 ? 'short' : height < 430 ? 'compact' : 'roomy';
    }
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
    function reelPosition() {
      const elapsed = Math.max(0, Math.min(1, 1 - remainingMs / REEL_MS));
      return REEL_START + (REEL_TARGET - REEL_START) * (1 - Math.pow(1 - elapsed, 4));
    }
    function updateReel(tick = false) {
      if (duel || !reelTrack || !reelViewport) return;
      const measuredWidth = reelViewport.getBoundingClientRect?.().width;
      const measured = measuredWidth ? measuredWidth - 2 : reelViewport.clientWidth;
      if (measured > 0) reelWidth = measured;
      reelCardWidth = Math.min(286, Math.max(174, reelWidth * .62));
      reelViewport.style.setProperty('--reel-card-width', `${reelCardWidth}px`);
      const position = reelPosition(), boundary = Math.floor(position + .5);
      if (tick && boundary > reelBoundary) sound({ kind: 'reel-tick', progress: 1 - remainingMs / REEL_MS, remaining: remainingMs / 1000 });
      reelBoundary = boundary;
      reelOffset = reelWidth / 2 - reelCardWidth / 2 - position * (reelCardWidth + REEL_GAP);
      reelTrack.style.transform = `translate3d(${reelOffset}px,0,0)`;
      reelViewport.dataset.position = String(position);
    }
    function buildReel() {
      reelCards = [];
      for (let index = 0; index < 32; index++) {
        const alternatives = pool.filter(skill => skill.id !== reelCards[index - 1]?.id && (index === REEL_TARGET - 1 || index === REEL_TARGET + 1 ? skill.id !== selected.id : true));
        reelCards.push(index === REEL_TARGET ? selected : (alternatives.length ? alternatives : pool)[randomBelow(alternatives.length || pool.length)]);
      }
      reelBoundary = REEL_START;
    }
    function reelView(face) {
      const frame = node('div', 'swl-skill-reel-frame'); frame.dataset.settled = String(['revealed', 'awarded'].includes(phase));
      frame.append(node('div', 'swl-skill-reel-pointer'));
      reelViewport = node('div', 'swl-skill-reel'); reelViewport.setAttribute('aria-hidden', 'true');
      reelTrack = node('div', 'swl-skill-reel-track'); reelTrack.setAttribute('aria-hidden', 'true');
      reelCards.forEach((skill, index) => {
        const card = node('div', `swl-skill-reel-card${index === REEL_TARGET && remainingMs === 0 ? ' is-selected' : ''}`);
        card.dataset.skillId = skill.id; card.dataset.tier = skill.tier;
        card.append(node('span', 'swl-skill-reel-meta', metaText(skill)), node('b', '', skill.label), node('span', 'swl-skill-reel-symbol', skill.category === 'rolls' ? '↻' : skill.category === 'leaps' ? '✦' : '◇'));
        reelTrack.append(card);
      });
      reelViewport.append(reelTrack); frame.append(reelViewport); face.append(frame);
      if (phase === 'shuffling') face.append(node('p', 'swl-skill-reel-caption', 'Your skill lands under the marker…'));
      else if (phase === 'paused') face.append(node('p', 'swl-skill-reel-caption', 'Paused. The same shuffle will continue.'));
      else face.append(node('h3', 'swl-skill-chosen swl-skill-reel-result', selected.label), node('p', 'swl-skill-instruction', 'One attempt. Then cheer on your team.'));
    }
    function prepareTurn() {
      cancelTimer(); phase = 'ready'; selected = null; preview = null; awardValue = 0; awardTeam = null; skipped = false; hints = false;
      remainingMs = duration; reelCards = [];
      statusText = duel ? 'Both teams ready? Draw the next letter.' : `${teams[currentTeamIndex()].name}, gymnast ${currentGymnast()} of ${teams[currentTeamIndex()].size}. Ready to shuffle your skill?`;
    }
    function startGame(replay = false) {
      if (!pool.length || (phase !== 'setup' && !(replay && phase === 'finished'))) return;
      if (!replay) {
        const chosen = names.slice(0, teamCount).map((name, index) => cleanName(name) || DEFAULTS[index]);
        if (new Set(chosen.map(name => name.toLocaleLowerCase())).size !== chosen.length) { errorText = 'Give each team a different name so the scores stay clear.'; render(); return; }
        const counts = sizes.slice(0, teamCount).map(teamSize);
        if (!duel && counts.some(size => size === null)) { errorText = 'Enter a whole number from 1 to 20 gymnasts for each team.'; render(); return; }
        teams = chosen.map((name, index) => ({ name, color: COLORS[index], score: 0, turns: 0, ...(!duel ? { size: counts[index] } : {}) }));
      } else teams = teams.map(team => ({ ...team, score: 0, turns: 0 }));
      // One slot per gymnast, cycling through teams and skipping those already complete.
      turnOrder = duel ? [] : Array.from({ length: Math.max(...teams.map(team => team.size)) }, (_, gymnast) => teams.flatMap((team, index) => gymnast < team.size ? [index] : [])).flat();
      sessionId = newSessionId(duel ? 'letters' : 'shuffle'); completionSent = false;
      turn = 0; errorText = ''; resetPrompt = false; prepareTurn(); render(true); showStage();
    }
    function reveal() {
      cancelTimer(); remainingMs = 0; phase = 'revealed'; preview = selected;
      statusText = duel ? `Letter ${selected.label}. Both teams, show a gymnastics skill beginning with ${selected.label}.` : `${teams[currentTeamIndex()].name}: ${selected.label}. Coach, rate the attempt.`;
      render(true); sound({ kind: duel ? 'wheel-finish' : 'reel-reveal' });
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
        if (duel) { previewNumber++; preview = pool[previewNumber % pool.length]; sound({ kind: 'wheel-tick' }); render(); }
        else updateReel(true);
        // Frames only emit a tick at a crossed card boundary, never a catch-up burst.
        scheduleFrame();
      }, Math.min(remainingMs, duel ? 140 : 16));
    }
    function draw() {
      if (phase !== 'ready' || !pool.length) return;
      selected = nextChoice(); previewNumber = randomBelow(pool.length); preview = pool[previewNumber];
      hints = false; phase = 'shuffling'; remainingMs = duration; lastTick = now();
      if (!duel) buildReel();
      if (motionOff()) { reveal(); showStage(); return; }
      statusText = duel ? 'Choosing your letter…' : 'Shuffling all Skill League skills…';
      render(true); showStage(); sound({ kind: duel ? 'wheel-start' : 'reel-start' }); scheduleFrame();
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
      const index = duel ? teamIndex : currentTeamIndex();
      teams[index].score += value; teams[index].turns++; awardTeam = index; awardValue = value; skipped = false;
      phase = duel && teams[index].score >= TARGET ? 'finished' : 'awarded';
      statusText = `${teams[index].name} earns ${value} ${duel ? 'point' : value === 1 ? 'star' : 'stars'}.`;
      if (phase === 'finished') statusText = `${teams[index].name} wins with ${TARGET} points.`;
      render(true); sound({ kind: 'award', ...(duel ? { points: 1, perfect: true } : { stars: value, perfect: value === 3 }) });
      if (phase === 'finished') { showStage(); sound({ kind: 'wheel-finish', perfect: true }); complete(); }
    }
    function undoAward() {
      if (!['awarded', 'finished'].includes(phase) || (!awardValue && !skipped)) return;
      if (awardValue && awardTeam !== null) { teams[awardTeam].score -= awardValue; teams[awardTeam].turns--; }
      awardTeam = null; awardValue = 0; skipped = false; phase = 'revealed';
      statusText = 'Last award undone. Coach, choose again.'; render(true);
    }
    function nextTurn() {
      if (phase !== 'awarded') return;
      if (!duel && turn + 1 >= turnOrder.length) {
        phase = 'finished'; statusText = 'Everyone has had one turn. Results use average stars per gymnast.'; render(true); showStage(); sound({ kind: 'finish', perfect: true }); complete(); return;
      }
      turn++; prepareTurn(); render(true); showStage();
      if (duel) draw();
    }
    function reset() {
      cancelTimer(); phase = 'setup'; teams = []; turnOrder = []; turn = 0; selected = preview = null; awardValue = 0; awardTeam = null;
      skipped = hints = resetPrompt = false; errorText = statusText = ''; remainingMs = duration; reelCards = []; sessionId = null; completionSent = false; render(true);
    }
    function perform(action) {
      if (destroyed || !active || document.hidden) return;
      if (resetPrompt) {
        if (action === 'confirm-reset') reset();
        else if (action === 'cancel-reset') { resetPrompt = false; render(true); }
        return;
      }
      if (!duel && phase === 'setup') {
        if (action === 'teams-2' || action === 'teams-3') { teamCount = Number(action.slice(6)); errorText = ''; render(false, action); return; }
        const change = action.match(/^size-(\d)-(less|more)$/);
        if (change && Number(change[1]) < teamCount) {
          const index = Number(change[1]), size = teamSize(sizes[index]);
          sizes[index] = String(size === null ? DEFAULT_SIZE : Math.min(20, Math.max(1, size + (change[2] === 'more' ? 1 : -1))));
          errorText = ''; render(false, action); return;
        }
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
      panel.append(node('p', 'swl-skill-kicker', duel ? `${pool.length} LETTERS · FIRST TO ${TARGET}` : `${skills.length} SKILLS · ONE TURN PER GYMNAST`), node('h3', '', duel ? 'Two teams. Everyone in.' : 'Your teams. Everyone in.'), node('p', 'swl-skill-muted', duel ? 'Draw a letter. Think of a gymnastics skill beginning with it, then show the coach.' : 'Choose two or three teams and count the gymnasts in each. Everyone gets one turn.'));
      if (!duel) {
        const choices = node('div', 'swl-skill-team-count'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Number of Skill Shuffle teams');
        [2, 3].forEach(count => { const choice = button(`${count} teams`, `teams-${count}`, 'swl-skill-team-choice'); choice.setAttribute('aria-pressed', String(teamCount === count)); choices.append(choice); }); panel.append(choices);
      }
      const fields = node('div', 'swl-skill-names');
      names.slice(0, teamCount).forEach((name, index) => {
        const label = node('label', 'swl-skill-name'); label.style.setProperty('--squad-color', COLORS[index]); label.append(node('span', '', `Team ${index + 1}`));
        const input = node('input'); input.type = 'text'; input.value = name; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.skillName = String(index);
        input.setAttribute('aria-label', `${title} team ${index + 1} name`);
        input.addEventListener('input', () => { if (phase === 'setup' && active && !destroyed) names[index] = input.value; });
        label.append(input);
        if (duel) fields.append(label);
        else {
          const row = node('div', 'swl-skill-team-fields'), countLabel = node('div', 'swl-skill-size'); countLabel.style.setProperty('--squad-color', COLORS[index]);
          const sizeInput = node('input'); sizeInput.type = 'number'; sizeInput.min = '1'; sizeInput.max = '20'; sizeInput.step = '1'; sizeInput.inputMode = 'numeric'; sizeInput.value = sizes[index]; sizeInput.dataset.skillSize = String(index);
          sizeInput.setAttribute('aria-label', `${title} team ${index + 1} gymnast count`);
          sizeInput.addEventListener('input', () => { if (phase === 'setup' && active && !destroyed) sizes[index] = sizeInput.value; });
          const stepper = node('div', 'swl-skill-stepper'), less = button('−', `size-${index}-less`, 'swl-skill-step'), more = button('+', `size-${index}-more`, 'swl-skill-step');
          less.setAttribute('aria-label', `Fewer gymnasts in team ${index + 1}`); more.setAttribute('aria-label', `More gymnasts in team ${index + 1}`);
          stepper.append(less, sizeInput, more); countLabel.append(node('span', '', 'Gymnasts'), stepper); row.append(label, countLabel); fields.append(row);
        }
      });
      const error = node('p', 'swl-skill-error', pool.length ? errorText : 'The skill list is not available yet. Return to this game once it has loaded.'); error.setAttribute('role', 'alert');
      panel.append(fields, error, button('Let’s play ↗', 'start-game', 'swl-skill-button swl-skill-primary', !pool.length));
      const rules = node('aside', 'swl-skill-rules'); rules.append(node('span', 'swl-skill-rule-icon', duel ? 'A↗' : '↝'), node('h3', '', duel ? 'Quick thinking. Real skills.' : 'Your skill. Your moment.'));
      if (duel) rules.append(node('p', '', 'Both teams play every letter. The coach awards 1 point to either team, or skips. First to 7 wins.'), node('p', 'swl-skill-muted', 'Use a familiar gymnastics floor skill or shape approved by the coach. Hints include the skill list and other floor basics. For numbered skills, use the first word.'));
      else {
        const list = node('ul', 'swl-skill-rating-guide');
        [[1, 'Does not count'], [2, 'Did it, messy'], [3, 'Almost perfect']].forEach(([stars, label]) => { const item = node('li'); item.append(node('b', '', '★'.repeat(stars)), node('span', '', label)); list.append(item); });
        rules.append(list, node('p', 'swl-skill-muted', 'Teams take turns until every gymnast has had one go. Finished teams are skipped. Coach chooses a familiar skill to attempt, or draws another.'), node('p', 'swl-skill-fair-rule', 'Highest average wins: total stars ÷ gymnasts. This keeps different-sized teams fair.'));
      }
      rules.append(node('p', 'swl-skill-session-note', 'Game points stay here. Skill League marks and points stay the same.'));
      const grid = node('div', 'swl-skill-setup-grid'); grid.append(panel, rules); root.append(grid);
    }
    function scoreboard(root) {
      const board = node('div', 'swl-skill-board'); board.setAttribute('aria-label', `${title} scoreboard`); board.dataset.teamCount = String(teams.length);
      teams.forEach((team, index) => {
        const item = node('div', `swl-skill-score${!duel && phase !== 'finished' && index === currentTeamIndex() ? ' is-current' : ''}`); item.style.setProperty('--squad-color', team.color);
        item.append(node('span', 'swl-skill-score-name', team.name), node('strong', '', duel ? String(team.score) : averageText(team)), node('span', 'swl-skill-score-unit', duel ? `points · first to ${TARGET}` : `avg stars / gymnast${phase === 'finished' ? '' : ' so far'}`));
        if (!duel) {
          item.append(node('span', 'swl-skill-score-detail', `${team.score} total ${team.score === 1 ? 'star' : 'stars'} · ${team.turns}/${team.size} gymnasts`));
          const compact = node('span', 'swl-skill-score-compact', `${team.score} ★ · ${team.turns}/${team.size} done`); compact.setAttribute('aria-hidden', 'true'); item.append(compact);
        }
        if (duel) { const track = node('div', 'swl-skill-track'), fill = node('span'); fill.style.width = `${team.score / TARGET * 100}%`; track.append(fill); item.append(track); }
        board.append(item);
      }); root.append(board);
      if (!duel) root.append(node('p', 'swl-skill-fair-note', 'Highest average wins · totals shown for every team.'));
    }
    function metaText(skill) {
      const category = ({ rolls: 'Rolls', acro: 'Acro & spins', leaps: 'Leaps' })[skill.category] || skill.category;
      const tier = ({ base: 'Base', upgrade: 'Upgrade', pro: 'Pro' })[skill.tier] || skill.tier;
      return [category, tier].filter(Boolean).join(' · ');
    }
    function playView(root) {
      const progress = node('div', 'swl-skill-progress');
      progress.append(node('span', '', duel ? `LETTER ${turn + 1}` : `${completedGymnasts()} / ${turnOrder.length} GYMNASTS COMPLETE`), node('span', '', duel ? 'BOTH TEAMS PLAY' : `${teams.length} TEAMS`)); root.append(progress);
      if (!duel) {
        const track = node('div', 'swl-skill-total-progress'), fill = node('span'); track.setAttribute('role', 'progressbar'); track.setAttribute('aria-label', 'Gymnasts who have completed their turn'); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', String(turnOrder.length)); track.setAttribute('aria-valuenow', String(completedGymnasts())); fill.style.width = `${completedGymnasts() / turnOrder.length * 100}%`; track.append(fill); root.append(track);
      }
      stage = node('section', 'swl-skill-stage'); stage.tabIndex = -1; stage.style.setProperty('--squad-color', duel ? COLORS[0] : teams[currentTeamIndex()].color);
      stage.append(node('p', 'swl-skill-turn', duel ? 'Think it. Show it.' : `${teams[currentTeamIndex()].name}’s turn`));
      if (!duel) stage.append(node('p', 'swl-skill-gymnast-number', `Gymnast ${currentGymnast()} of ${teams[currentTeamIndex()].size}`));
      const face = node('div', `swl-skill-face${duel ? ' swl-skill-letter-face' : selected ? ' swl-skill-reel-face' : ''}`);
      if (!duel && selected && phase !== 'ready') reelView(face);
      else if (['ready', 'paused'].includes(phase)) {
        face.append(node('span', 'swl-skill-placeholder', phase === 'paused' ? 'Ⅱ' : duel ? 'A–Z' : '↝'), node('h3', '', phase === 'paused' ? 'A little pause.' : duel ? 'What’s your letter?' : 'What’s your skill?'), node('p', 'swl-skill-muted', phase === 'paused' ? 'Your choice is saved. Resume the shuffle when everyone is ready.' : duel ? 'A fresh letter. One point up for grabs.' : 'Front gymnast ready? Let the shuffle choose.'));
      } else if (phase === 'shuffling') {
        const spinning = node('div', 'swl-skill-spinning'); spinning.setAttribute('aria-hidden', 'true');
        spinning.append(node('span', 'swl-skill-kicker', 'SHUFFLING'), node(duel ? 'div' : 'h3', duel ? 'swl-skill-letter' : 'swl-skill-chosen', preview.label)); face.append(spinning);
        face.append(node('p', 'swl-skill-muted', 'Here it comes…'));
      } else {
        if (!duel) face.append(node('span', 'swl-skill-badge', metaText(selected)));
        face.append(node(duel ? 'div' : 'h3', duel ? 'swl-skill-letter' : 'swl-skill-chosen', selected.label));
        face.append(node('p', 'swl-skill-instruction', duel ? `Show a gymnastics skill beginning with ${selected.label}.` : 'One attempt. Then cheer on your team.'));
      }
      stage.append(face);
      const controls = node('div', 'swl-skill-controls');
      if (phase === 'ready') controls.append(button(duel ? 'Draw a letter ↝' : 'Shuffle my skill ↝', 'draw', 'swl-skill-button swl-skill-primary swl-skill-go'));
      else if (phase === 'shuffling') controls.append(button('Pause Ⅱ', 'pause', 'swl-skill-text-button'));
      else if (phase === 'paused') controls.append(button('Resume shuffle ▶', 'resume', 'swl-skill-button swl-skill-primary'));
      else if (phase === 'awarded') {
        controls.append(node('p', 'swl-skill-award-result', skipped ? 'No points this letter' : duel ? `${teams[awardTeam].name} +1 point` : `${'★'.repeat(awardValue)} +${awardValue} ${awardValue === 1 ? 'star' : 'stars'}`));
        controls.append(button(!duel && turn + 1 === turnOrder.length ? 'See the results ↗' : duel ? 'Next letter ↝' : `Next: ${teams[turnOrder[turn + 1]].name} →`, 'next', 'swl-skill-button swl-skill-primary'), button(skipped ? 'Undo skip' : 'Undo rating', 'undo', 'swl-skill-text-button'));
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
          [[1, 'Does not count'], [2, 'Did it, messy'], [3, 'Almost perfect']].forEach(([stars, label]) => { const control = button('', `rate-${stars}`, 'swl-skill-rate'); control.setAttribute('aria-label', `${stars} ${stars === 1 ? 'star' : 'stars'}: ${label}`); control.append(node('span', '', '★'.repeat(stars)), node('b', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`), node('small', '', label)); awards.append(control); });
          stage.append(awards);
          const alternatives = node('div', 'swl-skill-extras'); alternatives.append(button('Coach: draw another skill', 'redraw', 'swl-skill-text-button'));
          stage.append(alternatives, node('p', 'swl-skill-familiar', 'Coach chooses a familiar skill to attempt.'));
        }
      }
      root.append(stage);
    }
    function finishView(root) {
      const winners = resultWinners(), best = winners[0];
      stage = node('section', 'swl-skill-finish'); stage.tabIndex = -1;
      stage.append(node('span', 'swl-skill-trophy', '✦'), node('p', 'swl-skill-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : duel ? 'LETTER DUEL WINNERS' : 'SKILL SHUFFLE WINNERS'), node('h3', '', winners.map(team => team.name).join(' + ')), node('p', 'swl-skill-result-points', duel ? `${best.score} points` : `${averageText(best)} stars per gymnast`), node('p', 'swl-skill-muted', winners.length > 1 ? `A tie! ${winners.length === 2 ? 'Both' : 'All three'} teams share the celebration.` : 'A team effort worth celebrating.'));
      if (!duel) stage.append(node('p', 'swl-skill-fair-note', `All ${turnOrder.length} gymnasts had one turn. Teams ranked by total stars ÷ gymnasts.`));
      const controls = node('div', 'swl-skill-controls'); controls.append(button('Play again ↝', 'replay', 'swl-skill-button swl-skill-primary'), button('Change teams', 'reset'), button('Undo last rating', 'undo', 'swl-skill-text-button')); stage.append(controls); root.append(stage);
    }
    function render(focus = false, focusAction = '') {
      if (destroyed) return;
      renderGeneration++; stage = null; reelViewport = reelTrack = null;
      const root = node('div', `swl-skill-game swl-skill-${mode}-game${immersive() ? ' is-immersive' : ''}`); gameRoot = root; root.dataset.static = String(motionOff()); root.dataset.phase = phase;
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
      updateLayout();
      updateReel();
      if (focus || focusAction) {
        const target = resetPrompt ? root.querySelector('[data-skill-action="cancel-reset"]') : focusAction ? root.querySelector(`[data-skill-action="${focusAction}"]`) : phase === 'paused' ? root.querySelector('[data-skill-action="resume"]') : stage || root.querySelector('[data-skill-name="0"]');
        try { target?.focus({ preventScroll: true }); } catch (_) {}
      }
    }
    function deactivate() { if (destroyed) return; pause(); active = false; cancelTimer(); render(); }
    function onVisibility() { if (document.hidden) { pause(); cancelTimer(); render(); } }
    function onResize() { if (active && !destroyed && !document.hidden) { updateLayout(); updateReel(); } }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener?.('resize', onResize);
    window.visualViewport?.addEventListener?.('resize', onResize);
    window.visualViewport?.addEventListener?.('scroll', onResize);
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
      destroy() { if (destroyed) return; destroyed = true; active = false; cancelTimer(); updateLayout(); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener?.('resize', onResize); window.visualViewport?.removeEventListener?.('resize', onResize); window.visualViewport?.removeEventListener?.('scroll', onResize); container.replaceChildren(); gameRoot = null; },
      getState() {
        return { mode, phase, active, sessionId, completionSent, turn, teamCount, round: teams.length ? duel ? Math.floor(turn / 2) + 1 : currentGymnast() : 0, currentTeam: !duel && teams.length ? currentTeamIndex() : null, currentGymnast: currentGymnast(), totalGymnasts: turnOrder.length, completedGymnasts: duel ? 0 : completedGymnasts(), teams: teams.map(team => ({ ...team, ...(!duel ? { average: team.turns ? team.score / team.turns : null } : {}) })), selected: selected ? { ...selected, ...(selected.matches ? { matches: selected.matches.map(skill => ({ ...skill })) } : {}) } : null, reel: !duel && reelCards.length ? { position: reelPosition(), targetIndex: REEL_TARGET, targetId: reelCards[REEL_TARGET].id, width: reelWidth, cardWidth: reelCardWidth, gap: REEL_GAP, offset: reelOffset } : null, poolSize: pool.length, skillCount: skills.length, remainingMs, awardValue, awardTeam, skipped, hints, resetPrompt };
      }
    };
    render(); return controller;
  }
  function moduleFor(mode) {
    let instance = null, mountedContainer = null;
    return Object.freeze({
      version: 3,
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
