const patterns={
  skin:/^ALTERA_body(?:\s|$)|^base(?:\s|$)|skin/i,
  eyes:/iris|eye_color|pupil/i,
  hair:/hair|fringe|bangs|bun|braid|ponytail/i,
  top:/top|crop|shirt|hoodie|sweater|upper|torso_cloth/i,
  bottom:/pants|cargo|trousers|jeans|shorts|lower_cloth/i,
  shoes:/shoe|sneaker|boot|footwear/i
};

const variants={
  hair:{Oppsatt:'bun',Kort:'short'},
  top:{'Crop top':'crop','T-skjorte':'tshirt','Langermet':'long'},
  bottom:{Cargo:'cargo',Jeans:'jeans',Shorts:'shorts'},
  shoes:{Sneakers:'sneakers',Skinnsko:'leather'}
};

const meshVariant=mesh=>mesh.userData.alteraVariant||mesh.name.split('_').slice(1).join('_');

export function applyAvatarAppearance(T,root,state,renderer,{materialCache='alteraRuntimeMaterials'}={}){
  const slots={skin:[],eyes:[],hair:[],top:[],bottom:[],shoes:[]};
  const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  root.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;object.receiveShadow=true;
    if(!object.userData[materialCache]){
      const sources=Array.isArray(object.material)?object.material:[object.material];
      object.userData[materialCache]=sources.map(material=>material?.clone?.()||material);
      object.material=Array.isArray(object.material)?object.userData[materialCache]:object.userData[materialCache][0];
    }
    const materials=object.userData[materialCache],label=object.name+' '+materials.map(material=>material?.name||'').join(' '),declared=object.userData?.alteraSlot;
    const slot=declared&&slots[declared]?declared:Object.keys(patterns).find(key=>patterns[key].test(label));
    if(slot)slots[slot].push(object);
    for(const material of materials){
      if(!material)continue;
      const skinMaterial=patterns.skin.test(label),eyeSurface=/eye|cornea|iris|sclera/i.test(label);
      material.envMapIntensity=skinMaterial?.72:eyeSurface?1.15:.9;
      if(material.map){material.map.colorSpace=T.SRGBColorSpace;material.map.anisotropy=anisotropy}
      if(material.normalMap)material.normalMap.anisotropy=anisotropy;
      if(skinMaterial){material.roughness=Math.max(.46,material.roughness??.5);material.metalness=0;if('sheen' in material){material.sheen=.1;material.sheenRoughness=.82;material.sheenColor?.set(0xffb49b)}}
      else if(eyeSurface){material.roughness=/cornea/i.test(label)?.08:.18;material.metalness=0;if('clearcoat' in material){material.clearcoat=/cornea/i.test(label)?.55:.28;material.clearcoatRoughness=.1}}
      else if(patterns.hair.test(label)){material.roughness=.48;material.alphaTest=Math.max(.18,material.alphaTest||0);material.side=T.DoubleSide}
      else if(/cloth|shirt|cargo|pants/i.test(label)){material.roughness=Math.max(.7,material.roughness??.75);material.metalness=Math.min(.03,material.metalness??0)}
      material.needsUpdate=true;
    }
  });
  const colors={skin:state.skin,eyes:state.eye,hair:state.hair,top:state.topColor,bottom:state.bottomColor};
  for(const[slot,color]of Object.entries(colors)){
    const selected=new T.Color(color),tint=slot==='skin'?new T.Color(0xffffff).lerp(selected,.38):slot==='hair'?new T.Color(0xffffff).lerp(selected,.72):selected;
    for(const mesh of slots[slot])for(const material of(Array.isArray(mesh.material)?mesh.material:[mesh.material]))material.color?.copy(tint);
  }
  for(const slot of['hair','top','bottom','shoes']){
    const meshes=slots[slot],available=[...new Set(meshes.map(meshVariant).filter(Boolean))],requested=variants[slot][state[slot==='hair'?'hairStyle':slot]],selected=available.includes(requested)?requested:available[0];
    if(selected)for(const mesh of meshes)mesh.visible=meshVariant(mesh)===selected;
  }
  const morph=(names,value)=>root.traverse(object=>{if(!object.morphTargetDictionary||!object.morphTargetInfluences)return;for(const name of names){const index=object.morphTargetDictionary[name];if(index!==undefined){object.morphTargetInfluences[index]=T.MathUtils.clamp(value,0,1);break}}});
  morph(['BodySlim'],Math.max(0,(1-state.body)/.18));morph(['BodyWide'],Math.max(0,(state.body-1)/.2));morph(['BodyMuscular'],state.muscle||0);morph(['GenderFemale'],state.gender==='Kvinne'?1:0);morph(['FaceSoft','FaceSoftness'],state.faceSoftness);morph(['EyeSize','EyesSize'],state.eyeSize);morph(['NoseWide','NoseWidth'],state.noseWidth);morph(['LipFull','LipFullness'],state.lipFullness);
  return slots;
}

export function createAvatarActions(T,model,animations=[]){
  const mixer=new T.AnimationMixer(model),idle=animations.find(clip=>/idle|stand|breath/i.test(clip.name))||animations[0],walk=animations.find(clip=>/walk|locomotion/i.test(clip.name))||animations[Math.min(1,animations.length-1)];
  return{mixer,actions:{idle:idle?mixer.clipAction(idle):null,walk:walk?mixer.clipAction(walk):null}};
}
