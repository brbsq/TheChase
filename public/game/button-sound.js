export const BUTTON_CLICK_URL=new URL('./audio/mixkit-single-key-type-2533.wav',import.meta.url).href;
export function playButtonClick(context,buffer){const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();return source;}
export class ButtonSound{
 constructor({createContext=()=>new(window.AudioContext||window.webkitAudioContext)(),fetchBytes=async()=>{const response=await fetch(BUTTON_CLICK_URL);if(!response.ok)throw Error('Button sound could not load.');return response.arrayBuffer();},enabled=()=>true}={}){this.createContext=createContext;this.fetchBytes=fetchBytes;this.enabled=enabled;this.active=new Set();}
 preload(){return this.bytes??=Promise.resolve().then(this.fetchBytes).catch(error=>{this.bytes=null;throw error;});}
 async play(){if(!this.enabled())return;this.context??=this.createContext();await this.context.resume();const context=this.context;let buffer;try{buffer=await(this.decoded??=this.preload().then(bytes=>context.decodeAudioData(bytes.slice(0))).catch(error=>{this.decoded=null;throw error;}));}catch{return;}if(!this.enabled())return;const source=playButtonClick(context,buffer);this.active.add(source);source.onended=()=>this.active.delete(source);return source;}
 stop(){for(const source of this.active){try{source.stop();}catch{}}this.active.clear();}
}
