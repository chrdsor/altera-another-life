# ALTERA game architecture

## Current vertical slice

`avatar-studio.html` and `world.html` use the same local avatar state (`altera-avatar-reference-v3`) and the same rigged GLB. A player can customize the avatar, enter Night Lounge, move with keyboard or touch controls, and return to the studio without losing the selected body, hair, clothing or colors.

The Night Lounge is an actual Three.js scene. It does not use the supplied concept images as a background or substitute the avatar with a static render.

## Selected open-source foundation

- Three.js 0.164.1: rendering, glTF loading, PBR materials and animation mixing. MIT license.
- Rapier 3D compat 0.21.0: Apache-2.0 physics with a kinematic character controller. The pinned compat build embeds WebAssembly and works without a bundler.
- Colyseus: planned authoritative Node.js multiplayer service. MIT license. It is not presented as active while the project is hosted only on static GitHub Pages.
- glTF-Transform: planned offline asset optimization, mesh compression and KTX2 texture pipeline. MIT license.

## Runtime boundaries

The browser owns presentation, input prediction, camera and interpolation. A future Colyseus server must own room membership, validated movement intents, interaction state and chat. Clients should send input intent rather than authoritative positions.

## Character contract

- One avatar state and model identity across Studio and the game.
- Separate skinned wardrobe meshes on a shared skeleton.
- Idle and Walk selected from GLB clips and cross-faded according to movement.
- Compatible body and face morphs applied to every mesh that exposes each morph target.
- Mobile and desktop may use different render quality, but must preserve identity and outfit.

## Asset pipeline still required

The existing MPFB file is usable as a rigged functional base. Reaching the supplied photorealistic quality requires source-asset work in Blender: hero-head sculpt, high-quality skin maps, separate cornea/iris materials, hair cards with LOD, garment weight painting and clipping tests. After art approval, create desktop/mobile LODs and process them with glTF-Transform and KTX2.

## Verification

Run:

```sh
node --check avatar-studio.js
node --check rigged-avatar.js
node --check world.js
node scripts/check-app-contracts.cjs
node scripts/check-character-assets.cjs
```

Manual browser verification is still required for WebGL rendering, Rapier movement, skinning, animation, morph extremes, mobile touch input, saving and screenshot export.
