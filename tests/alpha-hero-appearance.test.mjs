import test from 'node:test';
import assert from 'node:assert/strict';
import {appearanceSlot,applyHeroAppearance} from '../alpha-hero-appearance.mjs';
test('Hero 001 only recognizes explicitly named semantic materials',()=>{
 assert.equal(appearanceSlot('Skin'),'skin');
 assert.equal(appearanceSlot('Top_Material'),'coat');
 assert.equal(appearanceSlot('Bottom'),'bottom');
 assert.equal(appearanceSlot('Eyes'),'eye');
 assert.equal(appearanceSlot('Wall'),'null'.replace('null','')||null);
});
test('appearance colors are applied to cloned materials without changing shared originals',()=>{
 const original={name:'Top',color:{setHex(){}},clone(){return {name:'Top',color:{setHex(hex){this.value=hex}}}}};
 const unknown={name:'JacketDetail',color:{setHex(){}},clone(){throw Error('unknown must not be cloned')}};
 const mesh={isMesh:true,material:[original,unknown]};
 const root={traverse(callback){callback(mesh)}};
 const count=applyHeroAppearance(root,{coat:0x425a76});
 assert.equal(count,1);
 assert.equal(mesh.material[0].color.value,0x425a76);
 assert.equal(mesh.material[1],unknown);
 assert.equal(mesh.material[0]===original,false);
});
