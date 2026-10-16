import test from 'node:test';import assert from 'node:assert/strict';import {readPostcardPlacement,placePostcard} from '../alpha-home-demo.mjs';
test('postcard cannot be placed before reward',()=>{assert.equal(placePostcard(false,false),false);assert.equal(readPostcardPlacement('{"postcard":true}',false),false)});
test('unlocked postcard placement persists safely',()=>{assert.equal(placePostcard(true,false),true);assert.equal(readPostcardPlacement('{"postcard":true}',true),true);assert.equal(readPostcardPlacement('invalid',true),false)});
