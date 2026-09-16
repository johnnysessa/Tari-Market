const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const app=fs.readFileSync('dist/assets/app.js','utf8'),html=fs.readFileSync('dist/index.html','utf8'),rust=fs.readFileSync('contracts/xtm_market/src/lib.rs','utf8');
new vm.Script(app);let checks=0;function check(fn){fn();checks++}
function line(name){return app.split('\n').find(row=>row.includes('function '+name+'('))}
const ctx=vm.createContext({localStorage:{getItem:()=>'{broken'},Number,Map,Date});
vm.runInContext([line('safeImageSrc'),line('readStored'),line('storedRows'),line('safeStoredListing'),line('safeStoredOrder'),"const safeId=value=>Number.isSafeInteger(value)&&value>0;"].join('\n'),ctx);
for(const payload of ['assets/x.webp" onerror="alert(1)','data:image/png;base64,AAAA" onload="alert(1)','javascript:alert(1)','data:image/svg+xml,<svg onload=alert(1)>','https://evil.test/a.png','assets/../secret.png'])check(()=>assert.equal(ctx.safeImageSrc(payload),''));
for(const src of ['assets/iphone-duo.webp','data:image/png;base64,AAAA=='])check(()=>assert.equal(ctx.safeImageSrc(src),src));
check(()=>assert.equal(ctx.readStored('x','fallback'),'fallback'));
check(()=>assert.equal(ctx.safeStoredListing({id:'1" onmouseover="',stock:1,price:1,shipping:0}),false));
check(()=>assert.equal(ctx.safeStoredOrder({id:'ok',chainOrderId:'1" onmouseover="',xtm:1}),false));
vm.runInContext(app.slice(app.indexOf('    function transactionOutcome'),app.indexOf('    async function submitInstructions')),ctx);
for(const result of [{result:{}},{status:'Unaccepted',result:{result:{Accept:{}}}},{status:'Accepted',result:{result:{AcceptFeeRejectRest:{}}}},{status:'Pending',result:{result:{Accept:{}}}},{status:'Accepted'},{status:'Accepted',result:{result:{Reject:{}}}}])check(()=>assert.notEqual(ctx.transactionOutcome(result),'accepted'));
check(()=>assert.equal(ctx.transactionOutcome({status:'Accepted',result:{result:{Accept:{}}}}),'accepted'));
check(()=>assert.equal(ctx.transactionOutcome({status:'Rejected'}),'rejected'));
const localOrders=vm.createContext({MARKET_COMPONENT_ADDRESS:'current',orders:[{marketComponent:'current',chainOrderId:1,status:'In escrow'},{marketComponent:'legacy',chainOrderId:1,status:'In escrow'}],sellerOrders:[],saveOrderState:()=>{},renderOrders:()=>{},renderSellerOrders:()=>{}});vm.runInContext(line('setEscrowStatus'),localOrders);localOrders.setEscrowStatus(1,'Released');check(()=>assert.equal(localOrders.orders[0].status,'Released'));check(()=>assert.equal(localOrders.orders[1].status,'In escrow'));
const bridge=fs.readFileSync('dist/assets/tari-connector.js','utf8');
async function bridgeTest(){let listener,posted,resolveCount=0;const parent={postMessage:(message,origin)=>{posted={message,origin}}},window={parent,addEventListener:(event,fn)=>{listener=fn},dispatchEvent:()=>{}};const box=vm.createContext({window,document:{referrer:'https://universe.tari.mw/wallet'},URL,Event:function(){},CustomEvent:function(){},setTimeout:()=>1,clearTimeout:()=>{}});vm.runInContext(bridge,box);const promise=window.tari.request({method:'tari_getAccounts'}).then(()=>resolveCount++);assert.equal(posted.origin,'https://universe.tari.mw');const event={source:parent,origin:'https://evil.test',data:{protocol:'tari-dapp-bridge/1',id:posted.message.id,result:[]}};listener(event);await Promise.resolve();assert.equal(resolveCount,0);listener({...event,origin:'https://universe.tari.mw',source:{}});await Promise.resolve();assert.equal(resolveCount,0);listener({...event,origin:'https://universe.tari.mw'});await promise;assert.equal(resolveCount,1);checks+=4;}
check(()=>assert.equal((rust.match(/escrow_vault\.withdraw/g)||[]).length,1));
check(()=>assert(rust.includes('.with_owner_rule(OwnerRule::None)')));
check(()=>{const fee=rust.slice(rust.indexOf('pub fn pay_marketplace_fee'),rust.indexOf('pub fn get_platform_payment_address'));assert(!fee.includes('escrow_vault'));assert(fee.includes('CallerContext::transaction_signer_public_key()'));assert(fee.includes('Fee already paid'));});
check(()=>{const settle=rust.slice(rust.indexOf('fn settle_order'),rust.indexOf('pub fn pay_marketplace_fee'));assert(settle.indexOf('order.settled = true')<settle.indexOf('escrow_vault.withdraw'));assert(!settle.includes('platform_payment_address'));});
check(()=>assert(!/<script>([\s\S]*?)<\/script>/.test(html)));
check(()=>assert(html.includes("script-src 'self' 'wasm-unsafe-eval';")&&!html.includes("script-src 'unsafe-inline'")));
for(const name of ['app.js','tari-connector.js'])check(()=>{const hash=crypto.createHash('sha384').update(fs.readFileSync('dist/assets/'+name)).digest('base64');assert(html.includes('src="assets/'+name+'" integrity="sha384-'+hash+'"'));});
const roles=vm.createContext({walletConnection:{connected:true,accountAddress:'admin'},MARKET_OWNER_ACCOUNT:'owner',MARKET_COMPONENT_ADDRESS:'current',Date});
vm.runInContext(app.slice(app.indexOf('    let adminRoles='),app.indexOf('    function renderAdminManagement')),roles);
check(()=>assert.equal(vm.runInContext('isMarketplaceAdmin()',roles),false));
vm.runInContext("adminRolesReady=true;adminRolesCheckedAt=Date.now();adminRoles.set('admin','key')",roles);
check(()=>assert.equal(vm.runInContext('isMarketplaceAdmin()',roles),true));
check(()=>assert.equal(vm.runInContext("canModerateComponent('legacy')",roles),false));
vm.runInContext('adminRolesCheckedAt=0',roles);
check(()=>assert.equal(vm.runInContext('isMarketplaceAdmin()',roles),false));
vm.runInContext("walletConnection.accountAddress='owner'",roles);
check(()=>assert.equal(vm.runInContext('isMarketplaceAdmin()',roles),true));
vm.runInContext('walletConnection.connected=false',roles);
check(()=>assert.equal(vm.runInContext('isMarketplaceAdmin()',roles),false));
for(const file of JSON.parse(fs.readFileSync('security/vendor-manifest.json','utf8')))check(()=>assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file.file)).digest('hex'),file.local_sha256));
const usernameContext=vm.createContext({Map,Number,String,Object,Array});
const usernameCode=app.slice(app.indexOf('    const SELLER_USERNAMES_READY='),app.indexOf('    function shortAddress')).replace('SELLER_USERNAMES_READY=false','SELLER_USERNAMES_READY=true');
vm.runInContext(line('reviewField')+'\nfunction paymentAddress(v){return v}\nfunction shortAddress(v){return v}\n'+usernameCode,usernameContext);
check(()=>assert.equal(usernameContext.normalizeSellerUsername(' Shop_One '),'shop_one'));
for(const invalid of ['ab','a'.repeat(25),'shоp','admin','Owner','<script>','shop name'])check(()=>assert.equal(usernameContext.normalizeSellerUsername(invalid),''));
const usernameKey='a'.repeat(64),usernameAddress='component_'+'b'.repeat(64);
const usernameState=Array(15).fill(null);usernameState[13]={[usernameKey]:'shop_one'};usernameState[14]={shop_one:usernameKey};usernameState[3]={'1':{id:1,seller:usernameKey,seller_payment_address:usernameAddress}};
usernameContext.refreshUsernameRegistry(usernameState);
check(()=>assert.equal(usernameContext.sellerIdentity({chainId:1,paymentAddress:usernameAddress}),'@shop_one'));
check(()=>assert.equal(usernameContext.sellerIdentity({chainId:1,paymentAddress:'other'}),'other'));
usernameState[14].shop_one='c'.repeat(64);usernameContext.refreshUsernameRegistry(usernameState);
check(()=>assert.equal(usernameContext.sellerIdentity({chainId:1,paymentAddress:usernameAddress}),usernameAddress));
usernameContext.refreshUsernameRegistry(null);
check(()=>assert.equal(usernameContext.sellerIdentity({chainId:1,paymentAddress:usernameAddress}),usernameAddress));
async function walletRoutingTest(){
  for(const [available,choice,expected] of [[false,'walletconnect','walletconnect'],[true,'provider','provider'],[true,'walletconnect','walletconnect']]){
    let route='',pairing='';const nodes={};const provider={isAvailable:available,isEmbedded:available,info:{rdns:'mw.tari.universe'},request:async()=>{assert(available);route='provider';return['account']}};
    const context=vm.createContext({localReconnectGeneration:0,rememberWalletPreference(){},window:{tari:provider,tariUniverse:provider},walletConnection:{connected:false},$:id=>nodes[id]??(nodes[id]={value:choice,classList:{add(){},remove(){}}}),getWalletClient:async()=>({session:{getAll:()=>[]},connect:async()=>{route='walletconnect';return{uri:'wc:test',approval:async()=>({})}}}),WALLETCONNECT_CHAIN:'tari:38',showPairingUri:async uri=>{pairing=uri},finishWalletSession:async()=>{},finishWindowTari:async()=>{},renderWalletConnectionChoice:()=>{}});
    vm.runInContext(line('hasAvailableTariProvider')+'\n'+app.slice(app.indexOf('    async function connectWallet('),app.indexOf('    async function disconnectWallet(')),context);
    await context.connectWallet({preventDefault(){}});assert.equal(route,expected);assert.equal(pairing,expected==='walletconnect'?'wc:test':'');checks+=2;
  }
  const context=vm.createContext({localReconnectGeneration:0,rememberWalletPreference(){},window:{tari:{request(){}}}});vm.runInContext(line('hasAvailableTariProvider'),context);check(()=>assert.equal(context.hasAvailableTariProvider(),true));context.window.tari.isAvailable=false;check(()=>assert.equal(context.hasAvailableTariProvider(),false));
}
Promise.all([bridgeTest(),walletRoutingTest()]).then(()=>console.log(`${checks} security regression checks passed.`)).catch(error=>{console.error(error);process.exitCode=1});
