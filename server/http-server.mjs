import http from 'node:http';
import {createHash,randomBytes,randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
import {AuthoritativeWorld,DomainError} from './authoritative-world.mjs';
import {SQLiteWorldStore} from './sqlite-store.mjs';

export function createAlteraServer({world=new AuthoritativeWorld(),store=null,allowedOrigin=process.env.ALTERA_ORIGIN||'http://localhost:8080'}={}){
  const sessions=store?.loadSessions?.()||new Map(),accounts=new Map();
  const server=http.createServer(async(request,response)=>{
    setHeaders(response,allowedOrigin);
    if(request.method==='OPTIONS'){response.writeHead(204);response.end();return}
    try{
      const url=new URL(request.url,'http://localhost');
      if(request.method==='GET'&&url.pathname==='/health')return json(response,200,{ok:true,service:'altera-authority-dev',persistence:store?'sqlite':'memory'});
      if(request.method==='POST'&&url.pathname==='/v1/account/register'){
        const body=await readJson(request),username=normalizeUsername(body.username),password=validatePassword(body.password);if(!username)throw new DomainError('invalid_username','Brukernavnet må ha 3–24 tegn og kan bruke a–z, 0–9 og understrek');if(findAccount(store,accounts,username))throw new DomainError('account_exists','Kontoen finnes allerede',409);
        const id=`player_${randomUUID().replaceAll('-','').slice(0,12)}`,salt=randomBytes(16).toString('hex'),passwordHash=hashPassword(password,salt),snapshot=world.registerPlayer({id,displayName:body.displayName||username});store?.save(world);saveAccount(store,accounts,{username,playerId:id,passwordSalt:salt,passwordHash});const session=createSession(sessions,store,id);return json(response,201,{...session,account:{username},snapshot});
      }
      if(request.method==='POST'&&url.pathname==='/v1/account/login'){
        const body=await readJson(request),username=normalizeUsername(body.username),account=username&&findAccount(store,accounts,username);if(!account||!verifyPassword(body.password,account))throw new DomainError('invalid_credentials','Ugyldig brukernavn eller passord',401);const session=createSession(sessions,store,account.playerId);return json(response,200,{...session,account:{username:account.username},snapshot:world.playerSnapshot(account.playerId)});
      }
      if(request.method==='POST'&&url.pathname==='/v1/session'){
        const body=await readJson(request),id=`player_${randomUUID().replaceAll('-','').slice(0,12)}`;
        const snapshot=world.registerPlayer({id,displayName:body.displayName});store?.save(world);return json(response,201,{...createSession(sessions,store,id),account:null,snapshot});
      }
      const{actorId,key}=authenticate(request,sessions);store?.touchSession?.(key);
      if(request.method==='POST'&&url.pathname==='/v1/session/revoke'){sessions.delete(key);store?.revokeSession?.(key);return json(response,200,{ok:true,revoked:true})}
      if(request.method==='GET'&&url.pathname==='/v1/snapshot')return json(response,200,world.playerSnapshot(actorId));
      if(request.method==='POST'&&url.pathname==='/v1/commands'){
        const body=await readJson(request);if(body.actorId&&body.actorId!==actorId)throw new DomainError('actor_mismatch','Sesjonen kan bare handle som seg selv',403);
        const result=world.execute({...body,actorId});store?.save(world);return json(response,200,result);
      }
      throw new DomainError('not_found','Endepunktet finnes ikke',404);
    }catch(error){const status=error instanceof DomainError?error.status:error.code==='invalid_json'?400:500;json(response,status,{ok:false,error:{code:error.code||'internal_error',message:status===500?'Intern serverfeil':error.message}})}
  });
  return{server,world,sessions};
}

function authenticate(request,sessions){const value=request.headers.authorization||'',token=value.startsWith('Bearer ')?value.slice(7):'',key=sessionKey(token),session=sessions.get(key);if(!session||session.expiresAt<=Date.now()){if(session)sessions.delete(key);throw new DomainError('unauthorized','Ugyldig eller manglende sesjon',401)}return{actorId:session.actorId,key}}
function sessionKey(token){return createHash('sha256').update(String(token)).digest('hex')}
function createSession(sessions,store,actorId){const token=randomUUID()+randomBytes(16).toString('hex'),key=sessionKey(token),expiresAt=Date.now()+604_800_000;sessions.set(key,{actorId,expiresAt});store?.saveSession?.(key,actorId,Date.now(),expiresAt);return{token,expiresAt}}
function normalizeUsername(value){const username=String(value||'').trim().toLowerCase();return/^[a-z0-9_]{3,24}$/.test(username)?username:null}
function validatePassword(value){const password=String(value||'');if(password.length<10||password.length>128)throw new DomainError('invalid_password','Passordet må ha 10–128 tegn');return password}
function hashPassword(password,salt){return scryptSync(password,Buffer.from(salt,'hex'),64,{N:16_384,r:8,p:1,maxmem:64*1024*1024}).toString('hex')}
function verifyPassword(password,account){try{const actual=Buffer.from(hashPassword(String(password||''),account.passwordSalt),'hex'),expected=Buffer.from(account.passwordHash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
function findAccount(store,accounts,username){return store?.findAccount?.(username)||accounts.get(username)||null}
function saveAccount(store,accounts,account){if(store?.createAccount)store.createAccount(account);else accounts.set(account.username,account)}
function readJson(request){return new Promise((resolve,reject)=>{let raw='';request.setEncoding('utf8');request.on('data',chunk=>{raw+=chunk;if(raw.length>32_000){const error=Error('Forespørselen er for stor');error.code='invalid_json';reject(error);request.destroy()}});request.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{const error=Error('Ugyldig JSON');error.code='invalid_json';reject(error)}});request.on('error',reject)})}
function setHeaders(response,allowedOrigin){response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-store');response.setHeader('Access-Control-Allow-Origin',allowedOrigin);response.setHeader('Access-Control-Allow-Headers','authorization,content-type');response.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS')}
function json(response,status,value){response.writeHead(status);response.end(JSON.stringify(value))}

if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT)||8787,store=new SQLiteWorldStore(process.env.ALTERA_DB||'altera-dev.sqlite'),{server}=createAlteraServer({world:store.load(),store});server.listen(port,'127.0.0.1',()=>console.log(`ALTERA authority dev server: http://127.0.0.1:${port}`));const close=()=>server.close(()=>{store.close();process.exit(0)});process.on('SIGINT',close);process.on('SIGTERM',close)}
