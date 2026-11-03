/* Device-local read receipts for confirmed awards. Never writes scoring data. */
(() => {
  'use strict';
  const key = 'swl.badge-notices.v1';
  const ids = ['floor-basics-achieved','floor-basics-perfect','floor-upgrades-achieved','floor-upgrades-perfect','floor-pro-achieved','floor-pro-perfect','vault-achieved','vault-perfect'];
  const legacy = {'floor-pro-achieved':'floor-achieved','floor-pro-perfect':'floor-perfect'};
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
  const eligible = gymnast => typeof gymnast?.id === 'string' && gymnast.id.length > 0 && ![gymnast.coach,...(Array.isArray(gymnast.squads) ? gymnast.squads : [])].some(s => String(s || '').trim().toLowerCase() === 'coaches');
  function awards(gymnast, receipts) {
    const result = Object.create(null);
    if (!eligible(gymnast) || !record(receipts) || !Object.hasOwn(receipts,gymnast.id) || !record(receipts[gymnast.id])) return result;
    const row = receipts[gymnast.id];
    for (const id of ids) {
      const at = [id,legacy[id]].filter(Boolean).filter(k => Object.hasOwn(row,k)).map(k => row[k]).filter(date).sort()[0];
      if (at) result[id] = at;
    }
    return result;
  }
  function create(options = {}) {
    let storage = options.storage;
    if (!Object.hasOwn(options,'storage')) { try { storage = window.localStorage; } catch (_) {} }
    const storageKey = options.key || key;
    let initialized = false;
    const seen = Object.create(null);
    function remember(gymnastID, id, at) {
      if (!Object.hasOwn(seen,gymnastID)) seen[gymnastID] = Object.create(null);
      if (!Object.hasOwn(seen[gymnastID],id)) seen[gymnastID][id] = [];
      if (!seen[gymnastID][id].includes(at)) seen[gymnastID][id].push(at);
    }
    function mergeStored() {
      try {
        const saved = JSON.parse(storage?.getItem(storageKey) || 'null');
        if (!record(saved) || saved.version !== 1 || saved.initialized !== true || !record(saved.seen)) return;
        initialized = true;
        for (const gymnastID of Object.keys(saved.seen)) {
          const row = saved.seen[gymnastID];
          if (!record(row)) continue;
          for (const id of ids) if (Object.hasOwn(row,id) && Array.isArray(row[id])) for (const at of row[id]) if (date(at)) remember(gymnastID,id,at);
        }
      } catch (_) { /* Private browsing or unavailable storage: keep session receipts. */ }
    }
    function persist() {
      mergeStored();
      try { storage?.setItem(storageKey,JSON.stringify({version:1,initialized,seen})); } catch (_) {}
    }
    function observe(config = {}) {
      if (config.hasLoaded !== true || !Array.isArray(config.gymnasts) || !record(config.completionAchievements)) return false;
      mergeStored();
      if (initialized) return false;
      // The first successful snapshot establishes a quiet baseline for existing awards.
      for (const gymnast of config.gymnasts) for (const [id,at] of Object.entries(awards(gymnast,config.completionAchievements))) remember(gymnast.id,id,at);
      initialized = true;
      persist();
      return true;
    }
    function unread(gymnast, receipts) {
      mergeStored();
      const result = Object.create(null);
      if (!initialized) return result;
      for (const [id,at] of Object.entries(awards(gymnast,receipts))) if (!seen[gymnast.id]?.[id]?.includes(at)) result[id] = at;
      return result;
    }
    function markSeen(gymnast, receipts) {
      const pending = unread(gymnast,receipts);
      for (const [id,at] of Object.entries(pending)) remember(gymnast.id,id,at);
      if (Object.keys(pending).length) persist();
      return pending;
    }
    mergeStored();
    return Object.freeze({observe,unread,markSeen});
  }
  window.SWLBadgeNotices = Object.freeze({...create(),create,storageKey:key});
})();
