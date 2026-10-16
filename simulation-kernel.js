// ALTERA simulation kernel v0.1. In-memory, deterministic prototype only.
// Production requires authenticated actors, a transactional database, concurrency
// controls, durable audit logs, rate limits and moderation.
import {isId,validateMoney} from './world-domain.js';
const fail=(message)=>{throw new Error(message)};
const positive=n=>Number.isSafeInteger(n)&&n>0;
export function createWorld(){
 return {revision:0,players:new Map(),accounts:new Map(),inventory:new Map(),
 parcels:new Map(),listings:new Map(),events:[],processed:new Map()};
}
export function addPlayer(w,id,initialBalance=0){
 if(!isId(id)||w.players.has(id)||!validateMoney(initialBalance))fail('invalid player');
 w.players.set(id,{id,homeId:null});w.accounts.set(id,initialBalance);w.inventory.set(id,new Map());return w;
}
export function addParcel(w,{id,districtId,zone='residential',ownerId=null,priceMinor=0}){
 if(!isId(id)||!isId(districtId)||w.parcels.has(id)||!validateMoney(priceMinor)||ownerId!==null&&!w.players.has(ownerId))fail('invalid parcel');
 w.parcels.set(id,{id,districtId,zone,ownerId,priceMinor,building:null,access:'private'});return w;
}
export function giveItem(w,playerId,itemType,count=1){
 if(!w.players.has(playerId)||!isId(itemType)||!positive(count))fail('invalid item grant');
 const bag=w.inventory.get(playerId),old=bag.get(itemType)||0;
 if(!Number.isSafeInteger(old+count))fail('inventory overflow');
 bag.set(itemType,old+count);return w;
}
const has=(w,id,type,count)=>((w.inventory.get(id)?.get(type)||0)>=count);
const debit=(w,id,amount)=>{const old=w.accounts.get(id);if(old===undefined||old<amount)fail('insufficient funds');w.accounts.set(id,old-amount)};
const credit=(w,id,amount)=>{const old=w.accounts.get(id);if(old===undefined||!Number.isSafeInteger(old+amount))fail('balance overflow');w.accounts.set(id,old+amount)};
const transfer=(w,from,to,amount)=>{if(!positive(amount)||from===to)fail('invalid transfer');debit(w,from,amount);credit(w,to,amount)};
function execute(w,actor,type,p){
 if(!w.players.has(actor))fail('unknown actor');
 if(type==='transfer'){
  if(!w.players.has(p.to)||!positive(p.amountMinor)||actor===p.to)fail('invalid transfer');
  if(w.accounts.get(p.to)+p.amountMinor>Number.MAX_SAFE_INTEGER)fail('balance overflow');
  transfer(w,actor,p.to,p.amountMinor);return {amountMinor:p.amountMinor,to:p.to};
 }
 if(type==='claim_parcel'){
  const parcel=w.parcels.get(p.parcelId);
  if(!parcel||parcel.ownerId!==null||!positive(parcel.priceMinor))fail('parcel unavailable');
  if(!w.accounts.has('treasury'))fail('treasury not configured');
  if(w.accounts.get('treasury')+parcel.priceMinor>Number.MAX_SAFE_INTEGER)fail('balance overflow');
  transfer(w,actor,'treasury',parcel.priceMinor);parcel.ownerId=actor;return {parcelId:parcel.id};
 }
 if(type==='set_access'){
  const parcel=w.parcels.get(p.parcelId);
  if(!parcel||parcel.ownerId!==actor||!['public','private','friends'].includes(p.access))fail('access denied');
  parcel.access=p.access;return {parcelId:parcel.id,access:p.access};
 }
 if(type==='build'){
  const parcel=w.parcels.get(p.parcelId);
  if(!parcel||parcel.ownerId!==actor||parcel.building||!['house','shop','cabin'].includes(p.archetype))fail('construction denied');
  if(!has(w,actor,'building_material',3))fail('materials required');
  w.inventory.get(actor).set('building_material',w.inventory.get(actor).get('building_material')-3);
  parcel.building={archetype:p.archetype,createdRevision:w.revision+1};return {parcelId:parcel.id,archetype:p.archetype};
 }
 if(type==='list_item'){
  if(!isId(p.listingId)||w.listings.has(p.listingId)||!isId(p.itemType)||!positive(p.count)||!positive(p.priceMinor)||!has(w,actor,p.itemType,p.count))fail('invalid listing');
  const bag=w.inventory.get(actor);bag.set(p.itemType,bag.get(p.itemType)-p.count);
  w.listings.set(p.listingId,{id:p.listingId,sellerId:actor,itemType:p.itemType,count:p.count,priceMinor:p.priceMinor});return {listingId:p.listingId};
 }
 if(type==='buy_listing'){
  const listing=w.listings.get(p.listingId);
  if(!listing||listing.sellerId===actor||w.accounts.get(actor)<listing.priceMinor)fail('purchase denied');
  if(w.accounts.get(listing.sellerId)+listing.priceMinor>Number.MAX_SAFE_INTEGER)fail('balance overflow');
  const bag=w.inventory.get(actor),qty=bag.get(listing.itemType)||0;
  if(!Number.isSafeInteger(qty+listing.count))fail('inventory overflow');
  transfer(w,actor,listing.sellerId,listing.priceMinor);
  bag.set(listing.itemType,qty+listing.count);w.listings.delete(listing.id);return {listingId:listing.id};
 }
 fail('unknown command');
}
export function applyCommand(w,{commandId,actorId,type,payload}){
 if(!isId(commandId)||!isId(actorId)||!payload||typeof payload!=='object'||Array.isArray(payload))fail('invalid command');
 const signature=JSON.stringify([actorId,type,payload]);
 if(w.processed.has(commandId)){
  const prev=w.processed.get(commandId);if(prev.signature!==signature)fail('idempotency conflict');
  return {...prev.result,replayed:true};
 }
 // Clone first to make all command effects atomic on failure.
 const draft=structuredClone(w);
 const detail=execute(draft,actorId,type,payload);
 draft.revision++;
 const result={revision:draft.revision,type,actorId,detail,replayed:false};
 draft.events.push({commandId,...result});
 draft.processed.set(commandId,{signature,result});
 Object.assign(w,draft);return result;
}
export function snapshot(w){
 return {revision:w.revision,players:[...w.players.values()],balances:Object.fromEntries(w.accounts),
 inventory:Object.fromEntries([...w.inventory].map(([id,bag])=>[id,Object.fromEntries(bag)])),
 parcels:[...w.parcels.values()],listings:[...w.listings.values()],events:w.events.slice()};
}
