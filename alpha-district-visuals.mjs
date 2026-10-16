// District 01 visual rebuild: coherent street composition, no downloaded assets.
export function buildDistrictVisuals(T,scene){
 const mats=new Map(),mat=(c,em=0)=>{const key=c+':'+em;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:.8,emissive:em,emissiveIntensity:em?.42:0}));return mats.get(key)};
 function block(w,h,d,x,y,z,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);scene.add(m);return m}
 function panel(text,w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#292421';g.fillRect(0,0,w,h);g.strokeStyle='#c8a16b';g.lineWidth=10;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#ffe5ad';g.textAlign='center';g.font='bold 54px system-ui';g.fillText(text,w/2,h/2+19);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:tx})}
 // Wide warm stone-paved pedestrian street, sea on the left.
 block(13,.035,88,-.3,.04,-29,0x988675);
 block(1.25,.07,88,-5.8,.055,-29,0x6c716c);
 block(1.15,.06,88,5.8,.055,-29,0xb6a38d);
 block(14,.025,90,-17,-.02,-29,0x356a78);
 for(let z=8;z>-68;z-=1.9){
  block(11.7,.012,.045,-.3,.066,z,0x786b5f);
  for(let x=-5.4;x<5.6;x+=1.1)block(.04,.012,1.8,x+((Math.round(z)%2)*.55),.067,z-.95,0x786b5f);
 }
 // Layered townhouses with recognizable roofs, windows, café and shopfronts.
 const colors=[0xb9694f,0xd7b589,0x8d9d8d,0xd6a178,0xb7a7a0,0xb4bdc1];
 for(let i=0;i<7;i++){
  const z=5-i*12.5,c=colors[i%colors.length],h=6.5+(i%3)*.75;
  block(4.6,h,10.9,8.9,h/2,z,c);
  const roof=new T.Mesh(new T.ConeGeometry(4.1,2.2,4),mat(0x514d52));roof.rotation.y=Math.PI/4;roof.scale.z=1.5;roof.position.set(8.9,h+1,z);scene.add(roof);
  block(.22,.35,11.2,6.49,h-.25,z,0xe9d6b5);
  for(const dz of [-3.3,0,3.3])for(const yy of [3.6,5.1]){
   block(.12,1.12,1.35,6.52,yy,z+dz,0x324e59);
   block(.15,.09,1.5,6.42,yy+.58,z+dz,0xf0d5aa);
   block(.15,.09,1.5,6.42,yy-.58,z+dz,0xf0d5aa);
   block(.16,1.2,.08,6.41,yy,z+dz,0xe5d1b4);
  }
  block(.7,.25,10.7,6.1,2.85,z,0x63524a);
  for(const dz of [-3.4,0,3.4])block(.16,2.4,2.3,6.35,1.45,z+dz,0x446978);
 }
 // Café Varm, a visually dominant destination at the exact quest coordinate.
 block(1.8,.21,10.5,5.65,3.06,-24,0x9e4333);
 const sign=new T.Mesh(new T.PlaneGeometry(3.9,.95),panel('KAFÉ VARM'));sign.rotation.y=-Math.PI/2;sign.position.set(6.38,4.04,-24);scene.add(sign);
 for(const z of [-28,-25,-22,-19]){
  block(.7,.6,.7,5.35,.3,z,0x9b7053);
  const bush=new T.Mesh(new T.DodecahedronGeometry(.53,0),mat(0x496b49));bush.position.set(5.35,.9,z);scene.add(bush);
 }
 for(const z of [-27,-24,-21]){block(.85,.08,.85,4.35,.82,z,0x76543e);block(.11,.8,.11,4.35,.41,z,0x3b3938)}
 // Pier-side railings, benches, bollards and illuminated lamps.
 for(let z=7;z>-67;z-=5.5){
  block(.11,1,.11,-6.25,.53,z,0x293c45);
  block(.08,.09,5.5,-6.25,.95,z-2.75,0x506a6d);
 }
 for(const z of [-7,-17,-35,-52]){
  block(1,.15,1.7,-4.8,.58,z,0x997355);
  block(.15,.65,1.7,-5.15,.95,z,0x997355);
 }
 for(let z=1;z>-65;z-=13){
  block(.13,3.3,.13,-5.55,1.65,z,0x30363b);
  block(.5,.48,.5,-5.55,3.45,z,0xffd2a1);
  const light=new T.PointLight(0xffba75,.65,6);light.position.set(-5.55,3.2,z);scene.add(light);
 }
 // A readable quay landmark and sailboats beyond the rail.
 const quay=new T.Mesh(new T.PlaneGeometry(2.8,.65),panel('NORDKAIEN'));quay.rotation.y=Math.PI/2;quay.position.set(-6.1,2.2,-12);scene.add(quay);
 for(const z of [-13,-39]){
  block(2,.4,4,-11,-.12,z,0xe1d7c7);
  block(.08,4,.08,-11,1.9,z,0xe4d8bf);
  const sail=new T.Mesh(new T.ConeGeometry(1.2,3.4,3),mat(0xe4d9ca));sail.rotation.y=.3;sail.position.set(-11,1.9,z-.45);scene.add(sail);
 }
}
