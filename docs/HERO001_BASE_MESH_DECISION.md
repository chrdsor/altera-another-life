# ALTERA Hero 001 — Valg av menneskelig basemodell

## Beslutning
Bruk en eksisterende, lovlig basemodell og videreutvikle den i Blender. Vi skal ikke modellere anatomi fra null.

### Prioritet 1: MakeHuman / MPFB i Blender
- Offisielle innebygde MakeHuman/MPFB-assets er CC0, og eksporterte modeller kan brukes kommersielt.
- Tredjeparts hår, klær og modeller må kontrolleres separat.
- Fordel: justerbare kroppsmål, kontroll over mesh og rigg, lavere lisensrisiko.
- Ulempe: realistisk hud, hår og kleskvalitet må bygges videre.

### Prioritet 2: Blender Studio Human Base Meshes
- Godt utgangspunkt for anatomi og retopologi.
- Kontroller lisens på den konkrete nedlastingen.
- Fordel: produksjonsorientert topologi.

### Ikke standardvalg: Reallusion Character Creator
- Kan produsere svært gode mennesker.
- Lisensvilkår begrenser bruk av basekarakterer i karaktergenereringssystemer. ALTERA er nettopp en avatarskaper; derfor ikke velg dette uten skriftlig lisensavklaring.

## Hero 001 produksjon
1. Generer en voksen kvinnelig base i MakeHuman/MPFB.
2. Importer til Blender. Behold originalen som uendret backup.
3. Form ansikt og kroppsproporsjoner etter ALTERA Art Bible; unngå direkte kopiering av en ekte persons ansikt.
4. Lag PBR-hudmateriale, oppsatt hår, svart crop top, cargobukser og lyse sneakers.
5. Rig til ALTERA-Humanoid-v1. Idle og Walk.
6. Eksporter GLB og test på PC, deretter iPhone med samme fil.
7. Lag mobil-LOD og test ytelse.
8. Dokumenter lisens, modellkilde og eventuelle tredjepartsassets.

## Akseptanse
Ingen påstand om ferdig karakter før faktisk rigget GLB er lastet inn og visuelt testet på mobil og PC.

## Kilder
- MakeHuman: https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md
- MPFB: https://github.com/makehumancommunity/mpfb2/blob/master/LICENSE.md
- Blender Studio base mesh: https://studio.blender.org/training/realistic-human-research/use-of-base-meshes/
- Reallusion software EULA: https://www.reallusion.com/Content/EULA/AP/EULA_AP.htm
