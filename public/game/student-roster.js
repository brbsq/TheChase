export function normalizeRoster(value=[]){
 if(!Array.isArray(value)||value.length>100)throw Error('A class can have up to 100 students.');
 const seen=new Set();return value.map(row=>{if(!row||typeof row.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(row.id)||seen.has(row.id)||typeof row.name!=='string'||!row.name.trim()||row.name.trim().length>80)throw Error('Each student needs a name of 1–80 characters and a unique ID.');seen.add(row.id);return {id:row.id,name:row.name.trim()};});
}
export class StudentAssignments{
 constructor(store){this.store=store;this.ids=[null,null,null,null];this.classId=store.selected?.id??null;store.subscribe(({source})=>{const id=store.selected?.id??null;if(source==='account'||id!==this.classId)this.ids.fill(null);this.classId=id;const roster=this.roster;this.ids=this.ids.map(id=>roster.some(s=>s.id===id)?id:null);});}
 get roster(){return this.store.active.find(c=>c.id===this.store.selected?.id)?.students||[];}
 select(slot,id){if(!Number.isInteger(slot)||slot<0||slot>3)throw Error('Invalid player.');if(id!==null&&!this.roster.some(s=>s.id===id))throw Error('Student not found in this class.');if(id!==null&&this.ids.some((s,i)=>s===id&&i!==slot))throw Error('This student is already assigned to another player.');this.ids[slot]=id;}
 trim(count){for(let i=count;i<4;i++)this.ids[i]=null;}
 snapshot(count){return this.ids.slice(0,count).map(id=>{const row=this.roster.find(s=>s.id===id);return row?{...row}:null;});}
}
