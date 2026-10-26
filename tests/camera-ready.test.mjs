import test from 'node:test';import assert from 'node:assert/strict';
import {cameraSessionReady} from '../public/game/camera-ready.js';
test('locked built-in camera starts without repeating setup after a missed detection frame',()=>{
 const camera={running:true,calibrated:true,count:2};
 assert.ok(cameraSessionReady({input:'camera',count:2,camera}));
 assert.ok(cameraSessionReady({input:'camera',count:2,camera:{...camera,selection:false}}));
 assert.ok(!cameraSessionReady({input:'camera',count:3,camera}));
 assert.ok(!cameraSessionReady({input:'camera',count:2,camera:{...camera,running:false}}));
 assert.ok(!cameraSessionReady({input:'camera',count:2,camera:{...camera,calibrated:false}}));
});
test('external readiness uses the connected device lock state and selected player count',()=>{
 const state={input:'phone',count:2,channel:{readyState:'open'},phoneState:{calibrated:true,players:[{},{}],detected:0}};
 assert.ok(cameraSessionReady(state));
 assert.ok(!cameraSessionReady({...state,channel:{readyState:'closed'}}));
 assert.ok(!cameraSessionReady({...state,count:1}));
 assert.ok(!cameraSessionReady({...state,phoneState:{...state.phoneState,calibrated:false}}));
});
