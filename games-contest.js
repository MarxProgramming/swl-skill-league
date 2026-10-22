/* Shared-skill games: numbered nominees, complete rounds and fixed-order letters. */
(() => {
  'use strict';
  const COLORS=['#d5fa70','#bd9bff','#ffd782','#83d9ff','#ffafcb'], NAMES=['Mint','Purple','Gold','Sky','Rose'];
  const TITLES={shuffle:'Skill Shuffle',letters:'Letter Duel',stickit:'Stick It'};
  const LANDINGS=[
    ['straight','Straight jump','base'],['tuck','Tuck jump','base'],['star','Star jump','base'],['half','Half turn jump','base'],['full','Full turn jump','base'],['split','Split jump','base'],
    ['pike','Pike jump','upgrade'],['straddle','Straddle jump','upgrade'],['straight-tuck','Straight jump → tuck jump','upgrade'],['tuck-half','Tuck jump → half turn jump','upgrade'],['straight-full','Straight jump → full turn jump','upgrade'],['roundoff-straight','Round-off → straight jump','upgrade'],['cartwheel-straight','Cartwheel → close feet → straight jump','upgrade'],['walkover-half','Forwards walkover → close feet → half turn jump','upgrade'],
    ['one-half','1½ turn jump','pro'],['roundoff-tuck','Round-off → tuck jump','pro'],['roundoff-half','Round-off → half turn jump','pro'],['walkover-straight','Backwards walkover → close feet → straight jump','pro'],['flick-straight','Flick → straight jump','pro'],['pike-half','Pike jump → half turn jump','pro']
  ].map(([id,label,tier])=>({id:'stick-'+id,label,category:'landings',tier}));
  const START=2, TARGET=26, GAP=12;
  const node=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
  const clean=v=>Array.from(String(v||'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim()).slice(0,24).join('');
  const integer=(v,max=20)=>String(v).trim()&&Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=max?Number(v):null;
  function random(max){try{const a=new Uint32Array(1),limit=0x100000000-0x100000000%max;for(let i=0;i<8;i++){window.crypto.getRandomValues(a);if(a[0]<limit)return a[0]%max;}}catch(_){}return Math.floor(Math.random()*max);}
  function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  let sequence=0;
  function session(id){try{if(window.crypto?.randomUUID)return id+'-'+window.crypto.randomUUID();}catch(_){}return `${id}-${Date.now().toString(36)}-${++sequence}-${random(0x100000000).toString(36)}`;}
  function catalogue(value){const seen=new Set();return (Array.isArray(value)?value:[]).filter(s=>s&&typeof s.id==='string'&&s.id.trim()&&typeof s.label==='string'&&s.label.trim()&&!seen.has(s.id)&&seen.add(s.id)).map(s=>({id:s.id,label:s.label.trim(),category:s.category||'',tier:s.tier||''}));}
  function letters(skills){
    const map=new Map(),extra=['Arabesque balance','Jumping jack','Leap','Pike jump','Pike shape','Round-off','Roll','Tuck jump','Walkover'];
    [...skills,...extra.map((label,i)=>({id:'hint-'+i,label}))].forEach(s=>{const letter=s.label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z]/i)?.[0].toUpperCase();if(!letter)return;if(!map.has(letter))map.set(letter,[]);if(!map.get(letter).includes(s.label))map.get(letter).push(s.label);});
    return [...map].map(([label,matches])=>({id:label,label,matches}));
  }
  function create(container,supplied,id){
    const letter=id==='letters',stick=id==='stickit',title=TITLES[id],duration=letter?1300:4000;
    let options=supplied,skills=stick?LANDINGS:catalogue(options.skills),difficulty=stick?'easy':'hard',pool=[],bag=[],previous='';
    let phase='setup',active=true,destroyed=false,names=NAMES.slice(),sizes=NAMES.map(()=>'4'),teamCount=3,rounds='2';
    let teams=[],round=0,turn=0,nominees=[],selected=null,winner=null,remaining=duration,lastTime=0,podium=null;
    let sessionId=null,completionSent=false,resetPrompt=false,error='',status='',hints=false,sticks=[],banked=[];
    let root,stage,reel,track,cards=[],boundary=START,reelWidth=360,cardWidth=223.2,offset=0;
    let timer=null,timerGeneration=0,renderGeneration=0,ownsImmersive=false,letterPreview='';
    const motionOff=()=>{try{return !!(typeof options.motionOff==='function'?options.motionOff():options.motionOff)||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}catch(_){return true;}};
    const sound=cue=>{try{options.playSound?.(cue);}catch(_){}};
    const immersive=()=>active&&!destroyed&&phase!=='setup';
    const roundSize=()=>stick?1:Math.max(0,...teams.map(t=>t.size));
    const total=()=>teams.reduce((n,t)=>n+t.size,0)*Number(rounds);
    const completed=()=>teams.reduce((n,t)=>n+t.turns,0);
    const participates=i=>stick||turn<teams[i].size;
    const canAward=()=>teams.every((t,i)=>!participates(i)||Number.isInteger(nominees[i])&&!t.used.includes(nominees[i]));
    const lastTurn=()=>round+1===Number(rounds)&&turn+1===roundSize();
    function refreshPool(){pool=letter?letters(skills):window.SWLShuffleShowcase.poolFor(skills,difficulty);bag=[];previous='';}
    refreshPool();
    function cancelTimer(){timerGeneration++;clearTimeout(timer);timer=null;}
    function updateLayout(){
      if(!immersive()){if(ownsImmersive){document.body?.classList.remove('swl-shuffle-playing');document.body?.style.removeProperty('--swl-shuffle-header-bottom');document.body?.style.removeProperty('--swl-shuffle-bottom-space');ownsImmersive=false;}return;}
      document.body?.classList.add('swl-shuffle-playing');ownsImmersive=true;
      const viewport=window.visualViewport,top=Math.max(0,Number(viewport?.offsetTop)||0),height=Number(viewport?.height)||window.innerHeight||768,bottom=top+height;
      const header=document.querySelector?.('.header')?.getBoundingClientRect?.(),headerBottom=Math.max(top,Number(header?.bottom)||76),nav=document.querySelector?.('.nav')?.getBoundingClientRect?.();
      const bottomNav=nav&&nav.height>0&&nav.top>headerBottom+48&&nav.top>top+height/2;
      const playBottom=Math.min(bottom-10,bottomNav?nav.top-8:bottom-10),playTop=headerBottom+48,playHeight=Math.max(100,playBottom-playTop);
      document.body.style.setProperty('--swl-shuffle-header-bottom',`${headerBottom}px`);document.body.style.setProperty('--swl-shuffle-bottom-space',`${Math.max(0,bottom-playBottom)}px`);
      root?.style.setProperty('--swl-shuffle-play-top',`${playTop}px`);root?.style.setProperty('--swl-shuffle-play-height',`${playHeight}px`);root?.style.setProperty('--swl-shuffle-card-font',`${Math.max(12,Math.min(29,playHeight*.052))}px`);
      if(root)root.dataset.fit=playHeight<330?'short':playHeight<460?'compact':'roomy';
    }
    function button(label,action,cls='swl-skill-text-button',disabled=false){const e=node('button',cls,label),generation=renderGeneration;e.type='button';e.disabled=disabled;e.dataset.contestAction=action;e.addEventListener('click',()=>{if(generation===renderGeneration&&!e.disabled)perform(action);});return e;}
    function nextSkill(){if(!bag.length){bag=shuffle(pool);if(bag.length>1&&bag[bag.length-1].id===previous){const j=random(bag.length-1);[bag[j],bag[bag.length-1]]=[bag[bag.length-1],bag[j]];}}const skill=bag.pop();previous=skill.id;return skill;}
    function position(){return START+(TARGET-START)*(1-Math.pow(1-Math.max(0,Math.min(1,1-remaining/duration)),4));}
    function updateReel(tick=false){if(!reel||!track)return;const width=reel.getBoundingClientRect?.().width;if(width>2)reelWidth=width-2;cardWidth=Math.min(310,Math.max(174,reelWidth*.62));reel.style.setProperty('--reel-card-width',`${cardWidth}px`);const p=position(),b=Math.floor(p+.5);if(tick&&b>boundary)sound({kind:'reel-tick',progress:1-remaining/duration,remaining:remaining/1000});boundary=b;offset=reelWidth/2-cardWidth/2-p*(cardWidth+GAP);track.style.transform=`translate3d(${offset}px,0,0)`;}
    function buildReel(){cards=[];boundary=START;for(let i=0;i<32;i++){const a=pool.filter(s=>s.id!==cards[i-1]?.id&&(!(i===TARGET-1||i===TARGET+1)||s.id!==selected.id)),choices=a.length?a:pool;cards.push(i===TARGET?selected:choices[random(choices.length)]);}}
    function prepare(){
      cancelTimer();phase='ready';selected=null;winner=null;remaining=duration;cards=[];hints=false;
      nominees=teams.map((t,i)=>{if(!participates(i))return null;const available=Array.from({length:t.size},(_,n)=>n).filter(n=>!t.used.includes(n));return letter?turn:available.length===1?available[0]:null;});
      sticks=teams.map(()=>0);banked=[];
      status=`Round ${round+1} of ${rounds}. ${stick?'Everyone attempts this landing.':letter?'Next gymnast in each line.':'Choose a different gymnast for each skill.'}`;
    }
    function start(replay=false){
      if(!pool.length||(phase!=='setup'&&!(replay&&phase==='finished')))return;
      const values=sizes.slice(0,teamCount).map(v=>integer(v)),chosen=names.slice(0,teamCount).map((n,i)=>clean(n)||NAMES[i]);
      if(!integer(rounds,10)||values.some(n=>!n)){error='Use 1–20 gymnasts per team and 1–10 rounds.';render();return;}
      if(new Set(chosen.map(n=>n.toLocaleLowerCase())).size!==chosen.length){error='Give each team a different name.';render();return;}
      podium?.destroy();podium=null;teams=chosen.map((name,i)=>({name,color:COLORS[i],size:values[i],score:0,turns:0,used:[]}));
      round=turn=0;error='';resetPrompt=false;sessionId=session(id);completionSent=false;prepare();render(true);
    }
    function reveal(){cancelTimer();remaining=0;phase='revealed';status=stick?`${selected.label}. Everyone attempts it. Count each team’s stuck landings.`:letter?`${selected.label}. Gymnast ${turn+1} in each active team plays.`:`${selected.label}. Each team nominates an unused gymnast, then the coach picks the winner.`;render(true);sound({kind:'reel-reveal'});}
    function syncTime(){if(phase!=='shuffling')return;const t=performance.now();remaining=Math.max(0,remaining-Math.max(0,t-lastTime));lastTime=t;}
    function pause(){if(phase!=='shuffling')return false;syncTime();cancelTimer();phase='paused';status='Shuffle paused.';return true;}
    function frame(){cancelTimer();if(!active||destroyed||phase!=='shuffling')return;const generation=timerGeneration;timer=setTimeout(()=>{if(generation!==timerGeneration||!active||destroyed||phase!=='shuffling')return;timer=null;if(document.hidden){pause();render();return;}syncTime();if(remaining<=0||motionOff()){reveal();return;}if(letter){letterPreview=pool[random(pool.length)].label;const el=root?.querySelector('.swl-contest-letter');if(el)el.textContent=letterPreview;sound({kind:'wheel-tick'});}else updateReel(true);frame();},Math.min(letter?100:16,remaining));}
    function draw(){if(phase!=='ready'||!pool.length)return;selected=nextSkill();hints=false;phase='shuffling';remaining=duration;lastTime=performance.now();letterPreview=selected.label;if(!letter)buildReel();if(motionOff()){reveal();return;}status=letter?'Choosing a letter…':stick?'One shared landing. Everyone gets an attempt.':'One shared skill. Who will you nominate?';render(true);sound({kind:letter?'wheel-start':'reel-start'});frame();}
    function nominate(team,person){if(!active||destroyed||document.hidden||resetPrompt||phase!=='revealed'||letter||!participates(team)||!Number.isInteger(person)||person<0||person>=teams[team].size||teams[team].used.includes(person))return;nominees[team]=person;render();container.querySelector(`[data-nominee="${team}"]`)?.focus({preventScroll:true});}
    function award(index){
      if(phase!=='revealed'||!Number.isInteger(index)||index< -1||index>=teams.length||index>=0&&!participates(index)||!canAward())return;
      winner=index;if(index>=0)teams[index].score++;teams.forEach((t,i)=>{if(participates(i)){t.used.push(nominees[i]);t.turns++;}});phase='awarded';status=index<0?'No point awarded. Everyone has used this turn.':`${teams[index].name} wins one point.`;render(true);sound({kind:'award',points:index>=0?1:0,perfect:index>=0});
    }
    function bankSticks(){if(!stick||phase!=='revealed')return;banked=sticks.slice();teams.forEach((t,i)=>{t.score+=sticks[i];t.turns+=t.size;});winner=-1;phase='awarded';status='Stuck landings saved for this round.';render(true);sound({kind:'award',points:sticks.reduce((n,v)=>n+v,0),perfect:sticks.some(v=>v>0)});}
    function undo(){if(!['awarded','finished'].includes(phase)||winner===null)return;podium?.finish(true);podium?.destroy();podium=null;if(stick){teams.forEach((t,i)=>{t.score-=banked[i];t.turns-=t.size;});}else{if(winner>=0)teams[winner].score--;teams.forEach((t,i)=>{if(participates(i)){t.turns--;t.used=t.used.filter(n=>n!==nominees[i]);}});}winner=null;phase='revealed';status='Points undone. Choose again.';render(true);}
    function finish(){phase='finished';status=`${Number(rounds)} ${Number(rounds)===1?'round':'rounds'} complete.`;const entries=teams.map((t,i)=>({id:String(i),name:t.name,color:t.color,value:t.score,unit:t.score===1?'point':'points',detail:`${t.size} gymnasts · ${rounds} rounds`,rank:1+teams.filter(other=>other.score>t.score).length}));podium=window.SWLShuffleShowcase.createPodium(entries,{motionOff,sound,onDone:details=>{render(true);if(!completionSent){completionSent=true;try{options.onComplete?.({gameId:id,sessionId,participantCount:teams.reduce((n,t)=>n+t.size,0),...(details.promptRating===false?{promptRating:false}:{})});}catch(_){}}}});render(true);podium.start();}
    function next(){if(phase!=='awarded')return;if(lastTurn()){finish();return;}turn++;if(turn===roundSize()){turn=0;round++;teams.forEach(t=>t.used=[]);}prepare();render(true);}
    function reset(){podium?.finish(true);podium?.destroy();podium=null;cancelTimer();phase='setup';teams=[];round=turn=0;selected=winner=null;resetPrompt=false;error=status='';cards=[];sessionId=null;completionSent=false;render(true);}
    function perform(action){
      if(!active||destroyed||document.hidden)return;
      if(resetPrompt){if(action==='confirm-reset')reset();else if(action==='cancel-reset'){resetPrompt=false;render(true);}return;}
      if(phase==='setup'){
        if(/^teams-[2-5]$/.test(action)){teamCount=Number(action.slice(-1));error='';render();return;}
        const size=action.match(/^size-(\d)-(less|more)$/);if(size&&Number(size[1])<teamCount){const i=Number(size[1]);sizes[i]=String(Math.max(1,Math.min(20,(integer(sizes[i])||4)+(size[2]==='less'?-1:1))));error='';render(false,action);return;}
        if(action==='rounds-less'||action==='rounds-more'){rounds=String(Math.max(1,Math.min(10,(integer(rounds,10)||2)+(action==='rounds-less'?-1:1))));error='';render(false,action);return;}
        if(action.startsWith('difficulty-')&&!letter){const v=action.slice(11);if(window.SWLShuffleShowcase.levels.some(l=>l.id===v)){difficulty=v;refreshPool();render();container.querySelector(`[data-difficulty="${v}"]`)?.focus();}return;}
      }
      if(action==='start-game')start();else if(action==='draw')draw();else if(action==='redraw'&&phase==='revealed'){if(stick)sticks=teams.map(()=>0);phase='ready';draw();}
      else if(action==='pause'&&pause())render(true);else if(action==='resume'&&phase==='paused'){phase='shuffling';lastTime=performance.now();if(motionOff()||remaining<=0)reveal();else{render(true);frame();}}
      else if(action.startsWith('point-'))award(Number(action.slice(6)));else if(action==='no-point')award(-1);else if(action==='next')next();else if(action==='undo')undo();else if(action==='replay')start(true);
      else if(action==='bank-sticks')bankSticks();
      else if(stick&&phase==='revealed'&&/^sticks-\d-(less|more)$/.test(action)){const [,i,change]=action.split('-');sticks[Number(i)]=Math.max(0,Math.min(teams[Number(i)].size,sticks[Number(i)]+(change==='more'?1:-1)));render(false,action);if(change==='more')sound({kind:'award',points:1});}
      else if(action==='hint'&&letter&&phase==='revealed'){hints=!hints;render(false,'hint');}
      else if(action==='reset'){if(phase==='setup'||phase==='finished')reset();else{pause();resetPrompt=true;render(true);}}
    }
    function numberField(label,value,key,max=20){const wrap=node('div','swl-skill-size'),stepper=node('div','swl-skill-stepper'),input=node('input');wrap.append(node('span','',label));input.type='number';input.min='1';input.max=String(max);input.step='1';input.inputMode='numeric';input.value=value;input.setAttribute('aria-label',label);input.dataset.contestCount=key;input.addEventListener('input',()=>{if(phase==='setup'&&active&&!destroyed){if(key==='rounds')rounds=input.value;else sizes[Number(key)]=input.value;}});const prefix=key==='rounds'?'rounds':'size-'+key,less=button('−',prefix+'-less','swl-skill-step'),more=button('+',prefix+'-more','swl-skill-step');less.setAttribute('aria-label','Fewer '+label.toLowerCase());more.setAttribute('aria-label','More '+label.toLowerCase());stepper.append(less,input,more);wrap.append(stepper);return wrap;}
    function setupView(){
      const grid=node('div','swl-skill-setup-grid'),panel=node('section','swl-skill-setup');panel.append(node('p','swl-skill-kicker',`${pool.length} ${letter?'LETTERS':'SKILLS'} · EVERY TEAM PLAYS`),node('h3','','Set up your teams'),node('p','swl-skill-muted',stick?'One shared landing challenge per round. Every gymnast attempts it once.':'Choose team sizes and rounds. One round gives every gymnast one turn.'));
      panel.append(window.SWLShuffleShowcase.teamCountView(teamCount,5,v=>perform(`teams-${v}`),`Number of ${title} teams`));
      if(!letter){const gen=renderGeneration;const picker=window.SWLShuffleShowcase.difficultyView(difficulty,skills,v=>{if(gen===renderGeneration)perform('difficulty-'+v);});if(stick){picker.querySelectorAll('.swl-shuffle-difficulty-button').forEach((b,i)=>{b.querySelector('span').textContent=['Single jumps to stick','More jumps + simple combinations','All landings + harder combinations'][i];});}panel.append(picker);}
      const fields=node('div','swl-contest-team-fields');names.slice(0,teamCount).forEach((name,i)=>{const row=node('div','swl-skill-team-fields'),label=node('label','swl-skill-name'),input=node('input');row.style.setProperty('--squad-color',COLORS[i]);label.append(node('span','',`Team ${i+1}`));input.type='text';input.value=name;input.maxLength=24;input.autocomplete='off';input.dataset.contestName=String(i);input.setAttribute('aria-label',`${title} team ${i+1} name`);input.addEventListener('input',()=>{if(phase==='setup'&&active&&!destroyed)names[i]=input.value;});label.append(input);row.append(label,numberField(`Team ${i+1} gymnasts`,sizes[i],String(i)));fields.append(row);});panel.append(fields,numberField('Rounds',rounds,'rounds',10));
      const alert=node('p','swl-skill-error',pool.length?error:'The skill list has not loaded yet.');alert.setAttribute('role','alert');panel.append(alert,button('Start game ↗','start-game','swl-skill-button swl-skill-primary',!pool.length));
      if(stick){const rules=node('aside','swl-skill-rules');rules.append(node('span','swl-skill-rule-icon','✓'),node('h3','','Everyone tries. Every stick counts.'));const list=node('ol','swl-draft-rules');['Shuffle one landing challenge for all teams.','Every gymnast has one attempt. Stick the final landing: feet together, no extra step.','Use + and − to record how many gymnasts stuck it in each team.','Each stuck landing earns 1 point. Save the round, then shuffle again.','After your chosen rounds, the team with the most points wins.'].forEach(s=>list.append(node('li','',s)));rules.append(list,node('p','swl-skill-muted','Only draw skills suitable for the group. Coach can redraw before anyone attempts. No somersaults; combinations finish with a jump to stick.'),node('p','swl-skill-session-note','Game points stay here. Skill League marks and points stay the same.'));grid.append(panel,rules);root.append(grid);return;}
      const rules=node('aside','swl-skill-rules');rules.append(node('span','swl-skill-rule-icon',letter?'A↗':'↝'),node('h3','',letter?'Stay in your line.':'Pick your representative.'));
      const list=node('ol','swl-draft-rules');(letter?['Line up each team in an order.','Draw a letter. The next gymnast in each line performs a skill beginning with it.','Tap the winning team for 1 point.','Everyone takes one turn each round, then the lines start again.']:['Give each gymnast a number within their team.','Shuffle one skill for all teams.','Each team nominates someone who has not played this round. Select their number.','Tap the team with the best attempt for 1 point.','After everyone has played, start the next round with all gymnasts available.']).forEach(s=>list.append(node('li','',s)));rules.append(list,node('p','swl-skill-muted','For example: 4 gymnasts in each team × 3 rounds = 12 shared challenges. Each gymnast has 3 turns. Smaller teams sit out after completing their turns in a round.'),node('p','swl-skill-session-note','Game points stay here. Skill League marks and points stay the same.'));grid.append(panel,rules);root.append(grid);
    }
    function scoreboard(){const board=node('div','swl-skill-board');board.dataset.teamCount=String(teams.length);board.style.setProperty('--game-teams',String(teams.length));board.setAttribute('aria-label',title+' scoreboard');teams.forEach(t=>{const item=node('div','swl-skill-score');item.style.setProperty('--squad-color',t.color);item.append(node('span','swl-skill-score-name',t.name),node('strong','',String(t.score)),node('span','swl-skill-score-compact',stick?`${t.size} gymnasts`:`${t.used.length}/${t.size} played`));board.append(item);});root.append(board);}
    function reelView(face){const frame=node('div','swl-skill-reel-frame');frame.dataset.settled=String(['revealed','awarded'].includes(phase));frame.append(node('div','swl-skill-reel-pointer'));reel=node('div','swl-skill-reel');reel.setAttribute('aria-hidden','true');track=node('div','swl-skill-reel-track');cards.forEach((s,i)=>{const card=node('div',`swl-skill-reel-card${i===TARGET&&remaining===0?' is-selected':''}`);card.dataset.skillId=s.id;card.dataset.tier=s.tier;card.append(node('span','swl-skill-reel-meta',({base:'Base',upgrade:'Upgrade',pro:'Pro'})[s.tier]||'Stick the landing'),node('b','',s.label),node('span','swl-skill-reel-symbol','◇'));track.append(card);});reel.append(track);frame.append(reel);face.append(frame,node('h3','swl-skill-reel-result',phase==='shuffling'||phase==='paused'?'Shuffling…':selected.label));}
    function awardView(){
      if(stick){const awards=node('div','swl-contest-awards swl-stick-awards');awards.style.setProperty('--game-teams',String(teams.length));teams.forEach((t,i)=>{const card=node('div','swl-contest-team');card.style.setProperty('--squad-color',t.color);card.append(node('b','swl-contest-team-name',t.name));const row=node('div','swl-stick-counter'),less=button('−',`sticks-${i}-less`,'swl-stick-step',sticks[i]===0),more=button('+',`sticks-${i}-more`,'swl-stick-step',sticks[i]===t.size);less.setAttribute('aria-label',`Remove a stuck landing for ${t.name}`);more.setAttribute('aria-label',`Add a stuck landing for ${t.name}`);row.append(less,node('b','swl-stick-count',String(sticks[i])),more);card.append(row,node('span','swl-contest-person',`of ${t.size} stuck it`));awards.append(card);});stage.append(awards);const controls=node('div','swl-skill-controls');controls.append(button('Save this round →','bank-sticks','swl-skill-button swl-skill-primary'),button('Different skill','redraw','swl-skill-text-button',sticks.some(v=>v>0)));stage.append(controls);return;}
      const awards=node('div','swl-contest-awards');awards.style.setProperty('--game-teams',String(teams.length));awards.setAttribute('aria-label','Choose the winning team');awards.setAttribute('role','group');
      teams.forEach((t,i)=>{const card=node('div','swl-contest-team');card.style.setProperty('--squad-color',t.color);card.dataset.sitting=String(!participates(i));const name=node('b','swl-contest-team-name',t.name);name.setAttribute('title',t.name);card.append(name);
        if(!participates(i))card.append(node('span','swl-contest-person','Round complete'));
        else if(letter)card.append(node('span','swl-contest-person',`Gymnast ${turn+1} / ${t.size}`));
        else{const pick=node('select'),gen=renderGeneration;pick.dataset.nominee=String(i);pick.setAttribute('aria-label',`${t.name}: nominate a gymnast`);const placeholder=node('option','','Pick gymnast');placeholder.value='';pick.append(placeholder);for(let n=0;n<t.size;n++){const option=node('option','',`Gymnast ${n+1}${t.used.includes(n)?' · used':''}`);option.value=String(n);option.disabled=t.used.includes(n);option.selected=nominees[i]===n;pick.append(option);}pick.value=nominees[i]===null?'':String(nominees[i]);pick.addEventListener('change',()=>{if(gen===renderGeneration&&pick.value!=='')nominate(i,Number(pick.value));});card.append(pick);}
        const win=button('+1 point',`point-${i}`,'swl-contest-win',!participates(i)||!canAward());win.setAttribute('aria-label',`${t.name} wins 1 point`);card.append(win);awards.append(card);
      });stage.append(awards);const help=node('p','swl-contest-award-help',canAward()?'Coach: tap the winning team.':'Choose a gymnast for each team to unlock the points.');stage.append(help);
      const extras=node('div','swl-skill-extras');extras.append(button('Tie / no point','no-point','swl-skill-text-button',!canAward()),button(letter?'Different letter':'Different skill','redraw'));if(letter)extras.append(button(hints?'Hide hints':'Hints','hint'));stage.append(extras);
      if(hints){const panel=node('div','swl-contest-hints');panel.append(button('Close hints','hint'),node('p','',selected.matches.join(' · ')));stage.append(panel);}
    }
    function playView(){
      const progress=node('div','swl-skill-progress');progress.append(node('span','',`ROUND ${round+1} / ${rounds}`),node('span','',stick?'FEET TOGETHER · HOLD THE LANDING':`${letter?'LETTER':'SKILL'} ${turn+1} / ${roundSize()} · ${completed()} / ${total()} TURNS`));root.append(progress);
      stage=node('section','swl-skill-stage');stage.tabIndex=-1;stage.style.setProperty('--squad-color',COLORS[1]);
      const face=node('div','swl-skill-face'+(selected&&!letter?' swl-skill-reel-face':''));
      if(letter&&selected){face.append(node('div','swl-contest-letter',phase==='shuffling'||phase==='paused'?letterPreview:selected.label));}
      else if(selected)reelView(face);else face.append(node('span','swl-skill-placeholder',letter?'A↗':stick?'✓':'↝'),node('h3','',letter?'Next in line, get ready.':stick?'One challenge. Everyone sticks.':'One skill. Every team.'),node('p','swl-skill-muted',letter?`Gymnast ${turn+1} in each active team plays.`:stick?'Every gymnast has one attempt at the final landing.':'Choose one unused gymnast from each team.'));stage.append(face);
      const controls=node('div','swl-skill-controls');
      if(phase==='ready')controls.append(button(letter?'Draw a letter ↝':'Shuffle the skill ↝','draw','swl-skill-button swl-skill-primary swl-skill-go'));
      else if(phase==='shuffling')controls.append(button('Pause Ⅱ','pause'));
      else if(phase==='paused')controls.append(button('Resume shuffle ▶','resume','swl-skill-button swl-skill-primary'));
      else if(phase==='awarded')controls.append(node('p','swl-skill-award-result',stick?'Round saved':winner<0?'No point this turn':`${teams[winner].name} +1 point`),button(lastTurn()?'Reveal the winners ↗':turn+1===roundSize()?'Start next round →':letter?'Next in line →':'Next skill →','next','swl-skill-button swl-skill-primary'),button('Undo points','undo'));
      if(phase==='revealed')awardView();else stage.append(controls);root.append(stage);
    }
    function finishView(){stage=node('section','swl-skill-finish swl-skill-podium-finish');stage.tabIndex=-1;podium.render(stage);if(podium.getState().finished){const controls=node('div','swl-skill-controls');controls.append(button('Play again ↝','replay','swl-skill-button swl-skill-primary'),button('Change teams','reset','swl-skill-button swl-skill-secondary'),button('Undo last point','undo'));stage.append(controls);}root.append(stage);}
    function render(focus=false,focusAction=''){
      if(destroyed)return;renderGeneration++;reel=track=stage=null;root=node('div',`swl-skill-game swl-contest-game${immersive()?' is-immersive':''}`);root.dataset.static=String(motionOff());root.dataset.phase=phase;root.dataset.mode=id;
      const heading=node('div','swl-skill-heading');heading.append(node('h2','',title));if(phase!=='setup')heading.append(button('New game','reset'));root.append(heading);
      if(phase==='setup')setupView();else if(phase==='finished')finishView();else{scoreboard();playView();}
      const live=node('p','swl-skill-live',status);live.setAttribute('role','status');live.setAttribute('aria-live','polite');root.append(live);
      if(resetPrompt){const prompt=node('div','swl-skill-reset-prompt');prompt.setAttribute('role','alertdialog');prompt.setAttribute('aria-modal','true');prompt.setAttribute('aria-label','Start a new '+title+' game?');prompt.append(node('strong','','Start a new game?'),node('p','','This clears this game’s points and turns.'),button('Keep this game','cancel-reset','swl-skill-button swl-skill-primary'),button('Clear and restart','confirm-reset','swl-skill-button swl-skill-secondary'));prompt.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();perform('cancel-reset');}else if(e.key==='Tab'){const first=prompt.querySelector('[data-contest-action="cancel-reset"]'),last=prompt.querySelector('[data-contest-action="confirm-reset"]');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});root.append(prompt);}
      container.replaceChildren(root);updateLayout();updateReel();if(focus||focusAction){const target=resetPrompt?root.querySelector('[data-contest-action="cancel-reset"]'):focusAction?root.querySelector(`[data-contest-action="${focusAction}"]`):phase==='paused'?root.querySelector('[data-contest-action="resume"]'):stage;target?.focus({preventScroll:true});}
    }
    function deactivate(){if(destroyed)return;podium?.finish(true);pause();active=false;cancelTimer();render();}
    function visibility(){if(document.hidden){podium?.finish(true);pause();cancelTimer();render();}}
    function resize(){if(active&&!destroyed&&!document.hidden){updateLayout();updateReel();}}
    document.addEventListener('visibilitychange',visibility);window.addEventListener?.('resize',resize);window.visualViewport?.addEventListener?.('resize',resize);window.visualViewport?.addEventListener?.('scroll',resize);
    const api={deactivate,activate(){if(!destroyed){active=true;render();}},get destroyed(){return destroyed;},updateOptions(next){options={...options,...next};if(!stick&&phase==='setup'&&Array.isArray(next?.skills)){const incoming=catalogue(next.skills);if(JSON.stringify(incoming)!==JSON.stringify(skills)){skills=incoming;refreshPool();}}},destroy(){if(destroyed)return;podium?.finish(true);podium?.destroy();podium=null;destroyed=true;active=false;cancelTimer();updateLayout();document.removeEventListener('visibilitychange',visibility);window.removeEventListener?.('resize',resize);window.visualViewport?.removeEventListener?.('resize',resize);window.visualViewport?.removeEventListener?.('scroll',resize);container.replaceChildren();},getState(){return {phase,active,id,difficulty,poolSize:pool.length,teamCount,rounds:Number(rounds),round:round+1,turn:turn+1,totalTurns:total(),completedTurns:completed(),teams:teams.map(t=>({...t,used:t.used.slice()})),nominees:nominees.slice(),selected:selected?{...selected}:null,winner,remainingMs:remaining,sessionId,completionSent,resetPrompt,sticks:sticks.slice(),banked:banked.slice(),podium:podium?.getState()||null,reel:cards.length?{position:position(),targetIndex:TARGET,targetId:cards[TARGET].id,width:reelWidth,cardWidth,gap:GAP,offset}:null};}};render();return api;
  }
  function moduleFor(id){let instance=null,host=null;return Object.freeze({version:4,mount(container,options={}){if(!container||typeof container.replaceChildren!=='function')throw Error('A game container is required.');if(instance&&!instance.destroyed&&host===container){instance.updateOptions(options);instance.activate();return instance;}instance?.destroy();host=container;instance=create(container,options,id);return instance;},deactivate(){instance?.deactivate();},destroy(){instance?.destroy();instance=host=null;}});}
  window.SWLSkillShuffle=moduleFor('shuffle');window.SWLLetterDuel=moduleFor('letters');window.SWLStickIt=moduleFor('stickit');
})();
