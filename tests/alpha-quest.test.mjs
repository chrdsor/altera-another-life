import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceQuest,normalizeQuest,questObjective,QUEST_REWARD} from '../alpha-quest.mjs';
test('starts safely from missing and corrupt data',()=>{
 assert.equal(normalizeQuest(null).step,'meet');
 assert.equal(normalizeQuest({step:'hacked',reward:'cash'}).step,'meet');
 assert.equal(normalizeQuest({step:'complete',reward:'cash'}).reward,null);
});
test('quest requires correct ordered interactions',()=>{
 let q=normalizeQuest(null);
 assert.equal(advanceQuest(q,'visit_quay').changed,false);
 q=advanceQuest(q,'talk_cafe').state;
 assert.equal(q.step,'visit');
 assert.equal(advanceQuest(q,'talk_cafe').changed,false);
 q=advanceQuest(q,'visit_quay').state;
 assert.equal(q.step,'return');
 q=advanceQuest(q,'talk_cafe').state;
 assert.deepEqual(q,{version:1,step:'complete',reward:QUEST_REWARD});
 assert.equal(advanceQuest(q,'talk_cafe').changed,false);
 assert.match(questObjective(q),/fullført/);
});
test('reward cannot be issued twice',()=>{
 let q={step:'return'};
 q=advanceQuest(q,'talk_cafe').state;
 const again=advanceQuest(q,'talk_cafe');
 assert.equal(again.changed,false);
 assert.deepEqual(again.state,q);
});
