import test from 'node:test';import assert from 'node:assert/strict';
// Exercise the actual handlers, including synchronous music onchange renders.
const store=new Map([['chase-language','zh'],['chase-preferences',JSON.stringify({allMuted:true,effects:true})]]);
globalThis.localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)};
const documentEvents=new Map();const elements=new Map();function element(tag='DIV'){return {tagName:tag,nodeType:1,childNodes:[],attributes:new Map(),closest:()=>null,getAttribute(name){return this.attributes.get(name)??null;},setAttribute(name,value){this.attributes.set(name,value);},hasAttribute(name){return this.attributes.has(name);}};}
globalThis.document={body:element('BODY'),documentElement:{lang:'en'},hidden:false,querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);},addEventListener(type,handler){documentEvents.set(type,handler);}};
const shuffleHints=new Map();for(const id of ['shuffle-toggle','race-shuffle-toggle']){const hint={textContent:''},toggle=element('INPUT');toggle.closest=()=>({querySelector:()=>hint});elements.set('#'+id,toggle);shuffleHints.set(id,hint);}
globalThis.window={addEventListener(){},dispatchEvent(){},speechSynthesis:{cancel(){}}};
globalThis.MutationObserver=class{observe(){}};
globalThis.Audio=class{constructor(){this.paused=true;}async play(){this.paused=false;}pause(){this.paused=true;}};
await import('../public/game/boot.js');const {music}=await import('../public/game/music.js');const {preferences}=await import('../public/game/preferences.js');
test('enabling effects from master mute survives a synchronous music render and updates both buttons',()=>{
 const effects=elements.get('#effects-toggle'),all=elements.get('#all-audio-mute'),only=elements.get('#music-mute');
 assert.equal(music.muted,false);assert.equal(preferences.value.allMuted,true);assert.equal(effects.checked,false);
 effects.checked=true;effects.onchange({target:effects});
 assert.equal(effects.checked,true);assert.equal(preferences.value.effects,true);assert.equal(preferences.value.allMuted,false);assert.equal(music.muted,true);assert.equal(all.textContent,'Mute all audio');assert.equal(only.textContent,'Unmute music only');
 all.onclick();assert.equal(effects.checked,false);assert.equal(all.textContent,'Unmute all audio');
 only.onclick();assert.equal(preferences.value.allMuted,false);assert.equal(effects.checked,false);assert.equal(music.muted,false);assert.equal(only.textContent,'Mute music only');
 only.onclick();assert.equal(music.muted,true);assert.equal(all.textContent,'Unmute all audio');
 all.onclick();assert.equal(music.muted,false);assert.equal(effects.checked,true);assert.equal(all.textContent,'Mute all audio');
});

test('each visit starts in English even when an older visit saved another language',()=>{assert.equal(document.documentElement.lang,'en');assert.equal(elements.get('#language-select').value,'en');});

test('shuffle descriptions and both controls follow the same saved state',()=>{
 const setup=elements.get('#race-shuffle-toggle');setup.onchange({target:{checked:false}});for(const id of ['shuffle-toggle','race-shuffle-toggle']){assert.equal(elements.get('#'+id).checked,false);assert.equal(shuffleHints.get(id).textContent,'Follow the set sequence.');}
 const settings=elements.get('#shuffle-toggle');settings.onchange({target:{checked:true}});for(const id of ['shuffle-toggle','race-shuffle-toggle']){assert.equal(elements.get('#'+id).checked,true);assert.equal(shuffleHints.get(id).textContent,'Random order in each round.');}
});


test('toggle changes play one shared click sound and respect effects and master mute',async()=>{
 const {ButtonSound}=await import('../public/game/button-sound.js');const original=ButtonSound.prototype.play;let plays=0;
 ButtonSound.prototype.play=async()=>{plays++;};
 try{
  const change=documentEvents.get('change'),toggle={matches:selector=>selector.includes('.toggle-row'),disabled:false};
  preferences.set('allMuted',false);preferences.set('effects',true);
  change({target:toggle});assert.equal(plays,1);
  change({target:toggle});assert.equal(plays,2);
  preferences.set('effects',false);change({target:toggle});assert.equal(plays,2);
  preferences.set('effects',true);preferences.set('allMuted',true);change({target:toggle});assert.equal(plays,2);
  preferences.set('allMuted',false);toggle.disabled=true;change({target:toggle});assert.equal(plays,2);
  change({target:{matches:()=>false,disabled:false}});assert.equal(plays,2);
 }finally{ButtonSound.prototype.play=original;preferences.set('allMuted',false);preferences.set('effects',true);}
});
