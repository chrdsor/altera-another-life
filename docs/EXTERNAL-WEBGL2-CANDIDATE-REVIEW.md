# External ALTERA WebGL2 candidate — controlled import

The collaborator's `altera-studio.zip` is a separate WebGL2 client, **not** a drop-in replacement for the Three.js alpha. Do not overwrite `main` or merge the two renderers blindly.

## Verified in local candidate copy (2026-10-17)
- Original standalone build succeeded using `python3 build.py`.
- Six JavaScript files passed `node --check`.
- Implemented save-state validation for legacy `altera-d01` fields (including malformed numbers, arrays, quest progress and inbox), retaining valid progress.
- Escaped phone inbox message text to prevent stored HTML injection from message content.
- Node VM regression test passed for valid saves, malformed saves, and HTML escaping.
- Original meshes, renderer, world and avatar assets were not changed.

## Scope and limitations
- Patched ZIP is delivered separately in the conversation; source and binary assets are **not** checked into this PR.
- No live Safari/iPhone WebGL2 performance, quest end-to-end, collision, or appearance test has been completed.
- Confirm asset licensing and provenance before any commercial release.
- Preserve original `altera-current`, `altera-saved`, `altera-d01` keys and `altera-mesh` IndexedDB; introduce migration only with explicit schema and backup.

## Next merge gates
1. Run external client and Three.js client side by side on an iPhone and capture matching screenshots.
2. Test avatar save/reload, quests, NPCs, phone, map and reload persistence.
3. Select authoritative renderer and design API-backed data interfaces.
4. Import external source into a reviewed branch only after source ownership and asset provenance are approved.

## Follow-up candidate update (2026-10-17)
- Separate downloadable ZIP now adds versioned District 01 progress JSON export/import under the game phone's **Lagring** tab.
- Import requires user confirmation and validates format, file size, allowed save fields and message strings before replacing `altera-d01`.
- Mobile phone tabs scroll horizontally to accommodate the additional tab.
- `node tests/save-safety.test.cjs`, `node tests/progress-backup.test.cjs`, all six JavaScript syntax checks, and `python3 build.py` passed locally.
- Avatar Studio appearance is not included in this backup. Browser and physical iPhone behavior remains unverified.
- Candidate source remains outside GitHub; this PR only documents the ZIP release, not the implementation.
