import test from 'node:test';
import assert from 'node:assert/strict';
import {districtPlaces,mapPoint,destinationForQuest,distanceToPlace} from '../alpha-wayfinding.mjs';
test('all four locations have distinct coordinates',()=>{assert.equal(districtPlaces.length,4);assert.equal(new Set(districtPlaces.map(p=>p.x+','+p.z)).size,4)});
test('quest destination follows progression',()=>{assert.equal(destinationForQuest('meet'),'cafe');assert.equal(destinationForQuest('visit'),'quay');assert.equal(destinationForQuest('return'),'cafe');assert.equal(destinationForQuest('complete'),'home')});
test('player and map positions stay inside map',()=>{for(const p of districtPlaces){const m=mapPoint(p.x,p.z);assert.ok(m.x>=0&&m.x<=200);assert.ok(m.y>=0&&m.y<=250)}});
test('distance is zero at destination',()=>{assert.equal(distanceToPlace({x:-5,z:-12},districtPlaces[0]),0)});
