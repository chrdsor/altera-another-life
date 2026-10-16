export const districtPlaces=Object.freeze([
 {id:'quay',name:'Nordkaien',x:-5,z:-12,color:'#79c7e6',symbol:'⚓'},
 {id:'cafe',name:'Kafé Varm',x:5,z:-24,color:'#ffc18b',symbol:'☕'},
 {id:'gallery',name:'Galleri 01',x:-5,z:-39,color:'#b8a4ff',symbol:'◆'},
 {id:'home',name:'Mitt hjem',x:5,z:-55,color:'#8ce1b4',symbol:'⌂'}
]);
export function mapPoint(x,z,width=200,height=250){
 return {x:width*(x+14)/28,y:height*(9-z)/78};
}
export function destinationForQuest(step){
 return step==='meet'||step==='return'?'cafe':step==='visit'?'quay':'home';
}
export function distanceToPlace(player,place){return Math.round(Math.hypot(player.x-place.x,player.z-place.z))}
