// ALTERA alpha: deterministic offline demo quest. Never authoritative money or ownership.
export const QUEST_VERSION=1;
export const QUEST_STEPS=Object.freeze(['meet','visit','return','complete']);
export const QUEST_REWARD='harbor-postcard';
export function normalizeQuest(input){
 const step=QUEST_STEPS.includes(input?.step)?input.step:'meet';
 return {version:QUEST_VERSION,step,reward:step==='complete'&&input?.reward===QUEST_REWARD?QUEST_REWARD:null};
}
export function advanceQuest(state,action){
 const current=normalizeQuest(state);
 const transitions={meet:{talk_cafe:'visit'},visit:{visit_quay:'return'},return:{talk_cafe:'complete'}};
 const next=transitions[current.step]?.[action];
 if(!next)return {state:current,changed:false};
 return {state:{version:QUEST_VERSION,step:next,reward:next==='complete'?QUEST_REWARD:null},changed:true};
}
export function questObjective(state){
 switch(normalizeQuest(state).step){
 case 'meet':return 'Snakk med kaféverten ved Kafé Varm';
 case 'visit':return 'Besøk Nordkaien og se utover havnen';
 case 'return':return 'Gå tilbake til kaféverten';
 default:return 'Velkommen til District 01 – oppdrag fullført';
 }
}
export function questDialogue(state){
 switch(normalizeQuest(state).step){
 case 'meet':return 'Maja: Velkommen til District 01! Kan du sjekke at alt står bra til nede på Nordkaien?';
 case 'visit':return 'Maja: Ta en tur ned til kaien først, så snakkes vi.';
 case 'return':return 'Maja: Så fint! Takk for hjelpen. Her er et postkort fra havnen til ditt første hjem.';
 default:return 'Maja: Hyggelig å se deg igjen! Postkortet ditt ligger i demo-samlingen.';
 }
}
