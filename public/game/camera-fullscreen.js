// Keep video, pose overlay, and the exit control together on browsers without element fullscreen.
export class CameraFullscreen{
 constructor(element,button,{document:doc=globalThis.document}={}){Object.assign(this,{element,button,doc});button.onclick=()=>this.toggle();doc.addEventListener('fullscreenchange',()=>this.render());doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.expanded)this.exit();});this.render();}
 get expanded(){return this.element.classList.contains('camera-expanded')||this.doc.fullscreenElement===this.element;}
 render(){const on=this.expanded;this.button.textContent=on?'Exit fullscreen':'Full-screen camera';this.button.ariaPressed=String(on);}
 async toggle(){if(this.expanded)return this.exit();try{if(this.element.requestFullscreen)await this.element.requestFullscreen();else throw Error('Use viewport mode');}catch{this.element.classList.add('camera-expanded');this.doc.body.classList.add('camera-viewport-expanded');}this.render();}
 async exit(){if(this.doc.fullscreenElement===this.element)try{await this.doc.exitFullscreen();}catch{}this.element.classList.remove('camera-expanded');this.doc.body.classList.remove('camera-viewport-expanded');this.render();}
}
