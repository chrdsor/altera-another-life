import * as T from 'three';
import {movementVector,nearestTarget} from './alpha-movement.mjs';
import {normalizeQuest,advanceQuest,questObjective,questDialogue,QUEST_REWARD} from './alpha-quest.mjs';
import {readPostcardPlacement,placePostcard} from './alpha-home-demo.mjs';
const $=id=>document.getElementById(id),room=new URLSearchParams(location.search).get('room')==='home'?'home':'cafe',questKey='altera-alpha-demo-quest-v1',homeKey='altera-alpha-demo-home-v1';
let quest;try{quest=normalizeQuest(JSON.parse(localStorage.getItem(questKey)||'null'))}catch{quest=normalizeQuest(null)}
const unlocked=()=>quest.reward===QUEST_REWARD;
const fallbackPage=room==='cafe'?'alpha-cafe.html':'alpha-home.html';
let placed=readPostcardPlacement(localStorage.getItem(homeKey),unlocked());
$('title').textContent=room==='cafe'?'ALTERA · Kafé Varm':'ALTERA · Din første leilighet';
let scene,camera,renderer,avatar,yaw=0,near=null,last=performance.now(),drag=false,dragX=0;const keys=new Set(),solids=[],targets=[];
const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.86});
function block(w,h,d,x,y,z,color,solid=false){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);scene.add(m);if(solid)solids.push({x,z,w,d});return m}
function target(id,x,z,label){targets.push({id,x,z,label})}
function build(){
 scene=new T.Scene();scene.background=new T.Color(room==='cafe'?0x78685d:0xa6a7a0);
 camera=new T.PerspectiveCamera(66,innerWidth/innerHeight,.1,70);
 renderer=new T.WebGLRenderer({antialias:false,powerPreference:'default'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setSize(innerWidth,innerHeight);document.body.prepend(renderer.domElement);
 scene.add(new T.HemisphereLight(0xe9f0ff,0x65594b,2.1));const sun=new T.DirectionalLight(0xffe6bd,2.1);sun.position.set(-3,7,-3);scene.add(sun);
 const w=11,d=13;block(w,.18,d,0,-.12,0,room==='cafe'?0x896a54:0xa78b73);
 block(w,4,.24,0,2,-6.5,room==='cafe'?0xb49a83:0xd0c6b6);block(.24,4,d,-5.5,2,0,0xb5a18e);block(.24,4,d,5.5,2,0,0xb5a18e);
 // Distinct entrance, windows and soft lamps.
 block(2.6,2,.08,-2.5,2.15,-6.33,0x91bbc6);block(.08,2,.12,-2.5,2.15,-6.25,0xf5eee3);
 for(const x of [-3.6,3.6]){block(.14,2,.14,x,2,-4.7,0x6b5547);block(.55,.16,.55,x,3,-4.7,0xffdfa0)}
 if(room==='cafe'){
 block(4,1.25,1.15,2.5,.65,-3.5,0x6d4833,true);block(2,.18,1.3,-2.5,.8,-2,0x644736,true);
 for(const x of [-3.3,-1.7])block(.65,.48,.65,x,.3,-.8,0x8d7058,true);
 const maja=new T.Group();const coat=new T.Mesh(new T.CapsuleGeometry(.27,.8,6,10),mat(0x9e695b));coat.position.y=1.05;const face=new T.Mesh(new T.SphereGeometry(.21,12,10),mat(0xe1ae8f));face.position.y=1.84;maja.add(coat,face);maja.position.set(2,0,-2.45);scene.add(maja);target('maja',2,-1.2,'Snakk med Maja');
 }else{
 block(3,.65,1.35,-2.8,.35,-3.1,0x617985,true);block(2.4,.17,1.4,2,.7,-1.2,0x6e4c3d,true);
 const frame=block(1.65,1.25,.14,2.8,2.25,-6.28,placed?0xbfd1d6:0x625b54);
 frame.userData.postcard=true;target('postcard',2.8,-4.9,'Heng opp havnepostkort');
 }
 avatar=new T.Group();const body=new T.Mesh(new T.CapsuleGeometry(.25,.7,6,10),mat(0x395c70));body.position.y=1;const head=new T.Mesh(new T.SphereGeometry(.2,12,10),mat(0xe1b291));head.position.y=1.73;avatar.add(body,head);avatar.position.set(0,0,4);scene.add(avatar);
 target('exit',0,5.2,'Gå ut til District 01');
}
function pass(x,z){return x>-5&&x<5&&z>-5.8&&z<5.7&&!solids.some(o=>Math.abs(x-o.x)<o.w/2+.35&&Math.abs(z-o.z)<o.d/2+.35)}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(error){console.warn('Local demo save failed',error)}}
function interact(){
 if(!near)return;
 if(near.id==='exit'){location.href='alpha.html';return}
 if(near.id==='maja'){const previous=quest.step;const next=advanceQuest(quest,'talk_cafe');quest=next.state;if(next.changed)save(questKey,quest);$('dialogue').textContent=previous==='meet'?'Maja: Velkommen til District 01! Kan du besøke Nordkaien og komme tilbake?':previous==='return'?'Maja: Tusen takk! Du har fått et havnepostkort. Heng det opp hjemme!':questDialogue(quest)}
 if(near.id==='postcard'){if(!unlocked()){$('dialogue').textContent='Fullfør Majas velkomstoppdrag først.';return}placed=placePostcard(true,placed);save(homeKey,{postcard:placed});scene.children.filter(o=>o.userData?.postcard).forEach(o=>o.material.color.setHex(0xbfd1d6));$('dialogue').textContent='Havnepostkortet er hengt opp og lagret i denne nettleseren.'}
}
function tick(now){const dt=Math.min((now-last)/1000,.05);last=now;const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));const len=Math.hypot(x,z);
 if(len){const direction=movementVector(keys.has('KeyA')||keys.has('ArrowLeft'),keys.has('KeyD')||keys.has('ArrowRight'),keys.has('KeyW')||keys.has('ArrowUp'),keys.has('KeyS')||keys.has('ArrowDown'),yaw);const dx=direction.x*3*dt,dz=direction.z*3*dt;const p=avatar.position;if(pass(p.x+dx,p.z))p.x+=dx;if(pass(p.x,p.z+dz))p.z+=dz;avatar.rotation.y=-yaw}
 const p=avatar.position;const moving=len>0;const bob=moving?Math.sin(now*.012)*.025:0;avatar.children[0].position.y=1+bob;avatar.children[1].position.y=1.73+bob*.4;camera.position.lerp(new T.Vector3(p.x+Math.sin(yaw)*3,2.9,p.z+Math.cos(yaw)*3),1-Math.exp(-dt*7));camera.lookAt(p.x,1.3,p.z);
 near=nearestTarget(targets,p);$('action').disabled=!near;$('action').textContent=near?.label||'Samhandle';$('hint').textContent=near?near.label:'Utforsk rommet og finn interaksjonspunktene';$('objective').textContent=room==='cafe'?questObjective(quest):(unlocked()?(placed?'Postkort plassert ✓':'Heng opp havnepostkortet'):'Fullfør velkomstoppdraget hos Maja');
 renderer.render(scene,camera);requestAnimationFrame(tick)}
$('action').onclick=interact;
if(location.hostname==='127.0.0.1')window.__alteraTestSetPosition=(x,z)=>{avatar.position.set(x,0,z);near=nearestTarget(targets,avatar.position);$('action').disabled=!near};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)interact()});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(k)});for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,()=>keys.delete(k))}
addEventListener('pointerdown',e=>{if(e.target.tagName==='CANVAS'){drag=true;dragX=e.clientX}});addEventListener('pointermove',e=>{if(drag){yaw+=(e.clientX-dragX)*.005;dragX=e.clientX}});addEventListener('pointerup',()=>drag=false);addEventListener('pointercancel',()=>drag=false);
addEventListener('resize',()=>{if(!camera)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
try{build();window.__alteraInteriorReady=true;requestAnimationFrame(tick)}catch(e){$('error').style.display='grid';$('error-text').textContent='3D-scenen kunne ikke starte: '+(e.message||String(e));$('fallback').href=fallbackPage;console.error(e)}
