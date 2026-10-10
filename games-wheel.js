(() => {
  'use strict';
  if (window.SWLWheel?.version === 2) return;

  const SVG = 'http://www.w3.org/2000/svg';
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
  const CRAZY_ENTRIES = Object.freeze([
    { label:'12 burpees', lines:['12','BURPEES'], kind:'exercise', weight:9 },
    { label:'Coach does a star-jump dance', lines:['COACH','STAR-JUMP','DANCE'], kind:'coach-demo', weight:8, detail:'Coach creates a short star-jump dance. Everyone applauds.' },
    { label:'15 press-ups', lines:['15','PRESS-UPS'], kind:'exercise', weight:8 },
    { label:'20 sec robot-pose freeze', lines:['20 SEC','ROBOT','FREEZE'], kind:'exercise', weight:7, detail:'Choose a funny robot pose and freeze for 20 seconds.' },
    { label:'15 V-sits', lines:['15','V-SITS'], kind:'exercise', weight:8 },
    { label:'All coaches do funny splits', lines:['★','2%'], kind:'coach-jackpot', weight:2, detail:'All coaches choose a comfortable funny splits pose, or another pose of their choice.' },
    { label:'30 sec squat hold', lines:['30 SEC','SQUAT','HOLD'], kind:'exercise', weight:8 },
    { label:'Coach joins next spin', lines:['COACH','JOINS NEXT','SPIN'], kind:'coach-next', weight:9 },
    { label:'12 tuck jumps', lines:['12','TUCK','JUMPS'], kind:'exercise', weight:8 },
    { label:'Coach does a robot pose', lines:['COACH','ROBOT','POSE'], kind:'coach-demo', weight:7, detail:'Coach invents a robot pose. Hold it for a photo-worthy five seconds.' },
    { label:'20 mountain climbers', lines:['20','MOUNTAIN','CLIMBERS'], kind:'exercise', weight:8 },
    { label:'Funny flamingo balance', lines:['FUNNY','FLAMINGO','BALANCE'], kind:'exercise', weight:6, detail:'Make a funny flamingo pose: balance for 10 seconds on each leg.' },
    { label:'Coach invents a victory pose', lines:['COACH','VICTORY','POSE'], kind:'coach-demo', weight:7, detail:'Coach reveals a victory pose. Everyone copies it for five seconds.' },
    { label:'5 minutes free time', lines:['5 MIN','FREE','TIME'], kind:'free-time', weight:5, detail:'Five minutes of supervised free time in the designated area.' }
  ].map(Object.freeze));
  const normalize = angle => ((angle % 360) + 360) % 360;
  function geometry(entries) {
    const total = entries.reduce((sum,entry)=>sum+(entry.weight || 1),0);
    const origin = -(entries[0].weight || 1)/total*180;
    let offset = 0;
    const segments = entries.map((entry,index)=>{
      const weight=entry.weight || 1, span=weight/total*360, start=origin+offset;
      const segment=Object.freeze({entry,index,weight,span,start,end:start+span,center:start+span/2,offset});
      offset+=span;
      return segment;
    });
    return Object.freeze({entries,segments:Object.freeze(segments),origin,total,
      boundaries:Object.freeze(segments.map(segment=>normalize(-segment.start)).sort((a,b)=>a-b))});
  }
  const MODES = Object.freeze({
    normal:Object.freeze({title:'Conditioning wheel',intro:'Let the wheel choose the next round.',model:geometry(ENTRIES)}),
    crazy:Object.freeze({title:'Crazy wheel',intro:'Bigger spins. Coach surprises. Two tiny jackpots.',model:geometry(CRAZY_ENTRIES)})
  });
  const emptyProgress = () => ({rotation:0,lastResult:null,coachNext:false});
  let progress = {normal:emptyProgress(),crazy:emptyProgress()}, mode = 'normal';
  let host = null, root = null, rotor = null, pointer = null, button = null, result = null;
  let resultLabel = null, resultTitle = null, resultDetail = null, coachNote = null;
  let headingTitle = null, intro = null, count = null, choices = null, modeButtons = [];
  let callbacks = {}, currentSpin = null;
  let finishTimer = null, tickFrame = null, transitionHandler = null, generation = 0, observer = null;
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const state = () => progress[mode];
  const model = () => MODES[mode].model;
  function pointerIndex(angle, wheel = model()) {
    const offset=normalize(-angle-wheel.origin);
    return wheel.segments.find(segment=>offset<segment.offset+segment.span)?.index ?? wheel.segments.length-1;
  }
  function chooseSegment(wheel, sample, coachNext) {
    const pool=wheel.segments.filter(segment=>!coachNext || segment.entry.kind==='exercise');
    const total=pool.reduce((sum,segment)=>sum+segment.weight,0);
    let value=sample*total;
    for(const segment of pool) { if(value<segment.weight) return segment; value-=segment.weight; }
    return pool[pool.length-1];
  }
  function crossedDividers(angle,wheel) {
    const within=normalize(angle);
    return Math.floor(angle/360)*wheel.segments.length+wheel.boundaries.filter(boundary=>boundary<=within).length;
  }
  function sound(kind) {
    try { callbacks.playSound?.(kind === 'wheel-finish' ? {kind,perfect:true} : {kind}); } catch (_) {}
  }
  // Use the same easing as the visual rotation to time real divider crossings.
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
    const crazy=mode==='crazy', wheelModel=model();
    const wheel = svg('svg', { viewBox:'0 0 600 600',role:'img','aria-label':`${MODES[mode].title}. ${wheelModel.entries.length} challenges; segment size matches the chance of landing there.${crazy?' Star: all coaches do funny splits, 2 percent. Free time, 5 percent.':''}` });
    const defs=svg('defs');
    const rim=svg('linearGradient',{id:'swlw-rim-metal',x1:0,y1:0,x2:1,y2:1});
    [['0%','#e8e4ff'],['26%',crazy?'#dc8bff':'#8c749f'],['52%','#242d24'],['80%','#a6c78a'],['100%','#e4d7f5']].forEach(([offset,color])=>rim.append(svg('stop',{offset,'stop-color':color})));
    const gloss=svg('radialGradient',{id:'swlw-gloss',cx:'.28',cy:'.18',r:'.95'});
    [['0%','#ffffff','.16'],['50%','#ffffff','0'],['100%','#080c09','.2']].forEach(([offset,color,opacity])=>gloss.append(svg('stop',{offset,'stop-color':color,'stop-opacity':opacity})));
    defs.append(rim,gloss);wheel.append(defs);
    wheel.append(svg('circle', { cx:300,cy:300,r:296,fill:'#17191d',stroke:'url(#swlw-rim-metal)','stroke-width':5 }));
    wheelModel.segments.forEach(segment => {
      const {entry,index,span,start,end,center}=segment, angle=center-90;
      const [x1,y1]=point(start-90,282),[x2,y2]=point(end-90,282);
      const special=entry.kind!=='exercise';
      const palette=entry.kind==='coach-next'?'#d5fa70':entry.kind==='coach-jackpot'?'#fff1a2':entry.kind==='free-time'?'#8ff7c6':entry.kind==='coach-demo'?(crazy?'#deabff':'#d0b1ff')
        : (crazy?['#513072','#234539','#643b7c','#335942']:['#2c253c','#243224','#392d4b','#31402a'])[index%4];
      const group=svg('g',{class:'swlw-segment','data-wheel-segment':index,'data-kind':entry.kind,'data-start-angle':start,'data-end-angle':end,'data-probability':segment.weight/wheelModel.total,'aria-hidden':'true'});
      group.append(svg('path',{d:`M300 300 L${x1} ${y1} A282 282 0 0 1 ${x2} ${y2} Z`,fill:palette,stroke:'#0d1015','stroke-width':span<10?1.4:2.3}));
      const thin=span<10, narrow=span<23;
      const [x,y]=point(angle,thin?247:213);
      const labels=svg('g',{transform:`translate(${x} ${y}) rotate(${angle+90})`,fill:special?'#1a2315':'#f0f1e9','text-anchor':'middle'});
      const lineStep=thin?20:narrow?23:25;
      const firstY=entry.lines.length===3?-lineStep+2:-10;
      entry.lines.forEach((line,lineIndex)=>{
        const isCount=lineIndex===0 && !special && /^\d/.test(line);
        const fontSize=thin?(lineIndex===0?22:11):Math.min(isCount?28:line.length>8?17.5:21,narrow?17:28);
        labels.append(svg('text',{x:0,y:firstY+lineIndex*lineStep,'font-size':fontSize,'font-weight':isCount?850:750,'letter-spacing':isCount?'-.8':'.2','font-family':'system-ui, sans-serif'},line));
      });
      group.append(labels);wheel.append(group);
    });
    wheel.append(svg('circle',{cx:300,cy:300,r:282,fill:'url(#swlw-gloss)','aria-hidden':'true','pointer-events':'none'}));
    for(let index=0;index<36;index++) {
      const [x,y]=point(index*10-90,290);
      wheel.append(svg('circle',{cx:x,cy:y,r:index%3===0?2.4:1.25,fill:index%3===0?'#d5fa70':'#b6a2d9',opacity:index%3===0?.9:.4}));
    }
    return wheel;
  }
  function updateCoachNote() {
    coachNote.hidden=!state().coachNext;
    coachNote.textContent=`Coach joins the next ${mode==='crazy'?'Crazy Wheel':'conditioning'} round · exercise slots only`;
  }
  function showReady(cancelled=false) {
    const {lastResult}=state();
    root.classList.toggle('has-result',Boolean(lastResult));
    rotor.classList.toggle('has-landed',Boolean(lastResult));
    rotor.querySelectorAll('.swlw-segment').forEach((segment,index)=>segment.classList.toggle('is-selected',index===lastResult?.index));
    result.classList.toggle('has-result',Boolean(lastResult));
    result.classList.toggle('is-jackpot',Boolean(lastResult?.jackpot));
    resultLabel.textContent=cancelled?'SPIN CANCELLED':lastResult?.jackpot?'JACKPOT':lastResult?.coachJoined?'COACH JOINS IN':lastResult?'THE WHEEL SAYS':'NEXT ROUND';
    resultTitle.textContent=lastResult?.label || (mode==='crazy'?'Ready to go crazy?':'Ready when you are');
    resultDetail.textContent=cancelled?'Ready for another spin whenever you are.':lastResult?.detail || (mode==='crazy'?'More speed, more surprises. Let the pointer decide.':'Spin the wheel and let it choose the challenge.');
    button.disabled=false;
    modeButtons.forEach(control=>{control.disabled=false;control.setAttribute('aria-pressed',String(control.dataset.mode===mode));});
    button.querySelector('.swlw-spin-label').textContent=lastResult?'Spin again':mode==='crazy'?'Spin the Crazy Wheel':'Spin the wheel';
    root.classList.remove('is-spinning');root.setAttribute('aria-busy','false');
    if(lastResult) {root.dataset.resultIndex=String(lastResult.index);root.dataset.coachJoined=String(lastResult.coachJoined);}
    else {delete root.dataset.resultIndex;delete root.dataset.coachJoined;}
    updateCoachNote();
  }
  function changeMode(nextMode) {
    if(currentSpin || !MODES[nextMode] || mode===nextMode) return;
    mode=nextMode;renderMode();
  }
  function renderMode() {
    root.dataset.mode=mode;
    root.classList.toggle('is-crazy',mode==='crazy');
    headingTitle.textContent=MODES[mode].title;intro.textContent=MODES[mode].intro;
    count.textContent=`${model().entries.length} possibilities`;
    while(rotor.firstChild) rotor.firstChild.remove();
    rotor.append(wheelSVG());rotor.style.transition='none';rotor.style.transform=`rotate(${state().rotation}deg)`;
    while(choices.firstChild) choices.firstChild.remove();
    model().entries.forEach(entry=>choices.append(make('li','',`${entry.label}${mode==='crazy'?` · ${entry.weight}%`:''}`)));
    showReady();
  }
  function clearSpinListeners() {
    clearTimeout(finishTimer);finishTimer=null;
    if(tickFrame!==null) window.cancelAnimationFrame?.(tickFrame);
    tickFrame=null;
    if(pointer) pointer.style.transform='';
    if(transitionHandler && rotor) rotor.removeEventListener('transitionend',transitionHandler);
    transitionHandler=null;
  }
  function trackSpin(token) {
    if(typeof window.requestAnimationFrame!=='function') return;
    const frame=()=>{
      tickFrame=null;
      const spin=currentSpin;
      if(!spin || spin.token!==token) return;
      if(!root?.isConnected || document.hidden) {deactivate();return;}
      if(motionOff()) {finishSpin(token);return;}
      const now=performance.now(),fraction=Math.min(1,(now-spin.started)/spin.duration);
      const angle=spin.from+(spin.target-spin.from)*easedProgress(fraction);
      const sector=crossedDividers(angle,spin.wheel);
      // Coalesce fast crossings; no sound backlog. The final ticks follow each divider.
      if(sector!==spin.lastSector) {
        spin.lastSector=sector;
        if(now-spin.lastTick>=40) {spin.lastTick=now;sound('wheel-tick');}
      }
      const age=now-spin.lastTick,kick=age<120?-14*Math.sin(Math.PI*age/120)*Math.exp(-age/70):0;
      pointer.style.transform=`translateX(-50%) rotate(${kick}deg)`;
      if(fraction>=1) {finishSpin(token);return;}
      tickFrame=window.requestAnimationFrame(frame);
    };
    tickFrame=window.requestAnimationFrame(frame);
  }
  function finishSpin(token) {
    if(!currentSpin || currentSpin.token!==token || !root) return;
    const spin=currentSpin, active=state();
    clearSpinListeners();currentSpin=null;
    active.rotation=normalize(spin.target);
    rotor.style.transition='none';rotor.style.transform=`rotate(${active.rotation}deg)`;
    // Resolve from the same arc geometry that is drawn under the fixed pointer.
    const index=pointerIndex(active.rotation,spin.wheel),entry=spin.wheel.entries[index];
    const joined=active.coachNext && entry.kind==='exercise';
    if(entry.kind==='coach-next') active.coachNext=true;
    else if(joined) active.coachNext=false;
    const detail=entry.kind==='coach-next'?'Spin again. Your coach joins whichever exercise comes next.'
      : joined?`Coach joins in! ${entry.detail || 'Complete this round together.'}`
      : entry.detail || (entry.kind==='coach-demo'?'Coach can choose another demonstration.':'Complete the round, then spin again.');
    active.lastResult={index,label:entry.label,detail,coachJoined:joined,jackpot:entry.kind==='coach-jackpot'||entry.kind==='free-time'};
    showReady();sound('wheel-finish');
  }
  function spin() {
    if(!root || currentSpin || !root.isConnected) return;
    const active=state(),wheel=model(),crazy=mode==='crazy';
    // Coach follow-ups keep the relative arc weights of eligible exercise slots.
    const chosen=chooseSegment(wheel,random(),active.coachNext);
    const landing=normalize(-chosen.center+(random()-.5)*chosen.span*.4);
    const quiet=motionOff(),duration=quiet?220:(crazy?4200:4050)+Math.floor(random()*(crazy?400:420));
    const target=active.rotation+360*((crazy?12:5)+Math.floor(random()*(crazy?4:2)))+normalize(landing-active.rotation);
    const token=++generation;
    currentSpin={token,wheel,from:active.rotation,target,started:performance.now(),duration,lastSector:crossedDividers(active.rotation,wheel),lastTick:-Infinity};
    button.disabled=true;modeButtons.forEach(control=>{control.disabled=true;});
    button.querySelector('.swlw-spin-label').textContent='Spinning…';
    result.classList.remove('has-result');result.classList.remove('is-jackpot');root.classList.remove('has-result');rotor.classList.remove('has-landed');
    rotor.querySelectorAll('.swlw-segment').forEach(segment=>segment.classList.remove('is-selected'));
    resultLabel.textContent='ON ITS WAY';resultTitle.textContent=quiet?'Choosing your round…':crazy?'Here comes the chaos…':'Around it goes…';
    resultDetail.textContent=active.coachNext?'Your coach is joining this round.':'The pointer will pick your challenge.';
    root.setAttribute('aria-busy','true');root.classList.toggle('is-spinning',!quiet);
    rotor.style.transition='none';rotor.style.transform=`rotate(${active.rotation}deg)`;rotor.getBoundingClientRect();
    rotor.style.transition=quiet?'none':`transform ${duration}ms cubic-bezier(.12,.72,.12,1)`;
    rotor.style.transform=`rotate(${quiet?landing:target}deg)`;
    if(!quiet) {
      transitionHandler=event=>{
        if(event.target===rotor && event.propertyName==='transform' && performance.now()-currentSpin?.started>=duration-80) finishSpin(token);
      };
      rotor.addEventListener('transitionend',transitionHandler);sound('wheel-start');trackSpin(token);
    }
    finishTimer=setTimeout(()=>finishSpin(token),quiet?duration:duration+160);
  }
  function deactivate() {
    if(!root || !currentSpin) return;
    generation++;currentSpin=null;clearSpinListeners();
    rotor.style.transition='none';rotor.style.transform=`rotate(${state().rotation}deg)`;
    showReady(true);
  }
  function motionChanged() {if(currentSpin && motionOff()) finishSpin(currentSpin.token);}
  function visibilityChanged() {if(document.hidden) deactivate();}
  function destroy() {
    deactivate();clearSpinListeners();observer?.disconnect();observer=null;
    media?.removeEventListener?.('change',motionChanged);document.removeEventListener('visibilitychange',visibilityChanged);
    root?.remove();
    host=root=rotor=pointer=button=result=resultLabel=resultTitle=resultDetail=coachNote=null;
    headingTitle=intro=count=choices=null;modeButtons=[];callbacks={};
    progress={normal:emptyProgress(),crazy:emptyProgress()};mode='normal';
  }
  function mount(container,options={}) {
    if(!container || typeof container.append!=='function') throw TypeError('SWLWheel.mount requires a container.');
    if(host===container && root?.isConnected) {callbacks=options;motionChanged();return;}
    destroy();host=container;callbacks=options;
    root=make('section','swlw-game');
    const heading=make('header','swlw-heading'),headingCopy=make('div','swlw-heading-copy');
    headingTitle=make('h2','swlw-title');intro=make('p','swlw-intro');
    headingCopy.append(make('p','swlw-eyebrow','SWL GAMES · FREE PLAY'),headingTitle,intro);
    const headingTools=make('div','swlw-heading-tools');count=make('span','swlw-round-count');
    const modeGroup=make('div','swlw-modes');modeGroup.setAttribute('role','group');modeGroup.setAttribute('aria-label','Wheel mode');
    modeButtons=Object.keys(MODES).map(key=>{
      const control=make('button','swlw-mode',key==='normal'?'Conditioning':'Crazy wheel');control.type='button';control.dataset.mode=key;
      control.setAttribute('aria-label',key==='normal'?'Conditioning wheel':'Crazy wheel');control.addEventListener('click',()=>changeMode(key));return control;
    });
    modeGroup.append(...modeButtons);headingTools.append(count,modeGroup);heading.append(headingCopy,headingTools);
    const layout=make('div','swlw-layout'),stage=make('div','swlw-stage');
    pointer=make('div','swlw-pointer');pointer.setAttribute('aria-hidden','true');
    const shell=make('div','swlw-shell');rotor=make('div','swlw-rotor');
    const hub=make('div','swlw-hub');hub.setAttribute('aria-hidden','true');
    const logo=make('img','swlw-hub-logo');logo.src='./swl-logo.png';logo.alt='';hub.append(logo,make('span','swlw-hub-caption','LET’S GO'));
    shell.append(rotor,hub);stage.append(pointer,shell);
    const controls=make('div','swlw-controls');result=make('div','swlw-result');
    result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.setAttribute('aria-atomic','true');
    resultLabel=make('p','swlw-result-label');resultTitle=make('h3','swlw-result-title');resultDetail=make('p','swlw-result-detail');result.append(resultLabel,resultTitle,resultDetail);
    coachNote=make('p','swlw-coach-note');button=make('button','swlw-spin');button.type='button';button.append(make('span','swlw-spin-label','Spin the wheel'));
    const arrow=make('span','swlw-spin-icon','↻');arrow.setAttribute('aria-hidden','true');button.append(arrow);button.addEventListener('click',spin);
    const list=make('details','swlw-options');list.append(make('summary','','What’s on the wheel?'));choices=make('ul','swlw-options-list');list.append(choices);
    controls.append(result,coachNote,button,make('p','swlw-freeplay','Free play · no league points'),list);
    layout.append(stage,controls);root.append(heading,layout);container.append(root);renderMode();
    media?.addEventListener?.('change',motionChanged);document.addEventListener('visibilitychange',visibilityChanged);
    if(window.MutationObserver && document.body) {observer=new window.MutationObserver(motionChanged);observer.observe(document.body,{attributes:true,attributeFilter:['class']});}
  }
  window.SWLWheel=Object.freeze({version:2,mount,deactivate,destroy});
})();
