import {music} from './music.js';
const button=document.querySelector('#music-button');
function render(){document.querySelector('#music-volume-value').textContent=Math.round(music.volume*100)+'%';document.querySelector('#music-volume').value=music.volume*100;document.querySelector('#music-mute').textContent=music.muted?'Unmute music':'Mute music';document.querySelector('#music-mute').setAttribute('aria-pressed',String(music.muted));document.querySelector('#music-status').textContent=music.blocked?'Tap anywhere to start the music.':music.muted?'Music muted.':({menu:'Menu music',race:'Race music',ending:'Finish music'})[music.track];button.textContent=music.muted?'♩':'♪';button.setAttribute('aria-pressed',String(music.muted));button.setAttribute('aria-label',music.muted?'Unmute music':'Mute music');}
music.onchange=render;render();music.play();
window.addEventListener('pointerdown',()=>music.unlock(),{capture:true});window.addEventListener('keydown',()=>music.unlock(),{capture:true});
button.onclick=()=>music.toggleMute();
document.querySelector('#music-volume').oninput=e=>music.setVolume(Number(e.target.value)/100);
document.querySelector('#music-mute').onclick=()=>music.toggleMute();
document.addEventListener('visibilitychange',()=>document.hidden?music.suspend('hidden'):music.resume('hidden'));
