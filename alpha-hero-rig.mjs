// Shared, opt-in rigged Hero 001 runtime for District 01 and interiors.
// No model is bundled yet: the procedural avatar remains visible until a validated GLB loads.
import {inspectHumanoid} from './alpha-rig-validation.mjs';
export const HERO_ASSET_URL='./assets/characters/hero-001.glb';
export function chooseHeroClip(clips,kind){
 const patterns=kind==='walk'?[/walk/i,/locomotion/i,/run/i]:[/idle/i,/breath/i,/stand/i];
 return patterns.map(re=>clips.find(c=>re.test(c.name||''))).find(Boolean)||null;
}
export function heroAssetCompatible(report){return Boolean(report?.compatibleWithAlteraRig&&report?.skinnedMeshes>0)}
export function validateHeroAssetPath(value){return typeof value==='string'&&/^\.\/assets\/characters\/[a-z0-9-]+\.glb$/.test(value)?value:null}
export async function resolveHeroAssetUrl(fetcher=globalThis.fetch){try{const response=await fetcher('./assets/characters/hero-001.json',{cache:'no-store'});if(!response.ok)return null;const manifest=await response.json();return validateHeroAssetPath(manifest?.url)}catch{return null}}
export async function attachHeroRig(T,character,{url=null,loader=null,onStatus=()=>{}}={}){
 if(url===null)url=await resolveHeroAssetUrl();
 url=validateHeroAssetPath(url);
 if(!url)return null;
 if(!loader){const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');loader=new GLTFLoader()}
 let gltf;
 try{gltf=await loader.loadAsync(url)}catch(error){onStatus('Hero 001 GLB unavailable: procedural fallback');return null}
 const report=inspectHumanoid(gltf.scene,gltf.animations||[]);
 if(!heroAssetCompatible(report)){onStatus('Hero 001 rig incomplete: '+report.missingRequired.join(', '));return null}
 const root=gltf.scene;
 // Normalize the artist-authored model to the current gameplay height (approx. 2.15m).
 const box=new T.Box3().setFromObject(root),size=new T.Vector3();box.getSize(size);
 if(!(size.y>0.2&&size.y<100)){onStatus('Hero 001 has invalid bounds');return null}
 const scale=2.15/size.y;root.scale.multiplyScalar(scale);
 const bounds=new T.Box3().setFromObject(root);
 root.position.y-=bounds.min.y;
 const mixer=new T.AnimationMixer(root),clips=gltf.animations||[];
 const idle=chooseHeroClip(clips,'idle'),walk=chooseHeroClip(clips,'walk');
 if(!idle||!walk){onStatus('Hero 001 requires idle and walk animation clips');return null}
 let active=null;
 function switchTo(clip){if(!clip||clip===active)return;const next=mixer.clipAction(clip);next.reset().fadeIn(.2).play();if(active)mixer.clipAction(active).fadeOut(.2);active=clip}
 character.add(root);
 // Do not remove the gameplay root: camera, collisions and quest targets still use it.
 character.children.forEach(child=>{if(child!==root)child.visible=false});
 onStatus('Hero 001 loaded: '+report.animationNames.join(', '));
 let disposed=false;
 return {report,update(dt,speed){if(disposed)return;switchTo(speed>.18?(walk||idle):(idle||walk));mixer.update(Math.min(Math.max(dt,0),.1))},dispose(){disposed=true;mixer.stopAllAction();character.remove(root);character.children.forEach(child=>child.visible=true);root.traverse(obj=>{if(obj.isMesh){obj.geometry?.dispose();for(const mat of(Array.isArray(obj.material)?obj.material:[obj.material]))mat?.dispose()}})}};
}
