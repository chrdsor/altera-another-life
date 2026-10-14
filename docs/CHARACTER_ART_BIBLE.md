# ALTERA – Character Art Bible v1.0

## Designfasit
De to referansebildene brukeren har levert (PC og mobil) er autoritative for studioets uttrykk: premium nattlig storbyleilighet, mørke glasspaneler, rosa/lilla neon og realistiske mennesker. Bildene er **konseptkunst**, ikke spillklare modeller.

## Første karakter: Hero 001
Voksen kvinnelig figur. Realistisk menneskelig ansikt, naturlig hud med roughness/normal, varm mørkblond oppsatt frisyre med løse hårstrå, svart crop tank, svarte cargobukser, lyse sneakers, diskrete smykker. Proporsjoner må være anatomisk plausible. Ingen synlige kuleledd, kapselarmer eller primitive bokseplagg.

## Produksjon
1. Lag eller lisensier et high-quality menneske med tillatelse til kommersiell bruk. Sjekk at eksport til GLB og videre distribusjon i spill er tillatt.
2. Retopologi og UV-er. Skinning til ALTERA-Humanoid-v1 med standardiserte bone-navn, T/A-pose og to animasjoner: Idle og Walk.
3. Lag hår som kort/medium/høy LOD og plagg som separate skinned meshes. Skjul kroppsdeler som dekkes av klær for å redusere clipping.
4. Eksporter GLB. Materialer skal være PBR, ingen lyseffekter baked inn i hudens albedo.
5. Lag mobil-LOD og desktop-LOD av **samme karakter**, med samme identitet og avatar-ID.
6. Test på iPhone Safari, Android Chrome og desktop. Måling av FPS, minnebruk og oppstartstid.

## Målbare krav
- Mobil LOD: ca. 15–35k trekanter som innledende budsjett (må verifiseres på faktiske telefoner).
- Desktop LOD: ca. 40–85k trekanter som innledende budsjett.
- Mobilteksturer vanligvis 1K, desktop 2K der det gir synlig forbedring.
- Ingen synlig gjennomtrenging ved Idle, Walk og standardposering.
- Kropp og ansikt skal ha naturlige, kontinuerlige overflater, ikke sammensatte primitiver.
- Støtt minst blink og smil gjennom morph targets eller tilsvarende rigg.

## Arkitektur
Én avatar-ID, ett antrekksoppsett og ett sett karakterparametere for mobil/PC. Skjermlayout og renderkvalitet varierer etter enhet. Kontosynkronisering og Supabase er **utsatt** til karakterkvaliteten er godkjent.

## Godkjenningsport
Ikke kall dette 'realistisk 3D' før en faktisk rigget GLB er levert, kan roteres, kan animere og er dokumentert med skjermbilder fra en ekte nettleser. Ikke bruk referansebildet som bakgrunn for å simulere at 3D-modellen finnes.
