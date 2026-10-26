export function impactKeys(race){return race.players.flatMap(p=>{const failed=race.questions?.some(q=>q.round===race.round&&q.player===p.id&&!q.correct);return p.caught?[`${p.id}:caught`]:(failed||race.phase==='feedback'&&['Wrong answer','Missed hurdle'].includes(p.lastResult))?[`${p.id}:hurdle:${race.round}`]:[];});}
export const IMPACT_URL=new URL('./audio/cartoon-rubber-duck-squeak.mp3',import.meta.url).href;
export const IMPACT_DURATION=.48;
