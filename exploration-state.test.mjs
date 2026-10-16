import assert from 'node:assert/strict';
import {AREAS,POIS,emptyExploration,normalizeExploration,visitArea,discoverPoi,readExploration,writeExploration,EXPLORATION_KEY} from './exploration-state.js';
let state=emptyExploration();assert.equal(AREAS.length,4);
for(const area of AREAS){state=visitArea(state,area);for(const poi of POIS[area])state=discoverPoi(state,area,poi.id)}
assert.equal(state.visitedAreas.length,4);assert.equal(state.discovered.length,8);
state=discoverPoi(state,'coast_01','marina');assert.equal(state.discovered.length,8);
assert.throws(()=>visitArea(state,'invalid'));assert.throws(()=>discoverPoi(state,'city_01','fake'));
const normalized=normalizeExploration({currentArea:'coast_01',visitedAreas:['coast_01','coast_01','bad'],discovered:['coast_01:marina','bad']});
assert.deepEqual(normalized.visitedAreas,['coast_01']);assert.deepEqual(normalized.discovered,['coast_01:marina']);
const map=new Map();const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
writeExploration(storage,state);assert.equal(readExploration(storage).discovered.length,8);
map.set(EXPLORATION_KEY,'broken');assert.equal(readExploration(storage).discovered.length,0);
console.log('Exploration journal checks passed');
