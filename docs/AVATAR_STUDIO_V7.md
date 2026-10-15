# ALTERA Avatar Studio v7

## Retning

Denne revisjonen bruker de innsendte konseptbildene som visuell retning, ikke som publiserte assets. Målet er en stor, lesbar 3D-avatar i et mørkt urbant studio med varm hudbelysning og kontrollert rosa/blått kantlys.

## Endringer

- Ny responsiv arbeidsflate med stor scene, kompakte kategorier og ett aktivt innstillingspanel.
- Egen mobilkomposisjon med større avatarflate, horisontal kategorinavigasjon og berøringsvennlige kontroller.
- Fysisk differensiert materialbehandling for hud, øyne, hår, tekstil og sko.
- Bedre tone mapping, varmt hovedlys, kjølig fill og magenta rim-light.
- Lettvekts 3D-studiomiljø med podium, vinduer og møbelsilhuetter. Referansebildene er ikke inkludert.
- Utvidet ansiktsstate for øyne, nese, lepper og ansiktsform. Kontrollene kobles automatisk til kompatible morph-navn når de finnes.
- Materialer gjenbrukes ved fargeendring for å unngå stadig nye materialkloner.
- Studio og spill bruker nå én validert state-modul. Ugyldige lagringsverdier, farger og ekstreme morphverdier repareres før bruk.
- Valg som mangler i den aktive GLB-en deaktiveres i Studio, og en trygg synlig plaggvariant beholdes i spillet.
- Iris kan farges uten at hornhinne og sclera blir tonet.
- Adaptiv pikselratio og skyggekvalitet på mobile/lavminneenheter.
- Eksportformat oppdatert til schema version 2; eldre lokalt lagrede valg får trygge standardverdier.

## Clipping og morphing

Kroppsmorpher anvendes fortsatt på alle kompatible meshes i GLB-en, inkludert skinnede klær med de samme morph-navnene. Variantbytte skjuler inaktive plaggmesher. Crop top og cargo er separate slots, slik at midriff forblir synlig.

Full kvalitetskontroll av skin weights og selvkollisjon må gjøres i Blender på kildeasseten. Nettleserkode kan ikke reparere dårlige vekter eller manglende geometri uten å introdusere deformasjoner.

## Gjenstående kunstbegrensninger

Den publiserte `avatar.glb` er den eksisterende MPFB/MakeHuman-produksjonsfilen. Referansekvaliteten krever i tillegg:

1. Et skulpturert hero-hode med asymmetri og naturtro øyelokk, lepper, nese og ører.
2. 2K desktop / 1K mobile albedo, normal og roughness for hud, uten innbakt neon.
3. Egne øyeepler med irisdybde, tårevåt kant og separat hornhinne.
4. Hårkort eller strands med ryddig alpha, løse lokker og egne LOD-er.
5. Omvektede cargobukser med sydde lommer og manuell clipping-test mot alle kroppsmorpher, Idle og Walk.
6. Desktop- og mobile LOD-varianter med komprimerte KTX2-teksturer.

Se `assets/characters/mpfb-builder-v1/SOURCES.txt` for kilder, kreditering og endringshistorikk. Kombinasjonen inneholder CC BY-materiale og skal ikke omtales som hel-CC0.

## Kontrollpunkter

- JavaScript-syntaks: `node --check avatar-studio.js` og `node --check rigged-avatar.js`.
- Statevalidering: `node scripts/check-avatar-state.mjs`.
- Alle JavaScript-refererte element-ID-er finnes i HTML.
- Mobilbredder: 390, 430 og 760 px.
- Desktopbredder: 1280, 1440 og 1920 px.
- Manuell 3D-kontroll: helfigur/ansikt, rotasjon/zoom, Idle/Walk, alle plagg, ekstrem kroppsmorph, undo, lagring og JSON-eksport.
