import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';
export const ATHLETE_IDS=['green','blue','coral','rose','sky','sunshine'];
export const REQUIRED_CLIPS=['run','walk','stop','jump','collision','fall','cheer','sob'];
export function animationIntent(p,race,total){
 if(race.finished)return {name:p.rank===total&&total>1?'sob':'cheer',token:'finish'};
 if(p.caught)return {name:'fall',token:'caught'};
 if(!p.ai&&(p.recovery>0||(race.phase==='feedback'&&['Wrong answer','Missed hurdle'].includes(p.lastResult))))return {name:'fall',token:'impact-'+race.round,duration:2.4};
 if(p.jump>0)return {name:'jump',token:'jump-'+race.round+'-'+p.jumpSerial,duration:.78};
 if(p.hop>0)return {name:'jump',token:'hop-'+race.round+'-'+p.hopSerial,duration:.42};
 if(p.ai&&race.phase==='approach'&&race.actionDuration-race.phaseTime<.65)return {name:'jump',token:'ai-'+race.round,duration:.78};
 return {name:race.phase==='countdown'||!(p.jogging||p.ai)?'stop':'run',token:'locomotion'};
}
export function higherJump(clip){if(clip.name!=='jump')return clip;const raised=clip.clone();const root=raised.tracks.find(t=>t.name==='Motion.position');if(root){const base=root.values[1];for(let i=1;i<root.values.length;i+=3)root.values[i]=base+(root.values[i]-base)*1.65;}return raised;}
export class AthleteLibrary {
 constructor(){this.assets=[];this.portraits=[];}
 async load(onProgress=()=>{}){const loader=new GLTFLoader();let completed=0;this.assets=await Promise.all(ATHLETE_IDS.map(async id=>{const gltf=await loader.loadAsync(new URL(`./models/${id}.glb`,import.meta.url).href);for(const name of REQUIRED_CLIPS)if(!gltf.animations.some(a=>a.name===name))throw Error('A character animation is missing. Reload the game.');onProgress(++completed,ATHLETE_IDS.length);return gltf;}));}
 create(index){const source=this.assets[index]||this.assets[0];if(!source)throw Error('Characters are still loading.');const model=clone(source.scene);model.scale.setScalar(.84);const mixer=new T.AnimationMixer(model),actions=Object.fromEntries(source.animations.map(clip=>[clip.name,mixer.clipAction(higherJump(clip))]));let active=null,key='',locked=false;
 const actor={model,mixer,actions,play(intent){const nextKey=intent.name+':'+intent.token;if(nextKey===key)return;if(locked&&active?.isRunning()&&['run','stop'].includes(intent.name))return;const next=actions[intent.name];if(!next)return;const old=active;key=nextKey;const loop=['run','walk','cheer','sob'].includes(intent.name);locked=!loop&&intent.name!=='stop';next.reset();next.setLoop(loop?T.LoopRepeat:T.LoopOnce,loop?Infinity:1);next.clampWhenFinished=!loop;next.setEffectiveTimeScale(intent.duration?next.getClip().duration/intent.duration:1);next.setEffectiveWeight(1);next.play();if(old&&old!==next){const fade=intent.name==='jump'?.025:.12;old.fadeOut(fade);next.fadeIn(fade);}if(intent.name==='jump')mixer.update(.08);active=next;},update(dt){mixer.update(dt);},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);model.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});}};
 actor.play({name:'stop',token:'initial'});mixer.update(actions.stop.getClip().duration);return actor;}
 makePortraits(raceRenderer){const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.outputColorSpace=raceRenderer.outputColorSpace;renderer.toneMapping=raceRenderer.toneMapping;renderer.toneMappingExposure=raceRenderer.toneMappingExposure;renderer.setClearColor(0x000000,0);const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x6581a0,2.3));const key=new T.DirectionalLight(0xffffff,2.7);key.position.set(3,6,7);scene.add(key);const cam=new T.PerspectiveCamera(31,1,.1,30);cam.position.set(0,1.55,5.7);cam.lookAt(0,1.3,0);renderer.setPixelRatio(1);renderer.setSize(240,240,false);renderer.setScissorTest(false);renderer.setViewport(0,0,240,240);this.portraits=this.assets.map((_,i)=>{const actor=this.create(i);scene.add(actor.model);renderer.render(scene,cam);const src=renderer.domElement.toDataURL('image/png');scene.remove(actor.model);actor.dispose();return src;});renderer.dispose();return this.portraits;}
}
