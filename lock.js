(() => {
  'use strict';
  if (window.SWLLock?.version === 1) return;

  let dialog = null, dots = [], status = null, count = null, keys = [];
  let options = null, pin = '', submitting = false, externalBusy = false;
  let previousFocus = null, previousOverflow = '', lastKey = null;
  let generation = 0, active = false, closeReason = 'cancelled';
  const busy = () => submitting || externalBusy;

  function make(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function render() {
    const pending = busy();
    dialog.setAttribute('aria-busy', String(pending));
    dialog.classList.toggle('is-busy', pending);
    dots.forEach((dot, index) => dot.classList.toggle('is-filled', index < (submitting ? 4 : pin.length)));
    count.textContent = pending ? 'Checking the code.' : `${pin.length} of 4 digits entered.`;
    keys.forEach(key => { key.disabled = pending || (key.dataset.action === 'backspace' && !pin.length); });
    if (pending) {
      status.classList.remove('is-error');
      status.textContent = 'Checking the code…';
    }
  }

  function focusKey() {
    const target = lastKey?.isConnected && !lastKey.disabled ? lastKey : keys.find(key => key.dataset.digit === '1');
    try { target?.focus({ preventScroll: true }); } catch (_) {}
  }

  function completeClose() {
    if (!active) return;
    const callback = options?.onClose;
    const reason = closeReason;
    const restore = previousFocus;
    generation++;
    active = false;
    options = null;
    pin = '';
    submitting = false;
    externalBusy = false;
    previousFocus = null;
    lastKey = null;
    document.body.style.overflow = previousOverflow;
    dots.forEach(dot => dot.classList.remove('is-filled'));
    status.textContent = '';
    count.textContent = '';
    if (restore?.isConnected && !restore.disabled) {
      try { restore.focus({ preventScroll: true }); } catch (_) {}
    }
    if (typeof callback === 'function') {
      try { callback({ reason }); } catch (_) {}
    }
  }

  function close() {
    if (!active || busy()) return false;
    closeReason = 'cancelled';
    dialog.close();
    completeClose();
    return true;
  }

  async function submit() {
    if (!active || busy() || pin.length !== 4) return;
    const token = generation;
    const callback = options.onSubmit;
    submitting = true;
    render();
    // The code stays in this closure only; it is never put into DOM, storage,
    // a URL, or an asset. The caller performs the actual server verification.
    let entered = pin;
    pin = '';
    try {
      let request;
      try { request = callback(entered); } finally { entered = ''; }
      const result = await request;
      if (!active || token !== generation) return;
      if (result?.ok !== true) {
        throw Error(typeof result?.message === 'string' && result.message.trim()
          ? result.message : 'The code could not be verified. Please try again.');
      }
      submitting = false;
      externalBusy = false;
      closeReason = 'unlocked';
      dialog.close();
      completeClose();
    } catch (error) {
      if (!active || token !== generation) return;
      pin = '';
      submitting = false;
      externalBusy = false;
      render();
      status.classList.add('is-error');
      status.textContent = typeof error?.message === 'string' && error.message.trim()
        ? error.message.slice(0, 240) : 'The code could not be verified. Please try again.';
      focusKey();
    }
  }

  function enterDigit(digit) {
    if (!active || busy() || pin.length >= 4 || !/^[0-9]$/.test(digit)) return;
    status.textContent = '';
    status.classList.remove('is-error');
    pin += digit;
    render();
    if (pin.length === 4) void submit();
  }

  function backspace(clear = false) {
    if (!active || busy()) return;
    pin = clear ? '' : pin.slice(0, -1);
    status.textContent = '';
    status.classList.remove('is-error');
    render();
  }

  function initialize() {
    if (dialog) return;
    dialog = make('dialog', 'swl-lock');
    dialog.id = 'swlLockDialog';
    dialog.setAttribute('aria-labelledby', 'swlLockTitle');
    dialog.setAttribute('aria-describedby', 'swlLockDescription');
    const heading = make('div', 'swl-lock-heading');
    const icon = make('span', 'swl-lock-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3"/><rect x="4.5" y="10" width="15" height="11" rx="3"/><path d="M12 14v3"/></svg>';
    const title = make('h2', 'swl-lock-title', 'Unlock scoring');
    title.id = 'swlLockTitle';
    heading.append(icon, title);
    const description = make('p', 'swl-lock-description', 'Enter the 4-digit code to enable scoring for everyone.');
    description.id = 'swlLockDescription';
    const display = make('div', 'swl-lock-dots');
    display.setAttribute('aria-hidden', 'true');
    dots = Array.from({ length: 4 }, () => make('span', 'swl-lock-dot'));
    display.append(...dots);
    count = make('p', 'swl-lock-sr');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    status = make('p', 'swl-lock-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const keypad = make('div', 'swl-lock-keypad');
    keypad.setAttribute('role', 'group');
    keypad.setAttribute('aria-label', 'Code keypad');
    for (const value of ['1','2','3','4','5','6','7','8','9','close','0','backspace']) {
      const key = make('button', 'swl-lock-key' + (/^[0-9]$/.test(value) ? '' : ' swl-lock-key--action'));
      key.type = 'button';
      if (/^[0-9]$/.test(value)) {
        key.dataset.digit = value;
        key.textContent = value;
        key.setAttribute('aria-label', `Digit ${value}`);
      } else {
        key.dataset.action = value;
        const glyph = make('span', 'swl-lock-key-glyph', value === 'close' ? '×' : '⌫');
        glyph.setAttribute('aria-hidden', 'true');
        key.append(glyph, make('span', 'swl-lock-key-label', value === 'close' ? 'Close' : 'Delete'));
        key.setAttribute('aria-label', value === 'close' ? 'Close unlock scoring' : 'Delete last digit');
      }
      key.addEventListener('click', () => {
        lastKey = key;
        if (key.dataset.digit !== undefined) enterDigit(key.dataset.digit);
        else if (value === 'close') close();
        else backspace();
      });
      keys.push(key);
      keypad.append(key);
    }
    dialog.append(heading, description, display, count, status, keypad);
    dialog.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (/^[0-9]$/.test(event.key)) { event.preventDefault(); if (!event.repeat) enterDigit(event.key); }
      else if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); backspace(event.key === 'Delete'); }
      else if (event.key === 'Escape') { event.preventDefault(); close(); }
      // Enter/Space keep native button activation; the fourth digit submits.
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    // Native close events can arrive after an onClose callback reopens the
    // keypad. An older close must not dismantle that new modal session.
    dialog.addEventListener('close', () => { if (!dialog.open) completeClose(); });
    document.body.append(dialog);
  }

  function open(nextOptions) {
    if (active) { if (!busy()) focusKey(); return false; }
    if (typeof nextOptions?.onSubmit !== 'function') throw TypeError('SWLLock.open requires an onSubmit callback.');
    if (!document.body) throw Error('The unlock keypad is not ready yet.');
    initialize();
    if (typeof dialog.showModal !== 'function') throw Error('This browser cannot open the scoring keypad. Please use a current browser.');
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    options = nextOptions;
    pin = '';
    submitting = false;
    externalBusy = false;
    closeReason = 'cancelled';
    status.textContent = '';
    status.classList.remove('is-error');
    generation++;
    active = true;
    render();
    try {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      focusKey();
      return true;
    } catch (error) {
      completeClose();
      throw error;
    }
  }

  function setBusy(value) {
    if (!active) return false;
    externalBusy = Boolean(value);
    if (!busy()) status.textContent = '';
    render();
    return true;
  }

  window.SWLLock = Object.freeze({ version: 1, open, close, setBusy,
    get active() { return active; }, get busy() { return busy(); } });
})();
