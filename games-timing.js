(() => {
  'use strict';
  const COLORS=['#d5fa70','#bd9bff','#ffd782'],NAMES=['Mint','Purple','Gold'];
  const TASKS=[
    {id:'burpees',name:'5 burpees',cue:'Five controlled burpees, using the version your coach has chosen.'},
    {id:'pressups',name:'5 press-ups',cue:'Five press-ups with the same coach-approved version for everyone.'},
    {id:'jumpingjacks',name:'10 jumping jacks',cue:'Ten clear jumping jacks. Open, close, and keep the movement controlled.'},
    {id:'vsits',name:'5 V sits',cue:'Five controlled V sits, using the familiar version your coach approves.'}
  ];
  const INFO={
    handstand:{name:'Handstand Timer',title:'Every second counts.',intro:'Time one gymnast at a time, or bring the whole team up together. Every confirmed second builds your total.',tag:'HIGHEST TOTAL WINS',unit:'s',rules:['Give every gymnast one timed attempt. Teams take turns; completed teams are skipped.','Coach starts and stops the clock. Review the time before confirming it.','Pro adds a judgement: Fell over makes the attempt zero, or Extra neat adds one second.','The highest total number of seconds wins. A larger team has more attempts.']},
    relayrace:{name:'Conditioning Relay',title:'Pass the effort on.',intro:'One shared task. One continuous team clock. Every gymnast takes a lap.',tag:'LOWEST AVERAGE WINS',unit:'s',rules:['Choose one task for every team. Each gymnast completes it once.','Start the team clock. Tap Next gymnast at each changeover, then Finish for the final gymnast.','Review the splits. Add two seconds for each missed repetition, then submit the team time.','Lowest adjusted seconds per gymnast wins. Teams of different sizes can compete fairly.']},
    timesense:{name:'Time Sense',title:'Feel the seconds.',intro:'Find a familiar balance. Trust your timing. How close can you get?',tag:'HIGHEST AVERAGE WINS',unit:'pts',rules:['Each gymnast gets a target of 8–15 seconds and one attempt.','Choose a familiar balance with your coach. Go hides the clock; tell the coach when to stop.','Start with 10 points and subtract the error in seconds, to one decimal place. Balance lost scores zero.','Highest average points per gymnast wins. Everyone has exactly one turn.']}
  };
  let sequence=0;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const node=(tag,cls='',text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const nameOf=value=>Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim()).slice(0,24).join('');
  const validSize=value=>String(value).trim()&&Number.isInteger(Number(value))&&Number(value)>=1&&Number(value)<=20?Number(value):null;
  function random(max){try{const x=new Uint32Array(1);window.crypto.getRandomValues(x);return x[0]%max;}catch(_){return Math.floor(Math.random()*max);}}
  function sessionId(kind){try{return kind+'-'+window.crypto.randomUUID();}catch(_){return kind+'-'+Date.now().toString(36)+'-'+(++sequence)+'-'+random(0x10000000).toString(36);}}
  function createGame(kind){
    const info=INFO[kind],isRelay=kind==='relayrace',isSense=kind==='timesense',factor=isSense?10:100;
    let host=null,root=null,options={},active=false,destroyed=true,view=0,timer=null,timerToken=0;
    let clockNode=null,lapNode=null,state=null,confirming='',error='',undoRecord=null,lastLapAt=-Infinity;
    let names=NAMES.slice(),sizes=['5','5','5'],count=2,mode='normal',format='individual',rounds=2,taskId='burpees',previousTarget=0;
    const fresh=()=>({phase:'setup',teams:[],order:[],turn:0,elapsedMs:0,runningSince:0,laps:[],penalty:0,fell:false,neat:false,balanceLost:false,target:0,results:[],sessionId:null,notified:false,message:''});
    const canAct=()=>active&&!destroyed&&!document.hidden&&Boolean(root?.isConnected);
    const teamIndex=()=>state?.order[state.turn]??0;
    const currentTeam=()=>state?.teams[teamIndex()];
    const isGroup=()=>kind==='handstand'&&format==='group';
    const groupRound=()=>undoRecord&&['confirmed','finished'].includes(state.phase)?undoRecord.round:(currentTeam()?.turns??0)+1;
    const gymnastIndex=()=>isRelay?state.laps.length:undoRecord&&['confirmed','finished'].includes(state.phase)?undoRecord.gymnast-1:currentTeam()?.turns??0;
    const elapsed=()=>state.elapsedMs+(state.phase==='running'?Math.max(0,performance.now()-state.runningSince):0);
    const seconds=value=>(Math.round(value/10)/100).toFixed(2);
    const scoreText=units=>(units/factor).toFixed(isSense?1:2);
    function motionOff(){try{return Boolean(typeof options.motionOff==='function'?options.motionOff():options.motionOff)||Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)||Boolean(document.body?.classList?.contains('no-motion'));}catch(_){return true;}}
    function sound(payload){if(!canAct())return;try{options.playSound?.(payload);}catch(_) {}}
    function stopTick(){timerToken++;if(timer!==null)clearTimeout(timer);timer=null;}
    function paintClock(){if(clockNode)clockNode.textContent=seconds(elapsed());if(lapNode)lapNode.textContent=seconds(Math.max(0,elapsed()-state.laps.reduce((a,b)=>a+b,0)));}
    function tick(){
      stopTick();const token=timerToken;
      const update=()=>{timer=null;if(token!==timerToken||destroyed||state?.phase!=='running')return;if(!canAct()){pause();return;}paintClock();timer=setTimeout(update,50);};
      update();
    }
    function pause(){if(state?.phase!=='running')return;state.elapsedMs=elapsed();state.runningSince=0;state.phase='paused';stopTick();state.message='Clock paused. Resume when everyone is ready, or discard this attempt.';if(isRelay)state.message='Team clock paused. Resume from this exact time, or redo this team.';render();}
    function drawTarget(){let value=8+random(8);if(value===previousTarget)value=8+(value-7)%8;previousTarget=value;return value;}
    function clearAttempt(){state.elapsedMs=0;state.runningSince=0;state.laps=[];state.penalty=0;state.fell=false;state.neat=false;state.balanceLost=false;state.phase='ready';undoRecord=null;lastLapAt=-Infinity;if(isSense)state.target=drawTarget();state.message=isGroup()?(currentTeam().remaining===1?'The last gymnast goes now. Stop when they come down.':`${currentTeam().remaining} gymnasts go together. Stop when the last gymnast comes down.`):isRelay?'Everyone ready? The clock stays running through every changeover.':'Next gymnast up. Coach starts and stops the clock.';}
    function start(replay=false){
      if(replay?state.phase!=='finished':state.phase!=='setup')return;
      const chosen=names.slice(0,count).map((value,index)=>nameOf(value)||NAMES[index]),numbers=sizes.slice(0,count).map(validSize);
      if(numbers.some(value=>value===null)){error='Enter a whole number from 1 to 20 gymnasts for each team.';render();return;}
      if(new Set(chosen.map(value=>value.toLocaleLowerCase())).size!==count){error='Give each team a different name so every score is clear.';render();return;}
      chosen.forEach((value,index)=>{names[index]=value;sizes[index]=String(numbers[index]);});
      stopTick();state=fresh();state.sessionId=sessionId(kind);state.teams=chosen.map((name,index)=>({name,color:COLORS[index],size:numbers[index],totalUnits:0,turns:0,...(isGroup()?{remaining:numbers[index],roundLimit:Math.min(rounds,numbers[index])}:{})}));
      state.order=isRelay?chosen.map((_,index)=>index):Array.from({length:isGroup()?Math.min(rounds,Math.max(...numbers)):Math.max(...numbers)},(_,turn)=>numbers.flatMap((size,index)=>turn<size?[index]:[])).flat();
      confirming='';error='';clearAttempt();render({focus:'go'});
    }
    function go(){if(state.phase!=='ready')return;state.phase='running';state.runningSince=performance.now();state.message=isGroup()?'Everyone up together. Stop only when the LAST gymnast comes down.':isSense?'The clock is hidden. Say stop when you feel your target has passed.':isRelay?'Clock running. Tap at each changeover.':'Clock running. Coach taps Stop at the end of the hold.';render({focus:isRelay?(currentTeam().size===1?'finish':'lap'):'stop'});tick();if(!isSense)sound({kind:'wheel-tick'});}
    function resume(){if(state.phase!=='paused')return;state.runningSince=performance.now();state.phase='running';state.message=isSense?'Timing resumed. The clock stays hidden.':'Timing resumed from the paused time.';render({focus:isRelay?(state.laps.length===currentTeam().size-1?'finish':'lap'):'stop'});tick();}
    function stop(){if(state.phase!=='running'||isRelay)return;state.elapsedMs=elapsed();state.runningSince=0;state.phase='review';stopTick();state.message=isGroup()?'Confirm this time. The last gymnast down will sit out their team’s remaining rounds.':'Review this attempt, then confirm to add it to the team score.';render({focus:'confirm'});sound({kind:'timer-end'});}
    function recordLap(finish){
      if(!isRelay||state.phase!=='running'||finish!==(state.laps.length===currentTeam().size-1)||performance.now()-lastLapAt<350)return;
      lastLapAt=performance.now();
      const current=elapsed(),previous=state.laps.reduce((sum,lap)=>sum+lap,0);state.laps.push(Math.max(0,current-previous));
      if(finish){state.elapsedMs=current;state.runningSince=0;state.phase='review';stopTick();state.message='All gymnasts complete. Check the splits and missed repetitions before submitting.';render({focus:'confirm'});sound({kind:'timer-end'});}
      else {state.message=`Gymnast ${state.laps.length} complete. Gymnast ${state.laps.length+1} goes now; the clock is still running.`;render({focus:state.laps.length===currentTeam().size-1?'finish':'lap'});sound({kind:'wheel-tick'});}
    }
    function draftUnits(){
      if(isSense)return state.balanceLost?0:Math.max(0,Math.round((10-Math.abs(state.elapsedMs/1000-state.target))*10));
      if(isRelay)return Math.round(state.elapsedMs/10)+state.penalty*200;
      if(isGroup())return Math.round(state.elapsedMs/10);
      return state.fell?0:Math.round(state.elapsedMs/10)+(mode==='pro'&&state.neat?100:0);
    }
    function toggle(action){
      if(state.phase!=='review')return;
      if(action==='fell'&&kind==='handstand'&&!isGroup()&&mode==='pro'){state.fell=!state.fell;if(state.fell)state.neat=false;}
      else if(action==='neat'&&kind==='handstand'&&!isGroup()&&mode==='pro'){state.neat=!state.neat;if(state.neat)state.fell=false;}
      else if(action==='balance-lost'&&isSense)state.balanceLost=!state.balanceLost;
      else return;
      state.message=`Ready to confirm ${scoreText(draftUnits())} ${info.unit}.`;render({focus:action});
    }
    function adjustPenalty(delta){if(!isRelay||state.phase!=='review')return;state.penalty=Math.min(20,Math.max(0,state.penalty+delta));state.message=`${state.penalty} missed repetitions: ${state.penalty*2} seconds added.`;render({focus:delta>0?'penalty-plus':'penalty-minus'});}
    function complete(){if(state.notified)return;state.notified=true;const event={gameId:kind,sessionId:state.sessionId,participantCount:state.teams.reduce((sum,team)=>sum+team.size,0)};try{options.onComplete?.(event);}catch(_) {}}
    function confirm(){
      if(state.phase!=='review')return;
      const team=teamIndex(),units=draftUnits(),participants=isGroup()?currentTeam().remaining:isRelay?currentTeam().size:1,turnIncrement=isGroup()?1:participants;
      const record={team,gymnast:currentTeam().turns+1,units,elapsedMs:state.elapsedMs,target:state.target,penalty:state.penalty,laps:state.laps.slice(),fell:state.fell,neat:state.neat,balanceLost:state.balanceLost,participants,turnIncrement,...(isGroup()?{round:groupRound(),remainingBefore:currentTeam().remaining,remainingAfter:currentTeam().remaining-1}:{})};
      state.results.push(record);undoRecord=record;state.teams[team].totalUnits+=units;state.teams[team].turns+=turnIncrement;if(isGroup())state.teams[team].remaining--;
      state.phase=state.turn===state.order.length-1?'finished':'confirmed';state.message=`${state.teams[team].name}: ${scoreText(units)} ${info.unit} confirmed.`+(isGroup()?` Last gymnast sits out. ${state.teams[team].remaining} remaining.`:'');
      render({focus:state.phase==='finished'?'replay':'next'});sound({kind:state.phase==='finished'?'finish':'award'});if(state.phase==='finished')complete();
    }
    function undo(){if(!undoRecord||!['confirmed','finished'].includes(state.phase)||isRelay)return;const record=undoRecord;state.teams[record.team].totalUnits-=record.units;state.teams[record.team].turns-=record.turnIncrement;if(isGroup())state.teams[record.team].remaining=record.remainingBefore;state.results.pop();undoRecord=null;state.phase='review';state.message=isGroup()?'Last time undone. The last gymnast is back in. Review this same round and confirm again.':'Last score undone. Review the same attempt and confirm again.';render({focus:'confirm'});}
    function next(){if(state.phase!=='confirmed')return;state.turn++;clearAttempt();render({focus:'go'});}
    function discard(){if(!['paused','review'].includes(state.phase)||isRelay)return;const target=state.target;clearAttempt();state.target=target;state.message=isGroup()?'Round discarded. The same gymnasts can start again; nobody has been sat out.':'Attempt discarded. The same gymnast can start again.';render({focus:'go'});}
    function ask(action){if(state.phase==='setup'||confirming)return;if(action==='redo'&&!isRelay)return;pause();confirming=action;render({focus:'cancel-dialog'});}
    function acceptDialog(){
      const action=confirming;if(!action)return;confirming='';stopTick();
      if(action==='reset'){state=fresh();undoRecord=null;error='';render({focus:'start'});return;}
      if(action==='redo'){
        if(undoRecord&&['confirmed','finished'].includes(state.phase)){const last=undoRecord;state.teams[last.team].totalUnits-=last.units;state.teams[last.team].turns-=last.participants;state.results.pop();}
        clearAttempt();state.message='Team attempt cleared. Start a fresh relay for this team.';render({focus:'go'});
      }
    }
    function perform(action){
      if(!canAct())return;
      if(action==='cancel-dialog'){if(confirming){confirming='';render({focus:state.phase==='paused'?'resume':'reset'});}return;}
      if(action==='confirm-dialog'){acceptDialog();return;}if(confirming)return;
      if(action==='start')start();else if(action==='replay')start(true);else if(action==='go')go();else if(action==='stop')stop();else if(action==='resume')resume();else if(action==='pause')pause();else if(action==='lap')recordLap(false);else if(action==='finish')recordLap(true);else if(action==='confirm')confirm();else if(action==='undo')undo();else if(action==='next')next();else if(action==='discard')discard();else if(action==='reset'||action==='redo')ask(action);else if(action==='penalty-plus')adjustPenalty(1);else if(action==='penalty-minus')adjustPenalty(-1);else if(['fell','neat','balance-lost'].includes(action))toggle(action);
      else if(/^count-[23]$/.test(action)&&state.phase==='setup'){count=Number(action.slice(-1));error='';render({focus:action});}
      else if(['mode-normal','mode-pro'].includes(action)&&state.phase==='setup'){mode=action.slice(5);render({focus:action});}
      else if(['format-individual','format-group'].includes(action)&&kind==='handstand'&&state.phase==='setup'){format=action.slice(7);error='';render({focus:action});}
      else if(['rounds-minus','rounds-plus'].includes(action)&&isGroup()&&state.phase==='setup'){rounds=Math.min(10,Math.max(1,rounds+(action==='rounds-plus'?1:-1)));render({focus:rounds===1?'rounds-plus':rounds===10?'rounds-minus':action});}
      else if(action.startsWith('task-')&&state.phase==='setup'&&TASKS.some(task=>task.id===action.slice(5))){taskId=action.slice(5);render({focus:action});}
    }
    function button(action,text,style='secondary',disabled=false){const el=node('button','swlt-button swlt-'+style,text),generation=view;el.type='button';el.dataset.timingAction=action;el.disabled=disabled||!active;el.addEventListener('click',()=>{if(generation===view&&!el.disabled)perform(action);});return el;}
    function choice(action,text,pressed){const el=button(action,text);el.setAttribute('aria-pressed',String(pressed));return el;}
    function header(){const el=node('header','swlt-header'),copy=node('div');copy.append(node('p','swlt-kicker','SWL GAMES · '+info.name.toUpperCase()),node('h2','',info.title),node('p','swlt-intro',info.intro));el.append(copy,node('span','swlt-tag',info.tag));return el;}
    function setup(){
      const layout=node('div','swlt-setup'),form=node('section','swlt-panel'),rules=node('aside','swlt-rules');form.append(node('p','swlt-kicker','BUILD YOUR TEAMS'),node('h3','','Two or three. Everyone gets a turn.'));
      if(kind==='handstand'){
        const formats=node('div','swlt-formats');formats.setAttribute('aria-label','Handstand timing format');const individual=choice('format-individual','Individual',format==='individual'),group=choice('format-group','Group',format==='group');individual.append(node('small','','One gymnast at a time'));group.append(node('small','','Whole team together'));formats.append(individual,group);form.append(formats);
      }
      const counts=node('div','swlt-options');counts.setAttribute('aria-label','Number of teams');counts.append(choice('count-2','2 teams',count===2),choice('count-3','3 teams',count===3));form.append(counts);
      const rows=node('div','swlt-team-inputs');for(let index=0;index<count;index++){
        const row=node('div','swlt-team-input');row.style.setProperty('--timing-color',COLORS[index]);
        const nameLabel=node('label','',`Team ${index+1}`),input=node('input');input.type='text';input.value=names[index];input.maxLength=24;input.autocomplete='off';input.dataset.timingName=String(index);input.setAttribute('aria-label',`Team ${index+1} name`);
        const sizeLabel=node('label','','Gymnasts'),size=node('input');size.type='number';size.min='1';size.max='20';size.step='1';size.inputMode='numeric';size.value=sizes[index];size.dataset.timingSize=String(index);size.setAttribute('aria-label',`Number of gymnasts in team ${index+1}`);
        const generation=view;input.addEventListener('input',()=>{if(canAct()&&generation===view)names[index]=input.value;});size.addEventListener('input',()=>{if(canAct()&&generation===view)sizes[index]=size.value;});nameLabel.append(input);sizeLabel.append(size);row.append(nameLabel,sizeLabel);rows.append(row);
      }form.append(rows,node('p','swlt-muted','1–20 gymnasts per team · no individual names needed'));
      if(kind==='handstand'&&!isGroup()){const modes=node('div','swlt-options');modes.setAttribute('aria-label','Handstand mode');modes.append(choice('mode-normal','Normal · time only',mode==='normal'),choice('mode-pro','Pro · time + judgement',mode==='pro'));form.append(node('h4','','Choose your challenge'),modes,node('p','swlt-muted',mode==='pro'?'Pro: Fell over = zero, or Extra neat = +1 second.':'Normal: every confirmed second counts.'));}
      if(isGroup()){
        const picker=node('div','swlt-round-picker'),value=node('div');value.append(node('strong','',String(rounds)),node('span','',rounds===1?'round per team':'rounds per team'));value.setAttribute('aria-live','polite');const minus=button('rounds-minus','−','secondary',rounds===1),plus=button('rounds-plus','+','secondary',rounds===10);minus.setAttribute('aria-label','One fewer group round');plus.setAttribute('aria-label','One more group round');picker.append(minus,value,plus);form.append(node('h4','','How many rounds?'),picker,node('p','swlt-muted',`Up to ${rounds} ${rounds===1?'round':'rounds'} each. A team finishes earlier when nobody remains. Everyone starts the first round.`));
      }
      if(isRelay){const tasks=node('div','swlt-tasks');TASKS.forEach(task=>tasks.append(choice('task-'+task.id,task.name,taskId===task.id)));form.append(node('h4','','One task for all teams'),tasks);}
      const issue=node('p','swlt-error',error);issue.setAttribute('role','alert');form.append(issue,button('start','Get teams ready ↗','primary'));
      rules.append(node('div','swlt-rule-mark',isSense?'≈':isRelay?'→ → →':'00.00'),node('h3','',info.tag.toLowerCase().replace(/^./,c=>c.toUpperCase())));const list=node('ol'),instructions=isGroup()?['All remaining gymnasts in one team start their handstands together. Teams take turns.','Stop when the LAST gymnast comes down. Confirm the time, then that gymnast sits out their team’s later rounds.','The coach remembers who is sitting out. Each later round starts with one fewer gymnast. Empty teams are skipped.','Play the selected rounds, or until nobody remains. Add each round’s time: highest combined seconds wins.']:info.rules;instructions.forEach(text=>list.append(node('li','',text)));rules.append(list,node('p','swlt-coach-note',isRelay?'Coach chooses familiar versions and checks every changeover.':isGroup()?'Give everyone enough space. Use familiar, coach-approved handstands. Coach controls the clock and keeps track of who is sitting out.':'Use a familiar, coach-approved skill or shape. Coach controls the timer and the result.'));layout.append(form,rules);return layout;
    }
    function scoreboard(){const board=node('div','swlt-scoreboard');board.style.setProperty('--timing-teams',String(state.teams.length));state.teams.forEach((team,index)=>{
      const card=node('div','swlt-score');card.style.setProperty('--timing-color',team.color);card.dataset.current=String(state.phase!=='finished'&&teamIndex()===index);card.append(node('span','swlt-score-name',team.name));
      const value=node('strong','',kind==='handstand'?scoreText(team.totalUnits):team.turns?(team.totalUnits/factor/team.turns).toFixed(isSense?1:2):'—');value.append(node('small','',isSense?' pts / gymnast':kind==='handstand'?' s total':' s / gymnast'));card.append(value,node('small','',isGroup()?`${team.turns} / ${team.roundLimit} rounds complete`:`${team.turns} / ${team.size} gymnasts complete`));
      if(isGroup())card.append(node('span','swlt-remaining',`${team.remaining} of ${team.size} still in`));
      if(kind!=='handstand')card.append(node('span','swlt-score-total',`${scoreText(team.totalUnits)} ${info.unit} total`));board.append(card);
    });return board;}
    function turnHeading(stage){const team=currentTeam(),title=node('div','swlt-turn-heading'),copy=node('div');copy.append(node('p','swlt-kicker',isGroup()?`GROUP · ROUND ${groupRound()} / ${team.roundLimit}`:isRelay?'TEAM RELAY':`TURN ${state.turn+1} / ${state.order.length}`),node('h3','',team.name));title.append(copy,node('span','swlt-turn-number',isGroup()?`${team.remaining} ${team.remaining===1?'gymnast':'gymnasts'} still in`:`Gymnast ${Math.min(gymnastIndex()+1,team.size)} of ${team.size}`));stage.append(title);}
    function clock(stage){
      const face=node('div','swlt-clock');face.dataset.hidden=String(isSense&&['running','paused'].includes(state.phase));
      if(isSense){const target=node('div','swlt-target',String(state.target));target.append(node('small','',' seconds'));face.append(node('p','swlt-clock-label',state.phase==='ready'?'YOUR TARGET':'TARGET TIME'),target);
        if(['running','paused'].includes(state.phase)){face.append(node('div','swlt-hidden-clock','?'),node('p','swlt-clock-caption',state.phase==='paused'?'Clock paused. Keep the target in mind.':'Clock hidden. Feel the seconds, then say stop.'));}
        else if(state.phase==='ready')face.append(node('p','swlt-clock-caption','Choose a familiar balance. The clock disappears when you press Go.'));
      } else {
        face.append(node('p','swlt-clock-label',state.phase==='paused'?'PAUSED':isGroup()?'LAST GYMNAST TIME':isRelay?'TEAM TIME':'HOLD TIME'));clockNode=node('div','swlt-clock-digits',seconds(elapsed()));clockNode.setAttribute('aria-label','Elapsed seconds');face.append(clockNode,node('span','swlt-clock-caption','seconds'));
        if(isRelay&&['running','paused'].includes(state.phase)){const lap=node('p','swlt-lap-clock','This gymnast: ');lapNode=node('b','',seconds(Math.max(0,elapsed()-state.laps.reduce((sum,n)=>sum+n,0))));lap.append(lapNode,node('span','',' s'));face.append(lap);}
      }stage.append(face);
    }
    function review(stage){
      const units=draftUnits(),box=node('div','swlt-review');box.append(node('p','swlt-kicker','CHECK BEFORE CONFIRMING'));
      if(isSense){const comparison=node('div','swlt-comparison'),difference=state.elapsedMs/1000-state.target;comparison.append(stat('Target',state.target+' s'),stat('Actual',seconds(state.elapsedMs)+' s'),stat(difference<0?'Early by':'Late by',Math.abs(difference).toFixed(2)+' s'));box.append(comparison,choice('balance-lost','Balance lost · score 0',state.balanceLost));}
      else if(kind==='handstand'&&!isGroup()&&mode==='pro'){const controls=node('div','swlt-options');controls.append(choice('fell','Fell over · score 0',state.fell),choice('neat','Extra neat · +1 second',state.neat));box.append(controls,node('p','swlt-muted','Choose either judgement, or leave both off for the measured time.'));}
      else if(isRelay){const penalty=node('div','swlt-penalty'),countLabel=node('div');countLabel.append(node('strong','',String(state.penalty)),node('span','','missed reps · +'+state.penalty*2+' s'));penalty.append(button('penalty-minus','−','secondary',state.penalty===0),countLabel,button('penalty-plus','+','secondary',state.penalty===20));penalty.children[0].setAttribute('aria-label','Remove one missed repetition');penalty.children[2].setAttribute('aria-label','Add one missed repetition');box.append(node('h4','','Any missed repetitions?'),penalty,node('p','swlt-muted','Add 2 seconds for each missed repetition, up to 20.'));}
      const result=node('div','swlt-draft');result.append(node('span','',isGroup()?'THIS GROUP ROUND':isRelay?'ADJUSTED TEAM TIME':'THIS ATTEMPT'),node('strong','',scoreText(units)),node('small','',info.unit));box.append(result);
      if(isGroup())box.append(node('p','swlt-group-reminder',`The last gymnast down sits out. ${currentTeam().remaining-1} will remain after confirming.`));
      if(isRelay)box.append(node('p','swlt-average',`${(units/100/currentTeam().size).toFixed(2)} seconds per gymnast`));
      box.append(button('confirm',isGroup()?'Confirm time · sit out 1 ↗':isRelay?'Submit team time ↗':isSense?'Confirm points ↗':'Confirm time ↗','primary'));stage.append(box);
    }
    function stat(label,value){const el=node('div');el.append(node('span','',label),node('strong','',value));return el;}
    function splits(stage){if(!isRelay||!state.laps.length)return;const wrap=node('div','swlt-splits');wrap.append(node('h4','','Lap times'));const list=node('ol');state.laps.forEach((lap,index)=>{const row=node('li');row.append(node('span','',`Gymnast ${index+1}`),node('strong','',seconds(lap)+' s'));list.append(row);});wrap.append(list);stage.append(wrap);}
    function stage(){
      const el=node('section','swlt-stage');el.style.setProperty('--timing-color',currentTeam().color);turnHeading(el);
      if(isGroup()&&state.phase!=='confirmed'){const cue=node('div','swlt-group-cue');cue.append(node('strong','',currentTeam().remaining===1?'Last gymnast’s turn':`${currentTeam().remaining} gymnasts start together`),node('p','','Stop when the last gymnast comes down. After confirming, that gymnast sits out the remaining rounds.'));el.append(cue);}
      if(isRelay){const task=TASKS.find(task=>task.id===taskId);const card=node('div','swlt-task');card.append(node('b','',task.name),node('p','',task.cue));el.append(card);}
      if(state.phase==='confirmed'){
        const summary=node('div','swlt-confirmed');summary.append(node('span','swlt-check','✓'),node('p','swlt-kicker','SCORE CONFIRMED'),node('strong','',scoreText(undoRecord.units)+' '+info.unit),node('p','',isGroup()?`Last gymnast sits out. ${currentTeam().remaining} remaining for this team.`:isRelay?'Team time saved for this session.':'This gymnast’s attempt is complete.'),button('next',isGroup()&&state.order[state.turn+1]===teamIndex()?'Next round ↗':isRelay||isGroup()?'Next team ↗':'Next gymnast ↗','primary'));el.append(summary);splits(el);return el;
      }
      clock(el);if(state.phase==='review')review(el);
      else {const controls=node('div','swlt-controls');
        if(state.phase==='ready')controls.append(button('go',isGroup()?(currentTeam().remaining===1?'Start last gymnast ↗':`Start ${currentTeam().remaining} together ↗`):isSense?'Go · hide the clock ↗':isRelay?'Start team relay ↗':'Start handstand ↗','primary'));
        if(state.phase==='running'){
          if(isRelay)controls.append(button(state.laps.length===currentTeam().size-1?'finish':'lap',state.laps.length===currentTeam().size-1?'Finish team relay ■':'Next gymnast →','primary'));
          else controls.append(button('stop',isGroup()?'Last gymnast down ■':isSense?'Stop · reveal time ■':'Stop handstand ■','primary'));
          controls.append(button('pause','Pause clock','secondary'));
        }
        if(state.phase==='paused')controls.append(button('resume','Resume clock ↗','primary'),isRelay?button('redo','Redo this team','secondary'):button('discard','Discard attempt','secondary'));
        el.append(controls);
      }
      splits(el);return el;
    }
    function winnerIndices(){if(!state.teams.length)return[];let best=0;const comparison=(a,b)=>kind==='handstand'?a.totalUnits-b.totalUnits:a.totalUnits*Math.max(1,b.turns)-b.totalUnits*Math.max(1,a.turns);for(let i=1;i<state.teams.length;i++){const delta=comparison(state.teams[i],state.teams[best]);if(isRelay?delta<0:delta>0)best=i;}return state.teams.flatMap((team,index)=>comparison(team,state.teams[best])===0?[index]:[]);}
    function finishView(){const panel=node('section','swlt-finish'),winners=winnerIndices(),names=winners.map(index=>state.teams[index].name),all=winners.length===state.teams.length;panel.append(node('p','swlt-kicker',isGroup()?'GROUP ROUNDS COMPLETE':'EVERY GYMNAST COMPLETE'),node('div','swlt-trophy',winners.length===1?'✦':'═'),node('h3','',winners.length===1?`${names[0]} wins`:all?'It’s a tie':names.join(' & ')+' share the win'),node('p','swlt-finish-rule',info.tag.toLowerCase()),node('p','swlt-muted',isGroup()?'Each round’s time adds to the team total. The selected rounds are complete; empty teams finished earlier.':isRelay?'Every lap counts. The result compares adjusted time per gymnast.':isSense?'A little stillness. A good sense of time. Everyone has had one go.':'Every confirmed second contributes to the team’s total.'),button('replay','Play again ↗','primary'));return panel;}
    function history(){if(!state.results.length)return null;const details=node('details','swlt-history');details.append(node('summary','',isGroup()?'Group round times':isRelay?'Team times & lap splits':'Confirmed attempts'));state.results.forEach(result=>{
      const row=node('div','swlt-history-row'),label=state.teams[result.team].name+(isGroup()?` · round ${result.round}`:isRelay?'':` · gymnast ${result.gymnast}`);row.append(node('b','',label),node('strong','',scoreText(result.units)+' '+info.unit));
      if(isGroup())row.append(node('small','',`${result.remainingBefore} started · last gymnast sits out · ${result.remainingAfter} remaining`));
      if(isRelay){row.append(node('small','',`Raw time ${seconds(result.elapsedMs)} s · penalty +${result.penalty*2} s · ${(result.units/100/result.participants).toFixed(2)} s per gymnast`));const laps=node('p','',result.laps.map((lap,index)=>`${index+1}: ${seconds(lap)} s`).join(' · '));row.append(laps);}
      if(isSense)row.append(node('small','',`Target ${result.target} s · actual ${seconds(result.elapsedMs)} s${result.balanceLost?' · balance lost':''}`));
      details.append(row);
    });return details;}
    function render({focus=null}={}){
      if(!root||!state)return;const previous=root.contains(document.activeElement)?document.activeElement?.dataset.timingAction:null;view++;clockNode=lapNode=null;root.replaceChildren();root.dataset.game=kind;root.dataset.phase=state.phase;root.dataset.format=kind==='handstand'?format:'individual';root.dataset.active=String(active);root.dataset.static=String(motionOff());root.append(header());
      if(state.phase==='setup')root.append(setup());
      else {root.append(scoreboard(),state.phase==='finished'?finishView():stage());const tools=node('div','swlt-toolbar');
        if(isRelay)tools.append(button('redo','↻ Redo this team','secondary',state.phase==='ready'));
        else tools.append(button('undo','↶ Undo last score','secondary',!undoRecord||!['confirmed','finished'].includes(state.phase)));
        tools.append(button('reset','Restart game','text'));root.append(tools);const past=history();if(past)root.append(past);
      }
      const live=node('p','swlt-live',state.message);live.setAttribute('role','status');live.setAttribute('aria-live','polite');root.append(live,node('p','swlt-session-note','Session-only game scores · your Skill League scores stay unchanged'));
      if(confirming){const box=node('div','swlt-dialog');box.setAttribute('role','group');box.setAttribute('aria-label',confirming==='redo'?'Confirm team redo':'Confirm game restart');box.append(node('h3','',confirming==='redo'?'Redo this team’s relay?':'Restart this game?'),node('p','',confirming==='redo'?'This team’s current time, splits and penalty will be cleared. Other team results stay.':'All game scores return to zero. Team names and sizes stay ready.'),button('cancel-dialog','Keep playing','primary'),button('confirm-dialog',confirming==='redo'?'Redo team':'Restart','secondary'));root.append(box);root.querySelectorAll('[data-timing-action]').forEach(control=>{if(!['cancel-dialog','confirm-dialog'].includes(control.dataset.timingAction))control.disabled=true;});}
      if(active&&(focus||previous)){const target=root.querySelector(`[data-timing-action="${focus||previous}"]`);if(target&&!target.disabled)target.focus?.({preventScroll:true});}
    }
    function visibility(){if(document.hidden)pause();}
    function deactivate(){if(destroyed)return;pause();active=false;confirming='';render();}
    function destroy(){stopTick();document.removeEventListener('visibilitychange',visibility);active=false;destroyed=true;view++;root?.remove();root=host=null;state=null;clockNode=lapNode=null;options={};names=NAMES.slice();sizes=['5','5','5'];count=2;mode='normal';format='individual';rounds=2;taskId='burpees';undoRecord=null;confirming='';error='';previousTarget=0;}
    function mount(container,config={}){
      if(!container||typeof container.append!=='function')throw TypeError(info.name+' needs a container.');
      if(host===container&&root?.isConnected){options=config;active=true;render();return api;}
      destroy();host=container;options=config;active=true;destroyed=false;state=fresh();root=node('section','swl-timing-game');root.addEventListener('keydown',event=>{if(event.key==='Escape'&&confirming&&canAct()){event.preventDefault();event.stopPropagation();perform('cancel-dialog');}});document.addEventListener('visibilitychange',visibility);container.append(root);render();return api;
    }
    const api=Object.freeze({version:1,mount,deactivate,destroy,getState(){if(!state)return null;return{...clone(state),active,confirming,mode,format,rounds,taskId,gameId:kind,currentTeam:teamIndex(),currentGymnast:isGroup()?null:Math.min(gymnastIndex()+1,currentTeam()?.size??1),currentRound:isGroup()?groupRound():null,elapsedMs:elapsed(),draftScore:draftUnits()/factor,canUndo:!isRelay&&Boolean(undoRecord)&&['confirmed','finished'].includes(state.phase),participantCount:state.teams.reduce((sum,team)=>sum+team.size,0),winners:state.phase==='finished'?winnerIndices():[],teams:state.teams.map(team=>({...team,score:team.totalUnits/factor,average:team.turns?team.totalUnits/factor/team.turns:0}))};}});
    return api;
  }
  if(!window.SWLHandstand)window.SWLHandstand=createGame('handstand');
  if(!window.SWLConditioningRelay)window.SWLConditioningRelay=createGame('relayrace');
  if(!window.SWLTimeSense)window.SWLTimeSense=createGame('timesense');
})();
