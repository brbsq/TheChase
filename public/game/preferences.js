const KEY='chase-preferences';
export class Preferences {
 constructor(storage){this.storage=storage;let saved;try{saved=JSON.parse(storage?.getItem(KEY)||'{}');}catch{}this.value={shuffle:saved?.shuffle!==false,allMuted:saved?.allMuted===true,effects:saved?.effects!==false,builtInEnabled:saved?.builtInEnabled===true};}
 set(key,value){if(!Object.hasOwn(this.value,key))throw Error('Unknown preference');this.value[key]=!!value;try{this.storage?.setItem(KEY,JSON.stringify(this.value));}catch{}return this.value;}
 get effectsMuted(){return this.value.allMuted||!this.value.effects;}
}
export const preferences=new Preferences(typeof localStorage==='undefined'?null:localStorage);
