import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAlteraServer} from './http-server.mjs';
import {SQLiteWorldStore} from './sqlite-store.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message)},dir=await mkdtemp(join(tmpdir(),'altera-session-')),path=join(dir,'world.sqlite');let server,store;
const listen=async()=>{store=new SQLiteWorldStore(path);({server}=createAlteraServer({world:store.load(),store}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return`http://127.0.0.1:${server.address().port}`},close=async()=>{await new Promise(resolve=>server.close(resolve));store.close()},request=async(base,pathName,{token,body}={})=>{const response=await fetch(base+pathName,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return{status:response.status,data:await response.json()}};
try{
  let base=await listen(),response=await request(base,'/v1/session',{body:{displayName:'Restart Ava'}}),token=response.data.token,actorId=response.data.snapshot.player.id,hash=createHash('sha256').update(token).digest('hex');assert(response.status===201,'session created');assert(store.db.prepare('SELECT token_hash FROM development_sessions').get().token_hash===hash,'only token hash is stored');assert(!JSON.stringify(store.db.prepare('SELECT * FROM development_sessions').all()).includes(token),'raw token is absent from database');await close();
  base=await listen();response=await request(base,'/v1/snapshot',{token});assert(response.status===200&&response.data.player.id===actorId,'session authenticates after process restart');assert(store.db.prepare('SELECT last_seen_at FROM development_sessions WHERE token_hash=?').get(hash).last_seen_at>0,'session activity is tracked');await close();server=null;store=null;console.log('HTTP session restart checks passed');
}finally{if(server)await new Promise(resolve=>server.close(resolve));store?.close();await rm(dir,{recursive:true,force:true})}
