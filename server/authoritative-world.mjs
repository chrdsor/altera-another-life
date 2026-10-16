import {SCHEMA_VERSION,isId,validateMoney,validateWorldCommand} from '../world-domain.js';

const cleanName=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,32);
const cleanText=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,240);
const clone=value=>structuredClone(value);
const starterInventory=()=>({sofa:1,table:1,lamp:1});

export class DomainError extends Error{
  constructor(code,message,status=400){super(message);this.name='DomainError';this.code=code;this.status=status}
}

export class AuthoritativeWorld{
  constructor(){this.players=new Map();this.homes=new Map();this.rooms=new Map();this.listings=new Map();this.ledger=[];this.processed=new Map();this.sequence=0}
  registerPlayer({id,displayName}){
    if(!isId(id)||this.players.has(id))throw new DomainError('invalid_player','Spiller-ID er ugyldig eller opptatt');
    const name=cleanName(displayName);if(name.length<2)throw new DomainError('invalid_name','Visningsnavnet er for kort');
    const player={id,displayName:name,balanceMinor:2500,inventory:starterInventory(),homeId:`home_${id}`,lastChatAt:0};
    const home={id:player.homeId,ownerId:id,settlementId:'city_01',version:1,visitors:[],editors:[],items:[]};
    this.players.set(id,player);this.homes.set(home.id,home);return this.playerSnapshot(id);
  }
  playerSnapshot(id){const player=this.requirePlayer(id),home=this.homes.get(player.homeId);return clone({player,home,rooms:[...this.rooms.values()].filter(room=>room.members.includes(id)).map(room=>this.roomSnapshot(room))})}
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
    else if(command.type==='purchase_listing')data=this.purchaseListing(command.actorId,command.payload);
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
  placeFurniture(actorId,{homeId,instanceId,itemType,x,z,rotation=0}){
    const home=this.requireHome(homeId),player=this.requirePlayer(actorId);if(home.ownerId!==actorId&&!home.editors.includes(actorId))throw new DomainError('forbidden','Mangler møbleringstilgang',403);if(!isId(instanceId)||!['sofa','table','lamp','chair','plant','shelf'].includes(itemType))throw new DomainError('invalid_item','Ugyldig møbel');if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>5||Math.abs(z)>4)throw new DomainError('invalid_position','Møbelet står utenfor boligen');if(home.items.some(item=>item.id===instanceId))throw new DomainError('duplicate_item','Møbelet finnes allerede');if(home.items.length>=24)throw new DomainError('home_full','Boligen har nådd møbelgrensen');if((player.inventory[itemType]||0)<1)throw new DomainError('not_owned','Møbelet finnes ikke i inventaret',409);
    player.inventory[itemType]--;const item={id:instanceId,type:itemType,x:round(x),z:round(z),rotation:normalizeRotation(rotation)};home.items.push(item);home.version++;return clone({homeId,item,version:home.version});
  }
  createListing(actorId,{listingId,itemType,priceMinor}){const player=this.requirePlayer(actorId);if(!isId(listingId)||this.listings.has(listingId)||!isId(itemType)||!validateMoney(priceMinor)||priceMinor<1)throw new DomainError('invalid_listing','Ugyldig salgsannonse');if((player.inventory[itemType]||0)<1)throw new DomainError('not_owned','Varen finnes ikke i inventaret',409);player.inventory[itemType]--;const listing={id:listingId,sellerId:actorId,itemType,priceMinor,status:'open'};this.listings.set(listingId,listing);return clone(listing)}
  purchaseListing(actorId,{listingId}){
    const buyer=this.requirePlayer(actorId),listing=this.listings.get(listingId);if(!listing||listing.status!=='open')throw new DomainError('listing_unavailable','Annonsen er ikke tilgjengelig',409);if(listing.sellerId===actorId)throw new DomainError('self_purchase','Du kan ikke kjøpe din egen vare');const seller=this.requirePlayer(listing.sellerId);if(buyer.balanceMinor<listing.priceMinor)throw new DomainError('insufficient_funds','Ikke nok saldo',409);
    buyer.balanceMinor-=listing.priceMinor;seller.balanceMinor+=listing.priceMinor;buyer.inventory[listing.itemType]=(buyer.inventory[listing.itemType]||0)+1;listing.status='sold';listing.buyerId=actorId;const transaction={id:`txn_${String(++this.sequence).padStart(6,'0')}`,listingId,fromAccount:actorId,toAccount:seller.id,amountMinor:listing.priceMinor};this.ledger.push(transaction);return clone({listing,transaction,buyerBalanceMinor:buyer.balanceMinor})
  }
  requirePlayer(id){const value=this.players.get(id);if(!value)throw new DomainError('player_not_found','Spilleren finnes ikke',404);return value}
  requireHome(id){const value=this.homes.get(id);if(!value)throw new DomainError('home_not_found','Boligen finnes ikke',404);return value}
  removeFromRoom(room,actorId){room.members=room.members.filter(id=>id!==actorId);if(room.presence)delete room.presence[actorId]}
  roomSnapshot(room){return{id:room.id,members:room.members.map(id=>({id,displayName:this.players.get(id)?.displayName||'Ukjent',presence:room.presence?.[id]||null})),messages:room.messages}}
  exportState(){return clone({version:1,sequence:this.sequence,players:[...this.players],homes:[...this.homes],rooms:[...this.rooms],listings:[...this.listings],ledger:this.ledger,processed:[...this.processed]})}
  static fromState(state){const world=new AuthoritativeWorld();if(!state||state.version!==1)return world;for(const key of['players','homes','rooms','listings','processed'])world[key]=new Map(Array.isArray(state[key])?state[key]:[]);world.ledger=Array.isArray(state.ledger)?state.ledger:[];world.sequence=Number.isSafeInteger(state.sequence)?state.sequence:0;return world}
}

function toggle(values,id,on){const next=new Set(values);if(on)next.add(id);else next.delete(id);return [...next]}
function round(value){return Math.round(value*4)/4}
function normalizeRotation(value){const quarter=Math.round((Number(value)||0)/(Math.PI/2));return((quarter%4)+4)%4*Math.PI/2}
