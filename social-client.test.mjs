import {createAlteraServer} from './server/http-server.mjs';
import {AlteraSocialClient} from './social-client.js';

const assert=(ok,message)=>{if(!ok)throw Error(message)};
const {server}=createAlteraServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
try{
  const ava=new AlteraSocialClient(base),kai=new AlteraSocialClient(base);await ava.connect('Ava');await kai.connect('Kai');await ava.join('night_lounge');await kai.join('night_lounge');await ava.updatePresence('night_lounge',{x:1,z:2,yaw:.5});await ava.sendChat('night_lounge','Hei Kai');const snapshot=await kai.snapshot(),room=snapshot.rooms[0];assert(room.members.length===2,'two-player presence');assert(room.members.find(member=>member.id===ava.actorId).presence.x===1,'position synchronized');assert(room.messages[0].text==='Hei Kai','chat synchronized');await kai.leave('night_lounge');assert((await ava.snapshot()).rooms[0].members.length===1,'leave synchronized');console.log('Social client checks passed');
}finally{await new Promise(resolve=>server.close(resolve))}
