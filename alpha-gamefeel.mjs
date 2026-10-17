// Shared, testable third-person motion helpers. No DOM or Three.js dependency.
export function damp(current,target,rate,dt){return current+(target-current)*(1-Math.exp(-rate*Math.max(0,dt)))}
export function stepMotion(currentX,currentZ,inputX,inputZ,dt,{acceleration=11,deceleration=15,maxSpeed=3.5}={}){
 const active=Math.hypot(inputX,inputZ)>0.001,rate=active?acceleration:deceleration;
 const mag=Math.hypot(inputX,inputZ)||1;
 return {x:damp(currentX,active?inputX/mag*maxSpeed:0,rate,dt),z:damp(currentZ,active?inputZ/mag*maxSpeed:0,rate,dt)};
}
export function cameraDistanceFromWalls(origin,desired,obstacles,{padding=.45,minDistance=1.35}={}){
 // Conservative XZ segment vs expanded AABB; reduces wall clipping on mobile.
 const dx=desired.x-origin.x,dz=desired.z-origin.z,full=Math.hypot(dx,dz);
 if(full<1e-5)return 1;
 let fraction=1;
 for(const o of obstacles){
  const minX=o.x-o.w/2-padding,maxX=o.x+o.w/2+padding;
  const minZ=o.z-o.d/2-padding,maxZ=o.z+o.d/2+padding;
  let t0=0,t1=1;
  for(const [p,v,lo,hi] of [[origin.x,dx,minX,maxX],[origin.z,dz,minZ,maxZ]]){
   if(Math.abs(v)<1e-8){if(p<lo||p>hi){t0=2;break}continue}
   const a=(lo-p)/v,b=(hi-p)/v;t0=Math.max(t0,Math.min(a,b));t1=Math.min(t1,Math.max(a,b));
  }
  if(t0<=t1&&t0>=0&&t0<=1)fraction=Math.min(fraction,Math.max(0,t0-.04));
 }
 return Math.max(Math.min(1,minDistance/full),fraction);
}
