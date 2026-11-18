/* Short, interruptible motion; never delays scoring or saves. */
(()=>{'use strict';const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('no-motion');const ease='cubic-bezier(.22,.61,.36,1)';let source=null,gesture=null,prompt=null,api;const panels=new WeakMap();
function animate(el,frames,duration=320){if(!el||reduced()||!el.animate)return;return el.animate(frames,{duration,easing:ease});}
function complex(direction){document.querySelectorAll('.directory-quick-grid,#directoryComplexCurrent').forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;el.getAnimations().forEach(a=>a.cancel());animate(el,[{opacity:.15,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],340);});}
function profile(){const rect=source;source=null;requestAnimationFrame(()=>{const card=document.getElementById('athleteSummary');if(!card||!rect||reduced())return;const r=card.getBoundingClientRect(),dy=Math.max(-24,Math.min(32,rect.top-r.top));animate(card,[{opacity:.45,transform:`translateY(${dy}px) scale(.99)`},{opacity:1,transform:'translateY(0) scale(1)'}],360);animate(document.getElementById('profileSkills'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],380);});}
let sceneFrame=0;
function scene(id){cancelAnimationFrame(sceneFrame);sceneFrame=requestAnimationFrame(()=>{const el=document.getElementById(id);if(!el||el.hidden||reduced())return;el.getAnimations().forEach(a=>a.cancel());animate(el,[{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],340);});}
function dismiss(){prompt?.remove();prompt=null;}
function locked(el){if(!api||api.editable()||window.SWLDirectorySelection?.isActive())return;dismiss();prompt=document.createElement('div');prompt.className='skill-unlock-hint';prompt.setAttribute('role','status');prompt.innerHTML='<span aria-hidden="true"><svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg></span><span>Scoring is locked</span><button type="button" data-hint-unlock>Unlock</button><button type="button" data-hint-close aria-label="Dismiss scoring hint">×</button>';document.body.append(prompt);const r=el.getBoundingClientRect(),w=prompt.offsetWidth;prompt.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';prompt.style.top=Math.max(12,Math.min(innerHeight-prompt.offsetHeight-80,r.bottom+8))+'px';prompt.querySelector('[data-hint-unlock]').onclick=()=>{dismiss();if(!api.editable())api.unlock();};prompt.querySelector('[data-hint-close]').onclick=dismiss;animate(prompt,[{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],300);}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');gesture={x:e.clientX,y:e.clientY,b,moved:false};if(b?.matches('[data-gymnast]')&&!window.SWLDirectorySelection?.isActive())source=b.closest('.directory-card,.rank-row')?.getBoundingClientRect()||b.getBoundingClientRect();if(b&&!b.disabled&&!b.classList.contains('spin-medal')){b.classList.add('ui-pressed');}},true);
document.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>10){gesture.moved=true;gesture.b?.classList.remove('ui-pressed');}},true);
function release(e){const g=gesture;gesture=null;document.querySelectorAll('.ui-pressed').forEach(b=>b.classList.remove('ui-pressed'));if(e.type==='pointerup'&&g&&!g.moved&&g.b?.disabled&&g.b.matches('[data-skill],[data-quick-skill],[data-priority-mark]'))locked(g.b);}
for(const name of ['pointerup','pointercancel'])document.addEventListener(name,release,true);window.addEventListener('blur',()=>release({type:'cancel'}));document.addEventListener('scroll',dismiss,true);document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss();});
/* Native disclosure state changes immediately; only the newly revealed content fades.
   This avoids a long layout animation on charts and does not interfere with lazy rendering. */
document.addEventListener('toggle',e=>{
 const d=e.target;
 if(d.tagName!=='DETAILS'||!d.open||reduced()||d.matches('#leaderboardFilters,#directoryFilters,.entry-filters,.directory-filter-panel'))return;
 requestAnimationFrame(()=>{
  if(!d.open||!d.isConnected)return;
  for(const child of d.children){
   if(child.tagName==='SUMMARY')continue;
   panels.get(child)?.cancel();
   const animation=animate(child,[{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],260);
   if(animation)panels.set(child,animation);
  }
 });
},true);
/* Register only decorative surfaces after rendering. No document-wide mutation observer. */
const decorative=new Set();
const decorativeSelector='.v3-podium,.rank-row.medal,.is-on-streak';
const inView=new WeakMap();
const visibilityObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
 for(const entry of entries){inView.set(entry.target,entry.isIntersecting);entry.target.classList.toggle('ui-motion-paused',!entry.isIntersecting||document.hidden);}
},{rootMargin:'80px 0px',threshold:0}):null;
function refresh(root=document){
 for(const el of decorative){if(!el.isConnected||!el.matches(decorativeSelector)){visibilityObserver?.unobserve(el);el.classList.remove('ui-motion-paused');decorative.delete(el);}}
 const candidates=[...(root.matches?.(decorativeSelector)?[root]:[]),...root.querySelectorAll(decorativeSelector)];
 for(const el of candidates){
  if(decorative.has(el)){el.classList.toggle('ui-motion-paused',document.hidden||(visibilityObserver&&inView.get(el)!==true));continue;}
  decorative.add(el);
  if(visibilityObserver){el.classList.add('ui-motion-paused');visibilityObserver.observe(el);}
  else el.classList.toggle('ui-motion-paused',document.hidden);
 }
}
document.addEventListener('visibilitychange',()=>{
 for(const el of decorative)el.classList.toggle('ui-motion-paused',document.hidden||(visibilityObserver&&inView.get(el)!==true));
});
refresh();
window.SWLInteractionPolish={complex,profile,scene,refresh,init:options=>{api=options;refresh();}};})();
