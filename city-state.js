import {DISTRICT_01_SEED} from './world-domain.js';

export const CITY_STATE_KEY='altera-district-01-state-v2';
export const LEGACY_CITY_PROGRESS_KEY='altera-city-progress-v1';
export const CITY_STEPS=Object.freeze([
  Object.freeze({id:'quay',title:'Lys over vannet',objective:'Aktiver lysinstallasjonen ved Nordkaien',reward:20,flag:'quayLights'}),
  Object.freeze({id:'cafe',title:'Et sted å møtes',objective:'Besøk Kafé Varm',reward:20,flag:'cafeOpen'}),
  Object.freeze({id:'gallery',title:'Byens stemme',objective:'Åpne kveldsgalleriet',reward:25,flag:'galleryOpen'}),
  Object.freeze({id:'transit',title:'Veien videre',objective:'Sjekk avgangen ved Linje 01',reward:35,flag:'transitReady'})
]);
const validIds=new Set(CITY_STEPS.map(step=>step.id));

export function normalizeCityState(candidate={}){
  const completed=[...new Set(Array.isArray(candidate.completed)?candidate.completed.filter(id=>validIds.has(id)):[])];
  const flags=Object.fromEntries(CITY_STEPS.map(step=>[step.flag,completed.includes(step.id)]));
  return{version:2,districtId:DISTRICT_01_SEED.id,completed,reputation:CITY_STEPS.filter(step=>completed.includes(step.id)).reduce((sum,step)=>sum+step.reward,0),flags,chapter:completed.length===CITY_STEPS.length?'first_home':'arrival'};
}

export function loadCityState(storage=globalThis.localStorage){
  try{const current=storage?.getItem(CITY_STATE_KEY);if(current)return normalizeCityState(JSON.parse(current));const legacy=storage?.getItem(LEGACY_CITY_PROGRESS_KEY);return normalizeCityState({completed:legacy?JSON.parse(legacy):[]})}catch{return normalizeCityState()}
}

export function saveCityState(state,storage=globalThis.localStorage){const normalized=normalizeCityState(state);storage?.setItem(CITY_STATE_KEY,JSON.stringify(normalized));return normalized}

export function completeCityStep(state,id){const current=normalizeCityState(state);if(!validIds.has(id)||current.completed.includes(id))return{state:current,changed:false,step:CITY_STEPS.find(step=>step.id===id)||null};return{state:normalizeCityState({...current,completed:[...current.completed,id]}),changed:true,step:CITY_STEPS.find(step=>step.id===id)}}

export function getNextCityStep(state){const normalized=normalizeCityState(state);return CITY_STEPS.find(step=>!normalized.completed.includes(step.id))||null}
