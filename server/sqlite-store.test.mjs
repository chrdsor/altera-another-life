import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SQLiteWorldStore} from './sqlite-store.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message)},command=(commandId,actorId,type,payload)=>({version:1,commandId,actorId,type,payload});
const dir=await mkdtemp(join(tmpdir(),'altera-store-')),path=join(dir,'world.sqlite');
try{
  let store=new SQLiteWorldStore(path),world=store.load();world.registerPlayer({id:'player_001',displayName:'Ava'});world.execute(command('cmd_join_001','player_001','join_room',{roomId:'night_lounge'}));world.execute(command('cmd_presence_001','player_001','update_presence',{roomId:'night_lounge',x:2,z:-1,yaw:.5,now:1000}));store.save(world);store.close();
  store=new SQLiteWorldStore(path);world=store.load();const snapshot=world.playerSnapshot('player_001');assert(snapshot.player.displayName==='Ava','player survives restart');assert(snapshot.rooms[0].members[0].presence.x===2,'presence survives restart');const replay=world.execute(command('cmd_join_001','player_001','join_room',{roomId:'night_lounge'}));assert(replay.commandId==='cmd_join_001','idempotency survives restart');store.close();console.log('SQLite persistence restart checks passed');
}finally{await rm(dir,{recursive:true,force:true})}
