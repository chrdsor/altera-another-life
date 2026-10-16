import {districtPlaces,mapPoint,destinationForQuest,distanceToPlace,walkingRoute} from './alpha-wayfinding.mjs';
export function makeWorldLabel(T,title,subtitle='',accent='#f6d49e',scale=1){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');
 ctx.fillStyle='rgba(15,28,39,.93)';ctx.beginPath();ctx.roundRect(7,7,498,146,20);ctx.fill();
 ctx.strokeStyle=accent;ctx.lineWidth=6;ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.font='bold 46px system-ui';ctx.fillText(title,256,69);
 if(subtitle){ctx.fillStyle='#e7d9c4';ctx.font='26px system-ui';ctx.fillText(subtitle,256,116)}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
 sprite.scale.set(3.4*scale,1.06*scale,1);return sprite;
}
export function createDistrictMap(canvas,places=districtPlaces){
 const ctx=canvas.getContext('2d');if(!ctx)return ()=>{};
 return function draw(player,step,selectedId=null){
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#162e40';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#17445c';ctx.fillRect(0,0,w*.25,h);
  ctx.fillStyle='#435562';ctx.fillRect(w*.26,0,w*.74,h);
  ctx.fillStyle='#73858b';ctx.fillRect(w*.46,0,w*.22,h);
  ctx.fillStyle='#d8c7a2';ctx.fillRect(w*.55,0,3,h);
  const destination=selectedId||destinationForQuest(step);const selected=places.find(p=>p.id===destination);if(selected){const route=walkingRoute(player,selected);ctx.strokeStyle='#53baff';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();route.forEach((point,i)=>{const q=mapPoint(point.x,point.z,w,h);if(i===0)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)});ctx.stroke()}
  for(const place of places){
   const p=mapPoint(place.x,place.z,w,h);
   ctx.beginPath();ctx.arc(p.x,p.y,place.id===destination?8:6,0,Math.PI*2);
   ctx.fillStyle=place.color;ctx.fill();ctx.strokeStyle=place.id===destination?'#fff':'#152633';ctx.lineWidth=place.id===destination?3:1.5;ctx.stroke();
   ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign=place.x<0?'left':'right';
   const labelX=place.x<0?p.x+10:p.x-10;
   ctx.fillText(place.name,labelX,p.y-11);ctx.font='9px system-ui';ctx.fillText(place.address||'',labelX,p.y+19);
  }
  const here=mapPoint(player.x,player.z,w,h);
  ctx.beginPath();ctx.arc(here.x,here.y,5,0,Math.PI*2);ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle='#0d1d2b';ctx.lineWidth=2;ctx.stroke();
  const target=places.find(p=>p.id===destination);
  return target?{name:target.name,distance:distanceToPlace(player,target)}:null;
 };
}
