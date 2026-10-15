import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {setupRiggedAvatar} from './rigged-avatar.js?v=8';
import {AVATAR_OPTIONS,AVATAR_STATE_KEY,DEFAULT_AVATAR_STATE,loadAvatarState,normalizeAvatarState,saveAvatarState} from './avatar-state.js?v=1';

const $=id=>document.getElementById(id);
const storageKey=AVATAR_STATE_KEY;
const mobile=matchMedia('(max-width:760px)').matches;
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const lowPower=mobile || (navigator.deviceMemory && navigator.deviceMemory<=4);
const defaults=DEFAULT_AVATAR_STATE,options=AVATAR_OPTIONS;
let state=loadAvatarState(),section='Ansikt',history=[],redoHistory=[],toastTimer;
const palettes={
  skin:['#f1c5a7','#d79b76','#b97959','#92593f','#653926','#3c211b'],eye:['#416b86','#6d4b29','#657348','#85715e'],hair:['#21191b','#5b382c','#a96f4f','#d3a47a','#a84f58'],topColor:['#141318','#ddd4cb','#d989b8','#485e72'],bottomColor:['#28262d','#263347','#81766e','#4b4b50']
};
const presets=[
  {name:'Nåværende',detail:'Urban night',color:'#7a2c70',patch:{gender:'Kvinne',hairStyle:'Oppsatt',hair:'#a96f4f',skin:'#d79b76',eye:'#416b86',top:'Crop top',bottom:'Cargo',shoes:'Sneakers',topColor:'#141318',bottomColor:'#28262d'}},
  {name:'Midnight',detail:'Monokrom',color:'#2f334c',patch:{hair:'#21191b',skin:'#b97959',eye:'#6d4b29',top:'Crop top',bottom:'Cargo',topColor:'#141318',bottomColor:'#263347'}},
  {name:'Rose',detail:'Myk kontrast',color:'#7d385f',patch:{hair:'#5b382c',skin:'#d79b76',eye:'#657348',top:'T-skjorte',bottom:'Jeans',topColor:'#d989b8',bottomColor:'#28262d'}},
  {name:'Nordic',detail:'Lys casual',color:'#6a6474',patch:{hair:'#d3a47a',skin:'#f1c5a7',eye:'#416b86',top:'Langermet',bottom:'Jeans',topColor:'#ddd4cb',bottomColor:'#263347'}}
];
const sectionCopy={Ansikt:'Velg hudtone, øyne og naturlige ansiktsproporsjoner.',Hår:'Velg frisyre og hårfarge.',Kropp:'Juster kroppsform uten å miste naturlige proporsjoner.',Klær:'Bytt plagg. Crop top bevarer synlig mage.',Farger:'Finjuster fargene i antrekket.'};
const icons={
  Ansikt:'<circle cx="12" cy="9" r="6"/><path d="M9 10h.01M15 10h.01M9 14c2 2 4 2 6 0M5 22c1-4 4-6 7-6s6 2 7 6"/>',
  Hår:'<path d="M4 22V9a8 8 0 0 1 16 0v13M8 20V9m8 11V9M8 6c2-4 6-4 8 0"/>',
  Kropp:'<circle cx="12" cy="4" r="2.5"/><path d="M8 22v-7L6 9l4-2h4l4 2-2 6v7M8 14h8"/>',
  Klær:'<path d="m8 3-6 4 3 5 3-2v12h8V10l3 2 3-5-6-4c-2 3-6 3-8 0Z"/>',
  Farger:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="8" r="1"/><circle cx="15" cy="7" r="1"/><circle cx="17" cy="14" r="1"/><path d="M9 16h4"/>'
};

function note(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2200)}
function save(){try{state=saveAvatarState(state);$('saveNote').textContent='Lagret på denne enheten'}catch{note('Lokal lagring er ikke tilgjengelig. Bruk eksport.')}}
function change(patch,{silent=false}={}){if(Object.keys(patch).length&&!silent){history.push({...state});if(history.length>60)history.shift();redoHistory=[]}Object.assign(state,patch);rigged.applyState(state);ui();save()}
function button(text,active,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-pressed',String(active));b.onclick=action;return b}
function field(title){const e=document.createElement('section');e.className='field';const h=document.createElement('h2');h.textContent=title;e.append(h);$('editor').append(e);return e}
function choices(name,title){const e=field(title),row=document.createElement('div'),available=rigged?.availableOptions?.(name);row.className='choices';for(const value of options[name]){const b=button(value,state[name]===value,()=>change({[name]:value}));if(Array.isArray(available)&&!available.includes(value)){b.disabled=true;b.title='Ikke tilgjengelig i denne 3D-modellen'}row.append(b)}e.append(row)}
function colors(name,title){const e=field(title),row=document.createElement('div');row.className='swatches';for(const color of palettes[name]){const b=button('',state[name]===color,()=>change({[name]:color}));b.style.background=color;b.setAttribute('aria-label',title+' '+color);row.append(b)}e.append(row)}
function range(name,title,min=0,max=1,left='Mindre',right='Mer'){const e=field(title),wrap=document.createElement('div'),input=document.createElement('input'),label=document.createElement('div');wrap.className='rangeWrap';input.type='range';input.min=min;input.max=max;input.step=.01;input.value=state[name];input.setAttribute('aria-label',title);let before;input.onpointerdown=()=>before={...state};input.onkeydown=()=>before??={...state};input.oninput=()=>{state[name]=Number(input.value);rigged.applyState(state)};input.onchange=()=>{if(before){history.push(before);if(history.length>60)history.shift();redoHistory=[]}before=null;save();ui()};label.className='rangeLabel';label.innerHTML='<span>'+left+'</span><span>'+right+'</span>';wrap.append(input,label);e.append(wrap)}
function setSection(name){section=name;if(name==='Ansikt'||name==='Hår')setCameraMode('face');else setCameraMode('full');ui()}

function ui(){
  const nav=$('sectionNav');nav.replaceChildren();
  for(const name of Object.keys(icons)){const b=button('',section===name,()=>setSection(name));b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[name]+'</svg><span>'+name+'</span>';nav.append(b)}
  $('sectionTitle').textContent=section;$('sectionIntro').textContent=sectionCopy[section];$('editor').replaceChildren();
  if(section==='Ansikt'){colors('skin','Hudtone');colors('eye','Øyenfarge');range('faceSoftness','Ansiktsform',0,1,'Markert','Myk');range('eyeSize','Øynestørrelse',0,1,'Diskré','Åpen');range('noseWidth','Nese',0,1,'Smal','Bred');range('lipFullness','Lepper',0,1,'Smal','Fyldig')}
  if(section==='Hår'){choices('hairStyle','Frisyre');colors('hair','Hårfarge')}
  if(section==='Kropp'){choices('gender','Utgangspunkt');const e=field('Kroppstype'),row=document.createElement('div');row.className='choices';for(const [label,body,muscle] of [['Slank',.82,0],['Naturlig',1,0],['Atletisk',1,.78],['Fyldig',1.2,0]])row.append(button(label,Math.abs(state.body-body)<.02&&Math.abs((state.muscle||0)-muscle)<.02,()=>change({body,muscle})));e.append(row);range('body','Finjuster kroppsform',.82,1.2,'Slankere','Fyldigere')}
  if(section==='Klær'){choices('top','Overdel');choices('bottom','Underdel');choices('shoes','Sko')}
  if(section==='Farger'){colors('topColor','Overdel');colors('bottomColor','Underdel');colors('skin','Hudtone');colors('hair','Hårfarge')}
  $('undo').disabled=!history.length;$('redo').disabled=!redoHistory.length;
  document.querySelectorAll('.modeNav button').forEach((button,index)=>{const target=button.dataset.section;button.classList.toggle('active',target?target===section||(target==='Detaljer'&&section==='Farger'):(['Ansikt','Hår','Kropp'].includes(section)&&index===0))});
  const styles=$('presets');styles.replaceChildren();
  for(const preset of presets){const active=Object.entries(preset.patch).every(([k,v])=>state[k]===v),b=button('',active,()=>change(preset.patch));b.className='styleCard';b.style.setProperty('--color',preset.color);b.style.setProperty('--skin',preset.patch.skin||state.skin);b.style.setProperty('--top',preset.patch.topColor||state.topColor);b.innerHTML='<strong>'+preset.name+'</strong><small>'+preset.detail+'</small>';styles.append(b)}
}

const scene=new T.Scene();scene.background=new T.Color(0x120b18);scene.fog=new T.FogExp2(0x120b18,.055);
const canvas=$('view'),camera=new T.PerspectiveCamera(34,1,.1,80);camera.position.set(0,1.55,mobile?6.35:5.75);
let renderer,rigged;
try{
  renderer=new T.WebGLRenderer({canvas,antialias:!lowPower,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,lowPower?1.25:1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
}catch{$('loadingMessage').textContent='3D kunne ikke starte. Bruk Safari eller Chrome med WebGL aktivert.';throw Error('WebGL unavailable')}
const controls=new OrbitControls(camera,canvas);controls.target.set(0,1.45,0);controls.enablePan=false;controls.enableDamping=!reducedMotion;controls.dampingFactor=.06;controls.minDistance=4.65;controls.maxDistance=8;controls.minPolarAngle=.78;controls.maxPolarAngle=1.6;controls.update();
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.035).texture;room.dispose();pmrem.dispose();

// Warm key and restrained magenta/blue separation keep skin believable while retaining ALTERA's night identity.
scene.add(new T.HemisphereLight(0xffe5d5,0x24152f,1.05));
const keyLight=new T.DirectionalLight(0xffd7bd,3.25);keyLight.position.set(-3.5,5.5,4);keyLight.castShadow=true;keyLight.shadow.mapSize.set(lowPower?512:1024,lowPower?512:1024);Object.assign(keyLight.shadow.camera,{left:-2,right:2,top:4,bottom:-1,near:.1,far:16});keyLight.shadow.bias=-.0005;scene.add(keyLight);
const fill=new T.DirectionalLight(0x91a8ff,.85);fill.position.set(3,2.6,3);scene.add(fill);const rim=new T.DirectionalLight(0xf04cdd,1.45);rim.position.set(2.8,3.6,-2.5);scene.add(rim);
buildStudio();

rigged=setupRiggedAvatar(T,scene,new T.Group(),change,()=>state,{maxAnisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy()),lowPower});
$('save').onclick=()=>{save();note('Avataren er lagret')};
$('undo').onclick=()=>{if(history.length){redoHistory.push({...state});state=history.pop();rigged.applyState(state);ui();save()}};
$('redo').onclick=()=>{if(redoHistory.length){history.push({...state});state=redoHistory.pop();rigged.applyState(state);ui();save()}};
$('front').onclick=()=>setCameraMode('full');$('face').onclick=()=>setCameraMode('face');
$('randomize').onclick=()=>change({skin:pick(palettes.skin),eye:pick(palettes.eye),hair:pick(palettes.hair),faceSoftness:rand(.25,.78),eyeSize:rand(.3,.72),noseWidth:rand(.3,.7),lipFullness:rand(.32,.75)});
document.querySelectorAll('.modeNav [data-section]').forEach(b=>b.onclick=()=>setSection(b.dataset.section==='Detaljer'?'Farger':b.dataset.section==='Stilsett'?'Klær':b.dataset.section));

function pick(values){return values[Math.floor(Math.random()*values.length)]}function rand(a,b){return Math.round((a+Math.random()*(b-a))*100)/100}
function setCameraMode(mode){const face=mode==='face',target=face?(rigged.faceFocus()||new T.Vector3(0,2.52,0)):new T.Vector3(0,1.43,0);controls.minDistance=face?1.45:4.65;controls.maxDistance=face?3.6:8;controls.target.copy(target);camera.position.set(face ? .02 : 0,face?target.y:1.55,face?1.9:mobile?6.35:5.75);controls.update();$('front').setAttribute('aria-pressed',String(!face));$('face').setAttribute('aria-pressed',String(face))}
function buildStudio(){
  const floor=new T.Mesh(new T.PlaneGeometry(16,13),new T.MeshStandardMaterial({color:0x17101a,roughness:.28,metalness:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-.08;floor.receiveShadow=true;scene.add(floor);
  const podium=new T.Mesh(new T.CylinderGeometry(1.22,1.28,.12,lowPower?40:72),new T.MeshStandardMaterial({color:0x241429,roughness:.3,metalness:.25}));podium.receiveShadow=true;podium.position.y=-.02;scene.add(podium);
  const ring=new T.Mesh(new T.TorusGeometry(1.24,.014,6,lowPower?48:90),new T.MeshBasicMaterial({color:0xee64e6,toneMapped:false}));ring.rotation.x=Math.PI/2;ring.position.y=.045;scene.add(ring);
  const wall=new T.Mesh(new T.PlaneGeometry(12,7),new T.MeshStandardMaterial({color:0x160d1c,roughness:.9}));wall.position.set(0,2.7,-3.25);scene.add(wall);
  const windowMat=new T.MeshStandardMaterial({color:0x17213b,roughness:.38,metalness:.35,emissive:0x090b20,emissiveIntensity:.8});
  for(let x=-4.5;x<=4.5;x+=1.55){const pane=new T.Mesh(new T.PlaneGeometry(1.38,3.5),windowMat);pane.position.set(x,2.65,-3.18);scene.add(pane);for(let y=1.25;y<4;y+=.42){if(Math.random()>.52){const light=new T.Mesh(new T.PlaneGeometry(.08,.035),new T.MeshBasicMaterial({color:Math.random()>.35?0xf0a78b:0xb56be2,toneMapped:false}));light.position.set(x+(Math.random()-.5),y,-3.12);scene.add(light)}}}
  const sofa=new T.Group(),sofaMat=new T.MeshStandardMaterial({color:0x241a28,roughness:.92});for(const [w,h,d,x,y,z] of [[3.3,.45,.8,2.8,.25,-2.35],[3.3,.75,.25,2.8,.78,-2.72],[.25,.55,.9,1.12,.42,-2.32],[.25,.55,.9,4.48,.42,-2.32]]){const m=new T.Mesh(new T.BoxGeometry(w,h,d),sofaMat);m.position.set(x,y,z);sofa.add(m)}scene.add(sofa);
  for(const x of [-4.8,4.9]){const bar=new T.Mesh(new T.BoxGeometry(.055,3.8,.055),new T.MeshBasicMaterial({color:0xe14ad8,toneMapped:false}));bar.position.set(x,1.85,-2.95);scene.add(bar)}
}

ui();rigged.loadBuilder();
let loaded=false,lastWidth=0,lastHeight=0,lastTime=0;
function frame(time){const rect=canvas.getBoundingClientRect();if(rect.width&&rect.height&&(rect.width!==lastWidth||rect.height!==lastHeight)){renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();lastWidth=rect.width;lastHeight=rect.height}controls.update();rigged.tick(0);renderer.render(scene,camera);if(rigged.hasModel()&&!loaded){loaded=true;$('loading').hidden=true;ui()}else if(!loaded&&$('glbStatus').textContent.includes('kunne ikke lastes')){$('loadingMessage').textContent='Avataren kunne ikke lastes. Last siden på nytt.';$('loading').querySelector('span').hidden=true}lastTime=time;requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.addEventListener('storage',e=>{if(e.key===storageKey&&e.newValue){try{state=normalizeAvatarState(JSON.parse(e.newValue));rigged.applyState(state);ui()}catch{}}});
