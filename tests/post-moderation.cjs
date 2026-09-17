const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/assets/app.js','utf8');
const active=source.match(/const MARKET_COMPONENT_ADDRESS='([^']+)'/)[1],legacy=source.match(/const PREVIOUS_MARKET_COMPONENT='([^']+)'/)[1];
const owner='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828',template='ab'.repeat(32),registry='component_'+'cd'.repeat(32);
let authorized=true,submitted=[],records={},wrongTemplate=false,fail=false;
const nodes={};
const $=id=>nodes[id]??(nodes[id]={value:'',textContent:'',innerHTML:'',querySelectorAll:()=>[],addEventListener(){},showModal(){},close(){},focus(){}});
const payload=()=>({verified:true,substate:{Component:{header:{template_address:wrongTemplate?'bad':template,owner_rule:'None'},body:{state:[owner,records]}}}});
const ctx=vm.createContext({$,TextEncoder,AbortSignal,INDEXER_URL:'https://indexer/',MARKET_COMPONENT_ADDRESS:active,PREVIOUS_MARKET_COMPONENT:legacy,TRUSTED_MARKET_COMPONENTS:new Set([active,legacy]),safeId:n=>Number.isSafeInteger(n)&&n>0,decodeChainValue:x=>x,render(){},setTimeout(){},setInterval(){},document:{hidden:false},isMarketplaceOwner:()=>authorized,walletConnection:{accountAddress:'owner'},pageFromHash:()=>'',setPage(){},escapeHtml:s=>String(s).replaceAll('<','&lt;'),shortAddress:s=>s,xtm:s=>String(s),toast(){},literal:x=>x,cborAddress:x=>x,cborHead:(t,x)=>x,cborText:x=>x,componentCall:(component,method,args)=>({component,method,args}),
 fetch:async()=>{if(fail)throw Error('Offline');return{ok:true,json:async()=>payload()}},
 readListingMarket:async c=>c,listingRows:(state,c)=>[{component:c,id:1,name:'A <post>',paymentAddress:'seller',active:true,price:1}],
 submitInstructions:async instructions=>{submitted.push(instructions);const i=instructions[0],key=i.args[0]+':'+i.args[1];if(i.method==='remove_post')records[key]=i.args[2];else delete records[key];}
});
let block=source.slice(source.indexOf('    // Owner-signed, shared listing visibility.'),source.indexOf('    // Enable only after publishing, validating, and configuring the seller-management contract.'));
block=block.replace(/const POST_MODERATION_COMPONENT='[^']*'/,`const POST_MODERATION_COMPONENT='${registry}'`).replace(/const POST_MODERATION_TEMPLATE='[^']*'/,`const POST_MODERATION_TEMPLATE='${template}'`);
vm.runInContext(block,ctx);
(async()=>{
 const item={marketComponent:active,chainId:1};
 assert.equal(ctx.postVisible(item),false);
 await ctx.refreshPostList();assert.equal(ctx.postVisible(item),true);
 authorized=false;ctx.openPostRemoval(0);await ctx.submitPostRemoval({preventDefault(){}});assert.equal(submitted.length,0);
 authorized=true;ctx.openPostRemoval(0);$('#removePostReason').value='Spam';await ctx.submitPostRemoval({preventDefault(){}});
 assert.equal(submitted.length,1);assert.equal(submitted[0][0].method,'remove_post');assert.equal(submitted[0][0].component,registry);assert.equal(ctx.postVisible(item),false);assert.equal(ctx.postVisible({marketComponent:legacy,chainId:1}),true);
 ctx.openPostRemoval(0);$('#removePostReason').value='Reviewed';await ctx.submitPostRemoval({preventDefault(){}});assert.equal(submitted[1][0].method,'restore_post');assert.equal(ctx.postVisible(item),true);
 wrongTemplate=true;await ctx.refreshPostRegistry();assert.equal(ctx.postVisible(item),false);wrongTemplate=false;
 for(const bad of [{...payload(),verified:false},{substate:{Component:{header:{template_address:template,owner_rule:'None'},body:{state:['attacker',{}]}}}}])assert.throws(()=>ctx.parsePostRegistry(bad));
 records={[active+':0']:'bad'};assert.throws(()=>ctx.parsePostRegistry(payload()));records={};
 await ctx.refreshPostList();ctx.openPostRemoval(0);$('#removePostReason').value='Spam';ctx.walletConnection.accountAddress='different';await ctx.submitPostRemoval({preventDefault(){}});assert.equal(submitted.length,2);
 fail=true;await ctx.refreshPostRegistry();assert.equal(ctx.postVisible(item),false);
 assert.equal(ctx.postVisible({sample:true}),true);
 assert(source.includes('await refreshPostRegistry();\n      if(!postRegistryReady||!postVisible(item))'));
 console.log('Post moderation: owner gate, removal/restoration, shared visibility, component-scoped IDs, registry identity validation, wallet changes, offline and checkout guards passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
