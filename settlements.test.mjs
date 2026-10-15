import {SETTLEMENTS,BIOMES,getSettlement,validateSettlement} from './settlements.js';
if(SETTLEMENTS.length!==4)throw new Error('Expected four test settlements');
for(const s of SETTLEMENTS){const errors=validateSettlement(s);if(errors.length)throw new Error(s.id+': '+errors.join(', '));}
if(new Set(SETTLEMENTS.map(s=>s.id)).size!==SETTLEMENTS.length)throw new Error('Duplicate settlement IDs');
if(new Set(SETTLEMENTS.map(s=>s.biome)).size!==BIOMES.length)throw new Error('Missing biome coverage');
if(getSettlement('city_01')?.targetHomes!==10||getSettlement('unknown')!==null)throw new Error('Lookup failed');
if(!validateSettlement({...SETTLEMENTS[0],spawn:[NaN,0,0]}).length)throw new Error('Invalid spawn accepted');
console.log('Four settlement manifests validated');
