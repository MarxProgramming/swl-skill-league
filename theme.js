/* Fixed Violet Studio colours. One device-wide pattern, editable only with scoring unlocked. */
(() => {
  'use strict';
  document.documentElement.setAttribute('data-theme','dark');
  document.documentElement.style.colorScheme='dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#0d0e13');
  const ink='rgba(150,108,240,.12)',soft='rgba(150,108,240,.075)';
  const svg=(w,h,paths)=>`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g fill="none" stroke="#9670f0" stroke-opacity=".16" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`)}")`;
  const paths=d=>`<path d="${d}"/>`;
  const patterns=[
    {id:'contour',name:'Contours',page:`repeating-radial-gradient(ellipse at -25% 115%,transparent 0 43px,${ink} 44px 47px,transparent 48px 72px)`,banner:`repeating-radial-gradient(ellipse at 110% -20%,transparent 0 55px,${ink} 56px 59px,transparent 60px 98px)`,bannerSize:'100% 420px'},
    {id:'orbit',name:'Halo',page:`repeating-radial-gradient(circle at 85% 20%,transparent 0 115px,${ink} 116px 119px,transparent 120px 185px)`,banner:`repeating-radial-gradient(circle at 78% 70%,transparent 0 53px,${ink} 54px 57px,transparent 58px 105px)`},
    {id:'ripple',name:'Ripples',page:`repeating-radial-gradient(ellipse at 25% 80%,transparent 0 68px,${ink} 69px 71px,transparent 72px 104px)`,banner:`repeating-radial-gradient(ellipse at 45% 160%,transparent 0 45px,${ink} 46px 49px,transparent 50px 89px)`,bannerSize:'100% 350px'},
    {id:'ribbon',name:'Ribbons',page:`repeating-linear-gradient(125deg,transparent 0 105px,${soft} 106px 150px,transparent 151px 240px)`,banner:`repeating-linear-gradient(65deg,transparent 0 75px,${soft} 76px 112px,transparent 113px 190px)`},
    {id:'grid',name:'Lattice',page:`linear-gradient(${soft} 1.5px,transparent 1.5px),linear-gradient(90deg,${soft} 1.5px,transparent 1.5px)`,size:'48px 48px',banner:`linear-gradient(${ink} 1.5px,transparent 1.5px),linear-gradient(90deg,${soft} 1.5px,transparent 1.5px)`,bannerSize:'80px 38px'},
    {id:'stars',name:'Starlight',page:`radial-gradient(circle,rgba(150,108,240,.26) 1px,transparent 1.6px),radial-gradient(circle,${ink} 1px,transparent 1.6px)`,size:'43px 47px,79px 67px',banner:`radial-gradient(circle,rgba(150,108,240,.28) 1.4px,transparent 2px),radial-gradient(circle,${ink} 1px,transparent 1.5px)`,bannerSize:'61px 39px,91px 57px'},
    {id:'waves',name:'Waves',page:svg(240,120,paths('M-60 30 Q0 -10 60 30T180 30T300 30M-60 90 Q0 50 60 90T180 90T300 90')),size:'240px 120px',banner:svg(240,110,paths('M-60 28 Q0 2 60 28T180 28T300 28M-60 80 Q0 54 60 80T180 80T300 80')),bannerSize:'360px 140px'},
    {id:'diamonds',name:'Diamonds',page:`repeating-linear-gradient(45deg,transparent 0 68px,${soft} 69px 71px,transparent 72px 140px),repeating-linear-gradient(135deg,transparent 0 68px,${soft} 69px 71px,transparent 72px 140px)`,banner:`repeating-linear-gradient(35deg,transparent 0 48px,${ink} 49px 51px,transparent 52px 100px),repeating-linear-gradient(145deg,transparent 0 48px,${soft} 49px 51px,transparent 52px 100px)`},
    {id:'chevron',name:'Chevron',page:svg(160,100,paths('M-80 0 0 50 80 0 160 50 240 0M-80 100 0 150 80 100 160 150 240 100')),size:'160px 100px',banner:svg(180,80,paths('M-90 0 0 40 90 0 180 40 270 0M-90 80 0 120 90 80 180 120 270 80')),bannerSize:'220px 100px'},
    {id:'crosshatch',name:'Crosshatch',page:svg(100,100,paths('M40 50h20M50 40v20')),size:'100px 100px',banner:svg(100,100,paths('M43 43l14 14M57 43 43 57')),bannerSize:'76px 76px'},
    {id:'pinstripe',name:'Pinstripes',page:`repeating-linear-gradient(90deg,transparent 0 45px,${soft} 46px 48px,transparent 49px 70px)`,banner:`repeating-linear-gradient(105deg,transparent 0 30px,${ink} 31px 33px,transparent 34px 62px)`},
    {id:'horizon',name:'Horizons',page:`repeating-linear-gradient(0deg,transparent 0 75px,${ink} 76px 78px,transparent 79px 110px)`,banner:`repeating-linear-gradient(170deg,transparent 0 32px,${soft} 33px 35px,transparent 36px 58px)`},
    {id:'arches',name:'Arches',page:svg(160,120,paths('M0 120V80a80 80 0 0 1 160 0v40M25 120V80a55 55 0 0 1 110 0v40')),size:'160px 120px',banner:svg(160,140,paths('M0 0v50a80 80 0 0 0 160 0V0M28 0v50a52 52 0 0 0 104 0V0')),bannerSize:'200px 150px'},
    {id:'fan',name:'Fanfare',page:`repeating-conic-gradient(from 0deg at 100% 100%,transparent 0deg 9deg,${soft} 9.2deg 9.5deg,transparent 9.7deg 17deg)`,banner:`repeating-conic-gradient(from 50deg at 10% 160%,transparent 0deg 12deg,${ink} 12.2deg 12.7deg,transparent 13deg 22deg)`},
    {id:'facets',name:'Facets',page:svg(200,174,paths('M0 0 100 174 200 0ZM-100 174 0 0 100 174 200 0 300 174')),size:'200px 174px',banner:svg(200,140,paths('M0 0 100 140 200 0ZM-100 140 0 0 100 140 200 0 300 140')),bannerSize:'250px 175px'},
    {id:'weave',name:'Weave',page:svg(120,120,paths('M20 15v30M30 15v30M75 25h30M75 35h30M20 85h30M20 95h30M85 75v30M95 75v30')),size:'120px 120px',banner:svg(120,120,paths('M20 20l24 24M28 12l24 24M76 44l24-24M84 52l24-24M20 100l24-24M28 108l24-24M76 76l24 24M84 68l24 24')),bannerSize:'140px 140px'},
    {id:'orbitals',name:'Orbitals',page:svg(260,180,'<ellipse cx="130" cy="90" rx="120" ry="65"/><ellipse cx="130" cy="90" rx="90" ry="45"/>'),size:'260px 180px',banner:svg(260,180,'<ellipse cx="130" cy="90" rx="60" ry="85"/><ellipse cx="130" cy="90" rx="35" ry="65"/>'),bannerSize:'210px 150px'},
    {id:'drift',name:'Drift',page:svg(240,240,paths('M-60 240C160 200 20 40 240-10M0 260C220 220 80 60 300 10')),size:'240px 240px',banner:svg(240,200,paths('M-50 0C200 40 0 150 280 200M-80 40C170 80 -30 190 250 240')),bannerSize:'360px 260px'},
    {id:'steps',name:'Steps',page:svg(160,160,paths('M0 160V80h80V0M40 200V120h80V40h80')),size:'160px 160px',banner:svg(160,160,paths('M0 0h80v80h80M-40 40h80v80h80v80')),bannerSize:'130px 130px'},
    {id:'mist',name:'Mist',page:`radial-gradient(ellipse at 25% 65%,${soft},transparent 65%)`,banner:`radial-gradient(ellipse at 85% 10%,rgba(150,108,240,.16),transparent 75%)`}
  ];
  const key='swl-app-pattern-v1',valid=id=>patterns.some(p=>p.id===id),hosts=new Set();
  const read=()=>{try{const id=localStorage.getItem(key);return valid(id)?id:'contour';}catch{return 'contour';}};
  let saved=read(),draft=saved,backdrop=null,dialog=null,button=null,editable=()=>false;
  function paint(host,id){
    const p=patterns.find(p=>p.id===id)||patterns[0];
    host.dataset.squadTheme='violet';host.dataset.squadPattern=p.id;
    Object.entries({'--squad-accent':'#c5acff','--squad-rgb':'150,108,240','--squad-secondary':'81,62,140','--squad-pattern-image':p.page,'--squad-pattern-size':p.size||'auto','--squad-banner-image':p.banner,'--squad-banner-size':p.bannerSize||'auto'}).forEach(([k,v])=>host.style.setProperty(k,v));
  }
  function apply(id){paint(document.body,id);hosts.forEach(host=>paint(host,id));}
  function setView(){
    document.body.classList.add('squad-atmosphere-active');
    if(!backdrop){backdrop=document.createElement('div');backdrop.id='squadAtmosphere';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);}
    apply(dialog?.open?draft:saved);
  }
  function mount(host,group,label){
    if(!host||!group)return;
    let banner=host.querySelector(':scope > .squad-banner');
    if(!banner){banner=document.createElement('section');banner.className='squad-banner';banner.setAttribute('aria-label','Selected squad');banner.innerHTML='<div class="squad-banner-copy"><p>Squad training</p><h2></h2></div>';host.prepend(banner);host.classList.add('squad-themed');}
    const heading=banner.querySelector('h2');if(heading.textContent!==label)heading.textContent=label;
    hosts.add(host);paint(host,dialog?.open?draft:saved);
  }
  function refresh(){
    const allowed=Boolean(editable());
    if(button){button.disabled=!allowed;button.title=allowed?'Change the app background pattern':'Unlock scoring to customise the background';button.setAttribute('aria-label',allowed?'Customise background pattern':'Customise background pattern — unlock scoring first');}
    if(dialog?.open&&!allowed)close(false);
  }
  function choices(){
    dialog.querySelectorAll('[data-app-pattern]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.appPattern===draft)));
    dialog.querySelector('.pattern-status').textContent=patterns.find(p=>p.id===draft).name;
  }
  function build(){
    dialog=document.createElement('dialog');dialog.id='appPatternDialog';dialog.setAttribute('aria-labelledby','appPatternTitle');dialog.setAttribute('aria-describedby','appPatternHelp');
    dialog.innerHTML=`<header class="pattern-dialog-head"><div><p>Violet Studio</p><h2 id="appPatternTitle">Choose a pattern</h2></div><button class="pattern-close" type="button" aria-label="Close customisation"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></header><p id="appPatternHelp">One background across the app. A matching twist for each banner.</p><div class="pattern-grid" role="group" aria-label="Background patterns">${patterns.map(p=>`<button type="button" class="pattern-option" data-app-pattern="${p.id}" aria-pressed="false"><span class="pattern-sample" aria-hidden="true"><i></i><b>✓</b></span><strong>${p.name}</strong></button>`).join('')}</div><footer class="pattern-dialog-footer"><div><p class="pattern-status" role="status" aria-live="polite"></p><small>Every page and squad · saved on this device</small></div><div class="pattern-actions"><button type="button" data-pattern-cancel>Cancel</button><button type="button" data-pattern-save>Save pattern</button></div></footer>`;
    document.body.append(dialog);
    dialog.querySelectorAll('[data-app-pattern]').forEach(b=>paint(b,b.dataset.appPattern));
    dialog.addEventListener('click',e=>{
      if(e.target.closest('.pattern-close,[data-pattern-cancel]')){close(false);return;}
      if(!editable()){refresh();return;}
      const choice=e.target.closest('[data-app-pattern]');if(choice){draft=choice.dataset.appPattern;apply(draft);choices();}
      if(e.target.closest('[data-pattern-save]'))close(true);
      if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(false);}
    });
    dialog.addEventListener('cancel',e=>{e.preventDefault();close(false);});
  }
  function close(save){
    if(save&&!editable()){refresh();return;}
    if(save){try{localStorage.setItem(key,draft);saved=draft;}catch{dialog.querySelector('.pattern-status').textContent='Could not save on this device. Please try again.';return;}}
    apply(saved);dialog.close();document.body.classList.remove('app-pattern-open');
    const target=button?.disabled?document.getElementById('lockButton'):button;target?.focus({preventScroll:true});
  }
  function open(){
    if(!editable()){refresh();return;}if(!dialog)build();draft=saved;choices();dialog.showModal();dialog.scrollTop=0;document.body.classList.add('app-pattern-open');dialog.querySelector(`[data-app-pattern="${draft}"]`).focus({preventScroll:true});
  }
  function init(config){editable=config.editable||(()=>false);button=config.button;if(button)button.addEventListener('click',open);refresh();}
  window.addEventListener('storage',e=>{if(e.key!==key)return;saved=read();if(!dialog?.open)apply(saved);});
  window.SWLSquadThemes=Object.freeze({mount,setView,init,refresh});
})();
