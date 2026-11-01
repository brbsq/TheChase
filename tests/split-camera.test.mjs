import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/game/vendor/three.module.js';
import {Stadium} from '../public/game/stadium.js';
import {Race} from '../public/game/engine.js';
import {trackFrame} from '../public/game/track.js';

test('each split camera follows its own runner distance and interpolated lane through track bends',()=>{
 const race=new Race({players:4,input:'keyboard',finish:'questions'},[{prompt:'Action?',options:['jump','blue','happy'],correct:0}]);race.phase='sprint';
 const renders=[],stadium=Object.assign(Object.create(Stadium.prototype),{width:1280,height:800,time:0,reducedMotion:false,view:'split',trees:[],clouds:[],podiums:[],hurdles:[],scene:{},camera:new T.PerspectiveCamera(),cameras:Array.from({length:4},()=>new T.PerspectiveCamera()),runners:Array.from({length:4},(_,i)=>({g:new T.Group(),shadow:new T.Group(),ring:Object.assign(new T.Group(),{material:{}}),tag:{},labelText:'P'+(i+1),actor:{play(){},update(){}}})),renderer:{setScissorTest(){},setViewport(){},setScissor(){},render(scene,camera){camera.updateMatrixWorld();renders.push({position:camera.position.clone(),visible:stadium.runners.map(a=>a.g.visible),projected:stadium.runners.map(a=>new T.Vector3(a.g.position.x,1.6,a.g.position.z).project(camera))});}}});
 for(const [width,height,top]of [[1280,800,238],[444,827,320],[844,390,180]])for(const start of [100,220,400,600]){stadium.width=width;stadium.height=height;stadium.splitTop=top;stadium.splitBottom=height<500?40:58;
  race.players.forEach((p,i)=>{p.distance=start-i*8;p.lane=i%3;p.fromLane=p.lane;});
  renders.length=0;stadium.update(.05,race);
  for(let i=0;i<4;i++){const expected=trackFrame(race.players[i].distance-22,stadium.runners[i].lateral);const rendered=renders[i+1];assert.ok(Math.abs(rendered.position.x-expected.x)<1e-8);assert.ok(Math.abs(rendered.position.z-expected.z)<1e-8);assert.ok(rendered.visible.every(Boolean),'other runners remain in each scene');assert.ok(rendered.projected.every(p=>Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1),'other runners remain inside the focused viewport');}
  assert.notDeepEqual(renders[1].position,renders[2].position);
 }
});
