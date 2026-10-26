import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {crowdReactions,OutcomeSound,CROWD_URLS} from '../public/game/outcome-sound.js';
import {Race} from '../public/game/engine.js';
const good={hurdleJump:true,jumpLane:1},wrong={hurdleJump:true,jumpLane:0},missed={hurdleJump:false,jumpLane:1};
const race=players=>({players,question:{correct:1}});
test('crowd outcome requires both a correct answer and a cleared hurdle, ignoring spectators',()=>{
 assert.deepEqual(crowdReactions(race([good])),[{kind:'cheer',delay:0}]);
 for(const p of [wrong,missed])assert.deepEqual(crowdReactions(race([p])),[{kind:'aww',delay:.48+.08}]);
 assert.deepEqual(crowdReactions(race([good,wrong,missed])),[{kind:'cheer',delay:0},{kind:'aww',delay:1.7}]);
 assert.deepEqual(crowdReactions(race([{...good,caught:true},{...missed,caught:true}])),[]);
});
test('real race resolution produces the corresponding crowd reaction',()=>{
 for(const outcome of ['correct','wrong','missed']){
  const r=new Race({players:1,input:'keyboard',finish:'questions',target:1},[{prompt:'Pick A',options:['A','B','C'],correct:0}],()=>.99);r.nextQuestion();r.phase='approach';r.phaseTime=r.actionDuration-.3;
  r.players[0].lane=outcome==='wrong'?(r.question.correct+1)%3:r.question.correct;if(outcome!=='missed')r.jump(0);r.resolve();
  assert.equal(crowdReactions(r)[0].kind,outcome==='correct'?'cheer':'aww');
 }
});
function harness(){const sources=[],fetched=[],decoded=[];let enabled=true;const context={currentTime:10,destination:{},resume:async()=>{},decodeAudioData:async bytes=>{decoded.push(bytes);return {duration:1.65};},createBufferSource(){const s={connect(){},start(t){this.at=t;},stop(){this.stopped=true;}};sources.push(s);return s;}};
 const audio=new OutcomeSound({enabled:()=>enabled,createContext:()=>context,fetchBytes:async kind=>{fetched.push(kind);return new ArrayBuffer(8);}});return {audio,sources,fetched,decoded,context,mute(){enabled=false;audio.stop();}};}
test('recorded reactions preload once and schedule mixed outcomes without stacking per player',async()=>{
 const h=harness();await h.audio.prepare();await h.audio.react(race([good,good,wrong]));assert.deepEqual(h.sources.map(s=>s.at),[10,11.7]);
 await h.audio.react(race([missed]));assert.equal(h.sources.length,3);assert.equal(h.sources[2].at,10.56);assert.equal(h.fetched.length,3);assert.equal(h.decoded.length,3);
 h.mute();assert.ok(h.sources.every(s=>s.stopped));await h.audio.react(race([good]));assert.equal(h.sources.length,3);
});
test('leaving or muting during decode cancels pending reactions',async()=>{
 const k=harness();let unlock;const gate=new Promise(resolve=>{unlock=resolve;});k.context.decodeAudioData=()=>gate;const play=k.audio.react(race([good]));await Promise.resolve();await Promise.resolve();k.audio.stop();unlock({duration:1});await play;assert.equal(k.sources.length,0);
});
test('both crowd recordings are packaged MP3s with source credits',()=>{
 for(const url of Object.values(CROWD_URLS)){const data=readFileSync(new URL(url));assert.ok(data.length>10000);assert.equal(data.subarray(0,3).toString(),'ID3');}
 assert.match(readFileSync(new URL('../public/game/audio/CREDITS.md',import.meta.url),'utf8'),/Soundza Standard License/);
});


test('a resolved result still reacts when the same tick finishes the race or catches its player',()=>{
 assert.deepEqual(crowdReactions({players:[{...missed,caught:true}],questions:[{round:2,correct:true},{round:3,correct:false}],round:3,phase:'results'}),[{kind:'aww',delay:.48+.08}]);
});


test('fall and hurdle impacts play the packaged sample before the aww',async()=>{
 const h=harness();await h.audio.prepare();await h.audio.impact();await h.audio.react(race([missed]));assert.deepEqual(h.sources.map(s=>s.at),[10,10.56]);
 const {IMPACT_URL,IMPACT_DURATION}=await import('../public/game/impact-sound.js');assert.equal(IMPACT_DURATION,.48);assert.ok(readFileSync(new URL(IMPACT_URL)).length>1000);
 h.mute();await h.audio.impact();assert.equal(h.sources.length,2);
});
