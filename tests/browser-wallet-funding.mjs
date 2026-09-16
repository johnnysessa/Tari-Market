import assert from 'node:assert/strict';
const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
const wallet=await import('../dist/assets/test-wallet/wallet.js');
const password='test-funding-password-123';
await wallet.unlock(password);const identity=await wallet.connectAccount();
let submissions=0,failPoll=true,body;
const account='component_'+'ab'.repeat(32),txid='cd'.repeat(32);
globalThis.fetch=async(url,options={})=>{
 let result={current_epoch:10};url=String(url);
 if(url.endsWith('/network'))result={network:'esmeralda',network_byte:38,epoch:10};
 else if(url.endsWith('/transactions')){submissions++;body=options.body;result={transaction_id:txid};}
 else if(url.includes('/result')){if(failPoll)throw Error('temporary network outage');result={result:{Finalized:{final_decision:'Commit',execution_result:{finalize:{result:{Accept:{account}}}}}}};}
 else if(url.includes('/substates/'))result={substate:{Component:{header:{owner_rule:{ByPublicKey:identity.ownerPublicKey}},body:{state:[]}}}};
 return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
};
await assert.rejects(wallet.fundNewWallet(),/temporary network outage/);
assert.equal(submissions,1);assert(body.length>100,'a sealed transaction must be submitted');
const saved=wallet.backup();assert(!saved.includes(txid));
wallet.lock();await wallet.unlock(password);failPoll=false;
assert.equal((await wallet.fundNewWallet()).account,account);assert.equal(submissions,1,'resume must not submit again');
assert.equal((await wallet.fundNewWallet()).account,account);assert.equal(submissions,1,'funded wallet must not claim again');
wallet.lock();await assert.rejects(wallet.fundNewWallet(),/Unlock/);
console.log('Funding builds the native faucet transaction, persists encrypted pending state, resumes after reload, verifies ownership, and prevents repeat claims.');
