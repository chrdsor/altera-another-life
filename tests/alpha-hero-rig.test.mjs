import test from 'node:test';import assert from 'node:assert/strict';
import {chooseHeroClip,heroAssetCompatible,attachHeroRig,validateHeroAssetPath,resolveHeroAssetUrl} from '../alpha-hero-rig.mjs';
import {inspectHumanoid} from '../alpha-rig-validation.mjs';
test('rigged Hero 001 requires a complete humanoid skeleton',()=>{
 const bones=['Hips','Spine','Head','LeftUpperArm','RightUpperArm','LeftUpperLeg','RightUpperLeg'];
 const scene={traverse(cb){for(const name of bones)cb({isBone:true,name});cb({isSkinnedMesh:true})}};
 const report=inspectHumanoid(scene,[{name:'Idle'},{name:'Walk'}]);
 assert.equal(heroAssetCompatible(report),true);
 assert.equal(report.skinnedMeshes,1);
 assert.deepEqual(report.missingRequired,[]);
 assert.equal(heroAssetCompatible(inspectHumanoid({traverse(cb){cb({isBone:true,name:'Hips'})}})),false);
});
test('animation selection prefers named idle and walking clips',()=>{
 const clips=[{name:'IdleBreathing'},{name:'WalkForward'},{name:'Wave'}];
 assert.equal(chooseHeroClip(clips,'walk'),clips[1]);
 assert.equal(chooseHeroClip(clips,'idle'),clips[0]);
});
test('missing configured model keeps procedural avatar without loading',async()=>{
 const result=await attachHeroRig(null,null);
 assert.equal(result,null);
});

test('Hero asset manifest accepts only local character GLB files',async()=>{
 assert.equal(validateHeroAssetPath('./assets/characters/hero-001.glb'),'./assets/characters/hero-001.glb');
 assert.equal(validateHeroAssetPath('https://evil.example/hero.glb'),null);
 assert.equal(validateHeroAssetPath('./assets/characters/../secret.glb'),null);
 assert.equal(await resolveHeroAssetUrl(async()=>({ok:true,json:async()=>({url:'./assets/characters/hero-001.glb'})})),'./assets/characters/hero-001.glb');
 assert.equal(await resolveHeroAssetUrl(async()=>({ok:false})),null);
});
