/* A Perfect mark is a deliberate coaching decision, before any score is queued. */
(() => {
  'use strict';
  let dialog = null, pending = null;

  function finish(answer) {
    const request = pending;
    if (!request) return;
    pending = null;
    if (dialog?.open) dialog.close();
    request.restoreFocus?.();
    if (!answer) { request.onCancel?.(); return; }
    if (!request.canConfirm?.()) { request.onStale?.(); return; }
    request.onConfirm?.();
  }

  function mount() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'perfect-confirm';
    dialog.setAttribute('aria-labelledby','perfectConfirmTitle');
    dialog.setAttribute('aria-describedby','perfectConfirmQuestion');
    dialog.innerHTML = `<div class="perfect-confirm-mark" aria-hidden="true">✓✓</div>
      <p class="perfect-confirm-eyebrow">Before awarding Perfect</p>
      <h2 id="perfectConfirmTitle"></h2>
      <p class="perfect-confirm-skill" id="perfectConfirmSkill"></p>
      <p class="perfect-confirm-question" id="perfectConfirmQuestion">Performed twice in a row with excellent execution?</p>
      <div class="perfect-confirm-actions"><button type="button" data-perfect-no autofocus>No, not yet</button><button type="button" data-perfect-yes>Yes, award Perfect</button></div>`;
    dialog.querySelector('[data-perfect-no]').addEventListener('click',()=>finish(false));
    dialog.querySelector('[data-perfect-yes]').addEventListener('click',()=>finish(true));
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
    dialog.addEventListener('close',()=>{if(pending && !dialog.open)finish(false);});
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)finish(false);
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function request(config) {
    if(pending || !config || typeof config.canConfirm!=='function' || typeof config.onConfirm!=='function')return false;
    const host=mount();
    if(typeof host.showModal!=='function')return false;
    host.querySelector('#perfectConfirmTitle').textContent=String(config.gymnastName || 'This gymnast');
    host.querySelector('#perfectConfirmSkill').textContent=String(config.skillName || 'This skill');
    host.querySelector('[data-perfect-yes]').textContent=config.renew ? 'Yes, renew Perfect' : 'Yes, award Perfect';
    pending=config;
    try {host.showModal();host.querySelector('[data-perfect-no]').focus({preventScroll:true});return true;}
    catch (_) {pending=null;return false;}
  }

  window.SWLPerfectConfirm=Object.freeze({request,cancel:()=>finish(false)});
})();
