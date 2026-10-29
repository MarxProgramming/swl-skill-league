(() => {
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalise=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en-GB').replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  let input,panel,list,status,onSelect,data,group='all',matches=[],active=-1,open=false,dismissed=false,lastHTML='',selectingPointer=false;
  const isCoach=g=>data?.isCoachParticipant?.(g)??(String(g.coach||'').toLowerCase()==='coaches');
  const inGroup=g=>data?.inGroup?.(g,group)??(group==='overall'||(group==='all'?!isCoach(g):g.coach===group));
  const squadLabel=g=>data?.gymnastSquadLabel?.(g)||data?.groupLabel?.(g.coach)||g.coach||'';
  function findMatches(gymnasts,query,belongs) {
    const needle=normalise(query);if(!needle)return [];
    const tokens=needle.split(' '),seen=new Set();
    return gymnasts.filter(g=>{
      if(!g?.id||seen.has(g.id))return false;seen.add(g.id);
      const name=normalise(g.name);return tokens.every(token=>name.includes(token));
    }).map(g=>{
      const name=normalise(g.name),words=name.split(' ');
      const rank=name===needle?0:name.startsWith(needle)?1:tokens.every(token=>words.some(word=>word.startsWith(token)))?2:3;
      return {g,rank,local:belongs(g)};
    }).sort((a,b)=>a.rank-b.rank||Number(b.local)-Number(a.local)||a.g.name.localeCompare(b.g.name,'en-GB')||a.g.id.localeCompare(b.g.id)).map(row=>row.g);
  }
  function close() {
    open=false;active=-1;selectingPointer=false;if(!input)return;
    panel.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');
  }
  function activate(index,scroll=false) {
    active=index;
    list.querySelectorAll('[role="option"]').forEach((option,i)=>{
      option.setAttribute('aria-selected',String(i===active));
      if(i===active){
        input.setAttribute('aria-activedescendant',option.id);
        // Only scroll the suggestion list: scrolling every ancestor can hide the search field.
        if(scroll){const top=option.offsetTop,bottom=top+option.offsetHeight;if(top<list.scrollTop)list.scrollTop=top;else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;}
      }
    });
    if(active<0)input.removeAttribute('aria-activedescendant');
  }
  function choose(index) {
    const person=matches[index];if(!person||!data?.gymnasts.some(g=>g.id===person.id))return;
    close();dismissed=true;onSelect?.(person.id);
  }
  function refresh() {
    if(!input||dismissed)return;
    if(!data?.hasLoaded||!normalise(input.value)){matches=[];close();return;}
    const previous=matches[active]?.id;
    matches=findMatches(data.gymnasts,input.value,inGroup);
    const html=matches.map((g,i)=>`<button type="button" role="option" tabindex="-1" id="gymnast-suggestion-${i}" data-search-index="${i}" aria-selected="false"><span class="v4-search-person"><strong>${esc(g.name)}${isCoach(g)?'<span class="coach-badge">Coach</span>':''} ${data.fireBadge?.(g.id)||''}</strong><small>${esc(squadLabel(g))}${!inGroup(g)&&!['all','overall'].includes(group)?' · outside selected squad':''}</small></span><span class="v4-search-arrow" aria-hidden="true">↗</span></button>`).join('');
    if(html!==lastHTML){list.innerHTML=html;lastHTML=html;}
    const message=matches.length?`${matches.length} ${matches.length===1?'matching name':'matching names'} · tap to open skills`:'No matching names. Try a first name or surname.';
    if(status.textContent!==message)status.textContent=message;
    panel.hidden=false;open=true;input.setAttribute('aria-expanded','true');
    activate(previous?matches.findIndex(g=>g.id===previous):-1);
  }
  function mount(config) {
    if(input||!config?.input)return;
    input=config.input;onSelect=config.onSelect;
    panel=document.createElement('div');panel.className='v4-search-suggestions';panel.hidden=true;
    status=document.createElement('p');status.className='v4-search-status';status.id='gymnastSearchStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    list=document.createElement('div');list.className='v4-search-list';list.id='gymnastSearchSuggestions';list.setAttribute('role','listbox');list.setAttribute('aria-label','Matching gymnasts and coaches');
    panel.append(status,list);input.closest('label').after(panel);
    input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');input.setAttribute('aria-describedby',status.id);
    input.addEventListener('input',()=>{dismissed=false;active=-1;refresh();});
    input.addEventListener('focus',()=>{dismissed=false;refresh();});
    input.addEventListener('keydown',event=>{
      if(event.isComposing)return;
      if(event.key==='Escape'){if(open){event.preventDefault();event.stopPropagation();close();dismissed=true;}return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();dismissed=false;if(!open)refresh();if(!matches.length)return;
        activate(event.key==='ArrowDown'?(active+1)%matches.length:(active<=0?matches.length-1:active-1),true);
      }else if(event.key==='Enter'&&open&&matches.length){event.preventDefault();choose(active<0?0:active);}
      else if(event.key==='Tab'){close();dismissed=true;}
    });
    // Keep the panel alive through Safari's null-relatedTarget touch blur, without
    // cancelling pointerdown (which would interfere with swiping the result list).
    list.addEventListener('pointerdown',()=>{selectingPointer=true;});
    list.addEventListener('mousedown',event=>{if(event.button===0&&event.target.closest('[data-search-index]'))event.preventDefault();});
    list.addEventListener('click',event=>{const button=event.target.closest('[data-search-index]');if(button&&list.contains(button))choose(Number(button.dataset.searchIndex));});
    input.addEventListener('blur',event=>{if(!selectingPointer&&!panel.contains(event.relatedTarget)){close();dismissed=true;}});
    panel.addEventListener('focusout',event=>{if(!selectingPointer&&event.relatedTarget!==input&&!panel.contains(event.relatedTarget)){close();dismissed=true;}});
    document.addEventListener('pointerdown',event=>{if(event.target!==input&&!panel.contains(event.target)){close();dismissed=true;}});
    document.addEventListener('pointerup',()=>{if(selectingPointer)setTimeout(()=>{selectingPointer=false;},0);});
    document.addEventListener('pointercancel',()=>{selectingPointer=false;});
    document.addEventListener('focusin',event=>{if(!selectingPointer&&event.target!==input&&!panel.contains(event.target)){close();dismissed=true;}});
  }
  function render(next,options={}) {
    data=next;group=options.group||'all';
    if(input&&(open||document.activeElement===input))refresh();
  }
  window.SWLSearch=Object.freeze({mount,render});
})();
