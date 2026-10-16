import test from 'node:test';
import assert from 'node:assert/strict';
import {movementVector} from '../alpha-movement.mjs';
test('up advances forward',()=>{assert.equal(movementVector(false,false,true,false).z,-1)});
test('down reverses',()=>{assert.equal(movementVector(false,false,false,true).z,1)});
test('diagonal is normalized',()=>{const v=movementVector(false,true,true,false);assert.ok(Math.abs(Math.hypot(v.x,v.z)-1)<0.00001)});
