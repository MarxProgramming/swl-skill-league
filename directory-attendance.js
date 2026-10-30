/* Device-only directory visibility. It never changes a gymnast, mark or squad. */
(function () {
  'use strict';
  const KEY='swl-directory-hidden-v1', TTL=24*60*60*1000;
  let records=new Map(), pending=new Map(), loaded=false, storageFailed=false;
  let root=null,getGymnasts=()=>[],onChange=()=>{},timer=null,listening=false;
  let dialog=null,modal=null,announcement=null;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validId=id=>typeof id==='string'&&id.length>0&&id.length<=256;
  const signature=()=>JSON.stringify([...records].sort((a,b)=>a[0].localeCompare(b[0])));
  function read() {
    try {
      const raw=window.localStorage.getItem(KEY), now=Date.now(), next=new Map();
      if(raw) {
        let entries;
        try { entries=JSON.parse(raw); } catch (_) { entries=[]; }
        if(Array.isArray(entries)&&entries.length<=10000)entries.forEach(pair=>{
          if(Array.isArray(pair)&&pair.length===2&&validId(pair[0])&&typeof pair[1]==='number'&&Number.isFinite(pair[1])&&pair[1]>now&&pair[1]<=now+TTL)next.set(pair[0],pair[1]);
        });
      }
      return next;
    } catch (_) { storageFailed=true;return null; }
  }
  function ensureLoaded() {
    if(loaded)return;
    loaded=true;records=read()||new Map();schedule();
  }
  function mergeLatest() {
    const latest=read();if(latest)records=latest;
    const now=Date.now();
    pending.forEach((expiry,id)=>{
      if(expiry===null)records.delete(id);
      else if(expiry>now)records.set(id,expiry);
      else pending.delete(id);
    });
    records.forEach((expiry,id)=>{if(expiry<=now)records.delete(id);});
  }
  function save(id,expiry) {
    ensureLoaded();mergeLatest();
    if(expiry===null)records.delete(id);else records.set(id,expiry);
    pending.set(id,expiry);
    try {
      window.localStorage.setItem(KEY,JSON.stringify([...records]));
      pending.clear();storageFailed=false;
    } catch (_) { storageFailed=true; }
    schedule();
  }
  function schedule() {
    if(timer!==null)window.clearTimeout(timer);
    timer=null;
    const future=[...records.values()].filter(n=>n>Date.now());
    if(future.length)timer=window.setTimeout(check,Math.max(1,Math.min(...future)-Date.now()));
  }
  function check() {
    ensureLoaded();const before=signature();mergeLatest();schedule();
    if(before!==signature())notify('refresh');else refresh();
  }
  function people() {
    const result=getGymnasts();return Array.isArray(result)?result:[];
  }
  function person(id) {return people().find(g=>String(g.id)===id);}
  function isHidden(id) {ensureLoaded();return (records.get(String(id))||0)>Date.now();}
  function control(g) {
    if(!g||!validId(g.id))return '';
    const hidden=isHidden(g.id),label=hidden?'Show '+g.name+' again':'Not here today: '+g.name;
    return `<button type="button" class="directory-attendance-control${hidden?' is-hidden-here':''}" data-attendance-${hidden?'restore':'hide'}="${escape(g.id)}" aria-label="${escape(label)}" title="${escape(hidden?'Show again in this view':'Not here today?')}"><span aria-hidden="true">${hidden?'↶':'×'}</span></button>`;
  }
  function announce(message) {
    if(!announcement){announcement=document.createElement('p');announcement.className='directory-attendance-announcement';announcement.setAttribute('role','status');announcement.setAttribute('aria-live','polite');document.body.append(announcement);}
    announcement.textContent=message;
  }
  function refresh() {
    if(!root)return;
    const host=root.querySelector('#directoryAttendanceStatus');if(!host)return;
    const hidden=people().filter(g=>isHidden(g.id)).sort((a,b)=>String(a.name).localeCompare(String(b.name),'en-GB'));
    const oldDetails=host.querySelector('details'),wasOpen=Boolean(oldDetails?.open);
    const oldFocus=document.activeElement,focusedId=host.contains(oldFocus)?oldFocus?.dataset?.attendanceRestore:null;
    const summaryFocused=oldDetails&&oldFocus===oldDetails.querySelector('summary');
    const warning=storageFailed&&pending.size?'<p class="directory-attendance-storage" role="status">Saved on this visit only. This browser could not save the hidden list for your next visit.</p>':'';
    const html=hidden.length?`<details class="directory-attendance-status"${wasOpen?' open':''}><summary>${hidden.length} hidden here <span aria-hidden="true">⌄</span></summary><p>Hidden on this device for 24 hours. Search a name or restore them below to bring them back sooner.</p><ul>${hidden.map(g=>`<li><span>${escape(g.name)}</span><button type="button" data-attendance-restore="${escape(g.id)}" aria-label="${escape('Show '+g.name+' again')}">Show again</button></li>`).join('')}</ul>${warning}</details>`:warning;
    if(host.innerHTML!==html)host.innerHTML=html;
    host.hidden=!html;
    if(summaryFocused)host.querySelector('summary')?.focus({preventScroll:true});
    else if(focusedId){const button=[...host.querySelectorAll('[data-attendance-restore]')].find(b=>b.dataset.attendanceRestore===focusedId);if(button)button.focus({preventScroll:true});}
  }
  function notify(reason,id) {onChange({reason,id});refresh();}
  function focusAfter(info,restoredId) {
    if(restoredId){const button=[...root.querySelectorAll('.directory-profile')].find(b=>b.dataset.gymnast===restoredId);if(button){button.focus({preventScroll:true});return;}}
    if(info?.opener?.isConnected){info.opener.focus({preventScroll:true});return;}
    const buttons=[...root.querySelectorAll('.directory-profile')];
    const next=buttons[Math.min(info?.index??0,buttons.length-1)]||root.querySelector('#directorySearch')||root.querySelector('#directoryAttendanceStatus summary');
    next?.focus({preventScroll:true});
  }
  function finish(confirmed) {
    if(!modal)return;
    const info=modal;modal=null;
    if(dialog.open)dialog.close();
    if(confirmed&&person(info.id)){
      save(info.id,Date.now()+TTL);notify('hide',info.id);
      announce(storageFailed?info.name+' is hidden for this visit. This browser could not save the change.':info.name+' is hidden here for 24 hours.');
    }
    focusAfter(info);
  }
  function buildDialog() {
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='directory-attendance-dialog';
    dialog.setAttribute('aria-labelledby','attendanceDialogTitle');dialog.setAttribute('aria-describedby','attendanceDialogName attendanceDialogDescription');
    const title=document.createElement('h2');title.id='attendanceDialogTitle';title.textContent='Not here today?';
    const name=document.createElement('p');name.className='directory-attendance-name';name.id='attendanceDialogName';
    const description=document.createElement('p');description.id='attendanceDialogDescription';description.textContent='Hide this gymnast from this device’s list for 24 hours. Their scores and squads stay the same. You can still find them by searching their name.';
    const actions=document.createElement('div');actions.className='directory-attendance-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='directory-attendance-cancel';cancel.textContent='Keep here';cancel.addEventListener('click',()=>finish(false));
    const confirm=document.createElement('button');confirm.type='button';confirm.className='directory-attendance-confirm';confirm.textContent='Hide for 24 hours';confirm.addEventListener('click',()=>finish(true));
    actions.append(cancel,confirm);dialog.append(title,name,description,actions);document.body.append(dialog);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    dialog.addEventListener('close',()=>{if(modal){const info=modal;modal=null;focusAfter(info);}});
  }
  function click(event) {
    const button=event.target.closest?.('[data-attendance-hide],[data-attendance-restore]');
    if(!button||!root.contains(button))return;
    event.preventDefault();event.stopPropagation();
    const restore=button.hasAttribute('data-attendance-restore'),id=restore?button.dataset.attendanceRestore:button.dataset.attendanceHide,g=person(id);
    if(!g)return;
    const profile=button.closest('.directory-card')?.querySelector('.directory-profile');
    const info={id,name:String(g.name),opener:button,index:Math.max(0,[...root.querySelectorAll('.directory-profile')].indexOf(profile))};
    if(restore){save(id,null);notify('restore',id);announce(g.name+' is back in this view.'+(storageFailed?' This change is for this visit only.':''));focusAfter(info,id);return;}
    buildDialog();if(dialog.open)return;
    modal=info;dialog.querySelector('#attendanceDialogName').textContent=info.name;
    try{dialog.showModal();dialog.querySelector('.directory-attendance-cancel').focus({preventScroll:true});}
    catch(_){modal=null;announce('The confirmation could not open. Please try again.');focusAfter(info);}
  }
  function mount(options) {
    if(root)root.removeEventListener('click',click);
    root=options.root;getGymnasts=options.getGymnasts||(()=>[]);onChange=options.onChange||(()=>{});
    ensureLoaded();root.addEventListener('click',click);
    if(!listening){listening=true;window.addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)check();});}
    refresh();schedule();
  }
  window.SWLDirectoryAttendance={mount,isHidden,control,refresh};
})();
