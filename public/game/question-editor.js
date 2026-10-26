import {attachQuestionDrag} from './editor-drag.js';
// A focused question workspace; changes stay in the existing draft batch.
export class QuestionEditor {
 constructor(host,actions){this.host=host;this.actions=actions;this.index=0;this.setId=null;}
 render(set,selected){this.cleanupDrag?.();
  if(this.setId!==set?.id){this.index=0;this.setId=set?.id;this.nextRailScroll=0;}
  this.index=Math.max(0,Math.min(this.index,(set?.questions.length||1)-1));
  this.host.replaceChildren();
  const layout=this.element('div','question-editor'),rail=this.element('aside','question-rail');rail.ariaLabel='Questions';
  const heading=this.element('h3');heading.textContent='Your questions';
  const details=this.button('Set details ↑',()=>this.actions.details());details.classList.add('editor-details-button');
  const dragHint=this.element('small','reorder-hint');dragHint.append(document.createTextNode('Drag to reorder · or'),document.createElement('br'),document.createTextNode('use Move up / down'));
  rail.append(heading,details,dragHint);
  (set?.questions||[]).forEach((q,index)=>{
   const item=this.element('div','question-thumbnail'+(index===this.index?' active':''));item.draggable=true;item.dataset.index=index;
   const check=this.element('input');check.type='checkbox';check.checked=selected.has(index);check.ariaLabel='Select question '+(index+1);check.onchange=()=>this.actions.select(index,check.checked);
   const choose=this.button((index+1)+'. '+(q.prompt||'Untitled question'),()=>{this.index=index;this.actions.navigate();});choose.dataset.i18nSkip='';choose.setAttribute('aria-current',String(index===this.index));
   item.append(check,choose);rail.append(item);
  });
  this.cleanupDrag=attachQuestionDrag(rail,(from,to,scroll)=>{this.nextRailScroll=scroll;this.actions.reorder(from,to);});if(this.nextRailScroll!==undefined){rail.scrollTop=this.nextRailScroll;requestAnimationFrame(()=>rail.scrollTop=this.nextRailScroll);}
  const work=this.element('section','question-canvas');
  const add=this.button('New question',()=>this.actions.add());add.classList.add('new-question-button');
  if(!set?.questions.length){
   const empty=this.element('div','editor-empty'),title=this.element('h3'),hint=this.element('p');title.textContent='A great quiz starts with one question.';hint.textContent='Write a question, add three answers and choose the correct one.';empty.append(title,hint,add);work.append(empty);
  }else{
   const q=set.questions[this.index],tools=this.element('div','question-tools'),position=this.element('strong');position.textContent='Question '+(this.index+1)+' of '+set.questions.length;
   tools.append(position,add,this.button('↑ Move up',()=>this.actions.move(this.index,-1),this.index===0),this.button('↓ Move down',()=>this.actions.move(this.index,1),this.index===set.questions.length-1),this.button('Duplicate',()=>this.actions.duplicate(this.index)),this.button('Delete',()=>this.actions.remove(this.index)));work.append(tools);
   const question=this.field('Question',q.prompt,150,value=>{this.actions.update(this.index,{prompt:value});rail.querySelectorAll('.question-thumbnail button')[this.index].textContent=(this.index+1)+'. '+(value||'Untitled question');},'Write your question here…');question.classList.add('editor-question');
   // A content-height textarea is centered inside a fixed question box, including wrapped lines.
   const prompt=question.querySelector('textarea'),shell=this.element('div','question-input-shell');prompt.rows=1;question.append(shell);shell.append(prompt);
   const sizePrompt=()=>{prompt.style.height='0px';prompt.style.height=Math.min(prompt.scrollHeight,100)+'px';};prompt.addEventListener('input',sizePrompt);requestAnimationFrame(sizePrompt);
   const instructions=this.element('p','editor-answer-hint');instructions.textContent='Write three choices. Tick the correct answer.';
   const answers=this.element('div','editor-answer-grid');
   q.options.forEach((answer,i)=>{
    const card=this.element('div','editor-answer answer-'+i),mark=this.element('span','answer-shape');mark.textContent='ABC'[i];mark.ariaHidden='true';
    const field=this.field('Answer '+'ABC'[i],answer,55,value=>this.actions.updateAnswer(this.index,i,value),'Type an answer…');field.classList.add('answer-field');field.querySelector('span').className='sr-only';
    const correct=this.button(i===q.correct?'✓':'○',()=>{this.actions.update(this.index,{correct:i});[...answers.querySelectorAll('.correct-choice')].forEach((b,n)=>{b.ariaPressed=String(n===i);b.textContent=n===i?'✓':'○';});});correct.className='correct-choice';correct.ariaPressed=String(i===q.correct);correct.ariaLabel='Mark answer '+'ABC'[i]+' as correct';
    card.append(mark,field,correct);answers.append(card);
   });
   work.append(question,instructions,answers,this.field('Simple explanation (optional)',q.explanation||'',400,value=>this.actions.update(this.index,{explanation:value}),'Explain why this answer is correct…'));
  }
  layout.append(rail,work);this.host.append(layout);
 }
 element(tag,className=''){const el=document.createElement(tag);el.className=className;return el;}
 field(text,value,max,oninput,placeholder){const label=this.element('label'),caption=this.element('span');caption.textContent=text;const input=this.element('textarea');input.value=value;input.maxLength=max;input.rows=1;input.placeholder=placeholder;input.oninput=()=>oninput(input.value);label.append(caption,input);return label;}
 button(text,onclick,disabled=false){const button=this.element('button','secondary');button.type='button';button.textContent=text;button.onclick=()=>{try{onclick();}catch(error){this.actions.error(error);}};button.disabled=disabled;return button;}
}
