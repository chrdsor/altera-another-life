import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const REQUIRED = ['hips','spine','head','leftupperarm','rightupperarm','leftupperleg','rightupperleg'];
const RECOMMENDED = ['neck','leftlowerarm','rightlowerarm','lefthand','righthand','leftlowerleg','rightlowerleg','leftfoot','rightfoot'];
const clean = name => String(name || '').toLowerCase().replace(/^.*:/,'').replace(/^mixamorig/,'').replace(/[^a-z0-9]/g,'');

export function inspectHumanoid(model, animations = []) {
  const bones = new Set(), meshes = [];
  let triangles = 0, skinnedMeshes = 0, materials = 0, textureSlots = 0;
  model.traverse(object => {
    if (object.isBone) bones.add(clean(object.name));
    if (!object.isMesh) return;
    meshes.push(object);
    if (object.isSkinnedMesh) skinnedMeshes++;
    const g = object.geometry;
    if (g) triangles += Math.floor((g.index ? g.index.count : (g.attributes.position?.count || 0)) / 3);
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
  if (triangles > 45000) warnings.push('Høyt trekantantall for mobil. Lag en lettere LOD-versjon.');
  if (materials > 18) warnings.push('Mange materialer kan øke antallet draw calls på mobil.');
  return {
    bones: [...bones].sort(), skinnedMeshes, meshes: meshes.length,
    triangles, materials, textureSlots,
    animationNames: animations.map(a => a.name),
    missingRequired, missingRecommended,
    compatibleWithAlteraRig: skinnedMeshes > 0 && missingRequired.length === 0,
    warnings
  };
}

export function setupRiggedAvatar(T, scene, prototype, change) {
  const group = new T.Group();
  scene.add(group);
  const loader = new GLTFLoader(), clock = new T.Clock();
  let root = null, mixer = null, clips = [], action = null;
  let objectUrl = null, request = 0, report = null;
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
      ['Trekanter', result.triangles.toLocaleString('nb-NO')],
      ['Materialer', result.materials],
      ['Animasjoner', result.animationNames.join(', ') || 'Ingen']
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
    mixer = null; clips = []; action = null; report = null;
    if (root) {
      group.remove(root);
      root.traverse(o => {
        if (!o.isMesh) return;
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(m => m?.dispose());
      });
      root = null;
    }
    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
    prototype.visible = true;
    showReport(null);
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
    change({gender:'Kvinne'}); load('assets/avatar-woman.glb');
  };
  document.getElementById('glbMan').onclick = () => {
    change({gender:'Mann'}); load('assets/avatar-man.glb');
  };
  document.getElementById('glbReset').onclick = () => {
    ++request; clear(); say('Prototypemodellen vises.');
  };
  document.getElementById('glbWalk').onclick = () => play('walk');
  document.getElementById('glbIdle').onclick = () => play('idle');

  return {
    tick(angle) {
      group.rotation.y = angle;
      const dt = Math.min(clock.getDelta(), .08);
      mixer?.update(dt);
    },
    inspect: () => report
  };
}
