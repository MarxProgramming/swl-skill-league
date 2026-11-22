/* One shared Violet Studio atmosphere. Previous device choices are no longer used. */
(() => {
  'use strict';
  document.documentElement.setAttribute('data-theme','dark');
  document.documentElement.style.colorScheme='dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#0d0e13');
  let activeView='home',backdrop=null;
  function paint(host){
    host.dataset.squadTheme='violet';host.dataset.squadPattern='contour';
    host.style.setProperty('--squad-accent','#c5acff');
    host.style.setProperty('--squad-rgb','150,108,240');
    host.style.setProperty('--squad-secondary','81,62,140');
  }
  function syncBackground(){
    const enabled=['dashboard','directory','analytics','tracker','placement','catalogue','challenge'].includes(activeView);
    paint(document.body);
    document.body.classList.toggle('squad-atmosphere-active',enabled);
    if(!backdrop){backdrop=document.createElement('div');backdrop.id='squadAtmosphere';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);}
    backdrop.hidden=!enabled;
  }
  function setView(view){activeView=view;syncBackground();}
  function mount(host,group,label){
    if(!host||!group)return;
    let banner=host.querySelector(':scope > .squad-banner');
    if(!banner){
      banner=document.createElement('section');banner.className='squad-banner';banner.setAttribute('aria-label','Selected squad');
      banner.innerHTML='<div class="squad-banner-copy"><p>Squad training</p><h2></h2></div>';
      host.prepend(banner);host.classList.add('squad-themed');
    }
    const heading=banner.querySelector('h2');if(heading.textContent!==label)heading.textContent=label;
    paint(host);syncBackground();
  }
  window.SWLSquadThemes=Object.freeze({mount,setView});
})();
