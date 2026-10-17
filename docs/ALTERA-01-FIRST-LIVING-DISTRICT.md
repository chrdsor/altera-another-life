# ALTERA 0.1 — First Living District: production gates
## Art direction
Nordic Contemporary Stylized Realism. Human-scale harbor buildings; muted brick, timber, warm plaster, blue-hour ambient with warm practical lights; limited cool blue accents. Keep signage readable on 390px-wide mobile screens. Favor authored PBR materials, a coherent hero street kit, and rigged licensed characters over repetitive primitive boxes. Record license, scale, poly count and texture resolution for any imported GLB. Current scene is a stylized prototype, not production art.
## Verified scope vs pending work
Existing District 01 has a playable quest, map, phone and local persistence; social, server economy, and construction remain separate prototypes. This branch adds acceleration/deceleration, camera distance checks against registered obstacles and lightweight animated harbor water. Camera check is 2D AABB and does not cover all scene geometry; it is not full camera physics. Water uses a low-resolution deforming mesh, not realistic ocean rendering.
## Acceptance gates
- Run quest and browser smoke tests in CI; verify console errors.
- Capture real before/after screenshots from the same position at 390x844 and desktop; compare scene legibility, model silhouette and UI occlusion.
- Profile on real iPhone for sustained frame rate, thermal throttling and touch responsiveness. Emulated browser tests do not establish physical-device performance.
- Test all door transitions, Maja dialogue, quay return, postcard placement and reload.
- Do not mark the visual milestone done without authored hero façades, rigged Hero 001, café interior collision, and real screenshots.
## Next vertical-slice implementation
1. Replace placeholder façades with licensed coherent GLB kit; add LOD and collision volumes.
2. Integrate rigged Hero 001 in district and interiors with idle/walk/turn animation blending.
3. Make Maja's café interaction a spatial dialogue sequence with visual feedback.
4. Build grid/navmesh-based pedestrian routing instead of straight lines through obstacles.
5. Add real server-connected two-player presence only after authentication and moderation checks.
## Integration boundary
Use existing server/authoritative-world.mjs and server/http-server.mjs for identity, housing and money. Never store authoritative balances or ownership in localStorage. Do not fork parallel economy implementations.

## Character art pass v2 (procedural fallback)
District 01 characters now share a more legible human-shaped silhouette, pivoted limb joints, facial details, footwear, layered collars, hair variants and subtle idle breathing. Maja uses a consistent apron and long-hair variant outdoors and in the café. This remains geometry-based prototype art, not a licensed rigged GLB or production-quality facial animation. The next asset milestone remains a properly rigged Hero 001 GLB with documented provenance, LOD and animation clips.
