import {translate} from './i18n.js';
export class BankConflicts{
 constructor(root,{resolve,show}){Object.assign(this,{root,resolve,show});root.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const buttons=[...root.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);if(!buttons.length)return;if(event.shiftKey&&(index<=0)){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&(index===buttons.length-1||index<0)){event.preventDefault();buttons[0].focus();}});}
 close(){this.show(false);const review=document.querySelector('#bank-review-conflicts'),previous=this.previousFocus;const target=review&&!review.hidden?review:previous?.isConnected&&previous.matches('button:not(:disabled),a[href],input,select,textarea,[tabindex]')&&previous.getClientRects().length?previous:document.querySelector('#bank-sync-state');if(target){if(target.tagName==='P')target.tabIndex=-1;target.focus();}}
 render(conflicts){
  const key=JSON.stringify(conflicts);if(key===this.key)return;this.key=key;const host=this.root.querySelector('[data-conflicts]');host.replaceChildren();
  for(const conflict of conflicts){
   const card=document.createElement('article');card.className='bank-conflict';
   const title=document.createElement('h3');title.dataset.i18nSkip='';title.textContent=conflict.local?.title||conflict.cloud?.title||'Deleted question set';card.append(title);
   const versions=document.createElement('div');versions.className='bank-conflict-versions';
   for(const [label,set]of [['This device',conflict.local],['Cloud version',conflict.cloud]]){
    const panel=document.createElement('section'),heading=document.createElement('h4');heading.textContent=translate(label);panel.append(heading);
    const metadata=document.createElement('p');metadata.dataset.i18nSkip='';metadata.textContent=!set||set.deleted?'This version deletes the set.':set.title+' · '+set.category+' · '+(set.subject||'english')+' · '+set.questions.length+' questions';panel.append(metadata);
    if(set&&!set.deleted){const list=document.createElement('ol');for(const question of set.questions){const item=document.createElement('li'),prompt=document.createElement('strong'),answers=document.createElement('p');prompt.textContent=question.prompt;answers.textContent=question.options.map((text,i)=>(i===question.correct?'✓ ':'')+'ABC'[i]+': '+text).join(' · ');item.append(prompt,answers);if(question.explanation){const why=document.createElement('p');why.textContent=question.explanation;item.append(why);}list.append(item);}list.dataset.i18nSkip='';panel.append(list);}versions.append(panel);
   }
   card.append(versions);const actions=document.createElement('div');actions.className='dialog-actions';
   for(const [choice,label]of [['local','Use this device'],['cloud','Use cloud version'],['both','Keep both']]){const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent=translate(label);button.onclick=async()=>{button.disabled=true;try{await this.resolve(conflict.id,choice);}finally{button.disabled=false;}};actions.append(button);}card.append(actions);host.append(card);
  }
  if(!conflicts.length&&!this.root.hidden)this.close();
 }
 open(conflicts){if(this.root.hidden)this.previousFocus=document.activeElement;this.render(conflicts);if(conflicts.length){this.show(true);const heading=this.root.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();}}}
}
