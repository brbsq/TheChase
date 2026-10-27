export class MotionInterpreter{
 constructor(count){this.count=count;this.baselines=[];this.anchors=[];this.regions=[];this.states=Array.from({length:count},()=>({armed:true,armArmed:[true,true],waveOrigins:[null,null],wavePrevious:[null,null],waveStillSince:[null,null],lastKnee:0,lastJog:-1e9,lastJump:-1e9,lastHop:-1e9,lostAt:null,groundSince:null}));}
 features(l){if(!l)return null;const points=[11,12,23,24,25,26,27,28];if(points.some(i=>!l[i]||(l[i].visibility??1)<.35))return null;const hip={x:1-(l[23].x+l[24].x)/2,y:(l[23].y+l[24].y)/2};const torso=Math.max(.05,Math.abs(hip.y-(l[11].y+l[12].y)/2));const arms=[[11,13,15,17,19,21],[12,14,16,18,20,22]].map(([shoulder,...joints])=>joints.map(j=>l[j]&&(l[j].visibility??1)>=.35?{x:(l[j].x-l[shoulder].x)/torso,y:(l[j].y-l[shoulder].y)/torso}:null));return {x:hip.x,y:hip.y,arms,feet:(l[27].y+l[28].y)/2,leftFoot:l[27].y,rightFoot:l[28].y,torso,knee:(l[25].y-l[26].y)/torso};}
 assign(poses){const candidates=poses.map((pose,index)=>({pose,index,f:this.features(pose)})).filter(p=>p.f);if(!this.anchors.some(Boolean)&&!this.regions.some(Boolean)&&!candidates.some(c=>Number.isInteger(c.pose.playerSlot)))return [...candidates].sort((a,b)=>a.f.x-b.f.x).slice(0,this.count).map(p=>p.pose).concat(Array(this.count).fill(null)).slice(0,this.count);
 // Global one-to-one nearest-body matching, independent of detector ordering or screen regions.
 let best=Infinity,result=Array(this.count).fill(null);const search=(id,used,slots,cost)=>{if(cost>=best)return;if(id===this.count){best=cost;result=[...slots];return;}const anchor=this.anchors[id];if(this.baselines[id]&&this.states[id].lostAt!==null&&(this.regions[id]||this.now-this.states[id].lostAt>=500)){search(id+1,used,[...slots,null],cost+.55);return;}search(id+1,used,[...slots,null],cost+.55);for(const c of candidates){if(used.has(c.index)||Number.isInteger(c.pose.playerSlot)&&c.pose.playerSlot!==id)continue;const region=this.regions[id];if(region&&c.pose.playerSlot!==id)continue;if(region&&(c.f.x<region.x||c.f.x>region.x+region.width||c.f.y<region.y||c.f.y>region.y+region.height))continue;const d=anchor?Math.hypot(c.f.x-anchor.x,(c.f.y-anchor.y)*.55):.25;if(anchor){const baseline=this.baselines[id];const limit=Math.min(.12,(baseline?.torso||.25)*.48);if(d>limit||baseline&&(c.f.torso/baseline.torso<.72||c.f.torso/baseline.torso>1.38))continue;
 // Keep a lock unmatched when two bodies are too close to distinguish safely.
 if(candidates.some(other=>other.index!==c.index&&Math.hypot(other.f.x-c.f.x,(other.f.y-c.f.y)*.55)<.035))continue;}
 used.add(c.index);search(id+1,used,[...slots,c.pose],cost+d);used.delete(c.index);}};search(0,new Set(),[],0);return result;}
 reset(id){Object.assign(this.states[id],{armed:true,armArmed:[true,true],waveOrigins:[null,null],wavePrevious:[null,null],waveStillSince:[null,null],lastKnee:0,lastJog:-1e9,lastJump:-1e9,lastHop:-1e9,lostAt:null,groundSince:null});}
 lock(poses,index,id){const f=this.features(poses[index]);if(!f||id<0||id>=this.count)return false;const assigned=this.assign(poses),previous=assigned.indexOf(poses[index]);if(previous>=0&&previous!==id){const oldBaseline=this.baselines[id],oldAnchor=this.anchors[id];this.baselines[previous]=oldBaseline;this.anchors[previous]=oldAnchor;const oldRegion=this.regions[id];this.regions[id]=this.regions[previous];this.regions[previous]=oldRegion;this.reset(previous);}this.baselines[id]={...f};this.anchors[id]={...f};this.reset(id);return true;}
 calibrate(poses,{partial=false}={}){let assigned=this.assign(poses);if(assigned.some(p=>!p))assigned=poses.filter(p=>this.features(p)).sort((a,b)=>this.features(a).x-this.features(b).x).slice(0,this.count);const features=assigned.map(l=>this.features(l));if(!features.some(Boolean)||(!partial&&(features.length!==this.count||features.some(f=>!f))))return false;this.regions=[];this.baselines=features.map(f=>f?{...f}:null);this.anchors=features.map(f=>f?{...f}:null);this.states.forEach((_,i)=>this.reset(i));return true;}
 get calibrated(){return Array.from({length:this.count},(_,i)=>!!this.baselines[i]).every(Boolean);}
 update(poses,now){this.now=now;const assigned=this.assign(poses),events=[],players=[];for(let i=0;i<this.count;i++){const f=this.features(assigned[i]),b=this.baselines[i],s=this.states[i];if(f)this.anchors[i]={...f};if(!f||!b){if(b)s.lostAt??=now;s.armArmed=[false,false];s.waveOrigins=[null,null];s.wavePrevious=[null,null];players.push({id:i,tracked:!!f,jogging:false,locked:!!b});continue;}s.lostAt=null;// Small knee lifts relative to the locked stance; a deadband rejects tiny camera jitter.
 const kneeMotion=f.knee-b.knee,knee=kneeMotion>.035?1:kneeMotion<-.035?-1:0;if(knee&&knee!==s.lastKnee){s.lastJog=now;s.lastKnee=knee;}else if(Math.abs(kneeMotion)<.018)s.lastKnee=0;
 const rise=(b.y-f.y)/b.torso,feetRise=Math.min(b.leftFoot-f.leftFoot,b.rightFoot-f.rightFoot)/b.torso;const airborne=rise>.085&&feetRise>.065;
 // Wrist and hand landmarks accept a small wave; elbow movement is a fallback.
 // A held hand settles into a new rest position, so waves also work with arms raised.
 const swings=f.arms.map((joints,side)=>{
 const origin=s.waveOrigins[side]??=b.arms[side].map(p=>p?{...p}:null);
 const previous=s.wavePrevious[side];let movement=0,visible=0,score=0;
 joints.forEach((p,j)=>{if(!p)return;visible++;if(!origin[j])origin[j]={...p};const threshold=j===0?.14:.09;score=Math.max(score,Math.hypot(p.x-origin[j].x,p.y-origin[j].y)/threshold);if(previous?.[j])movement=Math.max(movement,Math.hypot(p.x-previous[j].x,p.y-previous[j].y));});
 s.wavePrevious[side]=joints.map(p=>p?{...p}:null);
 if(!visible){s.armArmed[side]=false;s.waveOrigins[side]=null;s.waveStillSince[side]=null;return false;}
 if(score<.4)s.armArmed[side]=true;
 if(movement<.025){s.waveStillSince[side]??=now;if(now-s.waveStillSince[side]>=160){s.waveOrigins[side]=joints.map(p=>p?{...p}:null);s.armArmed[side]=true;score=0;}}else s.waveStillSince[side]=null;
 const triggered=s.armArmed[side]&&score>1;if(score>1)s.armArmed[side]=false;return triggered;
 });
 if(s.armed&&airborne&&now-s.lastJump>300){events.push({id:i,kind:'jump'});s.armed=false;s.lastJump=now;s.lastJog=now;}
 else if(!airborne&&swings[0]!==swings[1]){events.push({id:i,kind:swings[0]?'left':'right'});s.lastHop=now;s.lastJog=now;}
 if(rise<.045&&feetRise<.045){if(s.groundSince===null)s.groundSince=now;if(now-s.groundSince>=90)s.armed=true;}else s.groundSince=null;
 players.push({id:i,tracked:true,locked:true,jogging:now-s.lastJog<850});}return {events,players,detected:players.filter(p=>p.tracked).length};}
}
