(() => {
  'use strict';

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const points = value => Number.isFinite(value) ? value : 0;
  const ordinal = rank => rank === 1 ? 'First' : rank === 2 ? 'Second' : rank === 3 ? 'Third' : String(rank);

  // Input is sorted by points descending, then alphabetically by name.
  // Every gymnast has their own numbered place, including equal scores.
  function rankRows(rows) {
    return rows.map((row, index) => ({...row, rank: index + 1}));
  }

  function visibleRows(rows) {
    const ranked = rankRows(rows);
    return {shown: ranked.filter(row => row.rank <= 5), next: ranked.find(row => row.rank > 5) || null};
  }

  function commit(host, html) {
    if (!host || host._renderedHTML === html) return;
    const scrollSelector = '.v3-podium-stack,.v3-category-rows,.v3-ranking-tail';
    const scrollKey = element => {
      const board = element.closest('[data-leaderboard]');
      return JSON.stringify([board?.dataset.leaderboard,board?.querySelector('.v3-board-scope')?.textContent,element.className,element.closest('[data-podium-rank]')?.dataset.podiumRank]);
    };
    const scroll = new Map(Array.from(host.querySelectorAll(scrollSelector), element => [scrollKey(element),element.scrollTop]));
    const focus = document.activeElement;
    const selected = focus && host.contains(focus) ? {gymnast:focus.dataset.gymnast,board:focus.closest('[data-leaderboard]')?.dataset.leaderboard} : null;
    host.innerHTML = html;
    host._renderedHTML = html;
    host.querySelectorAll(scrollSelector).forEach(element => {element.scrollTop = scroll.get(scrollKey(element)) || 0;});
    if (selected?.gymnast && document.activeElement === document.body) {
      const target = Array.from(host.querySelectorAll('[data-gymnast]')).find(element => element.dataset.gymnast === selected.gymnast && element.closest('[data-leaderboard]')?.dataset.leaderboard === selected.board);
      target?.focus({preventScroll:true});
    }
  }

  function renderBoard({board, rows, index = 0, max = 0, squad = 'All squads', age = 'All ages', groupLabel = value => value, initials = () => '', coachBadge = () => '', fireBadge = () => '', heatClass = () => '', isCoachParticipant = () => false}) {
    const {shown, next} = visibleRows(rows);
    const overall = board.id === 'overall';
    const person = row => `<span class="avatar" aria-hidden="true">${escapeHTML(initials(row.gymnast.name))}</span><span class="person"><strong>${escapeHTML(row.gymnast.name)} ${coachBadge(row.gymnast)} ${fireBadge(row.gymnast.id)}</strong><small>${escapeHTML(groupLabel(row.gymnast.coach))}</small></span><span class="score"><b>${points(row.points)}</b><small>pts</small></span>`;
    const card = row => {
      const medal = row.rank <= 3 ? ' medal ' + ['gold','silver','bronze'][row.rank - 1] : '';
      const podiumArt = overall && row.rank <= 3 ? `<span class="podium-light" aria-hidden="true"></span><span class="podium-edge" aria-hidden="true"></span>${row.rank === 1 ? '<span class="podium-leader"><svg aria-hidden="true" viewBox="0 0 32 24" fill="none"><path d="M4 6l7 5 5-8 5 8 7-5-3 15H7L4 6Z" fill="currentColor"/><path d="M9 17h14" stroke="#4b3417" stroke-width="1.5" stroke-linecap="round"/></svg>League leader</span>' : ''}` : '';
      return `<div class="v3-rank-item" role="listitem" data-rank="${row.rank}"><button type="button" class="rank-row${medal}${heatClass(row.gymnast.id)}" data-gymnast="${escapeHTML(row.gymnast.id)}" aria-label="Position ${row.rank}: ${escapeHTML(row.gymnast.name)}${isCoachParticipant(row.gymnast) ? ', coach' : ''}, ${points(row.points)} points. Open gymnast profile.">${podiumArt}<span class="place" aria-hidden="true">${String(row.rank).padStart(2,'0')}</span>${person(row)}</button></div>`;
    };
    const mystery = next ? `<div class="v3-rank-item v3-rank-preview" role="listitem" data-rank="${next.rank}"><div class="rank-row mystery"><span class="place" aria-hidden="true">${String(next.rank).padStart(2,'0')}</span><div class="ghost" aria-hidden="true">${person(next)}</div><span class="sr">Position ${next.rank}. Name and score concealed.</span></div><p class="mystery-note" aria-hidden="true">Just outside the top five places…</p></div>` : '';
    let content;
    if (overall) {
      const podium = [1,2,3].map(rank => {
        const row = shown.find(row => row.rank === rank);
        if (!row) return '';
        return `<div class="v3-podium-column v3-podium-place-${rank}" data-podium-rank="${rank}" role="group" aria-label="${ordinal(rank).toLowerCase()} place"><div class="v3-podium-label">${ordinal(rank)}</div><div class="v3-podium-stack">${card(row)}</div></div>`;
      }).join('');
      content = `${podium ? `<div class="v3-podium">${podium}</div>` : ''}<div class="v3-ranking-tail">${shown.filter(row => row.rank > 3).map(card).join('')}${mystery}</div>`;
    } else content = `<div class="v3-category-rows">${shown.map(card).join('')}${mystery}</div>`;
    const color = /^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(board.color || '') ? board.color : '#bd9bff';
    return `<article class="board v3-board${overall ? ' overall' : ''}" data-leaderboard="${escapeHTML(board.id)}" style="--accent:${color};--delay:${index * 70}ms"><div class="board-head"><span class="board-icon" aria-hidden="true">${escapeHTML(board.icon)}</span><div><h3>${escapeHTML(board.name)}</h3><p>${overall ? 'The complete picture' : 'Perfect earns double'}</p></div><span class="max">MAX<b>${points(max)} pts</b></span></div><div class="v3-board-scope" aria-label="Leaderboard filters"><span class="v3-scope-squad">${escapeHTML(squad)}</span><span class="v3-scope-age">${escapeHTML(age)}</span></div>${shown.length ? `<div class="ranking v3-ranking" role="list" aria-label="${escapeHTML(board.name)}: ${escapeHTML(squad)}, ${escapeHTML(age)}">${content}</div>` : '<p class="v3-board-empty">No gymnasts match these filters.</p>'}</article>`;
  }

  window.SWLRankings = Object.freeze({rankRows, visibleRows, renderBoard, commit});
})();
