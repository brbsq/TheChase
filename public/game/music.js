export class BackgroundMusic {
 constructor(makeAudio){this.volume=.5;this.muted=false;this.track='menu';this.blocks=new Set();this.onchange=()=>{};this.tracks=Object.fromEntries(['menu','race','ending'].map(name=>{const a=makeAudio(new URL(`./music/${name}.mp3`,import.meta.url).href);a.loop=true;a.preload='metadata';a.volume=.5;return [name,a];}));this.blocked=false;this.revision=0;}
 async play(){if(this.blocks.size)return;const a=this.tracks[this.track],rev=this.revision;try{await a.play();if(a!==this.tracks[this.track]||this.blocks.size)a.pause();else if(rev===this.revision)this.blocked=false;}catch{if(rev===this.revision)this.blocked=true;}this.onchange();}
 setTrack(name){if(!this.tracks[name])return;if(this.track!==name){this.revision++;this.tracks[this.track].pause();this.track=name;this.tracks[name].currentTime=0;}this.play();this.onchange();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));for(const a of Object.values(this.tracks))a.volume=this.volume;this.onchange();}
 toggleMute(){this.muted=!this.muted;for(const a of Object.values(this.tracks))a.muted=this.muted;this.play();this.onchange();}
 suspend(reason){this.blocks.add(reason);this.revision++;Object.values(this.tracks).forEach(a=>a.pause());}
 resume(reason){this.blocks.delete(reason);this.play();}
 unlock(){if(!this.blocks.size&&(this.blocked||this.tracks[this.track].paused))this.play();}
}
export const music=typeof Audio==='function'?new BackgroundMusic(src=>new Audio(src)):null;
