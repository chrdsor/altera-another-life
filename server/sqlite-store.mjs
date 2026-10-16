import {DatabaseSync} from 'node:sqlite';
import {AuthoritativeWorld} from './authoritative-world.mjs';

export class SQLiteWorldStore{
  constructor(path='altera-dev.sqlite'){
    this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');this.migrate();
  }
  migrate(){
    const current=this.db.prepare('SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations').get().version;
    if(current<1)this.db.exec('BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS world_snapshots(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL); INSERT INTO schema_migrations(version,applied_at) VALUES(1,datetime(\'now\')); COMMIT;');
    if(current<2)this.db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS economy_accounts(player_id TEXT PRIMARY KEY, balance_minor INTEGER NOT NULL CHECK(balance_minor>=0));
      CREATE TABLE IF NOT EXISTS inventory_items(player_id TEXT NOT NULL, item_type TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>=0), PRIMARY KEY(player_id,item_type));
      CREATE TABLE IF NOT EXISTS marketplace_listings(id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, item_type TEXT NOT NULL, price_minor INTEGER NOT NULL CHECK(price_minor>0), status TEXT NOT NULL, buyer_id TEXT);
      CREATE TABLE IF NOT EXISTS economic_transactions(id TEXT PRIMARY KEY, type TEXT NOT NULL, reference_type TEXT, reference_id TEXT, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS ledger_entries(transaction_id TEXT NOT NULL REFERENCES economic_transactions(id), account_id TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor<>0), PRIMARY KEY(transaction_id,account_id));
      CREATE INDEX IF NOT EXISTS ledger_account_idx ON ledger_entries(account_id,transaction_id);
      INSERT INTO schema_migrations(version,applied_at) VALUES(2,datetime('now')); COMMIT;`);
    if(current<3)this.db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS world_meta(id TEXT PRIMARY KEY, sequence INTEGER NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, home_id TEXT NOT NULL, last_chat_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS homes(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, settlement_id TEXT NOT NULL, version INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS home_access(home_id TEXT NOT NULL, player_id TEXT NOT NULL, can_edit INTEGER NOT NULL CHECK(can_edit IN(0,1)), PRIMARY KEY(home_id,player_id));
      CREATE TABLE IF NOT EXISTS home_items(home_id TEXT NOT NULL, id TEXT NOT NULL, type TEXT NOT NULL, x REAL NOT NULL, z REAL NOT NULL, rotation REAL NOT NULL, PRIMARY KEY(home_id,id));
      CREATE TABLE IF NOT EXISTS construction_states(player_id TEXT PRIMARY KEY, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS room_members(room_id TEXT NOT NULL, player_id TEXT NOT NULL, ordinal INTEGER NOT NULL, PRIMARY KEY(room_id,player_id));
      CREATE TABLE IF NOT EXISTS room_presence(room_id TEXT NOT NULL, player_id TEXT NOT NULL, x REAL NOT NULL, z REAL NOT NULL, yaw REAL NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(room_id,player_id));
      CREATE TABLE IF NOT EXISTS room_messages(room_id TEXT NOT NULL, id TEXT NOT NULL, actor_id TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, ordinal INTEGER NOT NULL, PRIMARY KEY(room_id,id));
      CREATE TABLE IF NOT EXISTS processed_commands(command_id TEXT PRIMARY KEY, result_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS development_sessions(token_hash TEXT PRIMARY KEY, actor_id TEXT NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL);
      ALTER TABLE marketplace_listings ADD COLUMN seller_name TEXT;
      ALTER TABLE marketplace_listings ADD COLUMN created_order INTEGER NOT NULL DEFAULT 0;
      INSERT INTO schema_migrations(version,applied_at) VALUES(3,datetime('now')); COMMIT;`);
  }
  load(){
    if(this.db.prepare("SELECT 1 FROM world_meta WHERE id='primary'").get())return this.loadNormalized();
    const row=this.db.prepare("SELECT payload FROM world_snapshots WHERE id='primary'").get();if(!row)return new AuthoritativeWorld();const world=AuthoritativeWorld.fromState(JSON.parse(row.payload));this.save(world);return world;
  }
  loadNormalized(){
    const meta=this.db.prepare("SELECT sequence,revision FROM world_meta WHERE id='primary'").get(),players=new Map(),homes=new Map(),builds=new Map(),rooms=new Map(),listings=new Map(),processed=new Map();
    for(const row of this.db.prepare('SELECT p.id,p.display_name,p.home_id,p.last_chat_at,a.balance_minor FROM players p JOIN economy_accounts a ON a.player_id=p.id').all())players.set(row.id,{id:row.id,displayName:row.display_name,balanceMinor:row.balance_minor,inventory:{},homeId:row.home_id,lastChatAt:row.last_chat_at});
    for(const row of this.db.prepare('SELECT player_id,item_type,quantity FROM inventory_items').all()){const player=players.get(row.player_id);if(player)player.inventory[row.item_type]=row.quantity}
    for(const row of this.db.prepare('SELECT id,owner_id,settlement_id,version FROM homes').all())homes.set(row.id,{id:row.id,ownerId:row.owner_id,settlementId:row.settlement_id,version:row.version,visitors:[],editors:[],items:[]});
    for(const row of this.db.prepare('SELECT home_id,player_id,can_edit FROM home_access').all()){const home=homes.get(row.home_id);if(home){home.visitors.push(row.player_id);if(row.can_edit)home.editors.push(row.player_id)}}
    for(const row of this.db.prepare('SELECT home_id,id,type,x,z,rotation FROM home_items ORDER BY home_id,id').all()){const home=homes.get(row.home_id);if(home)home.items.push({id:row.id,type:row.type,x:row.x,z:row.z,rotation:row.rotation})}
    for(const row of this.db.prepare('SELECT player_id,payload FROM construction_states').all())builds.set(row.player_id,JSON.parse(row.payload));
    for(const row of this.db.prepare('SELECT id FROM rooms').all())rooms.set(row.id,{id:row.id,members:[],messages:[],presence:{}});
    for(const row of this.db.prepare('SELECT room_id,player_id FROM room_members ORDER BY room_id,ordinal').all()){const room=rooms.get(row.room_id);if(room)room.members.push(row.player_id)}
    for(const row of this.db.prepare('SELECT room_id,player_id,x,z,yaw,updated_at FROM room_presence').all()){const room=rooms.get(row.room_id);if(room)room.presence[row.player_id]={x:row.x,z:row.z,yaw:row.yaw,updatedAt:row.updated_at}}
    for(const row of this.db.prepare('SELECT room_id,id,actor_id,text,created_at FROM room_messages ORDER BY room_id,ordinal').all()){const room=rooms.get(row.room_id);if(room)room.messages.push({id:row.id,actorId:row.actor_id,text:row.text,createdAt:row.created_at})}
    for(const row of this.db.prepare('SELECT id,seller_id,seller_name,item_type,price_minor,status,buyer_id,created_order FROM marketplace_listings').all())listings.set(row.id,{id:row.id,sellerId:row.seller_id,sellerName:row.seller_name||players.get(row.seller_id)?.displayName||'Spiller',itemType:row.item_type,priceMinor:row.price_minor,status:row.status,...(row.buyer_id?{buyerId:row.buyer_id}:{}),createdOrder:row.created_order});
    const ledger=[];for(const row of this.db.prepare('SELECT id,type,reference_type,reference_id,created_at FROM economic_transactions ORDER BY rowid').all()){const entries=this.db.prepare('SELECT account_id,amount_minor FROM ledger_entries WHERE transaction_id=? ORDER BY rowid').all(row.id).map(entry=>({accountId:entry.account_id,amountMinor:entry.amount_minor}));ledger.push({id:row.id,type:row.type,referenceType:row.reference_type,referenceId:row.reference_id,createdAt:row.created_at,entries})}
    for(const row of this.db.prepare('SELECT command_id,result_json FROM processed_commands').all())processed.set(row.command_id,JSON.parse(row.result_json));
    return AuthoritativeWorld.fromState({version:1,sequence:meta.sequence,revision:meta.revision,players:[...players],homes:[...homes],builds:[...builds],rooms:[...rooms],listings:[...listings],ledger,processed:[...processed]});
  }
  save(world){
    const state=world.exportState(),payload=JSON.stringify(state),revision=state.revision;this.db.exec('BEGIN IMMEDIATE');
    try{
      this.db.prepare("INSERT INTO world_snapshots(id,revision,payload,updated_at) VALUES('primary',?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at").run(revision,payload);
      this.db.prepare("INSERT INTO world_meta(id,sequence,revision,updated_at) VALUES('primary',?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET sequence=excluded.sequence,revision=excluded.revision,updated_at=excluded.updated_at").run(state.sequence,state.revision);
      this.db.exec('DELETE FROM processed_commands; DELETE FROM room_messages; DELETE FROM room_presence; DELETE FROM room_members; DELETE FROM rooms; DELETE FROM construction_states; DELETE FROM home_items; DELETE FROM home_access; DELETE FROM homes; DELETE FROM inventory_items; DELETE FROM marketplace_listings; DELETE FROM economy_accounts; DELETE FROM players;');
      const player=this.db.prepare('INSERT INTO players(id,display_name,home_id,last_chat_at) VALUES(?,?,?,?)'),account=this.db.prepare('INSERT INTO economy_accounts(player_id,balance_minor) VALUES(?,?)'),inventory=this.db.prepare('INSERT INTO inventory_items(player_id,item_type,quantity) VALUES(?,?,?)'),home=this.db.prepare('INSERT INTO homes(id,owner_id,settlement_id,version) VALUES(?,?,?,?)'),access=this.db.prepare('INSERT INTO home_access(home_id,player_id,can_edit) VALUES(?,?,?)'),item=this.db.prepare('INSERT INTO home_items(home_id,id,type,x,z,rotation) VALUES(?,?,?,?,?,?)'),build=this.db.prepare('INSERT INTO construction_states(player_id,payload) VALUES(?,?)'),room=this.db.prepare('INSERT INTO rooms(id) VALUES(?)'),member=this.db.prepare('INSERT INTO room_members(room_id,player_id,ordinal) VALUES(?,?,?)'),presence=this.db.prepare('INSERT INTO room_presence(room_id,player_id,x,z,yaw,updated_at) VALUES(?,?,?,?,?,?)'),message=this.db.prepare('INSERT INTO room_messages(room_id,id,actor_id,text,created_at,ordinal) VALUES(?,?,?,?,?,?)'),listing=this.db.prepare('INSERT INTO marketplace_listings(id,seller_id,item_type,price_minor,status,buyer_id,seller_name,created_order) VALUES(?,?,?,?,?,?,?,?)'),transaction=this.db.prepare('INSERT OR IGNORE INTO economic_transactions(id,type,reference_type,reference_id,created_at) VALUES(?,?,?,?,?)'),entry=this.db.prepare('INSERT OR IGNORE INTO ledger_entries(transaction_id,account_id,amount_minor) VALUES(?,?,?)'),processedCommand=this.db.prepare('INSERT INTO processed_commands(command_id,result_json) VALUES(?,?)');
      for(const[,value]of state.players){player.run(value.id,value.displayName,value.homeId,value.lastChatAt||0);account.run(value.id,value.balanceMinor);for(const[itemType,quantity]of Object.entries(value.inventory||{}))inventory.run(value.id,itemType,quantity)}
      for(const[,value]of state.homes){home.run(value.id,value.ownerId,value.settlementId,value.version);for(const visitorId of value.visitors||[])access.run(value.id,visitorId,(value.editors||[]).includes(visitorId)?1:0);for(const furniture of value.items||[])item.run(value.id,furniture.id,furniture.type,furniture.x,furniture.z,furniture.rotation)}
      for(const[playerId,value]of state.builds)build.run(playerId,JSON.stringify(value));
      for(const[,value]of state.rooms){room.run(value.id);for(let index=0;index<value.members.length;index++)member.run(value.id,value.members[index],index);for(const[playerId,valuePresence]of Object.entries(value.presence||{}))presence.run(value.id,playerId,valuePresence.x,valuePresence.z,valuePresence.yaw,valuePresence.updatedAt||0);for(let index=0;index<value.messages.length;index++){const valueMessage=value.messages[index];message.run(value.id,valueMessage.id,valueMessage.actorId,valueMessage.text,valueMessage.createdAt,index)}}
      for(const[,value]of state.listings)listing.run(value.id,value.sellerId,value.itemType,value.priceMinor,value.status,value.buyerId||null,value.sellerName||null,value.createdOrder||0);
      for(const value of state.ledger){transaction.run(value.id,value.type,value.referenceType||null,value.referenceId||null,value.createdAt||0);for(const posting of value.entries)entry.run(value.id,posting.accountId,posting.amountMinor)}
      for(const[commandId,result]of state.processed)processedCommand.run(commandId,JSON.stringify(result));this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error}
  }
  loadSessions(){return new Map(this.db.prepare('SELECT token_hash,actor_id FROM development_sessions WHERE actor_id IN(SELECT id FROM players)').all().map(row=>[row.token_hash,row.actor_id]))}
  saveSession(tokenHash,actorId,now=Date.now()){this.db.prepare('INSERT INTO development_sessions(token_hash,actor_id,created_at,last_seen_at) VALUES(?,?,?,?) ON CONFLICT(token_hash) DO UPDATE SET actor_id=excluded.actor_id,last_seen_at=excluded.last_seen_at').run(tokenHash,actorId,now,now)}
  touchSession(tokenHash,now=Date.now()){this.db.prepare('UPDATE development_sessions SET last_seen_at=? WHERE token_hash=?').run(now,tokenHash)}
  close(){this.db.close()}
}
