(() => {
  'use strict';

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const number = value => Number.isFinite(value) && value >= 0 ? value : 0;
  const displayNumber = value => number(value).toLocaleString('en-GB');
  const accent = value => /^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value || '') ? value : '#bd9bff';
  const initials = name => String(name || '').trim().split(/\s+/).filter(Boolean)
    .filter((_, index, words) => index === 0 || index === words.length - 1)
    .map(word => Array.from(word)[0]).join('');

  function placementWindow(rows, gymnastId) {
    const index = rows.findIndex(row => row?.gymnast?.id === gymnastId);
    if (index < 0) return { position: 0, total: rows.length, entries: [] };
    // Fixed offsets keep two clear neighbours and one outer glimpse per side.
    // At either boundary the view becomes shorter; it never shifts its centre.
    return {
      position: index + 1,
      total: rows.length,
      entries: rows.slice(Math.max(0, index - 3), index + 4).map((row, offset) => {
        const rowIndex = Math.max(0, index - 3) + offset;
        return { row, position: rowIndex + 1, distance: rowIndex - index };
      })
    };
  }

  function rowHTML(entry, selectedName) {
    const { row, position, distance } = entry;
    const selected = distance === 0;
    const peek = Math.abs(distance) === 3;
    const gymnast = row.gymnast || {};
    const details = `<span class="swlp-row-position"><span class="sr">Position </span>${position}</span>
      <span class="swlp-row-avatar" aria-hidden="true">${escapeHTML(initials(gymnast.name))}</span>
      <span class="swlp-row-person"><strong>${escapeHTML(gymnast.name)}</strong>
        <small>${selected ? 'Your selected gymnast' : escapeHTML(gymnast.coach || '')}</small></span>
      <span class="swlp-row-score"><strong>${displayNumber(row.points)}</strong><small>pts</small></span>`;
    if (peek) {
      return `<li class="swlp-row swlp-peek" data-placement-position="${position}" data-placement-peek="${distance < 0 ? 'above' : 'below'}" aria-hidden="true">
        <div class="swlp-peek-content">${details}</div><span class="swlp-peek-label">${distance < 0 ? 'Just above' : 'Just below'}</span></li>`;
    }
    return `<li class="swlp-row${selected ? ' swlp-selected' : ''}${Math.abs(distance) === 2 ? ' swlp-outer' : ''}" data-placement-position="${position}"${selected ? ' data-placement-selected="true" aria-label="' + escapeHTML(selectedName) + ', position ' + position + ', ' + displayNumber(row.points) + ' points"' : ''}>${details}</li>`;
  }

  function boardHTML(board, gymnast) {
    const rows = Array.isArray(board.rows) ? board.rows : [];
    const window = placementWindow(rows, gymnast.id);
    const safeId = String(board.id || '').replace(/[^a-z0-9_-]/gi, '');
    return `<article class="swlp-board" style="--placement-accent:${accent(board.color)}" data-placement-board="${escapeHTML(board.id)}" aria-labelledby="placement-board-${safeId}">
      <header class="swlp-board-head"><span class="swlp-board-icon" aria-hidden="true">${escapeHTML(board.icon || '✦')}</span>
        <div><h3 id="placement-board-${safeId}">${escapeHTML(board.name)}</h3><p>${window.position ? 'The positions around you' : 'Waiting for scores'}</p></div>
        ${window.position ? `<span class="swlp-board-position"><span class="sr">Position </span><strong>${window.position}</strong><small>of ${window.total}</small></span>` : ''}</header>
      ${window.position ? `<ol class="swlp-rows" aria-label="Nearby ${escapeHTML(board.name)} positions">${window.entries.map(entry => rowHTML(entry, gymnast.name)).join('')}</ol>`
        : '<p class="swlp-empty">This placement will appear when the scores are ready.</p>'}
    </article>`;
  }

  function render({ gymnast, boards, motionOff = false } = {}) {
    const host = document.getElementById('placementContent');
    if (!host || !gymnast || !Array.isArray(boards)) return null;
    const overall = boards.find(board => board.id === 'overall');
    const overallRows = Array.isArray(overall?.rows) ? overall.rows : [];
    const overallWindow = placementWindow(overallRows, gymnast.id);
    const selected = overallRows.find(row => row?.gymnast?.id === gymnast.id) || {};
    host.setAttribute('data-placement-motion', motionOff ? 'off' : 'on');
    host.innerHTML = `<div class="swlp-profile">
      <button class="swlp-back" type="button" data-back-to-skills><span aria-hidden="true">←</span> Back to skills</button>
      <header class="swlp-hero">
        <div class="swlp-identity"><span class="swlp-avatar" aria-hidden="true">${escapeHTML(initials(gymnast.name))}</span>
          <div><p class="swlp-eyebrow">Placement profile</p><h2 id="placementTitle" tabindex="-1">${escapeHTML(gymnast.name)}</h2>
            <p class="swlp-coach">${escapeHTML(gymnast.coach || 'Your league')}<span aria-hidden="true"> · </span>SWL Skill League</p></div></div>
        <div class="swlp-overall"><p>Overall position</p><strong>${overallWindow.position ? `<span aria-hidden="true">#</span>${overallWindow.position}` : '—'}</strong>
          <small>${overallWindow.position ? `of ${overallWindow.total} gymnasts` : 'Scores are loading'}</small></div>
        <div class="swlp-facts" aria-label="Gymnast score summary">
          <span><strong>${displayNumber(selected.points)}</strong><small>total points</small></span>
          <span><strong>${displayNumber(selected.achieved)}</strong><small>skills achieved</small></span>
          <span><strong>${displayNumber(selected.perfect)}</strong><small>skills perfect</small></span>
        </div>
      </header>
      <div class="swlp-section-head"><div><p class="swlp-eyebrow">Your place in the league</p><h3>A closer look at every board</h3></div>
        <p>Two places above and below.<br> The next place is a little glimpse.</p></div>
      <div class="swlp-grid">${boards.map(board => boardHTML(board, gymnast)).join('')}</div>
      <p class="swlp-order-note">Equal points are listed alphabetically by name; the position follows that order. At the top or bottom of a board, fewer neighbours are shown.</p>
    </div>`;
    return document.getElementById('placementTitle');
  }

  window.SWLPlacement = Object.freeze({ render });
})();
