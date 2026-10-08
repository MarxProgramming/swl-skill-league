(() => {
  'use strict';
  if (window.SWLCelebration?.version === 1) return;
  const SOUND_KEY = 'swl-celebration-sound';
  const CELEBRATION_MS = 5800;
  const MAX_BELLS = 6, MASTER_LEVEL = 0.23;
  const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const animations = new Set(), voices = new Set(), retiringVoices = new Set();
  let overlay = null, cleanupTimer = null, generation = 0, fadeStartsAt = 0;
  let audioContext = null, masterGain = null, roomInput = null, soundButton = null, motionObserver = null;
  let audioGeneration = 0;
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

  function releaseVoice(voice) {
    if (voice.released) return;
    voice.released = true;
    clearTimeout(voice.cleanupTimer);
    voices.delete(voice);
    retiringVoices.delete(voice);
    for (const node of [...voice.oscillators, ...voice.partials, voice.gain]) {
      try { node.disconnect(); } catch (_) {}
    }
  }

  function retireVoice(voice) {
    if (voice.released || voice.retiring) return;
    voice.retiring = true;
    voices.delete(voice);
    const now = audioContext?.currentTime || 0;
    // A scheduled strike that has not sounded can be cancelled silently.
    if (voice.start >= now) {
      for (const oscillator of voice.oscillators) { try { oscillator.stop(now); } catch (_) {} }
      releaseVoice(voice);
      return;
    }
    retiringVoices.add(voice);
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0, now, 0.01);
    } catch (_) {}
    for (const oscillator of voice.oscillators) { try { oscillator.stop(now + 0.06); } catch (_) {} }
    clearTimeout(voice.cleanupTimer);
    voice.cleanupTimer = setTimeout(() => releaseVoice(voice), 80);
  }

  function silence() {
    audioGeneration++;
    const now = audioContext?.currentTime || 0;
    // Fade the final mix as well, so muting also silences delayed reflections.
    try {
      masterGain?.gain.cancelScheduledValues(now);
      masterGain?.gain.setTargetAtTime(0, now, 0.008);
    } catch (_) {}
    for (const voice of [...voices, ...retiringVoices]) retireVoice(voice);
  }

  function stop() { generation++; clearVisuals(); silence(); }

  function animate(element, frames, options = {}) {
    if (!element?.animate || motionOff()) return;
    try {
      const animation = element.animate(frames, { duration: 5600, easing: 'ease-in-out', fill: 'both', ...options });
      animations.add(animation);
      // Keep final frames until the overlay has been detached, avoiding a flash.
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
        masterGain.gain.value = MASTER_LEVEL;
        // A gentle safety limiter is normally idle; it catches rapid overlapping
        // strikes without flattening their bright initial attack.
        if (audioContext.createDynamicsCompressor) {
          const limiter = audioContext.createDynamicsCompressor();
          limiter.threshold.value = -12;
          limiter.knee.value = 12;
          limiter.ratio.value = 5;
          limiter.attack.value = 0.003;
          limiter.release.value = 0.16;
          masterGain.connect(limiter);
          limiter.connect(audioContext.destination);
        } else masterGain.connect(audioContext.destination);

        roomInput = null;
        if (audioContext.createBiquadFilter && audioContext.createDelay) {
          // Three quiet, filtered reflections give the bell a small real room.
          // There is no feedback loop, convolution asset, or unbounded tail.
          roomInput = audioContext.createBiquadFilter();
          roomInput.type = 'lowpass';
          roomInput.frequency.value = 5800;
          roomInput.Q.value = 0.25;
          [[0.043, 0.12], [0.097, 0.065], [0.173, 0.03]].forEach(([time, level]) => {
            const delay = audioContext.createDelay(0.25), reflection = audioContext.createGain();
            delay.delayTime.value = time;
            reflection.gain.value = level;
            roomInput.connect(delay);
            delay.connect(reflection);
            reflection.connect(masterGain);
          });
        }
      }
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(MASTER_LEVEL, audioContext.currentTime, 0.012);
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch (_) { return null; }
  }

  function bell(context, frequency, start, duration, volume, full = false, harmony = [5, 9]) {
    while (voices.size >= MAX_BELLS) retireVoice(voices.values().next().value);
    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(masterGain);
    if (roomInput) gain.connect(roomInput);
    const voice = { gain, start, oscillators: [], partials: [], released: false,
      retiring: false, cleanupTimer: null, ended: 0 };
    voices.add(voice);
    // A high crystal bell: no lower-octave body. Quiet chord tones sit above
    // the strike, while the very highest metal modes fade quickly and softly.
    const modes = full
      ? [[1,.70,1],[1.0018,.10,.82],[2 ** (harmony[0] / 12),.11,.68],[2 ** (harmony[1] / 12),.075,.58],[2.005,.055,.32],[2.756,.013,.19],[3.99,.004,.12]]
      : [[1,.72,1],[1.0022,.10,.8],[2 ** (7 / 12),.065,.56],[2.005,.06,.3],[2.756,.012,.18],[3.99,.004,.12]];
    try {
      modes.forEach(([ratio, level, decay], index) => {
        const oscillator = context.createOscillator(), partial = context.createGain();
        voice.oscillators.push(oscillator);
        voice.partials.push(partial);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency * ratio, start);
        const length = Math.max(0.12, duration * decay);
        const attack = index < 3 ? 0.006 : 0.003;
        partial.gain.setValueAtTime(0, start);
        partial.gain.linearRampToValueAtTime(level, start + attack);
        partial.gain.exponentialRampToValueAtTime(Math.max(0.0002, level * .32), start + Math.min(.13, length * .25));
        partial.gain.exponentialRampToValueAtTime(0.00004, start + length);
        partial.gain.setTargetAtTime(0, start + length, 0.012);
        oscillator.connect(partial);
        partial.connect(gain);
        oscillator.onended = () => {
          voice.ended++;
          try { oscillator.disconnect(); partial.disconnect(); } catch (_) {}
          if (voice.ended === voice.oscillators.length) releaseVoice(voice);
        };
        oscillator.start(start);
        oscillator.stop(start + length + 0.08);
      });
      // Also release nodes if the browser suspends the context before onended.
      voice.cleanupTimer = setTimeout(() => {
        for (const oscillator of voice.oscillators) { try { oscillator.stop(); } catch (_) {} }
        releaseVoice(voice);
      }, Math.max(0, start - context.currentTime + duration + 0.25) * 1000);
    } catch (_) {
      for (const oscillator of voice.oscillators) { try { oscillator.stop(); } catch (_) {} }
      releaseVoice(voice);
    }
  }

  function withAudio(callback, visualToken = null) {
    const context = unlockAudio();
    if (!context) return;
    const soundToken = audioGeneration;
    const start = () => {
      if (!soundEnabled || soundToken !== audioGeneration || context.state !== 'running' ||
          (visualToken !== null && visualToken !== generation)) return;
      try { callback(context, context.currentTime + 0.012); } catch (_) { silence(); }
    };
    if (context.state === 'running') start();
    else { try { context.resume().then(start).catch(() => {}); } catch (_) {} }
  }

  function ding(details = {}) {
    // Synchronous fire-and-forget: sounds never gate a score or a network save.
    withAudio((context, start) => bell(context,
      details.perfect ? 3135.96 : 2637.02, start,
      details.perfect ? 1.7 : 1.35, details.perfect ? .27 : .24,
      Boolean(details.perfect)));
  }

  function flourish(token) {
    withAudio((context, start) => {
      // High C7–E7–G7, 17 semitones above the original chime. Each strike adds
      // soft upper C-major tones, so the lingering bells form one harmony.
      [2093.00, 2637.02, 3135.96].forEach((frequency, index) => {
        bell(context, frequency, start + [0, .30, .65][index],
          [1.5, 1.7, 2.05][index], [.245, .26, .285][index], true,
          [[4, 7], [3, 8], [5, 9]][index]);
      });
    }, token);
  }

  function updateSoundButton() {
    if (!soundButton) return;
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.title = soundEnabled ? 'Turn sound effects off' : 'Turn sound effects on';
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
    const isLeaps = details.kind === 'leaps';
    title.append(make('', 'PERFECT', 'span'), make('', isLeaps ? 'LEAPS' : 'COMPLEX', 'span'));
    const gymnastName = String(details.gymnastName || 'What a performance!').slice(0, 120);
    const tierName = isLeaps ? '' : details.tierName || ({base:'Base complex',upgrade:'Upgrades',pro:'Pro upgrades'}[details.tier]) || '';
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
      soundButton.setAttribute('aria-label','Sound effects');
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

  window.SWLCelebration = Object.freeze({version:1,play,ding,stop,unlockAudio,setSoundEnabled,
    get soundEnabled(){return soundEnabled;},get active(){return Boolean(overlay);}});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
