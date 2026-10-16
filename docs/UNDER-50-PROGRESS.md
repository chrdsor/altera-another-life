# ALTERA - Closing the under-50% gaps

The target is demonstrable prototype coverage, not a claim of production completeness. Percentages are working estimates and must be backed by positive and negative tests plus connection to a player loop.

## Current milestone

- `simulation-kernel.js` covers deterministic parcels, construction, access, inventory, marketplace, transfers, idempotency, rollback and audit events.
- `server/authoritative-world.mjs` covers stable player identity, starter homes, permissions, room membership, normalized presence, rate-limited chat, furniture commands, listings and integer-money transfers.
- `server/http-server.mjs` binds every command to the authenticated development session and rejects actor spoofing.
- `server/sqlite-store.mjs` migration 4 uses normalized rows as its canonical load path. Tests deliberately corrupt the compatibility snapshot and still restore players, homes, access, furniture, construction, rooms, chat, market, ledger and idempotency state.
- `account.html?authority=...` provides registration and login. Passwords use salted scrypt hashes; seven-day bearer sessions survive a full HTTP process restart, expire, revoke on logout and store only SHA-256 token digests.
- `social-client.js` connects two tested clients to the same room. Night Lounge activates the online room list, synchronized chat and presence when an authority URL is configured.
- `home.html?authority=...` resumes the same session and uses the server-owned home and inventory for validated placement, movement, rotation and removal while retaining an explicit local fallback.
- `market.html?authority=...` exposes server-owned balance, inventory, listings, purchases, cancellation and account activity. Payments are balanced debit/credit postings and migration 4 persists normalized economy rows.

## Honest coverage after this milestone

| System | Prototype coverage | What blocks 50% |
|---|---:|---|
| Identity and multiplayer | 50% | External identity provider, account recovery/MFA, WebSocket movement and hosted service |
| Persistence | 50% | Multi-process concurrency, backups, retention and production migration operations |
| Economy | 50% | Hosted authority, broader item economy, fraud controls and operational tooling |
| Property and home | 50% | Visits, access-management UI, production furniture assets and hosted authority |
| Social | 40% | Remote avatar rendering, friends/invites, blocking and moderation workflow |
| Construction | 50% | Multi-cell structures, shared rendering and production asset kit |
| NPC and society | 10% | Jobs, businesses, schedules, organizations and governance loop |
| Character art | 25% | Finished licensed Hero 001 GLB, facial rig, hair cards, garments and LOD |
| World art | 25% | Hero street assets, authored materials/lightmaps and device benchmarks |

## Next gates

1. Render remote player avatars in Night Lounge and add blocking/moderation contracts to bring Social to 50%.
2. Add home visits and an access-management UI on top of the existing server-owned home state.
3. Extend the server-connected modular parcel editor with multi-cell structures, shared rendering and inventory-backed materials.
4. Produce or license Hero 001 and one hero street kit; code alone cannot close the art gap.

## Security boundary

No client-supplied balance, ownership, inventory grant or NPC wage is trusted. Registered development accounts and guest session creation are not production authentication. Public launch requires TLS, external identity with recovery/MFA, edge rate limiting, moderation storage, transactional audit history and a security review.
