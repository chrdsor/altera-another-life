import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const REQUIRED = ['hips','spine','head','leftupperarm','rightupperarm','leftupperleg','rightupperleg'];
const RECOMMENDED = ['neck','leftlowerarm','rightlowerarm','lefthand','righthand','leftlowerleg','rightlowerleg','leftfoot','rightfoot'];
const clean = name => String(name || '').toLowerCase().replace(/^.*:/,'').replace(/^mixamorig/,'').replace(/[^a-z0-9]/g,'');
const MPFB_BONES = {pelvis:'hips',spine01:'spine',neck01:'neck',upperarml:'leftupperarm',upperarmr:'rightupperarm',lowerarml:'leftlowerarm',lowerarmr:'rightlowerarm',handl:'lefthand',handr:'righthand',thighl:'leftupperleg',thighr:'rightupperleg',calfl:'leftlowerleg',calfr:'rightlowerleg',footl:'leftfoot',footr:'rightfoot'};
const canonicalBone = name => MPFB_BONES[clean(name)] || clean(name);

export function inspectHumanoid(model, animations = []) {
  const bones = new Set(), meshes = [];
  let triangles = 0, activeTriangles = 0, skinnedMeshes = 0, materials = 0, textureSlots = 0;
  model.traverse(object => {
    if (object.isBone) bones.add(canonicalBone(object.name));
    if (!object.isMesh) return;
    meshes.push(object);
    if (object.isSkinnedMesh) skinnedMeshes++;
    const g = object.geometry;
    if (g) { const count=Math.floor((g.index ? g.index.count : (g.attributes.position?.count || 0)) / 3);triangles+=count;if(object.visible!==false)activeTriangles+=count; }
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (!material) continue;
      materials++;
      if (material.map || material.normalMap || material.roughnessMap || material.metalnessMap) textureSlots++;
    }
  });
  const missingRequired = REQUIRED.filter(n => !bones.has(n));
  const missingRecommended = RECOMMENDED.filter(n => !bones.has(n));
  const warnings = [];
  if (!skinnedMeshes) warnings.push('Ingen SkinnedMesh: modellen er ikke klar for skjelettbaserte klær.');
  if (missingRequired.length) warnings.push('Mangler sentrale humanoid-knokler: ' + missingRequired.join(', '));
  if (missingRecommended.length) warnings.push('Mangler anbefalte knokler: ' + missingRecommended.join(', '));
  if (!animations.length) warnings.push('Ingen animasjonsklipp funnet.');
  if (activeTriangles > 45000) warnings.push('Høyt aktivt trekantantall for mobil. Lag en lettere LOD-versjon.');
  if (materials > 18) warnings.push('Mange materialer kan øke antallet draw calls på mobil.');
  return {
    bones: [...bones].sort(), skinnedMeshes, meshes: meshes.length,
    triangles, activeTriangles, materials, textureSlots,
    animationNames: animations.map(a => a.name),
    missingRequired, missingRecommended,
    compatibleWithAlteraRig: skinnedMeshes > 0 && missingRequired.length === 0,
    warnings
  };
}

export function setupRiggedAvatar(T, scene, prototype, change, getState = () => ({})) {
  const group = new T.Group();
  scene.add(group);
  const loader = new GLTFLoader(), clock = new T.Clock();
  let root = null, mixer = null, clips = [], action = null;
  let objectUrl = null, request = 0, report = null;
  const slotAliases = {outfit:/male_casualsuit|female_casualsuit|sportsuit|worksuit|elegantsuit/i,skin:/^ALTERA_body\s|^base\s/i,hair:/hair|fringe|bangs|ALTERA_body\.(short\d+|bob\d+|afro\d+|braid\d+|long\d+|ponytail\d+)/i,top:/top|shirt|hoodie|jacket|sweater|blouse|upper|torso_cloth/i,bottom:/pants|trousers|jeans|skirt|shorts|lower_cloth/i,shoes:/shoe|sneaker|boot|footwear/i};
  const editable = new Map();
  let builder = false, selectedVariants = {};
  const status = document.getElementById('glbStatus');
  const diagnostics = document.getElementById('glbDiagnostics');
  const say = message => { if (status) status.textContent = message; };

  function showReport(result) {
    if (!diagnostics) return;
    diagnostics.replaceChildren();
    if (!result) { diagnostics.textContent = 'Ingen importert modell analysert ennå.'; return; }
    const rows = [
      ['Rigging', result.compatibleWithAlteraRig ? 'Grunnkontroll bestått' : 'Trenger tilpasning'],
      ['Skinned meshes', result.skinnedMeshes],
      ['Knokler', result.bones.length],
      ['Aktive trekanter', result.activeTriangles.toLocaleString('nb-NO')],
      ['Materialer', result.materials],
      ['Animasjoner', result.animationNames.join(', ') || 'Ingen'],
      ['Plaggmesher', result.editableSlots ? Object.entries(result.editableSlots).map(([k,v])=>k+': '+v).join(' · ') : 'Ikke analysert']
    ];
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      row.className = 'rigRow';
      const l = document.createElement('span'), v = document.createElement('strong');
      l.textContent = label; v.textContent = String(value);
      row.append(l, v); diagnostics.append(row);
    }
    if (result.warnings.length) {
      const heading = document.createElement('p');
      heading.textContent = 'Kvalitetskontroll';
      diagnostics.append(heading);
      for (const warning of result.warnings) {
        const item = document.createElement('p');
        item.className = 'rigWarning';
        item.textContent = '• ' + warning;
        diagnostics.append(item);
      }
    }
  }

  function clear() {
    if (mixer) { mixer.stopAllAction(); if (root) mixer.uncacheRoot(root); }
    mixer = null; clips = []; action = null; report = null; editable.clear(); builder=false; selectedVariants={};
    if (root) {
      group.remove(root);
      // GLTFLoader manages shared geometry/material references; do not dispose here.
      // Recolor clones are disposed when replaced; original assets may be reused.
      root = null;
    }
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    prototype.visible = true;
    showReport(null);
  }

  function indexSlots(model) {
    editable.clear();
    for (const key of Object.keys(slotAliases)) editable.set(key,[]);
    model.traverse(object => {
      if (!object.isMesh) return;
      const label = object.name + ' ' + (Array.isArray(object.material) ? object.material.map(m=>m?.name).join(' ') : object.material?.name || '');
      const declared=object.userData?.alteraSlot;
      if (declared && editable.has(declared)) { editable.get(declared).push(object); return; }
      for (const [slot,pattern] of Object.entries(slotAliases)) {
        if (pattern.test(label)) { editable.get(slot).push(object); break; }
      }
    });
    return Object.fromEntries([...editable.entries()].map(([k,v])=>[k,v.length]));
  }
  function recolor(slot, color) {
    const actualSlot=slot==='top' && !editable.get('top')?.length && editable.get('outfit')?.length ? 'outfit' : slot;
    const targets=editable.get(actualSlot)||[];
    if (!root || !targets.length) return {changed:0,reason:'Ingen navngitte '+slot+'-mesher i importert GLB'};
    for (const mesh of targets) {
      if (!mesh.userData.alteraOriginalMaterials) mesh.userData.alteraOriginalMaterials=mesh.material;
      const previous=mesh.material;
      const original=Array.isArray(mesh.userData.alteraOriginalMaterials)?mesh.userData.alteraOriginalMaterials:[mesh.userData.alteraOriginalMaterials];
      const recolored=original.map(material=>{
        const m=material.clone();
        if (m.color) m.color.set(color);
        return m;
      });
      mesh.material=Array.isArray(previous)?recolored:recolored[0];
      const previousMaterials=Array.isArray(previous)?previous:[previous];
      previousMaterials.forEach(m=>{if(m && !original.includes(m))m.dispose()});
    }
    return {changed:targets.length,slot:actualSlot};
  }
  function setMorph(name,weight) {
    if (!root) return 0;
    let changed=0;
    root.traverse(object=>{
      if (!object.isMesh || !object.morphTargetDictionary || !object.morphTargetInfluences) return;
      const idx=object.morphTargetDictionary[name];
      if (idx!==undefined){object.morphTargetInfluences[idx]=Math.max(0,Math.min(1,weight));changed++}
    });
    return changed;
  }
  const garmentNames={top:{'T-skjorte':'tshirt','Langermet':'long'},bottom:{Jeans:'jeans',Shorts:'shorts'},shoes:{Skinnsko:'leather',Sneakers:'sneakers'}};
  function setWardrobe(slot,label) {
    const variant=garmentNames[slot]?.[label] || {top:'long',bottom:'jeans',shoes:'leather'}[slot];
    if(!builder || !variant) return false;
    for(const mesh of editable.get(slot)||[]) {
      const id=mesh.userData.alteraVariant || mesh.name.split('_').slice(1).join('_');
      mesh.visible=id===variant;
    }
    selectedVariants[slot]=variant;
    return true;
  }
  function applyState(state) {
    if(!root)return;
    for(const [field,slot] of Object.entries({skin:'skin',hair:'hair',topColor:'top',bottomColor:'bottom'})) {
      if(state[field])recolor(slot,state[field]);
    }
    if(!builder)return;
    const body=Number.isFinite(state.body)?state.body:1;
    setMorph('BodySlim',Math.max(0,(1-body)/.2));
    setMorph('BodyWide',Math.max(0,(body-1)/.25));
    setMorph('GenderFemale',state.gender==='Kvinne'?1:0);
    setMorph('BodyMuscular',Number.isFinite(state.muscle)?state.muscle:0);
    for(const slot of ['top','bottom','shoes'])setWardrobe(slot,state[slot]);
    if(report){Object.assign(report,inspectHumanoid(root,clips));showReport(report);}
  }
  function play(type) {
    if (!mixer || !clips.length) { say('Modellen inneholder ingen animasjonsklipp.'); return; }
    const pattern = type === 'walk' ? /walk|run|locomotion/i : /idle|stand|breath/i;
    const clip = clips.find(c => pattern.test(c.name)) ||
      clips[type === 'walk' ? Math.min(1, clips.length - 1) : 0];
    action?.fadeOut(.2);
    action = mixer.clipAction(clip);
    action.reset().fadeIn(.2).play();
    say('Spiller animasjon: ' + clip.name);
  }

  async function load(url, local = false) {
    const ticket = ++request;
    say('Laster rigget 3D-modell …');
    try {
      const gltf = await loader.loadAsync(url);
      if (ticket !== request) {
        if (local) URL.revokeObjectURL(url);
        return;
      }
      const model = gltf.scene;
      const bounds = new T.Box3().setFromObject(model);
      const size = bounds.getSize(new T.Vector3());
      const center = bounds.getCenter(new T.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw Error('Ugyldig modellstørrelse');
      const inspected = inspectHumanoid(model, gltf.animations || []);
      clear();
      root = model;
      const scale = 3 / size.y;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      group.add(model);
      prototype.visible = false;
      clips = gltf.animations || [];
      report = inspected;
      report.editableSlots=indexSlots(model);
      builder=model.children.length>0 && [...editable.values()].flat().some(m=>m.userData.alteraBuilder);
      if(builder)applyState(getState());
      showReport(report);
      if (clips.length) {
        mixer = new T.AnimationMixer(model);
        play('idle');
      } else say('GLB lastet uten animasjoner.');
      if (local) objectUrl = url;
      if (!clips.length) say('GLB lastet. Se riggkontroll for detaljer.');
    } catch (error) {
      if (local) URL.revokeObjectURL(url);
      if (ticket === request) say('GLB kunne ikke lastes: ' + (error?.message || 'ukjent feil'));
    }
  }

  document.getElementById('glbFile').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.glb$/i.test(file.name) || file.size > 60 * 1024 * 1024) {
      say('Velg en GLB-fil på maks 60 MB.'); return;
    }
    load(URL.createObjectURL(file), true);
  });
  document.getElementById('glbWoman').onclick = () => {
    change({gender:'Kvinne'}); if(!builder)load('assets/avatar-woman.glb');
  };
  document.getElementById('glbMan').onclick = () => {
    change({gender:'Mann'}); if(!builder)load('assets/avatar-man.glb');
  };
  document.getElementById('glbMpfb')?.addEventListener('click', () => {
    change({gender:'Mann',top:'Langermet',bottom:'Jeans',shoes:'Skinnsko',body:1,muscle:0,hairStyle:'Kort',modelMode:'builder'});
    awaitBuilder();
  });
  async function awaitBuilder() {
    await load('assets/characters/mpfb-builder-v1/avatar.glb?v=1');
    change({});
  }
  document.getElementById('glbReset').onclick = () => {
    ++request; clear(); change({modelMode:null});say('Prototypemodellen vises.');
  };
  document.getElementById('glbWalk').onclick = () => play('walk');
  document.getElementById('glbIdle').onclick = () => play('idle');
  document.getElementById('glbExportConfig')?.addEventListener('click',()=>{
    if(!builder){say('Last MPFB-byggeren før du eksporterer avatarvalg.');return;}
    const definition={schemaVersion:1,modelId:'mpfb-builder-v1',parameters:getState()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(definition,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='ALTERA-avatarvalg.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);say('Avatarvalgene er eksportert som JSON.');
  });

  return {
    tick(angle) {
      group.rotation.y = angle;
      const dt = Math.min(clock.getDelta(), .08);
      mixer?.update(dt);
    },
    inspect: () => report,
    recolor,
    setMorph,
    applyState,
    isBuilder:()=>builder,
    loadBuilder:awaitBuilder,
    hasModel: () => !!root
  };
}




