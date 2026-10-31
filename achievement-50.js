/* Historical award: an explicit recognition, independent of the live score. */
(() => {
  'use strict';
  let mounted = false, dialog = null, opener = null;
  const eligible = gymnast => gymnast?.id === 'g03' && String(gymnast.name || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB') === 'lexi primrose';
  const emblem = `<svg viewBox="0 0 54 32" aria-hidden="true" focusable="false"><path class="award-seal" d="M8 2h38l6 7v14l-6 7H8l-6-7V9z"/><path class="award-inset" d="M10 5h34l5 5v12l-5 5H10l-5-5V10z"/><text class="award-number" x="27" y="22" text-anchor="middle">250</text></svg>`;

  function badge(gymnast) {
    if (!eligible(gymnast)) return '';
    return `<button type="button" class="swl-achievement-badge" data-swl-achievement="first-250" aria-label="Lexi’s achievement: first to 250 Floor points" aria-haspopup="dialog" title="First to 250 Floor points"><span class="swl-achievement-emblem">${emblem}</span></button>`;
  }

  function restoreFocus() {
    const target = opener?.isConnected ? opener : document.querySelector('[data-swl-achievement="first-250"]');
    opener = null;
    target?.focus({preventScroll:true});
  }

  function close() {
    if (dialog?.open) dialog.close();
  }

  function createDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'swl-achievement-dialog';
    dialog.setAttribute('aria-labelledby','swlAchievementTitle');
    dialog.setAttribute('aria-describedby','swlAchievementDescription');
    dialog.innerHTML = `<button type="button" class="swl-achievement-close" aria-label="Close achievement">×</button><span class="swl-achievement-large" aria-hidden="true">${emblem}</span><p class="swl-achievement-eyebrow">A place in SWL history</p><h2 id="swlAchievementTitle">First to 250</h2><p class="swl-achievement-recipient">Lexi Primrose</p><p id="swlAchievementDescription">Lexi was the first gymnast to reach 250 Floor points.</p><p class="swl-achievement-note">A lasting achievement, even as her current points change.</p><button type="button" class="swl-achievement-done">Brilliant work, Lexi</button>`;
    dialog.querySelector('.swl-achievement-close').addEventListener('click',close);
    dialog.querySelector('.swl-achievement-done').addEventListener('click',close);
    dialog.addEventListener('close',restoreFocus);
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function mount() {
    if(mounted)return;
    mounted=true;
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-swl-achievement="first-250"]');
      if(!button)return;
      event.preventDefault();event.stopPropagation();
      const panel=createDialog();
      if(panel.open)return;
      opener=button;
      try {
        panel.showModal();
        panel.querySelector('.swl-achievement-done').focus({preventScroll:true});
      } catch (_) {
        opener=null;
      }
    },true);
  }

  window.SWLAchievements=Object.freeze({badge,eligible,mount});
})();
