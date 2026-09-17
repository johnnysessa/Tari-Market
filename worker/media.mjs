const ITEM_CONDITIONS=["New", "Like New", "Open Box", "Refurbished", "Used", "For Parts or Not Working", "Other"];
const OWNER='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828';
const MARKETS={component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938:'ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a',component_1bf64f1ee50461e47dba27d7b24326f356f30121f10c16a60eb91c2ced275a9c:'b10f1ab4c4902241f3e4592b1719ac8059aece55011a4e6f580c61f28ecfb7c2'};
const ORIGINS=new Set(['https://xtm-market.johnnytsunami14.chatgpt.site','http://localhost:5180','http://127.0.0.1:5180']);
const enc=new TextEncoder(),dec=new TextDecoder();
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const b64=bytes=>{let s='';for(const v of new Uint8Array(bytes))s+=String.fromCharCode(v);return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
const hash=async v=>hex(await crypto.subtle.digest('SHA-256',v));
function decode(v){if(!v||typeof v!=='object')return v;if(v['@cbor']==='bytes')return v.hex;if(v['@cbor']==='tag')return decode(v.value);if(v['@cbor']==='map')return Object.fromEntries(v.entries.map(([k,v])=>[String(decode(k)),decode(v)]));if(Array.isArray(v))return v.map(decode);return v;}
function listingKey(market,id){if(!MARKETS[market]||!Number.isSafeInteger(id)||id<1)fail('Invalid listing.');return `listings/${market}/${id}.json`;}
async function chainListing(market,id,fetcher){
 listingKey(market,id);
 const r=await fetcher('https://ootle-indexer-a.tari.com/substates/'+market+'?local_search_only=false',{signal:AbortSignal.timeout(15000)});
 if(!r.ok)fail('The listing could not be verified. Try again.',503);
 const p=await r.json(),c=p.substate?.Component,s=decode(c?.body?.state);
 if(p.verified!==true||c?.header?.template_address!==MARKETS[market]||c.header.owner_rule!=='None'||!Array.isArray(s)||s.length!==15||s[10]!==OWNER)fail('Marketplace identity could not be verified.',503);
 const row=s[3]?.[String(id)];if(!Array.isArray(row)||row[0]!==id||row[9]!==true)fail('Listing is not active.',404);
 let jwk;try{jwk=JSON.parse(row[7]);}catch{fail('Listing has no valid photo authorization key.',409)}
 if(jwk.kty!=='RSA'||jwk.d||typeof jwk.n!=='string'||typeof jwk.e!=='string'||jwk.n.length<342||jwk.n.length>700)fail('Listing has no valid photo authorization key.',409);
 return jwk;
}
async function body(request,max){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Expected JSON.',415);
 if(Number(request.headers.get('content-length')||0)>max)fail('Upload is too large.',413);
 const reader=request.body?.getReader();if(!reader)fail('Missing request body.');let size=0,chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail('Upload is too large.',413)}chunks.push(value)}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length}try{return JSON.parse(dec.decode(all))}catch{fail('Invalid JSON.')}
}
async function hmacKey(secret){if(typeof secret!=='string'||secret.length<40)fail('Photo sharing is temporarily unavailable.',503);return crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
function canonical(data){
 if(!data||!Array.isArray(data.images)||data.images.length>8||typeof data.description!=='string'||data.description.length>5000||typeof data.category!=='string'||data.category.length>80)fail('Choose up to 8 photos and a valid description.');
 if(data.condition!==undefined&&!ITEM_CONDITIONS.includes(data.condition))fail('Choose a valid item condition.');
 const value={images:data.images,description:data.description,category:data.category};
 if(data.condition!==undefined)value.condition=data.condition;
 return JSON.stringify(value);
}
function imageBytes(uri){
 if(typeof uri!=='string'||uri.length>1500000)fail('Each prepared photo must be smaller than 1 MB.',413);
 const m=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(uri);if(!m)fail('Only JPG, PNG and WebP photos are supported.',415);
 const bytes=unb64(m[2]);if(bytes.length<12||bytes.length>1048576)fail('Invalid image size.',413);
 const kind=m[1],valid=kind==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:kind==='png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):dec.decode(bytes.slice(0,4))==='RIFF'&&dec.decode(bytes.slice(8,12))==='WEBP';
 if(!valid)fail('The photo format does not match its contents.',415);return {bytes,type:'image/'+kind};
}
export async function mediaFetch(request,env,fetcher=fetch){
 const origin=request.headers.get('Origin'),url=new URL(request.url);
 if(origin&&!ORIGINS.has(origin))return json({error:'Origin not allowed.'},403);
 let response;
 try{
 if(!env.BUCKET)fail('Photo sharing is temporarily unavailable.',503);
 if(request.method==='OPTIONS')response=new Response(null,{status:204});
 else if(request.method==='GET'&&url.pathname==='/api/listing-media'){
  const market=url.searchParams.get('component'),ids=(url.searchParams.get('ids')||'').split(',').map(Number);if(ids.length>64||ids.length<1)fail('Invalid listing count.');ids.forEach(id=>listingKey(market,id));
  const entries=[];for(let i=0;i<ids.length;i+=8)entries.push(...await Promise.all(ids.slice(i,i+8).map(async id=>{const o=await env.BUCKET.get(listingKey(market,id));return [String(id),o?await o.json():null]})));
  response=json({listings:Object.fromEntries(entries)});
 }else if(request.method==='GET'&&/^\/api\/listing-images\/[a-f0-9]{64}$/.test(url.pathname)){
  const o=await env.BUCKET.get('images/'+url.pathname.split('/').pop());
  response=o?new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'",'Cross-Origin-Resource-Policy':'cross-origin'}}):json({error:'Photo not found.'},404);
 }else if(request.method==='POST'&&url.pathname==='/api/listing-media/challenge'){
  const data=await body(request,4096),{component,id,digest}=data,key=listingKey(component,id);
  if(!/^[a-f0-9]{64}$/.test(digest))fail('Invalid photo digest.');
  const jwk=await chainListing(component,id,fetcher),publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
  const current=await env.BUCKET.head(key),proof=crypto.getRandomValues(new Uint8Array(32));
  const ticket=b64(enc.encode(JSON.stringify({v:1,component,id,digest,expires:Date.now()+300000,etag:current?.etag||null})));
  const signature=b64(await crypto.subtle.sign('HMAC',await hmacKey(env.MEDIA_UPLOAD_SECRET),enc.encode('tari-market-photos-v1:'+ticket+'.'+b64(proof))));
  const encrypted=b64(await crypto.subtle.encrypt({name:'RSA-OAEP'},publicKey,proof));
  response=json({ticket,signature,encrypted});
 }else if(request.method==='POST'&&url.pathname==='/api/listing-media/upload'){
  const data=await body(request,10000000),{ticket,signature,proof,content}=data;
  if(typeof ticket!=='string'||ticket.length>2048||typeof signature!=='string'||signature.length!==44||typeof proof!=='string'||proof.length!==44)fail('Invalid photo authorization.',403);
  let valid=false,t;try{valid=await crypto.subtle.verify('HMAC',await hmacKey(env.MEDIA_UPLOAD_SECRET),unb64(signature),enc.encode('tari-market-photos-v1:'+ticket+'.'+proof));t=JSON.parse(dec.decode(unb64(ticket)))}catch{}
  if(!valid||t?.v!==1||!Number.isFinite(t.expires)||t.expires<Date.now()||t.expires>Date.now()+300000)fail('Photo authorization expired or is invalid. Try again.',403);
  const key=listingKey(t.component,t.id),serialized=canonical(content);
  if(await hash(enc.encode(serialized))!==t.digest)fail('Photos changed after authorization. Try again.',403);
  await chainListing(t.component,t.id,fetcher);
  const current=await env.BUCKET.get(key);
  if(current?.etag!==t.etag&&!(current===null&&t.etag===null)){
   if(current){const existing=await current.json();if(existing.digest===t.digest)return withCors(json(existing),origin);}
   fail('These photos were updated elsewhere. Reload before replacing them.',409);
  }
  // Validate every image before writing any bytes.
  const decoded=content.images.map(imageBytes),images=[];
  for(const image of decoded){const digest=await hash(image.bytes);await env.BUCKET.put('images/'+digest,image.bytes,{httpMetadata:{contentType:image.type}});images.push('/api/listing-images/'+digest)}
  const manifest={version:1,component:t.component,id:t.id,digest:t.digest,images,description:content.description,category:content.category,updatedAt:new Date().toISOString()};
  if(content.condition!==undefined)manifest.condition=content.condition;
  const saved=await env.BUCKET.put(key,JSON.stringify(manifest),{onlyIf:new Headers(t.etag?{'If-Match':'"'+t.etag+'"'}:{'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
  if(!saved)fail('These photos were updated elsewhere. Reload before replacing them.',409);
  response=json(manifest);
 }else response=json({error:'Not found.'},404);
 }catch(error){response=json({error:error.status?error.message:'Photo storage is temporarily unavailable. Your local photos are unchanged.'},error.status||503);}
 return withCors(response,origin);
}
function withCors(response,origin){const headers=new Headers(response.headers);if(origin)headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type');headers.set('Access-Control-Max-Age','600');return new Response(response.body,{status:response.status,headers});}
