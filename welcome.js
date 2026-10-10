(() => {
  'use strict';
  if (window.SWLWelcome?.version === 1) return;

  const SEEN_KEY = 'swl-welcome-seen-v1';
  let initialized = false, destroyed = false, active = false;
  let dismissedThisPage = false, requested = false;
  let dialog = null, backdrop = null, heading = null, closeButton = null, enterButton = null;
  let previousFocus = null, previousOverflow = null, protectedElements = [];
  let initialTimer = null;
  function hasSeen() {
    if (dismissedThisPage) return true;
    try { return window.localStorage?.getItem(SEEN_KEY) === 'true'; } catch (_) { return false; }
  }
  let automaticPending = !hasSeen();

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function focus(element) { try { element?.focus({ preventScroll: true }); } catch (_) {} }
  function isBlocked() {
    if (window.SWLStartup?.active || document.querySelector('.swl-startup')) return true;
    return [...document.querySelectorAll('dialog[open], [aria-modal="true"]')].some(element => {
      if (element === dialog || element.hidden || element.closest('[hidden]') || element.getAttribute('aria-hidden') === 'true') return false;
      return element.tagName !== 'DIALOG' || element.open || element.hasAttribute('open');
    });
  }
  function protectPage() {
    protectedElements = [...document.body.children].filter(element =>
      element !== dialog && element !== backdrop && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)
    ).map(element => ({ element, inert: element.hasAttribute('inert'), ariaHidden: element.getAttribute('aria-hidden') }));
    protectedElements.forEach(({ element }) => { element.setAttribute('inert', ''); element.setAttribute('aria-hidden', 'true'); });
    previousOverflow = { body: document.body.style.overflow, html: document.documentElement.style.overflow };
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  function restorePage() {
    protectedElements.forEach(({ element, inert, ariaHidden }) => {
      if (inert) element.setAttribute('inert', ''); else element.removeAttribute('inert');
      if (ariaHidden === null) element.removeAttribute('aria-hidden'); else element.setAttribute('aria-hidden', ariaHidden);
    });
    protectedElements = [];
    if (previousOverflow) {
      document.body.style.overflow = previousOverflow.body;
      document.documentElement.style.overflow = previousOverflow.html;
      previousOverflow = null;
    }
  }
  function finishClose(remember = true) {
    if (!active) return false;
    active = false;
    requested = false;
    automaticPending = false;
    if (remember) {
      dismissedThisPage = true;
      try { window.localStorage?.setItem(SEEN_KEY, 'true'); } catch (_) {}
    }
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('focusin', onFocusIn, true);
    if (dialog.open && typeof dialog.close === 'function') { try { dialog.close(); } catch (_) {} }
    dialog.removeAttribute('open');
    dialog.hidden = true;
    if (backdrop) backdrop.hidden = true;
    restorePage();
    const target = previousFocus?.isConnected && !previousFocus.disabled &&
      previousFocus !== document.body && !previousFocus.closest('[inert], [hidden]')
      ? previousFocus : document.getElementById('main');
    previousFocus = null;
    focus(target);
    return true;
  }
  function onKeyDown(event) {
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finishClose(); return; }
    if (event.key !== 'Tab') return;
    const first = closeButton, last = enterButton, current = document.activeElement;
    if (event.shiftKey && (current === first || current === heading || !dialog.contains(current))) {
      event.preventDefault(); focus(last);
    } else if (!event.shiftKey && (current === last || current === heading || !dialog.contains(current))) {
      event.preventDefault(); focus(first);
    }
  }
  function onFocusIn(event) { if (active && !dialog.contains(event.target)) focus(heading); }
  function build() {
    if (dialog) return;
    dialog = make('dialog', 'swl-welcome');
    dialog.id = 'swlWelcomeDialog';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'swlWelcomeTitle');
    dialog.setAttribute('aria-describedby', 'swlWelcomeIntro');
    const top = make('div', 'swl-welcome-top');
    const brand = make('div', 'swl-welcome-brand');
    const logo = make('img', 'swl-welcome-logo');
    logo.src = './swl-logo.png'; logo.alt = 'SWL Gymnastics'; logo.width = 2000; logo.height = 1125;
    brand.append(logo, make('span', '', 'SQUAD TRAINING'));
    closeButton = make('button', 'swl-welcome-close', '×'); closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close welcome note');
    closeButton.addEventListener('click', () => finishClose());
    top.append(brand, closeButton);
    const content = make('div', 'swl-welcome-content');
    content.append(make('p', 'swl-welcome-eyebrow', 'A SMALL EXTRA FOR OUR SQUADS'));
    heading = make('h2', '', 'A little extra motivation.');
    heading.id = 'swlWelcomeTitle'; heading.tabIndex = -1;
    const intro = make('p', 'swl-welcome-intro', 'I put this together as a small experiment alongside our usual squad training. Our normal training remains the main programme.');
    intro.id = 'swlWelcomeIntro';
    const purpose = make('p', '', 'I’d like it to help gymnasts keep on top of the foundational floor skills, see their current level and know what to aim for next. A bit of accountability and friendly competition within each squad can make those small achievements feel good.');
    const explore = make('p', '', 'There are some games for training too. Gymnasts and families are welcome to have a look around; coaches update the records when scoring is unlocked.');
    const highlights = make('div', 'swl-welcome-highlights'); highlights.setAttribute('aria-hidden', 'true');
    [['◇', 'Build the basics'], ['↗', 'See your progress'], ['✧', 'Train together']].forEach(([symbol, label]) => {
      const point = make('span'); point.append(make('i', '', symbol), make('b', '', label)); highlights.append(point);
    });
    const signoff = make('p', 'swl-welcome-signoff', 'A note from Marx');
    content.append(heading, intro, purpose, explore, highlights, signoff);
    const footer = make('div', 'swl-welcome-footer');
    enterButton = make('button', 'swl-welcome-enter'); enterButton.type = 'button';
    enterButton.append(make('span', '', 'Let’s take a look'));
    const arrow = make('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); enterButton.append(arrow);
    enterButton.addEventListener('click', () => finishClose());
    footer.append(enterButton);
    dialog.append(top, content, footer);
    dialog.addEventListener('cancel', event => { event.preventDefault(); finishClose(); });
    dialog.addEventListener('close', () => { if (active && !dialog.open && !dialog.hasAttribute('open')) finishClose(); });
    document.body.append(dialog);
  }
  function tryShow() {
    if (destroyed || !initialized || active || document.hidden || !document.body) return active;
    if (!requested && (!automaticPending || hasSeen())) { automaticPending = false; return false; }
    if (isBlocked()) return false;
    build();
    previousFocus = document.activeElement;
    dialog.hidden = false;
    let native = false;
    try { if (typeof dialog.showModal === 'function') { dialog.showModal(); native = true; } } catch (_) {}
    if (!native) {
      if (!backdrop) {
        backdrop = make('div', 'swl-welcome-backdrop'); backdrop.setAttribute('aria-hidden', 'true');
        backdrop.style.cssText = 'position:fixed;inset:0;background:#090a10c9;z-index:11000;'; document.body.append(backdrop);
      }
      backdrop.hidden = false;
      dialog.dataset.fallback = 'true'; dialog.setAttribute('open', '');
      dialog.style.cssText = 'position:fixed;inset:0;margin:auto;width:min(620px,calc(100% - 28px));max-height:calc(100dvh - 28px);overflow:auto;z-index:11001;background:#191821;color:#f6f4f8;';
    }
    protectPage();
    active = true;
    automaticPending = false;
    requested = false;
    dialog.scrollTop = 0;
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    focus(heading);
    return true;
  }
  function open() { if (destroyed) return false; requested = true; if (active) { requested = false; focus(heading); return true; } return tryShow(); }
  function onDocumentClick(event) {
    const button = event.target.closest?.('[data-open-welcome]');
    if (!button || button.disabled) return;
    event.preventDefault(); open();
  }
  function onStorage(event) { if (event.key === SEEN_KEY && event.newValue === 'true') { automaticPending = false; dismissedThisPage = true; } }
  function initialize() {
    if (initialized || destroyed || !document.body) return;
    initialized = true;
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('close', tryShow, true);
    document.addEventListener('visibilitychange', tryShow);
    window.addEventListener('storage', onStorage);
    tryShow();
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(initialTimer);
    finishClose(false);
    document.removeEventListener('DOMContentLoaded', initialize);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('close', tryShow, true);
    document.removeEventListener('visibilitychange', tryShow);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('swl:startup-finished', tryShow);
    dialog?.remove(); backdrop?.remove();
  }
  window.SWLWelcome = Object.freeze({ version: 1, open, close: () => finishClose(), destroy, get active() { return active; } });
  window.addEventListener('swl:startup-finished', tryShow);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialTimer = setTimeout(initialize, 0);
})();
