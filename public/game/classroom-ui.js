import {translate} from './i18n.js';
export class ClassroomUI{
 constructor(store,{show,manage,error,manageRoster=()=>{},onChange=()=>{}}){this.store=store;this.show=show;this.manage=manage;this.manageRoster=manageRoster;this.error=error;this.onChange=onChange;this.editId=null;this.draft=null;this.buttons=[...document.querySelectorAll('.class-picker-button')];this.icon=[...this.buttons[0].childNodes].map(node=>node.cloneNode(true));this.buttons.forEach(button=>button.onclick=()=>{this.renderPicker();show('#class-picker-screen');});
  this.el('#class-form').onsubmit=event=>{event.preventDefault();try{store.save({name:this.el('#class-name').value,year:Number(this.el('#class-year').value)});this.reset();this.render();this.el('#class-status').textContent='Class saved.';}catch(error){this.error(error.message);}};
  this.el('#class-name').oninput=()=>{const match=this.el('#class-name').value.match(/^([1-6])/);if(match)this.el('#class-year').value=match[1];};
  this.el('#class-restore').onclick=()=>{try{store.restore();this.render();this.el('#class-status').textContent='Classes restored.';}catch(error){this.error(error.message);}};
  this.el('#manage-classes').onclick=()=>{show('#class-picker-screen',false);manage();};window.addEventListener('chase-language',()=>this.render());store.subscribe(()=>this.render());this.render();
 }
 el(selector){return document.querySelector(selector);}
 element(tag,text,className=''){const el=document.createElement(tag);el.textContent=text;el.className=className;return el;}
 button(text,onclick){const button=this.element('button',text,'secondary');button.type='button';button.onclick=onclick;return button;}
 reset(){this.el('#class-form').reset();}
 render(){
  const selected=this.store.selected;this.buttons.forEach(button=>{button.dataset.i18nSkip='';button.replaceChildren(...(selected?[this.element('span',selected.name)]:this.icon.map(node=>node.cloneNode(true))));button.ariaLabel=selected?translate('Selected class')+' '+selected.name+'. '+translate('Change class'):translate('Choose a class');button.classList.toggle('has-class',!!selected);});
  if(this.editId&&!this.store.active.some(row=>row.id===this.editId)){this.editId=null;this.draft=null;}
  this.el('#class-list').replaceChildren(...this.store.active.map(row=>this.renderRow(row)));
  if(!this.store.active.length)this.el('#class-list').append(this.element('p','No classes yet. Add your first class above.'));
  this.el('#class-restore').hidden=!this.store.records.some(row=>row.archived);if(!this.el('#class-picker-screen').hidden)this.renderPicker();this.onChange(selected);
 }
 renderRow(row){
  const editing=this.editId===row.id,item=this.element('div','','managed-class'),label=this.element('div','','class-label');
  if(editing){const name=this.element('input','');name.value=this.draft.name;name.maxLength=24;name.ariaLabel='Edit class name';name.oninput=()=>this.draft.name=name.value;const year=this.element('select','');year.ariaLabel='Edit class year';for(let n=1;n<=6;n++){const option=this.element('option','Year '+n);option.value=n;year.append(option);}year.value=this.draft.year;year.onchange=()=>this.draft.year=Number(year.value);label.append(name,year);}
  else{const name=this.element('strong',row.name);name.dataset.i18nSkip='';label.append(name,this.element('small','Year '+row.year));}
  const actions=this.element('div','','class-row-actions'),save=this.button(editing?'Save':'Edit',()=>{if(!editing){this.editId=row.id;this.draft={id:row.id,name:row.name,year:row.year};this.render();}else this.confirmSave(save);});save.classList.add('class-edit-button');
  if(editing){actions.append(this.button('Roster ('+(row.students?.length||0)+')',()=>this.manageRoster(row.id)),this.button('Delete',()=>{try{this.store.archive(row.id);this.el('#class-status').textContent='Class deleted. Use Restore removed classes to undo.';}catch(e){this.error(e.message);}}));}
  actions.append(save);item.append(label,actions);item.classList.toggle('editing',editing);return item;
 }
 confirmSave(button){
  this.confirmation?.remove();const pop=this.element('div','','class-save-confirm');pop.setAttribute('popover','auto');pop.setAttribute('role','dialog');pop.ariaLabel='Confirm class changes';pop.append(this.element('strong','Save these changes?'));
  const close=()=>{pop.hidePopover();pop.remove();button.focus();};
  pop.append(this.button('Confirm',()=>{try{const draft={...this.draft};this.store.save(draft);this.editId=null;this.draft=null;pop.remove();this.render();this.el('#class-status').textContent='Class saved.';}catch(e){this.error(e.message);close();}}),this.button('Cancel',close));button.parentElement.append(pop);this.confirmation=pop;pop.showPopover();const rect=button.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(window.innerWidth-pop.offsetWidth-8,rect.right-pop.offsetWidth))+'px';pop.style.top=Math.max(8,rect.top-pop.offsetHeight-10)+'px';
 }
 renderPicker(){const selected=this.store.selected,options=[{id:null,name:'No class selected'},...this.store.active];this.el('#class-picker-list').replaceChildren(...options.map(row=>{const button=this.button('',()=>{try{this.store.select(row.id);this.render();this.show('#class-picker-screen',false);}catch(error){this.error(error.message);}});button.setAttribute('role','radio');button.ariaChecked=String((selected?.id||null)===row.id);const name=this.element('strong',row.name);if(row.id)name.dataset.i18nSkip='';button.append(name);if(row.year)button.append(this.element('small','Year '+row.year));return button;}));}
}
