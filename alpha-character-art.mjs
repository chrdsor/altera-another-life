// Small stylized human figures, using reusable geometry and simple materials.
export function makeCharacter(T,{coat=0x30485e,skin=0xdba885,hair=0x49352b,apron=false}={}){
 const group=new T.Group(),mat=c=>new T.MeshStandardMaterial({color:c,roughness:.88});
 const add=(geometry,color,x,y,z)=>{const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);group.add(m);return m};
 add(new T.CapsuleGeometry(.27,.53,5,10),coat,0,1.16,0);
 add(new T.SphereGeometry(.205,12,10),skin,0,1.84,0);
 add(new T.SphereGeometry(.21,12,10,0,Math.PI*2,0,Math.PI*.53),hair,0,1.94,0);
 const limbs={arms:[],legs:[]};
 for(const x of [-.31,.31]){const arm=add(new T.CapsuleGeometry(.085,.47,4,8),coat,x,1.11,0);arm.rotation.z=x<0?-.12:.12;limbs.arms.push(arm)}
 for(const x of [-.14,.14]){const leg=add(new T.CapsuleGeometry(.105,.48,4,8),0x25303a,x,.42,0);limbs.legs.push(leg);add(new T.BoxGeometry(.23,.13,.37),0x25292e,x,.095,-.08)}
 if(apron){add(new T.BoxGeometry(.46,.69,.045),0xe3d4b9,0,1.06,-.27);add(new T.BoxGeometry(.46,.08,.07),0x684e3f,0,1.38,-.30)}
 group.userData.limbs=limbs;
 return group;
}

export function animateCharacter(character,elapsed,speed=0){const limbs=character.userData.limbs;if(!limbs)return;const stride=Math.min(speed/3.5,1),swing=Math.sin(elapsed*10)*.42*stride;limbs.legs[0].rotation.x=swing;limbs.legs[1].rotation.x=-swing;limbs.arms[0].rotation.x=-swing*.7;limbs.arms[1].rotation.x=swing*.7;}
