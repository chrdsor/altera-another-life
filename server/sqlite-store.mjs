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
  }
  load(){const row=this.db.prepare("SELECT payload FROM world_snapshots WHERE id='primary'").get();if(!row)return new AuthoritativeWorld();return AuthoritativeWorld.fromState(JSON.parse(row.payload))}
  save(world){
    const state=world.exportState(),payload=JSON.stringify(state),revision=world.sequence;this.db.exec('BEGIN IMMEDIATE');
    try{
      this.db.prepare("INSERT INTO world_snapshots(id,revision,payload,updated_at) VALUES('primary',?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at").run(revision,payload);
      const account=this.db.prepare('INSERT INTO economy_accounts(player_id,balance_minor) VALUES(?,?) ON CONFLICT(player_id) DO UPDATE SET balance_minor=excluded.balance_minor'),inventory=this.db.prepare('INSERT INTO inventory_items(player_id,item_type,quantity) VALUES(?,?,?)'),listing=this.db.prepare('INSERT INTO marketplace_listings(id,seller_id,item_type,price_minor,status,buyer_id) VALUES(?,?,?,?,?,?)'),transaction=this.db.prepare('INSERT OR IGNORE INTO economic_transactions(id,type,reference_type,reference_id,created_at) VALUES(?,?,?,?,?)'),entry=this.db.prepare('INSERT OR IGNORE INTO ledger_entries(transaction_id,account_id,amount_minor) VALUES(?,?,?)');
      this.db.exec('DELETE FROM inventory_items; DELETE FROM marketplace_listings;');
      for(const[,player]of state.players){account.run(player.id,player.balanceMinor);for(const[itemType,quantity]of Object.entries(player.inventory||{}))inventory.run(player.id,itemType,quantity)}
      for(const[,value]of state.listings)listing.run(value.id,value.sellerId,value.itemType,value.priceMinor,value.status,value.buyerId||null);
      for(const value of state.ledger){transaction.run(value.id,value.type,value.referenceType||null,value.referenceId||null,value.createdAt||0);for(const posting of value.entries)entry.run(value.id,posting.accountId,posting.amountMinor)}
      this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error}
  }
  close(){this.db.close()}
}
