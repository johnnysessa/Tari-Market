const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes={};const get=id=>nodes[id]??(nodes[id]={addEventListener(){},showModal(){},close(){},files:[],value:''});
const ctx=vm.createContext({document:{querySelector:get,hidden:false},setInterval(){},CATEGORIES:['Other'],TextEncoder,AbortSignal,
 listings:[],MARKET_COMPONENT_ADDRESS:'current',PREVIOUS_MARKET_COMPONENT:'previous',safeId:n=>n>0,walletConnection:{connected:false,accountAddress:''},loadDeliveryPrivateKey:async id=>id===7?{}:null,saveListings(){},render(){},fetch:async()=>({ok:true,json:async()=>({listings:{}})})});
vm.runInContext(fs.readFileSync('dist/assets/shared-media.js','utf8'),ctx);
const original='data:image/png;base64,original';const item={id:7,chainId:1,marketComponent:'current',images:[original],paymentAddress:'seller'};ctx.listings.push(item);
let uploaded=0;ctx.shareListingPhotos=async (i,images,recover)=>{assert.equal(recover,true);assert.equal(i,item);assert.equal(images[0],original);uploaded++;};
(async()=>{
 await ctx.refreshSharedMedia(true);assert.equal(uploaded,1);await ctx.refreshSharedMedia(true);assert.equal(uploaded,1); // no repeat prompts or uploads
 assert.equal(item.images[0],original);
 const manifest={component:'current',id:1,images:['/api/listing-images/'+'a'.repeat(64)],description:'Shared text',category:'Other'};
 assert.equal(ctx.applySharedPhotos(item,manifest),true);assert.equal(item.images[0],original);assert.equal(item.sharedImages[0],'https://xtm-market.johnnytsunami14.chatgpt.site'+manifest.images[0]);
 assert.equal(ctx.applySharedPhotos(item,{...manifest,id:2}),false);assert.equal(ctx.applySharedPhotos(item,{...manifest,images:['https://evil.example/x.png']}),false);
 assert.equal(ctx.sharedImageUrl('javascript:alert(1)'), '');assert.equal(ctx.sharedImageUrl('https://xtm-market.johnnytsunami14.chatgpt.site.evil/api/listing-images/'+'a'.repeat(64)), '');
 console.log('Photo client: automatic recovery with original key, no wallet requirement for recovery, deduplication, local backup preservation, listing binding and trusted image URLs passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
