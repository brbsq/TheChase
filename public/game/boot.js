import {startI18n} from './i18n.js';
import {music} from './music.js';
import {preferences} from './preferences.js';
import {ButtonSound} from './button-sound.js';
const clickSound=new ButtonSound({enabled:()=>!preferences.effectsMuted});
if(typeof location!=='undefined')clickSound.preload().catch(()=>{});
const $=s=>document.querySelector(s),button=$('#music-button');
const musicIsMuted=()=>preferences.value.allMuted||music.muted||music.volume===0;
const allIsMuted=()=>preferences.value.allMuted||(musicIsMuted()&&!preferences.value.effects);
function render(){
 const {allMuted,effects,shuffle}=preferences.value;
 $('#music-volume-value').textContent=Math.round(music.volume*100)+'%';$('#music-volume').value=music.volume*100;
 $('#music-mute').textContent=musicIsMuted()?'Unmute music only':'Mute music only';$('#music-mute').setAttribute('aria-pressed',String(musicIsMuted()));
 $('#all-audio-mute').textContent=allIsMuted()?'Unmute all audio':'Mute all audio';$('#all-audio-mute').ariaPressed=String(allIsMuted());
 $('#effects-toggle').checked=effects&&!allMuted;$('#shuffle-toggle').checked=shuffle;$('#race-shuffle-toggle').checked=shuffle;
 for(const id of ['shuffle-toggle','race-shuffle-toggle']){const hint=$('#'+id).closest('.shuffle-row')?.querySelector('small');if(hint)hint.textContent=shuffle?'Random order in each round.':'Follow the set sequence.';}
 $('#music-status').textContent=allIsMuted()?'All audio muted.':`${music.muted||music.volume===0?'Music muted':music.blocked?'Music waiting for a tap':'Music on'} · Sound effects ${effects?'on':'off'}.`;
 button.textContent=allMuted||music.muted?'♩':'♪';button.ariaPressed=String(musicIsMuted());button.ariaLabel=musicIsMuted()?'Unmute music':'Mute music';
}
function applyAudio(){if(preferences.effectsMuted)clickSound.stop();if(preferences.value.allMuted){music.suspend('all-muted');window.speechSynthesis?.cancel();}else music.resume('all-muted');window.dispatchEvent(new CustomEvent('chase-effects',{detail:preferences.effectsMuted}));render();}
music.onchange=render;applyAudio();
window.addEventListener('pointerdown',()=>music.unlock(),{capture:true});window.addEventListener('keydown',()=>music.unlock(),{capture:true});
function toggleMusicOnly(){if(preferences.value.allMuted){preferences.set('allMuted',false);preferences.set('effects',false);if(music.muted)music.toggleMute();if(music.volume===0)music.setVolume(.5);applyAudio();}else if(music.muted||music.volume===0){if(music.muted)music.toggleMute();if(music.volume===0)music.setVolume(.5);}else music.toggleMute();}
button.onclick=toggleMusicOnly;$('#music-volume').oninput=e=>music.setVolume(Number(e.target.value)/100);$('#music-mute').onclick=toggleMusicOnly;
$('#all-audio-mute').onclick=()=>{if(allIsMuted()){preferences.set('allMuted',false);preferences.set('effects',true);if(music.muted)music.toggleMute();if(music.volume===0)music.setVolume(.5);}else preferences.set('allMuted',true);applyAudio();};
$('#effects-toggle').onchange=e=>{const enabled=e.target.checked;if(enabled&&preferences.value.allMuted){if(!music.muted)music.toggleMute();preferences.set('allMuted',false);}preferences.set('effects',enabled);applyAudio();};
for(const id of ['shuffle-toggle','race-shuffle-toggle'])$('#'+id).onchange=e=>{preferences.set('shuffle',e.target.checked);render();};
const pointerFeedback=new WeakSet();
function feedback(){if(!preferences.effectsMuted)clickSound.play().catch(()=>{});}
document.addEventListener('pointerdown',event=>{const target=event.target.closest('#player-controls button');if(!target||target.disabled)return;pointerFeedback.add(target);feedback();},true);
// Delegation includes buttons created later by the editor, library, dialogs and race controls.
document.addEventListener('click',event=>{const target=event.target.closest('button,[role="button"],summary');if(!target||target.disabled)return;if(event.detail>0&&pointerFeedback.has(target)){pointerFeedback.delete(target);return;}feedback();});
// A change event covers clicking the switch, its label, and keyboard activation once.
document.addEventListener('change',event=>{if(event.target.matches('.toggle-row input[type="checkbox"],#effects-toggle')&&!event.target.disabled)feedback();});
document.addEventListener('visibilitychange',()=>document.hidden?music.suspend('hidden'):music.resume('hidden'));

startI18n();
