import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SETTLEMENTS,validateSettlement} from './settlements.js';
const scene=new T.Scene(),camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,500);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;document.body.prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.07;controls.minDistance=13;controls.maxDistance=100;
scene.add(new T.HemisphereLight(0xe5edff,0x6c665f,2.2));const sun=new T.DirectionalLight(0xffe2b3,2.4);sun.position.set(-22,40,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=70;sun.shadow.camera.bottom=-70;scene.add(sun);
const groundGroup=new T.Group();scene.add(groundGroup);
const obstacles=[];let walking=false;const keys=new Set();const clock=new T.Clock();
const avatar=new T.Group();const body=new T.Mesh(new T.CapsuleGeometry(.38,1.15,5,10),new T.MeshStandardMaterial({color:0x6d88b6}));body.position.y=1.08;avatar.add(body);const face=new T.Mesh(new T.SphereGeometry(.22,10,8),new T.MeshStandardMaterial({color:0xe6b9a2}));face.position.set(0,1.9,-.17);avatar.add(face);scene.add(avatar);
const walkButton=document.getElementById('walkMode');const mobilePad=document.getElementById('mobilePad');
function setWalking(value){walking=value;walkButton.setAttribute('aria-pressed',String(value));walkButton.textContent=value?'Oversiktsmodus':'Gå rundt';mobilePad.hidden=!value;controls.enableRotate=!value;controls.enablePan=!value;controls.enableZoom=!value;avatar.visible=value;if(value){controls.target.copy(avatar.position).add(new T.Vector3(0,1.4,0));camera.position.copy(avatar.position).add(new T.Vector3(0,4.5,8));}else{camera.position.set(37,32,43);controls.target.set(0,1,0)}controls.update()}
walkButton.addEventListener('click',()=>setWalking(!walking));
addEventListener('keydown',e=>{if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())){keys.add(e.key.toLowerCase());if(walking)e.preventDefault()}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
for(const b of mobilePad.querySelectorAll('[data-key]')){const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(key))}

const palette={city_01:{sky:0x98b2c7,ground:0x78887b,road:0x363e4b,house:[0xcbb4a2,0xa8b6bb,0xd1bcb2]},village_01:{sky:0xa6c9dd,ground:0x6f9466,road:0x79756a,house:[0xb88c65,0xc7b69a,0x906e56]},highlands_01:{sky:0xb2cadf,ground:0xe7edf0,road:0x697780,house:[0x765a49,0xa78d77,0x574b48]},coast_01:{sky:0x93c0d0,ground:0x81948a,road:0x777a7c,house:[0xb45f50,0xd3c1a4,0x778fa1]}};
const material=(color)=>new T.MeshStandardMaterial({color,roughness:.9});
function mesh(geometry,mat,x,y,z,parent=groundGroup){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const cube=(w,h,d,color,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),material(color),x,y,z);
function terrainHeight(x,z,s){if(s.id==='city_01')return .15*Math.sin(x*.14)*Math.cos(z*.17);if(s.id==='village_01')return 1.4*Math.sin(x*.09)*Math.cos(z*.09);if(s.id==='highlands_01')return 2.8*Math.sin(x*.08)*Math.cos(z*.1)+1.8*Math.cos(z*.15);return 1.1*Math.sin(x*.12)+1.6*Math.cos(z*.09)}
function build(s){obstacles.length=0;avatar.position.set(0,terrainHeight(0,0,s),0);while(groundGroup.children.length){const c=groundGroup.children[0];groundGroup.remove(c);c.traverse(o=>{o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}})}
const pal=palette[s.id];scene.background=new T.Color(pal.sky);scene.fog=new T.Fog(pal.sky,70,190);
const geo=new T.PlaneGeometry(105,105,55,55);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i),s));geo.computeVertexNormals();mesh(geo,material(pal.ground),0,-.15,0);
const road=material(pal.road);const roadGeo=new T.PlaneGeometry(7,90);roadGeo.rotateX(-Math.PI/2);mesh(roadGeo,road,0,.08,0);const cross=new T.PlaneGeometry(70,6);cross.rotateX(-Math.PI/2);mesh(cross,road,0,.09,0);
const roof=material(s.id==='highlands_01'?0x3f454b:0x545a5b);const windowMat=material(0x94c1cb);
for(let i=0;i<24;i++){const col=i%6,row=Math.floor(i/6);let x=(col-2.5)*13,z=(row-1.5)*20;if(Math.abs(x)<5)x+=x<0?-5:5;if(Math.abs(z)<4)z+=z<0?-5:5;const h=s.id==='city_01'?6+(i%4)*3:s.id==='highlands_01'?3.6+(i%3):3.8+(i%3)*1.2;
const w=5+(i%3),d=5+(i%2);const y=terrainHeight(x,z,s);obstacles.push({x,z,w,d});cube(w,h,d,pal.house[i%3],x,y+h/2,z);const r=mesh(new T.ConeGeometry(Math.max(w,d)*.72,2.4,4),roof,x,y+h+1.1,z);r.rotation.y=Math.PI/4;
cube(1.1,1.5,.09,0x56483e,x,y+.75,z+d/2+.06);
for(let k=0;k<Math.floor(h/3);k++)for(const dx of [-w*.26,w*.26])cube(.75,1,.12,0x9fc3cc,x+dx,y+2+k*2.5,z+d/2+.07);
}
const foliage=material(s.id==='highlands_01'?0x416154:0x38654b),trunk=material(0x655144);
for(let i=0;i<95;i++){const x=Math.sin(i*12.9898)*46,z=Math.cos(i*8.113)*46;if(Math.abs(x)<8||Math.abs(z)<7)continue;const y=terrainHeight(x,z,s);mesh(new T.CylinderGeometry(.15,.25,2,6),trunk,x,y+1,z);mesh(new T.ConeGeometry(1.5,4.5,7),foliage,x,y+4,z)}
if(s.id==='coast_01'||s.id==='city_01'){const water=new T.Mesh(new T.PlaneGeometry(115,30),new T.MeshStandardMaterial({color:0x447c9c,metalness:.35,roughness:.25,transparent:true,opacity:.86}));water.rotation.x=-Math.PI/2;water.position.set(0,-.6,-48);groundGroup.add(water)}
if(s.id==='highlands_01')for(let i=0;i<7;i++){const x=-48+i*16,z=-44+(i%2)*9;const peak=mesh(new T.ConeGeometry(11,17+(i%3)*5,5),material(0xc5d0d7),x,8,z);peak.rotation.y=i*.5}
setWalking(false);
document.getElementById('details').textContent=s.name+' · '+s.biome+' · '+s.buildings.length+' bygningskategorier · '+s.roads.length+' veityper';
}
const params=new URLSearchParams(location.search);let selected=params.get('area');if(!SETTLEMENTS.some(s=>s.id===selected))selected='city_01';
const holder=document.getElementById('destinations');
for(const s of SETTLEMENTS){if(validateSettlement(s).length)continue;const b=document.createElement('button');b.textContent=s.name;b.setAttribute('aria-pressed',String(selected===s.id));b.onclick=()=>{selected=s.id;history.replaceState(null,'','?area='+encodeURIComponent(s.id));for(const el of holder.children)el.setAttribute('aria-pressed',String(el===b));build(s)};holder.append(b)}
build(SETTLEMENTS.find(s=>s.id===selected));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(walking){const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));const side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));const move=new T.Vector3(side,0,-forward);if(move.lengthSq()>0){move.normalize().multiplyScalar(dt*5);const next=avatar.position.clone().add(move);const clear=obstacles.every(o=>Math.abs(next.x-o.x)>o.w/2+.5||Math.abs(next.z-o.z)>o.d/2+.5);if(clear&&Math.abs(next.x)<50&&Math.abs(next.z)<50){avatar.position.x=next.x;avatar.position.z=next.z;avatar.position.y=terrainHeight(next.x,next.z,SETTLEMENTS.find(s=>s.id===selected));avatar.rotation.y=Math.atan2(-move.x,-move.z)}}const target=avatar.position.clone().add(new T.Vector3(0,1.5,0));const desired=avatar.position.clone().add(new T.Vector3(0,4.5,8));camera.position.lerp(desired,Math.min(1,dt*6));controls.target.lerp(target,Math.min(1,dt*8));}controls.update();renderer.render(scene,camera)});
