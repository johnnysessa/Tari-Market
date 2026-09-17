const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dist/assets/app.js','utf8');
const code=src.slice(src.indexOf('    async function submitReceiptReview('),src.indexOf("    $('#receiptReviewForm').onsubmit=submitReceiptReview;"));
function setup(mode){
 let submits=0,refreshes=0,closed=false,rendered=0,toast='';
 const row={id:1,component:'market',buyer:'buyer',verified:true,settled:mode==='already',refunded:false};
 const nodes={};const $=id=>nodes[id]||(nodes[id]={value:id==='#receiptReviewOrder'?'1':id==='#receiptReviewStars'?'5':'Great item',textContent:'',close(){closed=true}});
 const ctx=vm.createContext({receiptReviewBusy:false,receiptReviewComponent:'market',TRUSTED_MARKET_COMPONENTS:new Set(['market']),walletConnection:{connected:true,accountAddress:'buyer'},safeId:n=>Number.isSafeInteger(n)&&n>0,$,
 paymentRows:()=>[row],paymentOwnedBy:(r,a)=>r.buyer===a,refreshPaymentCases:async()=>{refreshes++;if(mode==='switch')ctx.walletConnection.accountAddress='other';if(row.settled)ctx.orders[0].status='Released'},
 componentCall:()=>({}),literal:v=>v,cborHead:()=>0,cborText:v=>v,
 submitInstructions:async()=>{submits++;assert.equal(nodes['#receiptReviewSubmit'].disabled,true);assert.match(nodes['#receiptReviewStatus'].textContent,/Approve/);if(mode==='lost'){row.settled=true;throw Error('Timed out')}if(mode==='pending')throw Error('Still pending');return{}},
 orders:[{marketComponent:'market',chainOrderId:1,status:'In escrow'}],sellerOrders:[],saveOrderState(){},renderOrders(){rendered++},renderSellerOrders:async()=>{},toast:m=>{toast=m},refreshTrustScores:async()=>{}
 });vm.runInContext(code,ctx);return{ctx,nodes,row,run:()=>ctx.submitReceiptReview({preventDefault(){}}),stats:()=>({submits,refreshes,closed,rendered,toast})};
}
(async()=>{
 const ok=setup('success');await ok.run();assert.equal(ok.stats().submits,1);assert(ok.stats().closed);assert.equal(ok.ctx.orders[0].status,'Released');assert(ok.stats().rendered);assert.equal(ok.ctx.orders[0].review.stars,5);
 const lost=setup('lost');await lost.run();assert.equal(lost.stats().submits,1);assert(lost.stats().closed);assert.match(lost.stats().toast,/settled on-chain/);assert.equal(lost.ctx.orders[0].status,'Released');
 const already=setup('already');await already.run();assert.equal(already.stats().submits,0);assert(already.stats().closed);
 const pending=setup('pending');await pending.run();assert(!pending.stats().closed);assert.match(pending.nodes['#receiptReviewStatus'].textContent,/Still pending/);assert.equal(pending.nodes['#receiptReviewSubmit'].disabled,false);
 const seller=setup('success');seller.row.buyer='someone-else';await seller.run();assert.equal(seller.stats().submits,0);assert.match(seller.nodes['#receiptReviewStatus'].textContent,/buyer wallet/);
 const switched=setup('switch');await switched.run();assert.equal(switched.stats().submits,0);assert(!switched.stats().closed);
 const busy=setup('success');busy.ctx.receiptReviewBusy=true;await busy.run();assert.equal(busy.stats().submits,0);
 console.log('Receipt confirmation: success, lost-response reconciliation, already-settled order, inline errors, buyer ownership, wallet switch and double-click guard passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
