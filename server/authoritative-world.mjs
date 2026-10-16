import {SCHEMA_VERSION,isId,validateMoney,validateWorldCommand} from '../world-domain.js';
import {normalizeConstructionState,placeModule,removeModule,rotateModule} from '../construction-state.js';
import {FURNITURE_CATALOG,furniturePlacementError} from '../home-state.js';
import {LedgerError,accountTransactions,normalizeLedger,postTransfer} from './economy-ledger.mjs';

const cleanName=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,32);
const cleanText=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,240);
const clone=value=>structuredClone(value);
const starterInventory=()=>({sofa:1,table:1,lamp:1});

export class DomainError extends Error{
  constructor(code,message,status=400){super(message);this.name='DomainError';this.code=code;this.status=status}
}

export class AuthoritativeWorld{
  constructor(){this.players=new Map();this.homes=new Map();this.builds=new Map();this.rooms=new Map();this.listings=new Map();this.ledger=[];this.processed=new Map();this.sequence=0}
  registerPlayer({id,displayName}){
    if(!isId(id)||this.players.has(id))throw new DomainError('invalid_player','Spiller-ID er ugyldig eller opptatt');
    const name=cleanName(displayName);if(name.length<2)throw new DomainError('invalid_name','Visningsnavnet er for kort');
    const player={id,displayName:name,balanceMinor:2500,inventory:starterInventory(),homeId:`home_${id}`,lastChatAt:0};
    const home={id:player.homeId,ownerId:id,settlementId:'city_01',version:1,visitors:[],editors:[],items:[]};
    this.players.set(id,player);this.homes.set(home.id,home);this.builds.set(id,normalizeConstructionState());return this.playerSnapshot(id);
  }
  playerSnapshot(id){const player=this.requirePlayer(id),home=this.homes.get(player.homeId),construction=this.builds.get(id),listings=[...this.listings.values()].filter(listing=>listing.status==='open');return clone({player,home,construction,market:{listings,transactions:accountTransactions(this.ledger,id)},rooms:[...this.rooms.values()].filter(room=>room.members.includes(id)).map(room=>this.roomSnapshot(room))})}
  execute(command){
    const errors=validateWorldCommand(command);if(errors.length)throw new DomainError('invalid_command',errors.join(', '));
    if(this.processed.has(command.commandId))return clone(this.processed.get(command.commandId));
    this.requirePlayer(command.actorId);let data;
    if(command.type==='join_room')data=this.joinRoom(command.actorId,command.payload);
    else if(command.type==='leave_room')data=this.leaveRoom(command.actorId,command.payload);
    else if(command.type==='update_presence')data=this.updatePresence(command.actorId,command.payload);
    else if(command.type==='send_chat')data=this.sendChat(command.actorId,command.payload);
    else if(command.type==='place_furniture')data=this.placeFurniture(command.actorId,command.payload);
    else if(command.type==='set_access')data=this.setAccess(command.actorId,command.payload);
    else if(command.type==='create_listing')data=this.createListing(command.actorId,command.payload);
    else if(command.type==='cancel_listing')data=this.cancelListing(command.actorId,command.payload);
    else if(command.type==='purchase_listing')data=this.purchaseListing(command.actorId,command.payload);
    else if(command.type==='request_build')data=this.requestBuild(command.actorId,command.payload);
    else throw new DomainError('not_implemented','Kommandoen er ikke implementert',501);
    const result={version:SCHEMA_VERSION,commandId:command.commandId,ok:true,data};this.processed.set(command.commandId,result);return clone(result);
  }
  joinRoom(actorId,{roomId}){if(!isId(roomId))throw new DomainError('invalid_room','Ugyldig rom');for(const room of this.rooms.values())if(room.id!==roomId)this.removeFromRoom(room,actorId);const room=this.rooms.get(roomId)||{id:roomId,members:[],messages:[],presence:{}};if(!room.members.includes(actorId))room.members.push(actorId);room.presence[actorId]||={x:0,z:0,yaw:0,updatedAt:0};this.rooms.set(roomId,room);return clone({roomId,members:room.members})}
  leaveRoom(actorId,{roomId}){const room=this.rooms.get(roomId);if(!room)throw new DomainError('invalid_room','Ugyldig rom');this.removeFromRoom(room,actorId);return{roomId,left:true}}
  updatePresence(actorId,{roomId,x,z,yaw=0,now=Date.now()}){const room=this.rooms.get(roomId);if(!room?.members.includes(actorId))throw new DomainError('not_present','Spilleren er ikke i rommet',403);if(![x,z,yaw].every(Number.isFinite)||Math.abs(x)>250||Math.abs(z)>250)throw new DomainError('invalid_position','Ugyldig posisjon');room.presence[actorId]={x:round(x),z:round(z),yaw:Math.round(yaw*1000)/1000,updatedAt:now};return clone(room.presence[actorId])}
  sendChat(actorId,{roomId,text,now=Date.now()}){
    const room=this.rooms.get(roomId),player=this.requirePlayer(actorId),message=cleanText(text);if(!room?.members.includes(actorId))throw new DomainError('not_present','Spilleren er ikke i rommet',403);if(!message)throw new DomainError('empty_message','Meldingen er tom');if(message.length>240)throw new DomainError('message_too_long','Meldingen er for lang');if(now-player.lastChatAt<700)throw new DomainError('rate_limited','Vent før du sender en ny melding',429);if(/\b(?:hateword|doxx)\b/i.test(message))throw new DomainError('moderated','Meldingen ble stoppet',422);
    player.lastChatAt=now;const entry={id:`msg_${String(++this.sequence).padStart(6,'0')}`,actorId,text:message,createdAt:now};room.messages.push(entry);if(room.messages.length>50)room.messages.shift();return clone(entry);
  }
  setAccess(actorId,{homeId,visitorId,allowed=false,canEdit=false}){const home=this.requireHome(homeId);this.requirePlayer(visitorId);if(home.ownerId!==actorId)throw new DomainError('forbidden','Bare eieren kan endre adgang',403);home.visitors=toggle(home.visitors,visitorId,allowed);home.editors=toggle(home.editors,visitorId,allowed&&canEdit);home.version++;return clone({homeId,visitorId,allowed,canEdit:allowed&&canEdit,version:home.version})}
  placeFurniture(actorId,payload){
    const{homeId,action='place'}=payload,home=this.requireHome(homeId),player=this.requirePlayer(actorId);if(home.ownerId!==actorId&&!home.editors.includes(actorId))throw new DomainError('forbidden','Mangler møbleringstilgang',403);
    if(action==='remove'){const index=home.items.findIndex(item=>item.id===payload.instanceId);if(index<0)throw new DomainError('item_not_found','Møbelet finnes ikke',404);const[item]=home.items.splice(index,1);player.inventory[item.type]=(player.inventory[item.type]||0)+1;home.version++;return clone({homeId,action,item:null,home,inventory:player.inventory,version:home.version})}
    if(action==='move'||action==='rotate'){const item=home.items.find(value=>value.id===payload.instanceId);if(!item)throw new DomainError('item_not_found','Møbelet finnes ikke',404);const candidate={...item,x:action==='move'?round(payload.x):item.x,z:action==='move'?round(payload.z):item.z,rotation:action==='rotate'?normalizeRotation(item.rotation+Math.PI/2):normalizeRotation(payload.rotation??item.rotation)},error=furniturePlacementError(home,candidate,item.id);if(error)throw new DomainError(error,'Møbelet kan ikke plasseres der',409);Object.assign(item,candidate);home.version++;return clone({homeId,action,item,home,inventory:player.inventory,version:home.version})}
    const{instanceId,itemType,x,z,rotation=0}=payload;if(!isId(instanceId)||!FURNITURE_CATALOG[itemType])throw new DomainError('invalid_item','Ugyldig møbel');if(home.items.some(item=>item.id===instanceId))throw new DomainError('duplicate_item','Møbelet finnes allerede');if(home.items.length>=24)throw new DomainError('home_full','Boligen har nådd møbelgrensen');if((player.inventory[itemType]||0)<1)throw new DomainError('not_owned','Møbelet finnes ikke i inventaret',409);const item={id:instanceId,type:itemType,x:round(x),z:round(z),rotation:normalizeRotation(rotation)},error=furniturePlacementError(home,item);if(error)throw new DomainError(error,'Møbelet kan ikke plasseres der',409);player.inventory[itemType]--;home.items.push(item);home.version++;return clone({homeId,action:'place',item,home,inventory:player.inventory,version:home.version});
  }
  createListing(actorId,{listingId,itemType,priceMinor}){const player=this.requirePlayer(actorId);if(!isId(listingId)||this.listings.has(listingId)||!FURNITURE_CATALOG[itemType]||!validateMoney(priceMinor)||priceMinor<1||priceMinor>100_000)throw new DomainError('invalid_listing','Ugyldig salgsannonse');if((player.inventory[itemType]||0)<1)throw new DomainError('not_owned','Varen finnes ikke i inventaret',409);player.inventory[itemType]--;const listing={id:listingId,sellerId:actorId,sellerName:player.displayName,itemType,priceMinor,status:'open',createdOrder:++this.sequence};this.listings.set(listingId,listing);return clone({listing,inventory:player.inventory})}
  cancelListing(actorId,{listingId}){const player=this.requirePlayer(actorId),listing=this.listings.get(listingId);if(!listing||listing.status!=='open')throw new DomainError('listing_unavailable','Annonsen er ikke tilgjengelig',409);if(listing.sellerId!==actorId)throw new DomainError('forbidden','Bare selgeren kan trekke annonsen',403);listing.status='cancelled';player.inventory[listing.itemType]=(player.inventory[listing.itemType]||0)+1;return clone({listing,inventory:player.inventory})}
  purchaseListing(actorId,{listingId}){
    const buyer=this.requirePlayer(actorId),listing=this.listings.get(listingId);if(!listing||listing.status!=='open')throw new DomainError('listing_unavailable','Annonsen er ikke tilgjengelig',409);if(listing.sellerId===actorId)throw new DomainError('self_purchase','Du kan ikke kjøpe din egen vare');const seller=this.requirePlayer(listing.sellerId);if(buyer.balanceMinor<listing.priceMinor)throw new DomainError('insufficient_funds','Ikke nok saldo',409);
    let transaction;try{transaction=postTransfer(this.players,this.ledger,{transactionId:`txn_${String(++this.sequence).padStart(6,'0')}`,fromAccount:actorId,toAccount:seller.id,amountMinor:listing.priceMinor,referenceId:listingId})}catch(error){if(error instanceof LedgerError)throw new DomainError(error.code,error.message,409);throw error}buyer.inventory[listing.itemType]=(buyer.inventory[listing.itemType]||0)+1;listing.status='sold';listing.buyerId=actorId;return clone({listing,transaction,buyerBalanceMinor:buyer.balanceMinor,inventory:buyer.inventory})
  }
  requestBuild(actorId,payload){const current=this.builds.get(actorId)||normalizeConstructionState();let result;if(payload.action==='place')result=placeModule(current,payload.moduleType,{x:payload.x,z:payload.z,rotation:payload.rotation});else if(payload.action==='remove')result=removeModule(current,payload.moduleId);else if(payload.action==='rotate')result=rotateModule(current,payload.moduleId);else throw new DomainError('invalid_build_action','Ugyldig byggehandling');if(result.error)throw new DomainError(result.error,'Byggehandlingen ble avvist',409);this.builds.set(actorId,result.state);return clone({action:payload.action,construction:result.state,module:result.module||null})}
  requirePlayer(id){const value=this.players.get(id);if(!value)throw new DomainError('player_not_found','Spilleren finnes ikke',404);return value}
  requireHome(id){const value=this.homes.get(id);if(!value)throw new DomainError('home_not_found','Boligen finnes ikke',404);return value}
  removeFromRoom(room,actorId){room.members=room.members.filter(id=>id!==actorId);if(room.presence)delete room.presence[actorId]}
  roomSnapshot(room){return{id:room.id,members:room.members.map(id=>({id,displayName:this.players.get(id)?.displayName||'Ukjent',presence:room.presence?.[id]||null})),messages:room.messages}}
  exportState(){return clone({version:1,sequence:this.sequence,players:[...this.players],homes:[...this.homes],builds:[...this.builds],rooms:[...this.rooms],listings:[...this.listings],ledger:this.ledger,processed:[...this.processed]})}
  static fromState(state){const world=new AuthoritativeWorld();if(!state||state.version!==1)return world;for(const key of['players','homes','builds','rooms','listings','processed'])world[key]=new Map(Array.isArray(state[key])?state[key]:[]);world.ledger=normalizeLedger(state.ledger);world.sequence=Number.isSafeInteger(state.sequence)?state.sequence:0;return world}
}

function toggle(values,id,on){const next=new Set(values);if(on)next.add(id);else next.delete(id);return [...next]}
function round(value){return Math.round(value*4)/4}
function normalizeRotation(value){const quarter=Math.round((Number(value)||0)/(Math.PI/2));return((quarter%4)+4)%4*Math.PI/2}
