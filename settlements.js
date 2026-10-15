// ALTERA World Foundations v1 — data-only settlement manifests.
// The same schema is consumed by future renderer, editor and server.
export const WORLD_MANIFEST_VERSION=1;
export const BIOMES=Object.freeze(['urban-coastal','temperate-rural','alpine','rocky-coastal']);
export const SETTLEMENTS=Object.freeze([
  {id:'city_01',name:'ALTERA City',biome:'urban-coastal',climate:'temperate',spawn:[0,2,0],terrain:{type:'coastal-plain',heightRangeM:[0,18]},roads:['local','collector','pedestrian'],buildings:['residence','mall','hospital','fire-station','police-station','shop'],systems:['traffic','parking','public-services','commerce'],targetHomes:10},
  {id:'village_01',name:'ALTERA Village',biome:'temperate-rural',climate:'temperate',spawn:[0,2,0],terrain:{type:'rolling-hills',heightRangeM:[0,65]},roads:['rural','local','pedestrian'],buildings:['detached-house','farm','market','workshop','community-hall'],systems:['parcels','agriculture','local-commerce'],targetHomes:10},
  {id:'highlands_01',name:'ALTERA Highlands',biome:'alpine',climate:'snow',spawn:[0,12,0],terrain:{type:'mountain',heightRangeM:[0,450]},roads:['mountain','pedestrian'],buildings:['cabin','mountain-hotel','service-station','ski-lift'],systems:['slopes','winter-weather','mountain-travel'],targetHomes:10},
  {id:'coast_01',name:'ALTERA Coast',biome:'rocky-coastal',climate:'maritime',spawn:[0,3,0],terrain:{type:'shoreline',heightRangeM:[-8,55]},roads:['local','rural','pedestrian'],buildings:['coastal-house','boathouse','fish-market','marina'],systems:['water','boats','harbor'],targetHomes:10}
]);
const id=/^[a-z][a-z0-9_]{2,63}$/;
export function validateSettlement(s){
  const errors=[];
  if(!s||typeof s!=='object'||Array.isArray(s))return ['settlement must be an object'];
  if(!id.test(s.id||''))errors.push('invalid id');
  if(typeof s.name!=='string'||!s.name.trim())errors.push('missing name');
  if(!BIOMES.includes(s.biome))errors.push('unknown biome');
  if(!Array.isArray(s.spawn)||s.spawn.length!==3||!s.spawn.every(Number.isFinite))errors.push('invalid spawn');
  const range=s.terrain?.heightRangeM;
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isFinite)||range[0]>=range[1])errors.push('invalid height range');
  if(!Array.isArray(s.roads)||!s.roads.length)errors.push('missing road templates');
  if(!Array.isArray(s.buildings)||!s.buildings.length)errors.push('missing building archetypes');
  if(!Number.isSafeInteger(s.targetHomes)||s.targetHomes<0)errors.push('invalid targetHomes');
  return errors;
}
export function getSettlement(id){return SETTLEMENTS.find(s=>s.id===id)||null}
