import {getSettlement} from './settlements.js';

export const HOME_STATE_KEY='altera-home-city-01-v1';
export const LEGACY_HOME_STATE_KEY='altera-home-furniture-v1';
export const HOME_LIMIT=24;
export const HOME_TASKS=Object.freeze([
  Object.freeze({id:'anchor_room',label:'Plasser en sofa',type:'sofa'}),
  Object.freeze({id:'gathering_place',label:'Plasser et bord',type:'table'}),
  Object.freeze({id:'warm_light',label:'Tenn rommet med en lampe',type:'lamp'})
]);
export const FURNITURE_CATALOG=Object.freeze({
  sofa:Object.freeze({label:'Sofa',footprint:[2.2,.9],height:.82,color:'#574553'}),
  chair:Object.freeze({label:'Stol',footprint:[.72,.72],height:.88,color:'#42515a'}),
  table:Object.freeze({label:'Bord',footprint:[1.35,.78],height:.72,color:'#6b5145'}),
  lamp:Object.freeze({label:'Gulvlampe',footprint:[.42,.42],height:1.55,color:'#d9b77c'}),
  plant:Object.freeze({label:'Plante',footprint:[.64,.64],height:1.15,color:'#345a49'}),
  shelf:Object.freeze({label:'Hylle',footprint:[1.5,.42],height:1.75,color:'#41464b'})
});
const idPattern=/^item_[0-9]{3}$/;
const hex=/^#[0-9a-f]{6}$/i;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function normalizeHomeState(candidate={}){
  const seen=new Set(),items=[];
  for(const raw of Array.isArray(candidate.items)?candidate.items:[]){if(items.length>=HOME_LIMIT||!raw||!idPattern.test(raw.id||'')||seen.has(raw.id)||!FURNITURE_CATALOG[raw.type])continue;seen.add(raw.id);items.push({id:raw.id,type:raw.type,x:clamp(Number(raw.x)||0,-4.35,4.35),z:clamp(Number(raw.z)||0,-3.85,3.85),rotation:Math.round((Number(raw.rotation)||0)/(Math.PI/2))*(Math.PI/2),color:hex.test(raw.color||'')?raw.color.toLowerCase():FURNITURE_CATALOG[raw.type].color})}
  return{version:1,homeId:'home_city_01_001',settlementId:getSettlement('city_01')?.id||'city_01',items};
}
function migrateLegacyHome(raw){
  if(!Array.isArray(raw))return{};
  return{items:raw.slice(0,HOME_LIMIT).map((item,index)=>({id:`item_${String(index+1).padStart(3,'0')}`,type:item?.kind,x:item?.x,z:item?.z,rotation:(Number(item?.turn)||0)*Math.PI/2,color:FURNITURE_CATALOG[item?.kind]?.color}))};
}
export function loadHomeState(storage=globalThis.localStorage){try{const raw=storage?.getItem(HOME_STATE_KEY);if(raw)return normalizeHomeState(JSON.parse(raw));const legacy=storage?.getItem(LEGACY_HOME_STATE_KEY);return normalizeHomeState(legacy?migrateLegacyHome(JSON.parse(legacy)):{} )}catch{return normalizeHomeState()}}
export function saveHomeState(state,storage=globalThis.localStorage){const normalized=normalizeHomeState(state);storage?.setItem(HOME_STATE_KEY,JSON.stringify(normalized));return normalized}
export function addFurniture(state,type,position={}){const current=normalizeHomeState(state);if(!FURNITURE_CATALOG[type]||current.items.length>=HOME_LIMIT)return{state:current,item:null};const used=new Set(current.items.map(item=>item.id));let index=1,id;do{id=`item_${String(index++).padStart(3,'0')}`}while(used.has(id));const item={id,type,x:position.x||0,z:position.z||0,rotation:0,color:FURNITURE_CATALOG[type].color};return{state:normalizeHomeState({...current,items:[...current.items,item]}),item}}
export function updateFurniture(state,id,patch={}){const current=normalizeHomeState(state);return normalizeHomeState({...current,items:current.items.map(item=>item.id===id?{...item,...patch,id:item.id,type:item.type}:item)})}
export function removeFurniture(state,id){const current=normalizeHomeState(state);return normalizeHomeState({...current,items:current.items.filter(item=>item.id!==id)})}
export function deriveHomeProgress(state){
  const current=normalizeHomeState(state),types=new Set(current.items.map(item=>item.type)),completed=HOME_TASKS.filter(task=>types.has(task.type)).map(task=>task.id),next=HOME_TASKS.find(task=>!completed.includes(task.id))||null;
  return{completed,next,complete:completed.length===HOME_TASKS.length,total:HOME_TASKS.length};
}
