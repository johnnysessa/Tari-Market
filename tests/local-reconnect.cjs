const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const bridgeSource=fs.readFileSync('dist/assets/local-wallet.js','utf8');
const app=fs.readFileSync('dist/assets/app.js','utf8');
const account='component_'+'a'.repeat(64),other='component_'+'b'.repeat(64);
function bridgeHarness(origin='http://localhost:5180',store=new Map()){
  let requests=[],sessions=0,rejectOnce=true;
  const ctx=vm.createContext({location:{origin},window:{addEventListener(){}},document:{querySelector:()=>null},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null},AbortSignal,setTimeout,fetch:async(path,options)=>{
    if(path.endsWith('/session')){sessions++;return {ok:true,json:async()=>({session:'local-session-'+sessions})}}
    const method=JSON.parse(options.body).method;requests.push(method);
    if(rejectOnce){rejectOnce=false;return {status:403,ok:false,json:async()=>({error:'Invalid session'})}}
    return {status:200,ok:true,json:async()=>({result:{network:'esmeralda',network_byte:38}})};
  }});vm.runInContext(bridgeSource,ctx);
  return {bridge:ctx.window.xtmLocalWallet,store,requests,get sessions(){return sessions}};
}
async function main(){
  const h=bridgeHarness();assert.equal(h.bridge.rememberedAccount(),'');h.bridge.remember(account);assert.equal(h.bridge.rememberedAccount(),account);
  assert.equal(bridgeHarness('http://localhost:5180',h.store).bridge.rememberedAccount(),account);
  assert.equal(bridgeHarness('https://example.test',h.store).bridge.rememberedAccount(),'');
  await h.bridge.request('tari_getWalletInfo');assert.equal(h.sessions,2);assert.deepEqual(h.requests,['tari_getWalletInfo','tari_getWalletInfo']);
  h.bridge.disconnect();assert.equal(h.bridge.rememberedAccount(),'');assert.equal(h.store.size,0);
  for(const method of ['tari_submitTransaction','local_getApproval']){const blocked=bridgeHarness();await assert.rejects(blocked.bridge.request(method),/Invalid session/);assert.equal(blocked.requests.length,1);assert.equal(blocked.sessions,1)}
  let remembered='',reported=account,fail=false,reads=[],resolveAccount;
  const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',classList:{remove(){}},close(){}});return nodes.get(id)};
  const bridge={available:true,rememberedAccount:()=>remembered,remember:a=>remembered=a,forget:()=>remembered='',request:async method=>{reads.push(method);if(fail)throw Error('Offline');if(method==='tari_getWalletInfo')return {network:'esmeralda',network_byte:38};if(resolveAccount)return new Promise(resolve=>{resolveAccount=resolve});return {account:{component_address:reported,owner_key_id:'key1'}}}};
  const ctx=vm.createContext({window:{xtmLocalWallet:bridge},document:{hidden:false},walletConnection:{connected:false},transactionBusy:false,purchaseBusy:false,$:node,renderWalletState(){},renderSellerOrders(){},refreshTrustScores:async()=>{},toast(){}});
  vm.runInContext(app.slice(app.indexOf('    let localReconnectBusy='),app.indexOf('    let walletLibrariesPromise;')),ctx);
  await ctx.reconnectLocalWallet();assert.equal(reads.length,0);
  await ctx.finishLocalWallet();assert.equal(remembered,account);assert.equal(ctx.walletConnection.connected,true);
  fail=true;await ctx.reconnectLocalWallet();assert.equal(ctx.walletConnection.connected,false);assert.equal(remembered,account);
  fail=false;await ctx.reconnectLocalWallet();assert.equal(ctx.walletConnection.connected,true);
  reported=other;await ctx.reconnectLocalWallet();assert.equal(ctx.walletConnection.connected,false);assert.equal(remembered,'');
  remembered=account;reported=account;ctx.walletConnection={connected:true,transport:'testnet'};const count=reads.length;await ctx.reconnectLocalWallet();assert.equal(reads.length,count);
  ctx.walletConnection={connected:false};ctx.transactionBusy=true;await ctx.reconnectLocalWallet();assert.equal(reads.length,count);ctx.transactionBusy=false;
  resolveAccount=true;const pending=ctx.reconnectLocalWallet();await new Promise(resolve=>setImmediate(resolve));
  remembered='';resolveAccount({account:{component_address:account,owner_key_id:'key1'}});await pending;assert.equal(ctx.walletConnection.connected,false);
  assert(reads.every(m=>['tari_getWalletInfo','tari_getDefaultAccount'].includes(m)));
  console.log('Local reconnect: consent, remembered account, outage recovery, account change, disconnect race, read-only retry and transaction boundaries passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
