import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BackgroundMusic} from '../public/game/music.js';
import {SaveConfirmation} from '../public/game/save-confirmation.js';
import {pairingId} from '../public/game/qr-scanner.js';
import {AthleteLibrary,ATHLETE_IDS,REQUIRED_CLIPS,animationIntent} from '../public/game/athletes.js';
import {GLTFLoader} from '../public/game/vendor/GLTFLoader.js';
const fakeAudio=src=>({src,paused:true,currentTime:0,async play(){if(this.reject)throw Error('Autoplay blocked');this.paused=false;},pause(){this.paused=true;}});
test('music defaults to 50%, recovers blocked autoplay, switches tracks and respects suspension',async()=>{
 const m=new BackgroundMusic(fakeAudio);assert.equal(m.volume,.5);assert.ok(Object.values(m.tracks).every(a=>a.volume===.5&&a.loop));
 m.tracks.menu.reject=true;await m.play();assert.ok(m.blocked);m.tracks.menu.reject=false;m.unlock();await Promise.resolve();assert.equal(m.tracks.menu.paused,false);
 m.setTrack('race');assert.ok(m.tracks.menu.paused);assert.equal(m.tracks.race.paused,false);m.setVolume(.2);m.toggleMute();assert.ok(Object.values(m.tracks).every(a=>a.volume===.2&&a.muted));
 m.suspend('pause');m.suspend('hidden');m.resume('pause');assert.ok(m.tracks.race.paused);m.resume('hidden');assert.equal(m.tracks.race.paused,false);m.setTrack('ending');assert.ok(m.tracks.race.paused);
});
test('stale audio play completion cannot pause the currently resumed track',async()=>{
 const m=new BackgroundMusic(fakeAudio);let resolve;m.tracks.menu.play=function(){this.paused=false;return new Promise(r=>resolve=r);};const first=m.play();m.suspend('hidden');m.tracks.menu.play=async function(){this.paused=false;};m.resume('hidden');resolve();await first;assert.equal(m.tracks.menu.paused,false);
});
test('question bank commits only after three approvals and cancellation always discards proposal',()=>{
 const original=[{prompt:'Original',options:['a','b','c'],correct:0}];
 for(let level=1;level<=3;level++){const gate=new SaveConfirmation();gate.begin(original);for(let n=1;n<level;n++)assert.equal(gate.advance(),null);gate.cancel();assert.equal(gate.advance(),null);assert.equal(original[0].prompt,'Original');}
 const gate=new SaveConfirmation();gate.begin(original);original[0].prompt='Later edit';assert.equal(gate.advance(),null);assert.equal(gate.advance(),null);assert.equal(gate.advance()[0].prompt,'Original');assert.equal(gate.proposal,null);
});
test('QR scanner accepts only same-site camera pairing links',()=>{
 const origin='https://example.test',id='019a1234-1234-1234-1234-123456789abc';assert.equal(pairingId(origin+'/game/#camera='+id,origin),id);assert.equal(pairingId(origin+'/game/index.html#camera='+id,origin),id);
 for(const value of ['https://evil.test/game/#camera='+id,origin+'/other/#camera='+id,origin+'/game/#camera=hello','123456'])assert.equal(pairingId(value,origin),null);
});
for(const id of ATHLETE_IDS)test(`${id}: supplied rig has all clips and independently animated duplicates`,async()=>{
 const bytes=await readFile(new URL(`../public/game/models/${id}.glb`,import.meta.url));const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.ok(json.buffers.every(b=>!b.uri));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');assert.deepEqual(gltf.animations.map(c=>c.name).sort(),[...REQUIRED_CLIPS].sort());
 const library=new AthleteLibrary();library.assets=[gltf];const a=library.create(0),b=library.create(0);let meshA,meshB;a.model.traverse(o=>{if(o.isSkinnedMesh)meshA=o;});b.model.traverse(o=>{if(o.isSkinnedMesh)meshB=o;});assert.notEqual(meshA.skeleton.bones[0],meshB.skeleton.bones[0]);const neutral=b.model.getObjectByName('Foot_L').position.clone();
 for(const name of REQUIRED_CLIPS){a.play({name,token:name});a.update(name==='jump'?.78:.35);a.model.updateMatrixWorld(true);a.model.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));assert.ok(b.model.getObjectByName('Foot_L').position.equals(neutral));}
 a.dispose();b.dispose();
});
test('race events map to jump, fall, recovery and finish reactions',()=>{
 const p={rank:1,jogging:true,lastResult:''},r={phase:'read',round:1};assert.equal(animationIntent(p,r,4).name,'run');assert.equal(animationIntent({...p,jogging:false},r,4).name,'stop');assert.equal(animationIntent({...p,jump:1},r,4).name,'jump');assert.equal(animationIntent({...p,lastResult:'Wrong answer'},{...r,phase:'feedback'},4).name,'fall');assert.equal(animationIntent({...p,lastResult:'Missed hurdle'},{...r,phase:'feedback'},4).name,'fall');assert.equal(animationIntent(p,{finished:true},4).name,'cheer');assert.equal(animationIntent({...p,rank:4},{finished:true},4).name,'sob');
});
test('closing camera setup while permission is pending stops the late stream',async()=>{
 const {CameraController}=await import('../public/game/camera.js');const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator'),originalCancel=globalThis.cancelAnimationFrame,originalDocument=globalThis.document;let resolve,stopped=false;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>new Promise(r=>resolve=r)}}});globalThis.cancelAnimationFrame=()=>{};globalThis.document={createElement:()=>({})};
 try{const camera=new CameraController({video:{srcObject:null},canvas:{},zones:{replaceChildren(){},addEventListener(){},classList:{remove(){}}},count:1,onStatus:()=>{}});const pending=camera.start();camera.stop();resolve({getTracks:()=>[{stop(){stopped=true;}}]});await pending;assert.ok(stopped);assert.equal(camera.running,false);assert.equal(camera.video.srcObject,null);}finally{if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;globalThis.cancelAnimationFrame=originalCancel;globalThis.document=originalDocument;}
});
