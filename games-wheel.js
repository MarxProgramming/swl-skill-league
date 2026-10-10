(() => {
  'use strict';
  if (window.SWLWheel?.version === 3) return;
  const SVG='http://www.w3.org/2000/svg', MAX_OPTIONS=24;
  const EXERCISE_DETAILS={
    'burpees':'From standing, place your hands on the floor, step or jump your feet back to a plank, bring them back towards your hands, then stand. One full sequence is one rep.',
    'press-ups':'Place hands under shoulders and keep a long body shape. Bend your elbows to lower your chest, then push back up. Knees down is an option.',
    'jumping jacks':'Jump your feet apart as your arms lift, then bring your feet and arms back together. One out-and-in movement is one rep.',
    'V-sits':'From sitting, lift your legs and chest towards a V shape, then lower with control. Bent knees are welcome. Count each lift.',
    'squats':'Bend your knees and hips into a comfortable squat, then stand tall. Count each return to standing.',
    'plank':'Hold a long body shape on forearms and toes for the time shown, keeping your middle steady. Knees may rest on the floor.',
    'hollow rocks':'Lie on your back in a familiar hollow shape and make small, controlled rocks. Count each forward-and-back rock.',
    'mountain climbers':'From a hands-and-feet plank, bring one knee forwards and return it, then alternate legs. Count each knee drive.',
    'calf raises':'Rise onto the balls of your feet, pause, then lower your heels with control. Count each rise.',
    'tuck jumps':'Jump from two feet, bringing your knees towards your chest, then land softly on both feet. Reset between repetitions.',
    'star jumps':'Jump into a wide star shape, then land softly with your feet together. Reset before the next jump.',
    'squat hold':'Lower into a comfortable squat and hold that position for the time shown, keeping your feet flat.',
    'star balance':'Make a comfortable star shape and balance on one leg. Swap legs halfway through the time. A light toe touch is welcome.'
  };
  const exercise=(id,name,amount,unit,words,weight=1,detail='')=>({id,name,amount,unit,words,weight,kind:'exercise',detail:detail||EXERCISE_DETAILS[name]||''});
  const NORMAL=[
    exercise('burpees','burpees',10,'reps',['BURPEES']),
    exercise('press-ups','press-ups',10,'reps',['PRESS','UPS']),
    {id:'coach-next',name:'Coach joins next spin',amount:1,unit:'round',words:['COACH','JOINS NEXT'],kind:'coach-next',weight:1,detail:'Your coach joins the next exercise round. Finish this option, then spin again.'},
    exercise('jumping-jacks','jumping jacks',10,'reps',['JUMPING','JACKS']),
    exercise('v-sits','V-sits',10,'reps',['V-SITS']),
    exercise('squats','squats',10,'reps',['SQUATS']),
    exercise('plank','plank',20,'seconds',['PLANK']),
    exercise('hollow-rocks','hollow rocks',10,'reps',['HOLLOW','ROCKS']),
    {id:'coach-demo',name:'Coach does a backflip',amount:1,unit:'round',words:['COACH','BACKFLIP'],kind:'coach-demo',weight:1,detail:'Coach can choose another demonstration. One coach demonstration completes the round.'},
    exercise('mountain-climbers','mountain climbers',10,'reps',['MOUNTAIN','CLIMBERS']),
    exercise('calf-raises','calf raises',10,'reps',['CALF','RAISES']),
    exercise('tuck-jumps','tuck jumps',10,'reps',['TUCK','JUMPS'])
  ];
  const CRAZY=[
    exercise('burpees','burpees',12,'reps',['BURPEES'],9),
    {id:'funniest-pose',name:'Funniest gymnast pose',amount:1,unit:'round',words:['FUNNIEST','POSE'],kind:'fun',weight:8,detail:'Everyone makes a funny, comfortable pose. Coach picks the funniest gymnast, who gets the next spin.'},
    exercise('press-ups','press-ups',15,'reps',['PRESS','UPS'],8),
    exercise('robot-freeze','robot-pose freeze',20,'seconds',['ROBOT','FREEZE'],7,'Choose a funny robot pose and hold it for the time shown.'),
    exercise('v-sits','V-sits',15,'reps',['V-SITS'],8),
    {id:'coach-splits',name:'All coaches do funny splits',amount:1,unit:'round',words:['★'],kind:'coach-jackpot',weight:2,detail:'A rare coach surprise! All coaches choose a comfortable funny splits pose, or another pose of their choice.'},
    exercise('squat-hold','squat hold',30,'seconds',['SQUAT','HOLD'],8),
    {id:'coach-next',name:'Coach joins next spin',amount:1,unit:'round',words:['COACH','JOINS NEXT'],kind:'coach-next',weight:9,detail:'Your coach joins the next exercise round. Finish this option, then spin again.'},
    exercise('tuck-jumps','tuck jumps',12,'reps',['TUCK','JUMPS'],8),
    exercise('silly-statue','silly statue',10,'seconds',['SILLY','STATUE'],7,'Choose a funny gymnast statue and hold it for the time shown.'),
    exercise('mountain-climbers','mountain climbers',20,'reps',['MOUNTAIN','CLIMBERS'],8),
    exercise('flamingo','funny flamingo balance',20,'seconds',['FLAMINGO','BALANCE'],6,'Make a funny flamingo pose for the time shown. Swap legs halfway, with a toe touch whenever needed.'),
    exercise('star-jumps','star jumps',5,'reps',['STAR','JUMPS'],7),
    {id:'free-time',name:'free time',amount:300,unit:'seconds',words:['FREE','TIME'],kind:'free-time',weight:5,detail:'Supervised free time in the designated area, for the time shown.'}
  ];
  const EXTRAS=[
    exercise('extra-squats','squats',10,'reps',['SQUATS'],8),
    exercise('extra-calf','calf raises',10,'reps',['CALF','RAISES'],8),
    exercise('extra-plank','plank',20,'seconds',['PLANK'],8),
    exercise('extra-jacks','jumping jacks',10,'reps',['JUMPING','JACKS'],8),
    exercise('extra-climbers','mountain climbers',10,'reps',['MOUNTAIN','CLIMBERS'],8),
    exercise('extra-balance','star balance',15,'seconds',['STAR','BALANCE'],8)
  ];
  const MODES={normal:{title:'Conditioning wheel',entries:NORMAL},crazy:{title:'Crazy wheel',entries:CRAZY}};
  const normalize=angle=>((angle%360)+360)%360;
  const freshProgress=key=>({phase:'idle',entries:MODES[key].entries.map(entry=>({...entry,id:`${key}-${entry.id}`})),rotation:0,lastResult:null,pendingId:null,coachNext:false,round:0,removed:0,serial:0});
  let progress={normal:freshProgress('normal'),crazy:freshProgress('crazy')},mode='normal';
  let host,root,rotor,pointer,button,result,resultLabel,resultTitle,resultDetail,coachNote,headingTitle,count,choices;
  let grades,goodButton,okayButton,needsButton,gradeHelp,newButton,confirmBox,keepButton,inspector,inspectorTitle,inspectorDetail,inspectorQuantity,inspectorFocus;
  let modeButtons=[],callbacks={},currentSpin=null,confirming=false,finishTimer=null,tickFrame=null,transitionHandler=null,generation=0,observer=null;
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const state=()=>progress[mode];
  function quantity(entry) {return entry.unit==='seconds'?(entry.amount%60===0?`${entry.amount/60} ${entry.amount===60?'minute':'minutes'}`:`${entry.amount} sec`):entry.unit==='round'?`${entry.amount} round`:`${entry.amount}`;}
  function label(entry) {return entry.unit==='round'?entry.name:`${quantity(entry)} ${entry.name}`;}
  function geometry(entries) {
    const total=entries.reduce((sum,entry)=>sum+entry.weight,0),origin=-entries[0].weight/total*180;
    let offset=0;
    const segments=entries.map((entry,index)=>{const span=entry.weight/total*360,start=origin+offset;const segment={entry,index,span,start,end:start+span,center:start+span/2,offset};offset+=span;return segment;});
    return {entries,segments,origin,total,boundaries:segments.map(segment=>normalize(-segment.start)).sort((a,b)=>a-b)};
  }
  const model=()=>geometry(state().entries);
  function pointerIndex(angle,wheel=model()) {const offset=normalize(-angle-wheel.origin);return wheel.segments.find(segment=>offset<segment.offset+segment.span)?.index??wheel.segments.length-1;}
  function chooseSegment(wheel,sample,coachNext) {
    const exercises=wheel.segments.filter(segment=>segment.entry.kind==='exercise');
    const pool=coachNext&&exercises.length?exercises:wheel.segments;
    let value=sample*pool.reduce((sum,segment)=>sum+segment.entry.weight,0);
    for(const segment of pool){if(value<segment.entry.weight)return segment;value-=segment.entry.weight;}
    return pool[pool.length-1];
  }
  function crossedDividers(angle,wheel) {return Math.floor(angle/360)*wheel.segments.length+wheel.boundaries.filter(boundary=>boundary<=normalize(angle)).length;}
  function sound(kind) {try{callbacks.playSound?.(kind==='wheel-finish'?{kind,perfect:true}:{kind});}catch(_) {}}
  function easedProgress(fraction) {
    if(fraction<=0||fraction>=1)return Math.max(0,Math.min(1,fraction));
    const cubic=(t,a,b)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;let low=0,high=1;
    for(let step=0;step<18;step++){const middle=(low+high)/2;if(cubic(middle,.12,.12)<fraction)low=middle;else high=middle;}
    return cubic((low+high)/2,.72,1);
  }
  function motionOff(){if(media?.matches||document.body?.classList.contains('no-motion'))return true;try{return Boolean(callbacks.motionOff?.());}catch(_){return true;}}
  function random(){try{const value=new Uint32Array(1);window.crypto.getRandomValues(value);return value[0]/4294967296;}catch(_){return Math.random();}}
  function make(tag,className,text){const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;}
  function svg(tag,attributes,text){const element=document.createElementNS(SVG,tag);for(const [name,value]of Object.entries(attributes||{}))element.setAttribute(name,String(value));if(text!==undefined)element.textContent=text;return element;}
  function point(angle,radius){const radians=angle*Math.PI/180;return[300+Math.cos(radians)*radius,300+Math.sin(radians)*radius];}
  function explain(entryId,trigger){
    if(currentSpin||confirming)return;
    const entry=state().entries.find(item=>item.id===entryId);if(!entry)return;
    inspectorTitle.textContent=label(entry);inspectorDetail.textContent=entry.detail||'Complete the repetitions or time shown, then let the coach grade the round.';
    inspectorQuantity.textContent=entry.unit==='round'?'One round. Okay keeps this at the one-round minimum; Done removes it.':`Okay changes this to ${quantity({...entry,amount:Math.max(1,Math.ceil(entry.amount/2))})}${entry.unit==='reps'?' reps':''} next time. Good removes it.`;
    inspectorFocus=trigger;inspector.hidden=false;
    try{inspector.showModal();}catch(_){inspector.setAttribute('open','');}
    inspector.querySelector('.swlw-inspector-close')?.focus?.({preventScroll:true});
  }
  function closeInspector(restore=true){if(!inspector)return;try{inspector.close();}catch(_){inspector.removeAttribute?.('open');}inspector.hidden=true;const target=inspectorFocus?.isConnected?inspectorFocus:button;inspectorFocus=null;if(restore)target?.focus?.({preventScroll:true});}
  function wheelSVG(){
    const crazy=mode==='crazy',wheelModel=model();
    const wheel=svg('svg',{viewBox:'0 0 600 600',role:'group','aria-label':`${MODES[mode].title}. Tap or select any segment for an explanation.`});
    const defs=svg('defs'),rim=svg('linearGradient',{id:'swlw-rim-metal',x1:0,y1:0,x2:1,y2:1});
    [['0%','#e8e4ff'],['26%',crazy?'#dc8bff':'#8c749f'],['52%','#242d24'],['80%','#a6c78a'],['100%','#e4d7f5']].forEach(([offset,color])=>rim.append(svg('stop',{offset,'stop-color':color})));
    const gloss=svg('radialGradient',{id:'swlw-gloss',cx:'.28',cy:'.18',r:'.95'});[['0%','#ffffff','.16'],['50%','#ffffff','0'],['100%','#080c09','.2']].forEach(([offset,color,opacity])=>gloss.append(svg('stop',{offset,'stop-color':color,'stop-opacity':opacity})));
    defs.append(rim,gloss);wheel.append(defs,svg('circle',{cx:300,cy:300,r:296,fill:'#17191d',stroke:'url(#swlw-rim-metal)','stroke-width':5}));
    wheelModel.segments.forEach(segment=>{
      const {entry,index,span,start,end,center}=segment,angle=center-90,[x1,y1]=point(start-90,282),[x2,y2]=point(end-90,282),special=entry.kind!=='exercise';
      const palette=entry.kind==='coach-next'?'#d5fa70':entry.kind==='coach-jackpot'?'#fff1a2':entry.kind==='free-time'?'#8ff7c6':special?(crazy?'#deabff':'#d0b1ff'):(crazy?['#513072','#234539','#643b7c','#335942']:['#2c253c','#243224','#392d4b','#31402a'])[index%4];
      const group=svg('g',{class:'swlw-segment','data-wheel-segment':index,'data-entry-id':entry.id,'data-kind':entry.kind,'data-start-angle':start,'data-end-angle':end,'data-probability':entry.weight/wheelModel.total,role:'button',tabindex:0,'aria-label':`Explain ${label(entry)}`});
      // A full-circle final option uses a circle: SVG arcs cannot represent 360 degrees in one command.
      group.append(span>359.999?svg('circle',{cx:300,cy:300,r:282,fill:palette,stroke:'#0d1015','stroke-width':2.3}):svg('path',{d:`M300 300 L${x1} ${y1} A282 282 0 ${span>180?1:0} 1 ${x2} ${y2} Z`,fill:palette,stroke:'#0d1015','stroke-width':span<10?1.4:2.3}));
      const thin=span<11||entry.kind==='coach-jackpot',radius=thin?247:218,[x,y]=point(angle,radius);
      const lines=thin?['★']:entry.unit==='round'?entry.words:[entry.unit==='seconds'?(entry.amount%60===0?`${entry.amount/60} MIN`:`${entry.amount} SEC`):String(entry.amount),...entry.words];
      const labels=svg('g',{transform:`translate(${x} ${y}) rotate(${angle+90})`,fill:special?'#1a2315':'#f0f1e9','text-anchor':'middle','pointer-events':'none'});
      const step=23,firstY=lines.length===3?-21:lines.length===2?-9:7;
      lines.forEach((line,lineIndex)=>{const lineRadius=radius-(firstY+lineIndex*step),available=span>=90?240:Math.max(9,2*lineRadius*Math.sin(span*Math.PI/360)-9),preferred=thin?25:lineIndex===0&&entry.unit!=='round'?27:20;
        const fontSize=Math.min(preferred,available/(Math.max(1,line.length)*.65));
        labels.append(svg('text',{x:0,y:firstY+lineIndex*step,'font-size':fontSize,'font-weight':850,'letter-spacing':0,'font-family':'system-ui, sans-serif'},line));});
      group.append(labels);group.addEventListener('click',()=>explain(entry.id,group));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();explain(entry.id,group);}});wheel.append(group);
    });
    wheel.append(svg('circle',{cx:300,cy:300,r:282,fill:'url(#swlw-gloss)','aria-hidden':'true','pointer-events':'none'}));
    for(let index=0;index<36;index++){const[x,y]=point(index*10-90,290);wheel.append(svg('circle',{cx:x,cy:y,r:index%3===0?2.4:1.25,fill:index%3===0?'#d5fa70':'#b6a2d9',opacity:index%3===0?.9:.4,'pointer-events':'none'}));}
    return wheel;
  }
  function renderWheel(){
    while(rotor.firstChild)rotor.firstChild.remove();rotor.append(wheelSVG());rotor.style.transition='none';rotor.style.transform=`rotate(${state().rotation}deg)`;
    while(choices.firstChild)choices.firstChild.remove();
    state().entries.forEach(entry=>{const item=make('li',''),control=make('button','swlw-option',label(entry));control.type='button';control.dataset.entryId=entry.id;control.addEventListener('click',()=>explain(entry.id,control));item.append(control);choices.append(item);});
  }
  function showReady(cancelled=false){
    const active=state(),review=active.phase==='grading',complete=active.phase==='complete',last=active.lastResult;
    root.dataset.mode=mode;root.dataset.phase=active.phase;root.classList.toggle('is-crazy',mode==='crazy');root.classList.toggle('has-result',Boolean(last)||complete);root.classList.toggle('is-complete',complete);
    headingTitle.textContent=MODES[mode].title;count.textContent=active.phase==='idle'?`${active.entries.length} options`:`${active.entries.length} ${active.entries.length===1?'option':'options'} left`;
    rotor.classList.toggle('has-landed',review);rotor.querySelectorAll('.swlw-segment').forEach(segment=>{segment.classList.toggle('is-selected',review&&segment.getAttribute('data-entry-id')===active.pendingId);segment.setAttribute('tabindex','0');segment.setAttribute('aria-disabled','false');});
    result.classList.toggle('has-result',Boolean(last)||complete);result.classList.toggle('is-jackpot',Boolean(review&&last?.jackpot));
    resultLabel.textContent=cancelled?'SPIN CANCELLED':complete?'ONE LEFT · ALL DONE':review?(last?.coachJoined?'COACH JOINS IN':last?.kind==='free-time'?'FREE TIME':last?.jackpot?'COACH SURPRISE':'PERFORM · THEN GRADE'):active.phase==='idle'?'HOW TO PLAY':last?'ROUND COMPLETE':'GAME STARTED';
    if(active.phase!=='idle'&&!complete)resultLabel.textContent+=` · ${active.entries.length} LEFT`;
    resultTitle.textContent=complete?'Game complete':review?last.label:active.phase==='idle'?'Play the wheel':last?.label||'Ready for round one';
    resultDetail.textContent=cancelled?'Your game is saved in this session. Spin again when you’re ready.':complete?`You removed ${active.removed} options. Just one remains, so this game is finished.`:review?last.detail:active.phase==='idle'?'Good removes. Okay halves. Needs work adds. Finish with one slice left.':last?.detail||'Spin the wheel, complete the challenge, then ask the coach for a grade.';
    button.hidden=review;button.disabled=confirming;button.querySelector('.swlw-spin-label').textContent=complete?'Start a new game':active.phase==='idle'?'Start game':'Spin the wheel';
    grades.hidden=!review;goodButton.textContent=last?.kind==='exercise'?'Good · remove':'Done · remove';okayButton.textContent='Okay · halve';needsButton.textContent='Needs work · add';
    goodButton.disabled=okayButton.disabled=confirming;needsButton.disabled=confirming||active.entries.length>=MAX_OPTIONS;
    gradeHelp.textContent=active.entries.length>=MAX_OPTIONS?'24 options is the limit. Choose Good or Okay.':review&&state().entries.find(entry=>entry.id===active.pendingId)?.amount===1?'This is already one rep, second or round. Okay keeps it at the minimum.':'Halves are rounded up, with a minimum of one. Added challenges are short conditioning rounds.';
    newButton.hidden=active.phase==='idle'||complete;newButton.disabled=false;
    modeButtons.forEach(control=>{control.disabled=confirming;control.setAttribute('aria-pressed',String(control.dataset.mode===mode));});
    root.classList.remove('is-spinning');root.setAttribute('aria-busy','false');
    coachNote.hidden=!active.coachNext||complete;coachNote.textContent=`Coach joins the next ${mode==='crazy'?'Crazy Wheel':'conditioning'} exercise round.`;
    if(review){root.dataset.resultIndex=String(model().entries.findIndex(entry=>entry.id===active.pendingId));root.dataset.coachJoined=String(last.coachJoined);}else{delete root.dataset.resultIndex;delete root.dataset.coachJoined;}
  }
  function startGame(){if(currentSpin||confirming)return;const active=state();if(active.phase==='complete')resetGame();else if(active.phase==='idle'){active.phase='playing';showReady();}else if(active.phase==='playing')spin();}
  function resetGame(){progress[mode]=freshProgress(mode);state().phase='playing';confirming=false;confirmBox.hidden=true;renderWheel();showReady();button.focus?.({preventScroll:true});}
  function requestNewGame(){if(currentSpin)return;if(state().phase==='idle'||state().phase==='complete'){resetGame();return;}confirming=true;confirmBox.hidden=false;showReady();keepButton.focus?.({preventScroll:true});}
  function keepGame(restore=true){confirming=false;confirmBox.hidden=true;showReady();if(restore)newButton.focus?.({preventScroll:true});}
  function grade(value){
    const active=state();if(currentSpin||confirming||active.phase!=='grading')return;
    const entry=active.entries.find(item=>item.id===active.pendingId);if(!entry||!['good','okay','needs'].includes(value)||(value==='needs'&&active.entries.length>=MAX_OPTIONS))return;
    const wasJoined=active.lastResult.coachJoined;
    if(entry.kind==='coach-next')active.coachNext=true;else if(wasJoined)active.coachNext=false;
    let feedback;
    if(value==='good'){active.entries=active.entries.filter(item=>item.id!==entry.id);active.removed++;feedback='Removed from the wheel. Ready for the next round.';}
    else if(value==='okay'){const before=entry.amount;entry.amount=Math.max(1,Math.ceil(entry.amount/2));feedback=before===1?'Already at the minimum of one. This option stays on the wheel.':`This option stays, now ${label(entry)}.`;}
    else {const template=EXTRAS[active.serial%EXTRAS.length];active.serial++;const extra={...template,id:`${mode}-added-${active.serial}`,weight:mode==='normal'?1:template.weight};active.entries.push(extra);feedback=`Added ${label(extra)}. The landed option stays on the wheel.`;}
    active.lastResult={...active.lastResult,label:label(entry),detail:feedback};active.pendingId=null;active.phase=active.entries.length===1?'complete':'playing';if(active.phase==='complete')active.coachNext=false;
    if(value!=='okay')active.rotation=0;renderWheel();showReady();button.focus?.({preventScroll:true});
  }
  function changeMode(nextMode){if(currentSpin||confirming||!MODES[nextMode]||mode===nextMode)return;closeInspectorIfOpen();mode=nextMode;renderWheel();showReady();}
  function closeInspectorIfOpen(restore=true){if(inspector&&!inspector.hidden)closeInspector(restore);}
  function clearSpinListeners(){clearTimeout(finishTimer);finishTimer=null;if(tickFrame!==null)window.cancelAnimationFrame?.(tickFrame);tickFrame=null;if(pointer)pointer.style.transform='';if(transitionHandler&&rotor)rotor.removeEventListener('transitionend',transitionHandler);transitionHandler=null;}
  function trackSpin(token){
    if(typeof window.requestAnimationFrame!=='function')return;
    const frame=()=>{const spin=currentSpin;if(!spin||spin.token!==token)return;tickFrame=null;if(!root?.isConnected||document.hidden){deactivate();return;}if(motionOff()){finishSpin(token);return;}
      const now=performance.now(),fraction=Math.min(1,(now-spin.started)/spin.duration),angle=spin.from+(spin.target-spin.from)*easedProgress(fraction),sector=crossedDividers(angle,spin.wheel);
      if(sector!==spin.lastSector){spin.lastSector=sector;if(now-spin.lastTick>=40){spin.lastTick=now;sound('wheel-tick');}}
      const age=now-spin.lastTick,kick=age<120?-14*Math.sin(Math.PI*age/120)*Math.exp(-age/70):0;pointer.style.transform=`translateX(-50%) rotate(${kick}deg)`;
      if(fraction>=1){finishSpin(token);return;}tickFrame=window.requestAnimationFrame(frame);};tickFrame=window.requestAnimationFrame(frame);
  }
  function finishSpin(token){
    if(!currentSpin||currentSpin.token!==token||!root)return;
    const spin=currentSpin,active=state();clearSpinListeners();currentSpin=null;active.rotation=normalize(spin.target);rotor.style.transition='none';rotor.style.transform=`rotate(${active.rotation}deg)`;
    const index=pointerIndex(active.rotation,spin.wheel),entry=spin.wheel.entries[index],joined=active.coachNext&&entry.kind==='exercise';
    active.round++;active.pendingId=entry.id;active.phase='grading';
    active.lastResult={id:entry.id,label:label(entry),kind:entry.kind,detail:`${joined?'Coach joins in! ':''}${entry.detail||'Complete this round, then let your coach choose a grade.'}`,coachJoined:joined,jackpot:entry.kind==='coach-jackpot'||entry.kind==='free-time'};
    showReady();sound('wheel-finish');
  }
  function spin(){
    if(!root||currentSpin||confirming||state().phase!=='playing'||!root.isConnected)return;
    closeInspectorIfOpen();const active=state(),wheel=model(),crazy=mode==='crazy',chosen=chooseSegment(wheel,random(),active.coachNext),landing=normalize(-chosen.center+(random()-.5)*chosen.span*.4),quiet=motionOff();
    const duration=quiet?220:(crazy?4200:4050)+Math.floor(random()*(crazy?400:420)),target=active.rotation+360*((crazy?12:5)+Math.floor(random()*(crazy?4:2)))+normalize(landing-active.rotation),token=++generation;
    currentSpin={token,wheel,from:active.rotation,target,started:performance.now(),duration,lastSector:crossedDividers(active.rotation,wheel),lastTick:-Infinity};
    button.disabled=true;newButton.disabled=true;modeButtons.forEach(control=>{control.disabled=true;});button.querySelector('.swlw-spin-label').textContent='Spinning…';
    result.classList.remove('has-result');result.classList.remove('is-jackpot');root.classList.remove('has-result');rotor.classList.remove('has-landed');
    rotor.querySelectorAll('.swlw-segment').forEach(segment=>{segment.classList.remove('is-selected');segment.setAttribute('tabindex','-1');segment.setAttribute('aria-disabled','true');});
    resultLabel.textContent=`ROUND ${active.round+1}`;resultTitle.textContent=quiet?'Choosing your round…':crazy?'Here comes the chaos…':'Around it goes…';resultDetail.textContent=active.coachNext?'Your coach is joining the next exercise.':'The pointer will pick your challenge.';
    root.setAttribute('aria-busy','true');root.classList.toggle('is-spinning',!quiet);rotor.style.transition='none';rotor.style.transform=`rotate(${active.rotation}deg)`;rotor.getBoundingClientRect();
    rotor.style.transition=quiet?'none':`transform ${duration}ms cubic-bezier(.12,.72,.12,1)`;rotor.style.transform=`rotate(${quiet?landing:target}deg)`;
    if(!quiet){transitionHandler=event=>{if(event.target===rotor&&event.propertyName==='transform'&&performance.now()-currentSpin?.started>=duration-80)finishSpin(token);};rotor.addEventListener('transitionend',transitionHandler);sound('wheel-start');trackSpin(token);}
    finishTimer=setTimeout(()=>finishSpin(token),quiet?duration:duration+160);
  }
  function deactivate(){closeInspectorIfOpen(false);if(confirming)keepGame(false);if(!root||!currentSpin)return;generation++;currentSpin=null;clearSpinListeners();rotor.style.transition='none';rotor.style.transform=`rotate(${state().rotation}deg)`;showReady(true);}
  function motionChanged(){if(currentSpin&&motionOff())finishSpin(currentSpin.token);}
  function visibilityChanged(){if(document.hidden)deactivate();}
  function destroy(){deactivate();clearSpinListeners();observer?.disconnect();observer=null;media?.removeEventListener?.('change',motionChanged);document.removeEventListener('visibilitychange',visibilityChanged);root?.remove();host=root=rotor=pointer=button=result=null;modeButtons=[];callbacks={};progress={normal:freshProgress('normal'),crazy:freshProgress('crazy')};mode='normal';confirming=false;inspector=null;}
  function mount(container,options={}){
    if(!container||typeof container.append!=='function')throw TypeError('SWLWheel.mount requires a container.');if(host===container&&root?.isConnected){callbacks=options;motionChanged();return;}destroy();host=container;callbacks=options;
    root=make('section','swlw-game');const heading=make('header','swlw-heading'),headingCopy=make('div','swlw-heading-copy');headingTitle=make('h2','swlw-title');headingCopy.append(make('p','swlw-eyebrow','SWL GAMES · FREE PLAY'),headingTitle,make('p','swlw-intro','Tap a slice to explore it. Play until just one remains.'));
    const headingTools=make('div','swlw-heading-tools');count=make('span','swlw-round-count');const modeGroup=make('div','swlw-modes');modeGroup.setAttribute('role','group');modeGroup.setAttribute('aria-label','Wheel mode');
    modeButtons=Object.keys(MODES).map(key=>{const control=make('button','swlw-mode',key==='normal'?'Conditioning':'Crazy wheel');control.type='button';control.dataset.mode=key;control.setAttribute('aria-label',MODES[key].title);control.addEventListener('click',()=>changeMode(key));return control;});modeGroup.append(...modeButtons);headingTools.append(count,modeGroup);heading.append(headingCopy,headingTools);
    const layout=make('div','swlw-layout'),stage=make('div','swlw-stage');pointer=make('div','swlw-pointer');pointer.setAttribute('aria-hidden','true');const shell=make('div','swlw-shell');rotor=make('div','swlw-rotor');
    const hub=make('div','swlw-hub');hub.setAttribute('aria-hidden','true');const logo=make('img','swlw-hub-logo');logo.src='./swl-logo.png';logo.alt='';hub.append(logo,make('span','swlw-hub-caption','LET’S GO'));shell.append(rotor,hub);stage.append(pointer,shell);
    const controls=make('div','swlw-controls');result=make('div','swlw-result');result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.setAttribute('aria-atomic','true');resultLabel=make('p','swlw-result-label');resultTitle=make('h3','swlw-result-title');resultDetail=make('p','swlw-result-detail');result.append(resultLabel,resultTitle,resultDetail);coachNote=make('p','swlw-coach-note');
    button=make('button','swlw-spin');button.type='button';button.append(make('span','swlw-spin-label'));const arrow=make('span','swlw-spin-icon','↻');arrow.setAttribute('aria-hidden','true');button.append(arrow);button.addEventListener('click',startGame);
    grades=make('div','swlw-grading');const gradeButtons=make('div','swlw-grade-buttons');gradeButtons.setAttribute('role','group');gradeButtons.setAttribute('aria-label','Coach grades this round');
    const gradeButton=(value,text)=>{const control=make('button',`swlw-grade swlw-grade-${value}`,text);control.type='button';control.dataset.grade=value;control.addEventListener('click',()=>grade(value));return control;};goodButton=gradeButton('good','Good · remove');okayButton=gradeButton('okay','Okay · halve');needsButton=gradeButton('needs','Needs work · add');gradeButtons.append(goodButton,okayButton,needsButton);gradeHelp=make('p','swlw-grade-help');grades.append(gradeButtons,gradeHelp);
    newButton=make('button','swlw-new-game','New game');newButton.type='button';newButton.addEventListener('click',requestNewGame);
    confirmBox=make('div','swlw-confirm');confirmBox.hidden=true;confirmBox.setAttribute('role','group');confirmBox.setAttribute('aria-label','Confirm new game');confirmBox.append(make('p','','Start a new game? This clears only this wheel’s current progress.'));const confirmButtons=make('div','swlw-confirm-buttons');keepButton=make('button','swlw-keep-game','Keep playing');keepButton.type='button';keepButton.addEventListener('click',keepGame);const restart=make('button','swlw-restart','Start new game');restart.type='button';restart.addEventListener('click',()=>{if(confirming)resetGame();});confirmButtons.append(keepButton,restart);confirmBox.append(confirmButtons);confirmBox.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();keepGame();}});
    const list=make('details','swlw-options');list.append(make('summary','','Explore every option'));choices=make('ul','swlw-options-list');list.append(choices);
    controls.append(result,grades,coachNote,button,confirmBox,newButton,make('p','swlw-freeplay','Free play · no league points'),list);layout.append(stage,controls);
    inspector=make('dialog','swlw-inspector');inspector.hidden=true;inspector.setAttribute('aria-labelledby','swlw-inspector-title');inspectorTitle=make('h3','swlw-inspector-title');inspectorTitle.id='swlw-inspector-title';inspectorDetail=make('p','swlw-inspector-detail');inspectorQuantity=make('p','swlw-inspector-quantity');const close=make('button','swlw-inspector-close','Got it');close.type='button';close.addEventListener('click',closeInspector);inspector.append(make('p','swlw-eyebrow','ON THE WHEEL'),inspectorTitle,inspectorDetail,inspectorQuantity,close);inspector.addEventListener('cancel',event=>{event.preventDefault();closeInspector();});inspector.addEventListener('click',event=>{if(event.target===inspector)closeInspector();});
    root.append(heading,layout,inspector);container.append(root);renderWheel();showReady();media?.addEventListener?.('change',motionChanged);document.addEventListener('visibilitychange',visibilityChanged);if(window.MutationObserver&&document.body){observer=new window.MutationObserver(motionChanged);observer.observe(document.body,{attributes:true,attributeFilter:['class']});}
  }
  window.SWLWheel=Object.freeze({version:3,mount,deactivate,destroy});
})();
