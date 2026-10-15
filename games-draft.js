(() => {
  'use strict';
  if (window.SWLTeamSkillDraft?.version === 1) return;
  const COLORS = ['#d5fa70', '#bd9bff', '#ffd782'], DEFAULTS = ['Mint', 'Purple', 'Gold'];
  const DURATION = 4000, START = 2, TARGET = 26, GAP = 12;
  let sequence = 0;
  const node = (tag, className = '', text = '') => { const el = document.createElement(tag); el.className = className; el.textContent = text; return el; };
  const clean = value => Array.from(String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 24).join('');
  const count = value => String(value).trim() && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 20 ? Number(value) : null;
  function catalogue(value) {
    const ids = new Set();
    return (Array.isArray(value) ? value : []).filter(skill => { if (!skill || typeof skill.id !== 'string' || !skill.id.trim() || typeof skill.label !== 'string' || !skill.label.trim() || ids.has(skill.id)) return false; ids.add(skill.id); return true; }).map(({id,label,category,tier}) => ({id,label:label.trim(),category:typeof category === 'string' ? category : '',tier:typeof tier === 'string' ? tier : ''}));
  }
  function randomBelow(max) {
    try { const value = new Uint32Array(1), ceiling = 0x100000000 - 0x100000000 % max; for (let i = 0; i < 8; i++) { window.crypto.getRandomValues(value); if (value[0] < ceiling) return value[0] % max; } } catch (_) {}
    return Math.floor(Math.random() * max);
  }
  function shuffle(items) { const result = items.slice(); for (let i = result.length - 1; i > 0; i--) { const j = randomBelow(i + 1); [result[i],result[j]] = [result[j],result[i]]; } return result; }
  function session() { try { if (window.crypto?.randomUUID) return 'draft-' + window.crypto.randomUUID(); } catch (_) {} return `draft-${Date.now().toString(36)}-${++sequence}-${randomBelow(0x100000000).toString(36)}`; }
  function meta(skill) { return [({rolls:'Rolls',acro:'Acro & spins',leaps:'Leaps'})[skill.category] || skill.category, ({base:'Base',upgrade:'Upgrade',pro:'Pro'})[skill.tier] || skill.tier].filter(Boolean).join(' · '); }
  function create(container, config) {
    let options = config, skills = catalogue(config.skills), bag = [], previous = '';
    let phase = 'setup', active = true, destroyed = false, teamCount = 2, size = '5', names = DEFAULTS.slice(), teams = [];
    let round = 0, selected = null, winner = null, remaining = DURATION, lastTime = 0, timer = null, timerGeneration = 0, renderGeneration = 0;
    let sessionId = null, completionSent = false, resetPrompt = false, error = '', status = '', root, stage, reel, track, cards = [], boundary = START;
    let reelWidth = 360, cardWidth = 223.2, offset = 0, ownsImmersive = false;
    const motionOff = () => { try { return !!(typeof options.motionOff === 'function' ? options.motionOff() : options.motionOff) || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch (_) { return true; } };
    const sound = payload => { try { options.playSound?.(payload); } catch (_) {} };
    const immersive = () => active && !destroyed && phase !== 'setup';
    const total = () => teams.length * (teams[0]?.size || 0);
    const completed = () => teams.reduce((sum, team) => sum + team.turns, 0);
    const finishedRound = () => ['awarded','finished'].includes(phase);
    const winners = () => { const best = Math.max(...teams.map(team => team.score)); return teams.filter(team => team.score === best); };
    function cancelTimer() { timerGeneration++; clearTimeout(timer); timer = null; }
    function updateLayout() {
      if (!immersive()) { if (ownsImmersive) { document.body?.classList.remove('swl-shuffle-playing'); document.body?.style.removeProperty('--swl-shuffle-header-bottom'); document.body?.style.removeProperty('--swl-shuffle-bottom-space'); ownsImmersive = false; } return; }
      document.body?.classList.add('swl-shuffle-playing'); ownsImmersive = true;
      const viewport = window.visualViewport, top = Math.max(0,Number(viewport?.offsetTop) || 0), height = Number(viewport?.height) || window.innerHeight || 768, bottom = top + height;
      const header = document.querySelector?.('.header')?.getBoundingClientRect?.(), headerBottom = Math.max(top,Number(header?.bottom) || 76), nav = document.querySelector?.('.nav')?.getBoundingClientRect?.();
      const bottomNav = nav && nav.height > 0 && nav.top > headerBottom + 48 && nav.top > top + height / 2;
      const playBottom = Math.min(bottom - 10,bottomNav ? nav.top - 8 : bottom - 10), playTop = headerBottom + 48, playHeight = Math.max(100,playBottom - playTop);
      document.body.style.setProperty('--swl-shuffle-header-bottom',`${headerBottom}px`); document.body.style.setProperty('--swl-shuffle-bottom-space',`${Math.max(0,bottom-playBottom)}px`);
      root?.style.setProperty('--swl-shuffle-play-top',`${playTop}px`); root?.style.setProperty('--swl-shuffle-play-height',`${playHeight}px`); root?.style.setProperty('--swl-shuffle-card-font',`${Math.max(12,Math.min(29,playHeight*.052))}px`);
      if (root) root.dataset.fit = playHeight < 300 ? 'short' : playHeight < 430 ? 'compact' : 'roomy';
    }
    function button(label, action, className = 'swl-skill-text-button', disabled = false) {
      const el = node('button',className,label), generation = renderGeneration; el.type = 'button'; el.disabled = disabled; el.dataset.draftAction = action;
      el.addEventListener('click',() => { if (generation === renderGeneration && !el.disabled) perform(action); }); return el;
    }
    function nextSkill() {
      if (!bag.length) { bag = shuffle(skills); if (bag.length > 1 && bag[bag.length-1].id === previous) { const j = randomBelow(bag.length-1); [bag[j],bag[bag.length-1]] = [bag[bag.length-1],bag[j]]; } }
      const choice = bag.pop(); previous = choice.id; return choice;
    }
    function position() { return START + (TARGET-START) * (1-Math.pow(1-Math.max(0,Math.min(1,1-remaining/DURATION)),4)); }
    function updateReel(tick = false) {
      if (!reel || !track) return;
      const measured = reel.getBoundingClientRect?.().width; if (measured > 2) reelWidth = measured-2;
      cardWidth = Math.min(286,Math.max(174,reelWidth*.62)); reel.style.setProperty('--reel-card-width',`${cardWidth}px`);
      const point = position(), nextBoundary = Math.floor(point+.5);
      if (tick && nextBoundary > boundary) sound({kind:'reel-tick',progress:1-remaining/DURATION,remaining:remaining/1000});
      boundary = nextBoundary; offset = reelWidth/2-cardWidth/2-point*(cardWidth+GAP); track.style.transform = `translate3d(${offset}px,0,0)`;
    }
    function buildReel() {
      cards = []; boundary = START;
      for (let i = 0; i < 32; i++) { const alternatives = skills.filter(skill => skill.id !== cards[i-1]?.id && (i === TARGET-1 || i === TARGET+1 ? skill.id !== selected.id : true)), choices = alternatives.length ? alternatives : skills; cards.push(i === TARGET ? selected : choices[randomBelow(choices.length)]); }
    }
    function prepareRound() { cancelTimer(); phase = 'ready'; selected = null; winner = null; remaining = DURATION; cards = []; status = `Round ${round+1}. Each team will choose one gymnast who has not had a turn.`; }
    function start(replay = false) {
      if (!skills.length || (phase !== 'setup' && !(replay && phase === 'finished'))) return;
      if (!replay) {
        const sizeValue = count(size), chosen = names.slice(0,teamCount).map((value,i) => clean(value) || DEFAULTS[i]);
        if (!sizeValue) { error = 'Enter a whole number from 1 to 20 gymnasts per team.'; render(); return; }
        if (new Set(chosen.map(name => name.toLocaleLowerCase())).size !== chosen.length) { error = 'Give each team a different name.'; render(); return; }
        teams = chosen.map((name,i) => ({name,color:COLORS[i],size:sizeValue,turns:0,score:0}));
      } else teams = teams.map(team => ({...team,turns:0,score:0}));
      round = 0; error = ''; resetPrompt = false; sessionId = session(); completionSent = false; prepareRound(); render(true);
    }
    function reveal() { cancelTimer(); remaining = 0; phase = 'revealed'; status = `${selected.label}. Each team chooses one unused gymnast. Coach, award one point for the best attempt.`; render(true); sound({kind:'reel-reveal'}); }
    function syncTime() { if (phase !== 'shuffling') return; const time = performance.now(); remaining = Math.max(0,remaining-Math.max(0,time-lastTime)); lastTime = time; }
    function pause() { if (phase !== 'shuffling') return false; syncTime(); cancelTimer(); phase = 'paused'; status = 'Shuffle paused. Resume when everyone is ready.'; return true; }
    function frame() {
      cancelTimer(); if (!active || destroyed || phase !== 'shuffling') return; const generation = timerGeneration;
      timer = setTimeout(() => { if (generation !== timerGeneration || !active || destroyed || phase !== 'shuffling') return; timer = null; if (document.hidden) { pause(); render(); return; } syncTime(); if (remaining <= 0 || motionOff()) { reveal(); return; } updateReel(true); frame(); },Math.min(16,remaining));
    }
    function draw() {
      if (phase !== 'ready' || !skills.length) return;
      selected = nextSkill(); phase = 'shuffling'; remaining = DURATION; lastTime = performance.now(); buildReel();
      if (motionOff()) { reveal(); return; } status = 'One shared skill. Who will your team choose?'; render(true); sound({kind:'reel-start'}); frame();
    }
    function resume() { if (phase !== 'paused') return; phase = 'shuffling'; lastTime = performance.now(); if (remaining <= 0 || motionOff()) { reveal(); return; } status = 'Shuffle resumed.'; render(true); frame(); }
    function award(index) {
      if (phase !== 'revealed' || !Number.isInteger(index) || index < -1 || index >= teams.length) return;
      winner = index; if (index >= 0) teams[index].score++; teams.forEach(team => team.turns++); phase = 'awarded';
      status = index < 0 ? 'No point this round. All performers have used their turn.' : `${teams[index].name} wins one point. All performers have used their turn.`;
      render(true); sound({kind:'award',points:index >= 0 ? 1 : 0,perfect:index >= 0});
    }
    function undo() {
      if (!finishedRound() || winner === null) return;
      if (winner >= 0) teams[winner].score--; teams.forEach(team => team.turns--); winner = null; phase = 'revealed'; status = 'Round award undone. Coach, choose again.'; render(true);
    }
    function next() {
      if (phase !== 'awarded') return;
      if (teams.every(team => team.turns === team.size)) {
        phase = 'finished'; status = `All ${total()} gymnasts have had one turn.`; render(true); sound({kind:'finish',perfect:true});
        if (!completionSent) { completionSent = true; try { options.onComplete?.({gameId:'draft',sessionId,participantCount:total()}); } catch (_) {} } return;
      }
      round++; prepareRound(); render(true);
    }
    function reset() { cancelTimer(); phase = 'setup'; teams = []; round = 0; selected = winner = null; resetPrompt = false; error = status = ''; cards = []; sessionId = null; completionSent = false; remaining = DURATION; render(true); }
    function perform(action) {
      if (!active || destroyed || document.hidden) return;
      if (resetPrompt) { if (action === 'confirm-reset') reset(); else if (action === 'cancel-reset') { resetPrompt = false; render(true); } return; }
      if (phase === 'setup') {
        if (action === 'teams-2' || action === 'teams-3') { teamCount = Number(action.slice(-1)); error = ''; render(false,action); return; }
        if (action === 'size-less' || action === 'size-more') { size = String(Math.min(20,Math.max(1,(count(size) || 5)+(action === 'size-less' ? -1 : 1)))); error = ''; render(false,action); return; }
      }
      if (action === 'start-game') start(); else if (action === 'draw') draw(); else if (action === 'redraw' && phase === 'revealed') { phase = 'ready'; draw(); }
      else if (action === 'pause' && pause()) render(true); else if (action === 'resume') resume(); else if (action.startsWith('point-')) award(Number(action.slice(6)));
      else if (action === 'no-point') award(-1); else if (action === 'next') next(); else if (action === 'undo') undo(); else if (action === 'replay') start(true);
      else if (action === 'reset') { if (phase === 'setup' || phase === 'finished') reset(); else { pause(); resetPrompt = true; render(true); } }
    }
    function setupView() {
      const grid = node('div','swl-skill-setup-grid'), panel = node('section','swl-skill-setup');
      panel.append(node('p','swl-skill-kicker',`${skills.length} SKILLS · ONE SHARED SHUFFLE`),node('h3','','Choose your teams'),node('p','swl-skill-muted','Two or three equal-sized teams. Each round, choose one gymnast who has not had a turn. No individual names needed.'));
      const choices = node('div','swl-skill-team-count'); choices.setAttribute('role','group'); choices.setAttribute('aria-label','Number of Team Skill Draft teams');
      [2,3].forEach(value => { const control = button(`${value} teams`,`teams-${value}`,'swl-skill-team-choice'); control.setAttribute('aria-pressed',String(value === teamCount)); choices.append(control); }); panel.append(choices);
      const fields = node('div','swl-skill-names'); names.slice(0,teamCount).forEach((name,index) => {
        const label = node('label','swl-skill-name'); label.style.setProperty('--squad-color',COLORS[index]); label.append(node('span','',`Team ${index+1}`));
        const input = node('input'); input.type = 'text'; input.value = name; input.maxLength = 24; input.autocomplete = 'off'; input.dataset.draftName = String(index); input.setAttribute('aria-label',`Team Skill Draft team ${index+1} name`);
        input.addEventListener('input',() => { if (phase === 'setup' && active && !destroyed) names[index] = input.value; }); label.append(input); fields.append(label);
      }); panel.append(fields);
      const sizeField = node('div','swl-skill-size swl-draft-size'); sizeField.append(node('span','','Gymnasts per team')); const stepper = node('div','swl-skill-stepper');
      const input = node('input'); input.type = 'number'; input.min = '1'; input.max = '20'; input.step = '1'; input.inputMode = 'numeric'; input.value = size; input.dataset.draftSize = 'all'; input.setAttribute('aria-label','Gymnasts per team'); input.addEventListener('input',() => { if (phase === 'setup' && active && !destroyed) size = input.value; });
      const less = button('−','size-less','swl-skill-step'), more = button('+','size-more','swl-skill-step'); less.setAttribute('aria-label','Fewer gymnasts per team'); more.setAttribute('aria-label','More gymnasts per team'); stepper.append(less,input,more); sizeField.append(stepper); panel.append(sizeField);
      const errorNode = node('p','swl-skill-error',skills.length ? error : 'The skill list is not available yet. Return once it has loaded.'); errorNode.setAttribute('role','alert'); panel.append(errorNode,button('Let’s play ↗','start-game','swl-skill-button swl-skill-primary',!skills.length));
      const rules = node('aside','swl-skill-rules'); rules.append(node('span','swl-skill-rule-icon','↝'),node('h3','','Same skill. Your choice.'));
      const list = node('ol','swl-draft-rules'); ['Shuffle one skill for every team.','Each team chooses one gymnast who has not competed yet.','The coach awards 1 point for the best attempt. A tied round can have no point.','Every performer steps out, whether they won or not.','Continue until everyone has had one go. Most points wins.'].forEach(text => list.append(node('li','',text)));
      rules.append(list,node('p','swl-skill-muted','Keep the unused gymnasts on one side and move performers to the other side. Coach can redraw a skill before any attempts.'),node('p','swl-skill-session-note','Game points stay here. Skill League marks and points stay the same.')); grid.append(panel,rules); root.append(grid);
    }
    function scoreboard() {
      const board = node('div','swl-skill-board'); board.dataset.teamCount = String(teams.length); board.setAttribute('aria-label','Team Skill Draft scoreboard');
      teams.forEach(team => { const item = node('div','swl-skill-score'); item.style.setProperty('--squad-color',team.color); item.append(node('span','swl-skill-score-name',team.name),node('strong','',String(team.score)),node('span','swl-skill-score-unit','points'),node('span','swl-skill-score-compact',`${team.size-team.turns} left · ${team.turns}/${team.size} done`)); board.append(item); }); root.append(board);
    }
    function reelView(face) {
      const frame = node('div','swl-skill-reel-frame'); frame.dataset.settled = String(['revealed','awarded'].includes(phase)); frame.append(node('div','swl-skill-reel-pointer'));
      reel = node('div','swl-skill-reel'); reel.setAttribute('aria-hidden','true'); track = node('div','swl-skill-reel-track');
      cards.forEach((skill,index) => { const item = node('div',`swl-skill-reel-card${index === TARGET && remaining === 0 ? ' is-selected' : ''}`); item.dataset.skillId = skill.id; item.dataset.tier = skill.tier; item.append(node('span','swl-skill-reel-meta',meta(skill)),node('b','',skill.label),node('span','swl-skill-reel-symbol','◇')); track.append(item); }); reel.append(track); frame.append(reel); face.append(frame,node('h3','swl-skill-reel-result',selected.label));
    }
    function playView() {
      const progress = node('div','swl-skill-progress'); progress.append(node('span','',`ROUND ${round+1} / ${teams[0].size}`),node('span','',`${completed()} / ${total()} GYMNASTS COMPLETE`)); root.append(progress);
      const progressBar = node('div','swl-skill-total-progress'), fill = node('span'); progressBar.setAttribute('role','progressbar'); progressBar.setAttribute('aria-label','Gymnasts who have taken their turn'); progressBar.setAttribute('aria-valuemin','0'); progressBar.setAttribute('aria-valuemax',String(total())); progressBar.setAttribute('aria-valuenow',String(completed())); fill.style.width = `${completed()/total()*100}%`; progressBar.append(fill); root.append(progressBar);
      stage = node('section','swl-skill-stage'); stage.tabIndex = -1; stage.style.setProperty('--squad-color',COLORS[1]); stage.append(node('p','swl-skill-turn','Every team plays'),node('p','swl-skill-gymnast-number',finishedRound() ? 'Performers step out' : 'Pick someone unused'));
      const face = node('div',`swl-skill-face${selected ? ' swl-skill-reel-face' : ''}`);
      if (selected) reelView(face); else face.append(node('span','swl-skill-placeholder','↝'),node('h3','','Who will you choose?'),node('p','swl-skill-muted','One skill. One gymnast from each team. One point to win.')); stage.append(face);
      const controls = node('div','swl-skill-controls');
      if (phase === 'ready') controls.append(button('Shuffle the shared skill ↝','draw','swl-skill-button swl-skill-primary swl-skill-go'));
      else if (phase === 'shuffling') controls.append(button('Pause Ⅱ','pause'));
      else if (phase === 'paused') controls.append(button('Resume shuffle ▶','resume','swl-skill-button swl-skill-primary'));
      else if (phase === 'awarded') { controls.append(node('p','swl-skill-award-result',winner < 0 ? 'No point this round' : `${teams[winner].name} +1 point`),button(teams[0].turns === teams[0].size ? 'See the winners ↗' : 'Next shared skill →','next','swl-skill-button swl-skill-primary'),button('Undo award','undo')); }
      if (phase === 'revealed') {
        const awards = node('div','swl-skill-awards swl-draft-awards'); awards.dataset.teamCount = String(teams.length); awards.setAttribute('role','group'); awards.setAttribute('aria-label','Coach: award one point to the best attempt');
        teams.forEach((team,index) => { const control = button('',`point-${index}`,'swl-skill-point swl-draft-point'); control.style.setProperty('--squad-color',team.color); control.setAttribute('aria-label',`${team.name} wins 1 point; everyone uses one turn`); control.append(node('b','','+1'),node('span','',team.name)); awards.append(control); }); stage.append(awards);
        const extras = node('div','swl-skill-extras'); extras.append(button('Tie / no point','no-point'),button('Draw another skill','redraw')); stage.append(extras);
      } else stage.append(controls);
      root.append(stage);
    }
    function finishView() {
      const best = winners(); stage = node('section','swl-skill-finish'); stage.tabIndex = -1;
      stage.append(node('span','swl-skill-trophy','✦'),node('p','swl-skill-kicker',best.length > 1 ? 'SHARED TOP SPOT' : 'TEAM SKILL DRAFT WINNERS'),node('h3','',best.map(team => team.name).join(' + ')),node('p','swl-skill-result-points',`${best[0].score} ${best[0].score === 1 ? 'point' : 'points'}`),node('p','swl-skill-muted',`All ${total()} gymnasts have had one turn. Every attempt helped the team.`));
      const controls = node('div','swl-skill-controls'); controls.append(button('Play again ↝','replay','swl-skill-button swl-skill-primary'),button('Change teams','reset','swl-skill-button swl-skill-secondary'),button('Undo last award','undo')); stage.append(controls); root.append(stage);
    }
    function render(focus = false, focusAction = '') {
      if (destroyed) return; renderGeneration++; reel = track = stage = null;
      root = node('div',`swl-skill-game swl-skill-draft-game${immersive() ? ' is-immersive' : ''}`); root.dataset.static = String(motionOff()); root.dataset.phase = phase;
      const heading = node('div','swl-skill-heading'), titles = node('div'); titles.append(node('p','swl-skill-kicker','SHARED SKILL · PICK YOUR PERFORMER'),node('h2','','Team Skill Draft')); heading.append(titles); if (phase !== 'setup') heading.append(button('New game','reset')); root.append(heading);
      if (phase === 'setup') setupView(); else { scoreboard(); if (phase === 'finished') finishView(); else playView(); }
      const live = node('p','swl-skill-live',status); live.setAttribute('role','status'); live.setAttribute('aria-live','polite'); root.append(live);
      if (resetPrompt) {
        const prompt = node('div','swl-skill-reset-prompt'); prompt.setAttribute('role','alertdialog'); prompt.setAttribute('aria-label','Start a new Team Skill Draft game?'); prompt.append(node('strong','','Start a new game?'),node('p','','This clears this game’s points and turns.'),button('Keep this game','cancel-reset','swl-skill-button swl-skill-primary'),button('Clear and restart','confirm-reset','swl-skill-button swl-skill-secondary'));
        prompt.addEventListener('keydown',event => { if (event.key === 'Escape') { event.preventDefault(); perform('cancel-reset'); } else if (event.key === 'Tab') { const first = prompt.querySelector('[data-draft-action="cancel-reset"]'), last = prompt.querySelector('[data-draft-action="confirm-reset"]'); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } }); root.append(prompt);
      }
      container.replaceChildren(root); updateLayout(); updateReel();
      if (focus || focusAction) { const target = resetPrompt ? root.querySelector('[data-draft-action="cancel-reset"]') : focusAction ? root.querySelector(`[data-draft-action="${focusAction}"]`) : phase === 'paused' ? root.querySelector('[data-draft-action="resume"]') : stage || root.querySelector('[data-draft-name="0"]'); try { target?.focus({preventScroll:true}); } catch (_) {} }
    }
    function deactivate() { if (destroyed) return; pause(); active = false; cancelTimer(); render(); }
    function onVisibility() { if (document.hidden) { pause(); cancelTimer(); render(); } }
    function onResize() { if (active && !destroyed && !document.hidden) { updateLayout(); updateReel(); } }
    document.addEventListener('visibilitychange',onVisibility); window.addEventListener?.('resize',onResize); window.visualViewport?.addEventListener?.('resize',onResize); window.visualViewport?.addEventListener?.('scroll',onResize);
    const controller = {
      deactivate, activate() { if (!destroyed) { active = true; render(); } }, get destroyed() { return destroyed; },
      updateOptions(next) { options = {...options,...next}; if (phase === 'setup' && Array.isArray(next?.skills)) { const incoming = catalogue(next.skills); if (JSON.stringify(incoming) !== JSON.stringify(skills)) { skills = incoming; bag = []; previous = ''; } } },
      destroy() { if (destroyed) return; destroyed = true; active = false; cancelTimer(); updateLayout(); document.removeEventListener('visibilitychange',onVisibility); window.removeEventListener?.('resize',onResize); window.visualViewport?.removeEventListener?.('resize',onResize); window.visualViewport?.removeEventListener?.('scroll',onResize); container.replaceChildren(); },
      getState() { return {phase,active,teamCount,size:count(size),round:teams.length ? round+1 : 0,totalGymnasts:total(),completedGymnasts:completed(),teams:teams.map(team => ({...team,remaining:team.size-team.turns})),selected:selected ? {...selected} : null,winner,remainingMs:remaining,sessionId,completionSent,resetPrompt,skillCount:skills.length,reel:cards.length ? {position:position(),targetIndex:TARGET,targetId:cards[TARGET].id,width:reelWidth,cardWidth,gap:GAP,offset} : null}; }
    }; render(); return controller;
  }
  let instance = null, host = null;
  window.SWLTeamSkillDraft = Object.freeze({version:1,mount(container,options = {}) { if (!container || typeof container.replaceChildren !== 'function') throw Error('A game container is required.'); if (instance && !instance.destroyed && host === container) { instance.updateOptions(options); instance.activate(); return instance; } instance?.destroy(); host = container; instance = create(container,options); return instance; },deactivate() { instance?.deactivate(); },destroy() { instance?.destroy(); instance = host = null; }});
})();
