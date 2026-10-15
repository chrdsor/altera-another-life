# ALTERA – Another Life | Product constitution (v1)

## North star
ALTERA is a persistent, player-shaped alternative universe. The player inhabits a customizable 3D avatar in a coherent GTA-quality *visual direction* (not a claim of current fidelity). Social belonging and rooms take inspiration from Habbo; free construction from Minecraft; interdependent urban systems from Cities: Skylines. No direct copying of protected assets or UI.

## Non-negotiable design pillars
1. **One coherent art bible.** Nordic-coastal contemporary city, realistic human scale, physically plausible materials, controlled violet/amber accents, consistent lighting and LOD budgets. Third-party models require visual normalization and documented licenses.
2. **Social first.** Avatar identity, friends, public/private spaces, presence, consent-based interactions, furnishings, events and moderation. The first playable loop must be fun before the economy is complex.
3. **Players shape the world.** Parcels, construction, businesses, services and institutions are persistent and auditable. Building uses modular realistic components, not voxel blocks.
4. **A society, not a scripted backdrop.** Work, production, supply chains, land, trade, transport and local governance connect through explicit rules.
5. **Accessible fairness.** New-player access, economic sinks, anti-hoarding controls, abuse prevention and transparent dispute processes. Never sell governmental power for real money.
6. **Safe governance.** Players may vote on in-world zoning, budgets and local policies; platform safety, privacy, legal compliance and anti-harassment rules are not subject to player repeal.
7. **A world that remembers.** The authoritative server owns identity, inventory, currency, transactions, parcel ownership, construction and rule changes. The browser only renders and proposes commands.
8. **Grow in districts.** Start with District 01; add districts through versioned data and streaming, not a monolithic hard-coded map.

## Product loop – vertical slice
Create avatar → enter District 01 → meet another real player → visit a public lounge → receive starter apartment → place a furniture item → persist changes → purchase/sell a low-stakes item → visit again and find everything unchanged.

## Domain boundaries
- Identity: account, character, privacy settings, friendships, bans
- World: region, district, parcel, building, interior instance, world object
- Social: presence, chat, invitations, events, moderation reports
- Property: deeds, access control, construction permits, leases
- Economy: accounts, double-entry ledger, listings, inventory, orders, wages
- Society: organizations, memberships, proposals, elections, policies
- Simulation: deterministic ticks, jobs, production, NPC schedules, transport
- Client: graphics, camera, input, UI, audio, local cache (never authority)

All server writes should be validated, authorized, idempotent and logged. Money cannot be created by editing localStorage. Use integer minor units for balances; avoid floating point balances. A listing purchase, item transfer and ledger postings must commit atomically.

## Technical architecture direction
Existing Three.js + Rapier city and lounge are prototype clients. Keep them while proving the social/property loop. Introduce an authenticated API, real-time presence service, transactional database and versioned district scene manifests. Design domain schemas separately from rendering code. Consider an engine migration only after a visual/CPU/GPU benchmark, not by assumption.

Server should partition simulation geographically but preserve one logical world/economy. Interior instances may be separately hosted without splitting property ownership. Long-running world events use durable queues and timestamped server ticks; disconnected users must not block progress.

## Art bible – District 01
- Architecture: coastal Nordic contemporary; warm plaster, muted brick, dark metal, timber accents, glazing; believable older/newer variation.
- Street kit: standardized lane widths, sidewalks, curbs, markings, signs, parking, street furniture, lights, vegetation.
- Characters: consistent realistic-stylized anatomy, skin/hair/cloth shaders, coherent animation sets and scale.
- Lighting: blue-hour baseline, warm interiors, sparse magenta neon only in nightlife zones.
- Quality gates: compare every imported asset against a reference scene, triangle/texture/LOD budget, scale and collision pass, license attribution, mobile fallback.
- No mixing raw low-poly packs with realistic hero assets without re-authoring.

## Roadmap and acceptance criteria
**M0 Foundation:** versioned schemas, explicit ownership rules, test fixtures and shared design docs. Current work starts here.
**M1 Polished street:** four high-quality hero buildings, one traversable street, stable camera/collision, 30–60 FPS targets defined per device class; real screenshots and frame timings.
**M2 Social:** two authenticated clients see consistent position/appearance; chat with moderation; reconnect; server-authoritative state.
**M3 Home:** starter apartment, furniture placement with permissions and persistence, visits and invite controls.
**M4 Economy:** basic inventory, listings, escrow/atomic ledger, anti-duplication tests and transaction history.
**M5 Construction:** parcel deed, permissions, modular building, server-validated placement, save/load, building history.
**M6 Society:** business contracts, jobs, governance experiments and economic telemetry; expand world only when systems are stable.

## Honest current status
Avatar Studio, Night Lounge and District 01 are browser prototypes. Concept trailer visuals are not proof of in-game quality. No complete authoritative multiplayer/economy/governance system is claimed. Do not call a feature production-ready until end-to-end tests verify it.
