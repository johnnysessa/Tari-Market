const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/assets/app.js','utf8');
const active=source.match(/const MARKET_COMPONENT_ADDRESS='([^']+)'/)[1],old=source.match(/const PREVIOUS_MARKET_COMPONENT='([^']+)'/)[1];
const account='component_'+'ab'.repeat(32),signer='cd'.repeat(32),platform='component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c';
const state=()=>['resource_'+'01'.repeat(32),platform,null,{}, {},{}, {},{},1,1,'d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828',{}, {},{[signer]:'taritom'},{taritom:signer}];
const current=state(),legacy=state();legacy[3][4]=[4,'Beats',100,5000000,1000000,account,signer,'public-delivery-key',2,true];
let submitted=[],notice='',keyAvailable=true,chainOwner=signer,confirmed=true;
const nodes={};const ctx=vm.createContext({MARKET_COMPONENT_ADDRESS:active,PREVIOUS_MARKET_COMPONENT:old,MARKET_OWNER_ACCOUNT:platform,INDEXER_URL:'https://indexer/',AbortSignal,TextEncoder,FormData:class {get(k){return {title:'Edited',price:7,shipping:1,stock:3}[k]}},
 walletConnection:{connected:true,accountAddress:account},listings:[{id:123,chainId:4,marketComponent:old,image:'photo.webp',description:'Original details',stock:2,price:5,shipping:1}],usernameListings:new Map(),normalizeSellerUsername:s=>s,saveListings:()=>true,render:()=>{},refreshUsernameRegistry:()=>{},refreshTrustScores:async()=>{},loadDeliveryPrivateKey:async()=>keyAvailable?{}:null,
 window:{confirm:()=>confirmed},toast:s=>notice=s,escapeHtml:s=>s,xtm:n=>String(n),paymentAddress:s=>s,decodeChainValue:s=>s,reviewField:(r,i)=>r[i],xtmRate:()=>.01,atomicTari:n=>n*1e6,cborHead:(t,n)=>n,cborText:s=>s,cborAddress:s=>s,literal:s=>s,componentCall:(component,method,args)=>({component,method,args}),
 submitInstructions:async ins=>{submitted.push(ins);return {result:8}},returnedListingId:r=>r,
 $:id=>nodes[id]??(nodes[id]={elements:{title:{},price:{},shipping:{},stock:{}},querySelectorAll:()=>[],showModal(){},close(){}}),
 fetch:async url=>({ok:true,json:async()=>url.includes(account)?{verified:true,substate:{Component:{header:{owner_rule:{ByPublicKey:chainOwner}}}}}:{verified:true,substate:{Component:{header:{owner_rule:'None',template_address:url.includes(active)?'ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a':'b10f1ab4c4902241f3e4592b1719ac8059aece55011a4e6f580c61f28ecfb7c2'},body:{state:url.includes(active)?current:legacy}}}}})
});
vm.runInContext(source.slice(source.indexOf('    const LISTING_MANAGEMENT_READY='),source.indexOf('    function renderWalletState')),ctx);
(async()=>{
 await ctx.refreshMyItems();assert.match(nodes['#myItemsList'].innerHTML,/Relist to enable editing/);
 chainOwner='wrong';await ctx.relistMyItem(4);assert.equal(submitted.length,0);assert.match(notice,/original seller/);
 chainOwner=signer;keyAvailable=false;await ctx.relistMyItem(4);assert.equal(submitted.length,0);assert.match(notice,/shipping decryption key/);
 keyAvailable=true;confirmed=false;await ctx.relistMyItem(4);assert.equal(submitted.length,0);
 confirmed=true;await ctx.relistMyItem(4);assert.equal(submitted.length,1);assert.equal(submitted[0][0].component,active);assert.equal(submitted[0][0].method,'create_listing');assert.equal(submitted[0][0].args[5],'public-delivery-key');
 current[3][8]=[8,...legacy[3][4].slice(1)];await ctx.refreshMyItems();
 const migrated=ctx.listings.find(x=>x.chainId===8&&x.marketComponent===active);assert.equal(migrated.id,123);assert.equal(migrated.image,'photo.webp');assert.equal(migrated.description,'Original details');
 await ctx.relistMyItem(4);assert.equal(submitted.length,1);assert.match(notice,/already been relisted/);
 // Same numeric ID on the old contract must not be edited accidentally.
 legacy[3][8]=[8,'Different old item',100,1000000,0,account,signer,'different-key',1,true];await ctx.refreshMyItems();
 ctx.openItemEditor(8);await ctx.saveMyItem({preventDefault(){}});assert.equal(submitted[1][0].method,'update_listing');assert.equal(submitted[1][0].component,active);assert.equal(submitted[1][0].args[0],8);
 current[3][8][1]='Remote edited';current[3][8][8]=3;ctx.syncMarketListings(current,legacy);assert.equal(migrated.name,'Remote edited');assert.equal(migrated.stock,3);
 await ctx.deleteMyItem(8);assert.equal(submitted[2][0].method,'cancel_listing');assert.equal(submitted[2][0].component,active);
 current[3][8][9]=false;current[3][8][8]=0;ctx.syncMarketListings(current,legacy);assert(!ctx.listings.some(x=>x.chainId===8&&x.marketComponent===active&&x.stock>0));
 assert(ctx.listings.some(x=>x.chainId===8&&x.marketComponent===old));
 console.log('Listing management: wallet ownership, delivery-key guard, cancellation, relist, duplicate prevention, metadata retention, component ID collisions, edit/delete routing and catalog reconciliation passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
