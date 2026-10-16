# ALTERA – Closing the under-50% gaps

The aim is to raise **prototype coverage**, not claim production completeness. Percentages are subjective estimates, not verified measurements.

## Implemented this iteration
- `simulation-kernel.js`: pure in-memory simulation for players, accounts, parcels, access, building, inventory, marketplace, transfers, command idempotency, event history and snapshots.
- `simulation-kernel.test.mjs`: deterministic tests covering unauthorized access, duplicate command replay, building requirements, market trade, insufficient funds and atomic rollback.
- Command operations use structured cloning before applying state changes; this is a **single-process prototype**, not durable DB transactions.
- Real money, login, public network endpoints and trusted server authority are **not** implemented.

## Next implementation gates
| Priority | System | Prototype gate | Production gate |
|---|---|---|---|
| P0 | Identity & multiplayer | Two local simulated clients + protocol tests | Auth, secure sessions, rate limits, server-side positions |
| P0 | Persistence | Versioned SQLite/Postgres schema + restart tests | Backup/restore, migration and transaction isolation |
| P0 | Economy | In-memory atomic transfer/listing tests | Double-entry DB ledger, audit trail, fraud limits |
| P1 | Property | Parcel ownership/access/build validation | Server permissions, construction geometry validation |
| P1 | Social | Chat/invite protocol with blocking tests | Moderation, privacy, report workflows |
| P1 | Construction | Modular placement + parcel bounds tests | Shared world editor, undo/audit, streaming |
| P2 | NPC/society | Jobs, business and governance data contracts | Economy balancing, simulation scheduling, abuse resistance |
| P2 | Art | One hero character and hero street benchmark | LOD, optimization, consistent production assets |

## Security model
No client-supplied balance, parcel ownership, item grant or NPC wage may be trusted. Seed helpers such as `giveItem` and `addPlayer` are **developer-only** and must never be exposed as unauthenticated endpoints. A production ledger requires immutable double-entry postings and transactional persistence.

## Definition of 50% prototype coverage
A feature is halfway to a functional prototype only if it is demonstrable, has positive and negative tests, and is connected to an actual player loop. A data contract alone does not qualify.
