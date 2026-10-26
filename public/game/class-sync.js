import {classSnapshot} from './classrooms.js';
export function cloudClassRecords(value){return Object.entries(value||{}).map(([id,row])=>({...row,id})).filter(row=>classSnapshot(row)&&typeof row.archived==='boolean').slice(0,120);}
export class ClassSync{
 constructor(store,{storage,subscribe,save,status=()=>{}}){Object.assign(this,{store,storage,subscribe,save,status});this.uid=null;this.epoch=0;this.pending=new Map();this.remote=[];this.before=store.records;this.ready=false;this.flushTask=null;store.subscribe(event=>{if(event.source==='local'&&this.uid){for(const row of event.records)if(JSON.stringify(row)!==JSON.stringify(this.before.find(r=>r.id===row.id)))this.pending.set(row.id,row);this.persist();this.flush();}this.before=event.records;});}
 queueKey(){return 'chase-class-pending:'+this.uid;}
 persist(){if(this.uid)this.storage.setItem(this.queueKey(),JSON.stringify([...this.pending.values()]));}
 async account(uid){
  const epoch=++this.epoch;this.stop?.();this.stop=null;this.uid=uid;this.ready=false;this.flushTask=null;this.pending=new Map();this.remote=[];const guest=this.store.key==='chase-classrooms'?this.store.records:[];this.store.useAccount(uid);
  if(!uid){this.status('Sign in to sync classes across your devices.');return;}
  try{for(const row of JSON.parse(this.storage.getItem(this.queueKey())||'[]'))if(classSnapshot(row)&&typeof row.archived==='boolean')this.pending.set(row.id,row);
   const owner=this.storage.getItem('chase-classrooms-guest-owner');if(!owner&&guest.length){for(const row of guest)this.pending.set(row.id,row);this.storage.setItem('chase-classrooms-guest-owner',uid);this.persist();}
   this.status('Loading your classes…');const stop=await this.subscribe(uid,value=>{if(epoch!==this.epoch)return;this.remote=cloudClassRecords(value);this.ready=true;
    // Merge a former guest class into an existing matching class without duplicating it.
    for(const [id,row] of this.pending)if(!this.remote.some(r=>r.id===id)&&this.remote.some(r=>r.name.toLocaleLowerCase()===row.name.toLocaleLowerCase()&&r.year===row.year&&r.archived===row.archived))this.pending.delete(id);
    this.persist();this.reconcile();this.flush();
   },()=>{if(epoch===this.epoch){this.ready=false;this.status('Classes could not sync. Your changes are kept on this device.');}});
   if(epoch===this.epoch)this.stop=stop;else stop?.();
  }catch{if(epoch===this.epoch)this.status('Classes could not sync. Your changes are kept on this device.');}
 }
 reconcile(){const merged=new Map(this.remote.map(row=>[row.id,row]));for(const [id,row] of this.pending)merged.set(id,row);try{this.store.replaceRemote([...merged.values()]);this.status(this.pending.size?'Saving classes…':'Classes synced with your account.');}catch{this.status('Classes could not sync. Your changes are kept on this device.');}}
 flush(){if(!this.uid||!this.ready||this.flushTask||!this.pending.size)return this.flushTask;const epoch=this.epoch,uid=this.uid;this.status('Saving classes…');
  this.flushTask=Promise.resolve().then(async()=>{try{while(epoch===this.epoch&&this.pending.size){const [id,row]=this.pending.entries().next().value;await this.save(uid,row);if(epoch!==this.epoch)return;if(this.pending.get(id)===row)this.pending.delete(id);this.persist();}if(epoch===this.epoch)this.reconcile();}catch{if(epoch===this.epoch)this.status('Classes could not sync. Your changes are kept on this device.');}finally{if(epoch===this.epoch)this.flushTask=null;}});return this.flushTask;
 }
}
