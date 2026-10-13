/* ALTERA mobile emergency renderer.
   Runs when external 3D dependencies fail; no CDN or WebGL required.
   This is a functional 2D fallback, not the final character artwork. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const storageKey = 'altera-avatar-unified-v1';
const defaults = {gender:'Kvinne',skin:'#c58d6c',hair:'#32232c',hairStyle:'Oppsatt',top:'Singlet',topColor:'#211b29',bottom:'Cargo',bottomColor:'#292734',shoes:'Sneakers',glasses:'Ingen',body:1};
let state = {...defaults}, active = false, rotation = 0, selected = 'Ansikt';
try { state = {...state,...JSON.parse(localStorage.getItem(storageKey)||'{}')}; } catch {}
const sets = {
  gender:['Kvinne','Mann'],hairStyle:['Kort','Lang','Oppsatt','Krøllete'],
  top:['Singlet','T-skjorte','Half-zip','Hettegenser','Blazer'],
  bottom:['Cargo','Jeans','Dressbukse','Shorts','Skjørt'],
  shoes:['Sneakers','Boots','Loafers'],glasses:['Ingen','Solbriller','VR-briller'],
  skin:['#f0c9aa','#c58d6c','#a56d51','#754a3b'],
  hair:['#221b25','#754834','#c6a06c','#b45c87'],
  topColor:['#211b29','#d6bfa8','#e8b5ce','#4b7483'],
  bottomColor:['#292734','#283c56','#a08b72','#44464c']
};
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{}}
function el(tag,attrs={},parent){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else e.setAttribute(k,v)}parent?.append(e);return e}
function change(part){Object.assign(state,part);save();render();controls()}
function setup(){
  if(active || window.__altera3dReady) return;
  active=true;
  const stage=document.querySelector('.stage'), original=$('view');
  if(!stage)return;
  original.style.visibility='hidden';
  const err=$('error');if(err)err.style.display='none';
  const wrap=el('div',{id:'fallbackStage'},stage);
  const canvas=el('canvas',{id:'fallbackCanvas','aria-label':'Forenklet avatarreservevisning'},wrap);
  const label=el('div',{class:'fallbackLabel',text:'2D RESERVEVISNING · 3D UTILGJENGELIG'},wrap);
  const bar=el('div',{class:'fallbackBar'},wrap);
  el('button',{text:'← Roter'},bar).onclick=()=>{rotation-=.25;render()};
  el('button',{text:'Roter →'},bar).onclick=()=>{rotation+=.25;render()};
  el('button',{text:'Tilpass'},bar).onclick=()=>{const p=$('fallbackOptions');p.hidden=!p.hidden};
  const panel=el('div',{id:'fallbackOptions',hidden:''},wrap);
  el('div',{class:'fallbackTitle',text:'AVATAR · TILPASNING'},panel);
  const row=el('div',{class:'fallbackChoices'},panel);
  el('button',{text:'Kvinne'},row).onclick=()=>change({gender:'Kvinne'});
  el('button',{text:'Mann'},row).onclick=()=>change({gender:'Mann'});
  const options=el('div',{id:'fallbackChoices'},panel);
  el('p',{class:'fallbackNote',text:'Denne reservevisningen er for å teste valg når 3D-motoren ikke starter. Den er ikke den ferdige grafikken.'},panel);
  const stateEl=$('status');if(stateEl)stateEl.textContent='3D-motoren kunne ikke lastes. Reservevisning aktiv – avatarvalg kan testes.';
  const menu=$('side');if(menu)menu.addEventListener('click',e=>{if(!active)return;const name=e.target.closest('button')?.textContent?.trim();if(name){selected=name;controls();panel.hidden=false}});
  for(const btn of document.querySelectorAll('[data-tab]'))btn.addEventListener('click',()=>{if(!active)return;selected=btn.dataset.tab;controls();panel.hidden=false});
  $('chooseGender')?.addEventListener('click',()=>{if(active)change({gender:state.gender==='Mann'?'Kvinne':'Mann'})});
  $('random')?.addEventListener('click',()=>{if(!active)return;const next={};for(const key of ['gender','hairStyle','top','bottom','shoes','skin','hair','topColor','bottomColor']){const a=sets[key];next[key]=a[Math.floor(Math.random()*a.length)]}change(next)});
  $('save')?.addEventListener('click',()=>{if(active)save()});
  $('front')?.addEventListener('click',()=>{if(active){rotation=0;render()}});
  $('back')?.addEventListener('click',()=>{if(active){rotation=Math.PI;render()}});
  $('spin')?.addEventListener('click',()=>{if(active){rotation+=Math.PI/4;render()}});
  $('capture')?.addEventListener('click',()=>{if(!active)return;try{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='ALTERA-avatar-fallback.png';a.click()}catch{}});
  let down=false,x=0;
  canvas.addEventListener('pointerdown',e=>{down=true;x=e.clientX;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointerup',()=>down=false);
  canvas.addEventListener('pointermove',e=>{if(down){rotation+=(e.clientX-x)*.012;x=e.clientX;render()}});
  window.addEventListener('resize',render);
  controls();render();
  function controls(){
    options.replaceChildren();
    const fields=selected==='Ansikt'?['gender','skin']:selected==='Hår'?['hairStyle','hair']:selected==='Klær'?['top','bottom','topColor','bottomColor']:selected==='Sko'?['shoes']:selected==='Tilbehør'?['glasses']:selected==='Kropp'?['gender']:['top','bottom'];
    for(const key of fields){
      el('div',{class:'fallbackField',text:({gender:'Kjønn',skin:'Hudtone',hairStyle:'Frisyre',hair:'Hårfarge',top:'Overdel',bottom:'Underdel',topColor:'Farge overdel',bottomColor:'Farge bukse',shoes:'Sko',glasses:'Briller'})[key]||key},options);
      const row=el('div',{class:'fallbackChoices'},options);
      for(const value of sets[key]||[]){
        const b=el('button',{text:value.startsWith('#')?'●':value},row);
        if(value.startsWith('#'))b.style.color=value;
        if(state[key]===value)b.classList.add('active');
        b.onclick=()=>change({[key]:value});
      }
    }
  }
}
function render(){
  if(!active)return;
  const canvas=$('fallbackCanvas');if(!canvas)return;
  const bounds=canvas.getBoundingClientRect(),w=Math.max(220,bounds.width),h=Math.max(280,bounds.height),dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.scale(dpr,dpr);
  const gradient=ctx.createRadialGradient(w*.52,h*.5,10,w*.52,h*.52,w*.66);
  gradient.addColorStop(0,'#573258');gradient.addColorStop(1,'#160e28');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h*.87);
  ctx.strokeStyle='#f28be7';ctx.shadowColor='#ed80e8';ctx.shadowBlur=20;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,w*.37,h*.055,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  const scale=Math.min(w/320,h/540);ctx.scale(scale,scale);ctx.translate(0,-25);
  const profile=Math.cos(rotation),side=Math.abs(profile),bodyScale=1-.12*side;ctx.scale(bodyScale,1);
  function shape(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function limb(x1,y1,x2,y2,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  const male=state.gender==='Mann',skin=state.skin,top=state.topColor,pants=state.bottomColor;
  limb(-27,-153,-32,-44,28,pants);limb(27,-153,32,-44,28,pants);
  limb(-32,-44,-34,7,22,pants);limb(32,-44,34,7,22,pants);
  shape(-34,12,20,12,'#dfd9d8');shape(34,12,20,12,'#dfd9d8');
  shape(0,-205,male?61:50,83,top);
  if(state.top==='Half-zip'||state.top==='Blazer'){shape(0,-272,22,17,top);limb(0,-267,0,-233,2,'#c7b7b7')}
  if(state.top==='Hettegenser')shape(0,-274,33,23,top);
  limb(-53,-254,-65,-160,22,state.top==='Singlet'?skin:top);
  limb(53,-254,65,-160,22,state.top==='Singlet'?skin:top);
  limb(-65,-160,-66,-115,16,skin);limb(65,-160,66,-115,16,skin);
  shape(0,-318,34,44,skin);
  shape(0,-356,37,22,state.hair);
  if(state.hairStyle==='Lang'){shape(-32,-320,12,56,state.hair);shape(32,-320,12,56,state.hair)}
  if(state.hairStyle==='Oppsatt')shape(0,-382,19,19,state.hair);
  if(state.hairStyle==='Krøllete')for(let i=0;i<9;i++)shape(Math.sin(i*2.4)*35,-362+Math.cos(i*3)*9,11,12,state.hair);
  if(profile>-.35){shape(-12,-322,4,3,'#292532');shape(12,-322,4,3,'#292532');limb(-9,-298,9,-298,2,'#a45d68')}
  if(state.glasses!=='Ingen'){limb(-27,-325,27,-325,8,'#29222c')}
  ctx.restore();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(setup,5500));
else setTimeout(setup,5500);
})();