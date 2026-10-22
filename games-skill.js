/* Shared by the two shuffle games; all point values remain session-only. */
(() => {
  'use strict';
  const LEVELS = [
    {id:'easy',name:'Easy',detail:'Base skills, basic leaps + handstands'},
    {id:'medium',name:'Medium',detail:'Base skills + first upgrades, including leaps'},
    {id:'hard',name:'Hard',detail:'Every skill, including pro'}
  ];
  const node = (tag, className = '', text = '') => { const el=document.createElement(tag);el.className=className;el.textContent=text;return el; };
  const poolFor=(skills,difficulty)=>skills.filter(skill=>difficulty==='hard'||skill.tier==='base'||difficulty==='medium'&&skill.tier==='upgrade');
  function difficultyView(selected,skills,onSelect){
    const wrap=node('fieldset','swl-shuffle-difficulty'),legend=node('legend','','Skill difficulty');wrap.append(legend);
    const choices=node('div','swl-shuffle-difficulty-options');
    LEVELS.forEach(level=>{const button=node('button','swl-shuffle-difficulty-button');button.type='button';button.dataset.difficulty=level.id;button.setAttribute('aria-pressed',String(selected===level.id));button.append(node('b','',level.name),node('span','',level.detail),node('small','',`${poolFor(skills,level.id).length} skills`));button.addEventListener('click',()=>onSelect(level.id));choices.append(button);});wrap.append(choices);return wrap;
  }
  function teamCountView(selected,maximum,onChange,label='Number of teams'){
    const wrap=node('label','swl-game-team-picker'),select=node('select');wrap.append(node('span','',label));select.setAttribute('aria-label',label);select.dataset.gameTeamCount='true';
    for(let value=2;value<=maximum;value++){const option=node('option','',`${value} teams`);option.value=String(value);option.selected=value===selected;select.append(option);}select.value=String(selected);
    select.addEventListener('change',()=>{const value=Number(select.value);if(Number.isInteger(value)&&value>=2&&value<=maximum)onChange(value);});wrap.append(select);return wrap;
  }
  const ordinal=rank=>`${rank}${rank===1?'st':rank===2?'nd':rank===3?'rd':'th'}`;
  const placeName=rank=>({1:'First',2:'Second',3:'Third',4:'Fourth',5:'Fifth'}[rank]||ordinal(rank));
  function createPodium(entries,{motionOff=()=>false,sound=()=>{},onDone=()=>{}}={}){
    const groups=[...new Set(entries.map(entry=>entry.rank))].sort((a,b)=>b-a),lead=500,stageMs=1700,countMs=950;
    const duration=lead+(groups.length-1)*stageMs+countMs;
    let elapsed=0,last=0,timer=null,generation=0,running=false,finished=false,destroyed=false,host=null,root=null,caption=null,live=null,burst=null;
    let seenRank=-1,lastChime=-1,burstUntil=0,revealed=new Set();const labels=new Map(),scores=new Map(),details=new Map(),cardNodes=new Map();
    const format=(value,decimals)=>Number(value.toFixed(decimals??3)).toLocaleString('en-GB',decimals==null?{}:{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
    const emit=cue=>{try{sound(cue);}catch(_) {}};
    function cancel(){generation++;clearTimeout(timer);timer=null;}
    function position(){return Math.max(-1,Math.min(groups.length-1,Math.floor((elapsed-lead)/stageMs)));}
    function countProgress(index){return Math.max(0,Math.min(1,(elapsed-lead-index*stageMs)/countMs));}
    function confetti(){
      if(!root||burst||motionOff()||performance.now()>=burstUntil)return;
      burst=node('div','swl-podium-confetti');burst.setAttribute('aria-hidden','true');
      for(let i=0;i<42;i++){const piece=node('i','swl-podium-piece');piece.style.setProperty('--piece-x',`${(i*37)%101}%`);piece.style.setProperty('--piece-drift',`${((i*53)%200)-100}px`);piece.style.setProperty('--piece-delay',`${(i%9)*.06}s`);piece.style.setProperty('--piece-turn',`${(i%2?-1:1)*(170+i*17)}deg`);piece.style.setProperty('--piece-color',['#ffd782','#d5fa70','#bd9bff'][i%3]);burst.append(piece);}root.append(burst);
    }
    function paint(quiet=false){
      if(!root)return;const current=finished?groups.length-1:position();
      if(current>=0){for(let i=0;i<=current;i++)revealed.add(groups[i]);}
      entries.forEach(entry=>{
        const card=cardNodes.get(entry.id),visible=revealed.has(entry.rank),index=groups.indexOf(entry.rank),progress=finished?1:countProgress(index);
        card.dataset.revealed=String(visible);card.dataset.winner=String(visible&&entry.rank===1);labels.get(entry.id).textContent=visible?entry.name:'Waiting…';scores.get(entry.id).textContent=visible?format(entry.value*(1-Math.pow(1-progress,3)),entry.decimals):'—';details.get(entry.id).textContent=visible?entry.detail||'':'';
      });
      const winners=entries.filter(entry=>entry.rank===1).map(entry=>entry.name);
      if(caption)caption.textContent=finished?(winners.length>1?'Shared win: '+winners.join(' + ')+'!':winners[0]+' wins!'):current<0?'The results are in…':groups[current]===1?'And the winner'+(entries.filter(e=>e.rank===1).length>1?'s are…':' is…'):placeName(groups[current])+' place';
      if(live)live.textContent=finished?entries.filter(e=>e.rank===1).map(e=>e.name).join(' + ')+' take the top spot.':current<0?'Preparing the podium.':placeName(groups[current])+' place: '+entries.filter(e=>e.rank===groups[current]).map(e=>e.name).join(' + ');
      if(!quiet&&current!==seenRank&&current>=0){seenRank=current;lastChime=-1;emit({kind:'podium-place',rank:groups[current]});}
      if(!quiet&&current>=0&&!finished){const step=Math.floor(countProgress(current)*6);if(step>lastChime&&step<6){lastChime=step;emit({kind:'podium-count',rank:groups[current],progress:countProgress(current)});}}
      root.dataset.finished=String(finished);const skip=root.querySelector('[data-podium-skip]');if(skip)skip.hidden=finished;
      if(finished)confetti();
    }
    function finish(silent=false){
      if(destroyed||finished)return;cancel();running=false;elapsed=duration;finished=true;burstUntil=silent?0:performance.now()+4200;groups.forEach(rank=>revealed.add(rank));paint(true);
      if(!silent)emit({kind:'podium-win'});
      try{onDone({promptRating:!silent});}catch(_) {}
    }
    function frame(){
      cancel();if(!running||destroyed||finished)return;const token=generation;
      timer=setTimeout(()=>{if(token!==generation||!running||destroyed||finished)return;timer=null;if(document.hidden){finish(true);return;}const time=performance.now();elapsed+=Math.max(0,time-last);last=time;if(elapsed>=duration){finish();return;}paint();frame();},32);
    }
    return {
      start(){if(destroyed||running||finished)return;if(motionOff()){finish();return;}running=true;last=performance.now();paint();frame();},
      finish,
      render(target){host=target;if(root){root.dataset.static=String(motionOff());host.append(root);paint(true);return root;}root=node('section','swl-podium');root.dataset.teams=String(entries.length);root.dataset.static=String(motionOff());root.setAttribute('aria-label','Team results podium');labels.clear();scores.clear();details.clear();cardNodes.clear();burst=null;
        caption=node('p','swl-podium-caption');root.append(caption);const row=node('div','swl-podium-row');
        const placement=entries.length>3?{4:0,2:1,1:2,3:3,5:4}:{2:0,1:1,3:2};const order=entries.slice().sort((a,b)=>(placement[a.rank]-placement[b.rank])||a.id.localeCompare(b.id));
        order.forEach(entry=>{const card=node('article','swl-podium-place');card.dataset.place=String(entry.rank);card.style.setProperty('--squad-color',entry.color);card.append(node('span','swl-podium-medal',entry.rank===1?'♛':entry.rank===2?'✦':'◇'));const name=node('h3','swl-podium-name'),value=node('b','swl-podium-value'),detail=node('span','swl-podium-detail');labels.set(entry.id,name);scores.set(entry.id,value);details.set(entry.id,detail);cardNodes.set(entry.id,card);card.append(name,value,node('span','swl-podium-unit',entry.unit),detail,node('span','swl-podium-rank',ordinal(entry.rank)));row.append(card);});root.append(row);const skip=node('button','swl-podium-skip','Show results now');skip.type='button';skip.dataset.podiumSkip='true';skip.addEventListener('click',()=>finish());root.append(skip);live=node('p','swl-podium-live');live.setAttribute('role','status');live.setAttribute('aria-live','polite');root.append(live);host.append(root);paint(true);return root;},
      destroy(){destroyed=true;cancel();running=false;host=root=null;},
      getState(){return {finished,running,elapsed,duration,revealedRanks:[...revealed].sort((a,b)=>b-a)};}
    };
  }
  window.SWLShuffleShowcase=Object.freeze({levels:LEVELS,poolFor,difficultyView,teamCountView,createPodium});
})();

