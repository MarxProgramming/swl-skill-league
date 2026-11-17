/* Read-only competition history. Kept separate from skill scoring and earned badge receipts. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const metal = place => ({1:'gold',2:'silver',3:'bronze'}[place] || null);
  const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th')}`;
  const scoreLabel = n => n == null ? '—' : Number(n).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:3});
  function recordsFor(id) {
    const data = window.SWLCompetitionResults;
    return (data?.records || []).filter(row => row.gymnastId === id && data.events[row.eventId])
      .map(row => ({...row,event:data.events[row.eventId]}))
      .sort((a,b) => b.event.date.localeCompare(a.event.date));
  }
  function medal(score) {
    const finish = metal(score.place);
    if (!finish || !(score.score > 0)) return '';
    return `<li class="competition-medal is-${finish}"><span class="competition-medal-art" aria-hidden="true"><span class="competition-ribbon"></span><span class="competition-medal-disc"><span>${score.place}</span></span></span><span class="competition-medal-label"><strong>${esc(score.apparatus)}</strong><small>${finish[0].toUpperCase()+finish.slice(1)}</small></span></li>`;
  }
  function eventCard(row) {
    const medals = row.scores.map(medal).filter(Boolean);
    const source = /^https:\/\/www\.independentgymnastics\.com\//.test(row.source) ? row.source + '#page=' + (Number(row.page) || 1) : null;
    return `<article class="competition-card" data-competition="${esc(row.eventId)}"><header class="competition-card-head"><div><time datetime="${esc(row.event.date)}">${esc(row.event.dateLabel)}</time><h3>${esc(row.event.title)}</h3><p>${esc(row.division)}${row.event.subtitle ? ` · ${esc(row.event.subtitle)}` : ''}</p></div><span class="competition-organiser" aria-label="Independent Gymnastics Association">IGA</span></header>${medals.length ? `<ul class="competition-medals" aria-label="Competition medals">${medals.join('')}</ul>` : ''}<dl class="competition-scores">${row.scores.map(s => `<div${s.apparatus === 'All-around' ? ' class="competition-total"' : ''}><dt>${esc(s.apparatus)}</dt><dd><strong>${scoreLabel(s.score)}</strong>${s.place && s.score != null ? `<small>${ordinal(s.place)}</small>` : '<small>—</small>'}</dd></div>`).join('')}</dl><footer>${source ? `<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Official results <span aria-hidden="true">↗</span></a>` : ''}<span>Placings within ${esc(row.division.split(' · ').slice(-1)[0])}</span></footer></article>`;
  }
  function html(gymnast) {
    if (!gymnast?.id) return '';
    const rows = recordsFor(gymnast.id);
    const medals = rows.flatMap(row => row.scores).filter(s => metal(s.place) && s.score > 0).length;
    return `<section class="competition-collection" aria-label="Competition awards"><div class="competition-heading"><div><h2>Competitions</h2><p>On the competition floor</p></div>${rows.length ? `<span>${rows.length} ${rows.length === 1 ? 'competition' : 'competitions'}${medals ? ` · ${medals} ${medals === 1 ? 'medal' : 'medals'}` : ''}</span>` : ''}</div>${rows.length ? `<div class="competition-history">${rows.map(eventCard).join('')}</div><p class="competition-note">Official IGA scores and published placings. These results are separate from league points.</p>` : '<div class="competition-empty"><p>No verified competition results added yet.</p><small>Published results will appear here once they have been matched.</small></div>'}</section>`;
  }
  window.SWLCompetitionAwards = Object.freeze({html,recordsFor});
})();
