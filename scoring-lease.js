(() => {
  'use strict';
  // A server-issued lease is checked on every edit, not just by a browser timer.
  function create({now = () => Date.now(), monotonic = () => performance.now()} = {}) {
    let state = {locked:true,version:-1,expiresAt:null};
    let wallDeadline = 0, tickDeadline = 0;
    const expired = () => !state.locked && (now() >= wallDeadline || monotonic() >= tickDeadline);
    const get = () => {
      if (expired()) state = {...state,locked:true};
      return {...state};
    };
    function accept(value, requestedAt) {
      if (!value || typeof value.locked !== 'boolean' || !Number.isSafeInteger(value.version) || value.version < 0 || value.version < state.version) return false;
      get();
      const deadline = Date.parse(value.expiresAt || '');
      const serverTime = Date.parse(value.serverTime || '');
      const validLease = Number.isFinite(deadline) && Number.isFinite(serverTime) && deadline > serverTime;
      if (value.version === state.version && !value.locked) {
        // Polls and delayed acknowledgements never renew the same unlock lease.
        if (state.locked || value.expiresAt !== state.expiresAt) return false;
        return true;
      }
      if (value.locked || !validLease) {
        state = {locked:true,version:value.version,expiresAt:value.expiresAt || null};
        wallDeadline = tickDeadline = 0;
      } else {
        const latency = Number.isFinite(requestedAt) ? Math.max(0,now()-requestedAt) : 0;
        const remaining = Math.max(0,Math.min(30*60*1000,deadline-serverTime)-latency);
        wallDeadline = now()+remaining;
        tickDeadline = monotonic()+remaining;
        state = {locked:remaining<=0,version:value.version,expiresAt:value.expiresAt};
      }
      return true;
    }
    return Object.freeze({accept,get,remaining:() => get().locked ? 0 : Math.max(0,Math.min(wallDeadline-now(),tickDeadline-monotonic()))});
  }
  window.SWLScoringLease = Object.freeze({create});
})();
