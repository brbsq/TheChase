// IndexedDB has room for recoverable banks, including incomplete drafts. Fall
// back to browser storage where IndexedDB is unavailable; never claim success
// when neither durable store accepted a write.
export class BankStorage{
 constructor({indexedDB=globalThis.indexedDB,fallback=globalThis.localStorage}={}){this.indexedDB=indexedDB;this.fallback=fallback;this.writes=new Map();}
 async database(){
  if(!this.indexedDB)return null;
  this.opening??=new Promise((resolve,reject)=>{const req=this.indexedDB.open('thechase-question-banks',1);req.onupgradeneeded=()=>req.result.createObjectStore('banks');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  try{return await this.opening;}catch{return null;}
 }
 async read(key){
  const db=await this.database();
  if(db){const value=await new Promise((resolve,reject)=>{const req=db.transaction('banks').objectStore('banks').get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});if(value!==undefined)return value;}
  const raw=this.fallback?.getItem(key);return raw?JSON.parse(raw):null;
 }
 write(key,value){
  const snapshot=structuredClone(value),previous=this.writes.get(key)||Promise.resolve();
  const next=previous.catch(()=>{}).then(async()=>{const db=await this.database();if(!db){if(!this.fallback)throw Error('Browser storage is unavailable.');this.fallback.setItem(key,JSON.stringify(snapshot));return;}
   await new Promise((resolve,reject)=>{const tx=db.transaction('banks','readwrite');tx.objectStore('banks').put(snapshot,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Local save was interrupted.'));});
  });this.writes.set(key,next);return next;
 }
}

export function bankEnvironment(location=globalThis.location){return ['localhost','127.0.0.1'].includes(location?.hostname)?'test:demo-thechase':'live:thechase-brbsq';}
export function bankSession(storage=globalThis.sessionStorage){let id=storage?.getItem('chase-bank-session');if(!id){id=crypto.randomUUID();storage?.setItem('chase-bank-session',id);}return id;}
