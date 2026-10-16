import {AlteraSocialClient} from './social-client.js?v=1';

const $=id=>document.getElementById(id),authority=new URLSearchParams(location.search).get('authority');let client=null,busy=false,toastTimer;
setupLinks();setupModes();setupForms();checkServer();

function setupLinks(){for(const link of document.querySelectorAll('a[href="city.html"]'))link.href=gameUrl('city.html')}
function setupModes(){for(const button of document.querySelectorAll('[data-mode]'))button.onclick=()=>{const login=button.dataset.mode==='login';for(const peer of document.querySelectorAll('[data-mode]'))peer.classList.toggle('active',peer===button);$('loginForm').hidden=!login;$('registerForm').hidden=login;$('accountTitle').textContent=login?'Fortsett til ALTERA':'Opprett din identitet'}}
function setupForms(){
  $('loginForm').onsubmit=async event=>{event.preventDefault();await submit(async()=>client.login({username:$('loginUsername').value,password:$('loginPassword').value}),$('loginUsername').value)};
  $('registerForm').onsubmit=async event=>{event.preventDefault();if($('registerPassword').value!==$('confirmPassword').value){note('Passordene er ikke like');return}await submit(async()=>client.register({username:$('registerUsername').value,password:$('registerPassword').value,displayName:$('displayName').value}),$('displayName').value)};
}
async function checkServer(){if(!authority){$('serverNotice').hidden=false;$('serverState').textContent='Ingen server valgt';disableForms();return}client=new AlteraSocialClient(authority);try{const response=await fetch(authority.replace(/\/$/,'')+'/health');if(!response.ok)throw Error();$('serverState').textContent='Autoritetsserver tilkoblet';$('serverState').classList.add('online')}catch{$('serverState').textContent='Serveren svarer ikke';disableForms();note('Kunne ikke koble til utviklingsserveren')}}
async function submit(action,displayName){if(!client||busy)return;busy=true;for(const button of document.querySelectorAll('button[type="submit"]'))button.disabled=true;try{await action();localStorage.setItem('altera-player-name',String(displayName||'ALTERA-spiller').trim());location.href=gameUrl('city.html')}catch(error){note(friendlyError(error))}finally{busy=false;for(const button of document.querySelectorAll('button[type="submit"]'))button.disabled=false}}
function disableForms(){for(const input of document.querySelectorAll('input,button[type="submit"]'))input.disabled=true}
function gameUrl(path){return authority?`${path}?authority=${encodeURIComponent(authority)}`:path}
function friendlyError(error){return({invalid_credentials:'Ugyldig brukernavn eller passord',account_exists:'Brukernavnet er allerede i bruk',invalid_username:'Brukernavnet kan bruke a–z, 0–9 og understrek',invalid_password:'Passordet må ha minst 10 tegn',invalid_name:'Visningsnavnet er for kort'}[error?.code]||error?.message||'Kontohandlingen feilet')}
function note(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2800)}
