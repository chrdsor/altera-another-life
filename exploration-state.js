// ALTERA World Foundations: local exploration journal, NOT authoritative ownership or currency.
export const EXPLORATION_KEY='altera-exploration-v1';
export const AREAS=['city_01','village_01','highlands_01','coast_01'];
export const POIS=Object.freeze({
 city_01:[{id:'harbor',name:'Havnepromenaden',x:16,z:12},{id:'market',name:'Handlegaten',x:-16,z:12}],
 village_01:[{id:'village-square',name:'Landsbytorget',x:16,z:12},{id:'farm',name:'Gårdsveien',x:-16,z:12}],
 highlands_01:[{id:'lodge',name:'Fjellstua',x:16,z:12},{id:'trail',name:'Turstien',x:-16,z:12}],
 coast_01:[{id:'marina',name:'Småbåthavna',x:16,z:12},{id:'boathouse',name:'Sjøhusene',x:-16,z:12}]
});
export function emptyExploration(){return {version:1,currentArea:'city_01',visitedAreas:['city_01'],discovered:[],updatedAt:null}}
export function normalizeExploration(value){
 const out=emptyExploration();
 if(!value||typeof value!=='object')return out;
 if(AREAS.includes(value.currentArea))out.currentArea=value.currentArea;
 if(Array.isArray(value.visitedAreas))out.visitedAreas=[...new Set(value.visitedAreas.filter(a=>AREAS.includes(a)))];
 if(!out.visitedAreas.includes(out.currentArea))out.visitedAreas.push(out.currentArea);
 const known=new Set(Object.entries(POIS).flatMap(([area,pois])=>pois.map(p=>area+':'+p.id)));
 if(Array.isArray(value.discovered))out.discovered=[...new Set(value.discovered.filter(p=>typeof p==='string'&&known.has(p)))];
 return out;
}
export function visitArea(state,area){if(!AREAS.includes(area))throw new Error('Unknown area');const next=normalizeExploration(state);next.currentArea=area;if(!next.visitedAreas.includes(area))next.visitedAreas.push(area);return next}
export function discoverPoi(state,area,poi){if(!POIS[area]?.some(p=>p.id===poi))throw new Error('Unknown point of interest');const next=normalizeExploration(state);const key=area+':'+poi;if(!next.discovered.includes(key))next.discovered.push(key);return next}
export function readExploration(storage){try{return normalizeExploration(JSON.parse(storage?.getItem(EXPLORATION_KEY)||'null'))}catch{return emptyExploration()}}
export function writeExploration(storage,state){const next=normalizeExploration(state);next.updatedAt=new Date().toISOString();try{storage?.setItem(EXPLORATION_KEY,JSON.stringify(next))}catch{}return next}
