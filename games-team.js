(() => {
  'use strict';
  if (window.SWLTeam?.version === 3) return;
  const DEFAULTS = ['Mint', 'Purple', 'Gold', 'Coral'];
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#ffab9e'];
  const ROUNDS = 5;
  const ROUND_MS = 10000;
  const CARDS = [
    {"id": "floating-handstand", "category": "Balance", "title": "Floating handstand", "task": "Show one gymnast in a handstand with no floor contact.", "cue": "Only a practised, coach-led support. Floor alternative: show a long handstand shape lying down. No new lifts.", "icon": "↟"},
    {"id": "headstand-finish", "category": "Balance", "title": "Headstand finish", "task": "Everyone is in their headstand shape when the boop sounds.", "cue": "Use only coach-approved, practised headstands. A familiar upright or floor balance is an equal alternative.", "icon": "◇"},
    {"id": "balance-mix", "category": "Balance", "title": "Balance mix", "task": "Everyone chooses a different balance and holds it to the end.", "cue": "Pick familiar shapes you can control. No two shapes the same.", "icon": "⋈"},
    {"id": "arabesque-line", "category": "Balance", "title": "Arabesque line", "task": "Make a line of matching arabesque-style balances.", "cue": "Choose a comfortable leg height. A toe resting on the floor is welcome.", "icon": "━"},
    {"id": "toe-tip-statues", "category": "Balance", "title": "Toe-tip statues", "task": "Rise onto your toes, choose an arm shape and stay still.", "cue": "Use a small heel lift you can control, or keep your heels down.", "icon": "↑"},
    {"id": "seated-v-crew", "category": "Balance", "title": "Seated V crew", "task": "Show a seated V shape together and hold it to the boop.", "cue": "Bent knees are welcome; toes can rest lightly on the floor.", "icon": "V"},
    {"id": "three-point-puzzle", "category": "Balance", "title": "Three-point puzzle", "task": "Balance with exactly three points touching the floor.", "cue": "Choose comfortable hand, knee or foot contacts. Keep your head free.", "icon": "∴"},
    {"id": "quarter-turn-freeze", "category": "Balance", "title": "Quarter-turn freeze", "task": "Turn a quarter of the way around, then freeze on one foot.", "cue": "Step around slowly rather than jumping. A light toe touch can help.", "icon": "↱"},
    {"id": "reach-and-return", "category": "Balance", "title": "Reach and return", "task": "Hold a balance while your arms reach forwards, then return.", "cue": "Choose your own familiar balance and keep the reach small.", "icon": "↔"},
    {"id": "side-shape-hold", "category": "Balance", "title": "Side-shape hold", "task": "Lie on your side and make one long, still shape.", "cue": "Reach your top arm and leg comfortably. Keep your own space.", "icon": "⌁"},
    {"id": "balance-transfer", "category": "Balance", "title": "Balance transfer", "task": "Move slowly from a left-leg balance to a right-leg balance.", "cue": "Show control in the change. Toe touches are welcome.", "icon": "⇄"},
    {"id": "star-jump-together", "category": "Synchronise", "title": "Star jump together", "task": "Everyone performs one star jump at exactly the same time.", "cue": "Choose the moment together, leave space, and finish with a quiet landing. A step-out star works too.", "icon": "✦"},
    {"id": "split-jump-together", "category": "Synchronise", "title": "Split jump together", "task": "Perform one synchronised split jump as a team.", "cue": "Use a comfortable range and a controlled landing in your own space. A split-shaped step is an alternative.", "icon": "↗"},
    {"id": "quiet-landing", "category": "Synchronise", "title": "Quiet landing", "task": "Do one small straight jump together and freeze the landing.", "cue": "Leave space and land softly. A rise onto toes and lower is an equal alternative.", "icon": "↓"},
    {"id": "tiny-to-tall", "category": "Synchronise", "title": "Tiny to tall", "task": "Grow from a tiny shape to a tall shape in complete unison.", "cue": "Move slowly from a comfortable low shape. Finish still, reaching together.", "icon": "↕"},
    {"id": "clap-turn-freeze", "category": "Synchronise", "title": "Clap, turn, freeze", "task": "Clap once, make a quarter-turn and freeze at the same time.", "cue": "Agree a shared count before Go. Keep the turn on your feet.", "icon": "↳"},
    {"id": "silent-start", "category": "Synchronise", "title": "Silent start", "task": "Lift both arms together without anyone saying when.", "cue": "Watch each other closely. Start and lower in one shared rhythm.", "icon": "⌃"},
    {"id": "matching-log-roll", "category": "Synchronise", "title": "Matching floor roll", "task": "Make one sideways log roll together, then stop in unison.", "cue": "Coach chooses the same clear direction for everyone. A side-to-side lean is an alternative.", "icon": "↶"},
    {"id": "seated-leg-fan", "category": "Synchronise", "title": "Seated leg fan", "task": "Open and close your seated leg shapes in perfect unison.", "cue": "Slide heels along the floor and use a comfortable range.", "icon": "⋁"},
    {"id": "opposite-levels", "category": "Synchronise", "title": "Opposite levels", "task": "Half the team grows tall while the other half goes low, then swap.", "cue": "Choose standing, seated or kneeling levels. Match the speed.", "icon": "⇵"},
    {"id": "salute-on-the-boop", "category": "Synchronise", "title": "Salute on the boop", "task": "Start in different poses; finish in one matching salute at the boop.", "cue": "Watch the countdown and arrive together. Keep feet grounded.", "icon": "✧"},
    {"id": "four-heel-beats", "category": "Synchronise", "title": "Four heel beats", "task": "Make four gentle heel raises in exactly the same rhythm.", "cue": "Keep toes on the floor. Small rises count.", "icon": "⋮"},
    {"id": "spell-marx", "category": "Build", "title": "Spell MARX", "task": "Use your bodies to spell M A R X before the time is up.", "cue": "Build the letters standing, seated or lying on the floor. Everyone has a part.", "icon": "M"},
    {"id": "connected-floor-star", "category": "Build", "title": "Connected floor star", "task": "Make one big connected star with every gymnast on the floor.", "cue": "Lie or sit in your own space and lightly connect hands or feet. Nobody supports another person’s weight.", "icon": "☆"},
    {"id": "connected-floor-circle", "category": "Build", "title": "Connected floor circle", "task": "Make a connected circle with every gymnast on the floor.", "cue": "Sit or lie in a ring with a light hand or foot connection. Keep everyone comfortable.", "icon": "◯"},
    {"id": "giant-floor-arrow", "category": "Build", "title": "Giant floor arrow", "task": "Use the whole team to make one giant arrow on the floor.", "cue": "Choose seated or lying shapes. Point the arrow towards the coach.", "icon": "➜"},
    {"id": "level-ladder", "category": "Build", "title": "Level ladder", "task": "Create a team picture with low, middle and tall shapes.", "cue": "Use lying, seated, kneeling or standing shapes. Each gymnast holds their own position.", "icon": "▥"},
    {"id": "human-compass", "category": "Build", "title": "Human compass", "task": "Make a group compass with everyone pointing a different way.", "cue": "Keep feet or seats on the floor. Use long arms and clear directions.", "icon": "✣"},
    {"id": "longest-floor-line", "category": "Build", "title": "Longest floor line", "task": "Create one long, tidy line of team shapes on the floor.", "cue": "Sit or lie next to each other with space. Line up fingertips or toes without pulling.", "icon": "—"},
    {"id": "symmetry-squad", "category": "Build", "title": "Symmetry squad", "task": "Make a team picture that matches on both sides.", "cue": "Choose a centre point and mirror your teammates. Keep each shape on the floor or standing.", "icon": "⋄"},
    {"id": "number-of-groups", "category": "Build", "title": "Number of groups", "task": "Coach calls a number: form exactly that many small groups.", "cue": "Choose a number the team can make. Each group finishes in its own shared pose.", "icon": "#"},
    {"id": "moving-machine", "category": "Build", "title": "Moving machine", "task": "Build an imaginary machine: each person is a different moving part.", "cue": "Stay in your own space. Use repeating arm or seated-leg actions that work together.", "icon": "⚙"},
    {"id": "empty-space-picture", "category": "Build", "title": "Empty-space picture", "task": "Make a picture using the empty space between your bodies.", "cue": "Try a window or a heart-shaped gap. Everyone stays on their own feet or seat.", "icon": "□"},
    {"id": "pointed-toe-gallery", "category": "Create", "title": "Pointed-toe gallery", "task": "Make a floor gallery of different shapes with pointed toes.", "cue": "Try familiar seated or lying shapes. Show a different outline from the person beside you.", "icon": "⌁"},
    {"id": "robot-squad", "category": "Create", "title": "Robot squad", "task": "Invent a robot routine with sharp angles and a clear final freeze.", "cue": "Use small controlled actions. Every robot needs its own space.", "icon": "⌑"},
    {"id": "underwater-team", "category": "Create", "title": "Underwater team", "task": "Make the squad look as if it is moving underwater.", "cue": "Use slow, flowing arms and familiar floor or standing shapes.", "icon": "≈"},
    {"id": "victory-signature", "category": "Create", "title": "Victory signature", "task": "Invent one original team victory pose and reveal it together.", "cue": "Include everyone. Make your own shape without climbing or lifting.", "icon": "✶"},
    {"id": "show-a-feeling", "category": "Create", "title": "Show a feeling", "task": "Coach names a feeling; show it using only body shapes.", "cue": "Try confident, calm or excited. Let your posture tell the story.", "icon": "♡"},
    {"id": "finish-line-photo", "category": "Create", "title": "Finish-line photo", "task": "Make a frozen picture of a team crossing an imaginary finish line.", "cue": "Create the photo in place. Different poses should tell one story.", "icon": "▧"},
    {"id": "animal-shape-museum", "category": "Create", "title": "Animal-shape museum", "task": "Become a museum of different animal-inspired gymnastics shapes.", "cue": "Choose a still floor or standing pose. Let the coach guess the animals.", "icon": "♧"},
    {"id": "weather-forecast", "category": "Create", "title": "Weather forecast", "task": "Turn the team into a moving weather forecast.", "cue": "Show wind, gentle rain or sunshine with arms and body shapes. Stay in your own space.", "icon": "☀"},
    {"id": "silent-disco", "category": "Create", "title": "Silent disco", "task": "Invent a short team dance without music, then finish together.", "cue": "Find a shared rhythm with steps, arms and poses. Keep movements small.", "icon": "♫"},
    {"id": "ten-second-story", "category": "Create", "title": "Ten-second story", "task": "Tell a beginning, a middle and an ending using three group pictures.", "cue": "Choose a simple story before Go. Keep the changes slow and clear.", "icon": "…"},
    {"id": "opposites-gallery", "category": "Create", "title": "Opposites gallery", "task": "In pairs, show opposite shapes: wide and narrow, curved and straight.", "cue": "Every pair chooses a different contrast. An odd-numbered team can use a trio.", "icon": "><"},
    {"id": "shape-dominoes", "category": "Sequence", "title": "Shape dominoes", "task": "Send a shape along the team, one gymnast after another.", "cue": "Choose tuck, pike or star. The last gymnast finishes the wave before the boop.", "icon": "⋮"},
    {"id": "tuck-pike-star", "category": "Sequence", "title": "Tuck, pike, star", "task": "Show tuck, pike and star shapes in perfect team unison.", "cue": "Choose standing or seated versions. Finish together in your star.", "icon": "✧"},
    {"id": "rock-and-freeze", "category": "Sequence", "title": "Rock and freeze", "task": "Rock once in a tucked floor shape, then freeze together.", "cue": "Use your own clear space and a familiar small rock. A seated tuck without rocking works too.", "icon": "⌒"},
    {"id": "arm-ripple", "category": "Sequence", "title": "Arm ripple", "task": "Send one smooth arm wave along the whole team.", "cue": "Stay in your own standing or seated space. Finish with everyone in a matching shape.", "icon": "≈"},
    {"id": "floor-to-feet", "category": "Sequence", "title": "Floor to feet", "task": "Move from seated to kneeling to standing, then salute together.", "cue": "Choose a familiar, comfortable way to rise. No speed race.", "icon": "↥"},
    {"id": "travel-turn-finish", "category": "Sequence", "title": "Travel, turn, finish", "task": "Take two steps, make a quarter-turn and finish in a lunge shape.", "cue": "Use your own clear lane and a comfortable lunge. Match the finish.", "icon": "↱"},
    {"id": "direction-code", "category": "Sequence", "title": "Direction code", "task": "Step forwards, back and sideways, then return to your starting spot.", "cue": "Small steps in your own space. Remember the order together.", "icon": "↔"},
    {"id": "body-rhythm", "category": "Sequence", "title": "Body rhythm", "task": "Tap thighs, clap, raise heels: repeat that rhythm together.", "cue": "Two clear repeats beat rushing. Seated toe lifts work too.", "icon": "⋰"},
    {"id": "reverse-the-routine", "category": "Sequence", "title": "Reverse the routine", "task": "Coach shows three simple shapes; perform them in reverse order.", "cue": "Watch before Go. Choose familiar standing or seated shapes.", "icon": "↶"},
    {"id": "growing-sequence", "category": "Sequence", "title": "Growing sequence", "task": "Each person adds one simple action; perform the chain together.", "cue": "Choose a short group chain before Go. Use poses, arm actions or small steps.", "icon": "+"},
    {"id": "cross-body-code", "category": "Sequence", "title": "Cross-body code", "task": "Touch opposite hand to knee, swap sides, then finish in a star.", "cue": "Lift knees only as high as comfortable. You can do this seated.", "icon": "×"},
    {"id": "mirror-balances", "category": "Cooperate", "title": "Mirror balances", "task": "Make matching balances in pairs, like reflections in a mirror.", "cue": "An odd-numbered team can make a trio. Hold your own weight and match the shapes.", "icon": "↔"},
    {"id": "silent-height-line", "category": "Cooperate", "title": "Silent height line", "task": "Without talking, arrange your team from shortest to tallest.", "cue": "Walk carefully into place, then hold one shared finishing pose.", "icon": "▥"},
    {"id": "leader-swap", "category": "Cooperate", "title": "Leader swap", "task": "Mirror one leader; when coach points, follow a new leader smoothly.", "cue": "Use simple arm actions and grounded shapes. Keep watching.", "icon": "⇄"},
    {"id": "invisible-ball", "category": "Cooperate", "title": "Invisible ball", "task": "Pass an imaginary ball around the whole team without losing its shape.", "cue": "Mime a clear catch and pass. Finish in a balanced pose when it returns.", "icon": "◌"},
    {"id": "describe-and-copy", "category": "Cooperate", "title": "Describe and copy", "task": "One partner describes a familiar shape while the other builds it.", "cue": "Use words before showing the answer. Choose a comfortable floor or standing shape.", "icon": "”"},
    {"id": "count-together", "category": "Cooperate", "title": "Count together", "task": "Count up as a team, with a different voice saying each number.", "cue": "Hold a comfortable pose. If two speak together, calmly restart at one.", "icon": "123"},
    {"id": "two-conductors", "category": "Cooperate", "title": "Two conductors", "task": "Follow one leader’s arms and a second leader’s small steps.", "cue": "Leaders keep it simple and slow. Everyone stays in their own space.", "icon": "⋈"},
    {"id": "shared-finish", "category": "Cooperate", "title": "Shared finish", "task": "Each person shows their own move; agree one pose to finish together.", "cue": "Pick familiar actions before Go. The final shape belongs to everyone.", "icon": "✦"},
    {"id": "equal-gaps", "category": "Cooperate", "title": "Equal gaps", "task": "Form a line with equal spaces, then raise your arms together.", "cue": "Use your eyes to judge the gaps. No touching or stretching to reach.", "icon": "· · ·"},
    {"id": "odd-one-out", "category": "Cooperate", "title": "Odd one out", "task": "Make matching shapes except for one secret, different gymnast.", "cue": "Agree the odd one out before Go. Coach guesses who changed the picture.", "icon": "?"},
    {"id": "shape-agreement", "category": "Cooperate", "title": "Shape agreement", "task": "Without words or a leader, settle on one shape everyone can match.", "cue": "Watch the team and adapt. Choose comfortable standing or seated shapes.", "icon": "✓"}
  ];
  const CARD_BY_ID = new Map(CARDS.map(card => [card.id, card]));
  const HISTORY_KEY = 'swl-team-card-history-v1';
  function loadCardHistory() {
    try {
      const raw = window.localStorage?.getItem(HISTORY_KEY);
      if (!raw || raw.length > 20000) return [];
      const value = JSON.parse(raw);
      if (!Array.isArray(value)) return [];
      // Accept only known IDs; old, duplicated or corrupted entries never become card content.
      return [...new Set(value.filter(id => typeof id === 'string' && CARD_BY_ID.has(id)))];
    } catch (_) { return []; }
  }
  let cardHistory = loadCardHistory(), deck = [];
  let previousCategory = CARD_BY_ID.get(cardHistory[cardHistory.length - 1])?.category;
  function randomBelow(maximum) {
    try {
      if (typeof window.crypto?.getRandomValues === 'function') {
        const number = new Uint32Array(1), limit = 0x100000000 - (0x100000000 % maximum);
        for (let attempt = 0; attempt < 8; attempt++) {
          window.crypto.getRandomValues(number);
          if (number[0] < limit) return number[0] % maximum;
        }
      }
    } catch (_) {}
    return Math.floor(Math.random() * maximum);
  }
  function nextCard() {
    if (!deck.length) {
      const seen = new Set(cardHistory);
      deck = CARDS.filter(card => !seen.has(card.id)).map(card => card.id);
      if (!deck.length) { cardHistory = []; deck = CARDS.map(card => card.id); }
      for (let index = deck.length - 1; index > 0; index--) {
        const other = randomBelow(index + 1);
        [deck[index], deck[other]] = [deck[other], deck[index]];
      }
    }
    const differentCategory = deck.findIndex(id => CARD_BY_ID.get(id).category !== previousCategory);
    const id = deck.splice(differentCategory < 0 ? 0 : differentCategory, 1)[0];
    cardHistory.push(id);
    previousCategory = CARD_BY_ID.get(id).category;
    // Only card IDs persist. A blocked or full store falls back to this in-memory deck.
    try { window.localStorage?.setItem(HISTORY_KEY, JSON.stringify(cardHistory)); } catch (_) {}
    return { ...CARD_BY_ID.get(id) };
  }
  const cleanName = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')).slice(0, 24).join('');
  let instance = null, mountedContainer = null;

  function createGame(container, initialOptions) {
    let options = initialOptions || {}, active = true, destroyed = false;
    let phase = 'setup', teamCount = 2, names = DEFAULTS.slice();
    let teams = [], turn = 0, card = null, awardedStars = 0;
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
      card = nextCard();
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
      turn = 0; resetPrompt = false; errorText = ''; prepareTurn(); render(true); showStage();
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
      cancelTimer(); phase = 'setup'; teams = []; turn = 0; card = null; awardedStars = 0; remainingMs = 0;
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
      panel.append(node('p', 'swl-team-kicker', `${CARDS.length} CARDS · ONE TEAM SPIRIT`), node('h3', '', 'Choose your squads'), node('p', 'swl-team-muted', 'Read the card together. Press Go. You have ten seconds to make it happen.'));
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
      const meta = node('div', 'swl-team-card-meta'), category = node('span', 'swl-team-category', card.category);
      category.dataset.category = card.category.toLowerCase();
      meta.append(category, node('p', 'swl-team-card-step', phase === 'ready' ? 'READ TOGETHER · THEN GO' : phase === 'paused' ? 'TAKE A BREATHER' : ['review', 'awarded'].includes(phase) ? 'CHALLENGE COMPLETE' : 'MAKE IT HAPPEN'));
      text.append(meta);
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
    version: 3,
    cardCount: CARDS.length,
    mount(container, options = {}) {
      if (!container || typeof container.replaceChildren !== 'function') throw Error('A team game container is required.');
      if (instance && !instance.destroyed && mountedContainer === container) { instance.updateOptions(options); instance.activate(); return instance; }
      instance?.destroy(); mountedContainer = container; instance = createGame(container, options); return instance;
    },
    deactivate() { instance?.deactivate(); },
    destroy() { instance?.destroy(); instance = null; mountedContainer = null; }
  });
})();
