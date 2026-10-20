export function validQuestion(q){return !!q&&typeof q.prompt==='string'&&q.prompt.trim().length>0&&q.prompt.length<=150&&Array.isArray(q.options)&&q.options.length===3&&q.options.every(s=>typeof s==='string'&&s.trim()&&s.length<=55)&&new Set(q.options.map(s=>s.trim().toLowerCase())).size===3&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<3;}
export function parseDrafts(raw){
 if(raw.length>500000)throw Error('This response is too large. Generate at most 30 questions at a time.');
 const cleaned=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let data;try{data=JSON.parse(cleaned);}catch{throw Error('Paste the JSON array from the AI response, including its [ and ] brackets.');}
 if(!Array.isArray(data)||!data.length||data.length>30)throw Error('Use a JSON array of 1–30 questions.');
 if(!data.every(validQuestion))throw Error('Each question needs a short prompt, three different options, and correct set to 0, 1 or 2.');
 return data.map(q=>({prompt:q.prompt.trim(),options:q.options.map(s=>s.trim()),correct:q.correct}));
}
export function buildPrompt(year,count,topic){return `Create ${Math.max(1,Math.min(30,Number(count)||10))} multiple-choice English questions for Year ${['1','3','4'].includes(String(year))?year:'3'} pupils. Topic: ${String(topic).trim().slice(0,100)||'English vocabulary'}. Use age-appropriate, clear language. Each must have exactly three distinct short answers and exactly one unambiguous correct answer. Vary the correct answer position. Avoid trick questions, personal data, and claims of curriculum certification. Check every correct answer. Return ONLY a JSON array, without commentary, in this structure: [{"prompt":"Which word is an action?","options":["jump","blue","happy"],"correct":0}]. The correct field is a zero-based index (0=A, 1=B, 2=C). Prompt maximum 150 characters; each option maximum 55 characters. These are teacher-review drafts for a running quiz game.`;}
