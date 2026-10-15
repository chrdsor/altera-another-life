// ALTERA domain contracts v1. Pure data and validation; no browser or network dependencies.
// This module is NOT an authoritative game server.
export const SCHEMA_VERSION=1;
export const ENTITY_TYPES=Object.freeze(['district','parcel','building','interior','item','business','organization']);
export const PERMISSIONS=Object.freeze(['visit','place_furniture','build','manage_access','sell','operate_business']);
export const WORLD_RULES=Object.freeze({
  coordinateUnit:'meter',currencyMinorUnit:'cent',serverAuthority:true,
  idPattern:'^[a-z0-9][a-z0-9_-]{2,63}$'
});
const idPattern=new RegExp(WORLD_RULES.idPattern);
export function isId(value){return typeof value==='string'&&idPattern.test(value)}
export function validateParcel(p){
  const errors=[];
  if(!p||typeof p!=='object'||Array.isArray(p))return ['parcel must be an object'];
  if(!isId(p.id))errors.push('invalid parcel id');
  if(!isId(p.districtId))errors.push('invalid district id');
  if(p.ownerId!==null&&!isId(p.ownerId))errors.push('invalid owner id');
  if(!Number.isFinite(p.areaM2)||p.areaM2<=0)errors.push('invalid area');
  if(!['residential','commercial','civic','mixed','park'].includes(p.zone))errors.push('invalid zone');
  return errors;
}
export function validateWorldCommand(command){
  const errors=[];
  if(!command||typeof command!=='object'||Array.isArray(command))return ['command must be an object'];
  if(command.version!==SCHEMA_VERSION)errors.push('unsupported version');
  if(!isId(command.commandId))errors.push('invalid idempotency key');
  if(!isId(command.actorId))errors.push('invalid actor');
  if(!['place_furniture','purchase_listing','request_build','set_access'].includes(command.type))errors.push('unsupported command');
  if(!command.payload||typeof command.payload!=='object'||Array.isArray(command.payload))errors.push('invalid payload');
  return errors;
}
export function validateMoney(value){return Number.isSafeInteger(value)&&value>=0}
export function validateLedgerTransfer(t){
  const errors=[];
  if(!t||typeof t!=='object')return ['transfer must be an object'];
  if(!isId(t.fromAccount)||!isId(t.toAccount)||t.fromAccount===t.toAccount)errors.push('invalid accounts');
  if(!validateMoney(t.amountMinor)||t.amountMinor===0)errors.push('invalid amount');
  if(!isId(t.transactionId))errors.push('invalid transaction id');
  return errors;
}
export const DISTRICT_01_SEED=Object.freeze({
  id:'district_01',name:'District 01',theme:'nordic-coastal-blue-hour',
  zones:['residential','commercial','civic','mixed','park'],
  initialPublicPlaces:['harbor_square','night_lounge','shopping_street'],
  firstMilestone:'starter apartment + social presence + persistent furnishing'
});
