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
      ? [[1,.68,1],[1.0018,.075,.82],[2 ** (harmony[0] / 12),.09,.68],[2 ** (harmony[1] / 12),.06,.58],[2.005,.025,.3],[2.32,.005,.17],[2.49,.0015,.12]]
      : [[1,.70,1],[1.0022,.075,.8],[2 ** (7 / 12),.05,.56],[2.005,.025,.3],[2.32,.005,.17],[2.49,.0015,.12]];
    try {
      modes.forEach(([ratio, level, decay], index) => {
        const oscillator = context.createOscillator(), partial = context.createGain();
        voice.oscillators.push(oscillator);
        voice.partials.push(partial);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency * ratio, start);
        const length = Math.max(0.12, duration * decay);
        const attack = index < 3 ? 0.008 : 0.006;
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
      details.perfect ? 4698.64 : 3951.07, start,
      details.perfect ? 1.7 : 1.35, details.perfect ? .18 : .16,
      Boolean(details.perfect)));
  }

  function gameTone(context, start, frequency, endFrequency, duration, volume, type = 'sine') {
    while (voices.size >= MAX_BELLS) retireVoice(voices.values().next().value);
    const gain = context.createGain(), oscillator = context.createOscillator();
    const voice = { gain, start, oscillators: [oscillator], partials: [], released: false,
      retiring: false, cleanupTimer: null, ended: 0 };
    voices.add(voice);
    try {
      // Dry, short effects stay distinct even during a fast wheel spin.
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + .003);
      gain.gain.exponentialRampToValueAtTime(.00004, start + duration);
      oscillator.connect(gain); gain.connect(masterGain);
      oscillator.onended = () => releaseVoice(voice);
      oscillator.start(start); oscillator.stop(start + duration + .025);
      voice.cleanupTimer = setTimeout(() => {
        try { oscillator.stop(); } catch (_) {}
        releaseVoice(voice);
      }, (start - context.currentTime + duration + .12) * 1000);
    } catch (_) {
      try { oscillator.stop(); } catch (_) {}
      releaseVoice(voice);
    }
  }

  function gameSound(details = {}) {
    if (document.hidden || !soundEnabled) return;
    const kind = typeof details === 'string' ? details : details.kind;
    const context = unlockAudio();
    // Never queue ticks or timer cues behind a suspended audio context.
    if (!context || context.state !== 'running') return;
    const start = context.currentTime + .008;
    // Game cues need to carry across the floor; skill-check bells keep their softer mix.
    if (kind === 'wheel-start') gameTone(context, start, 900, 2400, .2, .7, 'triangle');
    else if (kind === 'wheel-tick') gameTone(context, start, 2900, 1250, .042, .78, 'triangle');
    else if (kind === 'countdown' && [3, 2, 1].includes(details.remaining)) {
      const frequency = {3:1567.98, 2:1760, 1:1975.53}[details.remaining];
      gameTone(context, start, frequency, frequency, .32, .95, 'triangle');
      gameTone(context, start, frequency * 1.5, frequency * 1.5, .26, .25);
    } else if (kind === 'timer-end') {
      gameTone(context, start, 1567.98, 1567.98, .22, .95, 'triangle');
      gameTone(context, start + .26, 2349.32, 2349.32, .38, .95, 'triangle');
      gameTone(context, start + .26, 3135.96, 3135.96, .34, .25);
    } else if (['wheel-finish', 'award', 'finish'].includes(kind)) {
      const notes = kind === 'award' && !details.perfect ? [2637.02,3135.96] : [2637.02,3135.96,3951.07];
      notes.forEach((frequency,index) => gameTone(context,start + index * .12,frequency,frequency,.4,.72,'triangle'));
    }
  }

  function flourish(token) {
    withAudio((context, start) => {
      // G7–B7–D8: another seven semitones higher, with a softer attack and mix.
      // Quiet upper G-major tones keep the bright bells in one gentle harmony.
      [3135.96, 3951.07, 4698.64].forEach((frequency, index) => {
        bell(context, frequency, start + [0, .30, .65][index],
          [1.5, 1.7, 2.05][index], [.17, .18, .195][index], true,
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
    overlay.querySelector('.swl-celebration-confetti')?.remove();
    cancelAnimations();
    overlay.classList.add('is-static');
    // Keep the original cleanup deadline: a late motion toggle must not extend
    // the celebration beyond its 5.8-second maximum.
  }

  function confettiShower(parent) {
    const width = Math.max(1, window.innerWidth || 1024);
    const height = Math.max(1, window.innerHeight || 768);
    const count = width <= 700 ? 65 : 100;
    const layer = make('swl-celebration-confetti');
    layer.setAttribute('aria-hidden', 'true');
    parent.append(layer);
    for (let index = 0; index < count; index++) {
      const shape = index % 5 === 0 ? 'diamond' : index % 3 === 0 ? 'tile' : 'foil';
      const piece = make(`swl-confetti swl-confetti--${index % 2 ? 'green' : 'gold'} swl-confetti--${shape}`, undefined, 'i');
      const size = 6 + Math.random() * 5;
      const left = (index + .15 + Math.random() * .7) / count * 100;
      piece.style.cssText = `left:${left}%;width:${size}px;height:${shape === 'foil' ? size * 2.3 : size}px;`;
      layer.append(piece);
      const startY = index % 4 === 0 ? Math.random() * height * .45 : -35 - Math.random() * height * .2;
      const travel = height + 55 + Math.random() * 90 - startY;
      const drift = (Math.random() - .5) * Math.min(width * .32, 330);
      const flutter = 12 + Math.random() * 24;
      const phase = Math.random() * Math.PI * 2;
      const turn = (index % 2 ? 1 : -1) * (250 + Math.random() * 430);
      const tilt = Math.random() * 180;
      const frames = Array.from({ length: 7 }, (_, frame) => {
        const progress = frame / 6;
        const x = drift * progress + Math.sin(phase + progress * Math.PI * 5) * flutter;
        const y = startY + travel * (.2 * progress + .8 * progress * progress);
        return {
          offset: progress,
          opacity: frame === 0 || frame === 6 ? 0 : .94,
          transform: `translate3d(${x}px,${y}px,0) rotateZ(${tilt + turn * progress}deg) rotateY(${turn * progress * 1.15}deg) rotateX(${Math.sin(phase + progress * 7) * 38}deg)`
        };
      });
      animate(piece, frames, { duration: 4100 + Math.random() * 800, delay: Math.random() * 500, easing: 'linear' });
    }
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
    const veil = make('swl-celebration-veil');
    veil.setAttribute('aria-hidden', 'true');
    const banner = make('swl-celebration-banner');
    banner.setAttribute('role', 'status'); banner.setAttribute('aria-live', 'polite'); banner.setAttribute('aria-atomic', 'true');
    const medals = make('swl-celebration-medals'); medals.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) medals.append(make('swl-celebration-medal', '✓', 'span'));
    const title = make('swl-celebration-title', undefined, 'p');
    const isLeaps = details.kind === 'leaps';
    title.append(make('', 'PERFECT', 'span'), make('', isLeaps ? 'LEAPS' : 'COMPLEX', 'span'));
    const gymnastName = String(details.gymnastName || 'What a performance!').slice(0, 120);
    const tierName = isLeaps ? '' : details.tierName || ({base:'Base complex',upgrade:'Upgrades',pro:'Pro upgrades'}[details.tier]) || '';
    const detail = [details.categoryName, tierName].filter(Boolean).map(value => String(value).slice(0,100)).join(' · ');
    banner.append(medals, title, make('swl-celebration-name', gymnastName, 'p'),
      make('swl-celebration-detail', detail, 'p'), make('swl-celebration-caption', 'Three skills. All perfect.', 'p'));
    overlay.append(veil, banner);
    document.body.append(overlay);
    if (!quiet) {
      // Only the independent overlay moves. The league, header and controls
      // remain stationary and interactive throughout the celebration.
      confettiShower(overlay);
      animate(banner, [
        {opacity:0,transform:'translate3d(0,16px,0) scale(.975)',offset:0},
        {opacity:1,transform:'translate3d(0,0,0) scale(1)',offset:.13},
        {opacity:1,transform:'translate3d(0,0,0) scale(1)',offset:.8},
        {opacity:0,transform:'translate3d(0,-8px,0) scale(.99)',offset:1}
      ], {duration:5700,easing:'ease-in-out'});
      animate(veil, [{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.8},{opacity:0}],
        {duration:5700,easing:'linear'});
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
      utilities.append(soundButton);
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

  window.SWLCelebration = Object.freeze({version:1,play,ding,gameSound,stop,unlockAudio,setSoundEnabled,
    get soundEnabled(){return soundEnabled;},get active(){return Boolean(overlay);}});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
