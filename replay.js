(() => {
  'use strict';
  if (window.SWLReplay?.version === 1) return;
  let instance = null, mountedRoot = null;
  const COLORS = [['#d5fa70', 'Lime'], ['#bd9bff', 'Purple'], ['#ffca75', 'Gold'], ['#ffffff', 'White'], ['#ff788b', 'Pink']];
  const node = (tag, className = '', text = '') => { const element = document.createElement(tag); element.className = className; element.textContent = text; return element; };
  const text = (element, value) => { const next = String(value); if (element.textContent !== next) element.textContent = next; };
  const timeText = seconds => { const value = Math.max(0, Number(seconds) || 0); return `${Math.floor(value / 60)}:${(value % 60).toFixed(1).padStart(4, '0')}`; };
  const errorMessage = error => {
    const name = typeof error === 'object' ? error?.name || error?.code : '';
    if (['NotAllowedError', 'PermissionDeniedError'].includes(name)) return 'Camera access was not allowed. You can enable it in this browser’s site settings, then try again.';
    if (['NotFoundError', 'DevicesNotFoundError'].includes(name)) return 'No camera was found on this device.';
    if (['NotReadableError', 'TrackStartError'].includes(name)) return 'The camera is busy or unavailable. Close any other app using it, then try again.';
    if (name === 'SecurityError') return 'This browser cannot open the camera here. Try opening the secure website directly.';
    return String(error?.message || error || 'Something went wrong. Please try again.');
  };
  function create(root) {
    let engine = null, active = true, destroyed = false, starting = false, state = {}, noticeText = '', noticeError = false;
    let tool = 'view', color = COLORS[0][0], gesture = null, angleDraft = null, lastFrameId = null, lastClipId = null;
    let prepared = null, preparedUrl = null, exportController = null, exportGeneration = 0, preparing = false, scrubHolding = false, lastPaint = '';
    const drawings = new Map(), handlers = [], fields = {}, buttons = {};
    const listen = (target, event, handler, options) => { target.addEventListener(event, handler, options); handlers.push(() => target.removeEventListener(event, handler, options)); };
    const usable = () => active && !destroyed && !document.hidden;
    const reviewing = () => state.phase === 'replay';
    const busy = () => starting || preparing || !!state.exporting;
    const button = (label, action, className = '') => { const item = node('button', `replay-button ${className}`.trim(), label); item.type = 'button'; item.dataset.replayAction = action; buttons[action] = item; listen(item, 'click', () => { if (usable() && !item.disabled) perform(action); }); return item; };
    const label = (caption, input, className = '') => { const item = node('label', `replay-field ${className}`.trim()); item.append(node('span', 'replay-label', caption), input); return item; };
    const shell = node('div', 'replay-shell');
    const heading = node('header', 'replay-heading'), title = node('div');
    title.append(node('p', 'replay-kicker', 'WATCH. UNDERSTAND. TRY AGAIN.'), node('h1', '', 'Video Replay'), node('p', 'replay-intro', 'A little distance. A clearer view. Watch a skill back, slow it down and find the next improvement.'));
    heading.append(title, node('span', 'replay-local', '●  On this device only')); shell.append(heading);
    const settings = node('section', 'replay-setup'); settings.setAttribute('aria-label', 'Camera and replay delay');
    fields.delay = node('input'); fields.delay.type = 'number'; fields.delay.min = '1'; fields.delay.max = '30'; fields.delay.step = '1'; fields.delay.inputMode = 'numeric'; fields.delay.value = '10'; fields.delay.dataset.replayDelay = ''; fields.delay.setAttribute('aria-label', 'Replay delay in seconds, 1 to 30');
    const delayField = label('Delay in seconds', fields.delay, 'replay-delay-field'), presets = node('div', 'replay-presets'); presets.setAttribute('role', 'group'); presets.setAttribute('aria-label', 'Delay presets');
    [5, 10, 15, 20, 30].forEach(seconds => presets.append(button(`${seconds}s`, `delay-${seconds}`, 'replay-preset')));
    delayField.append(presets); fields.facing = node('select'); fields.facing.dataset.replayFacing = ''; fields.facing.setAttribute('aria-label', 'Camera');
    [['environment', 'Rear camera'], ['user', 'Front camera']].forEach(([value, caption]) => { const option = node('option', '', caption); option.value = value; fields.facing.append(option); }); fields.facing.value = 'environment';
    const cameraActions = node('div', 'replay-camera-actions'); cameraActions.append(button('Start camera', 'start', 'replay-primary'), button('Stop camera', 'stop', 'replay-quiet'));
    settings.append(delayField, label('Camera', fields.facing), cameraActions); shell.append(settings);
    const studio = node('section', 'replay-studio'); studio.setAttribute('aria-label', 'Video replay studio');
    const studioTop = node('div', 'replay-studio-top'), badge = node('span', 'replay-mode', 'CAMERA OFF'), indicator = node('span', 'replay-indicator');
    studioTop.append(badge, indicator, button('Full screen ⛶', 'fullscreen', 'replay-quiet')); studio.append(studioTop);
    const display = node('div', 'replay-display'); display.tabIndex = 0; display.setAttribute('aria-label', 'Video display');
    const video = node('video', 'replay-source'); video.muted = true; video.playsInline = true; video.autoplay = true; video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
    const canvas = node('canvas', 'replay-picture'); canvas.setAttribute('aria-label', 'Delayed video or selected replay frame');
    const overlay = node('canvas', 'replay-ink'); overlay.setAttribute('aria-label', 'Draw on the paused video frame'); overlay.setAttribute('role', 'img');
    const empty = node('div', 'replay-empty'), emptyIcon = node('span', 'replay-empty-icon', '↶'), emptyTitle = node('h2', '', 'See the skill again.'), emptyDescription = node('p', '', 'Choose a delay, point the camera at the floor and press Start camera.'), bufferTrack = node('div', 'replay-buffer-track'), bufferFill = node('span'); bufferTrack.append(bufferFill); bufferTrack.hidden = true; empty.append(emptyIcon, emptyTitle, emptyDescription, bufferTrack);
    display.append(video, canvas, overlay, empty); studio.append(display);
    const primaryRow = node('div', 'replay-primary-row'), replayDescription = node('p', 'replay-capture-note', 'Camera audio is off. Nothing is uploaded.');
    primaryRow.append(button('Replay last 10 seconds ↶', 'replay', 'replay-primary replay-main-action'), button('Back to delayed view', 'return-delay', 'replay-secondary'), replayDescription); studio.append(primaryRow);
    const review = node('div', 'replay-review'); review.hidden = true;
    const timeline = node('div', 'replay-timeline'), time = node('output', 'replay-time', '0:00.0 / 0:00.0'); time.setAttribute('aria-label', 'Replay position and duration');
    fields.scrubber = node('input'); fields.scrubber.type = 'range'; fields.scrubber.min = '0'; fields.scrubber.max = '0'; fields.scrubber.step = '0.001'; fields.scrubber.value = '0'; fields.scrubber.dataset.replayScrubber = ''; fields.scrubber.setAttribute('aria-label', 'Choose a moment in the replay');
    timeline.append(fields.scrubber, time); review.append(timeline);
    const transport = node('div', 'replay-transport'), steps = node('div', 'replay-step-buttons');
    steps.append(button('‹ Frame', 'step-back', 'replay-secondary'), button('Play ▶', 'play', 'replay-primary'), button('Frame ›', 'step-forward', 'replay-secondary'));
    buttons['step-back'].setAttribute('aria-label', 'Previous frame'); buttons['step-forward'].setAttribute('aria-label', 'Next frame');
    fields.speed = node('select'); fields.speed.dataset.replaySpeed = ''; fields.speed.setAttribute('aria-label', 'Playback speed');
    [[.25, '¼× slow'], [.5, '½× slow'], [1, '1× normal'], [2, '2× fast']].forEach(([value, caption]) => { const option = node('option', '', caption); option.value = String(value); fields.speed.append(option); }); fields.speed.value = '1';
    transport.append(steps, label('Speed', fields.speed, 'replay-speed')); review.append(transport);
    const toolsPanel = node('section', 'replay-draw-tools'); toolsPanel.setAttribute('aria-label', 'Frame drawing tools');
    const toolsHeading = node('div', 'replay-tools-heading'); toolsHeading.append(node('span', 'replay-label', 'Look a little closer'), node('span', 'replay-drawing-hint', 'Drawings stay on this frame.'));
    const tools = node('div', 'replay-tool-buttons'); tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'Drawing tool');
    [['view', 'View'], ['pen', 'Pen'], ['line', 'Line'], ['arrow', 'Arrow'], ['angle', 'Angle']].forEach(([key, caption]) => tools.append(button(caption, `tool-${key}`, 'replay-tool')));
    const colors = node('div', 'replay-colors'); colors.setAttribute('role', 'group'); colors.setAttribute('aria-label', 'Drawing colour');
    COLORS.forEach(([value, caption], index) => { const swatch = button('', `color-${index}`, 'replay-swatch'); swatch.style.setProperty('--ink-color', value); swatch.setAttribute('aria-label', caption); colors.append(swatch); });
    fields.width = node('select'); fields.width.setAttribute('aria-label', 'Drawing thickness'); [[2, 'Fine'], [4, 'Medium'], [7, 'Bold']].forEach(([value, caption]) => { const option = node('option', '', caption); option.value = String(value); fields.width.append(option); }); fields.width.value = '4';
    const inkOptions = node('div', 'replay-ink-options'); inkOptions.append(colors, fields.width, button('Undo', 'undo-drawing', 'replay-quiet'), button('Clear frame', 'clear-drawing', 'replay-quiet'));
    const toolHint = node('p', 'replay-tool-hint', 'Choose a tool. The replay pauses when you draw.');
    toolsPanel.append(toolsHeading, tools, inkOptions, toolHint); review.append(toolsPanel);
    const save = node('section', 'replay-save'); save.setAttribute('aria-label', 'Save replay');
    const saveActions = node('div', 'replay-save-actions'); saveActions.append(button('Prepare video clip', 'prepare-clip', 'replay-secondary'), button('Save this frame', 'save-frame', 'replay-quiet'), button('Cancel preparation', 'cancel-export', 'replay-quiet'));
    const exportProgress = node('progress', 'replay-export-progress'); exportProgress.max = 1; exportProgress.value = 0; exportProgress.setAttribute('aria-label', 'Preparing video clip'); exportProgress.hidden = true;
    const saveHint = node('p', 'replay-save-hint', 'The clip contains the video. Frame images include your drawings.');
    const ready = node('div', 'replay-save-ready'); ready.hidden = true; const readyText = node('p', '', 'Ready to save.'); const readyActions = node('div', 'replay-ready-actions'); readyActions.append(button('Share / save…', 'share-clip', 'replay-primary'), button('Download', 'download-clip', 'replay-secondary')); const previewVideo = node('video', 'replay-export-preview'); previewVideo.controls = true; previewVideo.playsInline = true; previewVideo.preload = 'metadata'; previewVideo.setAttribute('playsinline', ''); previewVideo.setAttribute('aria-label', 'Prepared replay clip preview'); previewVideo.hidden = true; const shareHint = node('p', 'replay-share-hint', 'On iPad, choose Save Video or Save to Files when offered by the share sheet.'); ready.append(readyText, readyActions, previewVideo, shareHint);
    save.append(saveActions, exportProgress, saveHint, ready); review.append(save); studio.append(review); shell.append(studio);
    const notice = node('p', 'replay-notice'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
    const footer = node('p', 'replay-footnote', 'Leaving this tab stops the camera. Your frozen replay stays here until you start a new one or reload.'); shell.append(notice, footer); root.replaceChildren(shell);

    function announce(message, error = false) { noticeText = message; noticeError = error; update(); }
    function clearGesture() {
      const pointerId = gesture?.pointerId; gesture = angleDraft = null;
      if (pointerId !== undefined) { try { overlay.releasePointerCapture(pointerId); } catch (_) {} }
    }
    function checkDelay(value) {
      const delay = Number(value);
      if (!Number.isInteger(delay) || delay < 1 || delay > 30) { fields.delay.value = String(state.delaySeconds || 10); announce('Choose a whole number from 1 to 30 seconds.', true); return null; }
      fields.delay.value = String(delay); engine?.setDelay(delay); return delay;
    }
    function revokePrepared() { previewVideo.pause?.(); previewVideo.removeAttribute('src'); previewVideo.load?.(); previewVideo.hidden = true; if (preparedUrl) URL.revokeObjectURL(preparedUrl); preparedUrl = null; prepared = null; }
    function cancelExport() { exportGeneration++; exportController?.abort(); exportController = null; preparing = false; exportProgress.hidden = true; }
    function receive(next) {
      if (destroyed) return;
      state = next || {};
      if (lastClipId && state.clipId && lastClipId !== state.clipId) { cancelExport(); revokePrepared(); drawings.clear(); clearGesture(); }
      if (state.clipId) lastClipId = state.clipId;
      if (lastFrameId !== state.frameId) { clearGesture(); lastFrameId = state.frameId; }
      update();
    }
    function canShare() { try { return !!prepared && typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [prepared.file] }); } catch (_) { return false; } }
    function update() {
      if (destroyed) return;
      const inReview = reviewing(), running = !!state.cameraRunning, buffered = Number(state.bufferSeconds) || 0, delay = Number(state.delaySeconds) || Number(fields.delay.value) || 10;
      const available = state.supported !== false && !!engine;
      shell.dataset.phase = state.phase || 'idle'; shell.dataset.drawing = String(inReview && tool !== 'view');
      buttons.start.disabled = !active || !available || running || busy() || state.phase === 'starting'; buttons.stop.disabled = !active || (!running && !starting && state.phase !== 'starting');
      text(buttons.start, starting || state.phase === 'starting' ? 'Opening camera…' : 'Start camera');
      fields.facing.disabled = running || busy(); fields.delay.disabled = busy();
      [5, 10, 15, 20, 30].forEach(value => { buttons[`delay-${value}`].setAttribute('aria-pressed', String(value === delay)); buttons[`delay-${value}`].disabled = busy(); });
      const availableSeconds = Number(Math.min(delay, buffered || delay).toFixed(1));
      buttons.replay.disabled = !active || !running || buffered <= 0 || busy(); text(buttons.replay, `Replay last ${availableSeconds} seconds ↶`);
      buttons['return-delay'].hidden = !inReview || !running; buttons['return-delay'].disabled = busy();
      text(badge, inReview ? 'REPLAY' : running ? state.limited ? `${availableSeconds}s DELAY · DEVICE LIMIT` : buffered < delay ? 'BUILDING YOUR DELAY' : `${delay}s DELAY` : 'CAMERA OFF'); badge.dataset.live = String(running && !inReview);
      text(indicator, inReview ? 'A moment to learn from' : running ? `${buffered.toFixed(1)}s buffered` : 'Ready when you are');
      text(replayDescription, running && state.limited ? `This device is keeping ${availableSeconds}s of video. Replay uses this shorter buffer. Audio is off.` : 'Camera audio is off. Nothing is uploaded.');
      review.hidden = !inReview; empty.hidden = !!state.frameId;
      bufferTrack.hidden = !running || inReview || state.limited || buffered >= delay; bufferFill.style.width = `${Math.min(100, buffered / delay * 100)}%`;
      text(emptyTitle, running ? `Building your ${delay}s delay` : starting || state.phase === 'starting' ? 'Opening your camera…' : 'See the skill again.');
      text(emptyDescription, running ? `${Math.min(delay, buffered).toFixed(1)} of ${delay} seconds ready. Keep the camera steady.` : 'Choose a delay, point the camera at the floor and press Start camera.');
      const duration = Number(state.clipDuration) || 0, position = Number(state.position) || 0;
      fields.scrubber.max = String(duration); if (!scrubHolding) fields.scrubber.value = String(position); fields.scrubber.disabled = !inReview || busy();
      fields.scrubber.setAttribute('aria-valuetext', `${timeText(position)} of ${timeText(duration)}`); text(time, `${timeText(position)} / ${timeText(duration)}`);
      text(buttons.play, state.playing ? 'Pause Ⅱ' : 'Play ▶'); buttons.play.disabled = !inReview || busy() || state.frameCount < 2;
      buttons['step-back'].disabled = !inReview || busy() || state.frameIndex <= 0; buttons['step-forward'].disabled = !inReview || busy() || state.frameIndex >= state.frameCount - 1;
      fields.speed.disabled = !inReview || busy(); if (state.speed) fields.speed.value = String(state.speed);
      ['view', 'pen', 'line', 'arrow', 'angle'].forEach(key => { buttons[`tool-${key}`].setAttribute('aria-pressed', String(tool === key)); buttons[`tool-${key}`].disabled = !inReview || busy(); });
      COLORS.forEach(([value], index) => { buttons[`color-${index}`].setAttribute('aria-pressed', String(value === color)); buttons[`color-${index}`].disabled = busy(); });
      const strokes = drawings.get(state.frameId) || [];
      buttons['undo-drawing'].disabled = !inReview || busy() || (!strokes.length && !angleDraft); buttons['clear-drawing'].disabled = buttons['undo-drawing'].disabled;
      text(toolHint, tool === 'angle' ? `Tap endpoint, then the joint, then the other endpoint.${angleDraft ? ` ${angleDraft.points.length} of 3 points placed.` : ''}` : tool === 'view' ? 'Choose a tool. The replay pauses when you draw.' : 'Draw on the picture. Your marks belong to this frame only.');
      overlay.style.pointerEvents = inReview && tool !== 'view' && !busy() && !state.rendering ? 'auto' : 'none';
      buttons['prepare-clip'].disabled = !inReview || busy() || state.exportSupported === false || state.frameCount < 2; buttons['save-frame'].disabled = !inReview || busy() || !state.frameId || !!state.rendering;
      buttons['cancel-export'].hidden = !preparing; exportProgress.hidden = !preparing;
      text(saveHint, state.exportSupported === false ? 'This browser cannot prepare video clips. You can still save a frame image with your drawings.' : state.limited ? 'This device is keeping a shorter buffer. Replay uses the video currently available.' : 'The clip contains the video. Frame images include your drawings.');
      ready.hidden = !prepared; buttons['share-clip'].hidden = !canShare(); buttons['share-clip'].disabled = !active || preparing; buttons['download-clip'].disabled = !active || preparing;
      if (prepared) { text(readyText, prepared.kind === 'frame' ? 'Your frame image is ready.' : 'Your clip is ready.'); text(buttons['download-clip'], prepared.kind === 'frame' ? 'Download image' : 'Download clip'); text(shareHint, `On iPad, choose ${prepared.kind === 'frame' ? 'Save Image' : 'Save Video'} or Save to Files when offered by the share sheet.`); }
      const engineError = state.error ? errorMessage(state.error) : '', message = engineError || noticeText || (!available ? 'Video replay is not available in this browser. Try a recent Safari or Chrome browser on the secure website.' : '');
      text(notice, message); notice.dataset.error = String(noticeError || !!engineError || !available); notice.hidden = !message;
      paint();
    }
    function imageBox(width, height) {
      const sourceWidth = canvas.width || state.captureWidth || 16, sourceHeight = canvas.height || state.captureHeight || 9;
      const scale = Math.min(width / sourceWidth, height / sourceHeight), w = sourceWidth * scale, h = sourceHeight * scale;
      return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
    }
    function drawStroke(context, stroke, box) {
      if (!stroke.points.length) return;
      const points = stroke.points.map(point => ({ x: box.x + point.x * box.width, y: box.y + point.y * box.height }));
      context.strokeStyle = context.fillStyle = stroke.color; context.lineWidth = Math.max(1, stroke.width * box.width); context.lineCap = context.lineJoin = 'round';
      context.beginPath(); context.moveTo(points[0].x, points[0].y); points.slice(1).forEach(point => context.lineTo(point.x, point.y));
      if (points.length === 1) context.lineTo(points[0].x + .1, points[0].y); context.stroke();
      if (stroke.tool === 'arrow' && points.length > 1) {
        const a = points[0], b = points[points.length - 1], angle = Math.atan2(b.y - a.y, b.x - a.x), size = Math.max(9, context.lineWidth * 3);
        context.beginPath(); context.moveTo(b.x - size * Math.cos(angle - .5), b.y - size * Math.sin(angle - .5)); context.lineTo(b.x, b.y); context.lineTo(b.x - size * Math.cos(angle + .5), b.y - size * Math.sin(angle + .5)); context.stroke();
      }
      if (stroke.tool === 'angle' && points.length === 3) {
        const [a, b, c] = points, ab = Math.hypot(a.x - b.x, a.y - b.y), cb = Math.hypot(c.x - b.x, c.y - b.y);
        if (ab > 1 && cb > 1) { const degrees = Math.acos(Math.max(-1, Math.min(1, ((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)) / (ab * cb)))) * 180 / Math.PI; context.font = `700 ${Math.max(15, box.width * .025)}px sans-serif`; context.textAlign = 'left'; context.textBaseline = 'bottom'; context.fillText(`${Math.round(degrees)}°`, Math.min(box.x + box.width - 50, b.x + 9), Math.max(box.y + 22, b.y - 9)); }
      }
    }
    function paint() {
      const rect = display.getBoundingClientRect(); if (!rect.width || !rect.height) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1), width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
      const strokes = drawings.get(state.frameId) || [], endpoint = gesture?.points[gesture.points.length - 1];
      const signature = [state.frameId, reviewing(), width, height, ratio, canvas.width, canvas.height, strokes.length, gesture?.tool, gesture?.points.length, endpoint?.x, endpoint?.y, angleDraft?.points.length].join(':');
      if (signature === lastPaint) return; lastPaint = signature;
      if (overlay.width !== width || overlay.height !== height) { overlay.width = width; overlay.height = height; }
      const context = overlay.getContext('2d'); if (!context) return; context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, rect.width, rect.height);
      if (!reviewing() || !state.frameId) return;
      const box = imageBox(rect.width, rect.height); strokes.forEach(stroke => drawStroke(context, stroke, box));
      if (angleDraft?.frameId === state.frameId) drawStroke(context, angleDraft, box);
      if (gesture?.frameId === state.frameId && gesture.tool !== 'angle') drawStroke(context, gesture, box);
    }
    function pointAt(event) {
      const rect = display.getBoundingClientRect(), box = imageBox(rect.width, rect.height), x = (event.clientX - rect.left - box.x) / box.width, y = (event.clientY - rect.top - box.y) / box.height;
      return { point: { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1, box };
    }
    function strokeStart(event) {
      if (!usable() || !reviewing() || busy() || state.rendering || tool === 'view' || gesture || (event.button !== undefined && event.button !== 0)) return;
      engine.pause(); const current = pointAt(event); if (!current.inside || !state.frameId) return;
      event.preventDefault(); gesture = { tool, color, width: (Number(fields.width.value) || 4) / current.box.width, points: [current.point], frameId: state.frameId, pointerId: event.pointerId };
      try { overlay.setPointerCapture(event.pointerId); } catch (_) {} paint();
    }
    function strokeMove(event) {
      if (!gesture || gesture.pointerId !== event.pointerId || gesture.frameId !== state.frameId) return;
      event.preventDefault(); const point = pointAt(event).point;
      if (gesture.tool === 'pen') { if (gesture.points.length < 2500) gesture.points.push(point); }
      else if (gesture.tool !== 'angle') gesture.points[1] = point;
      paint();
    }
    function strokeEnd(event, canceled = false) {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const stroke = gesture; gesture = null; try { overlay.releasePointerCapture(event.pointerId); } catch (_) {}
      if (!canceled && usable() && stroke.frameId === state.frameId) {
        const point = pointAt(event).point;
        if (stroke.tool === 'angle') {
          if (!angleDraft || angleDraft.frameId !== state.frameId) angleDraft = { ...stroke, points: [] };
          angleDraft.points.push(point);
          if (angleDraft.points.length === 3) { const list = drawings.get(state.frameId) || []; list.push(angleDraft); drawings.set(state.frameId, list); angleDraft = null; }
        } else { if (stroke.tool !== 'pen') stroke.points[1] = point; const list = drawings.get(state.frameId) || []; list.push(stroke); drawings.set(state.frameId, list); }
      }
      update();
    }
    function preparedAsset(blob, kind, type) {
      revokePrepared(); const extension = kind === 'frame' ? 'png' : /mp4/i.test(type || blob.type) ? 'mp4' : 'webm';
      const name = `SWL-replay-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
      let file; try { file = new File([blob], name, { type: type || blob.type }); } catch (_) { file = blob; }
      prepared = { blob, file, name, kind }; if (kind === 'clip') { preparedUrl = URL.createObjectURL(blob); previewVideo.src = preparedUrl; previewVideo.hidden = false; previewVideo.load?.(); } update();
    }
    async function prepareClip() {
      if (!reviewing() || busy()) return;
      engine.pause(); clearGesture(); revokePrepared(); preparing = true; noticeText = ''; noticeError = false;
      exportController = new AbortController(); const controller = exportController, generation = ++exportGeneration;
      exportProgress.value = 0; update();
      try {
        const result = await engine.exportClip({ signal: controller.signal, onProgress: value => { if (generation === exportGeneration && !destroyed) { const progress = typeof value === 'number' ? value : value?.progress || 0; exportProgress.value = Math.max(0, Math.min(1, progress)); } } });
        if (generation !== exportGeneration || !usable() || controller.signal.aborted) return;
        if (!result?.blob) throw Error('This browser could not prepare the clip. Please try saving a frame instead.');
        preparedAsset(result.blob, 'clip', result.type);
      } catch (error) { if (generation === exportGeneration && error?.name !== 'AbortError') { noticeText = errorMessage(error); noticeError = true; } }
      finally { if (generation === exportGeneration) { preparing = false; exportController = null; update(); } }
    }
    function saveFrame() {
      if (!reviewing() || busy() || !state.frameId) return;
      engine.pause(); const snapshot = node('canvas'); snapshot.width = canvas.width; snapshot.height = canvas.height;
      const context = snapshot.getContext('2d'); if (!context || !snapshot.width || !snapshot.height) return;
      context.drawImage(canvas, 0, 0); (drawings.get(state.frameId) || []).forEach(stroke => drawStroke(context, stroke, { x: 0, y: 0, width: snapshot.width, height: snapshot.height }));
      const generation = ++exportGeneration; preparing = true; update();
      snapshot.toBlob(blob => { if (destroyed || generation !== exportGeneration) return; preparing = false; if (blob && usable()) preparedAsset(blob, 'frame', 'image/png'); else if (!blob) announce('This browser could not prepare the image. Please try again.', true); update(); }, 'image/png');
    }
    async function shareClip() {
      if (!prepared || !canShare()) return;
      try { await navigator.share({ files: [prepared.file], title: 'SWL video replay' }); if (usable()) announce('Sharing finished.'); }
      catch (error) { if (error?.name !== 'AbortError' && usable()) announce('Sharing was unavailable. You can use Download instead.', true); }
    }
    function downloadClip() {
      if (!prepared) return;
      if (!preparedUrl) preparedUrl = URL.createObjectURL(prepared.blob);
      const link = node('a'); link.href = preparedUrl; link.download = prepared.name; link.rel = 'noopener'; link.style.display = 'none'; document.body.append(link); link.click(); link.remove(); announce('Download requested. Check this browser’s downloads or Files.');
    }
    async function fullscreen() {
      try {
        if (document.fullscreenElement === studio) await document.exitFullscreen();
        else if (studio.requestFullscreen) await studio.requestFullscreen();
        else { shell.classList.toggle('replay-expanded'); text(buttons.fullscreen, shell.classList.contains('replay-expanded') ? 'Close large view' : 'Full screen ⛶'); announce('Full screen is unavailable here. The replay is enlarged in the page instead.'); }
      } catch (_) { shell.classList.add('replay-expanded'); text(buttons.fullscreen, 'Close large view'); announce('The replay is enlarged in the page. Full screen is not available in this browser.'); }
      paint();
    }
    async function perform(action) {
      try {
        if (action.startsWith('delay-')) { checkDelay(Number(action.slice(6))); update(); }
        else if (action === 'start') {
          const delay = checkDelay(fields.delay.value); if (!delay || !engine) return;
          starting = true; noticeText = ''; noticeError = false; update();
          try { await engine.start({ delaySeconds: delay, facingMode: fields.facing.value === 'user' ? 'user' : 'environment' }); } finally { starting = false; update(); }
        } else if (action === 'stop') { cancelExport(); engine?.stop(); starting = false; announce('Camera stopped. A frozen replay, if you made one, is still available.'); }
        else if (action === 'replay') { noticeText = ''; clearGesture(); tool = 'view'; engine?.replay(); }
        else if (action === 'return-delay') { clearGesture(); tool = 'view'; engine?.returnToDelay(); }
        else if (action === 'play') { clearGesture(); tool = 'view'; state.playing ? engine?.pause() : engine?.play(); update(); }
        else if (action === 'step-back' || action === 'step-forward') { clearGesture(); engine?.pause(); engine?.step(action === 'step-back' ? -1 : 1); }
        else if (action.startsWith('tool-')) { tool = action.slice(5); clearGesture(); if (tool !== 'view') engine?.pause(); update(); }
        else if (action.startsWith('color-')) { color = COLORS[Number(action.slice(6))]?.[0] || COLORS[0][0]; update(); }
        else if (action === 'undo-drawing') { if (angleDraft) angleDraft = null; else drawings.get(state.frameId)?.pop(); update(); }
        else if (action === 'clear-drawing') { drawings.delete(state.frameId); clearGesture(); update(); }
        else if (action === 'prepare-clip') await prepareClip();
        else if (action === 'cancel-export') { cancelExport(); announce('Preparation canceled. Your replay is still here.'); }
        else if (action === 'save-frame') saveFrame();
        else if (action === 'share-clip') await shareClip();
        else if (action === 'download-clip') downloadClip();
        else if (action === 'fullscreen') await fullscreen();
      } catch (error) { if (usable()) announce(errorMessage(error), true); }
    }
    listen(fields.delay, 'change', () => { if (usable()) checkDelay(fields.delay.value); });
    listen(fields.speed, 'change', () => { if (usable()) { const speed = Number(fields.speed.value); if ([.25, .5, 1, 2].includes(speed)) engine?.setSpeed(speed); } });
    listen(fields.scrubber, 'pointerdown', () => { scrubHolding = true; });
    listen(fields.scrubber, 'input', () => { if (usable() && reviewing() && !busy()) { const position = Number(fields.scrubber.value); clearGesture(); engine.pause(); engine.seek(position); } });
    listen(fields.scrubber, 'change', () => { scrubHolding = false; update(); }); listen(fields.scrubber, 'pointerup', () => { scrubHolding = false; update(); }); listen(fields.scrubber, 'pointercancel', () => { scrubHolding = false; update(); });
    listen(overlay, 'pointerdown', strokeStart); listen(overlay, 'pointermove', strokeMove); listen(overlay, 'pointerup', event => strokeEnd(event)); listen(overlay, 'pointercancel', event => strokeEnd(event, true)); listen(overlay, 'lostpointercapture', event => { if (gesture?.pointerId === event.pointerId) { gesture = null; paint(); } });
    listen(window, 'resize', paint); listen(document, 'fullscreenchange', () => { text(buttons.fullscreen, document.fullscreenElement === studio ? 'Exit full screen' : 'Full screen ⛶'); paint(); });
    listen(display, 'keydown', event => { if (!usable() || !reviewing() || busy()) return; if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); engine.pause(); engine.step(event.key === 'ArrowLeft' ? -1 : 1); } else if (event.key === ' ') { event.preventDefault(); perform('play'); } });
    const pauseForExit = () => { cancelExport(); clearGesture(); scrubHolding = false; starting = false; previewVideo.pause?.(); if (document.fullscreenElement === studio) { try { Promise.resolve(document.exitFullscreen?.()).catch(() => {}); } catch (_) {} } shell.classList.remove('replay-expanded'); text(buttons.fullscreen, 'Full screen ⛶'); engine?.setActive(false); update(); };
    listen(document, 'visibilitychange', () => { if (document.hidden) pauseForExit(); else if (active) { engine?.setActive(true); update(); } }); listen(window, 'pagehide', pauseForExit);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(paint) : null; observer?.observe(display);
    try { engine = window.SWLReplayEngine?.create({ video, canvas, onChange: receive }) || null; if (engine) receive(engine.getState()); else update(); } catch (error) { announce(errorMessage(error), true); }
    return {
      setActive(value) { if (destroyed) return; active = !!value; if (!active) pauseForExit(); else { engine?.setActive(!document.hidden); update(); } },
      getState() { return { ...state, active, drawingTool: tool, currentFrameDrawings: (drawings.get(state.frameId) || []).length, prepared: prepared?.kind || null, preparing }; },
      destroy() { if (destroyed) return; pauseForExit(); destroyed = true; active = false; revokePrepared(); observer?.disconnect(); handlers.forEach(remove => remove()); engine?.destroy(); drawings.clear(); root.replaceChildren(); }
    };
  }
  window.SWLReplay = Object.freeze({ version: 1,
    mount(root) { if (!root || typeof root.replaceChildren !== 'function') throw Error('A replay container is required.'); if (instance && mountedRoot === root) return instance; instance?.destroy(); mountedRoot = root; instance = create(root); return instance; },
    setActive(value) { instance?.setActive(value); },
    getState() { return instance?.getState() || null; },
    destroy() { instance?.destroy(); instance = null; mountedRoot = null; }
  });
})();
