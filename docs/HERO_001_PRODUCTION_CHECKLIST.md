# ALTERA Hero 001 — Produksjonsoppdrag (Blender / Tripo3D)

**Status:** GLB-modellen er ikke produsert ennå. Denne sjekklisten brukes før den blir godkjent og lastet opp.

## Visuell fasit
Bruk brukerens godkjente mobil- og PC-referanser for ALTERA Avatar Studio:
- Voksen kvinnelig figur med realistisk anatomi og ansikt.
- Oppsatt blondt/mørkblondt hår med løse hårstrå.
- Svart singlet/crop top, svarte cargobukser, lyse sneakers.
- Diskrete smykker og valgfrie tatoveringer.
- Moderne urban mote, ikke stilisert tegnefigur.

## Produksjonsrekkefølge
1. Lag eller lisensier en menneskelig base mesh med kommersielle rettigheter og rett til redistribusjon i spill.
2. Retopologi med sammenhengende anatomi og UV-unwrapping. Ingen synlige primitive skjøter.
3. Rig til standard humanoid skjelett. Felles bind-pose, skala og knoklenavn for alle fremtidige karakterer.
4. Lag egne skinned mesh-objekter for overdel, bukse og sko, og test bevegelse.
5. Legg inn animasjoner som heter Idle og Walk.
6. Lag PBR-materialer for hud, stoff og hår. Bruk komprimerte teksturer for mobil.
7. Lag LOD-varianter; sikte på <=35k trekanter for første mobil-LOD og <=85k for desktop-LOD.
8. Kjør `scripts/blender_validate_character.py` i Blender før eksport.
9. Eksporter til `assets/characters/hero-001/hero-001.glb` og test med GLB-import i `avatar-studio.html`.
10. Test på ekte iPhone, Android og PC. Dokumenter FPS, lasting, teksturkvalitet og clipping.

## Filnavn og kontroll
- `hero-001.glb`: samlet karakter med armature, skin weights og animasjoner.
- `hero-001-mobile.glb`: mobiloptimalisert variant når LOD-pipelinen er klar.
- `hero-001.blend`: Blender-kildefil, lagres som utviklingsressurs, ikke nødvendigvis i offentlig GitHub-repo.
- `character.json`: manifest med versjon, krav og filbaner.

## Godkjenning
Ikke marker modellen som ferdig før det faktisk finnes en rigget GLB-fil, den består skjelettkontroll og det finnes skjermbilder fra mobil og desktop. Ikke bruk referansebildet som erstatning for 3D-modellen.

## Merknad om lisens
Ikke hent Habbo/Sulake-ressurser eller tilfeldige karaktermodeller fra nettet uten dokumenterte rettigheter.
