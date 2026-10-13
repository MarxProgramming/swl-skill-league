(() => {
  'use strict';
  let root, options, current = null, active = false, lobby, arena, stage, title, cards, ratingsApi, ratingsSummary = {}, pendingCount = 0, sortMode = 'hottest', liveRating, livePlays, liveHot;
  const sortButtons = [];
  const ratingButtons = [];
  const mounted = new Map();
  const descriptions = [
    {id:'wheel',name:'Conditioning wheel',tag:'Whole squad',description:'Work the wheel down together. Good rounds remove a challenge, okay rounds halve it, and a round that needs work adds another.',module:'SWLWheel',art:'wheel'},
    {id:'team',name:'Team Challenge',tag:'2–4 teams',description:'Four rounds of floor shapes, jumps to stick, conditioning and coaching impressions. Ten seconds to meet each challenge.',module:'SWLTeam',art:'team'},
    {id:'shuffle',name:'Skill Shuffle',tag:'2–3 teams · skill quality',description:'Set your team sizes so everyone gets a turn. Shuffle an app skill, perform it, then earn one, two or three stars.',module:'SWLSkillShuffle',art:'shuffle'},
    {id:'letters',name:'Letter Duel',tag:'2 teams · quick thinking',description:'One big letter. Find a gymnastics skill that starts with it and perform it to win a point.',module:'SWLLetterDuel',art:'letters'},
    {id:'handstand',name:'Handstand Timer',tag:'2–3 teams · against the clock',description:'Individual turns or whole-group rounds. Bank your team’s seconds; in Group mode, the last gymnast down sits out the next round.',module:'SWLHandstand',art:'handstand'},
    {id:'addon',name:'Add-On',tag:'2–3 teams · build a routine',description:'Start with one skill. Shuffle three choices, pick the next addition and grow your team’s routine. Earn stars for how well it flows.',module:'SWLAddOn',art:'relay'},
    {id:'relayrace',name:'Conditioning Relay',tag:'2–3 teams · pace & teamwork',description:'One team, one clock, everyone through the line. Tap each handover; the screen tracks every split and the team’s average time.',module:'SWLConditioningRelay',art:'relayrace'},
    {id:'timesense',name:'Time Sense',tag:'2–3 teams · trust your timing',description:'Hold a balance and judge the target time with the clock hidden. Stop when you think you’ve hit it. Closest estimates win.',module:'SWLTimeSense',art:'timesense'}
  ];
  function node(tag, className, text) { const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
  function art(type) {
    const marks={
      handstand:'<circle cx="100" cy="105" r="73" stroke="#9ce8cf30" stroke-width="2"/><circle cx="100" cy="136" r="10" fill="#9ce8cf"/><path d="M100 121V80m0 0L88 32m12 48 12-48M99 113 81 164m20-51 18 51M72 165h17m22 0h17" stroke="#9ce8cf" stroke-width="8" stroke-linecap="round"/><path d="M161 33v25m-8-17 8-8 8 8" stroke="#f5c87d" stroke-width="3"/>',
      relayrace:'<circle cx="100" cy="105" r="64" stroke="#f5c87d" stroke-width="5"/><path d="M100 105 129 80M85 23h30m-15 0v17m50 14 12-12" stroke="#f5c87d" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="105" r="7" fill="#f5c87d"/><path d="M26 161h41m-26 13h37" stroke="#bd9bff" stroke-width="4" stroke-linecap="round"/>',
      timesense:'<circle cx="100" cy="100" r="71" fill="#bd9bff12" stroke="#bd9bff65" stroke-width="2" stroke-dasharray="2 12"/><path d="M100 40v11m0 98v11M40 100h11m98 0h11" stroke="#bd9bff" stroke-width="4"/><text x="100" y="120" text-anchor="middle" fill="#bd9bff" font-family="system-ui" font-size="58" font-weight="850">?</text><circle cx="154" cy="154" r="14" fill="#d5fa70"/><path d="m148 154 4 4 8-8" stroke="#15161d" stroke-width="3" stroke-linecap="round"/>',
      shuffle:'<rect x="29" y="37" width="105" height="131" rx="15" transform="rotate(-12 81 102)" fill="#bd9bff25" stroke="#bd9bff55"/><rect x="66" y="26" width="105" height="140" rx="15" transform="rotate(9 118 96)" fill="#272238" stroke="#bd9bff" stroke-width="2"/><path d="m117 58 10 22 24 3-17 17 4 24-21-11-21 11 4-24-17-17 24-3z" fill="#bd9bff"/><path d="M92 142h48" stroke="#f7f5fc" stroke-width="5" stroke-linecap="round"/>',
      letters:'<rect x="31" y="29" width="138" height="142" rx="24" fill="#21322e" stroke="#9ce8cf70" stroke-width="2"/><text x="100" y="135" text-anchor="middle" fill="#9ce8cf" font-size="104" font-family="system-ui" font-weight="850">A</text><path d="M160 14v20m-10-10h20" stroke="#f5c87d" stroke-width="3"/>',
      relay:'<rect x="13" y="65" width="47" height="70" rx="12" fill="#f5c87d22" stroke="#f5c87d"/><rect x="77" y="42" width="47" height="70" rx="12" fill="#bd9bff22" stroke="#bd9bff"/><rect x="140" y="65" width="47" height="70" rx="12" fill="#9ce8cf22" stroke="#9ce8cf"/><path d="m58 94 17-17m47 0 17 17" stroke="#f5f0e0" stroke-width="3" stroke-linecap="round"/><text x="37" y="111" text-anchor="middle" fill="#f5c87d" font-size="28" font-family="system-ui" font-weight="800">1</text><text x="100" y="88" text-anchor="middle" fill="#bd9bff" font-size="28" font-family="system-ui" font-weight="800">2</text><text x="164" y="111" text-anchor="middle" fill="#9ce8cf" font-size="28" font-family="system-ui" font-weight="800">3</text><path d="M43 160h114" stroke="#f5c87d60" stroke-width="3" stroke-linecap="round"/>'
    };
    if(marks[type])return '<svg viewBox="0 0 200 200" fill="none" aria-hidden="true">'+marks[type]+'</svg>';
    if(type==='wheel')return '<svg viewBox="0 0 200 200" fill="none" aria-hidden="true"><circle cx="100" cy="106" r="74" fill="#171e15" stroke="#d5fa7030" stroke-width="2"/><g stroke="#14151b" stroke-width="3"><path d="M100 106V33A73 73 0 0 1 163 70Z" fill="#d5fa70"/><path d="M100 106L163 70A73 73 0 0 1 163 142Z" fill="#3d5140"/><path d="M100 106L163 142A73 73 0 0 1 100 179Z" fill="#bd9bff"/><path d="M100 106V179A73 73 0 0 1 37 142Z" fill="#f4c97f"/><path d="M100 106L37 142A73 73 0 0 1 37 70Z" fill="#738d4d"/><path d="M100 106L37 70A73 73 0 0 1 100 33Z" fill="#66567c"/></g><circle cx="100" cy="106" r="19" fill="#151a12" stroke="#e0fbb4" stroke-width="2"/><path d="M105 94L95 108h9l-7 12" stroke="#d5fa70" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M91 20h18l-9 20Z" fill="#f7f5fc"/><circle cx="174" cy="33" r="3" fill="#d5fa70"/><path d="M22 38v12m-6-6h12" stroke="#bd9bff" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M15 157h170" stroke="#f5c87d30" stroke-width="2"/><rect x="27" y="106" width="48" height="50" rx="10" fill="#bd9bff30" stroke="#bd9bff60"/><rect x="78" y="74" width="48" height="82" rx="10" fill="#f5c87d30" stroke="#f5c87d90"/><rect x="129" y="120" width="48" height="36" rx="10" fill="#d5fa7020" stroke="#d5fa7050"/><path d="M103 17l8 15 16 3-12 12 3 17-15-8-15 8 3-17-12-12 17-3Z" fill="#f5c87d"/><circle cx="51" cy="84" r="11" fill="#bd9bff"/><circle cx="153" cy="98" r="11" fill="#d5fa70"/><path d="M38 27v12m-6-6h12M167 49v12m-6-6h12" stroke="#f5c87d" stroke-width="2"/></svg>';
  }
  function moduleFor(id) { return window[descriptions.find(x=>x.id===id)?.module]; }
  function showLobby() {
    if(current)moduleFor(current)?.deactivate();
    current=null;ratingsApi?.setContext(null);lobby.hidden=false;arena.hidden=true;renderCards();
    mounted.forEach(el=>{el.hidden=true;});
    root.querySelector('.game-card-play')?.focus({preventScroll:true});
  }
  function openGame(id) {
    const info=descriptions.find(x=>x.id===id);if(!info||!active)return;
    if(current&&current!==id)moduleFor(current)?.deactivate();
    const gameModule=moduleFor(id);if(!gameModule?.mount)return;
    if(!mounted.has(id)) {const host=node('div','game-stage');host.id='game-'+id;stage.append(host);mounted.set(id,host);}
    current=id;ratingsApi?.setContext(id);lobby.hidden=true;arena.hidden=false;title.textContent=info.name;updateGameStats();
    mounted.forEach((el,key)=>{el.hidden=key!==id;});
    gameModule.mount(mounted.get(id),options);
    arena.querySelector('.games-back').focus({preventScroll:true});
    root.scrollIntoView({behavior:options.motionOff?.()?'instant':'smooth',block:'start'});
  }
  function average(id){const rating=ratingsSummary[id];return rating?.votes?rating.sum/rating.votes:-1;}
  function hottestId(){const rated=descriptions.filter(info=>ratingsSummary[info.id]?.votes);return rated.sort((a,b)=>average(b.id)-average(a.id)||(ratingsSummary[b.id].votes-ratingsSummary[a.id].votes))[0]?.id||null;}
  function rankedGames(){return descriptions.slice().sort((a,b)=>sortMode==='played'?(ratingsSummary[b.id]?.plays||0)-(ratingsSummary[a.id]?.plays||0)||average(b.id)-average(a.id):average(b.id)-average(a.id)||(ratingsSummary[b.id]?.votes||0)-(ratingsSummary[a.id]?.votes||0));}
  function ratingLabel(id){const rating=ratingsSummary[id];return rating?.votes?`★ ${(rating.sum/rating.votes).toFixed(1)} / 10`:'☆ Not rated yet';}
  function playLabel(id){const value=ratingsSummary[id]?.plays;return value===undefined?'Plays loading…':`${value} ${value===1?'play':'plays'}`;}
  function pauseForRating(){if(current){moduleFor(current)?.deactivate();moduleFor(current)?.mount(mounted.get(current),options);}}
  function rateGame(id){if(!active)return;pauseForRating();ratingsApi?.openForGame(id);}
  function updateGameStats(){if(!current||!liveRating)return;const info=descriptions.find(item=>item.id===current);liveRating.textContent=ratingLabel(current)+' · Rate';liveRating.setAttribute('aria-label','Rate '+info.name);livePlays.textContent=playLabel(current);livePlays.setAttribute('title','Completed or reviewed games');liveHot.hidden=hottestId()!==current;}
  function ratingButton(){const button=node('button','quiet games-pending-ratings','Finish ratings');button.type='button';button.hidden=!pendingCount;button.addEventListener('click',()=>{if(!active)return;pauseForRating();ratingsApi?.openPending();});ratingButtons.push(button);return button;}
  function renderCards(){if(!cards||ratingsApi?.getState().current)return;const focused=document.activeElement?.closest?.('[data-game-id]')?.dataset.gameId,focusAction=document.activeElement?.dataset.gameAction;cards.replaceChildren();
    rankedGames().forEach((info,index)=>{
      const hot=hottestId()===info.id,card=node('article','game-card game-card--'+info.id+(hot?' is-hottest':'')),top=node('div','game-card-top');
      top.append(node('span','',String(index+1).padStart(2,'0')),node('span','game-card-tag',info.tag));
      const visual=node('div','game-card-art');visual.innerHTML=art(info.art);
      const play=node('button','game-card-play');play.type='button';play.setAttribute('aria-label','Play '+info.name);
      play.dataset.gameAction='play';play.append(node('span','','Let’s play'),node('span','','↗'));play.addEventListener('click',()=>openGame(info.id));
      const rating=ratingsSummary[info.id],stats=node('div','game-card-stats'),ratingGroup=node('div','game-card-rating-group');
      const rate=node('button','game-card-rate',ratingLabel(info.id));rate.type='button';rate.dataset.gameAction='rate';rate.setAttribute('aria-label','Rate '+info.name);rate.addEventListener('click',()=>rateGame(info.id));
      ratingGroup.append(rate,node('span','game-card-votes',rating?`${rating.votes} ${rating.votes===1?'vote':'votes'}`:'Ratings loading…'));
      const plays=node('span','game-card-plays',playLabel(info.id));plays.setAttribute('title','Completed or reviewed games');stats.append(ratingGroup,plays);
      card.dataset.gameId=info.id;card.append(top,visual,node('h2','',info.name),node('p','game-card-desc',info.description),stats,play);
      if(hot){const flame=node('span','game-hottest-badge','🔥 Hottest game');flame.setAttribute('title','Highest average squad rating');card.append(flame);}
      cards.append(card);
    });
    if(focused)cards.querySelector(`[data-game-id="${focused}"] [data-game-action="${focusAction||'play'}"]`)?.focus({preventScroll:true});
  }
  function mount(container, config={}) {
    if(root===container)return;root=container;options={...config,onComplete:details=>ratingsApi?.complete(details)};root.classList.add('games-shell');root.addEventListener('click',()=>ratingsApi?.cancelPrompt(),true);
    lobby=node('div','games-lobby');const head=node('div','games-heading'),heading=node('div');
    heading.append(node('p','games-kicker','SWL Squad Training'),node('h1','','Squad games'));
    head.append(heading,node('p','games-intro','Eight ways to train together. Clean skills, teamwork, conditioning and a little competition. You coach. The screen keeps score.'));
    cards=node('div','games-grid');renderCards();
    const note=node('p','games-note');note.append(node('span','','✧'),node('span','','Game scores are just for this session. Your Skill League points stay the same.'));
    const ratingBar=node('div','games-rating-bar'),sorts=node('div','games-sort');sorts.setAttribute('role','group');sorts.setAttribute('aria-label','Sort games');
    [['hottest','🔥 Hottest'],['played','↻ Most played']].forEach(([value,label])=>{const button=node('button','games-sort-button',label);button.type='button';button.dataset.gameSort=value;button.setAttribute('aria-pressed',String(sortMode===value));button.addEventListener('click',()=>{if(!active)return;sortMode=value;sortButtons.forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.gameSort===sortMode)));renderCards();});sortButtons.push(button);sorts.append(button);});
    ratingBar.append(sorts,node('span','games-sort-note','Class ratings · games played'),ratingButton());
    lobby.append(head,ratingBar,cards,note);
    arena=node('div','games-arena');arena.hidden=true;const bar=node('div','games-toolbar'),back=node('button','quiet games-back','← All games');back.type='button';back.addEventListener('click',showLobby);title=node('span','games-session-label');liveRating=node('button','quiet games-live-rating','☆ Rate this game');liveRating.type='button';liveRating.addEventListener('click',()=>rateGame(current));livePlays=node('span','games-live-plays');liveHot=node('span','games-live-hot','🔥 Hottest game');liveHot.hidden=true;
    bar.append(back,title,liveHot,livePlays,liveRating,ratingButton());stage=node('div','games-stage');arena.append(bar,stage);root.append(lobby,arena);
    if(window.SWLGameRatings&&typeof config.requestRatings==='function')ratingsApi=window.SWLGameRatings.create({games:descriptions,request:config.requestRatings,onChange:(summary,pending)=>{ratingsSummary=summary;pendingCount=pending;ratingButtons.forEach(button=>{button.hidden=!pending;button.textContent=`Finish ratings${pending>1?' ('+pending+')':''}`;});if(!current)renderCards();else updateGameStats();config.onSaveChange?.();}});
  }
  function setActive(value) {
    active=Boolean(value);ratingsApi?.setActive(active);if(active)ratingsApi?.refresh();
    if(current) {
      if(active)moduleFor(current)?.mount(mounted.get(current),options);
      else moduleFor(current)?.deactivate();
    }
  }
  window.SWLGames=Object.freeze({mount,setActive,retrySaves:()=>ratingsApi?.flush(),getSavingState:()=>ratingsApi?.getState()||{},get current(){return current;}});
})();
