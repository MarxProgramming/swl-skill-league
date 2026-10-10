(() => {
  'use strict';
  if (window.SWLStickBank?.version === 1 && window.SWLHoldLine?.version === 1) return;

  const JUMPS = [
    {id:'straight-jump',name:'Straight jump',icon:'↑',task:'One straight jump. Show a still landing.',cue:'Reach tall, land softly with bent knees, then hold your feet still for 3 seconds.'},
    {id:'half-turn',name:'Half-turn jump',icon:'↻',task:'One half-turn jump. Finish facing the other way.',cue:'Use a small, controlled jump. Land softly, then hold your feet still for 3 seconds.'},
    {id:'star-jump',name:'Star jump',icon:'✦',task:'Open to a star in the air, then bring your feet together.',cue:'Choose a comfortable jump height. Land softly, then hold your feet still for 3 seconds.'},
    {id:'tuck-jump',name:'Tuck jump',icon:'⌃',task:'One small tuck jump. Finish in a controlled landing.',cue:'Lift the knees only as high as you can control. Land softly and hold for 3 seconds.'}
  ];
  const HOLDS = [
    {id:'dish',name:'Dish hold',icon:'⌒',task:'Lie on your back and hold a small dish shape.',cue:'Keep your lower back in contact with the floor. Bend your knees if that helps you hold the shape.'},
    {id:'arch',name:'Arch hold',icon:'⌣',task:'Lie on your front and lift into a small arch shape.',cue:'Lift gently through your chest and thighs. Keep your neck long and choose a comfortable height.'},
    {id:'front-support',name:'Front support',icon:'━',task:'Hold a long front-support shape on hands and feet.',cue:'Hands under shoulders, hips in line. Knees may stay down for a controlled version.'},
    {id:'side-plank-left',name:'Left side plank',icon:'↙',task:'Hold a side plank with your left forearm underneath.',cue:'Elbow under shoulder. Lift your hips in line; use bent knees if needed.'},
    {id:'side-plank-right',name:'Right side plank',icon:'↘',task:'Hold a side plank with your right forearm underneath.',cue:'Elbow under shoulder. Lift your hips in line; use bent knees if needed.'},
    {id:'squat-hold',name:'Squat hold',icon:'⌑',task:'Sit into a comfortable squat and stay still.',cue:'Heels down, knees following your toes. Choose a depth you can keep with control.'},
    {id:'long-sit',name:'Long sit',icon:'∟',task:'Sit tall with straight legs reaching in front.',cue:'Keep your legs together and your chest lifted. Hands can rest beside your hips.'},
    {id:'tuck-balance',name:'Tuck balance',icon:'◡',task:'Balance in a seated tuck with your knees close.',cue:'Sit tall and keep the tuck still. Light toe contact is an option if the coach chooses it.'},
    {id:'pike-fold',name:'Comfortable pike fold',icon:'⋀',task:'Sit with legs in front and hold a gentle pike fold.',cue:'Fold only as far as comfortable. Stay still without bouncing, pushing or forcing the stretch.'}
  ];
  const COLORS=['#d5fa70','#bd9bff'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const time=()=>performance.now();
  function randomBelow(max) {
    try {const value=new Uint32Array(1),limit=0x100000000-(0x100000000%max);for(let i=0;i<8;i++){window.crypto.getRandomValues(value);if(value[0]<limit)return value[0]%max;}} catch (_) {}
    return Math.floor(Math.random()*max);
  }
  function shuffle(values) {const result=values.slice();for(let i=result.length-1;i>0;i--){const j=randomBelow(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}
  function element(tag,className,text) {const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}

  function trainingModule(kind) {
    const stick=kind==='stick',duration=stick?3000:10000,title=stick?'Stick & Bank':'Hold the Line';
    let host=null,root=null,callbacks={},active=false,destroyed=true,state=null,undoState=null,confirming=false;
    let timer=null,deadline=0,generation=0,viewRevision=0,clockNumber=null,clockText=null,clockRing=null,live=null;
    const fresh=()=>({phase:'setup',teams:[{name:'Mint',score:0,attempts:0},{name:'Purple',score:0,attempts:0}],team:0,round:0,turn:1,atStake:0,clean:0,cardId:null,bag:[],lastCard:null,deck:[],remainingMs:duration,lastCue:0,message:'',lastAward:null});
    const card=()=> (stick?JUMPS:HOLDS).find(item=>item.id===state.cardId)||null;
    const team=()=>state.teams[state.team];
    function sound(kind,extra={}) {try{callbacks.playSound?.({kind,...extra});}catch(_) {}}
    function canAct() {return active&&!destroyed&&!document.hidden&&root?.isConnected;}
    function stopClock() {generation++;clearTimeout(timer);timer=null;}
    function drawJump() {
      if(!state.bag.length){state.bag=shuffle(JUMPS.map(item=>item.id));if(state.bag[0]===state.lastCard)[state.bag[0],state.bag[1]]=[state.bag[1],state.bag[0]];}
      state.cardId=state.bag.shift();state.lastCard=state.cardId;
    }
    function ready() {
      if(stick)drawJump();else state.cardId=state.deck[state.round];
      state.phase='ready';state.remainingMs=duration;state.lastCue=0;state.lastAward=null;
    }
    function begin() {stopClock();state=fresh();undoState=null;confirming=false;if(!stick)state.deck=shuffle(HOLDS.map(item=>item.id)).slice(0,5);ready();render();}
    function updateClock() {
      const seconds=Math.ceil(state.remainingMs/1000);
      if(clockNumber)clockNumber.textContent=String(seconds).padStart(2,'0');
      if(clockText)clockText.textContent=state.phase==='running'?'Hold the shape':state.phase==='paused'?'Paused · resume when ready':state.phase==='review'?'Coach, make the call':stick?'Time the landing':'Seconds per team';
      if(clockRing){clockRing.style.setProperty('--swltr-progress',String(1-state.remainingMs/duration));clockRing.setAttribute('aria-label',`${seconds} seconds remaining`);}
    }
    function tick(token) {
      if(token!==generation||state.phase!=='running'||!active||destroyed)return;
      if(document.hidden||!root?.isConnected){pause();return;}
      state.remainingMs=Math.max(0,deadline-time());updateClock();
      const seconds=Math.ceil(state.remainingMs/1000);
      if(seconds===0){stopClock();state.phase='review';state.message=stick?'Landing hold complete. Coach, was it a clean stick?':'Time. Coach, score the whole team’s hold.';render();sound('timer-end');return;}
      if(seconds<=3&&state.lastCue!==seconds){state.lastCue=seconds;sound('countdown',{remaining:seconds});}
      // Schedule at the next displayed-second boundary, including after resume.
      timer=setTimeout(()=>tick(token),Math.max(1,state.remainingMs-(seconds-1)*1000));
    }
    function go(resume=false) {
      if(!canAct()||confirming||state.phase!==(resume?'paused':'ready'))return;
      if(!resume){undoState=null;state.remainingMs=duration;state.lastCue=0;}
      stopClock();state.phase='running';state.message=stick?'Hold that landing. Keep your feet still.':'Hold together until the finish sound.';deadline=time()+state.remainingMs;render();tick(generation);
    }
    function pause() {
      if(state?.phase!=='running')return;
      state.remainingMs=Math.max(0,deadline-time());stopClock();state.phase='paused';state.message='Timer paused. Resume when the team is ready.';render();
    }
    function saveUndo() {undoState=clone(state);}
    function swap() {state.team=1-state.team;state.turn++;state.atStake=0;state.clean=0;state.phase='handoff';}
    function bank(auto=false) {
      if(!canAct()||confirming||(!auto&&state.phase!=='decision')||state.atStake<1)return;
      if(!auto)saveUndo();
      const earned=state.atStake,name=team().name;team().score+=earned;
      state.atStake=0;state.clean=0;
      if(team().score>=10){state.phase='finished';state.message=`${name} wins with ${team().score} banked points.`;}
      else {swap();state.message=`${name} banked ${earned}. ${auto?'Three clean sticks: automatic bank. ':''}${team().name}, next gymnast up.`;}
      render();if(!auto)sound('award');
    }
    function judgeStick(clean) {
      if(!canAct()||confirming||state.phase!=='review')return;
      saveUndo();team().attempts++;
      if(clean){state.atStake++;state.clean++;state.message=`Clean stick. ${state.atStake} ${state.atStake===1?'point':'points'} at stake. Bank now, or send the next gymnast.`;state.phase='decision';if(state.clean===3)bank(true);else render();sound('award');}
      else {const lost=state.atStake,name=team().name;swap();state.message=`${name} ${lost?'loses '+lost+' unbanked '+(lost===1?'point':'points'):'ends the turn'}. ${team().name}, next gymnast up.`;render();}
    }
    function judgeHold(value) {
      if(!canAct()||confirming||state.phase!=='review'||![0,1,2].includes(value))return;
      saveUndo();team().score+=value;team().attempts++;state.lastAward=value;
      state.message=`${team().name}: ${value} ${value===1?'point':'points'}. ${value===2?'Clean hold by the whole team.':value===1?'Completed with form breaks.':'Not completed this time.'}`;
      state.phase=state.round===4&&state.team===1?'finished':'awarded';render();sound('award');
    }
    function next() {
      if(!canAct()||confirming)return;
      if(stick){if(!['decision','handoff'].includes(state.phase))return;ready();}
      else {if(state.phase!=='awarded')return;if(state.team===0)state.team=1;else {state.team=0;state.round++;}ready();}
      render();
    }
    function undo() {if(!canAct()||confirming||!undoState||['running','paused'].includes(state.phase))return;stopClock();state=undoState;undoState=null;state.message='Last decision undone. Coach, choose again.';render();}
    function requestReset() {if(!canAct()||state.phase==='setup'||confirming)return;pause();confirming=true;render();root.querySelector('[data-training-action="cancel-reset"]')?.focus({preventScroll:true});}
    function reset() {if(!canAct()||!confirming)return;stopClock();state=fresh();undoState=null;confirming=false;render();}
    function action(name) {
      if(!canAct())return;
      if(name==='start'||name==='replay'){if(state.phase==='setup'||state.phase==='finished')begin();return;}
      if(name==='reset'){requestReset();return;}
      if(name==='confirm-reset'){reset();return;}
      if(name==='cancel-reset'){if(confirming){confirming=false;render();}return;}
      if(confirming)return;
      if(name==='go')go();else if(name==='resume')go(true);else if(name==='pause')pause();else if(name==='clean')judgeStick(true);else if(name==='miss')judgeStick(false);else if(name==='bank')bank();else if(name==='next')next();else if(name==='undo')undo();else if(/^award-[012]$/.test(name))judgeHold(Number(name.slice(-1)));
    }
    function control(name,text,style='quiet',disabled=false) {
      const node=element('button',`swltr-button swltr-button--${style}`,text),revision=viewRevision;
      node.type='button';node.dataset.trainingAction=name;node.disabled=disabled;
      node.addEventListener('click',()=>{if(revision===viewRevision&&!node.disabled)action(name);});return node;
    }
    function scores() {
      const board=element('div','swltr-scores');board.setAttribute('aria-label','Team scores');
      state.teams.forEach((entry,index)=>{
        const tile=element('div','swltr-score');tile.dataset.team=String(index);tile.style.setProperty('--team-color',COLORS[index]);tile.dataset.active=String(index===state.team&&state.phase!=='setup'&&state.phase!=='finished');
        const top=element('div','swltr-score-top');top.append(element('span','',entry.name),element('small','',index===state.team&&state.phase!=='setup'&&state.phase!=='finished'?'YOUR TURN':'TEAM'));
        const value=element('div','swltr-score-value');value.append(element('strong','',String(entry.score)),element('span','',stick?'banked / 10':'points / 10'));
        tile.append(top,value);board.append(tile);
      });return board;
    }
    function instructions() {
      const box=element('div','swltr-instructions');box.append(element('p','swltr-kicker','TWO TEAMS · COACH LED'),element('h3','',stick?'Stick it. Risk it. Bank it.':'Same hold. Same time.'));
      const list=element('ol','');const lines=stick?[
        'Split into Mint and Purple. A different gymnast takes each attempt.',
        'Perform the jump, then press the landing timer. A clean 3-second stick adds 1 point at stake.',
        'Bank to keep those points and swap teams. A miss loses the unbanked points and swaps teams.',
        'Three clean sticks automatically bank the turn. First to 10 banked points wins.'
      ]:[
        'Split into Mint and Purple. The whole active team performs the hold together.',
        'Coach sets the same version for both teams. Each team gets exactly 10 seconds on the same card.',
        'Award 2 for a clean whole-team hold, 1 for completion with form breaks, or 0 if not completed.',
        'Play 5 different holds, once per team. The most points wins; equal scores share the result.'
      ];lines.forEach(text=>list.append(element('li','',text)));box.append(list,element('p','swltr-coach-cue',stick?'Use familiar jumps on a clear floor, with the coach choosing a controlled version.':'Coach chooses familiar, comfortable versions and keeps them the same for both teams.'),control('start','Start game ↗','primary'));return box;
    }
    function resultView() {
      const result=element('div','swltr-finish');
      const high=Math.max(...state.teams.map(entry=>entry.score)),winners=state.teams.filter(entry=>entry.score===high),tie=winners.length===2;
      result.append(element('p','swltr-kicker',tie?'A SHARED FINISH':'GAME COMPLETE'),element('div','swltr-finish-icon',tie?'═':'✦'),element('h3','',tie?'It’s a tie':`${winners[0].name} wins`),element('p','',stick?`${high} banked points. Controlled landings paid off.`:`${state.teams[0].score}–${state.teams[1].score} after 5 shared holds.`));
      result.append(control('replay','Play again ↗','primary'));return result;
    }
    function currentCard() {
      const current=card(),panel=element('section','swltr-card');panel.dataset.cardId=current.id;
      const content=element('div','swltr-card-copy');content.append(element('p','swltr-kicker',stick?`${team().name.toUpperCase()} · NEXT GYMNAST`:`ROUND ${state.round+1} / 5 · ${team().name.toUpperCase()} TEAM`),element('div','swltr-card-icon',current.icon),element('h3','swltr-card-title',current.name),element('p','swltr-card-task',current.task),element('p','swltr-card-cue',current.cue));
      const clock=element('div','swltr-clock');clock.setAttribute('role','timer');clock.setAttribute('aria-live','off');clockRing=clock;clockNumber=element('strong','');clockText=element('span','');clock.append(clockNumber,element('small','',stick?'SECOND LANDING':'SECOND HOLD'),clockText);panel.append(content,clock);return panel;
    }
    function turnControls() {
      const area=element('div','swltr-controls');
      if(state.phase==='ready'){area.append(element('p','swltr-action-prompt',stick?'Perform the jump. Coach starts the timer as the gymnast lands.':`${team().name}, find your shape. Press Go when everyone is ready.`),control('go',stick?'Time the landing · 3 sec':'Go · 10 seconds','primary'));}
      else if(state.phase==='running'){area.append(element('p','swltr-action-prompt',stick?'Keep the landing still until the sound.':'Keep the whole team’s shape until the sound.'),control('pause','Pause timer','quiet'));}
      else if(state.phase==='paused'){area.append(element('p','swltr-action-prompt','Time is paused. Get ready before continuing.'),control('resume','Resume timer ↗','primary'));}
      else if(state.phase==='review'){
        area.append(element('p','swltr-action-prompt',stick?'Coach’s call: was the landing held for all 3 seconds?':'Coach’s call: how did the whole team hold?'));
        const row=element('div','swltr-judgements');
        if(stick)row.append(control('clean','Clean stick · +1','primary'),control('miss','Miss · swap teams','coral'));
        else {row.dataset.three='true';row.append(control('award-2','2 · Clean hold','primary'),control('award-1','1 · Form breaks','lavender'),control('award-0','0 · Not completed','quiet'));}area.append(row);
      } else if(stick&&state.phase==='decision'){
        area.append(element('p','swltr-action-prompt','Bank the points, or send the next gymnast to try another landing.'));
        const row=element('div','swltr-judgements');row.append(control('bank',`Bank ${state.atStake} & swap`,'primary'),control('next','Next gymnast · risk it','lavender'));area.append(row);
      } else if(state.phase==='handoff'||state.phase==='awarded'){
        const upcoming=stick?team().name:state.team===0?'Purple':'Mint';
        area.append(element('p','swltr-action-prompt',stick?`${upcoming}, choose your next gymnast.`:state.team===0?'Purple takes the same hold next.':'Both teams have completed this hold.'));
        area.append(control('next',stick?`${upcoming}’s turn ↗`:state.team===0?'Purple · same hold ↗':'Next shared hold ↗','primary'));
      }return area;
    }
    function render() {
      if(!root||!state)return;const hadFocus=root.contains(document.activeElement);viewRevision++;clockNumber=clockText=clockRing=null;root.replaceChildren();root.dataset.game=kind;root.dataset.phase=state.phase;root.dataset.team=String(state.team);root.dataset.active=String(active);root.style.setProperty('--swltr-accent',COLORS[state.team]);
      let quiet=false;try{quiet=Boolean(callbacks.motionOff?.())||Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);}catch(_){}root.dataset.static=String(quiet);
      const header=element('header','swltr-heading'),copy=element('div','');copy.append(element('p','swltr-kicker','SWL GAMES · TWO TEAMS'),element('h2','',title),element('p','swltr-intro',stick?'Land with control. Decide when to keep your points.':'Five shared holds. Ten seconds. Every teammate counts.'));header.append(copy,element('span','swltr-session-tag','FREE PLAY'));root.append(header,scores());
      live=element('p','swltr-live',state.message||'');live.setAttribute('role','status');live.setAttribute('aria-live','polite');root.append(live);
      if(state.phase==='setup')root.append(instructions());
      else {
        if(stick){const pot=element('div','swltr-pot');pot.append(element('span','',state.phase==='finished'?'GAME FINISHED':'AT STAKE'),element('strong','',String(state.atStake)),element('p','',state.phase==='finished'?'All points banked':`${state.clean} / 3 clean sticks this turn`));root.append(pot);}
        else {const progress=element('div','swltr-rounds');progress.setAttribute('aria-label',`Round ${state.round+1} of 5`);for(let i=0;i<5;i++){const dot=element('span','',String(i+1));dot.dataset.current=String(i===state.round);dot.dataset.done=String(i<state.round||(state.phase==='finished'&&i===4));progress.append(dot);}root.append(progress);}
        if(state.phase==='finished')root.append(resultView());
        else if(stick&&state.phase==='handoff'){const handoff=element('div','swltr-handoff');handoff.append(element('span','', '⇄'),element('h3','',`${team().name}, you’re up`),element('p','', 'New turn. Next gymnast. Fresh landing card.'));root.append(handoff,turnControls());}
        else root.append(currentCard(),turnControls());
        const toolbar=element('div','swltr-toolbar');toolbar.append(control('undo','↶ Undo last decision','quiet',!undoState||['running','paused'].includes(state.phase)||confirming),control('reset','Restart game','quiet',confirming));root.append(toolbar);
      }
      if(confirming){const box=element('div','swltr-reset');box.setAttribute('role','group');box.setAttribute('aria-label','Confirm restart');box.append(element('h3','','Restart this game?'),element('p','','Both team scores will return to zero.'));const buttons=element('div','swltr-judgements');buttons.append(control('cancel-reset','Keep playing','primary'),control('confirm-reset','Restart','coral'));box.append(buttons);root.append(box);}
      root.append(element('p','swltr-footnote','Coach led · game points stay in this session · no Skill League points'));
      if(confirming)root.querySelectorAll('[data-training-action]').forEach(node=>{if(!['confirm-reset','cancel-reset'].includes(node.dataset.trainingAction))node.disabled=true;});
      updateClock();
      if(hadFocus&&active)Array.from(root.querySelectorAll('[data-training-action]')).find(node=>!node.disabled)?.focus({preventScroll:true});
    }
    function deactivate() {if(destroyed)return;pause();active=false;confirming=false;render();}
    function visibilityChanged() {if(document.hidden)pause();}
    function destroy() {stopClock();active=false;destroyed=true;document.removeEventListener('visibilitychange',visibilityChanged);root?.remove();host=root=null;callbacks={};state=null;undoState=null;confirming=false;}
    function mount(container,options={}) {
      if(!container||typeof container.append!=='function')throw TypeError(`${title} needs a container.`);
      if(host===container&&root?.isConnected){callbacks=options;active=true;render();return api;}
      destroy();host=container;callbacks=options;active=true;destroyed=false;state=fresh();root=element('section',`swltr-game swltr-${kind}`);container.append(root);document.addEventListener('visibilitychange',visibilityChanged);render();return api;
    }
    const api=Object.freeze({version:1,mount,deactivate,destroy,getState(){return state?{...clone(state),active,confirming,card:clone(card()),canUndo:Boolean(undoState)}:null;}});
    return api;
  }
  window.SWLStickBank=trainingModule('stick');
  window.SWLHoldLine=trainingModule('hold');
})();
