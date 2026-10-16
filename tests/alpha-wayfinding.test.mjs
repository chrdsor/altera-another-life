import test from 'node:test';
import assert from 'node:assert/strict';
import {districtPlaces,mapPoint,destinationForQuest,distanceToPlace,walkingRoute} from '../alpha-wayfinding.mjs';
test('all four locations have distinct coordinates',()=>{assert.equal(districtPlaces.length,4);assert.equal(new Set(districtPlaces.map(p=>p.x+','+p.z)).size,4)});
test('quest destination follows progression',()=>{assert.equal(destinationForQuest('meet'),'cafe');assert.equal(destinationForQuest('visit'),'quay');assert.equal(destinationForQuest('return'),'cafe');assert.equal(destinationForQuest('complete'),'home')});
test('player and map positions stay inside map',()=>{for(const p of districtPlaces){const m=mapPoint(p.x,p.z);assert.ok(m.x>=0&&m.x<=200);assert.ok(m.y>=0&&m.y<=250)}});
test('distance is zero at destination',()=>{assert.equal(distanceToPlace({x:-5,z:-12},districtPlaces[0]),0)});

test('all named destinations have street addresses',()=>{for(const p of districtPlaces)assert.match(p.address,/Havneveien [0-9]+/)});
test('walking route begins at player and ends at destination',()=>{const a={x:0,z:4},b=districtPlaces[0],route=walkingRoute(a,b);assert.deepEqual(route[0],a);assert.deepEqual(route.at(-1),{x:b.x,z:b.z})});
