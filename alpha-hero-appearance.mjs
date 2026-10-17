// Stable semantic material slots for Hero 001 glTF meshes.
// Artist contract: material names should be Skin, Hair, Top, Bottom, Shoes, Eyes.
// Unknown materials and meshes are deliberately left unchanged.
export const HERO_MATERIAL_SLOTS=Object.freeze({skin:'skin',hair:'hair',top:'coat',bottom:'bottom',shoes:'shoes',eyes:'eye'});
export function appearanceSlot(name){
 const normalized=String(name||'').toLowerCase().replace(/[^a-z]/g,'');
 const exact=Object.keys(HERO_MATERIAL_SLOTS).find(key=>normalized===key||normalized===key+'material');
 return exact?HERO_MATERIAL_SLOTS[exact]:null;
}
export function applyHeroAppearance(root,appearance){
 let updated=0;
 root.traverse(object=>{
  if(!object.isMesh&&!object.isSkinnedMesh)return;
  const materials=Array.isArray(object.material)?object.material:[object.material];
  const changed=materials.map(material=>{
   if(!material)return material;
   const key=appearanceSlot(material.name),value=key&&appearance[key];
   if(!Number.isInteger(value)||!material.color?.setHex)return material;
   const clone=material.clone();
   clone.color.setHex(value);
   updated++;
   return clone;
  });
  if(changed.some((material,index)=>material!==materials[index]))object.material=Array.isArray(object.material)?changed:changed[0];
 });
 return updated;
}

// Optional Blender/glTF morph named BodyWidth, mapped to the Studio body slider.
// Does not modify bone transforms or invent unsupported clothing meshes.
export function applyHeroMorphs(root,appearance){
 const width=Number(appearance?.body);
 if(!Number.isFinite(width))return 0;
 const weight=Math.max(0,Math.min(1,(width-.82)/(.38)));
 let count=0;
 root.traverse(object=>{
  const dictionary=object.morphTargetDictionary,values=object.morphTargetInfluences;
  if(!dictionary||!values)return;
  const index=dictionary.BodyWidth??dictionary.bodyWidth;
  if(Number.isInteger(index)&&index>=0&&index<values.length){values[index]=weight;count++}
 });
 return count;
}
