/* Load games on demand. Pending game feedback remains recoverable on startup. */
(() => {
  'use strict';
  const files = [
    ['games-wheel.js','20261019v3'],['games-team.js','20261020'],
    ['games-skill.js','20261022-contest'],['games-contest.js','20261103-52'],
    ['games-draft.js','20261020'],['games-timing.js','20261101-programme'],
    ['games-addon.js','20261020'],['games-ratings.js','20261022-contest'],['games.js','20261101-programme']
  ];
  const loaded = new Map();
  let pending = null;
  function script(file,version) {
    if (loaded.has(file)) return loaded.get(file);
    const task = new Promise((resolve,reject) => {
      const element = document.createElement('script');
      // Dynamic classic scripts fetch together but execute in their declared order.
      element.async = false;
      element.src = './' + file + '?v=' + version;
      element.onload = resolve;
      element.onerror = () => { loaded.delete(file); element.remove(); reject(new Error('Games could not load. Check your connection and try again.')); };
      document.head.append(element);
    });
    loaded.set(file,task);
    return task;
  }
  function load() {
    if (pending) return pending;
    pending = Promise.all(files.map(([file,version]) => script(file,version))).then(() => {
      if (!window.SWLGames?.mount) throw new Error('Games are not ready. Please try again.');
      return window.SWLGames;
    }).catch(error => { pending = null; throw error; });
    return pending;
  }
  function hasPending() {
    try {
      const storage = window.localStorage;
      for (let i=0;i<storage.length;i++) if (storage.key(i)?.startsWith('swl-game-rating-outbox-v1:pending:')) return true;
      const raw=JSON.parse(storage.getItem('swl-game-rating-outbox-v1') || 'null');
      return Array.isArray(raw) ? raw.length>0 : Boolean(raw && (raw.queue?.length || raw.plays?.length));
    } catch (_) { return false; }
  }
  window.SWLGameLoader = Object.freeze({load,hasPending});
})();
