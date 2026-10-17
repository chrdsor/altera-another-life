const REQUIRED=['hips','spine','head','leftupperarm','rightupperarm','leftupperleg','rightupperleg'];
const normalize=name=>String(name||'').toLowerCase().replace(/^.*:/,'').replace(/^mixamorig/,'').replace(/[^a-z0-9]/g,'');
const aliases={pelvis:'hips',spine01:'spine',upperarml:'leftupperarm',upperarmr:'rightupperarm',thighl:'leftupperleg',thighr:'rightupperleg'};
export function inspectHumanoid(scene,animations=[]){
 const bones=new Set();let skinnedMeshes=0;
 scene.traverse(obj=>{if(obj.isBone)bones.add(aliases[normalize(obj.name)]||normalize(obj.name));if(obj.isSkinnedMesh)skinnedMeshes++});
 const missingRequired=REQUIRED.filter(name=>!bones.has(name));
 return {compatibleWithAlteraRig:skinnedMeshes>0&&!missingRequired.length,skinnedMeshes,missingRequired,animationNames:animations.map(clip=>clip.name)};
}
