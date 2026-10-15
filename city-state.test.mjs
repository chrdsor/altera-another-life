import {CITY_STATE_KEY,CITY_STEPS,completeCityStep,getNextCityStep,loadCityState,normalizeCityState,saveCityState} from './city-state.js';
import {DISTRICT_01_SEED} from './world-domain.js';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const hostile=normalizeCityState({completed:['quay','quay','unknown'],reputation:9999,chapter:'admin'});
assert(hostile.districtId===DISTRICT_01_SEED.id,'district identity');
assert(hostile.completed.length===1&&hostile.reputation===20,'derived reputation');
assert(hostile.flags.quayLights&&!hostile.flags.galleryOpen,'derived flags');
let state=normalizeCityState();
for(const step of CITY_STEPS){const result=completeCityStep(state,step.id);assert(result.changed,'new step changes state');state=result.state}
assert(state.chapter==='first_home'&&state.reputation===100&&!getNextCityStep(state),'completed chapter');
assert(!completeCityStep(state,'quay').changed,'idempotent completion');
const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
saveCityState(state,storage);assert(values.has(CITY_STATE_KEY)&&loadCityState(storage).reputation===100,'save/load');
const legacyValues=new Map([['altera-city-progress-v1',JSON.stringify(['quay','gallery'])]]),legacyStorage={getItem:key=>legacyValues.get(key)||null,setItem:(key,value)=>legacyValues.set(key,value)};
assert(loadCityState(legacyStorage).reputation===45,'legacy migration');
console.log('District 01 state checks passed');
