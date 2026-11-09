/* Lightweight 3D medal: no renderer download, shared score data or animation loop. */
(()=>{'use strict';let drag=null;
function mount(){document.querySelectorAll('.overall.v3-board .v3-podium .avatar').forEach(el=>{if(el.dataset.spinMedal)return;el.dataset.spinMedal='true';el.tabIndex=0;el.removeAttribute('aria-hidden');el.setAttribute('role','button');el.setAttribute('aria-label','Rotate podium medal');el.title='Drag to turn · arrow keys to rotate';el.classList.add('spin-medal');el.dataset.rotation='0';});}
function rotate(el,n){el.dataset.rotation=String(n);el.style.transform=`perspective(500px) rotateY(${n}deg) rotateX(-8deg)`;}
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.spin-medal');if(!el||e.button!==0)return;e.stopPropagation();drag={el,x:e.clientX,y:e.clientY,start:Number(el.dataset.rotation),moved:false};el.setPointerCapture(e.pointerId);},true);
document.addEventListener('pointermove',e=>{if(!drag)return;if(Math.abs(e.clientY-drag.y)>Math.abs(e.clientX-drag.x)&&!drag.moved){drag=null;return;}drag.moved=true;rotate(drag.el,drag.start+(e.clientX-drag.x)*1.5);},true);
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>{drag=null;},true);
document.addEventListener('click',e=>{if(e.target.closest('.spin-medal')){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keydown',e=>{const el=e.target.closest('.spin-medal');if(el&&['ArrowLeft','ArrowRight','Home','Enter',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();rotate(el,e.key==='Home'?0:Number(el.dataset.rotation)+(e.key==='ArrowLeft'?-45:45));}},true);
new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});mount();})();
