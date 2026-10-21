import {validQuestion} from './question-studio.js';
import {questionSets} from './question-sets.js';
const clone=value=>JSON.parse(JSON.stringify(value));
export function validSet(s){return !!s&&typeof s.id==='string'&&/^[\w-]{1,80}$/.test(s.id)&&typeof s.title==='string'&&s.title.trim().length>0&&s.title.length<=90&&typeof s.category==='string'&&s.category.trim().length>0&&s.category.length<=60&&Array.isArray(s.questions)&&s.questions.length<=300&&s.questions.every(validQuestion);}
export function normalizeSets(value){if(!Array.isArray(value))throw Error('Use an array of question sets.');if(value.length&&value.every(validQuestion)){if(value.length>300)throw Error('A set can contain up to 300 questions.');return [{id:'legacy-custom',title:'My question set',category:'Custom',questions:clone(value)}];}if(value.length>30||!value.every(validSet)||new Set(value.map(s=>s.id)).size!==value.length)throw Error('Check set titles, categories and questions.');return clone(value);}
export function parseSetImport(text){let raw=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');const data=JSON.parse(raw),questions=Array.isArray(data)?data:data.questions;if(!Array.isArray(questions)||!questions.length||questions.length>300||!questions.every(validQuestion))throw Error('Use 1–300 valid questions, each with three different choices and one correct answer.');const category=Array.isArray(data)?'':String(data.category??(data.year!==undefined?'Year '+data.year:''));return {title:Array.isArray(data)?'':String(data.title||''),category,questions:clone(questions)};}
export class SetLibrary{
 constructor(saved=[]){this.saved=normalizeSets(saved);this.draft=clone(this.saved);this.activeId=this.draft[0]?.id||null;}
 get active(){return this.draft.find(s=>s.id===this.activeId)||null;}
 get dirty(){return JSON.stringify(this.saved)!==JSON.stringify(this.draft);}
 select(id){if(!this.draft.some(s=>s.id===id))throw Error('Question set not found.');this.activeId=id;}
 create({title='New question set',category='Custom',questions=[]}={}){if(this.draft.length>=30)throw Error('A bank can contain up to 30 sets.');const set={id:crypto.randomUUID(),title,category,questions:clone(questions)};if(!validSet(set))throw Error('Check the new set title, category and questions.');this.draft.push(set);this.activeId=set.id;return set;}
 ensure(){return this.active||this.create();}
 replaceQuestions(questions){if(questions.length>300||!questions.every(validQuestion))throw Error('Check the questions before applying them.');this.ensure().questions=clone(questions);}
 deleteQuestions(indices){const remove=new Set(indices);this.ensure().questions=this.active.questions.filter((_,i)=>!remove.has(i));}
 removeSet(){const id=this.activeId;this.draft=this.draft.filter(s=>s.id!==id);this.activeId=this.draft[0]?.id||null;}
 proposal(){const data=normalizeSets(this.draft);if(JSON.stringify(data).length>950000)throw Error('This bank is too large. Export some sets before saving.');return data;}
 commit(proposal){const id=this.activeId;this.saved=normalizeSets(proposal);this.draft=clone(this.saved);this.activeId=this.draft.some(s=>s.id===id)?id:this.draft[0]?.id||null;}
 discard(){this.commit(this.saved);}
}
export function buildCatalog(packs,sets){const categories=Object.keys(packs).map(id=>({id,label:'Year '+id,sets:questionSets(packs[id]).map(s=>({...s,title:s.id==='all'?'Starter · All questions':'Starter · '+s.title}))}));for(const set of sets){let category=categories.find(c=>c.label.toLowerCase()===set.category.trim().toLowerCase());if(!category){category={id:'category:'+set.category,label:set.category,sets:[]};categories.push(category);}category.sets.push({id:'custom.'+set.id,title:set.title,detail:set.questions.length+' questions',questions:set.questions});}return categories;}
