import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const KEY='altera-home-furniture-v1',MAX=80,ROOM={w:11,d:9},kinds=['sofa','table','chair','lamp','shelf','plant'];
const footprints={sofa:[2.3,1],table:[1.5,1.2],chair:[.75,.75],lamp:[.55,.55],shelf:[1.6,.55],plant:[.8,.8]};
const scene=new THREE.Scene();scene.background=new THREE.Color('#1c2738');
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,150);camera.position.set(10,10,13);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.3,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.08;controls.minDistance=5;controls.maxDistance=25;controls.update();
scene.add(new THREE.HemisphereLight(0xdce9ff,0x6b5148,2.2));const sun=new THREE.DirectionalLight(0xffe0b2,3);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const mat=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const floorMat=mat('#a88d74'),wallMat=mat('#ded6ca'),trimMat=mat('#453f42'),glassMat=new THREE.MeshStandardMaterial({color:'#9cc5d9',transparent:true,opacity:.4});
function box(w,h,d,x,y,z,m,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
box(ROOM.w,.18,ROOM.d,0,-.09,0,floorMat);box(ROOM.w,3.4,.16,0,1.7,-ROOM.d/2,wallMat);box(.16,3.4,ROOM.d,-ROOM.w/2,1.7,0,wallMat);
box(ROOM.w,.15,.18,0,.08,-ROOM.d/2,trimMat);box(.18,.15,ROOM.d,-ROOM.w/2,.08,0,trimMat);
box(2.8,1.5,.08,1.6,1.8,-ROOM.d/2+.1,glassMat);box(2.85,.08,.16,1.6,1.05,-ROOM.d/2+.2,trimMat);
const grid=new THREE.GridHelper(ROOM.w,11,0x726b64,0xb7a796);grid.position.y=.006;scene.add(grid);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const status=document.getElementById('status');let selectedKind=null,selectedId=null;const objects=new Map();
const uid=()=>globalThis.crypto?.randomUUID?.()||'f_'+Date.now()+'_'+Math.random().toString(36).slice(2);
function validItem(i){return i&&typeof i.id==='string'&&kinds.includes(i.kind)&&Number.isFinite(i.x)&&Number.isFinite(i.z)&&[0,1,2,3].includes(i.turn)}
function dims(i){const [w,d]=footprints[i.kind];return i.turn%2?[d,w]:[w,d]}
function fits(i,except=null){const [w,d]=dims(i);if(Math.abs(i.x)+w/2>ROOM.w/2-.25||Math.abs(i.z)+d/2>ROOM.d/2-.25)return false;for(const other of objects.values()){if(other.id===except)continue;const [ow,od]=dims(other);if(Math.abs(i.x-other.x)<(w+ow)/2+.15&&Math.abs(i.z-other.z)<(d+od)/2+.15)return false}return true}
function furniture(i){const g=new THREE.Group();g.position.set(i.x,0,i.z);g.rotation.y=i.turn*Math.PI/2;g.userData.id=i.id;const wood=mat('#8b654b'),fabric=mat('#6b708d'),metal=mat('#363b47'),green=mat('#467c5c');
if(i.kind==='sofa'){box(2.3,.35,1,0,.34,0,fabric,g);box(2.3,.7,.24,0,.72,-.38,fabric,g);box(.2,.5,.9,-1.05,.6,0,fabric,g);box(.2,.5,.9,1.05,.6,0,fabric,g)}
if(i.kind==='table'){box(1.5,.14,1.2,0,.82,0,wood,g);for(const x of [-.6,.6])for(const z of [-.45,.45])box(.1,.75,.1,x,.4,z,metal,g)}
if(i.kind==='chair'){box(.7,.12,.7,0,.52,0,wood,g);box(.7,.75,.12,0,.95,-.3,wood,g);for(const x of [-.26,.26])for(const z of [-.26,.26])box(.07,.46,.07,x,.24,z,metal,g)}
if(i.kind==='lamp'){box(.42,.09,.42,0,.06,0,metal,g);box(.07,1.55,.07,0,.83,0,metal,g);box(.52,.45,.52,0,1.6,0,mat('#ffdfaa'),g)}
if(i.kind==='shelf'){for(const y of [.2,1,1.8])box(1.6,.1,.55,0,y,0,wood,g);for(const x of [-.75,.75])box(.09,2,.55,x,1,0,metal,g)}
if(i.kind==='plant'){box(.48,.5,.48,0,.25,0,wood,g);const leaves=new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),green);leaves.position.y=1.1;g.add(leaves)}
scene.add(g);return g}
function save(){try{localStorage.setItem(KEY,JSON.stringify([...objects.values()]))}catch{status.textContent='Kunne ikke lagre lokalt.'}}
function add(i,persist=true){objects.set(i.id,i);i.mesh=furniture(i);if(persist)save()}
function remove(id){const i=objects.get(id);if(!i)return;scene.remove(i.mesh);i.mesh.traverse(o=>{o.geometry?.dispose()});objects.delete(id);if(selectedId===id)selectedId=null;save()}
try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))for(const item of data.slice(0,MAX)){if(validItem(item)&&!objects.has(item.id)&&fits(item))add({...item},false)}}catch{status.textContent='Tidligere møblering kunne ikke leses.'}
document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{selectedKind=b.dataset.kind;selectedId=null;document.querySelectorAll('[data-kind]').forEach(x=>x.classList.toggle('active',x===b));status.textContent='Trykk på en ledig plass på gulvet.'}));
document.getElementById('rotate').onclick=()=>{if(!selectedId)return;const i=objects.get(selectedId);const candidate={...i,turn:(i.turn+1)%4};if(!fits(candidate,i.id)){status.textContent='Ikke plass til å rotere her.';return}i.turn=candidate.turn;i.mesh.rotation.y=i.turn*Math.PI/2;save()};
document.getElementById('remove').onclick=()=>{if(selectedId)remove(selectedId)};
document.getElementById('reset').onclick=()=>{if(!confirm('Slette all lokal møblering?'))return;for(const id of [...objects.keys()])remove(id);status.textContent='Boligen er tømt.'};
let start=null;renderer.domElement.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([...objects.values()].map(i=>i.mesh),true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.id)o=o.parent;if(o?.userData.id){selectedId=o.userData.id;selectedKind=null;document.querySelectorAll('[data-kind]').forEach(x=>x.classList.remove('active'));status.textContent='Møbel valgt. Roter eller slett.';return}}
if(!selectedKind)return;const point=new THREE.Vector3();if(!raycaster.ray.intersectPlane(plane,point))return;const item={id:uid(),kind:selectedKind,x:Math.round(point.x*2)/2,z:Math.round(point.z*2)/2,turn:0};if(objects.size>=MAX){status.textContent='Maksimalt antall møbler nådd.';return}if(!fits(item)){status.textContent='Ikke plass her. Velg et ledig område.';return}add(item);status.textContent='Møbelet er lagret lokalt.'});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
