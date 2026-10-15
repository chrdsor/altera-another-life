# ALTERA – Another Life

ALTERA is an evolving, persistent, player-shaped digital society. The design combines Habbo-style social spaces and belonging, Minecraft-style creative freedom, Cities: Skylines-style interdependent civic systems, and a GTA-inspired realistic 3D presentation.

**Product and engineering source of truth:** [ALTERA Vision & Architecture](docs/ALTERA-VISION-AND-ARCHITECTURE.md).

## Current playable prototypes
- [Avatar Studio](avatar-studio.html)
- [Night Lounge](world.html)
- [District 01](city.html)

These are **prototypes**, not a production-ready multiplayer world.

## Foundation
- `avatar-state.js` / `avatar-appearance.js`: shared avatar state and rendering
- `world-domain.js`: versioned world, parcel and command contracts
- `world-domain.test.mjs`: zero-dependency domain validation tests (run with `node world-domain.test.mjs`)

## Roadmap
1. Polished street and avatar quality baseline
2. Authenticated multiplayer presence, chat and moderation
3. Persistent apartment, furniture placement and visits
4. Server-authoritative inventory, trade and double-entry ledger
5. Player-owned parcels, building and businesses
6. Governance, infrastructure, simulation and geographic expansion

**Architecture rule:** localStorage is for client preferences and prototype saves only. Real ownership, money, inventories and society state must live on an authoritative server with durable storage.

GitHub Pages hosts the static prototype. Production social and economic features will require backend infrastructure.
