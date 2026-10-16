// Lightweight procedural art pass. No external assets; optimized for mobile WebGL.
export function buildHarborScene(T,scene){
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.84,...extra});
 const mats=new Map();
 function box(w,h,d,x,y,z,color,rot=0){
  const key=String(color),mat=mats.get(key)||material(color);mats.set(key,mat);
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.rotation.y=rot;scene.add(mesh);return mesh;
 }
 function cyl(r,h,x,y,z,color,sides=8){
  const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,sides),material(color));mesh.position.set(x,y,z);scene.add(mesh);return mesh;
 }
 // Sea to the west, stone promenade, warmer pavement edges.
 box(18,.07,92,-18,-.13,-29,0x386d80);
 box(2.8,.10,90,-5.45,-.035,-29,0x9c8b78);
 box(1.8,.10,90,5.65,-.035,-29,0x9c8b78);
 // Repeating pavers, restrained geometry count for phones.
 for(let z=8;z>-70;z-=2.8){
  for(const x of [-6.1,-4.9,5.2,6.2]){
   box(.045,.012,2.55,x,.026,z,0x786f67);
  }
 }
 // Harbor railings and mooring posts.
 for(let z=7;z>-68;z-=6){
  cyl(.095,1.0,-6.35,.50,z,0x233f49);
  box(.055,.055,5.9,-6.35,.85,z-3,0x496b70);
  box(.055,.055,5.9,-6.35,.47,z-3,0x496b70);
 }
 // Scandinavian façades: pitched roofs, contrasting storefronts, lit windows.
 const palettes=[0xc77c61,0xd4aa78,0x9fae9d,0xe0bf94,0x9f8586,0xb2b6bb];
 for(let i=0;i<7;i++){
  const z=6-i*12.7;
  const color=palettes[i%palettes.length];
  box(4.8,4.9,7.1,9.1,2.45,z,color);
  box(5.3,.28,7.8,9.1,5.1,z,0x534b4a);
  for(const zz of [z-2,z,z+2]){
   for(const yy of [2.1,3.65]){
    box(.12,.86,.92,6.63,yy,zz,0x3c6672);
    box(.13,.09,.99,6.55,yy+.48,zz,0xe8d8b6);
    box(.13,.09,.99,6.55,yy-.48,zz,0xe8d8b6);
   }
  }
 }
 // Café Varm: storefront centered near the actual café interaction location.
 box(.17,2.65,6.4,6.58,1.35,-24,0x4b302a);
 for(const z of [-26.3,-24,-21.7]){
  box(.12,1.9,1.65,6.42,1.6,z,0x8cc3c6);
  box(.16,.15,1.8,6.31,2.52,z,0xe7c796);
 }
 box(2.1,.15,6.8,5.85,2.86,-24,0xa44936);
 for(let z=-27;z<=-21;z+=2.0){
  box(.1,.75,.12,4.7,.38,z,0x3f352e);
  cyl(.42,.07,4.7,.77,z,0x886c54);
  box(.38,.12,.38,4.2,.47,z+.55,0x534638);
 }
 // Planters along the café, and old-fashioned harbor lamps.
 for(const z of [-28.4,-20.1,-9,-38,-51]){
  box(.66,.55,.66,5.6,.27,z,0x8b6754);
  cyl(.36,.78,5.6,.93,z,0x466e4a,7);
 }
 for(let z=2;z>-70;z-=13){
  cyl(.07,3.4,-4.7,1.7,z,0x24333a);
  box(.4,.36,.4,-4.7,3.4,z,0xf5c98a);
  const glow=new T.PointLight(0xffc47b,.65,7,2);glow.position.set(-4.7,3.1,z);scene.add(glow);
 }
 // Quay sign and recognizable boat silhouettes beyond the rail.
 for(const z of [-13,-37]){
  box(2.7,.12,1.2,-10.8,-.04,z,0x92775b);
  box(.12,.9,.12,-11.5,.43,z,0x443f37);
  box(.12,.9,.12,-10,.43,z,0x443f37);
  box(2.3,.35,.85,-13,-.12,z-2,0xe4d6bf);
  cyl(.035,4,-13,1.85,z-2,0xddddcc);
 }
 return {dispose(){/* Scene is disposed with the game renderer. */}};
}
