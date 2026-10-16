import {isId,validateMoney} from '../world-domain.js';

export class LedgerError extends Error{
  constructor(code,message){super(message);this.name='LedgerError';this.code=code}
}

export function postTransfer(players,ledger,{transactionId,fromAccount,toAccount,amountMinor,referenceType='marketplace',referenceId,createdAt=Date.now()}){
  if(!isId(transactionId)||!isId(fromAccount)||!isId(toAccount)||fromAccount===toAccount||!validateMoney(amountMinor)||amountMinor<1)throw new LedgerError('invalid_transfer','Ugyldig betaling');
  if(ledger.some(transaction=>transaction.id===transactionId))throw new LedgerError('duplicate_transaction','Betalingen finnes allerede');
  const payer=players.get(fromAccount),payee=players.get(toAccount);if(!payer||!payee)throw new LedgerError('account_not_found','Kontoen finnes ikke');if(!validateMoney(payer.balanceMinor)||payer.balanceMinor<amountMinor)throw new LedgerError('insufficient_funds','Ikke nok saldo');if(!validateMoney(payee.balanceMinor)||payee.balanceMinor>Number.MAX_SAFE_INTEGER-amountMinor)throw new LedgerError('balance_overflow','Saldoen kan ikke oppdateres');
  const transaction={id:transactionId,type:'transfer',referenceType,referenceId:isId(referenceId)?referenceId:null,createdAt:Number.isSafeInteger(createdAt)?createdAt:Date.now(),entries:[{accountId:fromAccount,amountMinor:-amountMinor},{accountId:toAccount,amountMinor}]};validateBalancedTransaction(transaction);
  payer.balanceMinor-=amountMinor;payee.balanceMinor+=amountMinor;ledger.push(transaction);return structuredClone(transaction);
}

export function validateBalancedTransaction(transaction){
  if(!transaction||!isId(transaction.id)||!Array.isArray(transaction.entries)||transaction.entries.length<2)throw new LedgerError('invalid_transaction','Ugyldig transaksjon');const total=transaction.entries.reduce((sum,entry)=>{if(!isId(entry.accountId)||!Number.isSafeInteger(entry.amountMinor)||entry.amountMinor===0)throw new LedgerError('invalid_entry','Ugyldig postering');return sum+entry.amountMinor},0);if(total!==0)throw new LedgerError('unbalanced_transaction','Transaksjonen balanserer ikke');return true;
}

export function normalizeLedger(candidate=[]){
  const normalized=[];for(const raw of Array.isArray(candidate)?candidate:[]){let transaction=raw;if(!Array.isArray(raw?.entries)&&isId(raw?.fromAccount)&&isId(raw?.toAccount)&&validateMoney(raw?.amountMinor)&&raw.amountMinor>0)transaction={id:raw.id,type:'transfer',referenceType:'marketplace',referenceId:raw.listingId||null,createdAt:0,entries:[{accountId:raw.fromAccount,amountMinor:-raw.amountMinor},{accountId:raw.toAccount,amountMinor:raw.amountMinor}]};try{validateBalancedTransaction(transaction);normalized.push(structuredClone(transaction))}catch{}}return normalized;
}

export function accountTransactions(ledger,accountId,limit=20){return ledger.filter(transaction=>transaction.entries.some(entry=>entry.accountId===accountId)).slice(-limit).reverse().map(transaction=>structuredClone(transaction))}
