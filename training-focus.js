/* Verified against IGA WAG 2026, updated floor table p9. League points are separate. */
(() => {
 'use strict';
 const source='https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-CODE-OF-POINTS-2026.pdf#page=9';
 const regional='Regional pathway only';
 const iga={
 'rolls-pro-0':{grade:'C + A',note:'Handstand pirouette + forwards roll'},'rolls-pro-hold3':{grade:'C'},
 'acro-pro-roundoff-flick':{grade:'B + B',note:'Round-off + flick'},
 'vault-vaults-0':{grade:'2.0',note:'Vault difficulty · coach supplied'},'vault-vaults-1':{grade:'2.4',note:'Vault difficulty · coach supplied'},'vault-vaults-2':{grade:'2.8',note:'Vault difficulty · provisional coach value'},
 'rolls-base-0':{grade:'A'},'rolls-base-full-turn':{grade:'B'},'rolls-base-2':{grade:'B'},
 'rolls-upgrade-dive':{grade:'B',note:regional+' · Flighted forward roll'},'rolls-upgrade-1':{grade:'D'},'rolls-upgrade-2':{grade:'C'},
 'rolls-pro-1':{grade:'B'},'acro-base-0':{grade:'B'},'acro-base-full-spin':{grade:'B'},'acro-base-one-hand':{grade:'B',note:regional},
 'acro-upgrade-0':{grade:'B',note:'Flick to one foot'},'acro-upgrade-1':{grade:'C'},'acro-upgrade-2':{grade:'C'},
 'acro-pro-1':{grade:'D'},'acro-pro-handspring':{grade:'B'},
 'leaps-base-0':{grade:'B'},'leaps-base-cat':{grade:'A'},'leaps-base-scissor':{grade:'A',note:regional},
 'leaps-base-2':{grade:'C',note:'Change-leg leap'},'leaps-base-1':{grade:'C'},'leaps-upgrade-w-hop':{grade:'A'}
 };
 const foundationIds=['acro-base-full-spin','leaps-base-0','leaps-base-cat','rolls-base-0','rolls-base-full-turn'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function tag(skill){const v=iga[skill.id];return v?`<span class="skill-iga" title="IGA difficulty ${v.grade}${v.note?' · '+esc(v.note):''}. Separate from league points.">IGA-${v.grade}${v.note?.startsWith(regional)?'<small> · regional</small>':''}</span>`:'';}
 const exercises={
 bridge:{name:'Bridge rocks',dose:'10 × 3 sets',cue:'Gently rock towards straight arms, keeping your feet planted. Only use a bridge your coach has already approved.'},
 splits:{name:'Front splits',dose:'15 seconds each leg',cue:'Support yourself with your hands. Keep hips square and stay in a comfortable range; never force it.'},
 wall:{name:'Wall handstand holds',dose:'20 seconds × 3 sets',cue:'Use the safe entry and exit your coach has taught you. Push tall through your shoulders. If not yet approved at home, use a front-support hold instead.'},
 dish:{name:'Dish holds',dose:'15 seconds × 3 sets',cue:'Keep your lower back gently pressed into the floor. Bend your knees if needed.'},
 balance:{name:'Single-leg relevé balance',dose:'15 seconds each side × 3',cue:'Rise onto your toes and hold still. Use fingertips on a wall for balance.'},
 calves:{name:'Slow calf raises',dose:'10 × 3 sets',cue:'Rise tall, pause, and lower slowly with control. Lightly touch a wall if needed.'},
 legs:{name:'Straight-leg lifts',dose:'8 each leg × 2 sets',cue:'Stand tall beside a wall and lift a straight leg forward in a controlled, comfortable range.'},
 squats:{name:'Controlled squats',dose:'10 × 2 sets',cue:'Feet hip-width apart, knees in line with toes. Stand up tall without jumping.'},
 support:{name:'Front-support holds',dose:'20 seconds × 3 sets',cue:'Hands below shoulders, straight body. Lower your knees if you cannot hold the shape.'},
 shoulder:{name:'Wall shoulder slides',dose:'8 × 2 sets',cue:'Stand with your back near a wall. Slide your arms up slowly without arching your lower back.'}
 };
 function family(skill){const n=skill.name.toLowerCase();if(n.includes('walkover'))return ['bridge','splits','dish'];if(n.includes('handstand'))return ['wall','dish','shoulder'];if(n.includes('spin'))return ['balance','calves','dish'];if(skill.category==='leaps'||n.includes('split jump'))return ['splits','legs','calves'];if(n.includes('jump')||skill.category==='vault')return ['squats','calves','support'];if(n.includes('cartwheel')||n.includes('flick')||n.includes('handspring'))return ['support','dish','shoulder'];return ['dish','support','squats'];}
 function plan(rows){const result=[],seen=new Set();const pending=rows.filter(r=>r.level<2);for(let round=0;round<3&&result.length<4;round++)for(const row of pending.slice(0,3)){const id=family(row.skill)[round];if(!seen.has(id)){seen.add(id);result.push({...exercises[id],id,forSkill:row.skill.name});if(result.length===4)break;}}return result;}
 function homework(model){const rows=plan(model.priorities);if(!rows.length)return '';return `<section class="pi-panel pi-homework"><div class="pi-panel-heading"><h3>Homework conditioning</h3><span>Floor space + a wall</span></div><p class="pi-note">A short starting plan for your next skills. Ask your coach to confirm these exercises and amounts suit you.</p><ol class="homework-list">${rows.map(r=>`<li><div><strong>${esc(r.name)}</strong><b>${esc(r.dose)}</b></div><small>For ${esc(r.forSkill)}</small><p>${esc(r.cue)}</p></li>`).join('')}</ol><p class="pi-note">Warm up first, rest between sets and stop if anything hurts. Children need an adult nearby. Keep tumbling and new skills in the gym.</p><details class="homework-source"><summary>About this plan</summary><p>Suggestions match skill families, not a diagnosis of what is holding you back. Sets and timings are coaching suggestions, not an IGA requirement. <a href="https://www.inlandempiregymnastics.com/strength" target="_blank" rel="noopener noreferrer">Gymnastics home-strength guidance ↗</a></p></details></section>`;}
 window.SWLTrainingFocus=Object.freeze({iga,foundationIds,source,tag,plan,homework});
})();
