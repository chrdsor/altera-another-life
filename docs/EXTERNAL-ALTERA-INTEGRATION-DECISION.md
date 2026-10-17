# ALTERA: external Avatar Studio / District 01 integration decision

Date: 2026-10-17. Source: user-supplied `altera-studio.zip`, **not yet committed into this repository**.

## Verified locally
- ZIP contains `src/head.html`, `src/app.js`, `src/mh.js`, `src/mesher.js`, `src/engine.js`, `src/world.js`, `src/game.js`, `data/mh.bin.gz`, and `build.py`.
- Running `python3 build.py` from project root generated a standalone HTML (~3.4 MB).
- `node --check` passed for all six JS files.
- These checks **do not** prove iPhone WebGL rendering, framerate, visual correctness, or game progression.

## Architecture and storage
- External project: custom WebGL2 renderer (`src/engine.js`), MakeHuman-based body mesh/morphs (`src/mh.js`), procedural clothes/hair (`src/mesher.js`), world generation (`src/world.js`), quests and NPCs (`src/game.js`).
- Current repo alpha: Three.js and separate avatar/quest/phone systems.
- External localStorage keys: `altera-current` (appearance), `altera-saved` (saved looks), `altera-d01` (game progress). IndexedDB `altera-mesh` caches generated meshes.
- Existing repo storage keys differ. **Never overwrite one project's keys with another's without a migration and rollback.**
- ZIP README labels MakeHuman mesh CC0; verify upstream asset provenance, generated derivative license and all third-party dependencies before release.

## Decision
**Do not merge the two renderers or replace main yet.** Treat external version as an isolated candidate visual baseline. Keep GitHub main as the existing functional baseline. Prefer evaluating whether the external game can become the primary client, then porting proven features by interface, not copying incompatible scene code.

## Acceptance gates
1. Run external build in Safari on a physical iPhone: avatar edit/save/reload; walk/turn; quest progression; NPC interaction; phone/map; restart persistence.
2. Capture matching screenshots of both clients, test 390x844 and 430x932 and note average FPS and crashes.
3. Check licensing of MakeHuman data and generated meshes; inspect inline scripts for third-party network requests and content security concerns.
4. Define versioned `AvatarAppearanceV1` and `DistrictProgressV1` schemas with import/export; keep original localStorage data untouched.
5. Agree on a single authoritative client/render engine. If external wins, integrate server features through APIs and maintain a rollback URL; if Three.js wins, plan explicit asset export/retargeting, not a blind copy.
6. Only after browser, mobile and regression tests pass, create a reviewed integration PR against main.

## Immediate collaboration rule
One branch/PR per independent feature, no simultaneous edits to `main`, no production publish without review, document source assets and ownership.
