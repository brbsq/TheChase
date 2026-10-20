const prefix='sprint-pair/';const json=(value,status=200,extra={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...extra}});
const validID=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
async function read(store,key){const text=await store.get(key);if(!text)return null;try{return JSON.parse(text);}catch{return null;}}
export async function handlePair(request,store,now=Date.now()){
 const url=new URL(request.url),method=request.method;
 if(method==='GET'){
  const pin=url.searchParams.get('pin');
  if(pin!==null){
   const fingerprint=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'local';const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));const rateKey=prefix+'attempts/'+Array.from(new Uint8Array(hash)).map(v=>v.toString(16).padStart(2,'0')).join('');const attempts=await read(store,rateKey);if(attempts?.expires>now&&attempts.count>=10)return json({error:'Too many PIN attempts. Wait a minute, then try again.'},429,{'Retry-After':'60'});
   const lookup=/^\d{6}$/.test(pin)?await read(store,prefix+'pin/'+pin):null;const session=lookup?await read(store,prefix+lookup.id):null;
   if(!lookup||lookup.expires<=now||!session||session.expires<=now||session.answer){const count=attempts?.expires>now?attempts.count+1:1;await store.put(rateKey,JSON.stringify({count,expires:now+60000}));if(lookup?.expires<=now)await store.delete(prefix+'pin/'+pin);return json({error:'PIN not found or expired. Check the code on the game screen.'},404);}
   await store.delete(rateKey);return json({id:lookup.id});
  }
  const id=url.searchParams.get('id');if(!validID(id))return json({error:'Invalid pairing link.'},400);const data=await read(store,prefix+id);if(!data||data.expires<=now){if(data?.pin)await store.delete(prefix+'pin/'+data.pin);await store.delete(prefix+id);return json({error:'Pairing link expired. Create a new link.'},404);}return json(data);
 }
 if(!['POST','DELETE'].includes(method))return json({error:'Method not allowed'},405);
 const raw=await request.text();if(raw.length>100000)return json({error:'Pairing message too large.'},413);let data;try{data=JSON.parse(raw);}catch{return json({error:'Invalid JSON'},400);}if(!validID(data.id))return json({error:'Invalid pairing link.'},400);
 if(method==='DELETE'){const current=await read(store,prefix+data.id);if(current?.pin)await store.delete(prefix+'pin/'+current.pin);await store.delete(prefix+data.id);return json({ok:true});}
 if(data.offer?.type==='offer'&&typeof data.offer.sdp==='string'){
  let pin=null;for(let attempt=0;attempt<10;attempt++){const candidate=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');const entry=await read(store,prefix+'pin/'+candidate);if(!entry||entry.expires<=now){pin=candidate;break;}}if(!pin)return json({error:'Could not create a PIN. Try again.'},503);
  const previous=await read(store,prefix+data.id);if(previous?.pin)await store.delete(prefix+'pin/'+previous.pin);const expires=now+600000,pinExpires=now+300000;await store.put(prefix+data.id,JSON.stringify({offer:data.offer,players:Math.max(1,Math.min(4,Number(data.players)||1)),pin,expires}));await store.put(prefix+'pin/'+pin,JSON.stringify({id:data.id,expires:pinExpires}));return json({ok:true,pin,pinExpires});
 }
 if(data.answer?.type==='answer'&&typeof data.answer.sdp==='string'){const current=await read(store,prefix+data.id);if(!current||current.expires<=now||current.answer)return json({error:'Pairing link expired or already used.'},404);await store.put(prefix+data.id,JSON.stringify({...current,answer:data.answer}));if(current.pin)await store.delete(prefix+'pin/'+current.pin);return json({ok:true});}
 return json({error:'Invalid pairing message.'},400);
}
