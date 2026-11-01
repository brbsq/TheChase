import {normalizeSets} from './set-library.js';
export const cloneBank=value=>JSON.parse(JSON.stringify(value));
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export const bankVersion=value=>JSON.stringify(canonical(value??null));
export const sameBank=(a,b)=>bankVersion(a)===bankVersion(b);
const index=sets=>new Map(sets.map(set=>[set.id,set]));
const gone=set=>!set||set.deleted;

// Compare complete sets, not array positions. Question order remains significant.
export function mergeBanks(base,local,cloud,choices={}){
 const before=index(base),mine=index(local),theirs=index(cloud),ids=new Set([...theirs.keys(),...mine.keys(),...before.keys()]);
 const merged=new Map(),conflicts=[];
 for(const id of ids){
  const b=before.get(id)??null,l=mine.get(id)??null,r=theirs.get(id)??null;
  let value;
  if(sameBank(l,b))value=r;
  else if(sameBank(r,b)||sameBank(l,r))value=l;
  else{
   const decision=choices[id];
   if(!decision||decision.local!==bankVersion(l)||decision.cloud!==bankVersion(r)){
    conflicts.push({id,base:b,local:l,cloud:r});value=r;
   }else if(decision.choice==='local')value=l;
   else if(decision.choice==='cloud')value=r;
   else if(decision.choice==='both'){
    value=r;
    // A deleted version stays in the recovery record. Keep the surviving edit.
    if(gone(l)){value=r;}
    else{
     const copy={...cloneBank(l),id:decision.copyId,title:l.title.slice(0,76)+' (device copy)',deleted:false};
     if(!copy.id||ids.has(copy.id)&&!sameBank(theirs.get(copy.id),copy))throw Error('A recovery copy already uses this ID. Review the conflict again.');
     merged.set(copy.id,copy);
    }
   }else{conflicts.push({id,base:b,local:l,cloud:r});value=r;}
  }
  if(value)merged.set(id,cloneBank(value));
 }
 // Replaying an acknowledged Keep both operation must not duplicate the copy.
 const sets=[...merged.values()];
 if(!conflicts.length){const normalized=normalizeSets(sets);if(JSON.stringify(normalized).length>950000)throw Error('This bank is too large. Export or remove a set before syncing.');return {sets:normalized,conflicts};}
 return {sets,conflicts};
}

// Rebase an editor (which may contain incomplete questions) without validating it
// as a publishable bank. Locally changed sets and their original base survive.
export function rebaseDraft(base,local,cloud){
 const before=index(base),mine=index(local),theirs=index(cloud),sets=[],nextBase=[];
 for(const id of new Set([...theirs.keys(),...mine.keys(),...before.keys()])){
  const b=before.get(id)??null,l=mine.get(id)??null,r=theirs.get(id)??null;
  const changed=!sameBank(l,b)&&!sameBank(l,r),value=changed?l:r,baseline=changed?b:r;
  if(value)sets.push(cloneBank(value));if(baseline)nextBase.push(cloneBank(baseline));
 }
 return {sets,base:nextBase};
}

export function readBankRecord(record){
 if(!record)return {sets:[],revision:0};
 const revision=record.revision;
 if(!Number.isSafeInteger(revision)||revision<1)throw Error('The cloud bank has an invalid revision. Your local copy is safe.');
 return {sets:normalizeSets(JSON.parse(record.setsJSON??record.questionsJSON)),revision};
}
