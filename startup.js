(() => {
  'use strict';
  if (window.SWLStartup) return;

  const MINIMUM_MS = 900;
  const EXIT_MS = 4000;
  const MAXIMUM_MS = 12000;
  const REVEAL_MS = 520;
  let startedAt = 0;
  let started = false;
  let finished = false;
  let leaving = false;
  let finishRequested = false;
  let queuedFinish = null;
  let overlay = null;
  let status = null;
  let enter = null;
  let previousFocus = null;
  let previousOverflow = null;
  let motionQuery = null;
  let motionPaused = false;
  let minimumTimer;
  let exitTimer;
  let safetyTimer;
  let removalTimer;
  const protectedElements = [];

  const reducedMotion = () => motionPaused || Boolean(motionQuery?.matches) ||
    document.body?.classList.contains('no-motion');

  function updateMotion() {
    if (overlay) overlay.dataset.static = String(reducedMotion());
  }

  function onStorage(event) {
    if (event.key !== 'swl-motion-paused') return;
    motionPaused = event.newValue === 'true';
    updateMotion();
  }

  function restoreApp() {
    if (finished) return;
    finished = true;
    clearTimeout(minimumTimer);
    clearTimeout(exitTimer);
    clearTimeout(safetyTimer);
    clearTimeout(removalTimer);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('DOMContentLoaded', start);
    window.removeEventListener('storage', onStorage);
    try { motionQuery?.removeEventListener('change', updateMotion); } catch {}

    const focusWasInOverlay = overlay?.contains(document.activeElement);
    for (const item of protectedElements) {
      try {
        if (item.inert) item.element.setAttribute('inert', '');
        else item.element.removeAttribute('inert');
        if (item.ariaHidden === null) item.element.removeAttribute('aria-hidden');
        else item.element.setAttribute('aria-hidden', item.ariaHidden);
      } catch {}
    }
    if (previousOverflow && document.body) {
      document.body.style.overflow = previousOverflow.body;
      document.documentElement.style.overflow = previousOverflow.html;
    }
    try { overlay?.remove(); } catch {}
    overlay = null;

    // Restore a real control if one had focus; otherwise reveal the main landmark.
    if (focusWasInOverlay) {
      const target = previousFocus?.isConnected && previousFocus !== document.body &&
        !previousFocus.closest('[inert]') && !previousFocus.disabled
        ? previousFocus : document.getElementById('main');
      try { target?.focus({ preventScroll: true }); } catch {}
    }
  }

  function leave() {
    if (finished || leaving) return;
    leaving = true;
    clearTimeout(minimumTimer);
    clearTimeout(exitTimer);
    clearTimeout(safetyTimer);
    try {
      overlay?.classList.add('swl-startup--leaving');
      removalTimer = setTimeout(restoreApp, reducedMotion() ? 0 : REVEAL_MS);
    } catch {
      restoreApp();
    }
  }

  function finish(options = {}) {
    if (finished || leaving || finishRequested) return;
    if (!started) { queuedFinish = options; return; }
    finishRequested = true;
    if (status) status.textContent = options.error
      ? 'Opening your league. You can retry the connection there.'
      : 'Your league is ready.';
    const remaining = Math.max(0, MINIMUM_MS - (performance.now() - startedAt));
    minimumTimer = setTimeout(leave, remaining);
  }

  function onKeyDown(event) {
    if (finished || !overlay) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      leave();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const target = enter && !enter.hidden ? enter : overlay;
      try { target.focus({ preventScroll: true }); } catch {}
    }
  }

  function start() {
    if (started || finished) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', start, { once: true });
      return;
    }
    started = true;
    startedAt = performance.now();
    // Set the fail-open deadline before touching focus or app interactivity.
    safetyTimer = setTimeout(leave, MAXIMUM_MS - REVEAL_MS);
    try {
      try { motionPaused = localStorage.getItem('swl-motion-paused') === 'true'; } catch {}
      try { motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch {}
      previousFocus = document.activeElement;
      overlay = document.createElement('div');
      overlay.className = 'swl-startup';
      overlay.tabIndex = -1;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'swlStartupTitle');
      overlay.setAttribute('aria-describedby', 'swlStartupStatus');
      // These essential styles keep the exit usable even if the CSS file fails.
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background-color:#0d0e13;color:#f6f4f8;';
      overlay.innerHTML = `
        <div class="swl-startup__content">
          <p class="swl-startup__eyebrow">SWL GYMNASTICS</p>
          <div class="swl-startup__stage" aria-hidden="true">
            <span class="swl-startup__ring swl-startup__ring--outer"></span>
            <span class="swl-startup__ring swl-startup__ring--inner"></span>
            <span class="swl-startup__ring swl-startup__ring--light"></span>
            <span class="swl-startup__satellite"></span>
            <img class="swl-startup__logo" src="./swl-logo.png" alt="" width="2000" height="1125" style="max-width:158px;height:auto;filter:invert(1)">
          </div>
          <h2 class="swl-startup__title" id="swlStartupTitle">SWL SKILL <span>LEAGUE</span></h2>
          <p class="swl-startup__status" id="swlStartupStatus" role="status" aria-live="polite">Connecting your league to Google Sheets…</p>
          <div class="swl-startup__progress" aria-hidden="true"></div>
          <div class="swl-startup__escape">
            <button class="swl-startup__enter" type="button" hidden>Enter league ↗</button>
            <p class="swl-startup__hint" hidden>You can enter while your scores finish loading.</p>
          </div>
          <p class="swl-startup__signature">SWL · TRAIN WITH PURPOSE</p>
        </div>`;
      status = overlay.querySelector('#swlStartupStatus');
      enter = overlay.querySelector('.swl-startup__enter');
      enter.addEventListener('click', leave);
      document.body.append(overlay);
      updateMotion();
      document.addEventListener('keydown', onKeyDown, true);
      window.addEventListener('storage', onStorage);
      try { motionQuery?.addEventListener('change', updateMotion); } catch {}
      try { overlay.focus({ preventScroll: true }); } catch {}

      for (const element of document.querySelectorAll('body > header, body > main, body > footer, body > .skip, body > #toast')) {
        protectedElements.push({ element, inert: element.hasAttribute('inert'),
          ariaHidden: element.getAttribute('aria-hidden') });
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      }
      previousOverflow = { body: document.body.style.overflow,
        html: document.documentElement.style.overflow };
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      exitTimer = setTimeout(() => {
        if (!overlay || finished || leaving) return;
        enter.hidden = false;
        overlay.querySelector('.swl-startup__hint').hidden = false;
        if (!finishRequested) status.textContent = 'Your scores are taking a little longer. The league is ready to open.';
      }, EXIT_MS);
      if (queuedFinish !== null) finish(queuedFinish);
    } catch {
      restoreApp();
    }
  }

  window.SWLStartup = Object.freeze({
    finish,
    get active() { return started && !finished; }
  });
  start();
})();
