// ALTERA District 01: consistent, lightweight character kit.
// Procedural art is a temporary fallback until a licensed rigged Hero 001 GLB is ready.
export function makeCharacter(T,{coat=0x30485e,skin=0xdba885,hair=0x49352b,apron=false,style='short'}={}){
 const group=new T.Group(),cache=new Map();
 const mat=(c)=>{if(!cache.has(c))cache.set(c,new T.MeshStandardMaterial({color:c,roughness:.86}));return cache.get(c)};
 const add=(geometry,color,x,y,z,parent=group)=>{const mesh=new T.Mesh(geometry,mat(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh};
 const box=(w,h,d,c,x,y,z,parent)=>add(new T.BoxGeometry(w,h,d),c,x,y,z,parent);
 const skinTone=skin,cloth=coat,denim=0x303b48,shoes=0x24292d;
 // The torso tapers toward the waist; a layered collar makes the silhouette less cylindrical.
 const torso=add(new T.CylinderGeometry(.34,.245,.79,10),cloth,0,1.22,0);
 box(.45,.12,.26,0xe5dacb,0,1.61,-.02);
 const neck=add(new T.CylinderGeometry(.105,.11,.17,10),skinTone,0,1.69,0);
 const head=add(new T.SphereGeometry(.225,16,12),skinTone,0,1.92,0);
 head.scale.set(.91,1.12,.89);
 // Face looks toward local -Z, matching the existing walking orientation.
 for(const x of [-.083,.083]){
  add(new T.SphereGeometry(.026,8,6),0x29292b,x,1.955,-.202);
  add(new T.SphereGeometry(.034,8,6),hair,x,2.03,-.193);
 }
 const nose=add(new T.SphereGeometry(.034,8,6),skinTone,0,1.89,-.213);nose.scale.set(.7,.8,1.2);
 const mouth=box(.075,.013,.008,0x955e59,0,1.826,-.212);
 // Hair cap and sideburns; a second silhouette option for the café host.
 const cap=add(new T.SphereGeometry(.229,16,10,0,Math.PI*2,0,Math.PI*.51),hair,0,2.01,.012);
 if(style==='long'||apron){
  for(const x of [-.17,.17]){const strand=add(new T.CapsuleGeometry(.065,.26,4,8),hair,x,1.84,.09);strand.rotation.z=x<0?-.1:.1}
 }else{
  add(new T.SphereGeometry(.105,10,8),hair,-.115,2.115,-.02);
 }
 // Pivoted limbs: hips and shoulders stay fixed while segments swing.
 const limbs={arms:[],legs:[]};
 for(const side of [-1,1]){
  const arm=new T.Group();arm.position.set(side*.34,1.54,0);group.add(arm);
  add(new T.CapsuleGeometry(.093,.37,5,9),cloth,side*.018,-.26,0,arm);
  add(new T.SphereGeometry(.09,10,8),skinTone,side*.018,-.56,-.018,arm);
  limbs.arms.push(arm);
  const leg=new T.Group();leg.position.set(side*.145,.86,0);group.add(leg);
  add(new T.CapsuleGeometry(.125,.43,5,9),denim,0,-.37,0,leg);
  box(.245,.145,.37,shoes,0,-.745,-.09,leg);
  limbs.legs.push(leg);
 }
 if(apron){
  box(.5,.67,.06,0xe6d5b6,0,1.13,-.27);
  box(.54,.075,.09,0x765440,0,1.44,-.3);
  box(.24,.18,.075,0xc4a889,0,1.08,-.32);
 }
 group.userData.limbs=limbs;
 group.userData.torso=torso;
 group.userData.head=head;
 return group;
}
export function animateCharacter(character,elapsed,speed=0){
 const limbs=character.userData.limbs;if(!limbs)return;
 const stride=Math.min(Math.max(speed/3.5,0),1);
 const cycle=Math.sin(elapsed*9.5)*.52*stride;
 limbs.legs[0].rotation.x=cycle;
 limbs.legs[1].rotation.x=-cycle;
 limbs.arms[0].rotation.x=-cycle*.68;
 limbs.arms[1].rotation.x=cycle*.68;
 const breathing=Math.sin(elapsed*2.1)*.012;
 if(character.userData.torso)character.userData.torso.scale.y=1+breathing;
 if(character.userData.head)character.userData.head.rotation.z=Math.sin(elapsed*1.7)*.018*(1-stride);
}
