# ALTERA World Foundations – Biome and settlement standards v1

## Purpose
Build four **small playable test settlements** before scaling the persistent player-shaped universe. They share one realistic-stylized art direction, gameplay contracts, unit scale, asset library and future authoritative world model. Different climate, terrain, architecture and density do not mean different game art styles.

## Test settlements
| ID | Working name | Terrain | Initial buildings | Core test |
|---|---|---|---|---|
| city_01 | ALTERA City | coastal urban | 10 residences, mall, hospital, fire/police, shops | streets, crossings, vehicles, multi-storey buildings, public services |
| village_01 | ALTERA Village | woodland / farmland | 10 varied homes, market, workshop, community hall | parcels, detached housing, agriculture, rural roads |
| highlands_01 | ALTERA Highlands | mountains / snow | cabins, hotel, service building, lift base | height, slopes, winter weather, navigation, snow materials |
| coast_01 | ALTERA Coast | rocky waterfront | boathouses, homes, market, marina | shorelines, piers, boats, tidal/water presentation |

Names are provisional. Geography is fictional; Norwegian influences are an art direction, not a claim of exact real-world location.

## Shared world conventions
- Right-handed coordinates; metres; ground height from terrain query, never assumed y=0.
- World origin per settlement; global region + local district coordinates to avoid precision issues at scale.
- Terrain tiles, road segments, parcel polygons, building footprints, navmesh and colliders are separate layers.
- Roads use reusable typed cross-sections: local, collector, pedestrian, rural, mountain. Sidewalks and crossings are explicit.
- Buildings use sockets for entrances, utilities, interiors, signage and interactables.
- Parcel IDs, building IDs, ownership, zoning and access rules are server data, not mesh names.
- Art standards: coherent realistic-stylized PBR, physically plausible sizes, controlled blue-hour lighting, climate-specific vegetation and surfaces, LOD and collision budgets.
- Player construction may only change authorized parcels; road and civic land changes require governance permissions.
- Each settlement ships with test scenarios: walking, vehicle route, NPC path, enter/exit, save/reload, low-end device performance.

## Scene manifest contract
Each settlement must have a versioned data manifest specifying id, biome, climate, spawn, terrain profile, districts, road templates, parcel seeds, building archetypes and points of interest. Renderer consumes manifest; authoritative simulation owns changes.

## Asset naming and reuse
`building/<archetype>/<variant>`, `road/<cross_section>`, `terrain/<biome>`, `prop/<category>`, `vehicle/<class>`. Every asset records licence, units, pivot, materials, LOD, collision and interaction sockets.

## Milestone acceptance
A settlement is not complete merely because buildings render. It must pass visual consistency, traversal, navigation, interaction, persistence and performance checks. Initial procedural scenes are **blockouts**, not GTA-quality finished art.

## Build order
1. Implement manifest validator and four seed settlements.
2. Expose a settlement selector and load the same client scene pipeline from a chosen manifest.
3. Replace procedural blockouts with one approved modular asset kit and consistent material palette.
4. Add terrain-aware roads, parcel ownership and interaction points.
5. Connect the settlements to server-side persistence and multiplayer.
