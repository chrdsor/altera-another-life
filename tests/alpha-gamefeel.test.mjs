import test from 'node:test';import assert from 'node:assert/strict';
import {damp,stepMotion,cameraDistanceFromWalls} from '../alpha-gamefeel.mjs';
test('motion starts smoothly, slows down and normalizes diagonal input',()=>{
 const first=stepMotion(0,0,1,1,.016);
 assert.ok(Math.hypot(first.x,first.z)>0&&Math.hypot(first.x,first.z)<3.5);
 const stopping=stepMotion(first.x,first.z,0,0,.016);
 assert.ok(Math.hypot(stopping.x,stopping.z)<Math.hypot(first.x,first.z));
 assert.ok(damp(0,10,5,0)===0);
});
test('camera retracts behind walls but stays clear on open ground',()=>{
 const origin={x:0,z:0},desired={x:0,z:5};
 assert.equal(cameraDistanceFromWalls(origin,desired,[]),1);
 const fraction=cameraDistanceFromWalls(origin,desired,[{x:0,z:3,w:2,d:1}]);
 assert.ok(fraction<.8&&fraction>.2);
 assert.equal(cameraDistanceFromWalls(origin,desired,[{x:5,z:3,w:2,d:1}]),1);
});
