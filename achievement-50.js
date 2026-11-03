/* Saved achievements are lasting recognition, independent of current scores. */
(() => {
  'use strict';
  let mounted = false, dialog = null, opener = null, openerIdentity = null, returnKeyboard = false;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const eligible = gymnast => gymnast?.id === 'g03' && String(gymnast.name || '').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB') === 'lexi primrose';
  const isCoach = gymnast => [gymnast?.coach,...(Array.isArray(gymnast?.squads) ? gymnast.squads : [])].some(squad => String(squad || '').trim().toLowerCase() === 'coaches');
  const emblem = `<svg viewBox="0 0 54 32" aria-hidden="true" focusable="false"><path class="award-seal" d="M8 2h38l6 7v14l-6 7H8l-6-7V9z"/><path class="award-inset" d="M10 5h34l5 5v12l-5 5H10l-5-5V10z"/><text class="award-number" x="27" y="22" text-anchor="middle">250</text></svg>`;
  const challenges = Object.freeze({
    'floor-basics-achieved':Object.freeze({apparatus:'Floor',rank:1,sprite:0,level:'achieved',title:'Achieved Foundations',description:'Every basic Floor skill in Rolls, Acro and Leaps was marked Achieved or Perfect. Handstands are not included.'}),
    'floor-basics-perfect':Object.freeze({apparatus:'Floor',rank:2,sprite:1,level:'perfect',title:'Perfect Foundations',description:'Every basic Floor skill in Rolls, Acro and Leaps was marked Perfect at the same time. Handstands are not included.'}),
    'floor-upgrades-achieved':Object.freeze({apparatus:'Floor',rank:3,sprite:2,level:'achieved',title:'Achieved Upgrades',description:'Every basic and upgraded Floor skill in Rolls, Acro and Leaps was marked Achieved or Perfect. Handstands are not included.'}),
    'floor-upgrades-perfect':Object.freeze({apparatus:'Floor',rank:4,sprite:3,level:'perfect',title:'Perfect Upgrades',description:'Every basic and upgraded Floor skill in Rolls, Acro and Leaps was marked Perfect at the same time. Handstands are not included.'}),
    'floor-pro-achieved':Object.freeze({apparatus:'Floor',rank:5,sprite:4,level:'achieved',title:'Achieved Complete Floor',description:'Every basic, upgraded and Pro Floor skill in Rolls, Acro and Leaps was marked Achieved or Perfect. Handstands are not included.'}),
    'floor-pro-perfect':Object.freeze({apparatus:'Floor',rank:6,sprite:5,level:'perfect',title:'Perfect Complete Floor',description:'Every basic, upgraded and Pro Floor skill in Rolls, Acro and Leaps was marked Perfect at the same time. Handstands are not included.'}),
    'vault-achieved':Object.freeze({apparatus:'Vault',rank:1,sprite:6,level:'achieved',title:'Achieved Complete Vault',description:'Every Vault skill was marked Achieved or Perfect.'}),
    'vault-perfect':Object.freeze({apparatus:'Vault',rank:2,sprite:7,level:'perfect',title:'Perfect Complete Vault',description:'Every Vault skill was marked Perfect at the same time.'})
  });
  // Earlier full-Floor receipts remain proof of the corresponding Pro award.
  const legacyIds = Object.freeze({'floor-achieved':'floor-pro-achieved','floor-perfect':'floor-pro-perfect'});
  const canonicalId = id => Object.hasOwn(legacyIds,id) ? legacyIds[id] : id;
  const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

  // Each viewport trims the original atlas's empty padding, without redrawing it.
  // Equal visible heights and centred viewports keep unlike shapes in one line.
  const artworkViewports = Object.freeze(["92 52 293 352", "525 50 293 354", "957 50 296 354", "1388 51 295 352", "92 470 300 352", "522 468 300 351", "918 496 374 305", "1350 496 374 305"]);
  function completionEmblem(challenge) {
    return `<svg class="swl-award-art" data-award-sprite="${challenge.sprite}" viewBox="${artworkViewports[challenge.sprite]}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><image href="./neon-badges.png" width="1774" height="887"/></svg>`;
  }

  // Shared illustrated artwork for non-interactive challenge tiles.
  function challengeIcon(id) {
    const key = canonicalId(id);
    if (!Object.hasOwn(challenges,key)) return '';
    const challenge = challenges[key];
    return `<span class="swl-completion-icon swl-completion-badge is-${challenge.level}" data-award-kind="${key}" aria-hidden="true">${completionEmblem(challenge)}</span>`;
  }

  function badge(gymnast) {
    if (!eligible(gymnast)) return '';
    return `<button type="button" class="swl-achievement-badge" data-swl-achievement="first-250" data-achievement-gymnast="g03" aria-label="Lexi’s achievement: first to 250 Floor points" aria-haspopup="dialog" title="First to 250 Floor points"><span class="swl-achievement-emblem">${emblem}</span></button>`;
  }

  // Pass the complete confirmed state.completionAchievements map on every surface.
  // These saved dates are authoritative; current marks never grant/remove a badge.
  function savedChallenges(gymnast, completionAchievements) {
    if (!gymnast?.id || isCoach(gymnast) || !completionAchievements || typeof completionAchievements !== 'object') return [];
    const awards = Object.hasOwn(completionAchievements, gymnast.id) ? completionAchievements[gymnast.id] : null;
    if (!awards || typeof awards !== 'object' || Array.isArray(awards)) return [];
    return Object.entries(challenges).flatMap(([id, challenge]) => {
      const dates = [Object.hasOwn(awards,id) ? awards[id] : null];
      for (const [oldId,newId] of Object.entries(legacyIds)) if (newId === id && Object.hasOwn(awards,oldId)) dates.push(awards[oldId]);
      const earnedAt = dates.filter(validDate).sort()[0];
      return earnedAt ? [{id,challenge,earnedAt}] : [];
    });
  }

  function highestChallenges(gymnast, completionAchievements) {
    const groups = new Map();
    for (const award of savedChallenges(gymnast, completionAchievements)) {
      const category = award.challenge.apparatus;
      if (!groups.has(category)) groups.set(category,[]);
      groups.get(category).push(award);
    }
    return [...groups.values()].map(awards => {
      awards.sort((a,b)=>a.challenge.rank-b.challenge.rank);
      return {...awards[awards.length-1],previous:awards.slice(0,-1)};
    });
  }

  // Saved lower stages peek behind the newest emblem without adding more targets.
  // Missing receipts never create a decorative badge that has not been earned.
  function awardArtwork(award, profile = false) {
    const previous = profile ? [] : award.previous || [];
    if (!previous.length) return `<span class="swl-achievement-emblem">${completionEmblem(award.challenge)}</span>`;
    return `<span class="swl-achievement-emblem swl-award-stack">${previous.map(({id,challenge},index) => `<span class="swl-award-layer is-${challenge.level}" data-stacked-award="${id}" style="--award-offset:${previous.length-index}" aria-hidden="true">${completionEmblem(challenge)}</span>`).join('')}<span class="swl-award-layer swl-award-front is-${award.challenge.level}" style="--award-offset:0" aria-hidden="true">${completionEmblem(award.challenge)}</span></span>`;
  }

  function challengeButtons(gymnast, awards, profile = false) {
    return awards.map(award => {
      const {id,challenge,earnedAt} = award;
      const previous = profile ? [] : award.previous || [];
      const label = `${gymnast.name}: ${challenge.title}${previous.length ? `; ${previous.length} earlier ${challenge.apparatus} ${previous.length === 1 ? 'badge' : 'badges'}` : ''}.`;
      return `<button type="button" class="swl-achievement-badge swl-completion-badge is-${challenge.level}${profile ? ' is-profile-award' : ''}${previous.length ? ' has-award-stack' : ''}" style="--award-stack-count:${previous.length}" data-award-kind="${id}" data-swl-achievement="${id}" data-achievement-gymnast="${escape(gymnast.id)}" data-achievement-name="${escape(gymnast.name)}" data-achievement-earned="${escape(earnedAt)}" aria-label="${escape(label)}" aria-haspopup="dialog" title="${escape(challenge.title)}">${awardArtwork(award,profile)}</button>`;
    }).join('');
  }

  // Profiles keep the whole earned collection; everyday cards show one per apparatus.
  function profileBadges(gymnast, completionAchievements) {
    return challengeButtons(gymnast,savedChallenges(gymnast,completionAchievements),true);
  }

  function fullProfileBadges(gymnast, completionAchievements) {
    return badge(gymnast) + profileBadges(gymnast,completionAchievements);
  }

  function allBadges(gymnast, completionAchievements) {
    return badge(gymnast) + challengeButtons(gymnast,highestChallenges(gymnast,completionAchievements));
  }

  // Use inside existing profile buttons: no nested button or dialog trigger.
  function allIcons(gymnast, completionAchievements) {
    const historical = eligible(gymnast) ? `<span class="swl-achievement-icon" role="img" aria-label="Lexi’s achievement: first to 250 Floor points" title="First to 250 Floor points"><span class="swl-achievement-emblem">${emblem}</span></span>` : '';
    return historical + highestChallenges(gymnast, completionAchievements).map(award => {
      const {id,challenge,previous} = award;
      const label = `${gymnast.name}: ${challenge.title}${previous.length ? `; ${previous.length} earlier ${challenge.apparatus} ${previous.length === 1 ? 'badge' : 'badges'}` : ''}.`;
      return `<span class="swl-achievement-icon swl-completion-badge is-${challenge.level}${previous.length ? ' has-award-stack' : ''}" style="--award-stack-count:${previous.length}" data-award-kind="${id}" role="img" aria-label="${escape(label)}" title="${escape(challenge.title)}">${awardArtwork(award)}</span>`;
    }).join('');
  }

  function focusContext(button) {
    return {
      surface:button.closest?.('[id]')?.id || null,
      priority:button.closest?.('[data-priority-detail]')?.dataset?.priorityDetail || null,
      board:button.closest?.('[data-leaderboard]')?.dataset?.leaderboard || null
    };
  }

  function visibleFocusTarget(button) {
    if (!button || button.isConnected === false || button.closest?.('[hidden], [inert], [aria-hidden="true"]')) return false;
    if (typeof button.checkVisibility === 'function') return button.checkVisibility({checkVisibilityCSS:true,checkOpacity:true});
    if (typeof button.getClientRects === 'function' && !button.getClientRects().length) return false;
    const style = window.getComputedStyle?.(button);
    return !style || (style.visibility !== 'hidden' && style.visibility !== 'collapse' && style.opacity !== '0');
  }

  function restoreFocus() {
    let target = visibleFocusTarget(opener) ? opener : null;
    if (!target && openerIdentity) {
      const matches = Array.from(document.querySelectorAll('[data-swl-achievement]')).filter(button => button.dataset.swlAchievement === openerIdentity.award && button.dataset.achievementGymnast === openerIdentity.gymnast && visibleFocusTarget(button));
      target = matches.find(button => {
        const context = focusContext(button);
        return context.surface === openerIdentity.surface && context.priority === openerIdentity.priority && context.board === openerIdentity.board;
      }) || matches.find(button => focusContext(button).surface === openerIdentity.surface) || matches[0];
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
    const key = canonicalId(id);
    const challenge = Object.hasOwn(challenges,key) ? challenges[key] : null;
    const historical = id === 'first-250';
    const earnedAt = button.dataset?.achievementEarned;
    if (!historical && (!challenge || !validDate(earnedAt))) return false;
    const name = historical ? 'Lexi Primrose' : button.dataset.achievementName || 'Gymnast';
    const title = historical ? 'First to 250' : challenge.title;
    const description = historical ? 'Lexi was the first gymnast to reach 250 Floor points.' : challenge.description;
    panel.setAttribute('data-award',id);
    panel.innerHTML = `<button type="button" class="swl-achievement-close" aria-label="Close achievement">×</button><span class="swl-achievement-large${challenge ? ' swl-completion-badge is-'+challenge.level : ''}" data-award-kind="${key}" aria-hidden="true">${historical ? emblem : completionEmblem(challenge)}</span><p class="swl-achievement-eyebrow">${historical ? 'A place in SWL history' : 'Challenge completed'}</p><h2 id="swlAchievementTitle">${title}</h2><p class="swl-achievement-recipient">${escape(name)}</p><p id="swlAchievementDescription">${description}</p><p class="swl-achievement-note">${historical ? 'A lasting achievement, even as her current points change.' : 'A lasting achievement. This emblem stays even if skills are unticked or Perfect marks expire.'}</p><button type="button" class="swl-achievement-done">${historical ? 'Brilliant work, Lexi' : 'Well earned'}</button>`;
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
      if(id!=='first-250'&&!Object.hasOwn(challenges,canonicalId(id)))return;
      event.preventDefault();event.stopPropagation();
      const panel=createDialog();
      if(panel.open || !fillDialog(panel,button,id))return;
      opener=button;
      openerIdentity={award:id,gymnast:button.dataset?.achievementGymnast,...focusContext(button)};
      returnKeyboard=event.detail===0 && !event.pointerType;
      try {
        panel.showModal();
        panel.querySelector('.swl-achievement-done').focus({preventScroll:true});
      } catch (_) { opener=null;openerIdentity=null; }
    },true);
  }

  window.SWLAchievements=Object.freeze({badge,profileBadges,fullProfileBadges,allBadges,allIcons,challengeIcon,challenges,eligible,mount});
})();
