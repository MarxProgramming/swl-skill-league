(() => {
  'use strict';
  if (window.SWLTeam?.version === 3) return;
  const DEFAULTS = ['Mint', 'Purple', 'Gold', 'Coral', 'Sky'];
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782', '#ffab9e', '#83d9ff'];
  const ROUNDS = 4;
  const ROUND_MS = 10000;
  const CARDS = [
    {
      "id": "floating-handstand",
      "category": "Balance",
      "title": "Handstand off the floor",
      "task": "One gymnast finishes in a supported handstand with no part of their body touching the floor.",
      "cue": "Use a low, practised handstand support with the coach directing it. Agree the supported exit before Go.",
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
      "title": "V sit",
      "task": "Show matching V sits, hold for three seconds, then lower together.",
      "cue": "Lift into the V sit with control. Coach chooses straight or bent knees so everyone can join the same timing.",
      "icon": "V"
    },
    {
      "id": "star-jump-together",
      "category": "Jump & stick",
      "title": "Star jump together",
      "task": "Perform one star jump together and each stick your landing.",
      "cue": "Agree a count before Go. Show the star shape, land in your own space and hold the finish.",
      "icon": "✦"
    },
    {
      "id": "split-jump-together",
      "category": "Jump & stick",
      "title": "Split jump together",
      "task": "Perform one split jump at the same time and stick your landings together.",
      "cue": "Use a practised jump and each gymnast’s comfortable split range. Coach can choose a split-shaped step instead.",
      "icon": "↗"
    },
    {
      "id": "full-turn-stick",
      "category": "Jump & stick",
      "title": "Full turn and stick",
      "task": "Everyone performs a full-turn jump at the same time and sticks the landing.",
      "cue": "Agree a count, turn in your own space and hold a controlled landing until the timer ends.",
      "icon": "↓"
    },
    {
      "id": "tuck-jump-together",
      "category": "Jump & stick",
      "title": "Tuck jump together",
      "task": "Perform one tuck jump together and each stick the landing before saluting.",
      "cue": "Use a familiar tuck jump with enough space between gymnasts. Coach may choose a straight jump with a knee lift instead.",
      "icon": "⌃"
    },
    {
      "id": "split-shapes-together",
      "category": "Shapes",
      "title": "Split shape together",
      "task": "Move into your practised split position together, hold briefly, then come out together.",
      "cue": "Coach chooses the preparation and a comfortable range for each gymnast. Match the timing; nobody pushes another person into position.",
      "icon": "↔"
    },
    {
      "id": "straddle-jump-together",
      "category": "Jump & stick",
      "title": "Straddle jump together",
      "task": "Show one matching straddle jump and finish in a still two-foot landing together.",
      "cue": "Use the coach-approved jump and comfortable leg range already practised. Match the timing rather than trying for extra height.",
      "icon": "↔"
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
      "id": "paired-straddle",
      "category": "Shapes",
      "title": "Paired straddle picture",
      "task": "Face a partner in matching seated straddles and make one symmetrical floor picture.",
      "cue": "Agree the arm position and leg width. Keep knees and toes facing upwards and use only comfortable movement.",
      "icon": "⋄"
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
      "id": "straight-floor-line",
      "category": "Shapes",
      "title": "Straight floor line",
      "task": "Lie in parallel lanes and make matching long, straight gymnastics shapes from fingertips to toes.",
      "cue": "Stretch the arms overhead and bring the legs together. Keep a comfortable body line on the floor and finish with pointed toes.",
      "icon": "━"
    },
    {
      "id": "narrow-wide-shapes",
      "category": "Shapes",
      "title": "Narrow and wide shapes",
      "task": "Half the team makes a narrow straight shape on the floor while the other half makes a wide star; swap together.",
      "cue": "Agree positions before Go and leave room for the wide shapes. Make the contrast clear while keeping everyone’s weight on the floor.",
      "icon": "✧"
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
      "id": "cartwheel-freeze",
      "category": "Sequence",
      "title": "Cartwheel and freeze",
      "task": "Perform one familiar cartwheel in separate lanes, then freeze in a tall finishing shape together.",
      "cue": "Coach approves each gymnast’s cartwheel or practised side-travel progression before Go. Leave clear lanes and control the finish.",
      "icon": "↷"
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
      "id": "symmetry-squad",
      "category": "Teamwork",
      "title": "Symmetrical team balance",
      "task": "Create a symmetrical team picture with matching gymnastic balances on both sides.",
      "cue": "Choose a centre line and pair the positions. Hold for three seconds with everyone supporting their own weight.",
      "icon": "⋄"
    },
    {
      "id": "three-skills-choice",
      "category": "Teamwork",
      "title": "Three skills of any choice",
      "task": "Choose any three familiar gymnastics skills and perform them as a team, finishing together.",
      "cue": "Agree the three skills and their order before Go. Choose short skills that everyone already knows.",
      "icon": "✓"
    },
    {
      "id": "conditioning-burpees",
      "category": "Conditioning",
      "title": "Five burpees each",
      "task": "Complete five short burpees each in 10 seconds: crouch, hands down, feet back, feet in, then stand.",
      "cue": "Use the practised version agreed before Go; no press-up or high jump is needed. Keep control and stop when the timer ends.",
      "icon": "↟"
    },
    {
      "id": "conditioning-press-ups",
      "category": "Conditioning",
      "title": "Four press-ups each",
      "task": "Complete four controlled press-ups each during your 10-second turn.",
      "cue": "Coach chooses knees-down or full press-ups before Go. Keep a straight body line and lower and lift the chest with control.",
      "icon": "↓"
    },
    {
      "id": "conditioning-jumping-jacks",
      "category": "Conditioning",
      "title": "Eight jumping jacks each",
      "task": "Complete eight jumping jacks each in 10 seconds, returning feet and arms together to count each rep.",
      "cue": "Start together and use a steady shared rhythm. Land softly in your own space; a step-out version is fine when the coach chooses it.",
      "icon": "✦"
    },
    {
      "id": "conditioning-v-sits",
      "category": "Conditioning",
      "title": "Four V sits each",
      "task": "Complete four V sits each in 10 seconds, lifting into the shape and lowering with control each time.",
      "cue": "Start seated with hands available for support. Coach chooses bent or straight knees; count a rep only after returning to the start.",
      "icon": "V"
    },
    {
      "id": "conditioning-squats",
      "category": "Conditioning",
      "title": "Six squats each",
      "task": "Complete six squats each in 10 seconds, returning to a tall stand after every squat.",
      "cue": "Keep heels down and knees following the toes. Choose a comfortable depth and use the same steady count as the team.",
      "icon": "↕"
    },
    {
      "id": "conditioning-dish-rocks",
      "category": "Conditioning",
      "title": "Four dish rocks each",
      "task": "Complete four small dish rocks each in 10 seconds, counting one back-and-forward movement as a rep.",
      "cue": "Use a familiar dish shape with the coach’s chosen arm and knee position. Keep the body shape still as you rock gently.",
      "icon": "≈"
    },
    {
      "id": "conditioning-straddle-lifts",
      "category": "Conditioning",
      "title": "Four straddle leg lifts each",
      "task": "From a seated straddle, complete four alternating leg lifts each in 10 seconds; each lifted heel counts as one.",
      "cue": "Keep the hands on the floor for support and use a comfortable straddle width. Lift one straight leg a little, lower, then change legs.",
      "icon": "⋁"
    },
    {
      "id": "reenact-marx",
      "category": "Reenactment",
      "title": "Marx coaching a gymnast",
      "task": "Reenact Marx coaching a gymnast. One teammate plays Marx, another plays the gymnast, and the rest help set the scene.",
      "cue": "You have 10 seconds. Use familiar coaching phrases, gestures and expressions to make your impression recognisable. Keep it playful and kind; acting is enough.",
      "icon": "M"
    },
    {
      "id": "reenact-dan",
      "category": "Reenactment",
      "title": "Dan coaching a gymnast",
      "task": "Reenact Dan coaching a gymnast. One teammate plays Dan, another plays the gymnast, and the rest help set the scene.",
      "cue": "You have 10 seconds. Use familiar coaching phrases, gestures and expressions to make your impression recognisable. Keep it playful and kind; acting is enough.",
      "icon": "D"
    },
    {
      "id": "reenact-isabella",
      "category": "Reenactment",
      "title": "Isabella coaching a gymnast",
      "task": "Reenact Isabella coaching a gymnast. One teammate plays Isabella, another plays the gymnast, and the rest help set the scene.",
      "cue": "You have 10 seconds. Use familiar coaching phrases, gestures and expressions to make your impression recognisable. Keep it playful and kind; acting is enough.",
      "icon": "I"
    },
    {
      "id": "half-turn-stick",
      "category": "Jump & stick",
      "title": "Half turn and stick",
      "task": "Everyone performs a half-turn jump at the same time and sticks the landing.",
      "cue": "Agree the turning direction before Go. Stay in your own space and hold the finish together.",
      "icon": "↱"
    },
    {
      "id": "one-and-half-turn-stick",
      "category": "Jump & stick",
      "title": "One gymnast: 1½ turns and stick",
      "task": "One gymnast performs a one-and-a-half-turn jump and sticks the landing, with the team counting them in.",
      "cue": "Coach chooses a gymnast who already practises this jump. Show a controlled take-off and hold the landing.",
      "icon": "↻"
    },
    {
      "id": "backward-roll-front-support",
      "category": "Rolls",
      "title": "Backward roll to front support",
      "task": "Perform a backward roll to front support together, then hold the front-support finish.",
      "cue": "Use the version already taught by the coach, with a clear lane for each gymnast and a controlled finish.",
      "icon": "↶"
    },
    {
      "id": "cool-balance",
      "category": "Balance",
      "title": "Cool balance",
      "task": "Everyone shows a cool gymnastics balance and holds it still when the timer finishes.",
      "cue": "Choose a balance you know well. Make the shape clear and keep control from the start to the finish.",
      "icon": "◇"
    },
    {
      "id": "cool-team-balance",
      "category": "Teamwork",
      "title": "Cool team balance",
      "task": "Create one cool team balance with everyone contributing to the final shape.",
      "cue": "Choose a familiar stable shape and let the coach agree any support before Go. Hold the finished picture.",
      "icon": "⋈"
    },
    {
      "id": "three-off-floor",
      "category": "Teamwork",
      "title": "Three people off the ground",
      "task": "Finish with three teammates fully off the floor in a supported team balance before the timer ends.",
      "cue": "Choose an already-practised low supported shape. The coach directs the support and the controlled return to the floor.",
      "icon": "Ⅲ"
    },
    {
      "id": "two-off-floor",
      "category": "Teamwork",
      "title": "Two people off the ground",
      "task": "Finish with two teammates fully off the floor in a supported team balance before the timer ends.",
      "cue": "Choose an already-practised low supported shape. The coach directs the support and the controlled return to the floor.",
      "icon": "Ⅱ"
    },
    {
      "id": "mirrored-headstands",
      "category": "Teamwork",
      "title": "Mirrored headstand partners",
      "task": "In pairs, show matching headstands with leg shapes that mirror each other.",
      "cue": "Use the headstand and leg shapes already practised with the coach. Give partners space and control the exit.",
      "icon": "⇄"
    },
    {
      "id": "perfect-spotting",
      "category": "Teamwork",
      "title": "Demonstrate perfect spotting",
      "task": "Show the team’s clearest example of perfect spotting for a familiar gymnastics skill.",
      "cue": "Coach chooses the skill and demonstrates the support first. Use the spotting you have already been taught.",
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
    let renderGeneration=0;let sessionId = '', completionSent = false, podium=null,sizes=DEFAULTS.map(()=>'5');
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
      const element = node('button', className, label),token=renderGeneration;
      element.type = 'button'; element.disabled = disabled;
      element.dataset.teamAction = action;
      element.addEventListener('click', () => {if(token===renderGeneration)perform(action);});
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
      podium?.destroy();podium=null;
      if (!replay) {
        const chosen = names.slice(0, teamCount).map((name, index) => cleanName(name) || DEFAULTS[index]);
        if (new Set(chosen.map(name => name.toLocaleLowerCase())).size !== chosen.length) {
          errorText = 'Give each team a different name so the scoreboard stays clear.'; render(); return;
        }
        const counts=sizes.slice(0,teamCount).map(Number);if(counts.some(value=>!Number.isInteger(value)||value<1||value>20)){errorText='Enter a whole number from 1 to 20 gymnasts per team.';render();return;}
        teams = chosen.map((name, index) => ({ name, color: COLORS[index],size:counts[index], score: 0, turns: 0 }));
      } else teams = teams.map(team => ({ ...team, score: 0, turns: 0 }));
      sessionId='team_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2).padEnd(16,'0');completionSent=false;
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
      if (turn + 1 >= teams.length * ROUNDS) {phase='finished';statusText='Four rounds complete. Celebrate the teamwork.';const entries=teams.map((team,index)=>({id:String(index),name:team.name,color:team.color,value:team.score,unit:'stars',detail:`${ROUNDS} challenges complete`,rank:1+teams.filter(other=>other.score>team.score).length}));podium=window.SWLShuffleShowcase.createPodium(entries,{motionOff,sound,onDone:details=>{render(true);if(!completionSent){completionSent=true;try{options.onComplete?.({gameId:'team',sessionId,participantCount:teams.reduce((sum,team)=>sum+team.size,0),...(details.promptRating===false?{promptRating:false}:{})});}catch(_){}}}});render(true);showStage();podium.start();return;}
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
      podium?.finish(true);podium?.destroy();podium=null;
      cancelTimer(); phase = 'setup'; teams = []; turn = 0; card = null; awardedStars = 0; remainingMs = 0;
      resetPrompt = false; wasPlayingBeforePrompt = false; statusText = ''; errorText = ''; render(true);
    }
    function perform(action) {
      if (destroyed || !active || document.hidden) return;
      if (action.startsWith('count-') && phase === 'setup') {
        const count = Number(action.slice(6)); if ([2, 3, 4, 5].includes(count)) { teamCount = count; errorText = ''; render(); } return;
      }
      const sizeStep=action.match(/^size-(\d)-(less|more)$/);if(sizeStep&&phase==='setup'&&Number(sizeStep[1])<teamCount){const index=Number(sizeStep[1]),value=Number(sizes[index]);sizes[index]=String(Math.min(20,Math.max(1,(Number.isInteger(value)&&value>0?value:5)+(sizeStep[2]==='more'?1:-1))));errorText='';render();container.querySelector(`[data-team-action="${action}"]`)?.focus();return;}
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
      const count=window.SWLShuffleShowcase.teamCountView(teamCount,5,value=>{perform(`count-${value}`);container.querySelector('[data-game-team-count]')?.focus();},'Number of teams');
      const fields = node('div', 'swl-team-names');
      for (let index = 0; index < teamCount; index++) {
        const label = node('div', 'swl-team-name'); label.style.setProperty('--team-color', COLORS[index]);
        label.append(node('span', '', `Team ${index + 1}`));
        const input = node('input'); input.type = 'text'; input.value = names[index]; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.teamName = String(index);
        input.setAttribute('aria-label', `Team ${index + 1} name`);
        input.addEventListener('input', () => {if(active&&!destroyed&&phase==='setup')names[index] = input.value; }); label.append(input);const sizeLabel=node('span','swl-team-size-label','Gymnasts'),stepper=node('div','swl-game-stepper'),number=node('input');number.type='number';number.min='1';number.max='20';number.step='1';number.inputMode='numeric';number.value=sizes[index];number.dataset.teamSize=String(index);number.setAttribute('aria-label',`Number of gymnasts in team ${index+1}`);number.addEventListener('input',()=>{if(active&&!destroyed&&phase==='setup')sizes[index]=number.value;});const less=button('−',`size-${index}-less`,'swl-team-choice'),more=button('+',`size-${index}-more`,'swl-team-choice');less.setAttribute('aria-label',`Fewer gymnasts in team ${index+1}`);more.setAttribute('aria-label',`More gymnasts in team ${index+1}`);stepper.append(less,number,more);label.append(sizeLabel,stepper);fields.append(label);
      }
      const error = node('p', 'swl-team-error', errorText); error.setAttribute('role', 'alert');
      panel.append(count, fields, error, button('Draw the first challenge ↗', 'start-game', 'swl-team-button swl-team-primary'));
      const rules = node('aside', 'swl-team-rules'); rules.append(node('span', 'swl-team-rule-icon', '10'), node('h3', '', 'Seconds to shine'), node('p', '', 'Four challenges per team. A quiet start, three countdown tones, then a finish boop. After each challenge, the coach awards 1, 2 or 3 stars for teamwork.'), node('p', 'swl-team-muted', 'Choose familiar shapes and leave space. Team names and stars stay in this session; Skill League points stay the same.'));
      const grid = node('div', 'swl-team-setup-grid'); grid.append(panel, rules); root.append(grid);
    }
    function scoreboard(root) {
      const board = node('div', 'swl-team-board');board.dataset.teamCount=String(teams.length);board.style.setProperty('--game-teams',String(teams.length)); board.setAttribute('aria-label', 'Team scoreboard');
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
      [1, 2, 3].forEach(stars => { const control = button('', `award-${stars}`, 'swl-team-award', phase !== 'review' || resetPrompt); control.setAttribute('aria-label', `Award ${stars} ${stars === 1 ? 'star' : 'stars'}`); control.append(node('span', '', '★'.repeat(stars)), node('b', '', `${stars} ${stars === 1 ? 'star' : 'stars'}`), node('small', '', ['Working together', 'Strong teamwork', 'Clean finish together'][stars - 1])); award.append(control); });
      stage.append(node('p', 'swl-team-awards-label', 'COACH’S STARS · CONTROL + TIMING + ENCOURAGEMENT'), award); root.append(stage);
    }
    function finishView(root) {
      if(podium){stage=node('section','swl-team-finish swl-game-podium-finish');stage.tabIndex=-1;podium.render(stage);if(podium.getState().finished){const actions=node('div','swl-team-finish-actions');actions.append(button('Play again ↻','replay','swl-team-button swl-team-primary'),button('Change teams','reset','swl-team-button swl-team-secondary'));stage.append(actions);}root.append(stage);return;}
      const high = Math.max(...teams.map(team => team.score)); const winners = teams.filter(team => team.score === high);
      const result = node('section', 'swl-team-finish'); result.tabIndex = -1; stage = result;
      result.append(node('div', 'swl-team-trophy', '✦'), node('p', 'swl-team-kicker', winners.length > 1 ? 'SHARED TOP SPOT' : 'TEAM CHALLENGE CHAMPIONS'), node('h3', '', winners.map(team => team.name).join(' + ')), node('p', 'swl-team-winner-points', `${high} ${high === 1 ? 'star' : 'stars'}`), node('p', 'swl-team-muted', winners.length === teams.length ? 'A team effort all round. Everyone finishes together.' : winners.length > 1 ? 'A brilliant tie. Celebrate both the effort and the teamwork.' : 'Control, rhythm and encouragement — that is a winning team.'));
      const actions = node('div', 'swl-team-finish-actions'); actions.append(button('Play again ↻', 'replay', 'swl-team-button swl-team-primary'), button('Change teams', 'reset', 'swl-team-button swl-team-secondary')); result.append(actions); root.append(result);
    }
    function render(focus = false) {
      renderGeneration++;
      if (destroyed) return;
      clockNumber = null; clockText = null; clockFace = null; stage = null;
      const root = node('div', 'swl-team'); root.dataset.static = String(motionOff()); root.dataset.phase = phase;
      const head = node('div', 'swl-team-heading'); const titles = node('div'); titles.append(node('p', 'swl-team-kicker', 'ONE CARD · TEN SECONDS · TOGETHER'), node('h2', '', 'Team Challenge'));
      head.append(titles); if (phase !== 'setup') head.append(button('New game', 'reset', 'swl-team-text-button')); root.append(head);
      if (phase === 'setup') setupView(root);
      else { if(phase!=='finished')scoreboard(root); if (phase === 'finished') finishView(root); else playView(root); }
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
      podium?.finish(true);pause(); active = false; cancelTimer(); render();
    }
    function activate() { if (destroyed) return; active = true; render(); }
    function onVisibility() { if (document.hidden) {podium?.finish(true); pause(); cancelTimer(); render(); } }
    document.addEventListener('visibilitychange', onVisibility);
    const controller = {
      deactivate, activate,
      get destroyed() { return destroyed; },
      updateOptions(next) { options = next || {}; },
      destroy() { if (destroyed) return;podium?.finish(true);podium?.destroy();podium=null; destroyed = true; active = false; cancelTimer(); document.removeEventListener('visibilitychange', onVisibility); container.replaceChildren(); },
      getState() { return {podium:podium?.getState()||null,completionSent,sessionId,phase, active, teamCount, timerSeconds: ROUND_MS / 1000, cardCount: CARDS.length, turn, round: teams.length ? Math.min(ROUNDS, Math.floor(turn / teams.length) + 1) : 0, teams: teams.map(team => ({ ...team })), card: card ? { ...card } : null, remainingMs, awardedStars, resetPrompt }; }
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
