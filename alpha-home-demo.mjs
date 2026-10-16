// Local-only visual demo placement, never authoritative ownership.
export function readPostcardPlacement(raw,unlocked){if(!unlocked)return false;try{return JSON.parse(raw)?.postcard===true}catch{return false}}
export function placePostcard(unlocked,alreadyPlaced){return Boolean(unlocked||alreadyPlaced)&&Boolean(unlocked)}
