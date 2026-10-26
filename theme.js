/* Device preference only. Load in <head> before styles to prevent a theme flash. */
(function () {
  'use strict';
  var storageKey = 'swl-theme';
  var root = document.documentElement;
  var mode = 'dark';
  try { if (localStorage.getItem(storageKey) === 'light') mode = 'light'; } catch (_) {}
  var sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';
  var moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.6 13.1A8.7 8.7 0 0 1 10.9 3.4 8.8 8.8 0 1 0 20.6 13.1Z"/></svg>';
  function apply(next, persist) {
    mode = next === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#f6f4fa' : '#0d0e13');
    var button = document.getElementById('themeToggle');
    if (button) {
      button.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
      button.setAttribute('aria-label', 'Light mode');
      button.setAttribute('title', mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      button.innerHTML = mode === 'light' ? moon : sun;
    }
    if (persist) { try { localStorage.setItem(storageKey, mode); } catch (_) {} }
  }
  apply(mode, false);
  function connect() {
    var button = document.getElementById('themeToggle');
    if (!button || button.dataset.themeConnected) return;
    button.dataset.themeConnected = 'true';
    apply(mode, false);
    button.addEventListener('click', function () { apply(mode === 'light' ? 'dark' : 'light', true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', connect, { once: true });
  else connect();
  window.addEventListener('storage', function (event) {
    if (event.key === storageKey) apply(event.newValue === 'light' ? 'light' : 'dark', false);
  });
}());
