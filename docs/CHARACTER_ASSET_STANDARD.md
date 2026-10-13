# ALTERA Character & Clothing Asset Standard v0.1

Dette er en **produksjonsstandard**, ikke en påstand om at realistiske 3D-modeller allerede finnes i repoet.

## Mål
- Samme Avatar Studio, samme datamodell og samme 3D-ressurser på mobil og PC.
- To selvstendige, riggede basisfigurer: `assets/avatar-woman.glb` og `assets/avatar-man.glb`.
- Felles navngivning for humanoid-skjelletter. Begge bør bruke samme bind-pose, skala, bone hierarchy og animasjonsnavn.
- Klær må være skinna til riktig skjelett og testes for clipping ved gange, sitting og armbevegelser.

## Minimum humanoid rig
Hips, Spine, Head, LeftUpperArm, RightUpperArm, LeftUpperLeg, RightUpperLeg.
Anbefalt også Neck, LowerArm, Hand, LowerLeg og Foot på begge sider. Eksportér knoklenavn konsistent uten programspesifikke prefikser.

## Import
1. Lag modellen i Blender, Tripo3D eller annet verktøy med rettigheter til kommersiell bruk.
2. Sett figurens føtter ved verdensgulvet, Y opp, skala i meter, nøytral T- eller A-pose.
3. Eksportér GLB med armature, skinning, materialer og idle/walk-klipp.
4. Åpne `avatar-studio.html`, importer GLB og se diagnostikken for knokler, skinned meshes, materialer og trekanter.
5. Test modellen i både mobil og PC. Ikke publiser før lisens og kvalitet er kontrollert.

## Ytelsesmål (veiledende, ikke harde grenser)
- Mobil grunnmodell: sikte på 15–35k trekanter med LOD og komprimerte teksturer.
- Desktop kan bruke høyere detaljgrad, men behold samme rigg.
- Bruk få materialer og kontroller draw calls; test på faktiske telefoner.
- En karakter med høy oppløsning på hud/hår kan trenge LOD-varianter.

## Klær
Se `assets/garment-catalog.json`. Plaggdata og modellfiler er separert.
Ingen klær i manifestet er ennå ferdig modellert. Klesvalgene i den eksisterende prototypen endrer derfor fortsatt ikke en importert GLB automatisk.

## Personvern
Ingen bilder eller kroppsmål skal sendes til server uten eksplisitt samtykke. Supabase/innlogging kommer først etter visuell kvalitetsgodkjenning.
