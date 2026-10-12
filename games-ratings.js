(() => {
  'use strict';
  const KEY='swl-game-rating-outbox-v1';
  const IDS=['wheel','team','shuffle','letters','handstand','addon','relayrace','timesense'];
  const MAX_PENDING=30,MAX_COMPLETED=200;
  const validId=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{15,99}$/.test(value);
  const uid=()=>{try{return 'rating_'+window.crypto.randomUUID().replace(/-/g,'');}catch(_){return 'rating_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2).padEnd(16,'0');}};
  const clone=value=>JSON.parse(JSON.stringify(value));
  const node=(tag,cls='',text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const pair=entry=>entry.gameId+'/'+entry.sessionId;
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

  function create({games,request,onChange=()=>{}}) {
    if(!Array.isArray(games)||typeof request!=='function')throw TypeError('Game ratings need games and a request function.');
    const titles=new Map(games.filter(game=>game&&IDS.includes(game.id)&&typeof game.name==='string').map(game=>[game.id,game.name]));
    let queue=[],settled=[],current=null,active=false,busy=false,error='',generation=0,summary={},readEpoch=0,closed=false,focusBack=null,storageWarning=false;
    const completed=new Set(),errors=new Map();
    const dialog=node('dialog','game-rating-dialog');dialog.setAttribute('aria-labelledby','gameRatingTitle');document.body.append(dialog);
    const count=entry=>entry.counts.reduce((sum,value)=>sum+value,0);
    function validEntry(entry){
      return object(entry)&&IDS.includes(entry.gameId)&&titles.has(entry.gameId)&&validId(entry.sessionId)&&validId(entry.requestId)&&
        Array.isArray(entry.counts)&&entry.counts.length===10&&entry.counts.every(value=>Number.isInteger(value)&&value>=0&&value<=120)&&
        Number.isInteger(entry.target)&&entry.target>=1&&entry.target<=120&&count(entry)<=entry.target&&
        (entry.sealed===undefined||typeof entry.sealed==='boolean')&&(!entry.sealed||count(entry)===entry.target);
    }
    function recoverOrder(entry){
      // Old drafts did not save order. Preserve their votes without inventing
      // which was last; votes added in this version can still be undone.
      if(!Array.isArray(entry.order)||entry.order.length>count(entry))return [];
      const counts=Array(10).fill(0);
      for(const value of entry.order){if(!Number.isInteger(value)||value<0||value>9||++counts[value]>entry.counts[value])return [];}
      return entry.order.slice();
    }
    try {
      const raw=window.localStorage?.getItem(KEY)||'[]';
      const stored=raw.length<=250000?JSON.parse(raw):null;
      const entries=Array.isArray(stored)?stored:object(stored)&&stored.version===2&&Array.isArray(stored.queue)?stored.queue:[];
      const sessions=new Set(),requests=new Set();
      entries.filter(validEntry).slice(0,MAX_PENDING).forEach(entry=>{
        if(sessions.has(pair(entry))||requests.has(entry.requestId))return;
        sessions.add(pair(entry));requests.add(entry.requestId);
        queue.push({gameId:entry.gameId,sessionId:entry.sessionId,requestId:entry.requestId,counts:entry.counts.slice(),target:entry.target,sealed:entry.sealed===true,order:recoverOrder(entry)});
      });
      if(object(stored)&&stored.version===2&&Array.isArray(stored.completed)){
        settled=[...new Set(stored.completed.filter(value=>{
          if(typeof value!=='string')return false;const parts=value.split('/');return parts.length===2&&IDS.includes(parts[0])&&validId(parts[1]);
        }))].slice(-MAX_COMPLETED);
      }
    }catch(_){}
    settled.forEach(key=>completed.add(key));queue.forEach(entry=>completed.add(pair(entry)));
    function persist(){
      try {
        if(!window.localStorage||typeof window.localStorage.setItem!=='function')throw Error('Storage unavailable');
        window.localStorage.setItem(KEY,JSON.stringify({version:2,queue,completed:settled}));storageWarning=false;
      }catch(_){storageWarning=true;}
    }
    function announce(){if(!closed){try{onChange(clone(summary),queue.length);}catch(_){}}}
    function accept(payload){
      if(object(payload)&&payload.ok===false)throw Object.assign(Error('The ratings request was not accepted.'),{code:payload.code});
      if(!object(payload)||payload.ok!==true||payload.ratingsVersion!==1||!object(payload.gameRatings))throw Error('The ratings response could not be read.');
      const result={};
      for(const id of IDS){
        const value=payload.gameRatings[id];
        if(!object(value)||!Number.isSafeInteger(value.votes)||!Number.isSafeInteger(value.sum)||!Number.isSafeInteger(value.sessions)||
          value.sessions<0||value.sessions>50000||value.votes<value.sessions||value.votes>value.sessions*120||
          value.sum<value.votes||value.sum>value.votes*10||
          (value.votes===0?value.average!==null:typeof value.average!=='number'||!Number.isFinite(value.average)||Math.abs(value.average-value.sum/value.votes)>1e-12))throw Error('The ratings response is incomplete.');
        result[id]={votes:value.votes,sum:value.sum,average:value.votes?value.sum/value.votes:null,sessions:value.sessions};
      }
      if(IDS.reduce((total,id)=>total+result[id].sessions,0)>50000)throw Error('The ratings response is incomplete.');
      return result;
    }
    function applySummary(result){
      // These are append-only aggregates. An older network snapshot must never
      // make already-confirmed votes disappear, even across overlapping reads.
      if(IDS.some(id=>summary[id]&&(result[id].votes<summary[id].votes||result[id].sum<summary[id].sum||result[id].sessions<summary[id].sessions)))return;
      summary=result;
    }
    async function refresh(){
      if(closed)return;const epoch=++readEpoch;
      try{const result=accept(await request({action:'read_game_ratings'}));if(!closed&&epoch===readEpoch){applySummary(result);announce();}}
      catch(_){/* A game stays playable while ratings are unavailable. */}
    }
    function button(label,action,cls='rating-button',disabled=false){
      const el=node('button',cls,label),token=generation;el.type='button';el.disabled=disabled;el.dataset.ratingAction=action;
      el.addEventListener('click',()=>{if(token===generation&&!el.disabled)perform(action);});return el;
    }
    function close(){
      const wasOpen=dialog.open,returnTo=focusBack;current=null;focusBack=null;error='';generation++;
      if(wasOpen)dialog.close();
      if(wasOpen&&returnTo?.isConnected!==false){try{returnTo?.focus?.({preventScroll:true});}catch(_){}}
      announce();
    }
    function open(entry){
      if(!entry||closed||busy||dialog.open||!queue.includes(entry))return false;
      current=entry;error=errors.get(pair(entry))||'';focusBack=document.activeElement;render();dialog.showModal();dialog.querySelector('button')?.focus?.({preventScroll:true});return true;
    }
    function render(){
      const focused=dialog.contains(document.activeElement)?document.activeElement:null;
      const focusAction=focused?.dataset.ratingAction,focusTarget=focused?.dataset.ratingTarget;
      generation++;dialog.replaceChildren();if(!current)return;
      const entry=current,total=count(entry),sealed=entry.sealed;
      const top=node('div','rating-top');const exit=button('×','later','rating-close');exit.setAttribute('aria-label','Finish rating later');top.append(node('span','rating-kicker','THE SQUAD’S VERDICT'),exit);
      const title=node('h2','',`How was ${titles.get(entry.gameId)}?`);title.id='gameRatingTitle';
      const intro=node('p','rating-intro','Ask each gymnast for a score from 1 to 10. Tap once for each vote — no names needed.');
      const target=node('label','rating-target','Gymnasts voting');const input=node('input');input.type='number';input.min='1';input.max='120';input.step='1';input.value=String(entry.target);input.setAttribute('aria-label','Gymnasts voting');input.disabled=total>0||sealed||busy;input.dataset.ratingTarget='true';const token=generation;
      input.addEventListener('change',()=>{
        if(token!==generation||busy||sealed||total)return;const value=Number(input.value);
        if(!Number.isInteger(value)||value<1||value>120){error='Choose a whole number from 1 to 120.';render();return;}
        entry.target=value;error='';persist();render();
      });target.append(input);
      const progress=node('div','rating-progress');progress.append(node('strong','',`${total} / ${entry.target}`),node('span','','votes collected'));
      const grid=node('div','rating-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label','Rate this game from 1 to 10');
      for(let n=1;n<=10;n++){const vote=button(String(n),'vote-'+n,'rating-vote',busy||sealed||total>=entry.target);vote.setAttribute('aria-label',`Give ${n} out of 10`);vote.append(node('small','',`${entry.counts[n-1]} ${entry.counts[n-1]===1?'vote':'votes'}`));grid.append(vote);}
      const scale=node('div','rating-scale');scale.append(node('span','','1 · Not for me'),node('span','','10 · Play again!'));
      const footer=node('div','rating-actions');footer.append(button('Undo last vote','undo','rating-button rating-secondary',busy||sealed||!entry.order.length),button(busy?'Saving…':sealed?'Retry saving ratings':`Save ${total} ratings`,'save','rating-button rating-primary',busy||total!==entry.target||!total),button('Finish later','later','rating-button rating-text'));
      const status=node('p','rating-status',error||(busy?'Saving your votes. You can finish later while this continues.':sealed?'These votes are ready to save. Retry uses the same submission.':total===entry.target?'Everyone has voted. Save the squad’s ratings.':'Votes stay on this device until you press Save.'));status.setAttribute('role','status');
      dialog.append(top,title,intro,target,progress,grid,scale,footer,status);
      if(storageWarning)dialog.append(node('p','rating-status','This browser cannot keep votes after the page closes. Keep it open until saving succeeds.'));
      if(dialog.open&&focused){const next=focusAction?dialog.querySelector(`[data-rating-action="${focusAction}"]`):focusTarget?input:null;if(next&&!next.disabled)next.focus?.({preventScroll:true});else dialog.querySelector('[data-rating-action="later"]')?.focus?.({preventScroll:true});}
    }
    async function saveEntry(entry){
      if(closed||busy||!entry||!queue.includes(entry)||count(entry)!==entry.target||!count(entry)||(current&&current!==entry))return false;
      entry.sealed=true;persist();busy=true;error='';errors.delete(pair(entry));readEpoch++;
      if(current===entry)render();announce();
      const payload=Object.freeze({action:'rate_game',gameId:entry.gameId,sessionId:entry.sessionId,requestId:entry.requestId,counts:Object.freeze(entry.counts.slice())});
      try {
        const result=accept(await request(payload));if(closed)return false;
        const acknowledged=result[entry.gameId],scoreSum=entry.counts.reduce((total,value,index)=>total+value*(index+1),0);
        if(acknowledged.sessions<1||acknowledged.votes<count(entry)||acknowledged.sum<scoreSum)throw Error('The saved votes were not acknowledged.');
        readEpoch++;applySummary(result);queue=queue.filter(item=>item!==entry);errors.delete(pair(entry));
        settled=settled.filter(key=>key!==pair(entry)).concat(pair(entry)).slice(-MAX_COMPLETED);persist();busy=false;
        if(current===entry&&dialog.open)close();else announce();
        return true;
      }catch(problem){
        if(closed)return false;busy=false;
        const message=problem?.code==='replayed_request'?'These game-session ratings were already submitted with different details. Your local votes are still kept.':problem?.code==='ratings_full'?'The game ratings sheet is full. Your votes are kept here until there is room to save.':'Couldn’t confirm the save. Your votes are kept here; tap Retry when connected.';
        errors.set(pair(entry),message);if(current===entry){error=message;render();}announce();return false;
      }
    }
    function perform(action){
      if(!current||closed)return;if(action==='later'){close();return;}if(busy)return;
      const entry=current;if(action==='save'){void saveEntry(entry);return;}if(entry.sealed)return;
      if(action==='undo'){const last=entry.order.pop();if(last!==undefined){entry.counts[last]--;error='';persist();render();}return;}
      if(action.startsWith('vote-')){const value=Number(action.slice(5));if(!Number.isInteger(value)||value<1||value>10||count(entry)>=entry.target)return;entry.counts[value-1]++;entry.order.push(value-1);error='';persist();render();}
    }
    function complete(details){
      if(closed||!details||!titles.has(details.gameId)||!IDS.includes(details.gameId)||!validId(details.sessionId)||completed.has(pair(details))||queue.length>=MAX_PENDING)return false;
      completed.add(pair(details));
      const entry={gameId:details.gameId,sessionId:details.sessionId,requestId:uid(),counts:Array(10).fill(0),target:Number.isInteger(details.participantCount)&&details.participantCount>=1&&details.participantCount<=120?details.participantCount:10,sealed:false,order:[]};
      queue.push(entry);persist();announce();if(active&&!dialog.open&&!busy)open(entry);return true;
    }
    async function retryPending(){
      if(closed||busy)return;
      // Only Save-authorised, sealed batches may be retried automatically.
      const pending=queue.filter(entry=>entry.sealed);
      for(const entry of pending){if(closed||busy||(current&&current!==entry))break;if(!await saveEntry(entry))break;}
    }
    function reconnect(){if(closed)return;void refresh();void retryPending();}
    function cancel(event){event.preventDefault();close();}
    dialog.addEventListener('cancel',cancel);window.addEventListener('online',reconnect);
    announce();void refresh();
    return Object.freeze({complete,refresh,retryPending,openPending(){if(queue.length)return open(queue[0]);return false;},setActive(value){active=Boolean(value);if(!active&&dialog.open)close();},getState(){return {summary:clone(summary),queue:clone(queue),busy,current:current?.sessionId||null};},destroy(){if(closed)return;closed=true;readEpoch++;window.removeEventListener('online',reconnect);dialog.removeEventListener('cancel',cancel);if(dialog.open)close();dialog.remove();}});
  }
  window.SWLGameRatings=Object.freeze({create});
})();
