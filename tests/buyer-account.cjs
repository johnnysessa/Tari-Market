const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/assets/app.js','utf8');
const code=source.slice(source.indexOf('    async function verifyBuyerAccount('),source.indexOf('    async function refreshRates('));
const account='component_'+'a'.repeat(64),other='component_'+'b'.repeat(64);
const valid={verified:true,substate:{Component:{header:{},body:{state:[]}}}};
function setup(fetcher){
  const calls={submit:0,encrypt:0,listing:0,record:0},nodes={};
  const ctx=vm.createContext({INDEXER_URL:'https://indexer.example/',AbortSignal,fetch:fetcher,decodeChainValue:v=>v,
    selected:{id:1,chainId:1,name:'Test'},selectedQuote:{itemXtm:1,totalXtm:1},purchaseBusy:false,transactionBusy:false,
    purchaseBlockReason:()=>'',buyerDetails:()=>({name:'Resident'}),newPurchasesReady:()=>true,
    walletConnection:{connected:true,accountAddress:account},$:id=>nodes[id]||(nodes[id]={textContent:'',setAttribute(){},removeAttribute(){}}),
    verifyPurchaseListing:async()=>{calls.listing++},encryptDeliveryDetails:async()=>{calls.encrypt++;return 'encrypted'},
    atomicTari:v=>v*1e6,safeId:Number.isSafeInteger,componentCall:()=>({}),literal:v=>v,cborAddress:v=>v,cborHead:()=>0,cborText:v=>v,
    MARKET_COMPONENT_ADDRESS:other,xtm:String,submitInstructions:async()=>{calls.submit++;return{transactionId:'tx',result:{}}},
    returnedListingId:()=>1,recordPaidOrder:()=>{calls.record++},toast:()=>{},renderWalletState:()=>{nodes['#paymentNote'].textContent='normal'}
  });vm.runInContext(code,ctx);return{ctx,calls,nodes};
}
(async()=>{
  let tests=0;
  for(const [name,fetcher,pattern] of [
    ['missing',async()=>({status:404,ok:false}),/not initialized/],
    ['server failure',async()=>({status:503,ok:false}),/Could not verify/],
    ['timeout',async()=>{throw Error('timeout')},/Could not verify/],
    ['malformed JSON',async()=>({ok:true,json:async()=>{throw Error('bad JSON')}}),/Could not verify/],
    ['wrong substate',async()=>({ok:true,json:async()=>({verified:true,substate:{Vault:{}}})}),/Could not verify/],
    ['unverified',async()=>({ok:true,json:async()=>({...valid,verified:false})}),/Could not verify/],
    ['missing state',async()=>({ok:true,json:async()=>({verified:true,substate:{Component:{header:{},body:{}}}})}),/Could not verify/]
  ]){
    const h=setup(fetcher);await h.ctx.payWithWallet();assert.match(h.nodes['#paymentNote'].textContent,pattern,name);
    assert.deepEqual(h.calls,{submit:0,encrypt:0,listing:0,record:0},name);assert.equal(h.ctx.purchaseBusy,false);assert.equal(h.nodes['#orderButton'].disabled,false);tests++;
  }
  const h=setup(async(url,options)=>{assert(url.includes(encodeURIComponent(account)));assert(url.endsWith('local_search_only=false'));assert.equal(options.cache,'no-store');return{ok:true,json:async()=>valid}});
  await h.ctx.payWithWallet();assert.deepEqual(h.calls,{submit:1,encrypt:1,listing:1,record:1});tests++;
  const changed=setup(async()=>{changed.ctx.walletConnection.accountAddress=other;return{ok:true,json:async()=>valid}});
  await changed.ctx.payWithWallet();assert.match(changed.nodes['#paymentNote'].textContent,/Wallet changed/);assert.equal(changed.calls.submit,0);tests++;
  const malformed=setup(async()=>{throw Error('must not fetch')});await assert.rejects(malformed.ctx.verifyBuyerAccount('bad'),/Reconnect/);tests++;
  console.log(tests+' buyer account checks passed, including checkout submission boundaries.');
})().catch(e=>{console.error(e);process.exitCode=1});
