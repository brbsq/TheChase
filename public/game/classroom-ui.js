import {translate} from './i18n.js';
export class ClassroomUI{
 constructor(store,{show,manage,error,onChange=()=>{}}){this.store=store;this.show=show;this.manage=manage;this.error=error;this.onChange=onChange;this.editId=null;this.buttons=[...document.querySelectorAll('.class-picker-button')];this.icon=[...this.buttons[0].childNodes].map(node=>node.cloneNode(true));this.buttons.forEach(button=>button.onclick=()=>{this.renderPicker();show('#class-picker-screen');});
  this.el('#class-form').onsubmit=event=>{event.preventDefault();try{store.save({id:this.editId,name:this.el('#class-name').value,year:Number(this.el('#class-year').value)});this.reset();this.render();this.el('#class-status').textContent='Class saved.';}catch(error){this.error(error.message);}};
  this.el('#class-name').oninput=()=>{const match=this.el('#class-name').value.match(/^([1-6])/);if(match)this.el('#class-year').value=match[1];};
  this.el('#class-cancel').onclick=()=>this.reset();this.el('#class-restore').onclick=()=>{try{store.restore();this.render();this.el('#class-status').textContent='Classes restored.';}catch(error){this.error(error.message);}};
  this.el('#manage-classes').onclick=()=>{show('#class-picker-screen',false);manage();};window.addEventListener('chase-language',()=>this.render());this.render();
 }
 el(selector){return document.querySelector(selector);}
 element(tag,text,className=''){const el=document.createElement(tag);el.textContent=text;el.className=className;return el;}
 button(text,onclick){const button=this.element('button',text,'secondary');button.type='button';button.onclick=onclick;return button;}
 reset(){this.editId=null;this.el('#class-form').reset();this.el('#class-cancel').hidden=true;this.el('#class-save').textContent='Add class';}
 render(){
  const selected=this.store.selected;this.buttons.forEach(button=>{button.dataset.i18nSkip='';button.replaceChildren(...(selected?[this.element('span',selected.name)]:this.icon.map(node=>node.cloneNode(true))));button.ariaLabel=selected?translate('Selected class')+' '+selected.name+'. '+translate('Change class'):translate('Choose a class');button.classList.toggle('has-class',!!selected);});
  this.el('#class-list').replaceChildren(...this.store.active.map(row=>{const item=this.element('div','','managed-class');const label=this.element('div','','class-label'),name=this.element('strong',row.name);name.dataset.i18nSkip='';label.append(name,this.element('small','Year '+row.year));const edit=this.button('Edit',()=>{this.editId=row.id;this.el('#class-name').value=row.name;this.el('#class-year').value=row.year;this.el('#class-save').textContent='Save class';this.el('#class-cancel').hidden=false;this.el('#class-name').focus();});const remove=this.button('Remove',()=>{try{this.store.archive(row.id);if(this.editId===row.id)this.reset();this.render();}catch(error){this.error(error.message);}});item.append(label,edit,remove);return item;}));
  if(!this.store.active.length)this.el('#class-list').append(this.element('p','No classes yet. Add your first class above.'));
  this.el('#class-restore').hidden=!this.store.records.some(row=>row.archived);if(!this.el('#class-picker-screen').hidden)this.renderPicker();this.onChange(selected);
 }
 renderPicker(){const selected=this.store.selected,options=[{id:null,name:'No class selected'},...this.store.active];this.el('#class-picker-list').replaceChildren(...options.map(row=>{const button=this.button('',()=>{try{this.store.select(row.id);this.render();this.show('#class-picker-screen',false);}catch(error){this.error(error.message);}});button.setAttribute('role','radio');button.ariaChecked=String((selected?.id||null)===row.id);const name=this.element('strong',row.name);if(row.id)name.dataset.i18nSkip='';button.append(name);if(row.year)button.append(this.element('small','Year '+row.year));return button;}));}
}
