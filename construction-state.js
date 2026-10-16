import {getSettlement} from './settlements.js';

export const CONSTRUCTION_STATE_KEY='altera-build-city-01-v1';
export const CONSTRUCTION_LIMIT=120;
export const PARCEL=Object.freeze({id:'parcel_city_01_001',settlementId:getSettlement('city_01')?.id||'city_01',width:12,depth:12,budgetMinor:8000,grid:.5});
export const BUILD_CATALOG=Object.freeze({
  foundation:Object.freeze({label:'Fundament',costMinor:250,size:[2,.2,2],level:'ground',color:'#5d6264'}),
  wall:Object.freeze({label:'Vegg',costMinor:180,size:[2,2.5,.18],level:'wall',color:'#a9a39a'}),
  window:Object.freeze({label:'Vindusvegg',costMinor:320,size:[2,2.5,.18],level:'wall',color:'#66818b'}),
  door:Object.freeze({label:'Dørvegg',costMinor:360,size:[2,2.5,.18],level:'wall',color:'#4e5557'}),
  roof:Object.freeze({label:'Takmodul',costMinor:220,size:[2,.18,2],level:'roof',color:'#343a3c'})
});
export const BUILD_TASKS=Object.freeze([
  Object.freeze({id:'grounded',label:'Legg et fundament',test:modules=>modules.some(module=>module.type==='foundation')}),
  Object.freeze({id:'entrance',label:'Plasser en dørvegg',test:modules=>modules.some(module=>module.type==='door')}),
  Object.freeze({id:'shelter',label:'Bygg tre vegger',test:modules=>modules.filter(module=>BUILD_CATALOG[module.type]?.level==='wall').length>=3}),
  Object.freeze({id:'covered',label:'Legg på et tak',test:modules=>modules.some(module=>module.type==='roof')})
]);
const idPattern=/^module_[0-9]{3}$/;
const snap=value=>Math.round((Number(value)||0)/PARCEL.grid)*PARCEL.grid;
const quarter=value=>((Math.round((Number(value)||0)/(Math.PI/2))%4)+4)%4*Math.PI/2;

export function normalizeConstructionState(candidate={}){
  const seen=new Set(),modules=[];let acceptedCost=0;
  for(const raw of Array.isArray(candidate.modules)?candidate.modules:[]){if(modules.length>=CONSTRUCTION_LIMIT||!raw||!idPattern.test(raw.id||'')||seen.has(raw.id)||!BUILD_CATALOG[raw.type])continue;const module={id:raw.id,type:raw.type,x:snap(raw.x),z:snap(raw.z),rotation:quarter(raw.rotation)},definition=BUILD_CATALOG[module.type],supported=definition.level==='ground'||modules.some(other=>other.type==='foundation'&&other.x===module.x&&other.z===module.z);if(withinParcel(module)&&supported&&!modules.some(other=>overlaps(module,other))&&acceptedCost+definition.costMinor<=PARCEL.budgetMinor){seen.add(module.id);modules.push(module);acceptedCost+=definition.costMinor}}
  const spentMinor=modules.reduce((sum,module)=>sum+BUILD_CATALOG[module.type].costMinor,0);
  return{version:1,parcelId:PARCEL.id,settlementId:PARCEL.settlementId,budgetMinor:PARCEL.budgetMinor,spentMinor,modules};
}
export function loadConstructionState(storage=globalThis.localStorage){try{const raw=storage?.getItem(CONSTRUCTION_STATE_KEY);return normalizeConstructionState(raw?JSON.parse(raw):{})}catch{return normalizeConstructionState()}}
export function saveConstructionState(state,storage=globalThis.localStorage){const normalized=normalizeConstructionState(state);storage?.setItem(CONSTRUCTION_STATE_KEY,JSON.stringify(normalized));return normalized}
export function placeModule(state,type,transform={}){const current=normalizeConstructionState(state),definition=BUILD_CATALOG[type];if(!definition)return{state:current,module:null,error:'unknown_module'};if(current.modules.length>=CONSTRUCTION_LIMIT)return{state:current,module:null,error:'module_limit'};if(current.spentMinor+definition.costMinor>current.budgetMinor)return{state:current,module:null,error:'budget'};const used=new Set(current.modules.map(module=>module.id));let index=1,id;do{id=`module_${String(index++).padStart(3,'0')}`}while(used.has(id));const module={id,type,x:snap(transform.x),z:snap(transform.z),rotation:quarter(transform.rotation)};const error=placementError(current,module);if(error)return{state:current,module:null,error};return{state:normalizeConstructionState({...current,modules:[...current.modules,module]}),module,error:null}}
export function removeModule(state,id){const current=normalizeConstructionState(state),module=current.modules.find(value=>value.id===id);if(!module)return{state:current,removed:false,error:'not_found'};if(module.type==='foundation'){const supported=current.modules.some(other=>other.id!==id&&other.x===module.x&&other.z===module.z&&BUILD_CATALOG[other.type].level!=='ground');if(supported)return{state:current,removed:false,error:'supports_modules'}}return{state:normalizeConstructionState({...current,modules:current.modules.filter(value=>value.id!==id)}),removed:true,error:null}}
export function rotateModule(state,id){const current=normalizeConstructionState(state),module=current.modules.find(value=>value.id===id);if(!module)return{state:current,changed:false,error:'not_found'};const candidate={...module,rotation:quarter(module.rotation+Math.PI/2)},others=current.modules.filter(value=>value.id!==id),error=!withinParcel(candidate)?'outside_parcel':others.some(other=>overlaps(candidate,other))?'overlap':null;if(error)return{state:current,changed:false,error};return{state:normalizeConstructionState({...current,modules:current.modules.map(value=>value.id===id?candidate:value)}),changed:true,error:null}}
export function deriveConstructionProgress(state){const current=normalizeConstructionState(state),completed=BUILD_TASKS.filter(task=>task.test(current.modules)).map(task=>task.id),next=BUILD_TASKS.find(task=>!completed.includes(task.id))||null;return{completed,next,complete:completed.length===BUILD_TASKS.length,total:BUILD_TASKS.length}}
export function placementError(state,module){if(!BUILD_CATALOG[module.type])return'unknown_module';if(!withinParcel(module))return'outside_parcel';if(state.modules.some(other=>overlaps(module,other)))return'overlap';const level=BUILD_CATALOG[module.type].level;if(level!=='ground'&&!state.modules.some(other=>other.type==='foundation'&&other.x===module.x&&other.z===module.z))return'needs_foundation';return null}

function orientedSize(module){const [width,,depth]=BUILD_CATALOG[module.type].size,turned=Math.round(module.rotation/(Math.PI/2))%2;return turned?[depth,width]:[width,depth]}
function withinParcel(module){const [width,depth]=orientedSize(module);return Math.abs(module.x)+width/2<=PARCEL.width/2&&Math.abs(module.z)+depth/2<=PARCEL.depth/2}
function overlaps(a,b){const aLevel=BUILD_CATALOG[a.type].level,bLevel=BUILD_CATALOG[b.type].level;if(aLevel!==bLevel)return false;const [aw,ad]=orientedSize(a),[bw,bd]=orientedSize(b);return Math.abs(a.x-b.x)<(aw+bw)/2-.02&&Math.abs(a.z-b.z)<(ad+bd)/2-.02}
