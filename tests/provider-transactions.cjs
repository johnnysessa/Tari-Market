const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/assets/provider-transactions.js','utf8');
const account='component_'+'a'.repeat(64),tx='b'.repeat(64),params={instructions:[],maxFee:'20000',dryRun:false};
let checks=0;
function harness(request,storage=new Map(),advanced=true){
  let now=0,next=1;const timers=new Map(),calls=[];
  const provider={request:args=>{calls.push(args);if(args.method==='tari_getAccounts')return Promise.resolve([account]);return request(args);}};
  if(advanced)provider.requestTransaction=()=>{throw Error('Do not use long-lived helper')};
  const box=vm.createContext({window:{tari:provider},navigator:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Date:{now:()=>now},setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(source,box);
  async function finish(promise){
    let done=false,value,error;promise.then(v=>{done=true;value=v},e=>{done=true;error=e});
    for(let i=0;i<1000&&!done;i++){
      for(let j=0;j<30;j++)await Promise.resolve();
      if(done)break;
      const first=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!first)throw Error('Promise stalled without a timer');
      now=first[1].at;timers.delete(first[0]);first[1].fn();
    }
    if(!done)throw Error('Test did not settle');
    if(error)throw error;return value;
  }
  return {api:box.window.xtmProviderTransactions,provider,calls,storage,finish,send:()=>box.window.xtmProviderTransactions.submit(provider,account,params)};
}
async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
  await test('request-only provider keeps supported method',async()=>{
    const h=harness(async({method})=>{assert.equal(method,'tari_signAndSubmitTransaction');return {transactionId:tx}},new Map(),false);
    assert.equal((await h.finish(h.send())).transactionId,tx);assert.equal(h.calls.length,1);
    const recovered=await h.finish(h.send());assert(recovered.recovered);assert.equal(h.calls.length,1);
    h.api.acknowledge(account,tx);assert.equal(h.storage.size,0);
  });
  await test('approval lifecycle creates and submits once',async()=>{
    const h=harness(async({method})=>method==='tari_createTransactionRequest'?{requestId:0}:method==='tari_getTransactionRequest'?{status:'approved'}:{transactionId:tx});
    assert.equal((await h.finish(h.send())).transactionId,tx);assert.deepEqual(h.calls.map(c=>c.method),['tari_createTransactionRequest','tari_getTransactionRequest','tari_getAccounts','tari_submitTransactionRequest']);
  });
  await test('lost submit response recovers through reads without resubmission',async()=>{
    let submitted=false;
    const h=harness(async({method})=>{
      if(method==='tari_createTransactionRequest')return {requestId:'req'};
      if(method==='tari_getTransactionRequest')return submitted?{status:'submitted',result:{transactionId:tx}}:{status:'approved'};
      submitted=true;throw Error('response lost');
    });
    assert.equal((await h.finish(h.send())).transactionId,tx);assert.equal(h.calls.filter(c=>c.method==='tari_submitTransactionRequest').length,1);
  });
  await test('timeout stops polling; reload resumes same request read-only',async()=>{
    const h=harness(async({method})=>method==='tari_createTransactionRequest'?{requestId:'req'}:{status:'pending'});
    await assert.rejects(h.finish(h.send()),/timed out/);
    const reloaded=harness(async({method,params})=>{assert.equal(method,'tari_getTransactionRequest');assert.equal(params.requestId,'req');return {status:'submitted',result:{transactionId:tx}}},h.storage);
    const result=await reloaded.finish(reloaded.send());assert.equal(result.transactionId,tx);assert(result.recovered);
  });
  await test('late one-shot result survives timeout; retry never duplicates',async()=>{
    let finish;const h=harness(()=>new Promise(r=>{finish=r}),new Map(),false);
    await assert.rejects(h.finish(h.send()),/timed out/);finish({transactionId:tx});
    for(let i=0;i<10;i++)await Promise.resolve();
    assert.equal((await h.finish(h.send())).transactionId,tx);assert.equal(h.calls.length,1);
  });
  await test('lost create response blocks duplicate creation',async()=>{
    const h=harness(async()=>{throw Error('lost')});await assert.rejects(h.finish(h.send()),/lost/);
    await assert.rejects(h.finish(h.send()),/unknown outcome/);assert.equal(h.calls.length,1);
  });
  await test('late creation response saves request ID without submitting',async()=>{
    let finish;const h=harness(()=>new Promise(r=>{finish=r}));await assert.rejects(h.finish(h.send()),/timed out/);
    finish({requestId:'late'});for(let i=0;i<10;i++)await Promise.resolve();assert.equal(h.calls.length,1);
    assert.equal(JSON.parse([...h.storage.values()][0]).requestId,'late');
  });
  await test('rejected approval clears guard and never submits',async()=>{
    const h=harness(async({method})=>method==='tari_createTransactionRequest'?{requestId:'req'}:{status:'rejected'});
    await assert.rejects(h.finish(h.send()),/rejected/);assert.equal(h.storage.size,0);assert.equal(h.calls.length,2);
  });
  await test('transient status read failure is retried',async()=>{
    let reads=0;const h=harness(async({method})=>{
      if(method==='tari_createTransactionRequest')return {requestId:'req'};
      if(method==='tari_getTransactionRequest'){if(++reads===1)throw Error('lost read');return {status:'approved'}}
      return {transactionId:tx};
    });assert.equal((await h.finish(h.send())).transactionId,tx);assert.equal(reads,2);
  });
  await test('no automatic submit of previously approved request',async()=>{
    const storage=new Map([['tari-market-provider-request-v1:'+account,JSON.stringify({phase:'approval',requestId:'req'})]]);
    const h=harness(async()=>({status:'approved'}),storage);await assert.rejects(h.finish(h.send()),/Finish or reject/);assert.equal(h.calls.length,1);
  });
  await test('same-tab concurrent send is blocked',async()=>{
    const h=harness(()=>new Promise(()=>{}));const first=h.send();await assert.rejects(h.send(),/in progress/);await assert.rejects(h.finish(first),/timed out/);assert.equal(h.calls.length,1);
  });
  const app=fs.readFileSync('dist/assets/app.js','utf8'),box=vm.createContext({});
  vm.runInContext(app.slice(app.indexOf('    function transactionOutcome'),app.indexOf('    function signingAccountAddress')),box);
  await test('indexer success, abort, fee-only failure, pending and legacy results',async()=>{
    const envelope=result=>({result:{Finalized:result}});
    for(const [value,expected] of [[envelope({final_decision:'Commit',execution_result:{finalize:{result:{Accept:{}}}}}),'accepted'],[envelope({final_decision:{Abort:'SubstateNotFound'}}),'rejected'],[envelope({final_decision:'Commit',execution_result:{finalize:{result:{AcceptFeeRejectRest:{}}}}}),'rejected'],[{},'pending'],[{status:'Accepted',result:{result:{Accept:{}}}},'accepted']])assert.equal(box.transactionOutcome(value),expected);
  });
  console.log(checks+' provider transaction checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
