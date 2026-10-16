import {BUILD_CATALOG,CONSTRUCTION_STATE_KEY,PARCEL,deriveConstructionProgress,loadConstructionState,normalizeConstructionState,placeModule,removeModule,rotateModule,saveConstructionState} from './construction-state.js';
const assert=(ok,message)=>{if(!ok)throw Error(message)};
let state=normalizeConstructionState({budgetMinor:999999,spentMinor:-10,modules:[{id:'bad',type:'foundation'},{id:'module_001',type:'foundation',x:999,z:0},{id:'module_002',type:'unknown',x:0,z:0},{id:'module_003',type:'roof',x:0,z:0}]});assert(state.budgetMinor===8000&&state.spentMinor===0&&state.modules.length===0,'hostile totals and unsupported modules ignored');
let result=placeModule(state,'wall',{x:0,z:0});assert(result.error==='needs_foundation','wall needs foundation');
result=placeModule(state,'foundation',{x:0,z:0});state=result.state;assert(result.module.id==='module_001'&&state.spentMinor===250,'foundation placed');
assert(placeModule(state,'foundation',{x:0,z:0}).error==='overlap','same-layer overlap rejected');
for(const type of['door','wall','window','roof']){result=placeModule(state,type,{x:0,z:0});if(result.module)state=result.state}
assert(state.modules.length===3,'wall layers reject overlap while roof stacks');
assert(removeModule(state,'module_001').error==='supports_modules','support cannot be removed');
result=placeModule(state,'foundation',{x:2,z:0});state=result.state;result=placeModule(state,'wall',{x:2,z:0});state=result.state;result=rotateModule(state,result.module.id);assert(result.changed,'module rotates');state=result.state;
result=placeModule(state,'foundation',{x:-2,z:0});state=result.state;result=placeModule(state,'wall',{x:-2,z:0});state=result.state;
assert(deriveConstructionProgress(state).completed.includes('shelter'),'three wall task derived');
assert(placeModule(state,'foundation',{x:PARCEL.width,z:0}).error==='outside_parcel','parcel bounds');
const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};saveConstructionState(state,storage);assert(values.has(CONSTRUCTION_STATE_KEY)&&loadConstructionState(storage).spentMinor===state.spentMinor,'save and load');
assert(Object.keys(BUILD_CATALOG).length===5,'catalog stable');console.log('Construction state checks passed');
