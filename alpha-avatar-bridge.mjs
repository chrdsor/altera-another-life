import {loadAvatarState} from './avatar-state.js';
const color=value=>Number.parseInt(value.slice(1),16);
export function playerAppearance(storage){
 const state=loadAvatarState(storage);
 return {coat:color(state.topColor),skin:color(state.skin),hair:color(state.hair),style:state.hairStyle==='Oppsatt'?'long':'short',bottom:color(state.bottomColor),shoes:state.shoes==='Skinnsko'?0x332b28:0x25292e,body:state.body,eye:color(state.eye),top:state.top,bottomStyle:state.bottom,shoesStyle:state.shoes};
}
export function applyPlayerAppearance(character,storage){
 const appearance=playerAppearance(storage);
 character.userData.appearance=appearance;
 // Geometry is rebuilt by the caller; do not mutate the saved studio state.
 return appearance;
}
