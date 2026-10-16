import {FURNITURE_CATALOG} from './home-state.js?v=1';
import {AlteraSocialClient} from './social-client.js?v=1';

const $=id=>document.getElementById(id),money=value=>`${(value/100).toLocaleString('nb-NO',{minimumFractionDigits:0,maximumFractionDigits:2})} ALC`,groups={sofa:'seating',chair:'seating',table:'surface',shelf:'surface',lamp:'light',plant:'light'};
let client=null,snapshot=null,filter='all',toastTimer;

boot();
async function boot(){
  const authority=new URLSearchParams(location.search).get('authority');for(const id of['cityLink','noticeCityLink'])$(id).href=gameUrl('city.html');
  if(!authority){render();return}
  try{client=new AlteraSocialClient(authority);snapshot=await client.restoreOrConnect(localStorage.getItem('altera-player-name')||'ALTERA-spiller');$('connectionNotice').hidden=true;$('connectionDot').classList.add('online');$('connectionState').textContent='Servereid marked';setupInput();render()}
  catch(error){client=null;note(error.message||'Kunne ikke koble til markedet');render()}
}
function setupInput(){
  $('listingForm').onsubmit=async event=>{event.preventDefault();const itemType=$('itemType').value,priceMinor=Math.round(Number($('price').value)*100);if(!itemType||!Number.isSafeInteger(priceMinor)||priceMinor<1){note('Velg en vare og gyldig pris');return}await act('create_listing',{listingId:`listing_${Date.now().toString(36)}`,itemType,priceMinor},'Annonsen er publisert')};
  for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{filter=button.dataset.filter;for(const peer of document.querySelectorAll('[data-filter]'))peer.classList.toggle('active',peer===button);renderListings()};
}
async function act(type,payload,message){try{await client.command(type,payload);snapshot=await client.snapshot();render();note(message)}catch(error){note(friendlyError(error))}}
function render(){
  const player=snapshot?.player,inventory=player?.inventory||{},market=snapshot?.market||{listings:[],transactions:[]};$('playerName').textContent=player?.displayName||'Frakoblet';$('balanceValue').textContent=player?money(player.balanceMinor):'—';$('listingCount').textContent=String(market.listings.length);$('inventoryCount').textContent=String(Object.values(inventory).reduce((sum,value)=>sum+value,0));
  $('itemType').innerHTML=Object.entries(FURNITURE_CATALOG).filter(([type])=>(inventory[type]||0)>0).map(([type,item])=>`<option value="${type}">${escapeHtml(item.label)} · ${inventory[type]} stk.</option>`).join('');$('listItem').disabled=!client||!$('itemType').options.length;$('inventoryHint').textContent=player?`${Object.values(inventory).reduce((sum,value)=>sum+value,0)} tilgjengelige varer · annonserte varer holdes av markedet`:'Koble til serveren for å se inventaret.';renderListings();renderTransactions()
}
function renderListings(){
  const listings=(snapshot?.market?.listings||[]).filter(listing=>filter==='all'||groups[listing.itemType]===filter),actorId=snapshot?.player?.id;$('emptyMarket').hidden=listings.length>0;$('listingGrid').innerHTML=listings.map(listing=>{const item=FURNITURE_CATALOG[listing.itemType],owned=listing.sellerId===actorId;return `<button class="listing${owned?' owned':''}" type="button" data-listing="${listing.id}" style="--item-color:${item?.color||'#657275'}"><span class="itemVisual"><i class="${listing.itemType}"></i></span><h2>${escapeHtml(item?.label||listing.itemType)}</h2><span class="seller">${owned?'Din annonse':`Selges av ${escapeHtml(listing.sellerName||'spiller')}`}</span><footer><strong>${money(listing.priceMinor)}</strong><span>${owned?'TREKK':'KJØP'}</span></footer></button>`}).join('');for(const button of document.querySelectorAll('[data-listing]'))button.onclick=()=>{const listing=listings.find(value=>value.id===button.dataset.listing);if(!listing||!client)return;const owned=listing.sellerId===actorId;act(owned?'cancel_listing':'purchase_listing',{listingId:listing.id},owned?'Annonsen er trukket':'Kjøpet er gjennomført')}
}
function renderTransactions(){const actorId=snapshot?.player?.id,transactions=snapshot?.market?.transactions||[];$('transactionList').innerHTML=transactions.length?transactions.map(transaction=>{const entry=transaction.entries.find(value=>value.accountId===actorId),incoming=entry.amountMinor>0;return `<li><span>${incoming?'Salg':'Kjøp'} i City Exchange</span><small>${escapeHtml(transaction.referenceId||transaction.id)}</small><b class="${incoming?'in':'out'}">${incoming?'+':'−'}${money(Math.abs(entry.amountMinor))}</b></li>`}).join(''):'<li><span>Ingen bevegelser ennå</span><small>Transaksjoner vises her</small></li>'}
function gameUrl(path){const authority=new URLSearchParams(location.search).get('authority');return authority?`${path}?authority=${encodeURIComponent(authority)}`:path}
function friendlyError(error){return({self_purchase:'Du kan ikke kjøpe din egen vare',insufficient_funds:'Du har ikke nok saldo',listing_unavailable:'Annonsen er ikke lenger tilgjengelig',not_owned:'Varen finnes ikke i inventaret',forbidden:'Du har ikke tilgang til denne handlingen'}[error?.code]||error?.message||'Markedshandlingen feilet')}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))}
function note(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600)}
