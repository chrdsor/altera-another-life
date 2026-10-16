import {districtPlaces,destinationForQuest} from './alpha-wayfinding.mjs';
export function setupDistrictPhone({getQuest,onNavigate}){
 const phone=document.getElementById('phone'),toggle=document.getElementById('phone-toggle'),close=document.getElementById('phone-close'),list=document.getElementById('phone-missions');
 let selected=null;
 function show(open){phone.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open)render()}
 function render(){
  const step=getQuest(),recommended=destinationForQuest(step);
  const missions=[{id:'welcome',title:'Velkommen til District 01',destination:recommended,detail:step==='complete'?'Fullført ✓':'Aktivt oppdrag'}];
  list.replaceChildren();
  for(const mission of missions){
   const row=document.createElement('button');row.className='phone-mission';
   const place=districtPlaces.find(p=>p.id===mission.destination);
   row.textContent=mission.title+' · '+mission.detail+' · '+place.name+' ('+place.address+')';
   row.onclick=()=>{selected=mission.destination;onNavigate(selected);show(false)};
   list.append(row);
  }
  const places=document.getElementById('phone-places');places.replaceChildren();
  for(const place of districtPlaces){const row=document.createElement('button');row.className='phone-mission';row.textContent=place.name+' · '+place.address;row.onclick=()=>{selected=place.id;onNavigate(selected);show(false)};places.append(row)}
 }
 toggle.onclick=()=>show(phone.hidden);close.onclick=()=>show(false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')show(false)});
 return {refresh:render,getSelected:()=>selected};
}
