import {normalizeSets} from './set-library.js';
import {cloneBank,sameBank,bankVersion,rebaseDraft} from './bank-merge.js';

function rawDraft(value){
 if(!Array.isArray(value)||value.length>30||new Set(value.map(s=>s?.id)).size!==value.length)throw Error('Invalid draft');
 for(const s of value){if(!s||!/^[-\w]{1,80}$/.test(s.id)||typeof s.title!=='string'||s.title.length>90||typeof s.category!=='string'||s.category.length>60||!Array.isArray(s.questions)||s.questions.length>300)throw Error('Invalid draft');
  for(const q of s.questions)if(!q||typeof q.prompt!=='string'||!Array.isArray(q.options)||q.options.length!==3||q.options.some(v=>typeof v!=='string')||!Number.isInteger(q.correct)||q.correct<0||q.correct>2)throw Error('Invalid draft question');
 }return cloneBank(value);
}

export class BankSync{
 constructor(library,{store,cloud,environment,session,legacyStorage,onchange=()=>{}}){Object.assign(this,{library,store,cloud,environment,session,legacyStorage,onchange});this.uid=null;this.epoch=0;this.initialized=false;this.ready=false;this.online=false;this.pending=null;this.base=[];this.remote=[];this.workspace={};this.recovery=[];this.legacy=[];this.lastPersisted='';this.error=null;}
 key(uid=this.uid){return 'chase-bank:'+this.environment+':'+encodeURIComponent(uid||'guest');}
 sessionKey(uid=this.uid){return this.key(uid)+':session:'+this.session;}
 selectValid(){if(!this.library.active)this.library.activeId=this.library.available[0]?.id||null;}
 capture(){return {uid:this.uid,epoch:this.epoch,base:cloneBank(this.base)};}
 current(context){return context.epoch===this.epoch&&context.uid===this.uid;}
 snapshot(){return {version:1,saved:cloneBank(this.library.saved),draft:cloneBank(this.library.draft),activeId:this.library.activeId,base:cloneBank(this.base),pending:cloneBank(this.pending),workspace:cloneBank(this.workspace),recovery:cloneBank(this.recovery)};}
 status(){
  if(this.error)return this.error;
  if(this.pending?.conflicts?.length)return 'Conflict needs review';
  if(this.pending)return 'Waiting to sync';
  if(this.library.dirty||Object.keys(this.workspace).length)return 'Draft saved locally';
  if(this.uid&&!this.ready)return 'Loading your cloud bank…';
  if(this.uid&&!this.online)return 'Saved locally · waiting for connection';
  return this.uid?'Synced':'Saved on this device';
 }
 emit(extra={}){this.onchange({status:this.status(),pending:!!this.pending,conflicts:this.pending?.conflicts||[],legacy:this.legacy,workspace:this.workspace,...extra});}
 async persist(){
  if(this.loadFailed)throw Error('Local recovery could not load. Export recovery before changing this bank.');
  const snapshot=this.snapshot(),serialized=JSON.stringify(snapshot),epoch=this.epoch;
  if(serialized===this.lastPersisted)return this.persistTask;
  this.lastPersisted=serialized;this.persistTask=this.store.write(this.sessionKey(),snapshot);
  try{await this.persistTask;if(epoch===this.epoch){this.error=null;this.emit();}}
  catch(error){if(epoch===this.epoch){this.lastPersisted='';this.error='Local recovery could not save. Export your edited sets before closing this page.';this.emit();}throw error;}
 }
 async account(uid){
  if(this.initialized&&uid===this.uid)return this.openTask;
  const oldWrite=this.initialized&&!this.loadFailed?this.persist().catch(()=>{}):Promise.resolve(),epoch=++this.epoch;
  this.loadFailed=false;this.unreadRecovery=null;this.opening=true;this.uid=uid;this.ready=false;this.online=false;this.pending=null;this.base=[];this.remote=[];this.workspace={};this.recovery=[];this.error=null;this.lastPersisted='';this.flushTask=null;
  this.library.commit([]);this.emit({changed:true,accountChanged:true});this.initialized=true;
  this.openTask=(async()=>{
   await oldWrite;
   try{
    const [saved,cache,legacy]=await Promise.all([this.store.read(this.sessionKey(uid)),this.store.read(this.key(uid)+':cache'),this.readLegacy()]);
    if(epoch!==this.epoch)return;
    this.legacy=legacy;this.unreadRecovery=saved;
    if(saved){this.library.saved=normalizeSets(saved.saved);this.library.draft=rawDraft(saved.draft);this.base=normalizeSets(saved.base||saved.saved);this.library.activeId=saved.activeId;this.workspace=saved.workspace||{};this.recovery=saved.recovery||[];
     if(saved.pending){normalizeSets(saved.pending.base);normalizeSets(saved.pending.sets);this.pending=saved.pending;}
    }else if(cache){this.library.commit(cache.sets);this.base=cloneBank(cache.sets);}
    else if(!uid&&legacy.length){this.library.commit(legacy);this.base=cloneBank(legacy);}
    if(!this.library.active)this.library.activeId=this.library.available[0]?.id||null;
    this.unreadRecovery=null;this.opening=false;await this.persist();if(epoch!==this.epoch)return;this.emit({changed:true,accountChanged:true});
   }catch(error){if(epoch===this.epoch){this.opening=false;this.loadFailed=true;this.error='Local recovery could not load. Your previous recovery record has been kept.';this.emit({changed:true,error});}}
  })();return this.openTask;
 }
 async readLegacy(){
  const key='chase-bank:'+this.environment+':unassigned-recovery',existing=await this.store.read(key);if(existing)return normalizeSets(existing.sets);
  let sets=[];for(const name of ['chase-question-sets','chase-question-sets-backup','sprint-custom']){
   try{const raw=this.legacyStorage?.getItem(name);if(!raw)continue;const rows=normalizeSets(JSON.parse(raw));for(const row of rows)if(!sets.some(s=>s.id===row.id))sets.push(row);}catch{}
  }
  // Keep old keys as well. Nothing is automatically assigned to a teacher.
  if(sets.length)await this.store.write(key,{sets:sets.slice(0,30)});return sets.slice(0,30);
 }
 async consume(state){
  const uid=state.user?.uid||null,opening=this.account(uid),context=this.capture();await opening;await this.openTask;
  if(!this.current(context))return;
  this.ready=!!state.ready;this.online=!!state.online;
  if(state.error){this.error='Cloud sync unavailable. Your local changes are kept. '+state.error.message;this.emit();return;}
  if(state.sets!==undefined&&state.sets!==null){this.error=null;await this.receive(state.sets);}
  this.emit();if(this.ready&&this.online)this.flush();
 }
 async receive(sets){
  const context=this.capture();this.remote=normalizeSets(sets);
  if(!this.library.dirty&&!this.pending){this.library.commit(this.remote);this.base=cloneBank(this.remote);}
  else{
   const draft=rebaseDraft(this.base,this.library.draft,this.remote),saved=rebaseDraft(this.base,this.library.saved,this.remote);
   this.library.saved=normalizeSets(saved.sets);this.library.draft=draft.sets;this.base=draft.base;
  }
  this.selectValid();await this.store.write(this.key()+':cache',{sets:this.remote});if(!this.current(context))return;
  await this.persist();if(this.current(context))this.emit({changed:true});
 }
 draftChanged(){if(!this.initialized||this.opening||this.loadFailed)return;return this.persist().catch(()=>{});}
 async setWorkspace(workspace){this.workspace=cloneBank(workspace);await this.draftChanged();}
 async approve(sets,context=this.capture()){
  if(this.loadFailed)throw Error('Local recovery could not load. Export recovery before changing this bank.');
  if(!this.current(context))throw Error('The signed-in account changed. Review and save under the intended account.');
  const approved=normalizeSets(sets);if(JSON.stringify(approved).length>950000)throw Error('This bank is too large.');
  const previous=this.snapshot(),id=crypto.randomUUID();
  if(this.uid)this.pending={id,base:cloneBank(this.pending?.base||context.base),sets:approved,choices:{},conflicts:[]};
  this.library.saved=cloneBank(approved);
  // The editor can have changed while the confirmation dialog was open.
  this.error=null;
  try{await this.persist();if(!this.current(context))return {status:'cancelled'};
   if(!this.uid)await this.store.write(this.key()+':cache',{sets:approved});
  }catch(error){if(this.current(context)){this.pending=previous.pending;this.library.saved=previous.saved;}throw error;}
  this.emit({changed:true});if(this.uid)this.flush();return {status:this.uid?'pending':'local',id};
 }
 flush(){
  if(this.loadFailed||!this.uid||!this.ready||!this.online||!this.pending||this.pending.conflicts?.length||this.flushTask)return this.flushTask;
  const context=this.capture(),sent=cloneBank(this.pending);
  this.flushTask=Promise.resolve().then(async()=>{
   try{
    const result=await this.cloud.save({base:sent.base,sets:sent.sets,choices:sent.choices});
    if(!this.current(context)||result.status==='cancelled')return;
    if(result.status==='conflict'){
     if(this.pending?.id===sent.id){this.pending.conflicts=result.conflicts;await this.persist();this.emit({review:true});}return;
    }
    if(result.status!=='saved')throw Error('The save was not confirmed.');
    const editor=rebaseDraft(sent.sets,this.library.draft,result.sets);
    if(this.pending?.id===sent.id)this.pending=null;
    else if(this.pending){const next=rebaseDraft(sent.sets,this.pending.sets,result.sets);this.pending.base=next.base;this.pending.sets=normalizeSets(next.sets);this.pending.choices={};this.pending.conflicts=[];}
    this.library.saved=normalizeSets(this.pending?.sets||result.sets);this.library.draft=editor.sets;this.base=editor.base;this.remote=cloneBank(result.sets);this.error=null;const selectedChoice=sent.choices[this.library.activeId];if(selectedChoice?.choice==='both'&&this.library.available.some(s=>s.id===selectedChoice.copyId))this.library.activeId=selectedChoice.copyId;this.selectValid();
    await this.store.write(this.key()+':cache',{sets:result.sets});if(!this.current(context))return;await this.persist();this.emit({changed:true});
   }catch(error){if(this.current(context)){this.error=error.message.includes('Local recovery')?error.message:'Waiting to sync · '+error.message;this.emit();}}
   finally{if(this.current(context)){this.flushTask=null;if(this.pending&&this.pending.id!==sent.id)this.flush();}}
  });return this.flushTask;
 }
 async resolve(id,choice){
  const conflict=this.pending?.conflicts.find(c=>c.id===id);if(!conflict||!['local','cloud','both'].includes(choice))return;
  this.recovery.push({at:Date.now(),...cloneBank(conflict)});this.recovery=this.recovery.slice(-5);
  this.pending.choices[id]={choice,local:bankVersion(conflict.local),cloud:bankVersion(conflict.cloud),copyId:crypto.randomUUID()};
  this.pending.conflicts=this.pending.conflicts.filter(c=>c.id!==id);this.error=null;await this.persist();this.emit({review:this.pending.conflicts.length>0});if(!this.pending.conflicts.length)this.flush();
 }
 async importLegacy(){
  for(const set of this.legacy){const copy=cloneBank(set),existing=this.library.draft.find(s=>s.id===copy.id);if(existing&&sameBank(existing,copy))continue;if(existing){copy.id=crypto.randomUUID();copy.title=copy.title.slice(0,73)+' (recovered copy)';}if(this.library.draft.length>=30)throw Error('Your bank is full. Export or remove a set before importing recovery sets.');this.library.draft.push(copy);}
  this.library.activeId=this.library.available.at(-1)?.id||this.library.activeId;await this.persist();this.emit({changed:true});
 }
}
