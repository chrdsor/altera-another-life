import {DatabaseSync} from 'node:sqlite';
import {AuthoritativeWorld} from './authoritative-world.mjs';

export class SQLiteWorldStore{
  constructor(path='altera-dev.sqlite'){
    this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');this.migrate();
  }
  migrate(){const current=this.db.prepare('SELECT COALESCE(MAX(version),0) AS version FROM schema_migrations').get().version;if(current<1){this.db.exec('BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS world_snapshots(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL); INSERT INTO schema_migrations(version,applied_at) VALUES(1,datetime(\'now\')); COMMIT;')}}
  load(){const row=this.db.prepare("SELECT payload FROM world_snapshots WHERE id='primary'").get();if(!row)return new AuthoritativeWorld();return AuthoritativeWorld.fromState(JSON.parse(row.payload))}
  save(world){const payload=JSON.stringify(world.exportState()),revision=world.sequence;this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare("INSERT INTO world_snapshots(id,revision,payload,updated_at) VALUES('primary',?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at").run(revision,payload);this.db.exec('COMMIT')}catch(error){this.db.exec('ROLLBACK');throw error}}
  close(){this.db.close()}
}
