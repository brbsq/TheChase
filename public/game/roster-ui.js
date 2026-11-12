const el=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
export class RosterUI{
 constructor(store,assignments,{changed,error}){Object.assign(this,{store,assignments,changed,error});this.dialog=el('dialog','','roster-dialog glass');this.dialog.ariaLabel='Student roster';document.body.append(this.dialog);this.dialog.addEventListener('click',e=>{if(e.target===this.dialog){const r=this.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.dialog.close();}});store.subscribe(()=>{if(this.dialog.open)this.dialog.close();changed();});}
 button(text,action,style='secondary'){const b=el('button',text,style);b.type='button';b.onclick=action;return b;}
 open(title){this.dialog.replaceChildren();const heading=el('h2',title);heading.dataset.i18nSkip='';this.dialog.append(this.button('×',()=>this.dialog.close(),'close-dialog'),heading);if(!this.dialog.open)this.dialog.showModal();}
 tap(slot,event){const now=performance.now(),twice=this.lastTap?.slot===slot&&now-this.lastTap.at<450;this.lastTap={slot,at:now};if(twice||event.detail===0){this.lastTap=null;this.pick(slot);}}
 pick(slot){const classroom=this.store.selected;this.open('Choose student · P'+(slot+1));if(!classroom){this.dialog.append(el('p','Choose a class first using the classroom button.'));return;}
 this.dialog.append(el('p',classroom.name+' · Unassigned results count for the whole class.'));
 const list=el('div','','roster-options');list.setAttribute('role','group');list.ariaLabel='Students';
 const choose=(id)=>{try{this.assignments.select(slot,id);this.dialog.close();this.changed();}catch(e){this.error(e.message);}};
 const option=(name,id)=>{const b=this.button(name,()=>choose(id));b.dataset.i18nSkip='';b.ariaPressed=String(this.assignments.ids[slot]===id);const other=id!==null?this.assignments.ids.findIndex((v,i)=>v===id&&i!==slot):-1;if(other>=0){b.disabled=true;b.textContent+=' · P'+(other+1);}return b;};
 list.append(option('Entire class — no student',null),...this.assignments.roster.map(s=>option(s.name,s.id)));this.dialog.append(list);if(!this.assignments.roster.length)this.dialog.append(el('p','No students yet. Add them in Settings → My Classes → Roster.'));
 }
 manage(id){const classroom=this.store.active.find(c=>c.id===id);if(!classroom)return;this.open(classroom.name+' · Student roster');this.dialog.append(el('p','Edit names below. Add new students one per line. Removing a student keeps their past results.'));
 const rows=el('div','','roster-edit-list');const drafts=(classroom.students||[]).map(s=>({...s}));
 const render=()=>{rows.replaceChildren(...drafts.map((s,i)=>{const row=el('div','','roster-edit-row'),input=el('input');input.value=s.name;input.maxLength=80;input.ariaLabel='Student '+(i+1)+' name';input.oninput=()=>s.name=input.value;row.append(input,this.button('Remove',()=>{drafts.splice(i,1);render();}));return row;}));};render();
 const label=el('label','Add students (one per line)'),names=el('textarea');names.rows=4;names.maxLength=8100;names.ariaLabel='Add students, one per line';label.append(names);const status=el('p','','roster-status');status.setAttribute('role','status');
 this.dialog.append(rows,label,status,this.button('Save roster',()=>{try{const added=names.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(name=>({id:crypto.randomUUID(),name}));this.store.saveRoster(id,[...drafts,...added]);this.dialog.close();}catch(e){status.textContent=e.message;}},'primary'));
 }
}
