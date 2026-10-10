(() => {
  'use strict';
  let root, options, current = null, active = false, lobby, arena, stage, title;
  const mounted = new Map();
  const descriptions = [
    {id:'wheel',name:'Conditioning wheel',tag:'Whole squad',description:'Work the wheel down together. Good rounds remove a challenge, okay rounds halve it, and a round that needs work adds another.',module:'SWLWheel',art:'wheel'},
    {id:'team',name:'Team Challenge',tag:'2–4 teams',description:'48 focused floor challenges. Match your timing, link skills and build clean team sequences.',module:'SWLTeam',art:'team'},
    {id:'shuffle',name:'Skill Shuffle',tag:'2 teams · skill quality',description:'The next gymnast steps up. Shuffle an app skill, perform it, then earn one, two or three stars.',module:'SWLSkillShuffle',art:'shuffle'},
    {id:'letters',name:'Letter Duel',tag:'2 teams · quick thinking',description:'One big letter. Find a gymnastics skill that starts with it and perform it to win a point.',module:'SWLLetterDuel',art:'letters'},
    {id:'stick',name:'Stick & Bank',tag:'2 teams · landings',description:'Stick the landing to build your pot. Bank the points, or risk another clean landing. First to ten wins.',module:'SWLStickBank',art:'stick'},
    {id:'hold',name:'Hold the Line',tag:'2 teams · conditioning',description:'Same hold. Same ten seconds. Both teams take a turn; the cleanest shapes earn the most points.',module:'SWLHoldLine',art:'hold'}
  ];
  function node(tag, className, text) { const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
  function art(type) {
    const marks={
      shuffle:'<rect x="29" y="37" width="105" height="131" rx="15" transform="rotate(-12 81 102)" fill="#bd9bff25" stroke="#bd9bff55"/><rect x="66" y="26" width="105" height="140" rx="15" transform="rotate(9 118 96)" fill="#272238" stroke="#bd9bff" stroke-width="2"/><path d="m117 58 10 22 24 3-17 17 4 24-21-11-21 11 4-24-17-17 24-3z" fill="#bd9bff"/><path d="M92 142h48" stroke="#f7f5fc" stroke-width="5" stroke-linecap="round"/>',
      letters:'<rect x="31" y="29" width="138" height="142" rx="24" fill="#21322e" stroke="#9ce8cf70" stroke-width="2"/><text x="100" y="135" text-anchor="middle" fill="#9ce8cf" font-size="104" font-family="system-ui" font-weight="850">A</text><path d="M160 14v20m-10-10h20" stroke="#f5c87d" stroke-width="3"/>',
      stick:'<ellipse cx="100" cy="153" rx="76" ry="23" fill="#f5c87d12" stroke="#f5c87d60" stroke-width="2"/><ellipse cx="100" cy="153" rx="48" ry="12" fill="none" stroke="#f5c87d50"/><circle cx="100" cy="42" r="13" fill="#f5c87d"/><path d="M100 59v49m0-34L63 58m37 16 37-16m-37 50-20 41m20-41 20 41" stroke="#f5c87d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
      hold:'<circle cx="100" cy="108" r="69" fill="#253223" stroke="#d5fa7070" stroke-width="3"/><path d="M100 39a69 69 0 0 1 60 103" fill="none" stroke="#d5fa70" stroke-width="9" stroke-linecap="round"/><path d="M83 16h34m-17 0v18" stroke="#d5fa70" stroke-width="7" stroke-linecap="round"/><text x="100" y="126" text-anchor="middle" fill="#d5fa70" font-size="52" font-family="system-ui" font-weight="850">10</text>'
    };
    if(marks[type])return '<svg viewBox="0 0 200 200" fill="none" aria-hidden="true">'+marks[type]+'</svg>';
    if(type==='wheel')return '<svg viewBox="0 0 200 200" fill="none" aria-hidden="true"><circle cx="100" cy="106" r="74" fill="#171e15" stroke="#d5fa7030" stroke-width="2"/><g stroke="#14151b" stroke-width="3"><path d="M100 106V33A73 73 0 0 1 163 70Z" fill="#d5fa70"/><path d="M100 106L163 70A73 73 0 0 1 163 142Z" fill="#3d5140"/><path d="M100 106L163 142A73 73 0 0 1 100 179Z" fill="#bd9bff"/><path d="M100 106V179A73 73 0 0 1 37 142Z" fill="#f4c97f"/><path d="M100 106L37 142A73 73 0 0 1 37 70Z" fill="#738d4d"/><path d="M100 106L37 70A73 73 0 0 1 100 33Z" fill="#66567c"/></g><circle cx="100" cy="106" r="19" fill="#151a12" stroke="#e0fbb4" stroke-width="2"/><path d="M105 94L95 108h9l-7 12" stroke="#d5fa70" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M91 20h18l-9 20Z" fill="#f7f5fc"/><circle cx="174" cy="33" r="3" fill="#d5fa70"/><path d="M22 38v12m-6-6h12" stroke="#bd9bff" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M15 157h170" stroke="#f5c87d30" stroke-width="2"/><rect x="27" y="106" width="48" height="50" rx="10" fill="#bd9bff30" stroke="#bd9bff60"/><rect x="78" y="74" width="48" height="82" rx="10" fill="#f5c87d30" stroke="#f5c87d90"/><rect x="129" y="120" width="48" height="36" rx="10" fill="#d5fa7020" stroke="#d5fa7050"/><path d="M103 17l8 15 16 3-12 12 3 17-15-8-15 8 3-17-12-12 17-3Z" fill="#f5c87d"/><circle cx="51" cy="84" r="11" fill="#bd9bff"/><circle cx="153" cy="98" r="11" fill="#d5fa70"/><path d="M38 27v12m-6-6h12M167 49v12m-6-6h12" stroke="#f5c87d" stroke-width="2"/></svg>';
  }
  function moduleFor(id) { return window[descriptions.find(x=>x.id===id)?.module]; }
  function showLobby() {
    if(current)moduleFor(current)?.deactivate();
    current=null;lobby.hidden=false;arena.hidden=true;
    mounted.forEach(el=>{el.hidden=true;});
    root.querySelector('.game-card-play')?.focus({preventScroll:true});
  }
  function openGame(id) {
    const info=descriptions.find(x=>x.id===id);if(!info||!active)return;
    if(current&&current!==id)moduleFor(current)?.deactivate();
    const gameModule=moduleFor(id);if(!gameModule?.mount)return;
    if(!mounted.has(id)) {const host=node('div','game-stage');host.id='game-'+id;stage.append(host);mounted.set(id,host);}
    current=id;lobby.hidden=true;arena.hidden=false;title.textContent=info.name;
    mounted.forEach((el,key)=>{el.hidden=key!==id;});
    gameModule.mount(mounted.get(id),options);
    arena.querySelector('.games-back').focus({preventScroll:true});
    root.scrollIntoView({behavior:options.motionOff?.()?'instant':'smooth',block:'start'});
  }
  function mount(container, config={}) {
    if(root===container)return;root=container;options=config;root.classList.add('games-shell');
    lobby=node('div','games-lobby');const head=node('div','games-heading'),heading=node('div');
    heading.append(node('p','games-kicker','SWL Squad Training'),node('h1','','Squad games'));
    head.append(heading,node('p','games-intro','Six ways to train together. Clean skills, stuck landings, strong shapes and a little competition. You coach. The screen keeps score.'));
    const cards=node('div','games-grid');
    descriptions.forEach((info,index)=>{
      const card=node('article','game-card game-card--'+info.id),top=node('div','game-card-top');
      top.append(node('span','',String(index+1).padStart(2,'0')),node('span','game-card-tag',info.tag));
      const visual=node('div','game-card-art');visual.innerHTML=art(info.art);
      const play=node('button','game-card-play');play.type='button';play.setAttribute('aria-label','Play '+info.name);
      play.append(node('span','','Let’s play'),node('span','','↗'));play.addEventListener('click',()=>openGame(info.id));
      card.append(top,visual,node('h2','',info.name),node('p','game-card-desc',info.description),play);cards.append(card);
    });
    const note=node('p','games-note');note.append(node('span','','✧'),node('span','','Game scores are just for this session. Your Skill League points stay the same.'));
    lobby.append(head,cards,note);
    arena=node('div','games-arena');arena.hidden=true;const bar=node('div','games-toolbar'),back=node('button','quiet games-back','← All games');back.type='button';back.addEventListener('click',showLobby);title=node('span','games-session-label');bar.append(back,title);stage=node('div','games-stage');arena.append(bar,stage);root.append(lobby,arena);
  }
  function setActive(value) {
    active=Boolean(value);
    if(current) {
      if(active)moduleFor(current)?.mount(mounted.get(current),options);
      else moduleFor(current)?.deactivate();
    }
  }
  window.SWLGames=Object.freeze({mount,setActive,get current(){return current;}});
})();
