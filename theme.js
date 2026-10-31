/* Version 5.0 uses the dark palette on every device, before first paint. */
(() => {
  'use strict';
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.style.colorScheme = 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0d0e13');
})();
