# ALTERA development authority

This is a dependency-free Node development service for validating the first social/property/economy loop. It uses the Node 24 built-in SQLite module for restart-safe development persistence, but it is not a production server.

Run it with:

```sh
ALTERA_ORIGIN=http://localhost:8080 ALTERA_DB=altera-dev.sqlite node server/http-server.mjs
```

Serve the client on the allowed origin and open:

```text
http://localhost:8080/world.html?authority=http://127.0.0.1:8787
```

Implemented contracts: development sessions, actor binding, room join/leave, normalized presence, rate-limited chat, starter home and inventory, access control, validated furniture placement, escrow-style listings, listing cancellation, idempotent commands and atomic double-entry integer-money transfers.

SQLite migration 3 makes normalized rows the canonical load path for players, homes, access, furniture, construction, rooms, presence, chat, idempotency, accounts, inventory, listings, transactions and ledger postings. The world snapshot remains only as a compatibility copy and migration source. Every completed marketplace payment has equal debit and credit postings, while rejected payments leave balances, inventory, listings and ledger unchanged.

Development sessions survive process restarts. Clients receive a random bearer token, while SQLite stores only its SHA-256 digest. This is a development identity mechanism, not a substitute for an external production identity provider.

Required before production: external identity provider, multi-process concurrency controls, WebSocket gateway, encrypted deployment, audit retention, moderation tooling, managed backups, rate limiting at the edge and security review.
