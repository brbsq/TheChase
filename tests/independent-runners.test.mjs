import test from 'node:test';
import assert from 'node:assert/strict';
import {Race} from '../public/game/engine.js';
import {animationIntent,AthleteLibrary} from '../public/game/athletes.js';
import {runnerProgress} from '../public/game/track.js';
import {GLTFLoader} from '../public/game/vendor/GLTFLoader.js';
import {readFile} from 'node:fs/promises';
const bank=[{prompt:'Action?',options:['jump','blue','happy'],correct:0}];
for(const players of [1,2,4])test(`${players} human players: one fall does not pause or stop other runners`,()=>{
 const r=new Race({players,input:'keyboard',finish:'questions',target:10},bank,()=>.99);r.nextQuestion();
 for(const p of r.players){p.hurdleJump=true;p.jumpLane=p.id===0?(r.question.correct+1)%3:r.question.correct;}
 r.resolve();const fallen=r.players[0],others=[...r.players.slice(1),...r.ai],starts=others.map(p=>p.distance);assert.equal(fallen.lastResult,'Wrong answer');assert.ok(fallen.recovery>0);assert.equal(r.paused,false);const start=fallen.distance;
 for(let i=0;i<20;i++)r.tick(.05);
 assert.equal(fallen.distance,start);assert.equal(animationIntent(fallen,r,4).name,'fall');assert.equal(r.jump(0),false);assert.equal(r.lane(0,-1),false);
 others.forEach((p,i)=>{assert.ok(p.distance>starts[i]);assert.equal(animationIntent(p,r,4).name,'run');assert.ok(runnerProgress(p.distance,fallen.distance)>runnerProgress(starts[i],fallen.distance));});
 const time=r.time;for(let i=0;i<40;i++)r.tick(.05);assert.ok(r.time>time);assert.equal(fallen.recovery,0);assert.ok(fallen.distance>start);assert.equal(animationIntent(fallen,r,4).name,'run');
});
test('missed hurdle recovery is local to the affected runner',()=>{const r=new Race({players:2,input:'keyboard',finish:'distance',target:400},bank);r.nextQuestion();r.players[1].hurdleJump=true;r.players[1].jumpLane=r.question.correct;r.resolve();for(let i=0;i<10;i++)r.tick(.1);assert.equal(r.players[0].distance,0);assert.ok(r.players[1].distance>0);assert.equal(r.paused,false);});
test('one actor falling leaves a matching character running and advances its own mixer',async()=>{const bytes=await readFile(new URL('../public/game/models/green.glb',import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');const library=new AthleteLibrary();library.assets=[gltf];const fall=library.create(0),run=library.create(0);fall.play({name:'fall',token:'impact',duration:2.4});run.play({name:'run',token:'locomotion'});for(let i=0;i<8;i++){fall.update(.05);run.update(.05);}assert.ok(fall.actions.fall.time>0);assert.ok(run.actions.run.time>.35);assert.ok(run.actions.run.isRunning());assert.equal(run.actions.fall.isRunning(),false);fall.dispose();run.dispose();});
test('visible race gaps are monotonic and keep every opponent in the shared scene',()=>{for(const focus of [0,100,800]){const values=[-100,-10,0,10,100].map(delta=>runnerProgress(focus+delta,focus));assert.ok(values.every((v,i)=>!i||v>values[i-1]));assert.ok(values.every(v=>Math.abs(v-focus-1.8)<=12));}});
