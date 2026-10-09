(() => {
  'use strict';
  if (window.SWLWheel?.version === 1) return;

  const SVG = 'http://www.w3.org/2000/svg';
  const STEP = 30;
  const ENTRIES = Object.freeze([
    { label: '10 burpees', lines: ['10','BURPEES'], kind: 'exercise' },
    { label: '10 press-ups', lines: ['10','PRESS-UPS'], kind: 'exercise' },
    { label: 'Coach joins next spin', lines: ['COACH','JOINS NEXT','SPIN'], kind: 'coach-next' },
    { label: '10 jumping jacks', lines: ['10','JUMPING','JACKS'], kind: 'exercise' },
    { label: '10 V-sits', lines: ['10','V-SITS'], kind: 'exercise' },
    { label: '10 squats', lines: ['10','SQUATS'], kind: 'exercise' },
    { label: '20 sec plank', lines: ['20 SEC','PLANK'], kind: 'exercise' },
    { label: '10 hollow rocks', lines: ['10','HOLLOW','ROCKS'], kind: 'exercise' },
    { label: 'Coach does a backflip', lines: ['COACH','BACKFLIP'], kind: 'coach-demo' },
    { label: '10 mountain climbers', lines: ['10','MOUNTAIN','CLIMBERS'], kind: 'exercise' },
    { label: '10 calf raises', lines: ['10','CALF','RAISES'], kind: 'exercise' },
    { label: '10 tuck jumps', lines: ['10','TUCK','JUMPS'], kind: 'exercise' }
  ].map(Object.freeze));
  let host = null, root = null, rotor = null, pointer = null, button = null, result = null;
  let resultLabel = null, resultTitle = null, resultDetail = null, coachNote = null;
  let callbacks = {}, currentSpin = null, lastResult = null, rotation = 0, coachNext = false;
  let finishTimer = null, tickFrame = null, transitionHandler = null, generation = 0, observer = null;
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  const normalize = angle => ((angle % 360) + 360) % 360;
  const pointerIndex = angle => Math.floor(normalize(-angle) / STEP + .5) % ENTRIES.length;
  function sound(kind) {
    try { callbacks.playSound?.(kind === 'wheel-finish' ? {kind,perfect:true} : {kind}); } catch (_) {}
  }
  // Invert the x coordinate of the very same cubic-bezier(.12,.72,.12,1)
  // used by the CSS transition, then read its y coordinate as wheel progress.
  function easedProgress(progress) {
    if (progress <= 0 || progress >= 1) return Math.max(0,Math.min(1,progress));
    const cubic = (t,a,b) => 3*(1-t)*(1-t)*t*a + 3*(1-t)*t*t*b + t*t*t;
    let low=0,high=1;
    for(let step=0;step<18;step++) {
      const middle=(low+high)/2;
      if(cubic(middle,.12,.12)<progress) low=middle; else high=middle;
    }
    return cubic((low+high)/2,.72,1);
  }
  function motionOff() {
    if (media?.matches || document.body?.classList.contains('no-motion')) return true;
    try { return Boolean(callbacks.motionOff?.()); } catch (_) { return true; }
  }
  function random() {
    try {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] / 4294967296;
    } catch (_) { return Math.random(); }
  }
  function make(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function svg(tag, attributes, text) {
    const element = document.createElementNS(SVG, tag);
    for (const [name,value] of Object.entries(attributes || {})) element.setAttribute(name, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function point(angle, radius) {
    const radians = angle * Math.PI / 180;
    return [300 + Math.cos(radians) * radius, 300 + Math.sin(radians) * radius];
  }
  function wheelSVG() {
    const wheel = svg('svg', { viewBox: '0 0 600 600', role: 'img', 'aria-label': 'Conditioning wheel. Twelve challenges; the pointer chooses your next round.' });
    const defs=svg('defs');
    const rim=svg('linearGradient',{id:'swlw-rim-metal',x1:0,y1:0,x2:1,y2:1});
    [['0%','#e8e4ff'],['26%','#8c749f'],['52%','#242d24'],['80%','#a6c78a'],['100%','#e4d7f5']].forEach(([offset,color])=>rim.append(svg('stop',{offset,'stop-color':color})));
    const gloss=svg('radialGradient',{id:'swlw-gloss',cx:'.28',cy:'.18',r:'.95'});
    [['0%','#ffffff','.16'],['50%','#ffffff','0'],['100%','#080c09','.2']].forEach(([offset,color,opacity])=>gloss.append(svg('stop',{offset,'stop-color':color,'stop-opacity':opacity})));
    defs.append(rim,gloss);wheel.append(defs);
    wheel.append(svg('circle', { cx:300, cy:300, r:296, fill:'#17191d', stroke:'url(#swlw-rim-metal)', 'stroke-width':5 }));
    ENTRIES.forEach((entry,index) => {
      const angle = index * STEP - 90;
      const [x1,y1] = point(angle - STEP / 2, 282), [x2,y2] = point(angle + STEP / 2, 282);
      const coach = entry.kind !== 'exercise';
      const palette = entry.kind === 'coach-next' ? '#d5fa70' : entry.kind === 'coach-demo' ? '#d0b1ff'
        : ['#2c253c','#243224','#392d4b','#31402a'][index % 4];
      const group = svg('g', { class:'swlw-segment', 'data-wheel-segment': index, 'data-kind':entry.kind, 'aria-hidden': 'true' });
      group.append(svg('path', { d:`M300 300 L${x1} ${y1} A282 282 0 0 1 ${x2} ${y2} Z`, fill:palette, stroke:'#0d1015', 'stroke-width':2.3 }));
      const [x,y] = point(angle, 213);
      const labels = svg('g', { transform:`translate(${x} ${y}) rotate(${angle + 90})`, fill:coach?'#1a2315':'#f0f1e9', 'text-anchor':'middle' });
      const firstY = entry.lines.length === 3 ? -23 : -10;
      entry.lines.forEach((line,lineIndex) => {
        const isCount = lineIndex === 0 && !coach;
        labels.append(svg('text', { x:0, y:firstY+lineIndex*25, 'font-size':isCount?28:line.length>8?17.5:21,
          'font-weight':isCount?850:750, 'letter-spacing':isCount?'-.8':'.2', 'font-family':'system-ui, sans-serif' }, line));
      });
      group.append(labels);
      wheel.append(group);
    });
    wheel.append(svg('circle',{cx:300,cy:300,r:282,fill:'url(#swlw-gloss)','aria-hidden':'true','pointer-events':'none'}));
    for (let index=0;index<36;index++) {
      const [x,y] = point(index*10-90,290);
      wheel.append(svg('circle',{cx:x,cy:y,r:index%3===0?2.4:1.25,fill:index%3===0?'#d5fa70':'#b6a2d9',opacity:index%3===0?.9:.4}));
    }
    return wheel;
  }

  function updateCoachNote() {
    coachNote.hidden = !coachNext;
    coachNote.textContent = 'Coach joins the next round · exercise slots only';
  }
  function showReady(cancelled = false) {
    root.classList.toggle('has-result', Boolean(lastResult));
    rotor.classList.toggle('has-landed', Boolean(lastResult));
    rotor.querySelectorAll('.swlw-segment').forEach((segment,index)=>segment.classList.toggle('is-selected',index===lastResult?.index));
    result.classList.toggle('has-result', Boolean(lastResult));
    resultLabel.textContent = cancelled ? 'SPIN CANCELLED' : lastResult ? 'THE WHEEL SAYS' : 'NEXT ROUND';
    resultTitle.textContent = lastResult?.label || 'Ready when you are';
    resultDetail.textContent = cancelled ? 'Ready for another spin whenever you are.'
      : lastResult?.detail || 'Spin the wheel and let it choose the challenge.';
    button.disabled = false;
    button.querySelector('.swlw-spin-label').textContent = lastResult ? 'Spin again' : 'Spin the wheel';
    root.classList.remove('is-spinning');
    root.setAttribute('aria-busy','false');
    updateCoachNote();
  }
  function clearSpinListeners() {
    clearTimeout(finishTimer);
    finishTimer = null;
    if(tickFrame !== null) window.cancelAnimationFrame?.(tickFrame);
    tickFrame = null;
    if(pointer) pointer.style.transform='';
    if (transitionHandler && rotor) rotor.removeEventListener('transitionend', transitionHandler);
    transitionHandler = null;
  }
  function trackSpin(token) {
    if(typeof window.requestAnimationFrame !== 'function') return;
    const frame = () => {
      tickFrame = null;
      const spin = currentSpin;
      if(!spin || spin.token!==token) return;
      if(!root?.isConnected || document.hidden) { deactivate(); return; }
      if(motionOff()) { finishSpin(token); return; }
      const now=performance.now(),progress=Math.min(1,(now-spin.started)/spin.duration);
      const angle=spin.from+(spin.target-spin.from)*easedProgress(progress);
      const sector=Math.floor((angle+STEP/2)/STEP);
      // Fast crossings are coalesced into one tick, never played as a backlog.
      // At the slow end every crossed divider is heard exactly when it passes.
      if(sector!==spin.lastSector) {
        spin.lastSector=sector;
        if(now-spin.lastTick>=40) { spin.lastTick=now; sound('wheel-tick'); }
      }
      const age=now-spin.lastTick;
      const kick=age<120?-14*Math.sin(Math.PI*age/120)*Math.exp(-age/70):0;
      pointer.style.transform=`translateX(-50%) rotate(${kick}deg)`;
      if(progress>=1) { finishSpin(token); return; }
      tickFrame=window.requestAnimationFrame(frame);
    };
    tickFrame=window.requestAnimationFrame(frame);
  }
  function finishSpin(token) {
    if (!currentSpin || currentSpin.token !== token || !root) return;
    const spin = currentSpin;
    clearSpinListeners();
    currentSpin = null;
    rotation = normalize(spin.target);
    rotor.style.transition = 'none';
    rotor.style.transform = `rotate(${rotation}deg)`;
    // Read the actual destination under the fixed pointer. The text result
    // cannot disagree with the segment that visibly landed there.
    const index = pointerIndex(rotation), entry = ENTRIES[index];
    const joined = coachNext && entry.kind === 'exercise';
    if (entry.kind === 'coach-next') coachNext = true;
    else if (joined) coachNext = false;
    const detail = entry.kind === 'coach-next' ? 'Spin again. Your coach joins whichever exercise comes next.'
      : entry.kind === 'coach-demo' ? 'Coach can choose another demonstration.'
        : joined ? 'Coach joins in! Complete this round together.' : 'Complete the round, then spin again.';
    lastResult = { index, label:entry.label, detail, coachJoined:joined };
    root.dataset.resultIndex = String(index);
    root.dataset.coachJoined = String(joined);
    showReady();
    if (joined) resultLabel.textContent = 'COACH JOINS IN';
    sound('wheel-finish');
  }
  function spin() {
    if (!root || currentSpin || !root.isConnected) return;
    // The follow-up to "Coach joins" always lands on an exercise, so the
    // promise is used on the next completed spin, never another coach slot.
    const pool = ENTRIES.map((entry,index)=>({entry,index})).filter(item=>!coachNext || item.entry.kind==='exercise');
    const chosen = pool[Math.min(pool.length-1,Math.floor(random()*pool.length))].index;
    const landing = normalize(-chosen*STEP + (random()-.5)*12);
    const quiet = motionOff();
    const duration = quiet ? 220 : 4050+Math.floor(random()*420);
    const target = rotation + 360*(5+Math.floor(random()*2)) + normalize(landing-rotation);
    const token = ++generation;
    currentSpin = { token, from:rotation, target, started:performance.now(), duration,
      lastSector:Math.floor((rotation+STEP/2)/STEP), lastTick:-Infinity };
    button.disabled = true;
    button.querySelector('.swlw-spin-label').textContent = 'Spinning…';
    result.classList.remove('has-result');
    root.classList.remove('has-result');
    rotor.classList.remove('has-landed');
    rotor.querySelectorAll('.swlw-segment').forEach(segment=>segment.classList.remove('is-selected'));
    resultLabel.textContent = 'ON ITS WAY';
    resultTitle.textContent = quiet ? 'Choosing your round…' : 'Around it goes…';
    resultDetail.textContent = coachNext ? 'Your coach is joining this round.' : 'The pointer will pick your challenge.';
    root.setAttribute('aria-busy','true');
    root.classList.toggle('is-spinning', !quiet);
    rotor.style.transition = 'none';
    rotor.style.transform = `rotate(${rotation}deg)`;
    rotor.getBoundingClientRect();
    rotor.style.transition = quiet ? 'none' : `transform ${duration}ms cubic-bezier(.12,.72,.12,1)`;
    rotor.style.transform = `rotate(${quiet?landing:target}deg)`;
    if (!quiet) {
      transitionHandler = event => {
        if (event.target === rotor && event.propertyName === 'transform' &&
            performance.now()-currentSpin?.started >= duration-80) finishSpin(token);
      };
      rotor.addEventListener('transitionend', transitionHandler);
      sound('wheel-start');
      trackSpin(token);
    }
    // Covers reduced motion, interrupted CSS transitions and hidden renderers.
    finishTimer = setTimeout(()=>finishSpin(token), quiet?duration:duration+160);
  }
  function deactivate() {
    if (!root || !currentSpin) return;
    generation++;
    currentSpin = null;
    clearSpinListeners();
    rotor.style.transition = 'none';
    rotor.style.transform = `rotate(${rotation}deg)`;
    // A cancelled spin neither announces a new result nor consumes coach-next.
    showReady(true);
  }
  function motionChanged() {
    if (currentSpin && motionOff()) finishSpin(currentSpin.token);
  }
  function visibilityChanged() { if (document.hidden) deactivate(); }
  function destroy() {
    deactivate();
    clearSpinListeners();
    observer?.disconnect(); observer = null;
    media?.removeEventListener?.('change',motionChanged);
    document.removeEventListener('visibilitychange',visibilityChanged);
    root?.remove();
    host = root = rotor = pointer = button = result = resultLabel = resultTitle = resultDetail = coachNote = null;
    callbacks = {}; lastResult = null; rotation = 0; coachNext = false;
  }
  function mount(container, options = {}) {
    if (!container || typeof container.append !== 'function') throw TypeError('SWLWheel.mount requires a container.');
    if (host === container && root?.isConnected) { callbacks = options; motionChanged(); return; }
    destroy();
    host = container; callbacks = options;
    root = make('section','swlw-game');
    const heading = make('header','swlw-heading');
    const headingCopy = make('div','swlw-heading-copy');
    headingCopy.append(make('p','swlw-eyebrow','SWL GAMES · FREE PLAY'),make('h2','swlw-title','Conditioning wheel'),make('p','swlw-intro','Let the wheel choose the next round.'));
    heading.append(headingCopy,make('span','swlw-round-count','12 possibilities'));
    const layout = make('div','swlw-layout'), stage = make('div','swlw-stage');
    pointer = make('div','swlw-pointer');pointer.setAttribute('aria-hidden','true');
    const shell = make('div','swlw-shell');
    rotor = make('div','swlw-rotor');rotor.append(wheelSVG());
    const hub = make('div','swlw-hub');hub.setAttribute('aria-hidden','true');
    const logo = make('img','swlw-hub-logo');logo.src='./swl-logo.png';logo.alt='';
    hub.append(logo,make('span','swlw-hub-caption','LET’S GO'));
    shell.append(rotor,hub);stage.append(pointer,shell);
    const controls = make('div','swlw-controls');
    result = make('div','swlw-result');result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.setAttribute('aria-atomic','true');
    resultLabel = make('p','swlw-result-label');resultTitle = make('h3','swlw-result-title');resultDetail = make('p','swlw-result-detail');
    result.append(resultLabel,resultTitle,resultDetail);
    coachNote = make('p','swlw-coach-note');
    button = make('button','swlw-spin');button.type='button';
    button.append(make('span','swlw-spin-label','Spin the wheel'));
    const arrow = make('span','swlw-spin-icon','↻');arrow.setAttribute('aria-hidden','true');button.append(arrow);button.addEventListener('click',spin);
    const list = make('details','swlw-options');
    list.append(make('summary','','What’s on the wheel?'));
    const choices = make('ul','swlw-options-list');ENTRIES.forEach(entry=>choices.append(make('li','',entry.label)));list.append(choices);
    controls.append(result,coachNote,button,make('p','swlw-freeplay','Free play · no league points'),list);
    layout.append(stage,controls);root.append(heading,layout);container.append(root);
    showReady();
    media?.addEventListener?.('change',motionChanged);
    document.addEventListener('visibilitychange',visibilityChanged);
    if (window.MutationObserver && document.body) {
      observer = new window.MutationObserver(motionChanged);
      observer.observe(document.body,{attributes:true,attributeFilter:['class']});
    }
  }
  window.SWLWheel = Object.freeze({version:1,mount,deactivate,destroy});
})();
