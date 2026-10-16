import {createAlteraServer} from './http-server.mjs';

const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const {server}=createAlteraServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const request=async(path,{token,body,method=body?'POST':'GET'}={})=>{const response=await fetch(base+path,{method,headers:{...(token?{authorization:`Bearer ${token}`}:{ }),'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return{status:response.status,data:await response.json()}};
try{
  let response=await request('/health');assert(response.status===200&&response.data.persistence==='memory','health contract');
  response=await request('/v1/snapshot');assert(response.status===401&&response.data.error.code==='unauthorized','authentication required');
  const session=await request('/v1/session',{body:{displayName:'Ava'}});assert(session.status===201&&session.data.token,'session created');const token=session.data.token,actorId=session.data.snapshot.player.id;
  response=await request('/v1/commands',{token,body:{version:1,commandId:'cmd_http_001',actorId:'player_someone_else',type:'join_room',payload:{roomId:'night_lounge'}}});assert(response.status===403&&response.data.error.code==='actor_mismatch','actor spoofing blocked');
  response=await request('/v1/commands',{token,body:{version:1,commandId:'cmd_http_002',type:'join_room',payload:{roomId:'night_lounge'}}});assert(response.status===200&&response.data.data.members.includes(actorId),'authorized command');
  response=await request('/v1/snapshot',{token});assert(response.data.rooms[0].id==='night_lounge','room presence in snapshot');
  console.log('ALTERA HTTP authority checks passed');
}finally{await new Promise(resolve=>server.close(resolve))}
