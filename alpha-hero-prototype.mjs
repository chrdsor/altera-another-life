// Hero 001 native rig prototype. Authored procedural geometry, no third-party art.
// A real THREE.SkinnedMesh and Skeleton drive the torso; limbs are bone-parented.
export function createHero001Prototype(T,appearance={}){
 const root=new T.Group();root.name='Hero001Prototype';
 const skin=appearance.skin??0xdba885,hair=appearance.hair??0x49352b,coat=appearance.coat??0x30485e;
 const mat=(color)=>new T.MeshStandardMaterial({color,roughness:.78});
 const hips=new T.Bone();hips.name='Hips';hips.position.y=.86;root.add(hips);
 const spine=new T.Bone();spine.name='Spine';spine.position.y=.38;hips.add(spine);
 const headBone=new T.Bone();headBone.name='Head';headBone.position.y=.63;spine.add(headBone);
 const limbBones={arms:[],legs:[]};
 function mesh(parent,geometry,color,x,y,z){const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);parent.add(m);return m}
 // Skinned torso with two weighted joint influences.
 const geometry=new T.CylinderGeometry(.28,.235,.73,12,8);
 geometry.translate(0,.34,0);
 const indices=[],weights=[],v=new T.Vector3();
 for(let i=0;i<geometry.attributes.position.count;i++){
  v.fromBufferAttribute(geometry.attributes.position,i);
  const upper=T.MathUtils.clamp((v.y-.16)/.45,0,1);
  indices.push(0,1,0,0);weights.push(1-upper,upper,0,0);
 }
 geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
 geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
 const torso=new T.SkinnedMesh(geometry,mat(coat));torso.name='Hero001Torso';
 torso.position.y=.86;root.add(torso);
 const skeleton=new T.Skeleton([hips,spine]);torso.bind(skeleton);
 mesh(spine,new T.CylinderGeometry(.11,.11,.18,10),skin,0,.56,0);
 const face=mesh(headBone,new T.SphereGeometry(.215,16,12),skin,0,.23,0);face.scale.set(.94,1.15,.91);
 const cap=mesh(headBone,new T.SphereGeometry(.224,16,10,0,Math.PI*2,0,Math.PI*.52),hair,0,.34,.008);
 for(const x of [-.085,.085])mesh(headBone,new T.SphereGeometry(.022,8,6),appearance.eye??0x293a43,x,.25,-.205);
 mesh(headBone,new T.SphereGeometry(.033,8,6),skin,0,.17,-.211);
 for(const side of [-1,1]){
  const arm=new T.Bone();arm.name=side<0?'LeftUpperArm':'RightUpperArm';arm.position.set(side*.32,.49,0);spine.add(arm);
  mesh(arm,new T.CapsuleGeometry(.085,.32,4,8),coat,0,-.23,0);
  mesh(arm,new T.SphereGeometry(.085,8,6),skin,0,-.48,0);
  limbBones.arms.push(arm);
  const leg=new T.Bone();leg.name=side<0?'LeftUpperLeg':'RightUpperLeg';leg.position.set(side*.15,-.04,0);hips.add(leg);
  mesh(leg,new T.CapsuleGeometry(.115,.39,4,8),appearance.bottom??0x303b48,0,-.35,0);
  mesh(leg,new T.BoxGeometry(.22,.14,.35),appearance.shoes??0x24292d,0,-.72,-.08);
  limbBones.legs.push(leg);
 }
 root.userData.rig={hips,spine,headBone,...limbBones};
 root.userData.appearance=appearance;
 root.scale.x=T.MathUtils.clamp(appearance.body??1,.82,1.2);
 return root;
}
export function animateHero001Prototype(root,elapsed,speed){
 const rig=root.userData.rig;if(!rig)return;
 const stride=Math.min(1,Math.max(0,speed/3.5));
 const phase=Math.sin(elapsed*9.5)*.48*stride;
 rig.legs[0].rotation.x=phase;rig.legs[1].rotation.x=-phase;
 rig.arms[0].rotation.x=-phase*.75;rig.arms[1].rotation.x=phase*.75;
 rig.spine.rotation.z=Math.sin(elapsed*2)*.012;
 rig.headBone.rotation.y=Math.sin(elapsed*1.4)*.035*(1-stride);
}
