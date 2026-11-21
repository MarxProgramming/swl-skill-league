/* Squad atmosphere is a device preference; scoring colours and data are untouched. */
(() => {
  'use strict';
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.style.colorScheme = 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0d0e13');
  const themes = [
    ['violet','Violet studio','Soft violet · the original spirit','#c5acff','150,108,240','81,62,140'],
    ['aurora','Aurora','Cool teal · violet haze','#94ddd6','62,173,164','105,75,174'],
    ['midnight','Midnight','Deep blue · quiet indigo','#abc5ff','73,112,204','77,68,155'],
    ['rose','Rose quartz','Muted rose · plum shadows','#efb2cb','188,96,139','109,61,141'],
    ['ember','Ember','Warm copper · dusk plum','#edbd99','187,111,65','107,61,109'],
    ['glacier','Glacier','Ice blue · slate depth','#b1dbe9','84,151,177','58,83,127'],
    ['iris','Iris','Lilac · dusky blue','#c5beff','133,113,213','68,102,154'],
    ['forest','Forest','Soft sage · deep evergreen','#b4d5b9','91,145,109','52,95,101'],
    ['champagne','Champagne','Pale gold · smoked mauve','#e2d1a7','157,135,78','99,67,119'],
    ['amethyst','Amethyst','Rich purple · ink blue','#d7b2ff','163,88,224','64,77,149'],
    ['orchid','Orchid','Orchid pink · smoky violet','#e6b0ed','182,91,190','102,67,139'],
    ['raspberry','Raspberry','Berry red · dark plum','#efb0c1','188,71,109','107,52,108'],
    ['coral','Coral','Soft coral · rose dusk','#efb8ab','196,103,90','126,66,113'],
    ['terracotta','Terracotta','Burnished clay · cocoa','#e7bca4','174,107,76','107,75,83'],
    ['amber','Amber','Amber glow · warm charcoal','#edc788','186,134,57','116,75,87'],
    ['olive','Olive','Olive gold · woodland','#d1d39b','133,141,72','62,99,92'],
    ['jade','Jade','Jade green · deep teal','#9bd8b8','57,152,109','56,97,119'],
    ['lagoon','Lagoon','Lagoon blue · teal depths','#96d9dc','42,149,161','48,90,143'],
    ['ocean','Ocean','Clear blue · midnight','#9cccf2','57,126,188','63,68,141'],
    ['cobalt','Cobalt','Cobalt blue · dark iris','#acbcff','88,105,208','96,64,151'],
    ['periwinkle','Periwinkle','Dusty blue · soft lilac','#c5caff','123,135,198','125,91,155'],
    ['mauve','Mauve','Rose grey · muted plum','#d6bbcF','151,111,143','88,80,121'],
    ['pearl','Pearl','Warm silver · dusk blue','#dcd7d2','150,143,139','87,99,124'],
    ['graphite','Graphite','Silver · charcoal tones','#ced0e3','118,123,151','66,69,90']
  ].map(([id,name,description,accent,rgb,secondary])=>({id,name,description,accent,rgb,secondary}));
  const patterns=[['halo','Halo','Soft concentric rings'],['contour','Contours','Fine sweeping arcs'],['ribbon','Ribbons','Quiet diagonal bands'],['grid','Lattice','A fine architectural grid'],['stars','Starlight','A scattering of tiny dots'],['mist','Mist','Smooth colour, no pattern']].map(([id,name,description])=>({id,name,description}));
  const key='swl-squad-themes-v1', hosts=new Map();
  let preferences={},dialog=null,editing=null,trigger=null,draft={colour:'violet',pattern:'halo'},activeView='home',activeHost=null,backdrop=null;
  function read(){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
  preferences=read();
  const valid=id=>themes.some(t=>t.id===id);
  function selected(group){const v=preferences[group];return {colour:valid(typeof v==='string'?v:v?.colour)?(typeof v==='string'?v:v.colour):'violet',pattern:patterns.some(p=>p.id===v?.pattern)?v.pattern:'halo'};}
  function syncBackground(){
    const target={dashboard:'dashboard',directory:'directoryRoot',analytics:'analyticsRoot'}[activeView];
    if(target)activeHost=document.getElementById(target);
    const enabled=['dashboard','directory','analytics','tracker','placement','catalogue','challenge'].includes(activeView)&&activeHost?.dataset.squadTheme;
    document.body.classList.toggle('squad-atmosphere-active',Boolean(enabled));
    if(!backdrop){backdrop=document.createElement('div');backdrop.id='squadAtmosphere';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);}
    backdrop.hidden=!enabled;
    if(enabled){['--squad-accent','--squad-rgb','--squad-secondary'].forEach(k=>document.body.style.setProperty(k,activeHost.style.getPropertyValue(k)));document.body.dataset.squadPattern=activeHost.dataset.squadPattern;}
  }
  function setView(view){activeView=view;syncBackground();}
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function paint(host,choice){
    const t=themes.find(t=>t.id===choice.colour)||themes[0];
    host.dataset.squadPattern=choice.pattern;
    host.dataset.squadTheme=t.id;
    host.style.setProperty('--squad-accent',t.accent);
    host.style.setProperty('--squad-rgb',t.rgb);
    host.style.setProperty('--squad-secondary',t.secondary);
    if(host===activeHost)syncBackground();
  }
  function paintGroup(group,id){hosts.forEach((record,host)=>{if(record.group===group)paint(host,id);});}
  function mount(host,group,label){
    if(!host||!group)return;
    let banner=host.querySelector(':scope > .squad-banner');
    if(!banner){
      banner=document.createElement('section');banner.className='squad-banner';banner.setAttribute('aria-label','Selected squad');
      banner.innerHTML='<div class="squad-banner-copy"><p>Squad training</p><h2></h2></div><button type="button" class="squad-customise" aria-haspopup="dialog"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 5h12M4 10h12M4 15h12M7 3v4m6 1v4m-5 1v4"/></svg><span>Customise</span></button>';
      host.prepend(banner);host.classList.add('squad-themed');
      banner.querySelector('button').addEventListener('click',e=>open(host,e.currentTarget));
    }
    if(dialog?.open&&editing===host&&hosts.get(host)?.group!==group)close(false);
    hosts.set(host,{group,label});
    const heading=banner.querySelector('h2');if(heading.textContent!==label)heading.textContent=label;
    paint(host,dialog?.open&&hosts.get(editing)?.group===group?draft:selected(group));
    syncBackground();
  }
  function refreshChoices(){
    dialog.querySelectorAll('[data-squad-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.squadChoice===draft.colour)));
    dialog.querySelectorAll('[data-squad-pattern-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.squadPatternChoice===draft.pattern)));
    paint(dialog,draft);
    dialog.querySelector('.squad-theme-status').textContent=themes.find(t=>t.id===draft.colour).name+' · '+patterns.find(p=>p.id===draft.pattern).name;
  }
  function buildDialog(){
    dialog=document.createElement('dialog');dialog.id='squadThemeDialog';dialog.className='squad-theme-dialog';dialog.setAttribute('aria-labelledby','squadThemeHeading');dialog.setAttribute('aria-describedby','squadThemeHelp');
    dialog.innerHTML=`<div class="squad-theme-head"><div><p>Make it yours</p><h2 id="squadThemeHeading">Squad theme</h2></div><button type="button" class="squad-theme-close" aria-label="Close customisation"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></div><p id="squadThemeHelp">Colour the whole page. Keep the scoring colours you know.</p><div class="squad-theme-tabs" role="group" aria-label="Customisation options"><button type="button" data-theme-panel="colours" aria-pressed="true" aria-controls="squadThemeColours">Colours <span>24</span></button><button type="button" data-theme-panel="patterns" aria-pressed="false" aria-controls="squadThemePatterns">Patterns <span>6</span></button></div><div id="squadThemeColours" class="squad-theme-grid" role="group" aria-label="Choose a squad theme">${themes.map(t=>`<button type="button" class="squad-theme-choice" data-squad-choice="${t.id}" aria-pressed="false" style="--squad-accent:${t.accent};--squad-rgb:${t.rgb};--squad-secondary:${t.secondary}"><span class="squad-theme-swatch" aria-hidden="true"><i></i><b>✓</b></span><strong>${t.name}</strong><small>${t.description}</small></button>`).join('')}</div><div id="squadThemePatterns" class="squad-pattern-grid" role="group" aria-label="Choose a background pattern" hidden>${patterns.map(p=>`<button type="button" class="squad-theme-choice" data-squad-pattern-choice="${p.id}" data-squad-pattern="${p.id}" aria-pressed="false"><span class="squad-pattern-swatch" aria-hidden="true"><b>✓</b></span><strong>${p.name}</strong><small>${p.description}</small></button>`).join('')}</div><div class="squad-theme-footer"><div><p class="squad-theme-status" role="status" aria-live="polite"></p><small>Saved on this device, separately for each squad.</small></div><div class="squad-theme-actions"><button type="button" data-theme-cancel>Cancel</button><button type="button" data-theme-save>Save theme</button></div></div>`;
    document.body.append(dialog);
    dialog.addEventListener('click',event=>{
      const choice=event.target.closest('[data-squad-choice]');
      if(choice){draft={...draft,colour:choice.dataset.squadChoice};paintGroup(hosts.get(editing).group,draft);refreshChoices();}
      const pattern=event.target.closest('[data-squad-pattern-choice]');
      if(pattern){draft={...draft,pattern:pattern.dataset.squadPatternChoice};paintGroup(hosts.get(editing).group,draft);refreshChoices();}
      const panel=event.target.closest('[data-theme-panel]');
      if(panel){dialog.querySelector('#squadThemeColours').hidden=panel.dataset.themePanel!=='colours';dialog.querySelector('#squadThemePatterns').hidden=panel.dataset.themePanel!=='patterns';dialog.querySelectorAll('[data-theme-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b===panel)));}
      if(event.target.closest('.squad-theme-close,[data-theme-cancel]'))close(false);
      if(event.target.closest('[data-theme-save]'))close(true);
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(false);}
    });
    dialog.addEventListener('cancel',e=>{e.preventDefault();close(false);});
  }
  function open(host,button){
    if(!dialog)buildDialog();editing=host;trigger=button;draft=selected(hosts.get(host).group);
    dialog.querySelector('#squadThemeHeading').textContent=hosts.get(host).label;
    dialog.querySelector('#squadThemeColours').hidden=false;dialog.querySelector('#squadThemePatterns').hidden=true;dialog.querySelectorAll('[data-theme-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themePanel==='colours')));
    refreshChoices();dialog.showModal();dialog.scrollTop=0;document.body.classList.add('squad-theme-open');
    dialog.querySelector(`[data-squad-choice="${draft.colour}"]`).focus({preventScroll:true});
  }
  function close(save){
    if(!editing)return;const group=hosts.get(editing).group;
    if(save){
      const next={...preferences,[group]:draft};
      try{localStorage.setItem(key,JSON.stringify(next));preferences=next;}catch{dialog.querySelector('.squad-theme-status').textContent='This browser could not save. Cancel to keep your previous theme.';return;}
    }
    paintGroup(group,selected(group));dialog.close();document.body.classList.remove('squad-theme-open');editing=null;
    if(trigger?.isConnected)trigger.focus({preventScroll:true});
  }
  window.addEventListener('storage',event=>{if(event.key!==key)return;preferences=read();hosts.forEach((record,host)=>{if(!dialog?.open||record.group!==hosts.get(editing)?.group)paint(host,selected(record.group));});});
  window.SWLSquadThemes=Object.freeze({mount,setView});
})();
