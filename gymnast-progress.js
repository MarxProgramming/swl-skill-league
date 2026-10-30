/* A view of the existing Floor activity ledger, not reconstructed score totals. */
(() => {
  'use strict';
  const DAY=86400000, RANGES=[7,28,56];
  const dayFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
  const dateFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
  const longFormat=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round=n=>Math.round(n*1e6)/1e6;
  const number=n=>Number(n||0).toLocaleString('en-GB',{maximumFractionDigits:1});
  const signed=n=>(n>0?'+':n<0?'−':'')+number(Math.abs(n));
  function dayIndex(day) {
    if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
    const time=Date.parse(day+'T00:00:00Z');
    return Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===day?time/DAY:null;
  }
  function londonDay(value) {
    const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
    const p=Object.fromEntries(dayFormat.formatToParts(date).map(v=>[v.type,v.value]));return `${p.year}-${p.month}-${p.day}`;
  }
  const iso=day=>new Date(day*DAY).toISOString().slice(0,10);
  const label=(day,long=false)=>(long?longFormat:dateFormat).format(new Date(dayIndex(day)*DAY));
  function buildSeries({progress,gymnastId,days=28,now=Date.now()}={}) {
    days=RANGES.includes(Number(days))?Number(days):28;
    const unavailable={available:false,days,rows:[],net:0,weeklyRate:0,coverageDays:0,partial:false,hasChanges:false};
    if(typeof progress?.startedAt!=='string'||!Number.isFinite(Date.parse(progress.startedAt))||Date.parse(progress.startedAt)>new Date(now).getTime())return unavailable;
    const today=dayIndex(londonDay(now)),end=dayIndex(progress?.day),started=dayIndex(londonDay(progress?.startedAt));
    if(today===null||end===null||started===null||end>today||started>end||!progress?.history||!Object.hasOwn(progress.history,gymnastId)||!Array.isArray(progress.history[gymnastId]))return unavailable;
    const perDay=new Map();
    progress.history[gymnastId].forEach(record=>{
      const day=dayIndex(record?.day),points=record?.points;
      if(day===null||day<end-55||day>end||typeof points!=='number'||!Number.isFinite(points)||Math.abs(points)>10000)return;
      perDay.set(day,round(points));
    });
    // Verified imported daily rows can predate the global ledger start.
    const knownStart=Math.min(started,...perDay.keys()),first=Math.max(end-days+1,end-55,knownStart);
    const rows=[{day:iso(first-1),delta:0,total:0,baseline:true}];let total=0;
    for(let day=first;day<=end;day++){
      const delta=perDay.get(day)||0;total=round(total+delta);
      rows.push({day:iso(day),delta,total,baseline:false});
    }
    const coverageDays=end-first+1;
    return {available:true,days,firstDay:iso(first),lastDay:iso(end),rows,net:total,weeklyRate:round(total*7/coverageDays),coverageDays,partial:coverageDays<days,hasChanges:rows.some(row=>row.delta!==0),stale:end<today};
  }
  function geometry(series) {
    const values=series.rows.map(row=>row.total),min=Math.min(0,...values),max=Math.max(0,...values);
    const span=Math.max(10,max-min),raw=span/4,unit=10**Math.floor(Math.log10(raw));
    const step=[1,2,2.5,5,10].map(n=>n*unit).find(n=>n>=raw)||unit*10;
    const lower=Math.floor(min/step)*step,upper=Math.max(lower+step*2,Math.ceil(max/step)*step);
    const ticks=[];for(let n=lower;n<=upper+step/100;n+=step)ticks.push(round(n));
    const x=i=>i/Math.max(1,series.rows.length-1)*720,y=n=>250-(n-lower)/(upper-lower)*240;
    const points=series.rows.map((row,i)=>({x:x(i),y:y(row.total)}));
    const path=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)).join(' '),zero=y(0);
    return {points,ticks,x,y,zero,path,area:path+` L720,${zero.toFixed(2)} L0,${zero.toFixed(2)} Z`};
  }
  let root=null,active=null,selectionKey='',selectedDay=null;
  const selectedLabel=(row,series,long=false)=>row.baseline?'Start of '+label(series.firstDay,long):label(row.day,long);
  function selectedText(row) {return signed(row.total)+' points gained'+(row.baseline?'':'; '+signed(row.delta)+' that day');}
  function render({person,progress,currentPoints=0,days=28,apparatus='floor',now=Date.now()}={}) {
    if(!person)return '';
    if(apparatus==='vault'){
      active=null;
      return `<section class="gymnast-progress analytics-panel analytics-wide"><div class="gp-head"><div><p class="eyebrow">${esc(person.name)} · Vault</p><h2>Points over time</h2></div></div><div class="gp-empty"><p>Vault point history isn’t recorded yet. Your current Vault score is <strong>${number(currentPoints)}</strong>.</p><button type="button" class="quiet" data-progress-floor>View Floor progress</button></div></section>`;
    }
    const series=buildSeries({progress,gymnastId:person.id,days,now});
    const ranges=`<div class="gp-ranges" role="group" aria-label="Progress period">${[[7,'7 days'],[28,'4 weeks'],[56,'8 weeks']].map(([n,text])=>`<button type="button" data-progress-range="${n}" aria-pressed="${series.days===n}">${text}</button>`).join('')}</div>`;
    const heading=`<div class="gp-head"><div><p class="eyebrow">Personal progress · ${apparatus==='combined'?'Floor only':'Floor'}</p><h2>Points over time</h2></div>${ranges}</div><p class="gp-person">${esc(person.name)}</p>`;
    if(!series.available){active=null;return `<section class="gymnast-progress analytics-panel analytics-wide">${heading}<div class="gp-empty"><p>Point history isn’t available in this saved record yet.</p><p>Current saved Floor score: <strong>${number(currentPoints)}</strong>.</p></div></section>`;}
    const key=person.id+'|'+series.days;
    if(key!==selectionKey){selectionKey=key;selectedDay=null;}
    let selected=selectedDay?series.rows.findIndex(row=>row.day===selectedDay):-1;
    if(selected<0)selected=series.rows.length-1;
    const geo=geometry(series),row=series.rows[selected],point=geo.points[selected];
    active={series,geo,selected};
    const tickLabels=geo.ticks.map(n=>`<span class="gp-y-tick" style="top:${geo.y(n)/260*100}%">${number(n)}</span>`).join('');
    const ticks=geo.ticks.map(n=>`<line class="${n===0?'gp-zero':'gp-grid'}" x1="0" x2="720" y1="${geo.y(n)}" y2="${geo.y(n)}"/>`).join('');
    const middle=series.rows[Math.floor(series.rows.length/2)];
    const description=`Recorded Floor point gains for ${person.name}, ${label(series.firstDay)} to ${label(series.lastDay)}. ${signed(series.net)} net points over ${series.coverageDays} calendar days. The line starts at zero for this period; it does not show historical total scores.`;
    return `<section class="gymnast-progress analytics-panel analytics-wide">${heading}
      <div class="gp-stats"><article><span>Recorded gain</span><strong>${signed(series.net)}<small> pts</small></strong></article><article><span>Average per week</span><strong>${signed(series.weeklyRate)}<small> pts</small></strong></article><article><span>Saved Floor score</span><strong>${number(currentPoints)}<small> pts</small></strong></article></div>
      <p class="gp-axis-label">Points gained · ${label(series.firstDay)}–${label(series.lastDay)}</p>
      <div class="gp-chart"><div class="gp-y-axis" aria-hidden="true">${tickLabels}</div><div class="gp-plot" data-progress-plot><svg viewBox="0 0 720 260" preserveAspectRatio="none" role="img" aria-label="${esc(description)}">${ticks}<path class="gp-area" d="${geo.area}"/><path class="gp-line" d="${geo.path}"/><line class="gp-selected" x1="${point.x}" x2="${point.x}" y1="0" y2="260"/></svg><span class="gp-marker" aria-hidden="true" style="left:${point.x/720*100}%;top:${point.y/260*100}%"></span></div><div class="gp-x-axis" aria-hidden="true"><span>${label(series.firstDay)}</span><span>${series.coverageDays>1?label(middle.day):''}</span><span>${label(series.lastDay)}</span></div></div>
      <div class="gp-reading" aria-live="polite" aria-atomic="true"><strong data-progress-date>${selectedLabel(row,series,true)}</strong><span data-progress-reading>${selectedText(row)}</span></div>
      <div class="gp-scrub"><label for="gymnastProgressScrub">Explore a date</label><input id="gymnastProgressScrub" type="range" min="0" max="${series.rows.length-1}" step="1" value="${selected}" aria-valuetext="${esc(selectedLabel(row,series,true)+': '+selectedText(row))}"></div>
      ${!series.hasChanges?'<p class="gp-empty">No recorded Floor point changes in this period.</p>':''}
      <p class="gp-note">${series.partial?'Showing '+series.coverageDays+' days of available records. ':''}${series.stale?'Saved records through '+label(series.lastDay)+'. ':''}The line starts at zero for the selected period. Average pace uses calendar days.</p>
      <details class="gp-values" data-analytics-disclosure="progress-values"><summary>Daily values &amp; how this works</summary><p class="gp-note">Saved Floor gains minus manual corrections. Renewals, automatic expiry and scoring-rule changes are excluded. Dates reflect when changes reached Google Sheets; earlier activity may not have been recorded.${apparatus==='combined'?' Vault points are not included.':''}</p><table><caption class="gp-table-caption">Recorded Floor progress for ${esc(person.name)}</caption><thead><tr><th scope="col">Date</th><th scope="col">Daily change</th><th scope="col">Gained so far</th></tr></thead><tbody>${series.rows.slice(1).map(r=>`<tr><th scope="row">${label(r.day)}</th><td>${signed(r.delta)}</td><td>${signed(r.total)}</td></tr>`).join('')}</tbody></table></details></section>`;
  }
  function select(index) {
    if(!root||!active)return;
    const {series,geo}=active,position=Math.max(0,Math.min(series.rows.length-1,Math.round(Number(index)||0))),row=series.rows[position],point=geo.points[position];
    active.selected=position;selectedDay=row.day;
    const line=root.querySelector('.gymnast-progress .gp-selected'),marker=root.querySelector('.gymnast-progress .gp-marker'),date=root.querySelector('[data-progress-date]'),reading=root.querySelector('[data-progress-reading]'),slider=root.querySelector('#gymnastProgressScrub');
    if(line){line.setAttribute('x1',String(point.x));line.setAttribute('x2',String(point.x));}
    if(marker){marker.style.left=point.x/720*100+'%';marker.style.top=point.y/260*100+'%';}
    if(date)date.textContent=selectedLabel(row,series,true);
    if(reading)reading.textContent=selectedText(row);
    if(slider){slider.value=String(position);slider.setAttribute('aria-valuetext',selectedLabel(row,series,true)+': '+selectedText(row));}
  }
  const onInput=e=>{if(e.target.id==='gymnastProgressScrub')select(e.target.value);};
  const onClick=e=>{
    const plot=e.target.closest?.('[data-progress-plot]');if(!plot||!active||!root.contains(plot))return;
    const rect=plot.getBoundingClientRect();if(rect.width>0)select((e.clientX-rect.left)/rect.width*(active.series.rows.length-1));
  };
  function mount(host) {
    if(root===host)return;
    if(root){root.removeEventListener('input',onInput);root.removeEventListener('click',onClick);}
    root=host;if(root){root.addEventListener('input',onInput);root.addEventListener('click',onClick);}
  }
  window.SWLGymnastProgress={buildSeries,render,mount};
})();
