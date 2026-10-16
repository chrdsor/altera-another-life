import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AuthoritativeWorld} from './authoritative-world.mjs';
import {SQLiteWorldStore} from './sqlite-store.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message)},dir=await mkdtemp(join(tmpdir(),'altera-migration-')),path=join(dir,'legacy.sqlite');
try{
  const legacyWorld=new AuthoritativeWorld();legacyWorld.registerPlayer({id:'player_legacy',displayName:'Legacy Ava'});const legacy=new DatabaseSync(path);legacy.exec("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL); CREATE TABLE world_snapshots(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL); INSERT INTO schema_migrations VALUES(1,datetime('now'));");legacy.prepare("INSERT INTO world_snapshots VALUES('primary',?,?,datetime('now'))").run(legacyWorld.revision,JSON.stringify(legacyWorld.exportState()));legacy.close();
  const store=new SQLiteWorldStore(path),world=store.load();assert(store.db.prepare('SELECT MAX(version) AS version FROM schema_migrations').get().version===4,'legacy database migrates to v4');assert(world.playerSnapshot('player_legacy').player.displayName==='Legacy Ava','legacy snapshot imported');assert(store.db.prepare("SELECT display_name FROM players WHERE id='player_legacy'").get().display_name==='Legacy Ava','legacy player normalized');store.db.prepare("UPDATE world_snapshots SET payload='{}'").run();store.close();
  const reopened=new SQLiteWorldStore(path),normalized=reopened.load();assert(normalized.playerSnapshot('player_legacy').player.homeId==='home_player_legacy','migrated world no longer depends on snapshot');reopened.close();console.log('SQLite v1 to v4 migration checks passed');
}finally{await rm(dir,{recursive:true,force:true})}
