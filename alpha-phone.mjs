import {districtPlaces,destinationForQuest} from './alpha-wayfinding.mjs';
export function setupDistrictPhone({getQuest,onNavigate,onMapOpen}){
 const $=id=>document.getElementById(id);
 const phone=$('phone'),toggle=$('phone-toggle'),close=$('phone-close');
 let selected=null,tab='missions';
 function show(open){if(open)document.dispatchEvent(new Event('altera:overlay-open'));phone.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)render()}
 function button(text,fn){const el=document.createElement('button');el.className='phone-mission';el.textContent=text;el.onclick=fn;return el}
 function navigate(id){selected=id;onNavigate(id);show(false)}
 function render(){
  const step=getQuest(),recommended=destinationForQuest(step);
  for(const t of ['missions','places','contacts','messages','wallet']){
   const pane=$('phone-'+t);pane.hidden=tab!==t;
   const nav=$('phone-tab-'+t);nav.setAttribute('aria-selected',String(tab===t));
  }
  const missions=$('phone-missions');missions.replaceChildren();
  const place=districtPlaces.find(p=>p.id===recommended);
  missions.append(button('Velkommen til District 01 · '+(step==='complete'?'Fullført':'Aktivt')+' · '+place.name+' – '+place.address,()=>navigate(place.id)));
  const places=$('phone-places');places.replaceChildren();
  for(const p of districtPlaces)places.append(button(p.name+' · '+p.address,()=>navigate(p.id)));
  const contacts=$('phone-contacts');contacts.replaceChildren();contacts.append(document.createTextNode('Maja · Kafévert · Kafé Varm, Havneveien 4'));const customize=button('Tilpass avataren din ↗',()=>{location.href='avatar-studio.html'});contacts.append(document.createElement('hr'),customize);
  $('phone-contacts').dataset.avatarStudio='available';

  $('phone-messages').textContent=step==='complete'?'Maja: Takk for hjelpen! Postkortet er klart til å henges opp hjemme.':'Maja: Kom innom Kafé Varm. Jeg har et lite oppdrag til deg.';
  $('phone-wallet').textContent='Lokal demo. Ingen ekte saldo, betaling eller serverlagret eierskap.';
 }
 toggle.onclick=()=>show(phone.hidden);close.onclick=()=>show(false);
 for(const t of ['missions','places','contacts','messages','wallet'])$('phone-tab-'+t).onclick=()=>{tab=t;render()};
 $('phone-map').onclick=()=>{show(false);onMapOpen()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')show(false)});
 return {refresh:render,getSelected:()=>selected};
}
