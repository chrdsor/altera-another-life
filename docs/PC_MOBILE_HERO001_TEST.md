# ALTERA Hero 001 – PC + mobil testløype

## På PC: lag eller klargjør modellen
1. Åpne Blender, og lag/importer en menneskemodell som du har kommersielle rettigheter til.
2. Følg `docs/HERO_001_PRODUCTION_CHECKLIST.md`.
3. Kontroller armature, skinned mesh, UV, materialer og animasjonene Idle og Walk.
4. Kjør `scripts/blender_validate_character.py` fra Blender Scripting.
5. Eksporter GLB med innebygde teksturer. Bruk filnavnet `hero-001.glb`.
6. Åpne `avatar-studio.html` i PC-nettleseren, velg **Importer GLB**, og velg filen.
7. Sjekk at modellen er synlig, kan roteres, og at Idle/Walk fungerer.

## På mobil: test samme modell
1. Legg GLB-filen i `assets/avatar-woman.glb` i GitHub-repoet når modellen er godkjent for offentlig publisering.
2. Publiser endringen på GitHub Pages.
3. Åpne `https://chrdsor.github.io/altera-another-life/avatar-studio.html` på iPhone.
4. Trykk **Kvinne** i GLB-panelet, og test lasting, rotasjon og animasjoner.
5. Noter lastetid, bildefrekvens, hakking, clipping og hvordan klærne ser ut.
6. Send skjermbilder fra både PC og mobil for sammenligning med referansebildene.

## Viktig
- Å ha GLB-importkode er ikke det samme som å ha en ferdig realistisk modell.
- Ikke legg private bilder, kroppsmål, API-nøkler eller uavklarte lisensierte modeller i offentlig repo.
- Mobil og PC skal bruke samme avatar-ID, modell og plaggdata; bare layout og grafikkvalitet tilpasses.
- Ikke koble til Supabase før karakterkvaliteten er godkjent.

## Godkjenningskriterier
- Realistisk ansikt og anatomi, ikke primitiver.
- Ekte hårgeometri og skinned klesmodeller.
- Minst Idle og Walk, ingen synlig clipping i disse animasjonene.
- Samme karakter gjenkjennelig på PC og mobil.
- Akseptabel lastetid og jevn ytelse på iPhone.
