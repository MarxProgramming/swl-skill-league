(() => {
  'use strict';
  const ROUND_SECONDS = [5, 5, 4, 4, 3];
  const OBJECTS = [
    { id: 'star', name: 'Star', color: '#ffd982', art: '<path d="m32 7 7.2 15.3 16.8 2.3-12.2 11.8 3 16.8L32 45l-14.8 8.2 3-16.8L8 24.6l16.8-2.3Z" fill="currentColor" stroke="none"/>' },
    { id: 'hoop', name: 'Hoop', color: '#c4a1ff', art: '<circle cx="32" cy="32" r="20" stroke-width="8"/><path d="M20 20a17 17 0 0 1 12-5" stroke="white" opacity=".6" stroke-width="3"/>' },
    { id: 'ball', name: 'Ball', color: '#ffabc8', art: '<circle cx="32" cy="32" r="23" fill="currentColor" stroke="none"/><path d="M14 18c20 1 34 15 36 31M45 13C23 23 21 35 24 52" stroke="#381c3a" opacity=".5" stroke-width="4"/>' },
    { id: 'cone', name: 'Cone', color: '#ffb17c', art: '<path d="m32 9 19 42H13L32 9Z" fill="currentColor" stroke="none"/><path d="M8 53h48" stroke-width="6"/><path d="M25 26h14M19 40h26" stroke="white" opacity=".7" stroke-width="5"/>' },
    { id: 'ribbon', name: 'Ribbon', color: '#83deec', art: '<path d="M14 52 31 35" stroke="white" stroke-width="4"/><path d="M31 35c30 3 28-26 10-24-23 2-29 22-12 19 28-5 22 24 3 19" stroke-width="8"/>' },
    { id: 'trophy', name: 'Trophy', color: '#dcf78f', art: '<path d="M20 10h24v13c0 12-5 17-12 17s-12-5-12-17Z" fill="currentColor" stroke="none"/><path d="M19 15H9v8c0 8 8 10 14 10M45 15h10v8c0 8-8 10-14 10M32 40v12M23 54h18" stroke-width="5"/>' },
    { id: 'lightning', name: 'Lightning', color: '#a6c5ff', art: '<path d="M36 6 13 36h17l-3 22 24-33H34Z" fill="currentColor" stroke="none"/>' },
    { id: 'heart', name: 'Heart', color: '#ed9df2', art: '<path d="M32 54C-8 29 14-1 32 19 50-1 72 29 32 54Z" fill="currentColor" stroke="none"/>' }
  ];
  let current = null;

  function icon(object) {
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${object.art}</svg>`;
  }

  function shuffled(values) {
    const result = values.slice();
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function createGame(container, initialOptions) {
    let options = initialOptions || {};
    let active = true, destroyed = false, generation = 0;
    const timers = new Set();
    const state = { phase: 'intro', round: 0, score: 0, results: [], seconds: 0, original: [], changed: [], answer: -1, choice: -1 };
    container.innerHTML = '<section class="swlm-game" aria-label="Spot the Switch"><div data-memory-view></div><p class="sr" data-memory-live role="status" aria-live="polite" aria-atomic="true"></p></section>';
    const shell = container.querySelector('.swlm-game');
    const view = container.querySelector('[data-memory-view]');
    const live = container.querySelector('[data-memory-live]');

    function announce(message) { live.textContent = message; }
    function motionOff() {
      try {
        return Boolean(typeof options.motionOff === 'function' ? options.motionOff() : options.motionOff) ||
          Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
          Boolean(document.body?.classList.contains('no-motion'));
      } catch (_) { return true; }
    }
    function sound(kind) {
      try {
        const result = options.playSound?.(kind);
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch (_) {}
    }
    function cancelTimers() {
      generation++;
      timers.forEach(id => clearTimeout(id));
      timers.clear();
    }
    function later(callback, milliseconds) {
      const token = generation;
      const id = setTimeout(() => {
        timers.delete(id);
        if (!destroyed && active && token === generation && !document.hidden) callback();
      }, milliseconds);
      timers.add(id);
    }
    function focusPrompt() { view.querySelector('[data-memory-prompt]')?.focus({ preventScroll: true }); }
    function header() {
      return `<header class="swlm-header"><div><p class="swlm-eyebrow">Eyes sharp. Team ready.</p><h3>Spot the Switch<span aria-hidden="true">✦</span></h3></div>
        <span class="swlm-score"><strong>${state.score}</strong><span>of 5 found</span></span></header>
        <div class="swlm-rounds" aria-label="${state.results.length} of 5 rounds answered">${ROUND_SECONDS.map((_, index) => `<span class="${index < state.results.length ? state.results[index] ? 'is-found' : 'is-revealed' : index === state.round - 1 ? 'is-current' : ''}" aria-label="Round ${index + 1}${index < state.results.length ? state.results[index] ? ': found' : ': revealed' : ''}">${index < state.results.length ? state.results[index] ? '✓' : '✦' : index + 1}</span>`).join('')}</div>`;
    }
    function board() {
      const covered = state.phase === 'cover' || state.phase === 'paused';
      const guessing = state.phase === 'choose';
      const revealed = state.phase === 'feedback';
      const objects = state.phase === 'memorize' ? state.original : state.changed;
      return `<div class="swlm-board" role="group" aria-label="Six object positions">${objects.map((object, index) => {
        const correct = revealed && index === state.answer;
        const chosen = revealed && index === state.choice && !correct;
        const label = covered ? `Position ${index + 1}, hidden` : `Position ${index + 1}, ${object.name}${guessing ? '. Choose this object' : correct ? '. This one changed' : ''}`;
        return `<button type="button" class="swlm-tile${covered ? ' is-covered' : ''}${correct ? ' is-answer' : ''}${chosen ? ' is-choice' : ''}" data-memory-tile="${index}" data-memory-icon="${covered ? 'hidden' : object.id}" style="--memory-color:${covered ? '#c4a1ff' : object.color}" aria-label="${label}"${guessing ? '' : ' disabled'}>
          <span class="swlm-tile-number" aria-hidden="true">${index + 1}</span><span class="swlm-object">${covered ? '<span class="swlm-question" aria-hidden="true">?</span>' : icon(object)}</span>
          <span class="swlm-object-name">${covered ? 'Hidden' : object.name}</span>${correct ? '<span class="swlm-tile-tag">Changed!</span>' : chosen ? '<span class="swlm-tile-tag">Your pick</span>' : ''}</button>`;
      }).join('')}</div>`;
    }
    function render(focus = false) {
      shell.dataset.phase = state.phase;
      shell.dataset.motion = motionOff() ? 'off' : 'on';
      shell.dataset.round = String(state.round);
      let body = '';
      if (state.phase === 'intro') {
        body = `<div class="swlm-intro"><div class="swlm-intro-art" aria-hidden="true">${[OBJECTS[0], OBJECTS[4], OBJECTS[3]].map(object => `<span style="--memory-color:${object.color}">${icon(object)}</span>`).join('')}</div>
          <h4 data-memory-prompt tabindex="-1">One tiny switch.<br>Six pairs of sharp eyes?</h4><p>Remember six objects. They’ll hide for a moment, then <strong>one object changes</strong>. Can your team spot it?</p>
          <ol class="swlm-instructions"><li><b>Look</b><span>You get 5 seconds to remember.</span></li><li><b>Spot</b><span>Point to the object that changed.</span></li><li><b>Choose</b><span>The coach taps your team’s answer.</span></li></ol>
          <button type="button" class="swlm-primary" data-memory-action="start">Go · start spotting <span aria-hidden="true">→</span></button><small class="swlm-coach-note">5 rounds · gets a little quicker · no need to move around</small></div>`;
      } else if (state.phase === 'finished') {
        const title = state.score === 5 ? 'Nothing gets past you!' : state.score >= 3 ? 'Super spotting, team!' : 'Great detective work!';
        body = `<div class="swlm-finish"><span class="swlm-finish-star" aria-hidden="true">✦</span><p class="swlm-eyebrow">Five switches. One brilliant team.</p><h4 data-memory-prompt tabindex="-1">${title}</h4><div class="swlm-final-score">${state.score}<small>/ 5</small></div><p>${state.score === 5 ? 'You found every switch. Ready for another challenge?' : 'Every round trains your eyes and memory. Have another go together.'}</p><button type="button" class="swlm-primary" data-memory-action="replay">Play again <span aria-hidden="true">↻</span></button></div>`;
      } else {
        let prompt = '', subline = '', action = '';
        if (state.phase === 'memorize') {
          prompt = 'Look closely. Remember these!';
          subline = 'Say the objects together, or remember where they are.';
        } else if (state.phase === 'cover') {
          prompt = 'A little switch is happening…';
          subline = 'Keep that picture in your head.';
        } else if (state.phase === 'choose') {
          prompt = 'Which one changed?';
          subline = 'Point together. Coach, tap your team’s answer.';
        } else if (state.phase === 'paused') {
          prompt = 'Your round is paused';
          subline = 'Ready again? We’ll restart this round with a fresh set of objects.';
          action = '<button type="button" class="swlm-primary" data-memory-action="resume">Resume this round <span aria-hidden="true">→</span></button>';
        } else if (state.phase === 'feedback') {
          const found = state.choice === state.answer;
          prompt = found ? 'You found the switch! +1' : 'There’s the sneaky switch!';
          subline = `${state.original[state.answer].name} changed into ${state.changed[state.answer].name}. ${found ? 'Sharp eyes, team.' : 'Look for the glowing tile. Ready for another try?'}`;
          action = `<button type="button" class="swlm-primary" data-memory-action="next">${state.round === 5 ? 'See your results' : 'Next round'} <span aria-hidden="true">→</span></button>`;
        }
        body = `<div class="swlm-stage"><div class="swlm-prompt"><div><p class="swlm-eyebrow">Round ${state.round} of 5${state.phase === 'memorize' ? ' · memorise' : ''}</p><h4 data-memory-prompt tabindex="-1">${prompt}</h4><p>${subline}</p></div>${state.phase === 'memorize' ? `<span class="swlm-countdown" data-memory-countdown aria-label="${state.seconds} seconds left">${state.seconds}</span>` : ''}</div>${board()}${action ? `<div class="swlm-action-row">${action}</div>` : ''}</div>`;
      }
      view.innerHTML = header() + body;
      if (focus) focusPrompt();
    }
    function tick() {
      if (state.phase !== 'memorize') return;
      state.seconds--;
      if (state.seconds > 0) {
        const counter = view.querySelector('[data-memory-countdown]');
        if (counter) { counter.textContent = String(state.seconds); counter.setAttribute('aria-label', `${state.seconds} seconds left`); }
        announce(`${state.seconds} seconds left.`);
        later(tick, 1000);
      } else {
        cancelTimers();
        state.phase = 'cover';
        render();
        announce('Objects hidden. One object is changing.');
        later(() => {
          state.phase = 'choose';
          render(true);
          announce('Which one changed? Choose one of the six objects.');
        }, 650);
      }
    }
    function startRound() {
      cancelTimers();
      const pool = shuffled(OBJECTS);
      state.original = pool.slice(0, 6);
      state.changed = state.original.slice();
      state.answer = Math.floor(Math.random() * 6);
      state.changed[state.answer] = pool[6 + Math.floor(Math.random() * 2)];
      state.choice = -1;
      state.seconds = ROUND_SECONDS[state.round - 1];
      state.phase = 'memorize';
      render(true);
      announce(`Round ${state.round} of 5. Remember these six objects. ${state.seconds} seconds.`);
      later(tick, 1000);
    }
    function onClick(event) {
      if (!active || destroyed || document.hidden) return;
      const button = event.target.closest('button');
      if (!button || !container.contains(button) || button.disabled) return;
      const action = button.dataset.memoryAction;
      if ((action === 'start' || action === 'replay') && (state.phase === 'intro' || state.phase === 'finished')) {
        state.round = 1; state.score = 0; state.results = [];
        sound('start');
        startRound();
      } else if (action === 'resume' && state.phase === 'paused') {
        sound('start');
        startRound();
      } else if (action === 'next' && state.phase === 'feedback') {
        if (state.round === 5) {
          cancelTimers(); state.phase = 'finished'; render(true);
          announce(`Game complete. Your team found ${state.score} out of 5 switches.`);
          sound('complete');
        } else { state.round++; startRound(); }
      } else if (button.dataset.memoryTile !== undefined && state.phase === 'choose') {
        const choice = Number(button.dataset.memoryTile);
        if (!Number.isInteger(choice) || choice < 0 || choice > 5) return;
        cancelTimers();
        state.choice = choice;
        const found = choice === state.answer;
        if (found) state.score++;
        state.results.push(found);
        state.phase = 'feedback'; render(true);
        announce(`${found ? 'Correct! One point.' : 'Good try.'} ${state.original[state.answer].name} changed into ${state.changed[state.answer].name}. ${state.score} switches found.`);
        sound(found ? 'correct' : 'reveal');
      }
    }
    function pause() {
      cancelTimers();
      if (['memorize', 'cover', 'choose'].includes(state.phase)) {
        state.phase = 'paused'; render();
        announce('Round paused. Resume to restart this round when everyone is ready.');
      }
    }
    function onVisibility() { if (document.hidden) pause(); }
    container.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    render();
    return {
      container,
      get destroyed() { return destroyed; },
      activate(nextOptions) { if (destroyed) return; active = true; if (nextOptions) options = nextOptions; render(); },
      deactivate() { if (destroyed) return; active = false; pause(); },
      destroy() {
        if (destroyed) return;
        destroyed = true; active = false; cancelTimers();
        container.removeEventListener('click', onClick);
        document.removeEventListener('visibilitychange', onVisibility);
        container.innerHTML = '';
      }
    };
  }

  window.SWLMemory = Object.freeze({
    mount(container, options) {
      if (!container || typeof container.querySelector !== 'function') return null;
      if (current?.container === container && !current.destroyed) { current.activate(options); return current; }
      current?.destroy();
      current = createGame(container, options);
      return current;
    },
    deactivate() { current?.deactivate(); },
    destroy() { current?.destroy(); current = null; }
  });
})();
