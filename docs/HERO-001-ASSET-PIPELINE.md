# Hero 001 — rigged character integration contract

## Status
The playable District 01 and café/apartment share a single optional Hero 001 loader. The fallback procedural character remains visible until a valid model loads. **No production GLB asset is bundled by this PR.** This is the animation and asset-validation pipeline, not a finished character-art milestone.

## Artist handoff
Export a legally licensed, original or appropriately sourced `glTF 2.0` binary to `assets/characters/hero-001.glb`. Include a skinned humanoid with recognizable `Hips`, `Spine`, `Head`, `LeftUpperArm`, `RightUpperArm`, `LeftUpperLeg`, `RightUpperLeg` bones (Mixamo naming also accepted), and at least one `Idle` and one `Walk` animation clip. Model faces local -Z, stands on y=0, has no root-motion translation, and is roughly human scale. Use modest draw calls and mobile-friendly geometry/texture budgets; profile rather than assuming a fixed polygon limit.

Publish the companion `assets/characters/hero-001.json` manifest:
```json
{"url":"./assets/characters/hero-001.glb"}
```
The manifest is optional and must only reference a local GLB in `assets/characters/`. Without it, no model is fetched. Invalid models retain the procedural fallback.

## Avatar Studio palette contract
Name the six recolorable glTF materials exactly `Skin`, `Hair`, `Top`, `Bottom`, `Shoes` and `Eyes` (optional `_Material` suffix). The runtime clones only these named materials and applies the locally saved Studio colors. An optional morph target named `BodyWidth` receives the Studio body-width slider, mapped from 0.82–1.2 to a 0–1 weight. Unknown materials are left unchanged. This supports basic color customization and an optional authored body-width morph; it does **not** switch hairstyles, clothing meshes or server-owned identities. Rigged GLB remains opt-in until a licensed asset is committed.

## Verification before release
1. Validate mesh skinning, bone naming and animation clips in Avatar Studio diagnostics.
2. Verify character is upright, faces forward, stays grounded, and does not float or clip on both District 01 and café floor.
3. Confirm idle/walk blending and stable movement on mobile and desktop.
4. Confirm Studio palette is visibly applied to each named material and that hairstyle, clothing mesh choices and body morphs are not falsely presented as supported. Verify with real GLB and screenshots.
5. Run CI quest/browser tests, record before/after screenshots and test on a physical iPhone.
6. Record asset license, artist credit, polygon/texture counts, memory and frame timing.

Never call Hero 001 production-ready until the model, avatar customization and visual/device gates have passed.
