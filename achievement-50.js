/* Saved achievements are lasting recognition, independent of current scores. */
(() => {
  'use strict';
  let mounted = false, dialog = null, opener = null, openerIdentity = null, returnKeyboard = false;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const eligible = gymnast => gymnast?.id === 'g03' && String(gymnast.name || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB') === 'lexi primrose';
  const isCoach = gymnast => [gymnast?.coach,...(Array.isArray(gymnast?.squads) ? gymnast.squads : [])].some(squad => String(squad || '').trim().toLowerCase() === 'coaches');
  const emblem = `<svg viewBox="0 0 54 32" aria-hidden="true" focusable="false"><path class="award-seal" d="M8 2h38l6 7v14l-6 7H8l-6-7V9z"/><path class="award-inset" d="M10 5h34l5 5v12l-5 5H10l-5-5V10z"/><text class="award-number" x="27" y="22" text-anchor="middle">250</text></svg>`;
  const challenges = Object.freeze({
    'floor-achieved':{apparatus:'Floor',letter:'F',level:'achieved',title:'All Floor skills achieved',description:'Every Floor skill was marked Achieved or Perfect.'},
    'vault-achieved':{apparatus:'Vault',letter:'V',level:'achieved',title:'All Vault skills achieved',description:'Every Vault skill was marked Achieved or Perfect.'},
    'floor-perfect':{apparatus:'Floor',letter:'F',level:'perfect',title:'All Floor skills perfect',description:'Every Floor skill was marked Perfect at the same time.'},
    'vault-perfect':{apparatus:'Vault',letter:'V',level:'perfect',title:'All Vault skills perfect',description:'Every Vault skill was marked Perfect at the same time.'}
  });
  const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  const earnedDate = value => new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'long',year:'numeric'}).format(new Date(value));

  function completionEmblem(challenge) {
    const shape = challenge.apparatus === 'Floor' ? '<path class="award-completion-face" d="M7 3h40l5 5v20l-5 5H7l-5-5V8z"/><path class="award-apparatus-detail" d="M7 27h11M7 24v5M18 24v5"/>' : '<path class="award-completion-face" d="M3 13C4-1 50-1 51 13v17l-5 3H8l-5-3z"/><path class="award-apparatus-detail" d="M7 27h11M9 27v3M16 27v3"/>';
    const ticks = challenge.level === 'perfect' ? '<path class="award-check" d="m26 18 4 4 8-10m-1 10 4 4 9-11"/>' : '<path class="award-check" d="m30 18 5 5 11-12"/>';
    return `<svg viewBox="0 0 54 36" aria-hidden="true" focusable="false">${shape}<text class="award-apparatus-letter" x="13" y="22" text-anchor="middle">${challenge.letter}</text>${ticks}</svg>`;
  }

  function badge(gymnast) {
    if (!eligible(gymnast)) return '';
    return `<button type="button" class="swl-achievement-badge" data-swl-achievement="first-250" data-achievement-gymnast="g03" aria-label="Lexi’s achievement: first to 250 Floor points" aria-haspopup="dialog" title="First to 250 Floor points"><span class="swl-achievement-emblem">${emblem}</span></button>`;
  }

  // Profile only. Pass the complete confirmed state.completionAchievements map.
  // These saved dates are authoritative; current marks never grant/remove a badge.
  function profileBadges(gymnast, completionAchievements) {
    if (!gymnast?.id || isCoach(gymnast) || !completionAchievements || typeof completionAchievements !== 'object') return '';
    const awards = Object.hasOwn(completionAchievements, gymnast.id) ? completionAchievements[gymnast.id] : null;
    if (!awards || typeof awards !== 'object' || Array.isArray(awards)) return '';
    return Object.entries(challenges).map(([id, challenge]) => {
      const earnedAt = Object.hasOwn(awards,id) ? awards[id] : null;
      if (!validDate(earnedAt)) return '';
      const label = `${gymnast.name}: ${challenge.title}. Earned ${earnedDate(earnedAt)}.`;
      return `<button type="button" class="swl-achievement-badge swl-completion-badge is-${challenge.level}" data-swl-achievement="${id}" data-achievement-gymnast="${escape(gymnast.id)}" data-achievement-name="${escape(gymnast.name)}" data-achievement-earned="${escape(earnedAt)}" aria-label="${escape(label)}" aria-haspopup="dialog" title="${escape(challenge.title)}"><span class="swl-achievement-emblem">${completionEmblem(challenge)}</span></button>`;
    }).join('');
  }

  function restoreFocus() {
    let target = opener?.isConnected ? opener : null;
    if (!target && openerIdentity) {
      target = Array.from(document.querySelectorAll('[data-swl-achievement]')).find(button => button.dataset.swlAchievement === openerIdentity.award && button.dataset.achievementGymnast === openerIdentity.gymnast);
    }
    opener = null; openerIdentity = null;
    if (!target) return;
    if (returnKeyboard) target.setAttribute?.('data-award-keyboard-return','true');
    target.focus({preventScroll:true});
    // Browsers can restore :focus-visible from a modal's focused close button
    // even after a touch activation. Pointer users should return to a neutral card.
    if (!returnKeyboard) { target.removeAttribute?.('data-award-keyboard-return'); target.blur?.(); }
  }

  function close() { if (dialog?.open) dialog.close(); }

  function createDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'swl-achievement-dialog';
    dialog.setAttribute('aria-labelledby','swlAchievementTitle');
    dialog.setAttribute('aria-describedby','swlAchievementDescription');
    dialog.addEventListener('close',restoreFocus);
    dialog.addEventListener('pointerdown',()=>{returnKeyboard=false;});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();
    });
    document.body.append(dialog);
    return dialog;
  }

  function fillDialog(panel, button, id) {
    const challenge = challenges[id];
    const historical = id === 'first-250';
    const earnedAt = button.dataset?.achievementEarned;
    if (!historical && (!challenge || !validDate(earnedAt))) return false;
    const name = historical ? 'Lexi Primrose' : button.dataset.achievementName || 'Gymnast';
    const title = historical ? 'First to 250' : challenge.title;
    const description = historical ? 'Lexi was the first gymnast to reach 250 Floor points.' : challenge.description;
    panel.setAttribute('data-award',id);
    panel.innerHTML = `<button type="button" class="swl-achievement-close" aria-label="Close achievement">×</button><span class="swl-achievement-large${challenge ? ' swl-completion-badge is-'+challenge.level : ''}" aria-hidden="true">${historical ? emblem : completionEmblem(challenge)}</span><p class="swl-achievement-eyebrow">${historical ? 'A place in SWL history' : 'Challenge completed'}</p><h2 id="swlAchievementTitle">${title}</h2><p class="swl-achievement-recipient">${escape(name)}</p><p id="swlAchievementDescription">${description}</p>${historical ? '' : `<p class="swl-achievement-earned">Earned <time datetime="${escape(earnedAt)}">${escape(earnedDate(earnedAt))}</time></p>`}<p class="swl-achievement-note">${historical ? 'A lasting achievement, even as her current points change.' : 'A lasting achievement. This emblem stays even if skills are unticked or Perfect marks expire.'}</p><button type="button" class="swl-achievement-done">${historical ? 'Brilliant work, Lexi' : 'Well earned'}</button>`;
    panel.querySelector('.swl-achievement-close').addEventListener('click',close);
    panel.querySelector('.swl-achievement-done').addEventListener('click',close);
    return true;
  }

  function mount() {
    if(mounted)return;
    mounted=true;
    document.addEventListener('focusout',event=>{event.target?.removeAttribute?.('data-award-keyboard-return');});
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('[data-swl-achievement]');
      if(!button)return;
      const id=button.dataset?.swlAchievement || 'first-250';
      if(id!=='first-250'&&!Object.hasOwn(challenges,id))return;
      event.preventDefault();event.stopPropagation();
      const panel=createDialog();
      if(panel.open || !fillDialog(panel,button,id))return;
      opener=button;
      openerIdentity={award:id,gymnast:button.dataset?.achievementGymnast};
      returnKeyboard=event.detail===0 && !event.pointerType;
      try {
        panel.showModal();
        panel.querySelector('.swl-achievement-done').focus({preventScroll:true});
      } catch (_) { opener=null;openerIdentity=null; }
    },true);
  }

  window.SWLAchievements=Object.freeze({badge,profileBadges,eligible,mount});
})();
