const KEY='chase-classrooms';
const copy=value=>JSON.parse(JSON.stringify(value));
export function validClassName(value){return typeof value==='string'&&value.trim().length>0&&value.trim().length<=24;}
export function classSnapshot(value){return value&&typeof value.id==='string'&&validClassName(value.name)&&Number.isInteger(value.year)&&value.year>=1&&value.year<=6?{id:value.id,name:value.name.trim(),year:value.year}:null;}
export class Classrooms{
 constructor(storage){this.storage=storage;this.records=[];this.selectedId=null;try{const data=JSON.parse(storage?.getItem(KEY)||'{}');if(Array.isArray(data.classes)&&data.classes.length<=120&&data.classes.every(row=>classSnapshot(row)&&typeof row.archived==='boolean')&&new Set(data.classes.map(row=>row.id)).size===data.classes.length){this.records=copy(data.classes);this.selectedId=data.selectedId||null;}}catch{}if(!this.active.some(row=>row.id===this.selectedId))this.selectedId=null;}
 get active(){return this.records.filter(row=>!row.archived).map(copy);}
 get selected(){return classSnapshot(this.records.find(row=>row.id===this.selectedId&&!row.archived));}
 commit(records,selectedId=this.selectedId){this.storage?.setItem(KEY,JSON.stringify({classes:records,selectedId}));this.records=records;this.selectedId=selectedId;}
 save({id=null,name,year}){if(!validClassName(name)||!Number.isInteger(Number(year))||Number(year)<1||Number(year)>6)throw Error('Enter a class name (up to 24 characters) and a Year from 1 to 6.');name=name.trim();year=Number(year);if(this.records.some(row=>row.id!==id&&row.year===year&&row.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('This class already exists.');if(!id&&this.records.length>=120)throw Error('You can keep up to 120 classes on this device.');if(id&&!this.records.some(row=>row.id===id&&!row.archived))throw Error('Class not found.');const row={id:id||crypto.randomUUID(),name,year,archived:false},records=id?this.records.map(old=>old.id===id?row:old):[...this.records,row];this.commit(records);return copy(row);}
 select(id){if(id!==null&&!this.active.some(row=>row.id===id))throw Error('Class not found.');this.commit(this.records,id);}
 archive(id){if(!this.active.some(row=>row.id===id))throw Error('Class not found.');this.commit(this.records.map(row=>row.id===id?{...row,archived:true}:row),this.selectedId===id?null:this.selectedId);}
 restore(){this.commit(this.records.map(row=>({...row,archived:false})));}
}
export function makeRaceHistory(settings,race,date=new Date().toISOString()){return {date,mode:settings.finish,time:race.time,classroom:classSnapshot(settings.classroom),players:[...race.players,...race.ai].sort((a,b)=>a.rank-b.rank).map(player=>({id:player.id,name:player.ai?'AI '+(player.id-3):'P'+(player.id+1),rank:player.rank,ai:!!player.ai,distance:Math.floor(player.distance),correct:player.correct??null}))};}
