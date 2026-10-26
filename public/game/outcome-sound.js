import {IMPACT_URL,IMPACT_DURATION} from './impact-sound.js';
export const CROWD_URLS={cheer:new URL('./audio/crowd-cheer.mp3',import.meta.url).href,aww:new URL('./audio/crowd-aww.mp3',import.meta.url).href};
const ASSET_URLS={...CROWD_URLS,impact:IMPACT_URL};
// One reaction per outcome type, rather than stacking a crowd for every player.
export function crowdReactions(race){
 const recorded=race.questions?.filter(q=>q.round===race.round);
 const outcomes=recorded?.length?recorded.map(q=>q.correct):race.players.filter(p=>!p.caught).map(p=>!!p.hurdleJump&&p.jumpLane===race.question.correct);
 const good=outcomes.includes(true),bad=outcomes.includes(false);
 return [...(good?[{kind:'cheer',delay:0}]:[]),...(bad?[{kind:'aww',delay:good?1.7:IMPACT_DURATION+.08}]:[])];
}
export class OutcomeSound{
 constructor({enabled=()=>true,createContext=()=>new(window.AudioContext||window.webkitAudioContext)(),fetchBytes=async kind=>{const response=await fetch(ASSET_URLS[kind]);if(!response.ok)throw Error('Crowd sound could not load.');return response.arrayBuffer();}}={}){this.enabled=enabled;this.createContext=createContext;this.fetchBytes=fetchBytes;this.bytes={};this.buffers={};this.active=new Set();this.generation=0;}
 preload(){return Promise.all(Object.keys(ASSET_URLS).map(kind=>this.bytes[kind]??=this.fetchBytes(kind).catch(error=>{delete this.bytes[kind];throw error;})));}
 async prepare(){if(!this.enabled())return;this.context??=this.createContext();await this.context.resume();await this.preload();await Promise.all(Object.keys(ASSET_URLS).map(kind=>this.decode(kind)));}
 decode(kind){return this.buffers[kind]??=Promise.resolve(this.bytes[kind]??=this.fetchBytes(kind)).then(bytes=>this.context.decodeAudioData(bytes.slice(0))).catch(error=>{delete this.bytes[kind];delete this.buffers[kind];throw error;});}
 react(race){return this.play(crowdReactions(race));}
 impact(){return this.play([{kind:'impact',delay:0}]);}
 async play(reactions){
  const generation=this.generation;if(!this.enabled()||!reactions.length)return;
  try{await this.prepare();if(generation!==this.generation||!this.enabled())return;const start=this.context.currentTime;
   for(const {kind,delay} of reactions){const source=this.context.createBufferSource();source.buffer=await this.decode(kind);if(generation!==this.generation||!this.enabled())return;source.connect(this.context.destination);this.active.add(source);source.onended=()=>this.active.delete(source);source.start(start+delay);}
  }catch{/* Audio loading must never interrupt the race. */}
 }
 stop(){this.generation++;for(const source of this.active){try{source.stop();}catch{}}this.active.clear();}
}
