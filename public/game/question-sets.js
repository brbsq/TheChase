// Every set is one complete list; legacy subset IDs fall back to that list.
export function questionSets(bank){return [{id:'all',title:'Sample',detail:`${bank.length} questions`,questions:bank}];}
export function selectQuestions(bank,id='all'){return questionSets(bank).find(s=>s.id===id)?.questions||bank;}
