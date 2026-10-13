(() => {
  'use strict';
  // IGA tags are populated only for individually verified entries in the official code.
  const IGA = {
  "rolls-base-0": {
    "grade": "A"
  },
  "rolls-base-2": {
    "grade": "B"
  },
  "rolls-upgrade-0": {
    "grade": "B",
    "note": "Regional pathway only"
  },
  "rolls-upgrade-1": {
    "grade": "D",
    "note": "Straight jump"
  },
  "rolls-upgrade-2": {
    "grade": "C"
  },
  "rolls-pro-1": {
    "grade": "E"
  },
  "acro-base-0": {
    "grade": "B"
  },
  "acro-base-1": {
    "grade": "A",
    "note": "Turn on one foot"
  },
  "acro-base-2": {
    "grade": "B"
  },
  "acro-upgrade-0": {
    "grade": "B",
    "note": "Flick to one foot"
  },
  "acro-upgrade-1": {
    "grade": "C"
  },
  "acro-upgrade-2": {
    "grade": "C"
  },
  "acro-pro-0": {
    "grade": "C",
    "note": "Floor tuck-back"
  },
  "acro-pro-1": {
    "grade": "D"
  },
  "leaps-base-0": {
    "grade": "B"
  },
  "leaps-base-1": {
    "grade": "C"
  },
  "leaps-base-2": {
    "grade": "C",
    "note": "Change-leg leap"
  }
};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount(root, {categories,skills}) {
    if (!root || root.dataset.mounted) return;
    root.dataset.mounted = 'true';
    root.innerHTML = `<div class="catalogue-back"><button class="quiet" type="button" data-close-skills>← Back</button><span>THE SKILL COLLECTION</span></div><div class="catalogue-head"><p class="eyebrow">Strong foundations. Room to grow.</p><h1 id="allSkillsTitle" tabindex="-1">All the skills.</h1><p>Every complex in one place. Browse the skills, then head to Gymnasts to record someone’s progress.</p></div><div class="catalogue-filters" role="group" aria-label="Filter skill catalogue"><button type="button" data-catalogue-category="all" aria-pressed="true">All complexes</button>${categories.map(c=>`<button type="button" data-catalogue-category="${esc(c.id)}" aria-pressed="false">${esc(c.name)}</button>`).join('')}</div><div class="catalogue-grid">${categories.flatMap(c=>c.tiers.map(([tier,label])=>{
      const group=skills.filter(k=>k.category===c.id&&k.tier===tier);
      return `<article class="catalogue-complex" data-catalogue-group="${esc(c.id)}"><div class="catalogue-complex-head"><span class="catalogue-icon" aria-hidden="true">${esc(c.icon)}</span><div><p>${esc(c.name)}</p><h2>${esc(label)}</h2></div><span class="catalogue-points">${group[0]?.points||0}<small>pts / skill</small></span></div><ol>${group.map(k=>`<li><span>${esc(k.name)}${IGA[k.id]?.note?`<small class="catalogue-skill-note">${esc(IGA[k.id].note)}</small>`:''}</span>${IGA[k.id]?`<small class="iga-grade">IGA ${esc(IGA[k.id].grade)}</small>`:''}</li>`).join('')}</ol><p class="catalogue-bonus">All three achieved <b>+5</b><span>·</span>All three perfect <b>+10</b></p></article>`;
    })).join('')}</div><p class="catalogue-note">Perfect doubles each skill’s points. The +10 group bonus replaces +5. These are your SWL league points; any IGA difficulty tags are separate.</p><p id="igaSourceNote">IGA tags show <strong>floor difficulty letters</strong>, separate from competition grades. Only clear matches are shown; regional-only entries are labelled. <a href="https://www.independentgymnastics.com/wp-content/uploads/2022/10/UPDATED-WAG-CODE-OF-POINTS-2026.pdf#page=9" target="_blank" rel="noopener noreferrer">IGA Women’s Artistic Code of Points 2026 · floor table ↗</a></p>`;
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-catalogue-category]');
      if (!button || !root.contains(button)) return;
      const category = button.dataset.catalogueCategory;
      root.querySelectorAll('[data-catalogue-category]').forEach(item => item.setAttribute('aria-pressed',String(item===button)));
      root.querySelectorAll('[data-catalogue-group]').forEach(item => { item.hidden = category !== 'all' && item.dataset.catalogueGroup !== category; });
    });
  }
  window.SWLSkillsCatalogue = Object.freeze({mount});
})();
