import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {AuthoritativeWorld,DomainError} from './authoritative-world.mjs';
import {SQLiteWorldStore} from './sqlite-store.mjs';

export function createAlteraServer({world=new AuthoritativeWorld(),store=null,allowedOrigin=process.env.ALTERA_ORIGIN||'http://localhost:8080'}={}){
  const sessions=new Map();
  const server=http.createServer(async(request,response)=>{
    setHeaders(response,allowedOrigin);
    if(request.method==='OPTIONS'){response.writeHead(204);response.end();return}
    try{
      const url=new URL(request.url,'http://localhost');
      if(request.method==='GET'&&url.pathname==='/health')return json(response,200,{ok:true,service:'altera-authority-dev',persistence:store?'sqlite':'memory'});
      if(request.method==='POST'&&url.pathname==='/v1/session'){
        const body=await readJson(request),id=`player_${randomUUID().replaceAll('-','').slice(0,12)}`,token=randomUUID();
        const snapshot=world.registerPlayer({id,displayName:body.displayName});sessions.set(token,id);store?.save(world);return json(response,201,{token,snapshot});
      }
      const actorId=authenticate(request,sessions);
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

function authenticate(request,sessions){const value=request.headers.authorization||'',token=value.startsWith('Bearer ')?value.slice(7):'',actorId=sessions.get(token);if(!actorId)throw new DomainError('unauthorized','Ugyldig eller manglende sesjon',401);return actorId}
function readJson(request){return new Promise((resolve,reject)=>{let raw='';request.setEncoding('utf8');request.on('data',chunk=>{raw+=chunk;if(raw.length>32_000){const error=Error('Forespørselen er for stor');error.code='invalid_json';reject(error);request.destroy()}});request.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{const error=Error('Ugyldig JSON');error.code='invalid_json';reject(error)}});request.on('error',reject)})}
function setHeaders(response,allowedOrigin){response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-store');response.setHeader('Access-Control-Allow-Origin',allowedOrigin);response.setHeader('Access-Control-Allow-Headers','authorization,content-type');response.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS')}
function json(response,status,value){response.writeHead(status);response.end(JSON.stringify(value))}

if(import.meta.url===`file://${process.argv[1]}`){const port=Number(process.env.PORT)||8787,store=new SQLiteWorldStore(process.env.ALTERA_DB||'altera-dev.sqlite'),{server}=createAlteraServer({world:store.load(),store});server.listen(port,'127.0.0.1',()=>console.log(`ALTERA authority dev server: http://127.0.0.1:${port}`));const close=()=>server.close(()=>{store.close();process.exit(0)});process.on('SIGINT',close);process.on('SIGTERM',close)}
