// Scoring is always open. Retained as an inert compatibility asset for older cached pages.
(() => {
  'use strict';
  window.SWLLock = Object.freeze({
    open() { return false; },
    close() {},
    setBusy() {}
  });
})();
