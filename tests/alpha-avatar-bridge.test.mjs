import test from 'node:test';import assert from 'node:assert/strict';
import {playerAppearance} from '../alpha-avatar-bridge.mjs';
test('District 01 translates saved studio appearance to character colors',()=>{
 const storage={getItem(key){return key==='altera-avatar-reference-v3'?JSON.stringify({skin:'#f1c5a7',hair:'#21191b',eye:'#416b86',topColor:'#485e72',bottomColor:'#81766e',hairStyle:'Oppsatt',body:1.1,shoes:'Skinnsko'}):null}};
 const avatar=playerAppearance(storage);
 assert.equal(avatar.skin,0xf1c5a7);assert.equal(avatar.coat,0x485e72);assert.equal(avatar.bottom,0x81766e);assert.equal(avatar.style,'long');assert.equal(avatar.body,1.1);assert.equal(avatar.shoes,0x332b28);
});
test('District 01 tolerates malformed local appearance data',()=>{
 const avatar=playerAppearance({getItem:()=>'{invalid'});
 assert.equal(typeof avatar.coat,'number');assert.equal(typeof avatar.skin,'number');
});
