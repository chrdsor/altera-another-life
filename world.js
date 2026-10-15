import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import RAPIER from 'rapier';

const $=id=>document.getElementById(id),mobile=matchMedia('(max-width:760px)').matches;
const defaults={gender:'Kvinne',body:1,muscle:0,faceSoftness:.55,eyeSize:.5,noseWidth:.5,lipFullness:.55,hairStyle:'Oppsatt',skin:'#d79b76',eye:'#416b86',hair:'#a96f4f',top:'Crop top',topColor:'#141318',bottom:'Cargo',bottomColor:'#28262d',shoes:'Sneakers'};
let avatarState={...defaults};try{const saved=localStorage.getItem('altera-avatar-reference-v3')||localStorage.getItem('altera-avatar-reference-v2');avatarState={...defaults,...JSON.parse(saved||'{}')}}catch{}
let renderer,scene,camera,physics,body,collider,controller,player,mixer,activeAction,avatarReady=false,nearSpot=false,lightMode=false,cameraYaw=0,cameraSide=1,run=false,toastTimer,last=performance.now();
const keys=new Set(),stick={x:0,y:0},clock=new T.Clock(),cameraTarget=new T.Vector3(),desiredCamera=new T.Vector3(),move=new T.Vector3(),forward=new T.Vector3(),right=new T.Vector3();
const interactiveSpot=new T.Vector3(-4.1,0,-3.4),pinkLights=[];

boot().catch(error=>{$('loadingDetail').textContent='Kunne ikke starte verden: '+(error?.message||'ukjent feil');$('loading').querySelector('span').hidden=true});

async function boot(){
  $('loadingDetail').textContent='Starter Rapier-fysikk';await RAPIER.init();
  setupRenderer();physics=new RAPIER.World({x:0,y:-9.81,z:0});buildWorld();setupPlayerPhysics();setupInput();
  $('loadingDetail').textContent='Laster den lagrede avataren din';await loadAvatar();$('loading').hidden=true;requestAnimationFrame(frame);
}

function setupRenderer(){
  scene=new T.Scene();scene.background=new T.Color(0x07070d);scene.fog=new T.FogExp2(0x090711,.026);camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.08,90);
  renderer=new T.WebGLRenderer({canvas:$('world'),antialias:!mobile,powerPreference:'high-performance',preserveDrawingBuffer:false});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.15:1.55));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.03).texture;room.dispose();pmrem.dispose();
  scene.add(new T.HemisphereLight(0xb5b6d4,0x120b18,.55));const key=new T.SpotLight(0xffc7a3,72,18,.62,.65,1.2);key.position.set(-1,6,4);key.target.position.set(0,1,0);key.castShadow=true;key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);scene.add(key,key.target);const windowFill=new T.DirectionalLight(0x738dff,1.15);windowFill.position.set(4,3,-4);scene.add(windowFill);
}

function buildWorld(){
  const floorMat=new T.MeshStandardMaterial({color:0x161218,roughness:.25,metalness:.12});addBox('Gulv',[18,.16,14],[0,-.08,0],floorMat,true);
  const wallMat=new T.MeshStandardMaterial({color:0x110d15,roughness:.78});addBox('Bakvegg',[18,5,.18],[0,2.5,-7],wallMat,true);addBox('Venstre vegg',[.18,5,14],[-9,2.5,0],wallMat,true);addBox('Høyre vegg',[.18,5,14],[9,2.5,0],wallMat,true);
  const glass=new T.MeshPhysicalMaterial({color:0x11182d,roughness:.16,metalness:.5,transmission:.08,transparent:true,opacity:.87});
  for(let x=-7.6;x<8;x+=2.55){addBox('Vindu',[2.3,3.8,.08],[x,2.75,-6.86],glass,false);addBox('Ramme',[.06,4,.12],[x+1.22,2.75,-6.79],new T.MeshStandardMaterial({color:0x19151e,metalness:.6,roughness:.35}),false)}
  buildCity();buildFurniture();buildDJ();buildPortal();
  addPointLight(0xf350e5,13,8,[-4.1,2.2,-3.4]);addPointLight(0xff945e,9,7,[3.9,1.8,-3.5]);addPointLight(0x775bff,11,8,[0,2,-6]);
}
function addBox(name,size,pos,material,solid=false){const mesh=new T.Mesh(new T.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...pos);mesh.castShadow=size[1]<3;mesh.receiveShadow=true;scene.add(mesh);if(solid){const desc=RAPIER.ColliderDesc.cuboid(size[0]/2,size[1]/2,size[2]/2).setTranslation(...pos);physics.createCollider(desc)}return mesh}
function addPointLight(color,intensity,distance,pos){const light=new T.PointLight(color,intensity,distance,2);light.position.set(...pos);scene.add(light);pinkLights.push(light);return light}
function buildCity(){const group=new T.Group(),buildingMat=new T.MeshStandardMaterial({color:0x090b17,roughness:.8});for(let i=0;i<18;i++){const h=1.3+(i%5)*.5,b=new T.Mesh(new T.BoxGeometry(.55,h,.4),buildingMat);b.position.set(-8+i*.92,h/2+.15,-7.4);group.add(b);for(let y=.4;y<h;y+=.32){if((i+Math.round(y*10))%3){const win=new T.Mesh(new T.PlaneGeometry(.055,.035),new T.MeshBasicMaterial({color:(i+y*10)%2?0xd168cc:0xe1a47d,toneMapped:false}));win.position.set(b.position.x+(i%2?.13:-.13),y,-7.18);group.add(win)}}}scene.add(group)}
function buildFurniture(){const sofaMat=new T.MeshStandardMaterial({color:0x29212d,roughness:.94}),metal=new T.MeshStandardMaterial({color:0x1a171d,roughness:.26,metalness:.7}),rug=new T.MeshStandardMaterial({color:0x2f1729,roughness:.88});addBox('Teppe',[6,.025,4],[1,.02,-.6],rug,false);for(const z of[-1.75,1.35]){addBox('Sofa',[4,.45,.9],[2,.28,z],sofaMat,true);addBox('Sofarygg',[4,.75,.28],[2,.78,z+(z<0?-.38:.38)],sofaMat,true)}addBox('Bord',[2.5,.24,1.25],[1.1,.42,-.2],new T.MeshStandardMaterial({color:0x271c21,roughness:.35}),true);addBox('Bordfot',[.18,.7,.18],[1.1,.18,-.2],metal,true);for(const p of[[-6,.32,2.4],[-4.7,.32,3.2],[5.8,.32,2.7]]){addBox('Lenestol',[1.1,.55,1.1],p,sofaMat,true)}for(const p of[[-7.5,.75,-4.8],[7.3,.75,4.8]]){const pot=new T.Mesh(new T.CylinderGeometry(.34,.26,.55,16),new T.MeshStandardMaterial({color:0x21151a,roughness:.72}));pot.position.set(...p);pot.castShadow=true;scene.add(pot)}}
function buildDJ(){const dark=new T.MeshStandardMaterial({color:0x111016,roughness:.32,metalness:.5});addBox('DJ-bord',[3.2,1.15,.8],[6.6,.58,-4.9],dark,true);const strip=addBox('DJ-neon',[3,.035,.035],[6.6,1.03,-4.48],new T.MeshBasicMaterial({color:0xec59e4,toneMapped:false}),false);pinkLights.push(strip)}
function buildPortal(){const mat=new T.MeshBasicMaterial({color:0xee57df,toneMapped:false}),left=addBox('Portal',[.08,2.9,.08],[-4.95,1.45,-4.65],mat,false),right=addBox('Portal',[.08,2.9,.08],[-3.25,1.45,-4.65],mat,false),top=addBox('Portal',[1.78,.08,.08],[-4.1,2.9,-4.65],mat,false);pinkLights.push(left,right,top)}
function setupPlayerPhysics(){body=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,.84,3.8));collider=physics.createCollider(RAPIER.ColliderDesc.capsule(.54,.28),body);controller=physics.createCharacterController(.025);controller.enableAutostep(.24,.18,true);controller.enableSnapToGround(.18);controller.setMaxSlopeClimbAngle(Math.PI*.25)}

async function loadAvatar(){const gltf=await new GLTFLoader().loadAsync('assets/characters/mpfb-builder-v1/avatar.glb?v=3'),model=gltf.scene,bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1.72/size.y;player=new T.Group();model.scale.setScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);player.add(model);scene.add(player);applyAvatar(model,avatarState);mixer=new T.AnimationMixer(model);const clips=gltf.animations||[],idle=clips.find(c=>/idle|stand|breath/i.test(c.name))||clips[0],walk=clips.find(c=>/walk|locomotion/i.test(c.name))||clips[Math.min(1,clips.length-1)];player.userData.actions={idle:idle?mixer.clipAction(idle):null,walk:walk?mixer.clipAction(walk):null};setAnimation('idle');avatarReady=true}
function applyAvatar(root,state){
  const slots={skin:[],eyes:[],hair:[],top:[],bottom:[],shoes:[]};
  const patterns={skin:/^ALTERA_body(?:\s|$)|^base(?:\s|$)|skin/i,eyes:/iris|eyeball|eye_color/i,hair:/hair|fringe|bangs|bun|braid|ponytail/i,top:/top|crop|shirt|hoodie|sweater|upper|torso_cloth/i,bottom:/pants|cargo|trousers|jeans|shorts|lower_cloth/i,shoes:/shoe|sneaker|boot|footwear/i};
  root.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    const label=object.name+' '+materials.map(material=>material?.name||'').join(' ');
    const declared=object.userData?.alteraSlot;
    const slot=declared&&slots[declared]?declared:Object.keys(patterns).find(key=>patterns[key].test(label));
    if(slot)slots[slot].push(object);
    for(const material of materials){
      if(!material)continue;
      const skinMaterial=patterns.skin.test(label),eyeSurface=/eye|cornea|iris/i.test(label);
      material.envMapIntensity=skinMaterial ? .72 : eyeSurface ? 1.15 : .9;
      if(material.map){material.map.colorSpace=T.SRGBColorSpace;material.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())}
      if(skinMaterial){material.roughness=Math.max(.46,material.roughness??.5);material.metalness=0}
      else if(eyeSurface){material.roughness=.12}
      else if(patterns.hair.test(label)){material.roughness=.48;material.alphaTest=Math.max(.18,material.alphaTest||0);material.side=T.DoubleSide}
      else if(/cloth|shirt|cargo|pants/i.test(label)){material.roughness=Math.max(.7,material.roughness??.75)}
    }
  });
  const colors={skin:state.skin,eyes:state.eye,hair:state.hair,top:state.topColor,bottom:state.bottomColor};
  for(const[slot,color]of Object.entries(colors)){
    const selected=new T.Color(color);
    const tint=slot==='skin'?new T.Color(0xffffff).lerp(selected,.38):slot==='hair'?new T.Color(0xffffff).lerp(selected,.72):selected;
    for(const mesh of slots[slot])for(const material of(Array.isArray(mesh.material)?mesh.material:[mesh.material]))material.color?.copy(tint);
  }
  const variants={hair:{Oppsatt:'bun',Kort:'short'},top:{'Crop top':'crop','T-skjorte':'tshirt','Langermet':'long'},bottom:{Cargo:'cargo',Jeans:'jeans',Shorts:'shorts'},shoes:{Sneakers:'sneakers',Skinnsko:'leather'}};
  for(const slot of['hair','top','bottom','shoes'])for(const mesh of slots[slot]){const id=mesh.userData.alteraVariant||mesh.name.split('_').slice(1).join('_');mesh.visible=id===variants[slot][state[slot==='hair'?'hairStyle':slot]]}
  const morph=(names,value)=>root.traverse(object=>{if(!object.morphTargetDictionary)return;for(const name of names){const index=object.morphTargetDictionary[name];if(index!==undefined){object.morphTargetInfluences[index]=T.MathUtils.clamp(value,0,1);break}}});
  morph(['BodySlim'],Math.max(0,(1-state.body)/.18));morph(['BodyWide'],Math.max(0,(state.body-1)/.2));morph(['BodyMuscular'],state.muscle||0);morph(['GenderFemale'],state.gender==='Kvinne'?1:0);morph(['FaceSoft','FaceSoftness'],state.faceSoftness);morph(['EyeSize','EyesSize'],state.eyeSize);morph(['NoseWide','NoseWidth'],state.noseWidth);morph(['LipFull','LipFullness'],state.lipFullness);
}
function setAnimation(name){const next=player?.userData.actions?.[name];if(!next||next===activeAction)return;activeAction?.fadeOut(.18);next.reset().fadeIn(.18).play();activeAction=next}

function setupInput(){addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE')interact()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)});let dragging=false,lastX=0;$('world').addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX});addEventListener('pointerup',()=>dragging=false);addEventListener('pointermove',e=>{if(dragging){cameraYaw-=Math.max(-35,Math.min(35,e.clientX-lastX))*.006;lastX=e.clientX}});const joy=$('joystick'),knob=joy.querySelector('span');let joyId=null;const joyMove=e=>{const r=joy.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),len=Math.hypot(x,y),max=r.width*.34,s=Math.min(1,max/(len||1)),cx=x*s,cy=y*s;stick.x=cx/max;stick.y=cy/max;knob.style.transform=`translate(${cx}px,${cy}px)`};joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e)});const joyEnd=e=>{if(e.pointerId!==joyId)return;joyId=null;stick.x=stick.y=0;knob.style.transform=''};joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);$('mobileAction').onclick=interact;$('settings').onclick=toggleSettings;$('closeSettings').onclick=toggleSettings;$('exit').onclick=()=>location.href='avatar-studio.html';$('cameraSide').onclick=()=>cameraSide*=-1;$('walkToggle').onclick=()=>{run=!run;note(run?'Rask gange':'Rolig gange')};$('wave').onclick=()=>note('Hei! En egen emote-animasjon legges til i neste karakterasset.');$('photo').onclick=capture;$('quality').onchange=e=>setQuality(e.target.value)}
function toggleSettings(){$('settingsPanel').hidden=!$('settingsPanel').hidden;$('settings').setAttribute('aria-expanded',String(!$('settingsPanel').hidden))}
function setQuality(value){const ratio=value==='mobile'?1:value==='high'?Math.min(devicePixelRatio,1.7):Math.min(devicePixelRatio,mobile?1.15:1.55);renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight,false);note('Grafikk: '+$('quality').selectedOptions[0].textContent)}
function note(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2400)}
function interact(){if(!nearSpot)return;if(!lightMode){lightMode=true;$('objective').textContent='Neonlys aktivert · utforsk loungen';$('locationName').textContent='Neon Mode';note('ALTERA-lyset er aktivert')}else{lightMode=false;$('locationName').textContent='Night Lounge';note('Rolig lysmodus')}}
function capture(){renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob){note('Kunne ikke lage bilde');return}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ALTERA-night-lounge.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);note('Skjermbildet er lagret')},'image/png')}

function updatePlayer(dt){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x,z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+stick.y;const len=Math.hypot(x,z);if(len>1){x/=len;z/=len}forward.set(-Math.sin(cameraYaw),0,-Math.cos(cameraYaw));right.set(Math.cos(cameraYaw),0,-Math.sin(cameraYaw));move.copy(right).multiplyScalar(x).addScaledVector(forward,-z);const moving=move.lengthSq()>.01,speed=run?3.2:2.05;if(moving)move.normalize().multiplyScalar(speed*dt);move.y=-.08;controller.computeColliderMovement(collider,{x:move.x,y:move.y,z:move.z});const corrected=controller.computedMovement(),p=body.translation();body.setNextKinematicTranslation({x:p.x+corrected.x,y:p.y+corrected.y,z:p.z+corrected.z});physics.step();const next=body.translation();if(player){player.position.set(next.x,next.y-.84,next.z);if(moving){const angle=Math.atan2(move.x,move.z);player.rotation.y=lerpAngle(player.rotation.y,angle,1-Math.exp(-dt*11))}setAnimation(moving?'walk':'idle')}const dx=next.x-interactiveSpot.x,dz=next.z-interactiveSpot.z;nearSpot=dx*dx+dz*dz<2.4;$('interaction').hidden=!nearSpot;$('mobileAction').hidden=!nearSpot}
function updateCamera(dt){const p=body.translation();cameraTarget.set(p.x,p.y+.55,p.z);const distance=4.25,height=2.35;desiredCamera.set(p.x+Math.sin(cameraYaw)*distance+Math.cos(cameraYaw)*cameraSide*.48,p.y+height,p.z+Math.cos(cameraYaw)*distance-Math.sin(cameraYaw)*cameraSide*.48);const smooth=$('reduceMotion').checked?1:1-Math.exp(-dt*7);camera.position.lerp(desiredCamera,smooth);camera.lookAt(cameraTarget)}
function lerpAngle(a,b,t){const d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*t}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;updatePlayer(dt);updateCamera(dt);mixer?.update(dt);if(lightMode){const pulse=.8+Math.sin(now*.004)*.24;for(const item of pinkLights){if(item.isLight)item.intensity=10*pulse;else if(item.material)item.material.color.setHSL(.84+Math.sin(now*.0004)*.05,.78,.58)}}renderer.render(scene,camera);requestAnimationFrame(frame)}
