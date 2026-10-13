/* ALTERA 3D diagnostics: identify the real startup error before making new art. */
(() => {
'use strict';
const key='altera-3d-diagnostics-v1';
const records=[];
let ready=false;
function record(stage,detail){
 const item={time:new Date().toISOString(),stage,detail:String(detail||'')};
 records.push(item);if(records.length>30)records.shift();
 try{sessionStorage.setItem(key,JSON.stringify(records))}catch{}
 const output=document.getElementById('alteraDiagnosticText');
 if(output)output.textContent=records.map(x=>x.stage+': '+x.detail).join('\n');
}
function setup(){
 const target=document.querySelector('.stage');if(!target)return;
 const panel=document.createElement('details');panel.id='alteraDiagnostic';panel.className='alteraDiagnostic';
 const summary=document.createElement('summary');summary.textContent='3D-diagnostikk · vis feilen';
 const pre=document.createElement('pre');pre.id='alteraDiagnosticText';
 const copy=document.createElement('button');copy.textContent='Kopier feilrapport';copy.type='button';
 copy.onclick=()=>{const text=JSON.stringify({url:location.href,userAgent:navigator.userAgent,webgl:checkWebGL(),events:records},null,2);navigator.clipboard?.writeText(text).then(()=>{copy.textContent='Kopiert'}).catch(()=>{pre.textContent=text})};
 panel.append(summary,pre,copy);target.after(panel);
 record('side','Diagnostikk startet');
 record('webgl',checkWebGL());
 record('module','Venter på Three.js');
 window.addEventListener('error',e=>record('error',e.message||e.error?.message||'ukjent'));
 window.addEventListener('unhandledrejection',e=>record('promise',e.reason?.stack||e.reason?.message||e.reason||'ukjent'));
 setTimeout(()=>{ready=!!window.__altera3dReady;record('3d',ready?'Startet':'Ikke startet etter 8 sekunder');if(!ready)panel.open=true},8000);
}
function checkWebGL(){try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');return gl?'Tilgjengelig ('+(gl instanceof WebGL2RenderingContext?'WebGL2':'WebGL1')+')':'Ingen WebGL-kontekst'}catch(e){return 'WebGL-feil: '+e.message}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();