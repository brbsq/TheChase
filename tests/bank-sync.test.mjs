import test from 'node:test';
import assert from 'node:assert/strict';
import {SetLibrary} from '../public/game/set-library.js';
import {BankSync} from '../public/game/bank-sync.js';
import {mergeBanks,bankVersion} from '../public/game/bank-merge.js';
const q={prompt:'An action?',options:['jump','blue','happy'],correct:0};
const set=(id,title=id)=>({id,title,category:'Year 1',questions:[structuredClone(q)]});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const storage=()=>{const data=new Map();return {data,read:async k=>structuredClone(data.get(k)||null),write:async(k,v)=>data.set(k,structuredClone(v))};};
function server(initial=[]){
 let sets=structuredClone(initial),offline=false,hold=null;const listeners=new Set();
 return {get sets(){return sets;},listeners,setOffline:v=>offline=v,hold:fn=>hold=fn,
  async save(request){if(offline)throw Error('offline');const result=mergeBanks(request.base,request.sets,sets,request.choices);if(result.conflicts.length)return {status:'conflict',conflicts:result.conflicts};sets=result.sets;for(const fn of listeners)fn(structuredClone(sets));if(hold)await hold();return {status:'saved',sets:structuredClone(sets),revision:1};}
 };
}
async function device(cloud,{store=storage(),session=crypto.randomUUID(),uid='teacher',legacyStorage}={}){
 const library=new SetLibrary(),states=[],sync=new BankSync(library,{store,cloud,environment:'test',session,legacyStorage,onchange:s=>states.push(s)});
 await sync.consume({user:uid?{uid}:null,ready:true,online:true,sets:cloud.sets});
 cloud.listeners.add(sets=>{if(sync.uid===uid)sync.consume({user:uid?{uid}:null,ready:true,online:true,sets});});
 return {sync,library,store,session,states};
}
async function save(d){await d.sync.approve(d.library.proposal());await d.sync.flushTask;await tick();await tick();}

test('different devices add and edit different sets without conflicts and see live updates',async()=>{
 const cloud=server([set('a'),set('b')]),a=await device(cloud),b=await device(cloud);
 a.library.activeId='a';a.library.active.title='Laptop edit';b.library.activeId='b';b.library.active.title='Phone edit';
 await save(a);assert.equal(b.library.draft.find(s=>s.id==='a').title,'Laptop edit');assert.equal(b.library.active.title,'Phone edit');await save(b);
 assert.deepEqual(cloud.sets.map(s=>s.title),['Laptop edit','Phone edit']);assert.equal(a.library.draft.find(s=>s.id==='b').title,'Phone edit');assert.equal(b.sync.pending,null);
});
test('same-set conflicts preserve both versions and wait for an explicit choice',async()=>{
 const cloud=server([set('a')]),a=await device(cloud),b=await device(cloud);a.library.active.title='Laptop';b.library.active.title='Phone';await save(a);await save(b);
 assert.equal(b.sync.status(),'Conflict needs review');assert.equal(cloud.sets[0].title,'Laptop');assert.equal(b.library.active.title,'Phone');
 await b.sync.resolve('a','cloud');await b.sync.flushTask;await tick();assert.equal(b.library.active.title,'Laptop');assert.equal(b.sync.pending,null);assert.equal(b.sync.recovery[0].local.title,'Phone');
});
test('Keep both creates one labelled copy and repeated transaction merges do not duplicate it',()=>{
 const base=[set('a')],local=[set('a','Phone')],cloud=[set('a','Laptop')],choices={a:{choice:'both',local:bankVersion(local[0]),cloud:bankVersion(cloud[0]),copyId:'copy'}};
 const merged=mergeBanks(base,local,cloud,choices);assert.equal(merged.sets.length,2);assert.ok(merged.sets.some(s=>s.title==='Phone (device copy)'));assert.deepEqual(mergeBanks(base,local,merged.sets,choices).sets,merged.sets);
});
test('a newer cloud edit invalidates an older conflict choice',()=>{
 const base=[set('a')],local=[set('a','Phone')],cloud=[set('a','Laptop')],choices={a:{choice:'local',local:bankVersion(local[0]),cloud:bankVersion(cloud[0])}};
 assert.equal(mergeBanks(base,local,[set('a','Laptop newer')],choices).conflicts.length,1);
});
test('edit versus delete is a conflict, including deleted starter overrides',()=>{
 assert.equal(mergeBanks([set('a')],[],[set('a','Changed')]).conflicts.length,1);
 const original=set('starter-1-all');assert.equal(mergeBanks([original],[{...original,deleted:true,questions:[]}],[{...original,title:'Changed'}]).conflicts.length,1);
});
test('failed approved saves survive a reload and upload after reconnection',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);cloud.setOffline(true);a.library.active.title='Offline change';await save(a);assert.ok(a.sync.pending);
 const restored=await device(cloud,{store:a.store,session:a.session});assert.equal(restored.library.active.title,'Offline change');assert.ok(restored.sync.pending);
 cloud.setOffline(false);await restored.sync.flush();await tick();assert.equal(cloud.sets[0].title,'Offline change');assert.equal(restored.sync.pending,null);
});
test('unfinished duplicate-answer questions and blank titles survive a draft reload without cloud upload',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);a.library.active.title='';a.library.active.questions.push({prompt:'',options:['','',''],correct:0});await a.sync.draftChanged();
 const restored=await device(cloud,{store:a.store,session:a.session});assert.equal(restored.library.active.title,'');assert.equal(restored.library.active.questions.length,2);assert.equal(cloud.sets[0].title,'a');assert.equal(restored.sync.pending,null);
});
test('an upload acknowledgement does not erase edits typed during the upload',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);let release;cloud.hold(()=>new Promise(resolve=>release=resolve));a.library.active.title='Approved';await a.sync.approve(a.library.proposal());await tick();a.library.active.title='New unapproved edit';await a.sync.draftChanged();release();await a.sync.flushTask;
 assert.equal(cloud.sets[0].title,'Approved');assert.equal(a.library.active.title,'New unapproved edit');assert.ok(a.library.dirty);
});
test('a second approval while an upload is running advances its base to the acknowledged save',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);let release;cloud.hold(()=>new Promise(resolve=>release=resolve));a.library.active.title='First';await a.sync.approve(a.library.proposal());await tick();a.library.active.title='Second';await a.sync.approve(a.library.proposal());cloud.hold(null);release();await a.sync.flushTask;await tick();await a.sync.flushTask;await tick();assert.equal(cloud.sets[0].title,'Second');assert.equal(a.sync.pending,null);
});
test('account switches isolate drafts, pending saves, and delayed acknowledgements',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);let release;cloud.hold(()=>new Promise(resolve=>release=resolve));a.library.active.title='Teacher A';await a.sync.approve(a.library.proposal());await tick();await a.sync.consume({user:{uid:'teacher-b'},ready:true,online:true,sets:[]});assert.equal(a.library.saved.length,0);release();await tick();assert.equal(a.library.saved.length,0);assert.equal(a.sync.pending,null);
 cloud.hold(null);await a.sync.consume({user:{uid:'teacher'},ready:true,online:true,sets:cloud.sets});assert.equal(a.library.active.title,'Teacher A');
});
test('two tabs retain independent unfinished drafts for the same account',async()=>{
 const cloud=server([set('a')]),store=storage(),a=await device(cloud,{store,session:'a'}),b=await device(cloud,{store,session:'b'});a.library.active.title='Tab A';b.library.active.title='Tab B';await a.sync.draftChanged();await b.sync.draftChanged();
 const restored=await device(cloud,{store,session:'a'});assert.equal(restored.library.active.title,'Tab A');
});
test('legacy local banks are preserved for explicit import and never assigned to a teacher automatically',async()=>{
 const cloud=server([]),legacyStorage={getItem:key=>key==='chase-question-sets'?JSON.stringify([set('legacy')]):null},a=await device(cloud,{legacyStorage});assert.equal(a.library.saved.length,0);assert.equal(a.sync.legacy.length,1);await a.sync.importLegacy();assert.equal(a.library.active.title,'legacy');assert.ok(a.library.dirty);assert.equal(cloud.sets.length,0);
});
test('storage failure stops an approved save before contacting the cloud',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);a.library.active.title='Important';a.store.write=async()=>{throw Error('quota');};await assert.rejects(a.sync.approve(a.library.proposal()));assert.equal(cloud.sets[0].title,'a');assert.equal(a.library.active.title,'Important');
});
test('Keep both respects the existing bank capacity',()=>{
 const base=Array.from({length:30},(_,i)=>set('set-'+i)),local=structuredClone(base),cloud=structuredClone(base);local[0].title='Local';cloud[0].title='Remote';assert.throws(()=>mergeBanks(base,local,cloud,{'set-0':{choice:'both',local:bankVersion(local[0]),cloud:bankVersion(cloud[0]),copyId:'extra'}}));
});

test('manual form workspace survives reload and stays with its account',async()=>{
 const cloud=server([]),a=await device(cloud);await a.sync.setWorkspace({form:{'custom-prompt':'Half written question'},editingIndex:null});
 const restored=await device(cloud,{store:a.store,session:a.session});assert.equal(restored.sync.workspace.form['custom-prompt'],'Half written question');
 await restored.sync.consume({user:{uid:'other'},ready:true,online:true,sets:[]});assert.deepEqual(restored.sync.workspace,{});
});
test('a save cannot contact Firebase before its approved recovery snapshot is durable',async()=>{
 const cloud=server([set('a')]),a=await device(cloud);a.library.active.title='Durable first';const write=a.store.write;let release;
 a.store.write=(key,value)=>new Promise(resolve=>{release=()=>write(key,value).then(resolve);});const approval=a.sync.approve(a.library.proposal());await tick();assert.equal(cloud.sets[0].title,'a');a.store.write=write;await release();await approval;await a.sync.flushTask;assert.equal(cloud.sets[0].title,'Durable first');
});
test('switching accounts during confirmation rejects the old approval context',async()=>{
 const cloud=server([set('a')]),a=await device(cloud),context=a.sync.capture(),approved=a.library.proposal();await a.sync.consume({user:{uid:'other'},ready:true,online:true,sets:[]});await assert.rejects(a.sync.approve(approved,context),/account changed/);assert.equal(a.sync.pending,null);
});
test('unreadable recovery data is preserved instead of overwritten by an empty editor',async()=>{
 const cloud=server([]),store=storage(),key='chase-bank:test:teacher:session:broken',record={saved:[{id:'broken'}],draft:[]};await store.write(key,record);
 const sync=new BankSync(new SetLibrary(),{store,cloud,environment:'test',session:'broken'});await sync.account('teacher');assert.equal(sync.loadFailed,true);await assert.rejects(sync.approve([]),/recovery could not load/);assert.deepEqual(store.data.get(key),record);
});
test('choosing Keep both for a cloud deletion selects the restored copy',async()=>{
 const cloud=server([set('a')]),a=await device(cloud),b=await device(cloud);a.library.active.title='Edited locally';b.library.removeSet();await save(b);await save(a);await a.sync.resolve('a','both');await a.sync.flushTask;await tick();assert.ok(a.library.active.title.includes('device copy'));assert.notEqual(a.library.activeId,'a');
});
