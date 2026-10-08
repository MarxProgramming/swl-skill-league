(() => {
  'use strict';
  if (window.SWLCelebration?.version === 1) return;
  const SOUND_KEY = 'swl-celebration-sound';
  const CELEBRATION_MS = 5800;
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const animations = new Set(), voices = new Set();
  let overlay = null, cleanupTimer = null, generation = 0, fadeStartsAt = 0;
  let audioContext = null, masterGain = null, soundButton = null, motionObserver = null;
  let soundEnabled = true;
  try { soundEnabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch (_) {}

  function motionOff() {
    if (motionQuery?.matches || document.body?.classList.contains('no-motion')) return true;
    try { return localStorage.getItem('swl-motion-paused') === 'true'; } catch (_) { return false; }
  }

  function make(className, text, tag = 'div') {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function cancelAnimations() {
    for (const animation of animations) { try { animation.cancel(); } catch (_) {} }
    animations.clear();
  }

  function clearVisuals() {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
    // Detach first, so cancelling retained final frames cannot reveal the
    // banner's underlying styles for even a single painted frame.
    overlay?.remove();
    overlay = null;
    fadeStartsAt = 0;
    cancelAnimations();
    document.body?.classList.remove('swl-celebrating');
  }

  function silence() {
    const now = audioContext?.currentTime || 0;
    for (const voice of voices) {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setTargetAtTime(0, now, 0.012);
        voice.oscillator.stop(now + 0.045);
      } catch (_) {
        try { voice.oscillator.disconnect(); voice.gain.disconnect(); } catch (_) {}
        voices.delete(voice);
      }
    }
  }

  function stop() { generation++; clearVisuals(); silence(); }

  function animate(element, frames, options = {}) {
    if (!element?.animate || motionOff()) return;
    try {
      const animation = element.animate(frames, { duration: 5600, easing: 'ease-in-out', fill: 'both', ...options });
      animations.add(animation);
      // Completed animations retain their final frames. Keep those handles so
      // stop/restart and reduced motion can release every retained effect.
      animation.finished.catch(() => animations.delete(animation));
    } catch (_) {}
  }

  function unlockAudio() {
    if (!soundEnabled) return null;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0.16;
        masterGain.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch (_) { return null; }
  }

  function tone(context, frequency, start, duration, volume) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = { oscillator, gain };
    voices.add(voice);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(masterGain);
    oscillator.onended = () => {
      voices.delete(voice);
      try { oscillator.disconnect(); gain.disconnect(); } catch (_) {}
    };
    oscillator.start(start); oscillator.stop(start + duration + 0.03);
  }

  function flourish(token) {
    const context = unlockAudio();
    if (!context) return;
    const start = () => {
      if (token !== generation || !soundEnabled || context.state !== 'running') return;
      try {
        const now = context.currentTime + 0.015;
        // Three distinct, ascending bell strikes. A quiet, short inharmonic
        // partial adds a bright ding without a low chord or external samples.
        [1046.5,1318.51,1567.98].forEach((frequency, index) => {
          const onset = now + index * 0.33;
          tone(context, frequency, onset, index === 2 ? 0.95 : 0.72, index === 2 ? 0.30 : 0.27);
          tone(context, frequency * 2.756, onset, 0.19, 0.055);
        });
      } catch (_) { silence(); }
    };
    if (context.state === 'running') start();
    else { try { context.resume().then(start).catch(() => {}); } catch (_) {} }
  }

  function updateSoundButton() {
    if (!soundButton) return;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.title = soundEnabled ? 'Turn celebration sounds off' : 'Turn celebration sounds on';
    soundButton.querySelector('.swl-sound-icon').textContent = soundEnabled ? '♫' : '♩';
    soundButton.querySelector('.swl-sound-label').textContent = soundEnabled ? 'Sound on' : 'Sound off';
  }

  function setSoundEnabled(value) {
    soundEnabled = Boolean(value);
    try { localStorage.setItem(SOUND_KEY, soundEnabled ? 'on' : 'off'); } catch (_) {}
    updateSoundButton();
    if (soundEnabled) unlockAudio(); else silence();
  }

  function settleMotion() {
    if (!overlay || !motionOff() || overlay.classList.contains('is-static')) return;
    // A late motion toggle must not re-show a banner that is already fading.
    if (Date.now() >= fadeStartsAt) { clearVisuals(); return; }
    cancelAnimations();
    overlay.classList.add('is-static');
    document.body.classList.remove('swl-celebrating');
    // Keep the original cleanup deadline: a late motion toggle must not extend
    // the celebration beyond its 5.8-second maximum.
  }

  function play(details = {}) {
    stop();
    const token = generation;
    // This is deliberately called before asynchronous work to use the click's
    // user activation. Audio availability never controls the scoring action.
    flourish(token);
    if (!document.body) return;
    const quiet = motionOff() || typeof document.body.animate !== 'function';
    fadeStartsAt = quiet ? Infinity : Date.now() + 4560;
    overlay = make(`swl-celebration${quiet ? ' is-static' : ''}`);
    const veil = make('swl-celebration-veil'), halo = make('swl-celebration-halo');
    const ring = make('swl-celebration-ring'), limeRing = make('swl-celebration-ring swl-celebration-ring--lime');
    const orbit = make('swl-celebration-orbit');
    for (let i = 0; i < 6; i++) orbit.append(make('swl-celebration-star', '✦', 'span'));
    const ribbon = make('swl-celebration-ribbon'), limeRibbon = make('swl-celebration-ribbon swl-celebration-ribbon--lime');
    [veil,halo,ring,limeRing,orbit,ribbon,limeRibbon].forEach(element => element.setAttribute('aria-hidden','true'));
    const banner = make('swl-celebration-banner');
    banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite'); banner.setAttribute('aria-atomic', 'true');
    const sweep = make('swl-celebration-sweep'); sweep.setAttribute('aria-hidden', 'true');
    const medals = make('swl-celebration-medals'); medals.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) medals.append(make('swl-celebration-medal', '✓', 'span'));
    const title = make('swl-celebration-title', undefined, 'p');
    title.append(make('', 'PERFECT', 'span'), make('', 'COMPLEX', 'span'));
    const gymnastName = String(details.gymnastName || 'What a performance!').slice(0, 120);
    const tierName = details.tierName || ({base:'Base complex',upgrade:'Upgrades',pro:'Pro upgrades'}[details.tier]) || '';
    const detail = [details.categoryName, tierName].filter(Boolean).map(value => String(value).slice(0,100)).join(' · ');
    banner.append(sweep, medals, title, make('swl-celebration-name', gymnastName, 'p'),
      make('swl-celebration-detail', detail, 'p'), make('swl-celebration-caption', 'Three skills. All perfect.', 'p'));
    overlay.append(veil,halo,ring,limeRing,orbit,ribbon,limeRibbon,banner);
    document.body.append(overlay);
    if (!quiet) {
      document.body.classList.add('swl-celebrating');
      animate(document.querySelector('#main'), [
        {transform:'translate3d(0,0,0) rotate(0) scale(1)',offset:0},
        {transform:'translate3d(0,5px,0) rotate(-1.1deg) scale(.989)',offset:.13},
        {transform:'translate3d(0,-6px,0) rotate(1.1deg) scale(1.01)',offset:.29},
        {transform:'translate3d(0,3px,0) rotate(-.8deg) scale(.993)',offset:.45},
        {transform:'translate3d(0,-3px,0) rotate(.5deg) scale(1.004)',offset:.62},
        {transform:'translate3d(0,0,0) rotate(0) scale(1)',offset:1}
      ]);
      animate(document.querySelector('.header-inner'), [
        {transform:'translate3d(0,0,0) rotate(0)'}, {transform:'translate3d(8px,0,0) rotate(.65deg)'},
        {transform:'translate3d(-8px,0,0) rotate(-.65deg)'}, {transform:'translate3d(5px,0,0) rotate(.35deg)'},
        {transform:'translate3d(0,0,0) rotate(0)'}
      ]);
      const panels = Array.from(document.querySelectorAll('.complex,.board,.stat,.roster')).filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      }).slice(0,8);
      panels.forEach((panel,index) => {
        const direction = index % 2 ? -1 : 1;
        animate(panel,[{transform:'translate3d(0,0,0) rotate(0)'},
          {transform:`translate3d(0,-9px,0) rotate(${direction*1.8}deg)`},
          {transform:`translate3d(0,4px,0) rotate(${-direction*.9}deg)`},
          {transform:'translate3d(0,0,0) rotate(0)'}],{duration:4100,delay:160+index*90});
      });
      animate(banner,[{opacity:0,transform:'translate3d(0,30px,0) scale(.84) rotate(-3deg)',offset:0,easing:'cubic-bezier(.22,.75,.24,1)'},
        {opacity:1,transform:'translate3d(0,-3px,0) scale(1.015) rotate(.5deg)',offset:.14,easing:'ease-in-out'},
        {opacity:1,transform:'translate3d(0,0,0) scale(1) rotate(0)',offset:.26},
        {opacity:1,transform:'translate3d(0,0,0) scale(1) rotate(0)',offset:.8},
        {opacity:0,transform:'translate3d(0,-18px,0) scale(.975) rotate(-.5deg)',offset:1}],{duration:5700,easing:'linear'});
      animate(veil,[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0}],{duration:5700,easing:'linear'});
      animate(halo,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},{opacity:1,offset:.3,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.25)'}]);
      animate(ring,[{opacity:0,transform:'translate(-50%,-50%) rotate(-48deg) scale(.7)'},{opacity:1,offset:.25},{opacity:0,transform:'translate(-50%,-50%) rotate(42deg) scale(1.2)'}]);
      animate(limeRing,[{opacity:0,transform:'translate(-50%,-50%) rotate(52deg) scale(.72)'},{opacity:1,offset:.3},{opacity:0,transform:'translate(-50%,-50%) rotate(-38deg) scale(1.25)'}]);
      animate(orbit,[{opacity:0,transform:'translate(-50%,-50%) rotate(-18deg) scale(.8)'},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translate(-50%,-50%) rotate(102deg) scale(1.13)'}]);
      animate(ribbon,[{opacity:0,transform:'translate3d(-40%,30px,0) rotate(-24deg)'},{opacity:.8,offset:.25},{opacity:0,transform:'translate3d(35%,-20px,0) rotate(-13deg)'}]);
      animate(limeRibbon,[{opacity:0,transform:'translate3d(40%,-20px,0) rotate(23deg)'},{opacity:.8,offset:.28},{opacity:0,transform:'translate3d(-35%,20px,0) rotate(12deg)'}]);
      animate(sweep,[{transform:'translateX(-70%) rotate(-22deg)'},{transform:'translateX(70%) rotate(-22deg)'}],{duration:3400,delay:650});
      Array.from(medals.children).forEach((medal,index) => animate(medal,[{transform:'scale(.3) rotate(-45deg)',opacity:0},{transform:'scale(1.1) rotate(7deg)',opacity:1,offset:.65},{transform:'scale(1) rotate(0)',opacity:1}],{duration:850,delay:240+index*120}));
    }
    cleanupTimer = setTimeout(clearVisuals, quiet ? 3200 : CELEBRATION_MS);
  }

  function initialize() {
    const utilities = document.querySelector('.utilities');
    if (utilities && !document.getElementById('swlSoundButton')) {
      soundButton = make('quiet swl-sound-toggle',undefined,'button');
      soundButton.id = 'swlSoundButton'; soundButton.type = 'button';
      soundButton.setAttribute('aria-label','Celebration sound');
      const icon = make('swl-sound-icon','♫','span'); icon.setAttribute('aria-hidden','true');
      soundButton.append(icon,make('swl-sound-label','','span'));
      soundButton.addEventListener('click',()=>setSoundEnabled(!soundEnabled));
      utilities.insertBefore(soundButton,document.getElementById('backups'));
      updateSoundButton();
    }
    if (window.MutationObserver && document.body) {
      motionObserver = new MutationObserver(settleMotion);
      motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    }
    motionQuery?.addEventListener?.('change',settleMotion);
    document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
    document.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ') unlockAudio();},{capture:true});
    window.addEventListener('storage',event=>{
      if(event.key==='swl-motion-paused') settleMotion();
      if(event.key===SOUND_KEY) { soundEnabled=event.newValue!=='off'; updateSoundButton(); if(!soundEnabled) silence(); }
    });
    window.addEventListener('pagehide',stop);
  }

  window.SWLCelebration = Object.freeze({version:1,play,stop,unlockAudio,setSoundEnabled,
    get soundEnabled(){return soundEnabled;},get active(){return Boolean(overlay);}});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
