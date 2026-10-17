# District 01 — Hero Environment Pass 01
Focus: the existing playable promenade and Kafé Varm. No new city districts.

## Implemented
- Reusable Three.js low-poly street furnishing kit, without external assets or license dependencies.
- Café entrance with layered glazing, framed doorway and warm glow.
- Outdoor tables/chairs, trees and tree pits, harbor bollards, cycle racks, litter bins, and façade lamps.
- Existing quest, camera, map, phone and navigation retained.

## Important limitations
- This is a procedural environment-detail pass, **not** a production-quality GLB architectural kit.
- Café doorway geometry is decorative; actual door interaction and collision need review.
- Some furnishing may need spatial collision adjustments.
- Real before/after browser screenshots and iPhone performance checks are required before claiming visual quality or merge readiness.
- The large mobile minimap seen in user screenshots needs a separate HUD pass.

## Next visual gates
1. Replace repetitive building shells with an authored modular façade GLB kit, materials and LOD.
2. Verify façade, props and camera in real mobile screenshots at 390×844 and 430×932.
3. Reduce map/HUD occlusion, preserve quest guidance.
4. Validate outdoor/interior café entrance positions and navigation; add obstacle collisions.
5. Use the Hero 001 art standard as a human-scale reference, not a reason to expand scope.
