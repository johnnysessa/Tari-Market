const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('dist/assets/app.js','utf8');
const snippet=app.slice(app.indexOf('    let walletSummary='),app.indexOf('    function renderWalletState'));
const address='component_'+'ab'.repeat(32),vault='vault_'+'cd'.repeat(32),nodes={};
let unavailable=false;
const ctx=vm.createContext({walletConnection:{connected:true,transport:'testnet',accountAddress:address,account:{}},usernameListings:new Map([['4',{address,name:'taritom'}]]),sellerUsernames:new Map(),document:{createElement:()=>({})},$:id=>nodes[id]??(nodes[id]={replaceChildren(){this.children=[]},append(...v){this.children=v}}),INDEXER_URL:'https://indexer/',decodeChainValue:v=>v,Intl,Date,AbortSignal,fetch:async url=>({ok:!unavailable,json:async()=>({substate:url.includes('component_')?{Component:{header:{owner_rule:{ByPublicKey:'owner'}},body:{state:[vault]}}}:{Vault:{resource_container:{Stealth:{address:'resource_'+'01'.repeat(32),revealed_amount:'999997253'}}}}})})});
vm.runInContext(snippet,ctx);
(async()=>{
 assert.equal(ctx.connectedWalletName(),'TariTom');
 await ctx.refreshConnectedWallet();ctx.renderConnectedWallet();
 await new Promise(r=>setImmediate(r));
 assert.equal(nodes['#walletButton'].children[0].textContent,'TariTom');
 assert.equal(nodes['#walletButton'].children[1].textContent,'999.997253 tTari available');
 unavailable=true;await ctx.refreshConnectedWallet();assert.equal(nodes['#walletButton'].children[1].textContent,'Balance unavailable');
 ctx.usernameListings.clear();ctx.walletConnection.account.name='My wallet';assert.equal(ctx.connectedWalletName(),'My wallet');
 ctx.walletConnection.connected=false;ctx.renderConnectedWallet();assert.equal(vm.runInContext('walletSummary.amount',ctx),null);
 console.log('Wallet summary resolves names, displays exact test balance, handles read failures, and clears on disconnect.');
})().catch(e=>{console.error(e);process.exitCode=1});
