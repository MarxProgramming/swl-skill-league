(() => {
  'use strict';
  if (window.SWLStartup) return;

  const EXIT_MS = 1800;
  const MAXIMUM_MS = 6000;
  const REVEAL_MS = 420;
  let started = false;
  let finished = false;
  let leaving = false;
  let finishRequested = false;
  let queuedFinish = null;
  let overlay = null;
  let status = null;
  let enter = null;
  let previousFocus = null;
  let keyboardNavigation = false;
  let previousOverflow = null;
  let motionQuery = null;
  let motionPaused = false;
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
    clearTimeout(exitTimer);
    clearTimeout(safetyTimer);
    clearTimeout(removalTimer);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('pointerdown', onPointerDown, true);
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

    // Keep a previous control's focus. Only keyboard navigation needs a new
    // landmark focus; automatic/pointer reveals must not outline the whole page.
    if (focusWasInOverlay) {
      const target = previousFocus?.isConnected && previousFocus !== document.body &&
        !previousFocus.closest('[inert]') && !previousFocus.disabled
        ? previousFocus : keyboardNavigation ? document.getElementById('main') : null;
      try { target?.focus({ preventScroll: true }); } catch {}
    }
    try { window.dispatchEvent(new Event('swl:startup-finished')); } catch {}
  }

  function leave() {
    if (finished || leaving) return;
    leaving = true;
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
    if (status) status.textContent = options.error ? 'Opening training…' : 'Ready.';
    // Reveal as soon as data is ready; decoration never adds a minimum wait.
    leave();
  }

  function onPointerDown() {
    if (!finished) keyboardNavigation = false;
  }

  function onKeyDown(event) {
    if (finished || !overlay) return;
    if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) {
      keyboardNavigation = true;
    }
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
    // Set the fail-open deadline before touching focus or app interactivity.
    safetyTimer = setTimeout(leave, MAXIMUM_MS - REVEAL_MS);
    try {
      try { motionPaused = localStorage.getItem('swl-motion-paused') === 'true'; } catch {}
      try { motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch {}
      previousFocus = document.activeElement;
      overlay = document.createElement('div');
      overlay.className = 'swl-startup swl-startup--studio';
      overlay.tabIndex = -1;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Loading squad training');
      overlay.setAttribute('aria-describedby', 'swlStartupStatus');
      // These essential styles keep the exit usable even if the CSS file fails.
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background-color:#0d0e13;color:#f6f4f8;';
      overlay.innerHTML = `
        <div class="swl-startup__content">
          <img class="swl-startup__logo" src="./swl-logo.png" alt="SWL Gymnastics" width="2000" height="1125" style="max-width:196px;height:auto;filter:invert(1)">
          <div class="swl-startup__loader" aria-hidden="true"><i></i><i></i><i></i></div>
          <p class="swl-startup__status" id="swlStartupStatus" role="status" aria-live="polite">Loading…</p>
          <div class="swl-startup__escape">
            <button class="swl-startup__enter" type="button" hidden>Continue</button>
          </div>
        </div>`;
      status = overlay.querySelector('#swlStartupStatus');
      enter = overlay.querySelector('.swl-startup__enter');
      enter.addEventListener('click', event => {
        // Keyboard and assistive-technology activation has no pointer clicks.
        if (event?.detail === 0) keyboardNavigation = true;
        leave();
      });
      document.body.append(overlay);
      updateMotion();
      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('pointerdown', onPointerDown, true);
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
        if (!finishRequested) status.textContent = 'Loading…';
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
