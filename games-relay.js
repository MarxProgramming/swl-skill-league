(() => {
  'use strict';
  if (window.SWLRoutineRelay?.version === 1) return;

  const COLORS=['#d5fa70','#bd9bff'], DEFAULTS=['Mint','Purple'], ROUNDS=5;
  const POOLS=[
    [
      {id:'straight-jump',name:'Straight jump',cue:'Show a long shape and a controlled landing.',icon:'↑'},
      {id:'half-turn-jump',name:'Half-turn jump',cue:'A small half turn. Finish the landing before moving on.',icon:'↻'},
      {id:'star-jump',name:'Star jump',cue:'Open to a star, then bring your feet together to land.',icon:'✦'},
      {id:'tuck-jump',name:'Tuck jump',cue:'Use a familiar tuck jump with a quiet, controlled landing.',icon:'⌃'}
    ],
    [
      {id:'forward-roll',name:'Forward roll',cue:'Use your practised forward roll and finish with control.',icon:'↷'},
      {id:'backward-roll',name:'Backward roll',cue:'Use your coach-approved backward roll and finish with control.',icon:'↶'},
      {id:'cartwheel',name:'Cartwheel',cue:'Use your familiar cartwheel and finish with control.',icon:'↔'},
      {id:'handstand-forward-roll',name:'Handstand forward roll',cue:'Use your practised, coach-approved handstand forward roll.',icon:'↷'}
    ],
    [
      {id:'v-sit',name:'V sit',cue:'Finish in a familiar V sit, showing a controlled shape.',icon:'V'},
      {id:'pike-shape',name:'Pike shape',cue:'Show a comfortable seated pike. Hold without forcing the stretch.',icon:'⋀'},
      {id:'straddle-sit',name:'Straddle sit',cue:'Open your legs to a comfortable straddle and sit tall.',icon:'⋁'},
      {id:'arabesque',name:'Arabesque',cue:'Show a familiar arabesque at a height you can hold with control.',icon:'↗'},
      {id:'front-support',name:'Front support',cue:'Finish in a long, controlled front-support shape.',icon:'━'},
      {id:'one-leg-balance',name:'One-leg balance',cue:'Finish with a clear, still balance on one leg.',icon:'↑'}
    ]
  ];
  const TYPES=['Jump','Acro','Finish'],SKILLS=new Map(POOLS.flat().map(skill=>[skill.id,skill]));
  const ROUTINES=POOLS[0].flatMap(jump=>POOLS[1].flatMap(roll=>POOLS[2].map(finish=>[jump.id,roll.id,finish.id])));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const cleanName=value=>Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim()).slice(0,24).join('');
  const node=(tag,className='',text)=>{const element=document.createElement(tag);element.className=className;if(text!==undefined)element.textContent=text;return element;};
  function randomBelow(maximum) {
    try {const value=new Uint32Array(1),limit=0x100000000-(0x100000000%maximum);for(let i=0;i<8;i++){window.crypto.getRandomValues(value);if(value[0]<limit)return value[0]%maximum;}} catch (_) {}
    return Math.floor(Math.random()*maximum);
  }
  function shuffle(values) {const result=values.slice();for(let i=result.length-1;i>0;i--){const j=randomBelow(i+1);[result[i],result[j]]=[result[j],result[i]];}return result;}

  let host=null,root=null,options={},active=false,destroyed=true,viewGeneration=0;
  let state=null,names=DEFAULTS.slice(),bag=[],previousRoutine='',undoRecord=null,confirming=false,error='';
  const fresh=()=>({phase:'setup',teams:[],round:0,position:0,routine:[],clean:[false,false,false],linking:false,roundLocked:false,results:[],message:''});
  const currentTeam=()=> (state.round+state.position)%2;
  const draftScore=()=>state.clean.filter(Boolean).length+(state.linking&&state.clean.every(Boolean)?1:0);
  const canAct=()=>active&&!destroyed&&!document.hidden&&Boolean(root?.isConnected);
  function motionOff() {try{return Boolean(typeof options.motionOff==='function'?options.motionOff():options.motionOff)||Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)||Boolean(document.body?.classList.contains('no-motion'));}catch(_){return true;}}
  function sound(payload) {try{options.playSound?.(payload);}catch(_) {}}
  function drawRoutine() {
    if(!bag.length){bag=shuffle(ROUTINES);if(bag[0].join('|')===previousRoutine)[bag[0],bag[1]]=[bag[1],bag[0]];}
    state.routine=bag.shift().slice();previousRoutine=state.routine.join('|');state.clean=[false,false,false];state.linking=false;
  }
  function start(replay=false) {
    if(!canAct()||confirming||(replay?state.phase!=='finished':state.phase!=='setup'))return;
    const chosen=names.map((name,index)=>cleanName(name)||DEFAULTS[index]);
    if(chosen[0].toLocaleLowerCase()===chosen[1].toLocaleLowerCase()){error='Give the two teams different names so every score is clear.';render();return;}
    names=chosen;state=fresh();state.teams=chosen.map((name,index)=>({name,color:COLORS[index],score:0,turns:0}));state.phase='scoring';undoRecord=null;error='';drawRoutine();
    state.message=`${state.teams[0].name}, next gymnast up. Perform the chain, then coach marks the clean skills.`;render({reveal:true,focus:'skill-0'});
  }
  function toggleSkill(index) {
    if(state.phase!=='scoring'||!Number.isInteger(index)||index<0||index>2)return;
    state.clean[index]=!state.clean[index];if(!state.clean.every(Boolean))state.linking=false;
    state.message=`${draftScore()} of 4 ready to submit. Nothing is banked until Submit.`;render({focus:'skill-'+index});
  }
  function toggleLinking() {
    if(state.phase!=='scoring'||!state.clean.every(Boolean))return;
    state.linking=!state.linking;state.message=state.linking?'Smooth linking added. Four points ready to submit.':'Linking bonus removed. Three points ready to submit.';render({focus:'linking'});
  }
  function submit() {
    if(state.phase!=='scoring')return;
    const teamIndex=currentTeam(),points=draftScore();
    undoRecord={team:teamIndex,points,clean:state.clean.slice(),linking:state.linking};
    state.teams[teamIndex].score+=points;state.teams[teamIndex].turns++;
    state.results.push({round:state.round,team:teamIndex,points,routine:state.routine.slice()});state.roundLocked=true;
    state.phase=state.round===ROUNDS-1&&state.position===1?'finished':'submitted';
    state.message=`${state.teams[teamIndex].name}: ${points} ${points===1?'point':'points'} submitted. ${state.phase==='finished'?'Both teams have completed five routines.':'Undo is available before the next turn.'}`;
    render({focus:state.phase==='finished'?'replay':'next'});sound({kind:state.phase==='finished'?'finish':'award',perfect:points===4});
  }
  function undo() {
    if(!undoRecord||!['submitted','finished'].includes(state.phase))return;
    const last=undoRecord;state.teams[last.team].score-=last.points;state.teams[last.team].turns--;state.results.pop();state.clean=last.clean;state.linking=last.linking;undoRecord=null;state.phase='scoring';
    // An already-scored round keeps its chain even if its first score is corrected.
    state.message='Score undone. Adjust the clean skills or linking, then submit again.';render({focus:'submit'});
  }
  function next() {
    if(state.phase!=='submitted')return;
    undoRecord=null;
    if(state.position===0){state.position=1;state.clean=[false,false,false];state.linking=false;}
    else {state.round++;state.position=0;state.roundLocked=false;drawRoutine();}
    state.phase='scoring';const team=state.teams[currentTeam()];
    state.message=state.position===1?`${team.name}, next gymnast up. Exactly the same three skills.`:`Round ${state.round+1}. ${team.name} goes first this time.`;
    render({reveal:state.position===0,focus:'skill-0'});
  }
  function redraw() {
    if(state.phase!=='scoring'||state.position!==0||state.roundLocked)return;
    drawRoutine();state.message='New routine for both teams. Coach, check the whole chain before anyone scores.';render({reveal:true,focus:'redraw'});
  }
  function requestReset() {if(state.phase==='setup'||confirming)return;confirming=true;render({focus:'cancel-reset'});}
  function reset() {if(!confirming)return;confirming=false;state=fresh();undoRecord=null;error='';render({focus:'start'});}
  function perform(action) {
    if(!canAct())return;
    if(action==='cancel-reset'){if(confirming){confirming=false;render({focus:'reset'});}return;}
    if(action==='confirm-reset'){reset();return;}
    if(confirming)return;
    if(action==='start')start();else if(action==='replay')start(true);else if(action==='submit')submit();else if(action==='undo')undo();else if(action==='next')next();else if(action==='redraw')redraw();else if(action==='linking')toggleLinking();else if(action==='reset')requestReset();else if(/^skill-[012]$/.test(action))toggleSkill(Number(action.slice(-1)));
  }
  function button(action,text,style='secondary',disabled=false) {
    const control=node('button','swl-relay-button swl-relay-'+style,text),generation=viewGeneration;control.type='button';control.dataset.relayAction=action;control.disabled=disabled||!active;
    control.addEventListener('click',()=>{if(generation===viewGeneration&&!control.disabled)perform(action);});return control;
  }
  function header() {
    const heading=node('header','swl-relay-heading'),text=node('div');text.append(node('p','swl-relay-kicker','SWL GAMES · ROUTINE RELAY'),node('h2','','Three skills. One flow.'),node('p','swl-relay-intro','A shared routine. A new gymnast. Make every clean connection count.'));
    heading.append(text,node('span','swl-relay-tag','2 TEAMS · 5 ROUNDS'));return heading;
  }
  function setup() {
    const layout=node('div','swl-relay-setup-grid'),form=node('section','swl-relay-setup'),rules=node('section','swl-relay-rules');
    form.append(node('p','swl-relay-kicker','NAME YOUR TEAMS'),node('h3','','Pass the routine on.'),node('p','swl-relay-muted','Split into two teams. Send a different gymnast for each turn; everyone follows the same three-card chain.'));
    const inputs=node('div','swl-relay-names');names.forEach((name,index)=>{const label=node('label','swl-relay-name',`Team ${index+1}`);label.style.setProperty('--relay-color',COLORS[index]);const input=node('input');input.type='text';input.value=name;input.maxLength=24;input.autocomplete='off';input.dataset.relayName=String(index);input.setAttribute('aria-label',`Team ${index+1} name`);const generation=viewGeneration;input.addEventListener('input',()=>{if(canAct()&&generation===viewGeneration)names[index]=input.value;});label.append(input);inputs.append(label);});
    const issue=node('p','swl-relay-error',error);issue.setAttribute('role','alert');form.append(inputs,issue,button('start','Build the first routine ↗','primary'));
    rules.append(node('div','swl-relay-rule-mark','1 → 2 → 3'),node('h3','','Clean skills. Smooth linking.'));
    const list=node('ol');[
      'Perform the three cards in order: jump, acro, then a finishing shape.',
      'Coach taps each clean skill for 1 point. All three clean unlock an optional 1-point linking bonus.',
      'Submit 0–4 points, then the other team performs the same routine.',
      'Play five paired rounds. The starting team alternates; the highest total wins.'
    ].forEach(text=>list.append(node('li','',text)));rules.append(list,node('p','swl-relay-familiar','Coach approves familiar versions and controlled transitions. Redraw an unsuitable routine before the first team scores.'));layout.append(form,rules);return layout;
  }
  function scoreboard() {
    const board=node('div','swl-relay-scoreboard');board.setAttribute('aria-label','Routine Relay team scores');state.teams.forEach((team,index)=>{const tile=node('div','swl-relay-score');tile.dataset.current=String(state.phase!=='finished'&&currentTeam()===index);tile.style.setProperty('--relay-color',team.color);tile.append(node('span','swl-relay-score-name',team.name),node('strong','',String(team.score)),node('small','',`${team.turns} / 5 routines scored · up to 20 points`));board.append(tile);});return board;
  }
  function progress() {
    const row=node('div','swl-relay-progress');row.append(node('span','',`ROUND ${state.round+1} / ${ROUNDS}`));const dots=node('div','swl-relay-rounds');for(let i=0;i<ROUNDS;i++){const dot=node('i');dot.dataset.current=String(i===state.round);dot.dataset.done=String(i<state.round||state.phase==='finished');dots.append(dot);}dots.setAttribute('aria-hidden','true');row.append(dots,node('span','',`${state.position+1} / 2 TEAMS`));return row;
  }
  function routineView(reveal) {
    const stage=node('section','swl-relay-stage'+(reveal?' is-revealing':''));stage.style.setProperty('--relay-color',state.teams[currentTeam()].color);
    const top=node('div','swl-relay-turn-head'),copy=node('div');copy.append(node('p','swl-relay-kicker',state.position===0?'FIRST TEAM · NEXT GYMNAST':'SAME ROUTINE · NEXT GYMNAST'),node('h3','swl-relay-turn',state.teams[currentTeam()].name));
    top.append(copy,node('span','swl-relay-turn-note',state.phase==='submitted'?'Score submitted':state.position===0?'Coach checks the chain':'Match the same sequence'));stage.append(top);
    const cards=node('div','swl-relay-cards');state.routine.forEach((id,index)=>{
      const skill=SKILLS.get(id),control=button('skill-'+index,undefined,'card',state.phase!=='scoring');control.classList.add('swl-relay-card');control.dataset.skillId=id;control.dataset.clean=String(state.clean[index]);control.style.setProperty('--relay-delay',`${index*75}ms`);control.setAttribute('aria-pressed',String(state.clean[index]));control.setAttribute('aria-label',`${index+1}. ${skill.name}. ${state.clean[index]?'Clean, 1 point':'Not marked clean'}.`);
      const meta=node('span','swl-relay-card-meta');meta.append(node('b','',`0${index+1}`),node('span','',TYPES[index]));control.append(meta,node('span','swl-relay-icon',skill.icon),node('strong','swl-relay-skill-name',skill.name),node('span','swl-relay-skill-cue',skill.cue),node('span','swl-relay-clean-label',state.clean[index]?'✓ Clean · +1':'Tap if clean · +1'));cards.append(control);
    });stage.append(cards,node('p','swl-relay-transition-note','Connect in this order with controlled steps and floor transitions. Use the same coach-approved versions for both teams.'));
    const linking=button('linking',undefined,'linking',state.phase!=='scoring'||!state.clean.every(Boolean));linking.classList.add('swl-relay-linking');linking.setAttribute('aria-pressed',String(state.linking));linking.append(node('span','swl-relay-link-symbol',state.linking?'✓':'⌁'),node('span','swl-relay-link-copy','Smooth linking'),node('small','',state.clean.every(Boolean)?'Coach’s choice · connects all three clean skills':'Mark all three clean to unlock'),node('b','','+1'));stage.append(linking);
    const bottom=node('div','swl-relay-submit-row'),total=node('div','swl-relay-draft');total.append(node('span','',state.phase==='submitted'?'SUBMITTED':'THIS ATTEMPT'),node('strong','',String(draftScore())),node('small','','/ 4'));
    bottom.append(total,state.phase==='scoring'?button('submit',`Submit ${draftScore()} ${draftScore()===1?'point':'points'} ↗`,'primary'):button('next',state.position===0?'Other team · same routine ↗':'Next paired round ↗','primary'));stage.append(bottom);
    const tools=node('div','swl-relay-stage-tools');tools.append(button('redraw','↻ Redraw whole routine','text',state.phase!=='scoring'||state.position!==0||state.roundLocked));tools.append(node('p','',state.roundLocked?'This routine stays fixed for both teams.':'Redraw is available until the first score is submitted.'));stage.append(tools);return stage;
  }
  function finishView() {
    const panel=node('section','swl-relay-finish'),high=Math.max(...state.teams.map(team=>team.score)),winners=state.teams.filter(team=>team.score===high),tie=winners.length===2;
    panel.append(node('p','swl-relay-kicker','TEN TURNS · FIVE SHARED ROUTINES'),node('div','swl-relay-trophy',tie?'═':'✦'),node('h3','',tie?'A shared top spot':`${winners[0].name} wins`),node('p','swl-relay-finish-score',`${state.teams[0].score} — ${state.teams[1].score}`),node('p','swl-relay-muted','Three clean skills, then make them flow. That’s a routine worth passing on.'),button('replay','Play another relay ↗','primary'));return panel;
  }
  function render({reveal=false,focus=null}={}) {
    if(!root||!state)return;const previous=root.contains(document.activeElement)?document.activeElement?.dataset.relayAction:null;viewGeneration++;root.replaceChildren();root.dataset.phase=state.phase;root.dataset.active=String(active);root.dataset.static=String(motionOff());root.append(header());
    if(state.phase==='setup')root.append(setup());
    else {
      root.append(scoreboard(),progress(),state.phase==='finished'?finishView():routineView(reveal));
      const tools=node('div','swl-relay-toolbar');tools.append(button('undo','↶ Undo last score','secondary',!undoRecord||!['submitted','finished'].includes(state.phase)),button('reset','Restart relay','text'));root.append(tools);
    }
    const message=node('p','swl-relay-live',state.message);message.setAttribute('role','status');message.setAttribute('aria-live','polite');root.append(message,node('p','swl-relay-session-note','Session-only game points · your Skill League scores stay unchanged'));
    if(confirming){const box=node('div','swl-relay-reset');box.setAttribute('role','group');box.setAttribute('aria-label','Confirm relay restart');box.append(node('h3','','Restart this relay?'),node('p','','Both team scores will return to zero. Your team names stay ready.'),button('cancel-reset','Keep playing','primary'),button('confirm-reset','Restart','secondary'));root.append(box);root.querySelectorAll('[data-relay-action]').forEach(control=>{if(!['cancel-reset','confirm-reset'].includes(control.dataset.relayAction))control.disabled=true;});}
    if(active&&(focus||previous)){const target=root.querySelector(`[data-relay-action="${focus||previous}"]`);if(target&&!target.disabled)target.focus?.({preventScroll:true});}
  }
  function deactivate() {if(destroyed)return;active=false;confirming=false;render();}
  function destroy() {active=false;destroyed=true;viewGeneration++;root?.remove();host=root=null;state=null;options={};names=DEFAULTS.slice();bag=[];previousRoutine='';undoRecord=null;confirming=false;error='';}
  function mount(container,config={}) {
    if(!container||typeof container.append!=='function')throw TypeError('Routine Relay needs a container.');
    if(host===container&&root?.isConnected){options=config;active=true;render();return api;}
    destroy();host=container;options=config;active=true;destroyed=false;state=fresh();root=node('section','swl-relay-game');root.addEventListener('keydown',event=>{if(event.key==='Escape'&&confirming&&canAct()){event.preventDefault();event.stopPropagation();perform('cancel-reset');}});container.append(root);render();return api;
  }
  const api=Object.freeze({version:1,mount,deactivate,destroy,getState(){return state?{...copy(state),active,confirming,currentTeam:currentTeam(),draftScore:draftScore(),canUndo:Boolean(undoRecord),canRedraw:state.phase==='scoring'&&state.position===0&&!state.roundLocked,cards:state.routine.map(id=>({...SKILLS.get(id)}))}:null;}});
  window.SWLRoutineRelay=api;
})();
