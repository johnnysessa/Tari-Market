import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {mediaFetch} from '../worker/media.mjs';
const market='component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938',owner='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828';
const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['encrypt','decrypt']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey),enc=new TextEncoder();
let verified=true,active=true;
const fetcher=async()=>Response.json({verified,substate:{Component:{header:{template_address:'ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a',owner_rule:'None'},body:{state:[null,null,null,{'1':[1,'test',1,1,0,null,'seller',JSON.stringify(jwk),1,active]},null,null,null,null,null,null,owner,null,null,null,null]}}}});
const storage=new Map();let version=0,fail=false;
const env={MEDIA_UPLOAD_SECRET:'x'.repeat(64),BUCKET:{
 async get(key){if(fail)throw Error('offline');const v=storage.get(key);return v?{...v,body:v.bytes,json:async()=>JSON.parse(new TextDecoder().decode(v.bytes))}:null;},
 async head(key){return this.get(key)},
 async put(key,value,options={}){if(fail)throw Error('offline');const prior=storage.get(key),headers=options.onlyIf;if(headers?.get('If-None-Match')==='*'&&prior)return null;if(headers?.get('If-Match')&&headers.get('If-Match')!=='"'+prior?.etag+'"')return null;const bytes=typeof value==='string'?enc.encode(value):value;const result={etag:String(++version),bytes,httpMetadata:options.httpMetadata};storage.set(key,result);return result;}
}};
const url='https://tari-market.johnnytsunami14.chatgpt.site';
const request=(path,data,origin='http://localhost:5180')=>new Request(url+path,{method:data?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
const call=(path,data,origin)=>mediaFetch(request(path,data,origin),env,fetcher);
const img='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6avQAAAAASUVORK5CYII=';
const content={images:[img],description:'Photo description',category:'Other'};
const digest=async data=>Buffer.from(await crypto.subtle.digest('SHA-256',enc.encode(JSON.stringify(data)))).toString('hex');
async function auth(data=content){const r=await call('/api/listing-media/challenge',{component:market,id:1,digest:await digest(data)});assert.equal(r.status,200);const c=await r.json();const proof=Buffer.from(await crypto.subtle.decrypt({name:'RSA-OAEP'},pair.privateKey,Buffer.from(c.encrypted,'base64'))).toString('base64');return {...c,proof,content:data};}
let a=await auth();
assert.equal((await call('/api/listing-media/upload',{...a,proof:Buffer.alloc(32).toString('base64')})).status,403);
assert.equal((await call('/api/listing-media/upload',{...a,content:{...content,description:'tampered'}})).status,403);
assert.equal(storage.size,0);
let r=await call('/api/listing-media/upload',a);assert.equal(r.status,200);const manifest=await r.json();assert.equal(manifest.images.length,1);assert.equal(storage.size,2);
// A second independent browser can fetch the manifest and exact image bytes.
r=await call('/api/listing-media?component='+market+'&ids=1',null,url);assert.equal((await r.json()).listings[1].description,content.description);
r=await call(manifest.images[0],null,url);assert.equal(r.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await r.arrayBuffer()),Buffer.from(img.split(',')[1],'base64'));
assert.equal((await call('/api/listing-media/upload',a)).status,200); // identical retry is idempotent
const b=await auth({...content,description:'Updated'}),c=await auth({...content,description:'Concurrent'});
assert.equal((await call('/api/listing-media/upload',b)).status,200);assert.equal((await call('/api/listing-media/upload',c)).status,409);
assert.equal((await call('/api/listing-media/upload',a)).status,409); // old ticket cannot roll back later changes
let invalid=await auth({...content,images:['data:image/png;base64,'+Buffer.from('<script>bad</script>').toString('base64')]});assert.equal((await call('/api/listing-media/upload',invalid)).status,415);
assert.equal((await call('/api/listing-media/challenge',{component:market,id:1,digest:await digest(content)},'https://evil.example')).status,403);
verified=false;assert.equal((await call('/api/listing-media/challenge',{component:market,id:1,digest:await digest(content)})).status,503);verified=true;
active=false;assert.equal((await call('/api/listing-media/challenge',{component:market,id:1,digest:await digest(content)})).status,404);active=true;
const conditionOnly={images:[],description:'No photo yet',category:'Other',condition:'Used'};
const conditionAuth=await auth(conditionOnly);
r=await call('/api/listing-media/upload',{...conditionAuth,content:{...conditionOnly,condition:'New'}});assert.equal(r.status,403);
r=await call('/api/listing-media/upload',conditionAuth);assert.equal(r.status,200);assert.equal((await r.json()).condition,'Used');
r=await call('/api/listing-media?component='+market+'&ids=1',null,url);assert.equal((await r.json()).listings[1].condition,'Used');
r=await call('/api/listing-media/upload',await auth({...conditionOnly,condition:'invalid'}));assert.equal(r.status,400);
fail=true;assert.equal((await call('/api/listing-media?component='+market+'&ids=1')).status,503);
console.log('Shared media: private-key proof, tampering, independent-browser reads, image bytes, retries, concurrent writes, replay, bad image types, origins, chain identity and storage failures passed.');
