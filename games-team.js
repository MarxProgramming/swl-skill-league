(() => {
  'use strict';
  if (window.SWLTeam?.version === 3) return;
  const DEFAULTS = ['Mint', 'Purple', 'Gold', 'Coral'];
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#ffab9e'];
  const ROUNDS = 5;
  const ROUND_MS = 10000;
  const CARDS = [
    {
      "id": "floating-handstand",
      "category": "Balance",
      "title": "Supported handstand",
      "task": "One gymnast shows a coach-supported handstand while the team holds matching straight body shapes on the floor.",
      "cue": "Coach selects a familiar supported handstand, hands on the floor, and prepares before Go. Teammates copy its long body line lying down.",
      "icon": "↟"
    },
    {
      "id": "headstand-finish",
      "category": "Balance",
      "title": "Headstand finish",
      "task": "Finish together in your practised headstand or the coach’s chosen floor balance.",
      "cue": "Coach approves each gymnast’s skill and exit before Go. Front support is an alternative; the aim is a still, controlled finish.",
      "icon": "◇"
    },
    {
      "id": "balance-mix",
      "category": "Balance",
      "title": "Balance mix",
      "task": "Everyone holds a different gymnastics balance for three seconds at the same time.",
      "cue": "Agree the balances before Go. Show clear shapes, pointed toes and a controlled way out.",
      "icon": "⋈"
    },
    {
      "id": "arabesque-line",
      "category": "Balance",
      "title": "Arabesque line",
      "task": "In one line, show matching arabesque balances and hold together for three seconds.",
      "cue": "Agree which leg lifts and where the arms go. Keep hips level and choose a leg height each gymnast can control.",
      "icon": "━"
    },
    {
      "id": "matched-one-leg",
      "category": "Balance",
      "title": "Matched one-leg balance",
      "task": "Balance on one leg together, swap legs on the coach’s cue, then hold the second balance.",
      "cue": "Keep the standing foot still and match the arm position. Place the free foot down briefly if needed.",
      "icon": "↑"
    },
    {
      "id": "front-support-line",
      "category": "Balance",
      "title": "Front support line",
      "task": "Make a straight row of front-support shapes and hold the same body line for three seconds.",
      "cue": "Hands stay beneath shoulders; each gymnast supports their own weight. Coach can choose a knees-down version.",
      "icon": "▰"
    },
    {
      "id": "seated-v-crew",
      "category": "Balance",
      "title": "Seated V hold",
      "task": "Show matching seated V balances, hold for three seconds, then lower together.",
      "cue": "Lift into the shape with control. Coach chooses straight or bent knees so everyone can join the same timing.",
      "icon": "V"
    },
    {
      "id": "three-point-puzzle",
      "category": "Balance",
      "title": "Three-point balance",
      "task": "Make a balance with exactly three body contacts on the floor, then hold it with the team.",
      "cue": "Choose familiar hand, knee or foot contacts. Match the start and finish and keep the head free of weight.",
      "icon": "∴"
    },
    {
      "id": "star-jump-together",
      "category": "Synchronise",
      "title": "Star jump together",
      "task": "Perform one star jump as a whole team and stick the landing at exactly the same time.",
      "cue": "Agree a count before Go. Match the star shape and finish still on two feet in your own space.",
      "icon": "✦"
    },
    {
      "id": "split-jump-together",
      "category": "Synchronise",
      "title": "Split jump together",
      "task": "Perform one synchronised split jump, then hold a controlled landing together.",
      "cue": "Use a practised jump and each gymnast’s comfortable split range. Coach can choose a split-shaped step instead.",
      "icon": "↗"
    },
    {
      "id": "quiet-landing",
      "category": "Synchronise",
      "title": "Straight jump and stick",
      "task": "Make two straight jumps together, pausing to stick each landing.",
      "cue": "Match the arm lift and timing. Show two distinct landings with softly bent knees, rather than rushing into rebounds.",
      "icon": "↓"
    },
    {
      "id": "tuck-jump-together",
      "category": "Synchronise",
      "title": "Tuck jump together",
      "task": "Perform one matching tuck jump, then land and salute together.",
      "cue": "Use a familiar tuck jump with enough space between gymnasts. Coach may choose a straight jump with a knee lift instead.",
      "icon": "⌃"
    },
    {
      "id": "quarter-turn-jump",
      "category": "Synchronise",
      "title": "Quarter-turn jump",
      "task": "Jump a quarter-turn together and finish facing the same direction.",
      "cue": "Agree the direction first. Keep to your own spot and show a still two-foot landing before standing tall.",
      "icon": "↱"
    },
    {
      "id": "matching-log-roll",
      "category": "Synchronise",
      "title": "Matching log roll",
      "task": "Make one stretched log roll together, arriving in the same finishing shape.",
      "cue": "Start in parallel floor spaces. Coach checks the rolling direction; keep arms and legs long and stop together.",
      "icon": "↶"
    },
    {
      "id": "split-shapes-together",
      "category": "Synchronise",
      "title": "Split shape together",
      "task": "Move into your practised split position together, hold briefly, then come out together.",
      "cue": "Coach chooses the preparation and a comfortable range for each gymnast. Match the timing; nobody pushes another person into position.",
      "icon": "↔"
    },
    {
      "id": "matching-lunge",
      "category": "Synchronise",
      "title": "Matching lunge finish",
      "task": "Step into a matching gymnastics lunge, stretch tall, then return to standing together.",
      "cue": "Agree the leading leg and arm position. Control the step and keep the front knee tracking over the foot.",
      "icon": "↕"
    },
    {
      "id": "connected-floor-star",
      "category": "Shapes",
      "title": "Connected floor star",
      "task": "Build one large connected star from the team’s straight shapes on the floor.",
      "cue": "Plan positions before Go. Connect lightly with hands or feet while every gymnast keeps their own weight on the floor.",
      "icon": "☆"
    },
    {
      "id": "connected-floor-circle",
      "category": "Shapes",
      "title": "Connected floor circle",
      "task": "Create a connected circle of tuck, pike or straddle shapes and hold it still.",
      "cue": "Everyone sits on the floor and makes a clear gymnastic shape. Use light hand or foot contact, without pulling.",
      "icon": "◯"
    },
    {
      "id": "spell-marx",
      "category": "Shapes",
      "title": "Spell MARX",
      "task": "Use the whole team’s body shapes to spell M A R X clearly on the floor.",
      "cue": "Decide the letters and positions before Go. Use straight, angled or curved shapes; everyone stays supported by the floor.",
      "icon": "M"
    },
    {
      "id": "partner-pikes",
      "category": "Shapes",
      "title": "Partner pike shapes",
      "task": "In pairs, sit back-to-back in matching pike shapes, then open to a matching straddle.",
      "cue": "Keep your own balance with light back contact. Extend the legs and toes without forcing the range.",
      "icon": "⋁"
    },
    {
      "id": "paired-straddle",
      "category": "Shapes",
      "title": "Paired straddle picture",
      "task": "Face a partner in matching seated straddles and make one symmetrical floor picture.",
      "cue": "Agree the arm position and leg width. Keep knees and toes facing upwards and use only comfortable movement.",
      "icon": "⋄"
    },
    {
      "id": "tuck-pike-star",
      "category": "Shapes",
      "title": "Tuck, pike, star",
      "task": "Show tuck, seated pike and star shapes in a clean three-shape sequence together.",
      "cue": "Make each shape clearly recognisable. Match the changeovers and finish still in the final star.",
      "icon": "✧"
    },
    {
      "id": "dish-arch-pairs",
      "category": "Shapes",
      "title": "Dish and arch pairs",
      "task": "One partner shows a dish while the other shows an arch; swap on the coach’s cue.",
      "cue": "Use parallel floor spaces and familiar shapes. Keep the lifts small and controlled, then lower before changing position.",
      "icon": "⌁"
    },
    {
      "id": "mirrored-floor-shapes",
      "category": "Shapes",
      "title": "Mirrored floor shapes",
      "task": "In pairs, create matching floor shapes that reflect each other across an imaginary centre line.",
      "cue": "Choose pike, straddle, tuck or straight shapes before Go. Match arms, legs and body angle without taking each other’s weight.",
      "icon": "⇄"
    },
    {
      "id": "forward-roll-together",
      "category": "Rolls",
      "title": "Forward roll together",
      "task": "Perform one practised forward roll together and finish in matching shapes.",
      "cue": "Coach checks readiness, mats and separate lanes before Go. Use the roll and exit already taught to each gymnast.",
      "icon": "↷"
    },
    {
      "id": "tuck-rock-stand",
      "category": "Rolls",
      "title": "Tuck rock to stand",
      "task": "Rock backwards and forwards in tuck, then return to standing together.",
      "cue": "Use the familiar progression chosen by the coach. Hands may help with the stand; finish balanced rather than rushing.",
      "icon": "⌒"
    },
    {
      "id": "log-roll-return",
      "category": "Rolls",
      "title": "Log roll and return",
      "task": "Make one long log roll, pause, then roll back to the starting position together.",
      "cue": "Leave a clear lane for each gymnast. Keep the shape stretched and use the same turning direction.",
      "icon": "↔"
    },
    {
      "id": "egg-roll-freeze",
      "category": "Rolls",
      "title": "Tucked side roll",
      "task": "In a tucked shape, roll sideways once and stop in a balanced tuck with the team.",
      "cue": "Coach demonstrates the familiar tucked side roll first. Keep your own clear floor space and stop without unfolding early.",
      "icon": "◌"
    },
    {
      "id": "teddy-bear-roll",
      "category": "Rolls",
      "title": "Teddy bear roll",
      "task": "Perform one practised teddy bear roll and finish together in a seated straddle.",
      "cue": "Use the coach-taught roll and comfortable straddle range. Match the finish and keep each gymnast in a separate space.",
      "icon": "↶"
    },
    {
      "id": "dish-arch-roll",
      "category": "Rolls",
      "title": "Dish to arch roll",
      "task": "Roll from dish to arch together, then return to dish with control.",
      "cue": "Keep a long body line in your own lane. Use familiar shapes and pause briefly at each end.",
      "icon": "≈"
    },
    {
      "id": "roll-to-split",
      "category": "Rolls",
      "title": "Roll to split shape",
      "task": "Link one familiar roll to a comfortable split or straddle shape, then hold the finish.",
      "cue": "Agree the roll, transition and finish with the coach before Go. Aim for a smooth link, not a deeper split.",
      "icon": "↗"
    },
    {
      "id": "two-wave-roll",
      "category": "Rolls",
      "title": "Two-wave roll",
      "task": "Half the team performs a log roll, then the other half follows one count later.",
      "cue": "Arrange separate lanes before Go. Keep the same shape and finish, with a clear one-count gap between the groups.",
      "icon": "⇉"
    },
    {
      "id": "jump-balance-link",
      "category": "Sequence",
      "title": "Jump into balance",
      "task": "Link one straight jump to a one-leg balance and hold the balance for three seconds.",
      "cue": "Land the jump first, then move smoothly into the agreed balance. Everyone uses the same order and finish.",
      "icon": "↑"
    },
    {
      "id": "roll-balance-link",
      "category": "Sequence",
      "title": "Roll into balance",
      "task": "Link one familiar roll to a floor balance, then hold the final shape together.",
      "cue": "Choose the roll and balance before Go. Coach checks each gymnast’s version; make the transition deliberate and controlled.",
      "icon": "↷"
    },
    {
      "id": "turn-jump-finish",
      "category": "Sequence",
      "title": "Turn, jump, finish",
      "task": "Step a half-turn, perform one star jump, then finish in a gymnastics lunge together.",
      "cue": "Agree the turn direction and leading leg. Show three clear actions with controlled links.",
      "icon": "↱"
    },
    {
      "id": "three-shape-routine",
      "category": "Sequence",
      "title": "Three-shape routine",
      "task": "Link a low tuck, a straight standing shape and a one-leg balance into one short routine.",
      "cue": "Agree a shared count. Keep the transitions smooth and hold the final balance for three seconds.",
      "icon": "⋮"
    },
    {
      "id": "split-shape-salute",
      "category": "Sequence",
      "title": "Split shape to salute",
      "task": "Show a comfortable split or straddle, rise using your practised transition, then salute together.",
      "cue": "Plan the route to standing before Go. Control the rise and match the final straight shape.",
      "icon": "↥"
    },
    {
      "id": "lunge-support-lunge",
      "category": "Sequence",
      "title": "Lunge, support, lunge",
      "task": "Move from a lunge into front support, then return to a standing lunge together.",
      "cue": "Use the coach’s familiar step-in and step-out route. Place hands securely and move one foot at a time if needed.",
      "icon": "▱"
    },
    {
      "id": "roll-jump-finish",
      "category": "Sequence",
      "title": "Roll, jump, stick",
      "task": "Perform one familiar roll, stand, then add one straight jump with a still landing.",
      "cue": "Use separate lanes and the coach-approved roll. A clean transition matters more than speed.",
      "icon": "↟"
    },
    {
      "id": "mirror-two-skills",
      "category": "Sequence",
      "title": "Mirror two skills",
      "task": "In pairs, perform a two-skill sequence as mirror images: one balance and one jump.",
      "cue": "Choose the order and opposite leading legs before Go. Match the timing and make the finish identical.",
      "icon": "⋈"
    },
    {
      "id": "mirror-balances",
      "category": "Teamwork",
      "title": "Mirror balances",
      "task": "Partners show two matching balances in sequence, reflecting each other’s arm and leg positions.",
      "cue": "Agree both balances before Go. Each gymnast supports their own body; a trio can use one centre gymnast and two mirrors.",
      "icon": "↔"
    },
    {
      "id": "linked-shape-chain",
      "category": "Teamwork",
      "title": "Linked floor chain",
      "task": "Build a chain of different seated gymnastics shapes with every team member connected.",
      "cue": "Use pike, tuck or straddle shapes and light hand or foot contact. Each gymnast keeps their weight on the floor.",
      "icon": "⋯"
    },
    {
      "id": "three-level-finish",
      "category": "Teamwork",
      "title": "Three-level finish",
      "task": "Create one team finish with floor, kneeling and standing gymnastics shapes visible together.",
      "cue": "Assign the levels before Go. Every gymnast holds their own position, with a clear shape and no climbing.",
      "icon": "▥"
    },
    {
      "id": "symmetry-squad",
      "category": "Teamwork",
      "title": "Symmetrical team balance",
      "task": "Create a symmetrical team picture with matching gymnastic balances on both sides.",
      "cue": "Choose a centre line and pair the positions. Hold for three seconds with everyone supporting their own weight.",
      "icon": "⋄"
    },
    {
      "id": "together-then-canon",
      "category": "Teamwork",
      "title": "Together, then in canon",
      "task": "Perform one straight jump together, then move into balances one group after the other.",
      "cue": "Agree two groups and a one-count gap. Keep the first action simultaneous and the second clearly staggered.",
      "icon": "⇄"
    },
    {
      "id": "copy-two-shapes",
      "category": "Teamwork",
      "title": "Copy two shapes",
      "task": "One half of the team shows tuck then pike; the other half immediately repeats the same sequence.",
      "cue": "Agree the two groups and counts before Go. Keep the shapes clear and finish in matching pikes.",
      "icon": "⇉"
    },
    {
      "id": "partner-roll-finish",
      "category": "Teamwork",
      "title": "Partner roll finish",
      "task": "Partners start one count apart but finish their familiar floor rolls in the same shape together.",
      "cue": "Coach chooses compatible rolls and spacing before Go. Adjust the start timing, without rushing the rolls.",
      "icon": "↶"
    },
    {
      "id": "team-precision",
      "category": "Teamwork",
      "title": "Team precision routine",
      "task": "Perform a shared two-skill routine with one balance and one floor roll, all finishing together.",
      "cue": "Agree the skills and one quality target before Go: straight legs, pointed toes or a still finish. Coach judges that target.",
      "icon": "✓"
    }
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
