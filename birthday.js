(() => {
  'use strict';
  const format = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
  function londonDay(at=Date.now()) {
    const parts=Object.fromEntries(format.formatToParts(new Date(at)).map(p=>[p.type,p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function clean(value) {
    if(!value || typeof value.asOf!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.asOf) || !Number.isInteger(value.days) || Math.abs(value.days)>5) return null;
    const parsed=new Date(value.asOf+'T12:00:00Z');
    if(!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10)!==value.asOf)return null;
    return {asOf:value.asOf,days:value.days};
  }
  function offset(value,at=Date.now()) {
    const b=clean(value);if(!b)return null;
    const elapsed=Math.round((Date.parse(londonDay(at)+'T12:00:00Z')-Date.parse(b.asOf+'T12:00:00Z'))/86400000);
    // Never revive old cached birthdays in a later year.
    if(elapsed<0 || elapsed>10)return null;
    const days=b.days-elapsed;return Math.abs(days)<=5?days:null;
  }
  function note(value,at) {
    const days=offset(value,at);if(days===null)return '';
    const text=days===0?'Happy birthday!':days===1?'Birthday tomorrow':days===-1?'Birthday yesterday':days>0?`Birthday in ${days} days`:`Birthday ${-days} days ago`;
    return `<span class="birthday-note${days===0?' birthday-note-today':''}">${text}</span>`;
  }
  window.SWLBirthday={clean,offset,note,className:(value,at)=>offset(value,at)===0?' is-birthday':''};
})();
