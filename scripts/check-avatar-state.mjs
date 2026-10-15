import assert from 'node:assert/strict';
import {AVATAR_STATE_KEY,DEFAULT_AVATAR_STATE,loadAvatarState,normalizeAvatarState,saveAvatarState} from '../avatar-state.js';

const hostile=normalizeAvatarState({
  body:99,muscle:-2,eyeSize:'0.7',gender:'Robot',top:'Usynlig',skin:'red',eye:'#ABCDEF',modelMode:'external'
});
assert.equal(hostile.body,1.2);
assert.equal(hostile.muscle,0);
assert.equal(hostile.eyeSize,.7);
assert.equal(hostile.gender,DEFAULT_AVATAR_STATE.gender);
assert.equal(hostile.top,DEFAULT_AVATAR_STATE.top);
assert.equal(hostile.skin,DEFAULT_AVATAR_STATE.skin);
assert.equal(hostile.eye,'#abcdef');
assert.equal(hostile.modelMode,'builder');

const values=new Map();
const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
const saved=saveAvatarState({...DEFAULT_AVATAR_STATE,body:.91,hairStyle:'Kort'},storage);
assert.equal(saved.body,.91);
assert.equal(values.has(AVATAR_STATE_KEY),true);
assert.deepEqual(loadAvatarState(storage),saved);

values.set(AVATAR_STATE_KEY,'not-json');
assert.deepEqual(loadAvatarState(storage),DEFAULT_AVATAR_STATE);

console.log('Avatar state passed: invalid storage is repaired, values are clamped, and save/load round-trips.');
