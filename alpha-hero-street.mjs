// District 01 hero street: authored reusable low-poly street kit.
// No external assets. Keep draw calls limited by grouping identical props.
export function buildHeroStreet(T,scene){
 const material=(color,roughness=.82)=>new T.MeshStandardMaterial({color,roughness});
 const palette={stone:material(0xaaa092),grout:material(0x7d7772),timber:material(0x6d4b37),metal:material(0x343e43),leaf:material(0x45634b),flower:material(0xc48c80),glass:material(0x385d66,.27),warm:material(0xe5c394),brass:material(0x967747)};
 const geo=new Map();
 const cube=(w,h,d)=>{const k=[w,h,d].join(':');if(!geo.has(k))geo.set(k,new T.BoxGeometry(w,h,d));return geo.get(k)};
 function box(w,h,d,x,y,z,mat,group=scene){const o=new T.Mesh(cube(w,h,d),mat);o.position.set(x,y,z);group.add(o);return o}
 const stone=palette.stone,metal=palette.metal,timber=palette.timber;
 // Café-facing entrance arch: strong focal silhouette, visible from the spawn direction.
 const entrance=new T.Group();entrance.position.set(6.1,0,-24);scene.add(entrance);
 box(.24,2.9,.23,-.23,1.5,-1.2,stone,entrance);box(.24,2.9,.23,-.23,1.5,1.2,stone,entrance);
 box(.28,.22,2.8,-.25,3.02,0,stone,entrance);
 box(.13,2.45,2.2,-.39,1.52,0,palette.glass,entrance);
 box(.16,2.6,.11,-.49,1.48,0,timber,entrance);
 box(.1,.12,.19,-.58,1.42,-.22,palette.brass,entrance);
 // Warm interior glow at the entry, not a replacement for the interior scene.
 const glow=new T.Mesh(new T.PlaneGeometry(2.3,2.45),new T.MeshBasicMaterial({color:0xf4bc76,transparent:true,opacity:.16,side:T.DoubleSide}));glow.rotation.y=Math.PI/2;glow.position.set(-.42,1.5,0);entrance.add(glow);
 // Cafe outdoor seating: grouped furnishings and textured planter silhouettes.
 for(const z of [-29,-25,-21]){
  box(.85,.08,.85,4.1,.82,z,timber);box(.11,.74,.11,4.1,.42,z,metal);
  for(const dz of [-.65,.65]){
   box(.55,.08,.46,4.15,.45,z+dz,timber);
   box(.09,.47,.09,4.15,.23,z+dz,metal);
   box(.55,.46,.09,4.15,.72,z+dz+Math.sign(dz)*.2,timber);
  }
 }
 // Street furnishing kit: tree pits, tapered trunks, foliage and small lamps.
 for(const z of [-3,-15,-34,-49,-61]){
  box(1.35,.08,1.35,3.7,.12,z,palette.grout);
  const trunk=new T.Mesh(new T.CylinderGeometry(.11,.17,2.5,7),timber);trunk.position.set(3.7,1.4,z);scene.add(trunk);
  const crown=new T.Mesh(new T.IcosahedronGeometry(1.12,1),palette.leaf);crown.position.set(3.7,3.1,z);crown.scale.set(.85,1.15,.85);scene.add(crown);
  const accent=new T.Mesh(new T.IcosahedronGeometry(.56,0),palette.leaf);accent.position.set(3.25,2.7,z+.4);scene.add(accent);
 }
 // Distinctive quay-side bollards and nautical ropes; useful scale references.
 for(const z of [-4,-12,-20,-28,-36,-44,-52]){
  const base=new T.Mesh(new T.CylinderGeometry(.2,.24,.38,10),metal);base.position.set(-5.65,.26,z);scene.add(base);
  box(.52,.09,.16,-5.65,.5,z,metal);
 }
 // Reusable cycle racks and litter bins.
 for(const z of [-10,-43]){
  for(let i=0;i<3;i++){
   const hoop=new T.Mesh(new T.TorusGeometry(.44,.055,6,12,Math.PI),metal);
   hoop.rotation.y=Math.PI/2;hoop.position.set(4.95,.48,z+i*.7);scene.add(hoop);
  }
  const bin=new T.Mesh(new T.CylinderGeometry(.29,.25,.82,10),metal);bin.position.set(-4.65,.45,z);scene.add(bin);
  const lid=new T.Mesh(new T.CylinderGeometry(.32,.32,.07,10),palette.brass);lid.position.set(-4.65,.89,z);scene.add(lid);
 }
 // Facade-mounted warm light accents at the café and gallery.
 for(const z of [-27,-21,-42,-36]){
  box(.18,.35,.25,6.18,2.72,z,metal);
  box(.2,.25,.3,6.03,2.53,z,palette.warm);
 }
}
