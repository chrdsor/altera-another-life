#!/usr/bin/env node
// ALTERA character quality gate. Node 20+, no dependencies.
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'assets/characters/hero-001/character.json'),'utf8'));
const errors=[];
function check(ok,msg){if(!ok)errors.push(msg)}
check(manifest.id==='altera-hero-001','Unexpected character ID');
check(manifest.model.skeleton==='ALTERA-Humanoid-v1','Skeleton mismatch');
check(manifest.technical.lod.length>=2,'Both mobile and desktop LOD targets required');
check(manifest.acceptance.length>=5,'Acceptance criteria missing');
const modelPath=path.join(base,manifest.model.uri);
const exists=fs.existsSync(modelPath);
if(exists){
 const buf=fs.readFileSync(modelPath);
 check(buf.length>=20,'GLB too small');
 check(buf.toString('ascii',0,4)==='glTF','Invalid GLB header');
 check(buf.readUInt32LE(4)===2,'GLB version must be 2');
 check(buf.readUInt32LE(8)===buf.length,'GLB declared length differs from file size');
}
console.log(JSON.stringify({character:manifest.id,manifestValid:errors.length===0,modelAvailable:exists,modelStatus:exists?'found; visual and rigging review still required':'awaiting real licensed GLB',errors},null,2));
if(errors.length)process.exitCode=1;
