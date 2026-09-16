const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('dist/assets/app.js','utf8');
const helpers=app.slice(app.indexOf('    const walletPreferenceKey='),app.indexOf('    let testWalletModulePromise;'));
const restore=app.slice(app.indexOf('    async function restoreWalletSession(){'),app.indexOf('    function manifestText'));
const savedKey='xtm-market-esmeralda-wallet-v1',prefKey='xtm-market-wallet-preference-v1';
function harness({saved=true,pref='',legal=false,local=false}={}){
 const storage=new Map();if(saved)storage.set(savedKey,JSON.stringify({version:1,salt:'encrypted',iv:'iv',cipher:'ciphertext'}));if(pref)storage.set(prefKey,pref);
 let opens=0,focused=0,clientReads=0,localReads=0,legalOpen=legal;
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',open:false,hidden:false,classList:{remove(){}},showModal(){this.open=true;opens++},focus(){focused++}});return nodes.get(id)};
 const ctx=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},walletConnection:{connected:false},window:{xtmLocalWallet:{available:local,rememberedAccount:()=>''},addEventListener(){}},document:{hidden:false,querySelector:()=>legalOpen?{}:get('#walletDialog').open?{}:null,addEventListener(){}},$:get,renderWalletConnectionChoice(){},hasAvailableTariProvider:()=>false,localReconnectGeneration:0,reconnectLocalWallet(){localReads++},setInterval(){},getWalletClient:async()=>{clientReads++;return {session:{getAll:()=>[]}}},finishWalletSession(){throw Error('Must not connect without authorization')},console});
 vm.runInContext(helpers+'\n'+restore,ctx);
 return {ctx,storage,get,setLegal:v=>legalOpen=v,get opens(){return opens},get focused(){return focused},get clientReads(){return clientReads},get localReads(){return localReads}};
}
(async()=>{
 const a=harness({legal:true});await a.ctx.restoreWalletSession();assert.equal(a.opens,0);assert.equal(a.clientReads,0);
 a.setLegal(false);a.ctx.promptSavedBrowserWallet();assert.equal(a.opens,1);assert.equal(a.get('#walletConnectionMethod').value,'testnet');assert.equal(a.focused,1);
 a.get('#walletDialog').open=false;a.ctx.promptSavedBrowserWallet();assert.equal(a.opens,1); // cancel stays dismissed
 const b=harness({pref:'disconnected'});await b.ctx.restoreWalletSession();assert.equal(b.opens,0);assert.equal(b.clientReads,0);assert.equal(b.ctx.defaultWalletMethod(),'testnet');
 const c=harness({pref:'walletconnect'});await c.ctx.restoreWalletSession();assert.equal(c.opens,0);assert.equal(c.clientReads,1);assert.equal(c.ctx.defaultWalletMethod(),'walletconnect');
 const d=harness({saved:false});await d.ctx.restoreWalletSession();assert.equal(d.opens,0);assert.equal(d.ctx.defaultWalletMethod(),'testnet');
 const e=harness({local:true});await e.ctx.restoreWalletSession();assert.equal(e.opens,0);assert.equal(e.localReads,1);assert.equal(e.ctx.defaultWalletMethod(),'local');
 const f=harness();f.storage.set(savedKey,'bad-json');assert.equal(f.ctx.savedBrowserWallet(),false);await f.ctx.restoreWalletSession();assert.equal(f.opens,0);
 const g=harness();g.ctx.document.hidden=true;await g.ctx.restoreWalletSession();assert.equal(g.opens,0);g.ctx.document.hidden=false;g.ctx.promptSavedBrowserWallet();assert.equal(g.opens,1);
 assert(!/password|owner|view/.test(JSON.stringify([...a.storage.keys()])));
 console.log('Saved browser-wallet recognition, deferred prompt, cancel/disconnect, existing options, malformed storage and visibility checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
