const fs=require('fs');
const assert=require('assert');

const read=file=>fs.readFileSync(file,'utf8');
const studioHtml=read('avatar-studio.html');
const studioJs=read('avatar-studio.js');
const rigJs=read('rigged-avatar.js');
const worldHtml=read('world.html');
const worldJs=read('world.js');

function ids(html){return new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]))}
function referencedIds(js){return new Set([...js.matchAll(/\$\('([^']+)'\)|getElementById\('([^']+)'\)/g)].map(match=>match[1]||match[2]))}
function requireDomContract(html,js,label){const available=ids(html),missing=[...referencedIds(js)].filter(id=>!available.has(id));assert.deepStrictEqual(missing,[],label+' mangler DOM-ID-er: '+missing.join(', '))}

requireDomContract(studioHtml,studioJs+rigJs,'Avatar Studio');
requireDomContract(worldHtml,worldJs,'Night Lounge');
assert(studioHtml.includes('href="world.html"'),'Studio må lenke til spillverdenen');
assert(worldHtml.includes('href="avatar-studio.html"'),'Spillverdenen må lenke tilbake til Studio');
assert(studioJs.includes("altera-avatar-reference-v3"),'Studio bruker ikke felles avatarstate');
assert(worldJs.includes("altera-avatar-reference-v3"),'Spillet bruker ikke felles avatarstate');
assert(worldJs.includes('assets/characters/mpfb-builder-v1/avatar.glb'),'Spillet laster ikke den riggede produksjonsavataren');
assert(worldHtml.includes('@dimforge/rapier3d-compat@0.21.0'),'Rapier-versjonen skal være låst');
assert(worldJs.includes("setAnimation(moving?'walk':'idle')"),'Bevegelse må styre Walk/Idle');
assert(!studioHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
assert(!worldHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
for(const category of ['Ansikt','Hår','Kropp','Klær','Farger'])assert(studioJs.includes(category),'Mangler Studio-kategori: '+category);

console.log('App contracts passed: shared avatar state, bidirectional flow, rigged GLB, physics and DOM bindings.');
