const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('dist/assets/app.js','utf8');
const seed=Array.from({length:6},(_,i)=>({id:i+1,sample:true,stock:1}));
const box=vm.createContext({seed,listings:[],postVisible:item=>!item.removed});
vm.runInContext(app.slice(app.indexOf('    function marketplaceListings()'),app.indexOf('    function renderMarketPagination')),box);
for(let n=0;n<=9;n++){
 const real=Array.from({length:n},(_,i)=>({id:100+i,stock:1}));
 box.listings=[...seed,...real];const items=box.marketplaceListings();
 assert.equal(items.filter(x=>x.sample).length,Math.max(0,6-n));
 assert.deepEqual(Array.from(items.slice(0,n),x=>x.id),real.map(x=>x.id));
}
// Historical deleted/sold-out/hidden rows must not displace the five remaining samples.
box.listings=[...seed,{id:100,stock:1},...Array.from({length:8},(_,i)=>({id:200+i,stock:0})),{id:300,stock:1,deleted:true},{id:301,stock:1,removed:true}];
assert.equal(box.marketplaceListings().filter(x=>x.sample).length,5);
assert.equal(box.marketplaceListings().filter(x=>!x.sample).length,1);
box.listings.find(x=>x.id===100).stock=0;
assert.equal(box.marketplaceListings().filter(x=>x.sample).length,6);
console.log('Sample catalog: one-for-one replacement, real-first ordering, historical rows and restoration passed.');
