export class AlteraSocialClient{
  constructor(baseUrl,{fetchImpl=globalThis.fetch}={}){this.baseUrl=String(baseUrl||'').replace(/\/$/,'');this.fetch=fetchImpl;this.token=null;this.actorId=null;this.sequence=0}
  async connect(displayName){const data=await this.request('/v1/session',{method:'POST',body:{displayName}});this.token=data.token;this.actorId=data.snapshot.player.id;return data.snapshot}
  async join(roomId){return this.command('join_room',{roomId})}
  async leave(roomId){return this.command('leave_room',{roomId})}
  async updatePresence(roomId,{x,z,yaw}){return this.command('update_presence',{roomId,x,z,yaw,now:Date.now()})}
  async sendChat(roomId,text){return this.command('send_chat',{roomId,text,now:Date.now()})}
  async snapshot(){return this.request('/v1/snapshot')}
  async command(type,payload){if(!this.actorId)throw Error('Sosial sesjon er ikke startet');return this.request('/v1/commands',{method:'POST',body:{version:1,commandId:`cmd_${Date.now().toString(36)}_${(++this.sequence).toString(36)}`,type,payload}})}
  async request(path,{method='GET',body}={}){const response=await this.fetch(this.baseUrl+path,{method,headers:{'content-type':'application/json',...(this.token?{authorization:`Bearer ${this.token}`}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok){const error=Error(data.error?.message||'Serverfeil');error.code=data.error?.code;throw error}return data}
}
