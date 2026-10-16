export function movementVector(left,right,forward,backward,yaw=0){
 const x=Number(Boolean(right))-Number(Boolean(left));
 const z=Number(Boolean(backward))-Number(Boolean(forward));
 const length=Math.hypot(x,z);
 if(!length)return {x:0,z:0};
 const nx=x/length,nz=z/length;
 return {x:Math.cos(yaw)*nx+Math.sin(yaw)*nz,z:-Math.sin(yaw)*nx+Math.cos(yaw)*nz};
}
export function nearestTarget(targets,position,maxDistance=2.1){
 let closest=null,distance=maxDistance;
 for(const target of targets){const d=Math.hypot(target.x-position.x,target.z-position.z);if(d<distance){distance=d;closest=target}}
 return closest;
}
