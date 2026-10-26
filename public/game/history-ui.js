const MODES={questions:'Question based',distance:'Distance based',time:'Time based',endless:'Endless'};
const el=(tag,text='',className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;return node;};
const distance=p=>Math.max(0,Number(p.distance)||0);
export function renderHistory(entries,{host,show,clock,playerLabel}){
 const label=(p,i)=>p.id!==undefined?playerLabel(p):p.ai?'AI '+(i+1):'P'+(i+1);
 const classLabel=entry=>{const node=el('span',entry.classroom?.name||'No class selected','history-class');if(entry.classroom?.name)node.dataset.i18nSkip='';return node;};
 const date=entry=>{const node=el('time',new Date(entry.date).toLocaleString());node.dateTime=entry.date;node.dataset.i18nSkip='';return node;};
 function openDetails(entry){
  const content=document.querySelector('#history-detail-content');content.replaceChildren(classLabel(entry),date(entry),el('p',MODES[entry.mode]||entry.mode),el('p',clock(entry.time),'history-duration'));
  const list=el('ol','','history-standings'),max=Math.max(1,...entry.players.map(distance));
  entry.players.forEach((p,i)=>{const row=el('li'),rank=el('strong',String(i+1)),body=el('div'),heading=el('div','','history-player-heading');heading.append(el('b',label(p,i)),el('span',distance(p)+'m'));const track=el('div','','history-distance-track'),bar=el('i');bar.style.width=100*distance(p)/max+'%';track.append(bar);body.append(heading,track);if(p.correct!==null&&p.correct!==undefined)body.append(el('small',p.correct+' correct'));row.append(rank,body);list.append(row);});content.append(list);show('#history-detail-screen');
 }
 host.replaceChildren(...entries.map(entry=>{
  const card=el('button','','history-race-card');card.type='button';card.append(classLabel(entry),date(entry));
  const summary=el('div','','history-race-summary');summary.append(el('span',MODES[entry.mode]||entry.mode),el('strong',clock(entry.time)));card.append(summary);
  const podium=el('div','','history-podium');podium.setAttribute('aria-label','Top finishers');
  const leaders=entry.players.slice(0,3),max=Math.max(1,...leaders.map(distance));
  leaders.forEach((p,i)=>{const lane=el('div','','history-podium-lane');lane.style.setProperty('--rank-height',`${Math.round(36+44*distance(p)/max-12*i)}px`);const block=el('div',String(i+1),'history-podium-block');lane.append(el('strong',label(p,i)),block,el('small',distance(p)+'m'));podium.append(lane);});card.append(podium,el('span','View race details','history-details-link'));card.onclick=()=>openDetails(entry);return card;
 }));
 if(!entries.length)host.append(el('p','Your first finish is waiting. Complete a race to set a result.','history-empty'));
}
