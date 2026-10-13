import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export function setupRiggedAvatar(T,scene,prototype,change){
 const group=new T.Group();scene.add(group);const loader=new GLTFLoader(),clock=new T.Clock();
 let root=null,mixer=null,clips=[],action=null,objectUrl=null,request=0;
 const status=document.getElementById('glbStatus');
 const say=m=>{if(status)status.textContent=m};
 function clear(){
  mixer?.stopAllAction();mixer=null;clips=[];action=null;
  if(root){group.remove(root);root=null}
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}
  prototype.visible=true;
 }
 function play(type){
  if(!mixer||!clips.length){say('Denne GLB-modellen har ingen animasjoner.');return}
  const pattern=type==='walk'?/walk|run|locomotion/i:/idle|stand|breath/i;
  const clip=clips.find(c=>pattern.test(c.name))||clips[type==='walk'?Math.min(1,clips.length-1):0];
  action?.fadeOut(.2);action=mixer.clipAction(clip);action.reset().fadeIn(.2).play();
  say('Animasjon: '+clip.name);
 }
 async function load(url,local=false){
  const ticket=++request;say('Laster rigget GLB …');
  try{
   const gltf=await loader.loadAsync(url);
   if(ticket!==request){if(local)URL.revokeObjectURL(url);return}
   const model=gltf.scene,box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
   if(!Number.isFinite(size.y)||size.y<=0)throw Error('Ugyldig modellstørrelse');
   clear();root=model;const scale=3/size.y;model.scale.setScalar(scale);
   model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
   group.add(model);prototype.visible=false;clips=gltf.animations||[];
   if(clips.length){mixer=new T.AnimationMixer(model);play('idle')}
   if(local)objectUrl=url;
   say('Modell lastet. '+clips.length+' animasjonsklipp. Klær må være kompatible med modellens skjelett.');
  }catch(e){if(local)URL.revokeObjectURL(url);if(ticket===request)say('Kunne ikke laste GLB: '+(e.message||'ukjent feil'))}
 }
 document.getElementById('glbFile').addEventListener('change',e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!/\.glb$/i.test(file.name)||file.size>60*1024*1024){say('Velg en .glb-fil under 60 MB.');return}
  load(URL.createObjectURL(file),true);
 });
 document.getElementById('glbWoman').onclick=()=>{change({gender:'Kvinne'});load('assets/avatar-woman.glb')};
 document.getElementById('glbMan').onclick=()=>{change({gender:'Mann'});load('assets/avatar-man.glb')};
 document.getElementById('glbReset').onclick=()=>{++request;clear();say('Prototypemodellen vises.')};
 document.getElementById('glbWalk').onclick=()=>play('walk');
 document.getElementById('glbIdle').onclick=()=>play('idle');
 return {tick(angle){group.rotation.y=angle;const dt=Math.min(clock.getDelta(),.08);mixer?.update(dt)}};
}