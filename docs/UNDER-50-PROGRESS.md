# ALTERA - Closing the under-50% gaps

The target is demonstrable prototype coverage, not a claim of production completeness. Percentages are working estimates and must be backed by positive and negative tests plus connection to a player loop.

## Current milestone

- `simulation-kernel.js` covers deterministic parcels, construction, access, inventory, marketplace, transfers, idempotency, rollback and audit events.
- `server/authoritative-world.mjs` covers development identity, starter homes, permissions, room membership, normalized presence, rate-limited chat, furniture commands, listings and integer-money transfers.
- `server/http-server.mjs` binds every command to the authenticated development session and rejects actor spoofing.
- `server/sqlite-store.mjs` provides versioned SQLite persistence; restart tests prove that players, rooms, presence and idempotency records survive a process restart.
- `social-client.js` connects two tested clients to the same room. Night Lounge activates the online room list, synchronized chat and presence when an authority URL is configured.
- `home.html?authority=...` resumes the same session and uses the server-owned home and inventory for validated placement, movement, rotation and removal while retaining an explicit local fallback.
- `market.html?authority=...` exposes server-owned balance, inventory, listings, purchases, cancellation and account activity. Payments are balanced debit/credit postings and migration 2 persists normalized economy rows.

## Honest coverage after this milestone

| System | Prototype coverage | What blocks 50% |
|---|---:|---|
| Identity and multiplayer | 35% | External authentication, WebSocket movement and hosted service |
| Persistence | 45% | Canonical normalized world loading, concurrency, backups and migration operations |
| Economy | 50% | Hosted authority, broader item economy, fraud controls and operational tooling |
| Property and home | 50% | Visits, access-management UI, production furniture assets and hosted authority |
| Social | 40% | Remote avatar rendering, friends/invites, blocking and moderation workflow |
| Construction | 50% | Multi-cell structures, shared rendering and production asset kit |
| NPC and society | 10% | Jobs, businesses, schedules, organizations and governance loop |
| Character art | 25% | Finished licensed Hero 001 GLB, facial rig, hair cards, garments and LOD |
| World art | 25% | Hero street assets, authored materials/lightmaps and device benchmarks |

## Next gates

1. Make normalized SQLite rows the canonical load path for the full world and add backup/migration operations.
2. Add hosted authentication and WebSocket transport, then render remote avatars in Night Lounge.
3. Add home visits and an access-management UI on top of the existing server-owned home state.
4. Extend the server-connected modular parcel editor with multi-cell structures, shared rendering and inventory-backed materials.
5. Produce or license Hero 001 and one hero street kit; code alone cannot close the art gap.

## Security boundary

No client-supplied balance, ownership, inventory grant or NPC wage is trusted. Developer session creation and seed helpers are not production authentication. Public launch requires TLS, external identity, edge rate limiting, moderation storage, transactional audit history and a security review.
