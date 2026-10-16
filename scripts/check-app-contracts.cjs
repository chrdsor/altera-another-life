const fs=require('fs');
const assert=require('assert');

const read=file=>fs.readFileSync(file,'utf8');
const studioHtml=read('avatar-studio.html');
const studioJs=read('avatar-studio.js');
const stateJs=read('avatar-state.js');
const appearanceJs=read('avatar-appearance.js');
const rigJs=read('rigged-avatar.js');
const worldHtml=read('world.html');
const worldJs=read('world.js');
const cityHtml=read('city.html');
const cityJs=read('city.js');
const cityStateJs=read('city-state.js');
const homeHtml=read('home.html');
const homeJs=read('home.js');
const homeStateJs=read('home-state.js');
const socialClientJs=read('social-client.js');
const authorityJs=read('server/authoritative-world.mjs');
const httpServerJs=read('server/http-server.mjs');

function ids(html){return new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]))}
function referencedIds(js){return new Set([...js.matchAll(/\$\('([^']+)'\)|getElementById\('([^']+)'\)/g)].map(match=>match[1]||match[2]))}
function requireDomContract(html,js,label){const available=ids(html),missing=[...referencedIds(js)].filter(id=>!available.has(id));assert.deepStrictEqual(missing,[],label+' mangler DOM-ID-er: '+missing.join(', '))}

requireDomContract(studioHtml,studioJs+rigJs,'Avatar Studio');
requireDomContract(worldHtml,worldJs,'Night Lounge');
requireDomContract(cityHtml,cityJs,'District 01');
requireDomContract(homeHtml,homeJs,'First Home');
assert(studioHtml.includes('href="world.html"'),'Studio må lenke til spillverdenen');
assert(worldHtml.includes('href="avatar-studio.html"'),'Spillverdenen må lenke tilbake til Studio');
assert(worldHtml.includes('href="city.html"'),'Night Lounge må lenke til District 01');
assert(cityHtml.includes('href="world.html"')&&cityHtml.includes('href="avatar-studio.html"'),'District 01 må lenke til Lounge og Studio');
assert(cityHtml.includes('href="home.html"'),'District 01 må lenke til First Home');
assert(homeHtml.includes('href="city.html"')&&homeHtml.includes('href="avatar-studio.html"'),'First Home må lenke til District 01 og Studio');
assert(stateJs.includes("altera-avatar-reference-v3"),'Felles avatarstate mangler stabil lagringsnøkkel');
assert(studioJs.includes("from './avatar-state.js?v=1'"),'Studio bruker ikke felles avatarstate-modul');
assert(worldJs.includes("from './avatar-state.js?v=1'"),'Spillet bruker ikke felles avatarstate-modul');
assert(cityJs.includes("from './avatar-state.js?v=1'"),'Byen bruker ikke felles avatarstate-modul');
assert(homeJs.includes("from './avatar-state.js?v=1'"),'Boligen bruker ikke felles avatarstate-modul');
assert(worldJs.includes("from './avatar-appearance.js?v=1'")&&cityJs.includes("from './avatar-appearance.js?v=1'"),'Spillområdene må dele avatarutseende og animasjonslogikk');
assert(homeJs.includes("from './avatar-appearance.js?v=1'"),'Boligen må dele avatarutseende og animasjonslogikk');
assert(worldJs.includes('assets/characters/mpfb-builder-v1/avatar.glb'),'Spillet laster ikke den riggede produksjonsavataren');
assert(cityJs.includes('assets/characters/mpfb-builder-v1/avatar.glb'),'Byen laster ikke den riggede produksjonsavataren');
assert(homeJs.includes('assets/characters/mpfb-builder-v1/avatar.glb'),'Boligen laster ikke den riggede produksjonsavataren');
assert(worldHtml.includes('@dimforge/rapier3d-compat@0.21.0'),'Rapier-versjonen skal være låst');
assert(cityHtml.includes('@dimforge/rapier3d-compat@0.21.0'),'Byen må bruke låst Rapier-versjon');
assert(homeHtml.includes('@dimforge/rapier3d-compat@0.21.0'),'Boligen må bruke låst Rapier-versjon');
assert(worldJs.includes("setAnimation(moving?'walk':'idle')"),'Bevegelse må styre Walk/Idle');
assert(cityJs.includes("setAnimation(moving?'walk':'idle')"),'Bybevegelse må styre Walk/Idle');
assert(homeJs.includes("setAnimation(moving?'walk':'idle')"),'Boligbevegelse må styre Walk/Idle');
assert(worldJs.includes("addEventListener('blur',resetInput)"),'Spillet må nullstille input etter fokustap');
assert(cityJs.includes("addEventListener('blur',resetInput)"),'Byen må nullstille input etter fokustap');
assert(homeJs.includes("addEventListener('blur',resetInput)"),'Boligen må nullstille input etter fokustap');
assert(worldJs.includes("altera-world-settings-v1"),'Grafikk- og kameravalg må kunne lagres');
assert(worldJs.includes("altera-world-progress-v1"),'Oppdagelsesprogresjon må kunne lagres');
for(const spot of ["id:'portal'","id:'dj'","id:'window'"])assert(worldJs.includes(spot),'Mangler interaksjonspunkt: '+spot);
assert(worldHtml.includes('id="objectiveProgress"'),'Spillet mangler synlig progresjon');
assert(worldHtml.includes('id="chatForm"')&&worldHtml.includes('id="onlineCount"'),'Loungen mangler sosialt romgrensesnitt');
assert(worldJs.includes("from './social-client.js?v=1'")&&worldJs.includes('syncSocial'),'Loungen mangler valgfri autoritativ sosialkobling');
assert(socialClientJs.includes("update_presence")&&socialClientJs.includes("send_chat"),'Sosialklienten mangler nærvær eller chat');
for(const feature of ['purchaseListing','placeFurniture','setAccess','sendChat'])assert(authorityJs.includes(feature),'Autoritetsserveren mangler domenehandling: '+feature);
assert(httpServerJs.includes("'/v1/commands'")&&httpServerJs.includes('actor_mismatch'),'HTTP-laget må beskytte aktøridentitet');
assert(cityStateJs.includes("altera-district-01-state-v2")&&cityJs.includes('saveCityState'),'Byens progresjon må bruke validert District 01-state');
assert(cityJs.includes("from './city-state.js?v=1'"),'Byen må bruke den testbare distriktsmodulen');
assert(cityStateJs.includes("from './world-domain.js'"),'Distriktsstate må være koblet til verdensdomenet');
for(const spot of ["id:'quay'","id:'cafe'","id:'gallery'","id:'transit'"])assert(cityJs.includes(spot),'Mangler bypunkt: '+spot);
assert(cityJs.includes("id:'home'")&&cityJs.includes('goHome'),'Byen mangler den progresjonslåste boligportalen');
for(const feature of ['buildWaterfront()','buildBoats()','buildPeople()'])assert(cityJs.includes(feature),'Byen mangler levende system: '+feature);
for(const feature of ['buildLandmarks()','buildTraffic()','buildRain()','new T.InstancedMesh'])assert(cityJs.includes(feature),'Byen mangler bysystem eller ytelsesoptimalisering: '+feature);
for(const feature of ['cameraRay.intersectObjects','greetNearest','transitReady'])assert(cityJs.includes(feature),'Byen mangler reaktivt spill- eller kamerasystem: '+feature);
assert(cityHtml.includes('id="objectiveProgress"'),'Byen mangler synlig progresjon');
assert(cityHtml.includes('id="atmosphere"'),'Byen mangler atmosfærekontroll');
assert(homeStateJs.includes("altera-home-city-01-v1"),'Boligen mangler versjonert lagringsnøkkel');
assert(homeStateJs.includes("from './settlements.js'"),'Boligstate må være koblet til settlement-domenet');
assert(homeStateJs.includes('HOME_LIMIT=24'),'Boligen må håndheve møbleringsgrensen');
assert(homeStateJs.includes('HOME_TASKS')&&homeStateJs.includes('deriveHomeProgress'),'Boligen mangler avledet innflyttingsprogresjon');
for(const feature of ['validPlacement','createFurnitureBody','saveHomeState','selectAtPointer','moveSelected'])assert(homeJs.includes(feature),'Boligen mangler møbleringssystem: '+feature);
assert(homeHtml.includes('id="lockedNotice"'),'Boligen må forklare låst forhåndsvisning');
assert(homeHtml.includes('id="homeObjective"')&&homeHtml.includes('id="moveItem"'),'Boligen mangler målvisning eller flytteverktøy');
assert(rigJs.includes("availableOptions"),'Studio må kunne deaktivere plagg som modellen ikke har');
assert(rigJs.includes("iris|eye_color|pupil"),'Irisfarge må være adskilt fra hornhinne og sclera');
assert(!rigJs.includes("eyes:/iris|eyeball"),'Hornhinne/øyeball må ikke arve irisfargen');
assert(appearanceJs.includes("materialCache='alteraRuntimeMaterials'"),'Spillet må isolere materialer før avatarfarger endres');
assert(!studioHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
assert(!worldHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
assert(!cityHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
assert(!homeHtml.includes('user_files/'),'Referansebilder må ikke publiseres');
for(const category of ['Ansikt','Hår','Kropp','Klær','Farger'])assert(studioJs.includes(category),'Mangler Studio-kategori: '+category);

for(const [label,html] of [['Studio',studioHtml],['Night Lounge',worldHtml],['District 01',cityHtml],['First Home',homeHtml]]){const all=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]),duplicates=all.filter((id,index)=>all.indexOf(id)!==index);assert.deepStrictEqual(duplicates,[],label+' har dupliserte DOM-ID-er: '+duplicates.join(', '))}

console.log('App contracts passed: validated Studio, Lounge, District 01 and First Home state, avatar, physics, progression and DOM bindings.');
