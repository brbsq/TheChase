import test from 'node:test';
import assert from 'node:assert/strict';
import {Race} from '../public/game/engine.js';
import {raceViewports,controlRegions} from '../public/game/race-view.js';
const bank=[{prompt:'Action?',options:['jump','blue','happy'],correct:0}];
const make=()=>new Race({players:2,input:'keyboard',finish:'questions',target:1,reading:'protected'},bank,()=>.99);
const advance=(race,seconds)=>{for(let i=0;i<Math.round(seconds/.05);i++)race.tick(.05);};

test('earlier correct-lane arrival creates a genuine distance lead and wins the final result',()=>{
 const r=make();r.nextQuestion();
 // Both players begin in the same incorrect lane and complete a correct jump together.
 for(const p of r.players)p.lane=p.fromLane=(r.question.correct+1)%3;
 r.phaseTime=1;r.lane(0,r.question.correct-r.players[0].lane);
 r.phaseTime=5;r.lane(1,r.question.correct-r.players[1].lane);
 r.phase='approach';r.phaseTime=6.8;r.players.forEach(p=>r.jump(p.id));
 assert.equal(r.players[0].distance,r.players[1].distance,'no answer is revealed through premature speed');
 r.resolve();advance(r,2.5);
 assert.ok(r.players[0].distance>r.players[1].distance+.5);
 assert.equal(r.players[0].correct,1);assert.equal(r.players[1].correct,1);
 assert.equal(r.players[0].rank,1);assert.equal(r.phase,'results');
 assert.ok(r.questions[0].laneChoiceSeconds<r.questions[1].laneChoiceSeconds);
});

test('leaving and returning to a lane uses the final arrival time; incorrect and missed jumps earn no timing reward',()=>{
 const r=make();r.nextQuestion();r.phaseTime=1;r.lane(0,-1);r.phaseTime=2;r.lane(0,1);r.phaseTime=5;r.lane(0,-1);
 r.phase='approach';r.phaseTime=6.8;r.jump(0);r.resolve();
 assert.equal(r.players[0].choiceTime,5.36);assert.equal(r.players[1].choiceSpeed,0);assert.equal(r.players[1].correct,0);
 const wrong=make();wrong.nextQuestion();wrong.phase='approach';wrong.phaseTime=6.8;wrong.players[0].lane=(wrong.question.correct+1)%3;wrong.jump(0);wrong.resolve();assert.equal(wrong.players[0].choiceSpeed,0);
});

test('timing uses simulation time so pausing cannot reduce the reward',()=>{
 const r=make();r.nextQuestion();r.phaseTime=2;r.lane(0,-1);const entered=r.players[0].laneEnteredAt;r.paused=true;advance(r,20);assert.equal(r.players[0].laneEnteredAt,entered);assert.equal(r.phaseTime,2);
});

test('equivalent performances remain fair and every question clears its timing state',()=>{
 const r=make();r.nextQuestion();r.phase='approach';r.phaseTime=6.8;for(const p of r.players){p.lane=r.question.correct;r.jump(p.id);}r.resolve();advance(r,1);
 assert.equal(r.players[0].distance,r.players[1].distance);r.nextQuestion();assert.ok(r.players.every(p=>p.choiceTime===null&&p.laneEnteredAt===0));
});

test('2, 3 and 4 players get distinct controls and matching split view regions',()=>{
 for(const count of [2,3,4])for(const [w,h]of [[1280,800],[844,390],[390,844]]){
  const views=raceViewports(w,h,count,180,58),controls=controlRegions(w,h,count,{split:true,top:180,bottom:58});
  for(let i=0;i<count;i++){const view=views[i],control=controls[i];assert.equal(control.x,view.x);assert.equal(control.width,view.width);assert.ok(control.y>=view.y);assert.ok(control.y+control.height<=view.y+view.height);}
  const shared=controlRegions(w,h,count);assert.equal(new Set(shared.map(r=>r.x+','+r.y)).size,count);
 }
});
