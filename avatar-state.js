export const AVATAR_STATE_KEY='altera-avatar-reference-v3';
export const LEGACY_AVATAR_STATE_KEY='altera-avatar-reference-v2';

export const AVATAR_OPTIONS={
  gender:['Kvinne','Mann'],
  hairStyle:['Oppsatt','Kort'],
  top:['Crop top','T-skjorte','Langermet'],
  bottom:['Cargo','Jeans','Shorts'],
  shoes:['Sneakers','Skinnsko']
};

export const DEFAULT_AVATAR_STATE={
  gender:'Kvinne',body:1,muscle:0,faceSoftness:.55,eyeSize:.5,noseWidth:.5,lipFullness:.55,
  hairStyle:'Oppsatt',skin:'#d79b76',eye:'#416b86',hair:'#a96f4f',top:'Crop top',topColor:'#141318',
  bottom:'Cargo',bottomColor:'#28262d',shoes:'Sneakers',glasses:'Ingen',tattoo:'Ingen',modelMode:'builder'
};

const numericRanges={body:[.82,1.2],muscle:[0,1],faceSoftness:[0,1],eyeSize:[0,1],noseWidth:[0,1],lipFullness:[0,1]};
const colorFields=['skin','eye','hair','topColor','bottomColor'];
const hex=/^#[0-9a-f]{6}$/i;

export function normalizeAvatarState(candidate={}){
  const normalized={...DEFAULT_AVATAR_STATE};
  for(const[field,values]of Object.entries(AVATAR_OPTIONS))if(values.includes(candidate[field]))normalized[field]=candidate[field];
  for(const[field,[min,max]]of Object.entries(numericRanges)){
    const value=Number(candidate[field]);
    if(Number.isFinite(value))normalized[field]=Math.min(max,Math.max(min,value));
  }
  for(const field of colorFields)if(hex.test(candidate[field]||''))normalized[field]=candidate[field].toLowerCase();
  if(candidate.glasses==='Ingen')normalized.glasses='Ingen';
  if(candidate.tattoo==='Ingen')normalized.tattoo='Ingen';
  if(candidate.modelMode==='builder')normalized.modelMode='builder';
  return normalized;
}

export function loadAvatarState(storage=globalThis.localStorage){
  try{
    const raw=storage?.getItem(AVATAR_STATE_KEY)||storage?.getItem(LEGACY_AVATAR_STATE_KEY);
    return normalizeAvatarState(raw?JSON.parse(raw):{});
  }catch{return normalizeAvatarState()}
}

export function saveAvatarState(state,storage=globalThis.localStorage){
  const normalized=normalizeAvatarState(state);
  storage?.setItem(AVATAR_STATE_KEY,JSON.stringify(normalized));
  return normalized;
}
