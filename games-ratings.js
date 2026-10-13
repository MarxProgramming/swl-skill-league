(() => {
  'use strict';
  const KEY='swl-game-rating-outbox-v1';
  const IDS=['wheel','team','shuffle','letters','handstand','addon','relayrace','timesense'];
  const MAX_PENDING=200,MAX_COMPLETED=500,PROMPT_DELAY=3000;
  const validId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{15,99}$/.test(value);
  const uid=()=>{try{return 'rating_'+window.crypto.randomUUID().replace(/-/g,'');}catch(_){return 'rating_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2).padEnd(16,'0');}};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const node=(tag,cls='',text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const pair=entry=>entry.gameId+'/'+entry.sessionId;
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const count=entry=>entry.counts.reduce((sum,value)=>sum+value,0);
  const validPair=value=>{if(typeof value!=='string')return false;const parts=value.split('/');return parts.length===2&&IDS.includes(parts[0])&&validId(parts[1]);};

  function create({games,request,onChange=()=>{}}) {
    if(!Array.isArray(games)||typeof request!=='function')throw TypeError('Game ratings need games and a request function.');
    const titles=new Map(games.filter(game=>game&&IDS.includes(game.id)&&typeof game.name==='string').map(game=>[game.id,game.name]));
    let queue=[],settled=[],playQueue=[],recorded=[],current=null,active=false,busy=false,playBusy=false,error='',playError='',generation=0,summary={},readEpoch=0,closed=false,focusBack=null,storageWarning=false;
    let contextGame=null,contextSession=null,promptTimer=null,promptGeneration=0;
    const rated=new Set(),completed=new Set(),errors=new Map();
    const dialog=node('dialog','game-rating-dialog');dialog.setAttribute('aria-labelledby','gameRatingTitle');document.body.append(dialog);
    const validIdentity=entry=>object(entry)&&IDS.includes(entry.gameId)&&titles.has(entry.gameId)&&validId(entry.sessionId)&&validId(entry.requestId);
    function validEntry(entry){
      return validIdentity(entry)&&Array.isArray(entry.counts)&&entry.counts.length===10&&entry.counts.every(value=>Number.isInteger(value)&&value>=0&&value<=120)&&
        Number.isInteger(entry.target)&&entry.target>=1&&entry.target<=120&&count(entry)<=entry.target&&
        (entry.sealed===undefined||typeof entry.sealed==='boolean')&&(!entry.sealed||count(entry)===entry.target);
    }
    function remember(list,key){return list.filter(value=>value!==key).concat(key).slice(-MAX_COMPLETED);}
    try {
      const raw=window.localStorage?.getItem(KEY)||'[]',stored=raw.length<=4000000?JSON.parse(raw):null;
      const supported=object(stored)&&[2,3,4].includes(stored.version);
      const entries=Array.isArray(stored)?stored:supported&&Array.isArray(stored.queue)?stored.queue:[];
      const sessions=new Set(),requests=new Set();
      entries.filter(validEntry).slice(0,MAX_PENDING).forEach(entry=>{
        if(sessions.has(pair(entry))||requests.has(entry.requestId))return;
        sessions.add(pair(entry));requests.add(entry.requestId);
        const sealed=entry.sealed===true;
        // A previously approved batch must retry unchanged. Unapproved old
        // tallies start afresh as one class choice and are never transmitted.
        const keepChoice=sealed||([3,4].includes(stored?.version)&&entry.target===1&&count(entry)<=1);
        const manual=[3,4].includes(stored?.version)&&entry.manual===true;
        // Previously sealed submissions retry under their original rules. Every
        // v3 completion already queued a play, even if its old receipt aged out.
        const countsPlay=stored?.version===4?entry.countsPlay===true:!sealed;
        const playLinked=stored?.version===4?entry.playLinked===true:stored?.version===3&&!manual;
        queue.push({gameId:entry.gameId,sessionId:entry.sessionId,requestId:entry.requestId,counts:keepChoice?entry.counts.slice():Array(10).fill(0),target:sealed?entry.target:1,sealed,manual,countsPlay,playLinked});
      });
      if(supported&&Array.isArray(stored.completed))settled=[...new Set(stored.completed.filter(validPair))].slice(-MAX_COMPLETED);
      if([3,4].includes(stored?.version)){
        const seenSessions=new Set(),seenRequests=new Set();
        if(Array.isArray(stored.plays))stored.plays.filter(validIdentity).slice(0,10000).forEach(entry=>{
          if(seenSessions.has(pair(entry))||seenRequests.has(entry.requestId))return;
          seenSessions.add(pair(entry));seenRequests.add(entry.requestId);playQueue.push({gameId:entry.gameId,sessionId:entry.sessionId,requestId:entry.requestId});
        });
        if(Array.isArray(stored.recorded))recorded=[...new Set(stored.recorded.filter(validPair))].slice(-MAX_COMPLETED);
      }
    }catch(_){}
    settled.forEach(key=>rated.add(key));queue.forEach(entry=>rated.add(pair(entry)));
    recorded.forEach(key=>completed.add(key));playQueue.forEach(entry=>completed.add(pair(entry)));
    queue.filter(entry=>entry.playLinked).forEach(entry=>completed.add(pair(entry)));
    function persist(){
      try {
        if(!window.localStorage||typeof window.localStorage.setItem!=='function')throw Error('Storage unavailable');
        window.localStorage.setItem(KEY,JSON.stringify({version:4,queue,completed:settled,plays:playQueue,recorded}));storageWarning=false;
      }catch(_){storageWarning=true;}
    }
    // Persist migrations before a reload can restore obsolete unsealed tallies.
    if(queue.length||playQueue.length||settled.length||recorded.length)persist();
    function announce(){if(!closed){try{onChange(clone(summary),queue.length);}catch(_){}}}
    function accept(payload){
      if(object(payload)&&payload.ok===false)throw Object.assign(Error('The game feedback request was not accepted.'),{code:payload.code});
      if(!object(payload)||payload.ok!==true||payload.ratingsVersion!==1||!object(payload.gameRatings))throw Error('The ratings response could not be read.');
      const result={};
      for(const id of IDS){
        const value=payload.gameRatings[id],plays=value?.plays===undefined?0:value.plays;
        if(!object(value)||!Number.isSafeInteger(value.votes)||!Number.isSafeInteger(value.sum)||!Number.isSafeInteger(value.sessions)||!Number.isSafeInteger(plays)||plays<0||plays>50000||
          value.sessions<0||value.sessions>50000||value.votes<value.sessions||value.votes>value.sessions*120||value.sum<value.votes||value.sum>value.votes*10||
          (value.votes===0?value.average!==null:typeof value.average!=='number'||!Number.isFinite(value.average)||Math.abs(value.average-value.sum/value.votes)>1e-12))throw Error('The ratings response is incomplete.');
        result[id]={votes:value.votes,sum:value.sum,average:value.votes?value.sum/value.votes:null,sessions:value.sessions,plays};
      }
      if(IDS.reduce((total,id)=>total+result[id].sessions,0)>50000||IDS.reduce((total,id)=>total+result[id].plays,0)>50000)throw Error('The ratings response is incomplete.');
      return result;
    }
    function applySummary(result){
      // Read, rating and play responses can arrive in any order. Confirmed
      // append-only totals never regress when an older snapshot arrives late.
      if(IDS.some(id=>summary[id]&&['votes','sum','sessions','plays'].some(key=>result[id][key]<summary[id][key])))return;
      summary=result;
    }
    async function refresh(){
      if(closed)return;const epoch=++readEpoch;
      try{const result=accept(await request({action:'read_game_ratings'}));if(!closed&&epoch===readEpoch){applySummary(result);if(current)render();announce();}}
      catch(_){/* Games remain playable while feedback is unavailable. */}
    }
    function button(label,action,cls='rating-button',disabled=false){
      const el=node('button',cls,label),token=generation;el.type='button';el.disabled=disabled;el.dataset.ratingAction=action;
      el.addEventListener('click',()=>{if(token===generation&&!el.disabled)perform(action);});return el;
    }
    function cancelPrompt(){promptGeneration++;clearTimeout(promptTimer);promptTimer=null;}
    function close(){
      const wasOpen=dialog.open,returnTo=focusBack;current=null;focusBack=null;error='';generation++;
      if(wasOpen)dialog.close();
      if(wasOpen&&returnTo?.isConnected!==false){try{returnTo?.focus?.({preventScroll:true});}catch(_){}}
      announce();
    }
    function open(entry){
      if(!entry||closed||busy||dialog.open||!queue.includes(entry))return false;
      cancelPrompt();current=entry;error=errors.get(pair(entry))||'';focusBack=document.activeElement;render();dialog.showModal();dialog.querySelector('button')?.focus?.({preventScroll:true});return true;
    }
    function render(){
      const focused=dialog.contains(document.activeElement)?document.activeElement:null,focusAction=focused?.dataset.ratingAction;
      generation++;dialog.replaceChildren();if(!current)return;
      const entry=current,total=count(entry),legacy=entry.sealed&&total>1,selected=total===1?entry.counts.indexOf(1)+1:0,average=summary[entry.gameId];
      const top=node('div','rating-top'),exit=button('×','later','rating-close');exit.setAttribute('aria-label','Finish rating later');top.append(node('span','rating-kicker','THE CLASS VERDICT'),exit);
      const title=node('h2','',`How was ${titles.get(entry.gameId)}?`);title.id='gameRatingTitle';
      const intro=node('p','rating-intro',legacy?'This earlier batch was already approved for saving. Retry keeps those votes exactly as they were.':'Choose one score together as a class. Pick 1 to 10, then save your class rating.');
      const averageBox=node('div','rating-average');averageBox.append(node('span','', 'CURRENT RATING'),node('strong','',average?.votes?`${Number(average.average.toFixed(1))} / 10`:average?'No ratings yet':'Loading ratings…'),node('small','',average?.votes?`${average.votes} ${average.votes===1?'vote':'votes'} so far`:'Your class can help choose what to play next.'));
      const grid=node('div','rating-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Choose one class rating from 1 to 10');
      for(let n=1;n<=10;n++){
        const choice=button('','vote-'+n,'rating-vote',busy||entry.sealed);choice.setAttribute('aria-label',`Rate ${n} out of 10`);choice.setAttribute('aria-pressed',String(selected===n));choice.dataset.selected=String(selected===n);
        const star=node('span','rating-star','★');star.setAttribute('aria-hidden','true');choice.append(star,node('strong','',String(n)));grid.append(choice);
      }
      const scale=node('div','rating-scale');scale.append(node('span','','1 · Not for us'),node('span','','10 · Play again!'));
      const choiceText=node('p','rating-choice',legacy?`Previously approved batch · ${total} votes`:selected?`Your class chose ${selected} / 10`:'One class. One rating.');
      const footer=node('div','rating-actions');footer.append(button(busy?'Saving…':entry.sealed?'Retry saving rating':'Save class rating','save','rating-button rating-primary',busy||total!==entry.target||!total),button('Finish later','later','rating-button rating-text'));
      const status=node('p','rating-status',error||(busy?'Saving your rating. You can finish later while this continues.':entry.sealed?'Retry uses the original submission.':selected?'You can change the score before saving.':'No rating is sent until you press Save.'));status.setAttribute('role','status');
      dialog.append(top,title,intro,averageBox,grid,scale,choiceText,footer,status);
      if(entry.countsPlay)dialog.append(node('p','rating-play-note',entry.playLinked?'This review belongs to the same play and will not count it twice.':'Saving this review also counts one play of the game.'));
      if(playError){const retry=node('div','rating-retry');retry.append(node('p','rating-status',playError),button(playBusy?'Retrying game saves…':'Retry game saves','retry-saves','rating-button rating-primary',playBusy||busy));dialog.append(retry);}
      if(storageWarning)dialog.append(node('p','rating-status','This browser cannot keep unsaved feedback after the page closes. Keep it open until saving succeeds.'));
      if(dialog.open&&focused){const next=focusAction?dialog.querySelector(`[data-rating-action="${focusAction}"]`):null;if(next&&!next.disabled)next.focus?.({preventScroll:true});else dialog.querySelector('[data-rating-action="later"]')?.focus?.({preventScroll:true});}
    }
    async function saveEntry(entry){
      if(closed||busy||!entry||!queue.includes(entry)||count(entry)!==entry.target||!count(entry)||(current&&current!==entry))return false;
      ensureRatingPlay(entry);entry.sealed=true;persist();busy=true;error='';errors.delete(pair(entry));readEpoch++;
      if(current===entry)render();announce();
      const payload=Object.freeze({action:'rate_game',gameId:entry.gameId,sessionId:entry.sessionId,requestId:entry.requestId,counts:Object.freeze(entry.counts.slice())});
      try {
        const response=(async()=>request(payload))();void flushPlays();
        const result=accept(await response);if(closed)return false;
        const acknowledged=result[entry.gameId],scoreSum=entry.counts.reduce((total,value,index)=>total+value*(index+1),0);
        if(acknowledged.sessions<1||acknowledged.votes<count(entry)||acknowledged.sum<scoreSum)throw Error('The saved rating was not acknowledged.');
        readEpoch++;applySummary(result);queue=queue.filter(item=>item!==entry);errors.delete(pair(entry));settled=remember(settled,pair(entry));persist();busy=false;
        if(current===entry&&dialog.open)close();else announce();return true;
      }catch(problem){
        if(closed)return false;busy=false;
        const message=problem?.code==='replayed_request'?'This session was already rated with different details. Your local rating is still kept.':problem?.code==='ratings_full'?'The ratings sheet is full. Your rating is kept here until there is room to save.':'Couldn’t confirm the save. Your rating is kept here; tap Retry when connected.';
        errors.set(pair(entry),message);if(current===entry){error=message;render();}announce();return false;
      }
    }
    async function flushPlays(){
      if(closed||playBusy)return;playBusy=true;playError='';announce();
      try {
        while(!closed&&playQueue.length){
          const entry=playQueue[0],payload=Object.freeze({action:'record_game_play',requestId:entry.requestId,gameId:entry.gameId,sessionId:entry.sessionId});readEpoch++;
          try {
            const result=accept(await request(payload));if(closed)return;
            if(result[entry.gameId].plays<1)throw Error('The completed game was not acknowledged.');
            readEpoch++;applySummary(result);playQueue=playQueue.filter(item=>item!==entry);recorded=remember(recorded,pair(entry));persist();if(current)render();announce();
          }catch(problem){
            if(closed)return;playError=problem?.code==='plays_full'?'Game tracking is full. Your play is kept on this device.':'Your play has not been saved yet. It is kept on this device; tap Retry game saves when connected.';if(current)render();announce();break;
          }
        }
      }finally{playBusy=false;if(current)render();announce();}
    }
    function perform(action){
      if(!current||closed)return;if(action==='later'){close();return;}if(action==='retry-saves'){void flush();return;}if(busy)return;
      const entry=current;if(action==='save'){void saveEntry(entry);return;}if(entry.sealed)return;
      if(action.startsWith('vote-')){const value=Number(action.slice(5));if(!Number.isInteger(value)||value<1||value>10)return;entry.counts=Array(10).fill(0);entry.counts[value-1]=1;entry.target=1;error='';persist();render();}
    }
    function ensureRatingPlay(entry){
      if(!entry.countsPlay||entry.playLinked)return;
      const key=pair(entry);entry.playLinked=true;
      if(completed.has(key))return;
      completed.add(key);playQueue.push({gameId:entry.gameId,sessionId:entry.sessionId,requestId:uid()});
    }
    function ratingEntry(gameId,sessionId,manual=false){
      const entry={gameId,sessionId,requestId:uid(),counts:Array(10).fill(0),target:1,sealed:false,manual,countsPlay:true,playLinked:completed.has(gameId+'/'+sessionId)};rated.add(pair(entry));queue.push(entry);return entry;
    }
    function schedulePrompt(entry){
      cancelPrompt();if(!entry||!active||contextGame!==entry.gameId||(contextSession&&contextSession!==entry.sessionId))return;
      const token=promptGeneration;
      promptTimer=setTimeout(()=>{
        if(closed||token!==promptGeneration)return;promptTimer=null;if(!active||document.hidden||contextGame!==entry.gameId||(contextSession&&contextSession!==entry.sessionId))return;
        open(entry);
      },PROMPT_DELAY);
    }
    function complete(details){
      if(closed||!details||!titles.has(details.gameId)||!IDS.includes(details.gameId)||!validId(details.sessionId)||completed.has(pair(details)))return false;
      completed.add(pair(details));playQueue.push({gameId:details.gameId,sessionId:details.sessionId,requestId:uid()});
      let entry=queue.find(item=>pair(item)===pair(details));
      if(!entry&&!rated.has(pair(details))&&queue.length<MAX_PENDING)entry=ratingEntry(details.gameId,details.sessionId);
      persist();announce();schedulePrompt(entry);void flushPlays();return true;
    }
    function openForGame(gameId,sessionId){
      if(closed||busy||dialog.open||!titles.has(gameId)||!IDS.includes(gameId)||(sessionId!==undefined&&!validId(sessionId)))return false;
      cancelPrompt();let entry=queue.find(item=>item.gameId===gameId&&(sessionId===undefined||item.sessionId===sessionId));
      if(!entry){if(queue.length>=MAX_PENDING||(sessionId!==undefined&&rated.has(gameId+'/'+sessionId)))return false;entry=ratingEntry(gameId,sessionId||uid(),true);persist();announce();}
      return open(entry);
    }
    async function retryPending(){
      if(closed||busy)return;
      const pending=queue.filter(entry=>entry.sealed);
      for(const entry of pending){if(closed||busy||(current&&current!==entry))break;if(!await saveEntry(entry))break;}
    }
    async function flush(){if(closed)return;await Promise.all([refresh(),retryPending(),flushPlays()]);}
    function reconnect(){void flush();}
    function cancel(event){event.preventDefault();close();}
    function visibility(){if(document.hidden)cancelPrompt();}
    dialog.addEventListener('cancel',cancel);window.addEventListener('online',reconnect);document.addEventListener('visibilitychange',visibility);
    announce();void refresh();if(playQueue.length)void flushPlays();
    return Object.freeze({complete,refresh,retryPending,flush,openForGame,cancelPrompt,
      setContext(gameId,sessionId){cancelPrompt();contextGame=titles.has(gameId)&&IDS.includes(gameId)&&(sessionId===undefined||validId(sessionId))?gameId:null;contextSession=validId(sessionId)?sessionId:null;if(dialog.open)close();},
      openPending(){if(queue.length)return open(queue[0]);return false;},
      setActive(value){active=Boolean(value);if(!active){cancelPrompt();if(dialog.open)close();}},
      getState(){return {summary:clone(summary),queue:clone(queue),playQueue:clone(playQueue),busy,playBusy,playError,pendingSaveCount:queue.filter(entry=>entry.sealed).length+playQueue.length,retryNeeded:errors.size>0||!!playError,saveError:[...new Set([...errors.values(),playError].filter(Boolean))].join(' '),current:current?.sessionId||null,promptPending:promptTimer!==null,contextGame,contextSession};},
      destroy(){if(closed)return;closed=true;readEpoch++;cancelPrompt();window.removeEventListener('online',reconnect);document.removeEventListener('visibilitychange',visibility);dialog.removeEventListener('cancel',cancel);if(dialog.open)close();dialog.remove();}
    });
  }
  window.SWLGameRatings=Object.freeze({create});
})();
