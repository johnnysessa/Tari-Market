    const ITEM_CONDITIONS=["New", "Like New", "Open Box", "Refurbished", "Used", "For Parts or Not Working", "Other"];
    function listingCondition(item){return ITEM_CONDITIONS.includes(item.condition)?item.condition:'Not specified';}

    const seed=[
      {id:1,name:'Nintendo Switch 2',description:'New Nintendo Switch 2 console with dock and controllers.',price:265000,shipping:9500,stock:6,category:'Gaming',sample:true,image:'assets/nintendo-switch-2.webp',alt:'A real Nintendo Switch 2 console seated in its dock',glow:'rgba(104,240,197,.2)'},
      {id:2,name:'Mac mini',description:'Compact Apple Mac mini desktop with power cable.',price:354000,shipping:7100,stock:3,category:'Computers',sample:true,image:'assets/mac-mini.webp',alt:'A real silver Mac mini held in one hand',glow:'rgba(255,184,92,.18)'},
      {id:3,name:'AMD Radeon™ RX 9070 GRE',description:'Triple-fan AMD Radeon RX 9070 GRE graphics card for a desktop gaming PC.',price:354000,shipping:10600,stock:4,category:'PC hardware',sample:true,image:'assets/amd-gpu.webp',alt:'A real AMD Radeon RX 9070 GRE triple-fan graphics card on a desk',glow:'rgba(114,143,255,.2)'},
      {id:4,name:'Sony BRAVIA 8 II 77" OLED TV',description:'Sony 77-inch BRAVIA 8 II OLED 4K smart TV with a slim tabletop stand.',price:768000,shipping:70800,stock:5,category:'Home theater',sample:true,image:'assets/sony-large-screen-tv.webp',alt:'A real Sony BRAVIA 8 II OLED television in a living room',glow:'rgba(104,240,197,.2)'},
      {id:5,name:'iPhone 18 Pro Max',description:'Large-screen iPhone 18 Pro Max in Apple’s burgundy finish.',price:649000,shipping:7100,stock:2,category:'Phones',sample:true,image:'assets/iphone-18-plus.webp',alt:'Apple iPhone 18 Pro and iPhone 18 Pro Max in burgundy',glow:'rgba(255,184,92,.18)'},
      {id:6,name:'PlayStation 5 Pro',description:'PlayStation 5 Pro console with a wireless controller.',price:443000,shipping:14200,stock:7,category:'Gaming',sample:true,image:'assets/playstation-5-pro.webp',alt:'A real PlayStation 5 Pro console with a DualSense controller',glow:'rgba(114,143,255,.2)'}
    ];
    const catalogImages={
      1:{src:'assets/nintendo-switch-2.webp',alt:'A real Nintendo Switch 2 console seated in its dock'},
      2:{src:'assets/mac-mini.webp',alt:'A real silver Mac mini held in one hand'},
      3:{src:'assets/amd-gpu.webp',alt:'A real AMD Radeon RX 9070 GRE triple-fan graphics card on a desk'},
      4:{src:'assets/sony-large-screen-tv.webp',alt:'A real Sony BRAVIA 8 II OLED television in a living room'},
      5:{src:'assets/iphone-18-plus.webp',alt:'Apple iPhone 18 Pro and iPhone 18 Pro Max in burgundy'},
      6:{src:'assets/playstation-5-pro.webp',alt:'A real PlayStation 5 Pro console with a DualSense controller'}
    };
    const sampleReviews={
      1:[{stars:5,comment:'Console arrived exactly as described and was packed securely.'},{stars:5,comment:'Fast shipping and clear updates throughout the sale.'},{stars:5,comment:'Everything was sealed and the serial number matched the listing.'},{stars:4,comment:'Good transaction. Shipping took one extra day, but the seller kept me updated.'}],
      2:[{stars:5,comment:'The Mac mini was in excellent condition and setup was easy.'},{stars:4,comment:'Accurate listing and careful packaging.'},{stars:5,comment:'Seller answered my questions before purchase and shipped the next morning.'}],
      3:[{stars:5,comment:'GPU passed every test and matched the photos.'},{stars:5,comment:'Very well protected for shipping and no damage to the box.'},{stars:5,comment:'Card runs quietly and the seller included the original accessories.'},{stars:4,comment:'Works as expected. Communication could have been a little faster.'},{stars:5,comment:'Smooth sale from checkout through delivery.'}],
      4:[{stars:5,comment:'Seller coordinated delivery well and the TV arrived safely.'},{stars:4,comment:'Picture quality is excellent. Delivery scheduling took a little longer than expected.'}],
      5:[{stars:5,comment:'Responsive seller and the phone was exactly as listed.'},{stars:5,comment:'Battery health and condition matched the description.'},{stars:5,comment:'Quick shipment, secure packaging, and no activation issues.'}],
      6:[{stars:5,comment:'Console was clean, complete, and shipped quickly.'},{stars:4,comment:'Good communication and secure packaging.'},{stars:5,comment:'Exactly as pictured and the controller works perfectly.'},{stars:4,comment:'Solid transaction. Tracking was added a day after shipment.'}]
    };
    const sampleSellerUsernames={1:'pixel_trader',2:'orchard_tech',3:'frame_chaser',4:'cinema_corner',5:'pocket_gadgets',6:'console_cove'};
    function sampleSellerName(itemId){return '@'+(sampleSellerUsernames[itemId]||'demo_shop')}
    function sampleTrustFor(itemId){const reviews=sampleReviews[itemId]||[],totalStars=reviews.reduce((total,review)=>total+review.stars,0);return{score:reviews.length?totalStars/reviews.length:0,count:reviews.length}}
    function readStored(key,fallback){try{const value=JSON.parse(localStorage.getItem(key)||'null');return value??fallback}catch{return fallback}}
    function storedRows(key,validate){const rows=readStored(key,[]);return Array.isArray(rows)?rows.filter(row=>row&&typeof row==='object'&&validate(row)).slice(0,1000):[]}
    const safeId=value=>Number.isSafeInteger(value)&&value>0;
    function safeStoredListing(item){return safeId(item.id)&&Number.isSafeInteger(item.stock)&&item.stock>=0&&Number.isFinite(item.price)&&item.price>0&&Number.isFinite(item.shipping)&&item.shipping>=0&&(!item.chainId||safeId(item.chainId))}
    function safeStoredOrder(order){return typeof order.id==='string'&&order.id.length<=100&&(!order.chainOrderId||safeId(order.chainOrderId))&&Number.isFinite(order.xtm)&&order.xtm>=0}
    const savedListings=storedRows('xtm-market-listings',safeStoredListing);
    const savedCatalogStock=new Map((savedListings||[]).filter(item=>seed.some(product=>product.id===item.id)).map(item=>[item.id,item.stock]));
    const savedCommunityListings=(savedListings||[]).filter(item=>!seed.some(product=>product.id===item.id)).map(item=>({...item,inventoryVerified:false}));
    let listings=[...savedCommunityListings,...seed.map(item=>({...item,stock:savedCatalogStock.get(item.id)??item.stock}))];
    let orders=storedRows('xtm-market-orders',safeStoredOrder),sellerOrders=storedRows('xtm-market-seller-orders',safeStoredOrder),scrubbedOrderDetails=false;
    for(const order of orders){if('shippingName' in order||'shippingAddress' in order){delete order.shippingName;delete order.shippingAddress;scrubbedOrderDetails=true}}
    if(scrubbedOrderDetails)localStorage.setItem('xtm-market-orders',JSON.stringify(orders));
    let selected=null,selectedQuote=null,deadline=0,timerHandle,currentMarketPage=1;
    const PAGE_SIZE_OPTIONS=[8,16,24,32,64,128];
    const savedPageSize=Number(readStored('xtm-market-page-size',8));
    let itemsPerPage=PAGE_SIZE_OPTIONS.includes(savedPageSize)?savedPageSize:8;
    let walletConnection={connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',account:null,session:null,client:null,capabilities:null};
    const WALLETCONNECT_PROJECT_ID='5716089763e762b10c0c252a853a7ae4';
    const WALLETCONNECT_CHAIN='tari:devnet';
    const INDEXER_URL='https://ootle-indexer-a.tari.com/';
    let roleRefreshSequence=0;
    let sellerTrustScores=new Map(),sellerReviews=[],trustRatingsReady=false,reviewCommentsReady=false;
    const $=s=>document.querySelector(s);
    const pageIds={posts:'removePostsView',myitems:'myItemsView',fee:'feeView',checkout:'checkoutView',cases:'paymentCasesView',disputes:'disputesView',escrow:'escrowView',categories:'categoriesView',market:'marketView',recent:'recentView',received:'receivedView',moderation:'moderationView'};
    const MARKET_OWNER_ACCOUNT='component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c';
    let adminRoles=new Map(),adminRolesReady=false,adminRolesCheckedAt=0,adminRoleBusy=false;
    function isMarketplaceOwner(){return walletConnection.connected&&String(walletConnection.accountAddress||'').toLowerCase()===MARKET_OWNER_ACCOUNT}
    function isMarketplaceAdmin(){return isMarketplaceOwner()||(walletConnection.connected&&adminRolesReady&&Date.now()-adminRolesCheckedAt<60000&&adminRoles.has(String(walletConnection.accountAddress||'').toLowerCase()))}
    function canModerateComponent(component){return component===MARKET_COMPONENT_ADDRESS?isMarketplaceAdmin():isMarketplaceOwner()}
    function renderAdminManagement(){
      const section=$('#adminManagement');section.hidden=!isMarketplaceAdmin();
      $('#adminRoleStatus').textContent=adminRolesReady?'Admins can resolve payment and review disputes, and add or revoke other admins. The original owner cannot be removed. Escrow destinations cannot be changed by admins.':'Admin setup requires activation of the admin-enabled contract upgrade.';
      $('#adminRoleFields').disabled=!isMarketplaceAdmin()||!adminRolesReady||adminRoleBusy;
      $('#adminRoleList').innerHTML=isMarketplaceAdmin()&&adminRolesReady?[...adminRoles].map(([address,key])=>`<article class="review-card"><div class="profile-wallet">${escapeHtml(address)}</div><p class="profile-wallet">Public signing key: ${escapeHtml(key)}</p><button type="button" class="button small danger" data-revoke-admin="${escapeHtml(address)}" ${adminRoleBusy?'disabled':''}>Revoke admin</button></article>`).join('')||'<p>No additional admins.</p>':'';
      section.querySelectorAll('[data-revoke-admin]').forEach(button=>button.onclick=()=>changeAdmin('revoke_admin',button.dataset.revokeAdmin));
    }
    async function changeAdmin(method,address,key=''){
      if(adminRoleBusy||!isMarketplaceAdmin()||!adminRolesReady)return;
      const account=walletConnection.accountAddress;adminRoleBusy=true;renderAdminManagement();
      try{
        await refreshTrustScores();
        if(account!==walletConnection.accountAddress||!isMarketplaceAdmin()||!adminRolesReady)throw new Error('Admin access could not be verified. Reconnect and refresh.');
        const args=[literal(cborAddress(address,128))];if(method==='grant_admin')args.push(literal(cborText(key)));
        await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,method,args)],method==='grant_admin'?`Grant admin access to ${address}\nPublic signing key: ${key}\nThis key can resolve escrow disputes and appoint other admins.`:`Revoke admin access for ${address}`);
        adminRolesReady=false;adminRoles.clear();renderWalletState();
        await refreshTrustScores();if(method==='grant_admin')$('#adminRoleForm').reset();toast('Admin transaction completed. Permissions refreshed.');
      }catch(error){toast(error.message||'Admin update was not approved')}finally{adminRoleBusy=false;renderAdminManagement()}
    }
    function pageFromHash(){return location.hash==='#remove-posts'?'posts':location.hash==='#my-items'?'myitems':location.hash==='#marketplace-fee'?'fee':location.hash==='#checkout'?'checkout':location.hash==='#refunds-disputes'?'cases':location.hash==='#disputes-refunds'?'disputes':location.hash==='#ootle-escrow'?'escrow':location.hash==='#categories'?'categories':location.hash==='#recent-orders'?'recent':location.hash==='#orders-received'?'received':location.hash==='#moderation'?'moderation':'market'}
    function setPage(page,updateHash=true){
      const requested=page==='checkout'&&!selected?'market':pageIds[page]?page:'market',next=(requested==='moderation'&&!isMarketplaceAdmin()||requested==='posts'&&!isMarketplaceOwner())?'market':requested;
      if(requested==='moderation'&&next==='market')history.replaceState(null,'',location.pathname+location.search);
      for(const [name,id] of Object.entries(pageIds))document.getElementById(id).hidden=name!==next;
      document.querySelectorAll('[data-page]').forEach(button=>{const active=button.dataset.page===next;button.classList.toggle('active',active);active?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current')});
      if(updateHash){const hash=next==='posts'?'#remove-posts':next==='myitems'?'#my-items':next==='fee'?'#marketplace-fee':next==='checkout'?'#checkout':next==='cases'?'#refunds-disputes':next==='disputes'?'#disputes-refunds':next==='escrow'?'#ootle-escrow':next==='categories'?'#categories':next==='market'?'':next==='recent'?'#recent-orders':next==='received'?'#orders-received':'#moderation';history.replaceState(null,'',location.pathname+location.search+hash)}
      $('#'+(next==='checkout'?'checkoutPaymentHost':'marketCheckoutHost')).appendChild(document.querySelector('.checkout'));
      if(next==='cases'){renderPaymentCases();refreshPaymentCases()}
      if(next==='posts')refreshPostList();
      if(next==='myitems')refreshMyItems();
      if(next==='recent'){renderOrders();refreshPaymentCases().then(renderOrders)}
      if(next==='received'){renderSellerOrders();refreshPaymentCases().then(renderSellerOrders)}
      if(next==='moderation'){renderModeration();renderPaymentCases();refreshPaymentCases();refreshTrustScores()}
      scrollTo({top:0,behavior:'smooth'})
    }
    // New listings use v0.12; existing orders retain their original component.
    const MARKET_COMPONENT_ADDRESS='component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938';
    const PREVIOUS_MARKET_COMPONENT='component_1bf64f1ee50461e47dba27d7b24326f356f30121f10c16a60eb91c2ced275a9c';
    const ITEM_PRICE_FEE_READY=true;
    const SECURITY_UPGRADE_READY=true;
    const TRUSTED_MARKET_COMPONENTS=new Set([MARKET_COMPONENT_ADDRESS,PREVIOUS_MARKET_COMPONENT,'component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9','component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15']);
    const newPurchasesReady=()=>Boolean(MARKET_COMPONENT_ADDRESS)&&ITEM_PRICE_FEE_READY&&SECURITY_UPGRADE_READY&&SELLER_USERNAMES_READY;
    const MAX_TRANSACTION_FEE=50000;
    const ESMERALDA_NETWORK_BYTE=38;
    const PRICE_URL='https://api.coingecko.com/api/v3/simple/price?ids=minotari&vs_currencies=usd&include_last_updated_at=true';
    const bundledRates={xtmUsd:0.00169228,updatedAt:1789299790000};
    const storedRates=readStored('xtm-market-live-rates',null),cachedRates=storedRates&&Number.isFinite(storedRates.xtmUsd)&&storedRates.xtmUsd>0?storedRates:null;
    let marketRates=cachedRates||bundledRates;
    const xtmRate=()=>marketRates.xtmUsd;
    function values(item){const itemXtm=Number(item.price)||0,shippingXtm=Number(item.shipping)||0,totalXtm=itemXtm+shippingXtm;return{itemXtm,shippingXtm,totalXtm,itemUsd:itemXtm*xtmRate(),usd:totalXtm*xtmRate(),xtm:totalXtm}}
    function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}
    function xtm(n){return n.toLocaleString(undefined,{maximumFractionDigits:6})+' tTari'}
    function decodeChainValue(value){
      if(!value||typeof value!=='object')return value;
      if(value['@cbor']==='tag'){const decoded=decodeChainValue(value.value),prefix={128:'component_',131:'resource_',132:'vault_'}[value.tag];return prefix&&typeof decoded==='string'&&/^[0-9a-f]{64}$/i.test(decoded)?prefix+decoded.toLowerCase():decoded}
      if(value['@cbor']==='bytes')return value.hex;
      if(value['@cbor']==='map'&&Array.isArray(value.entries))return Object.fromEntries(value.entries.map(([key,item])=>[String(decodeChainValue(key)),decodeChainValue(item)]));
      if(Array.isArray(value))return value.map(decodeChainValue);
      return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,decodeChainValue(item)]));
    }
    async function verifyActiveMarket(){
      const response=await fetch(`${INDEXER_URL}substates/${MARKET_COMPONENT_ADDRESS}?local_search_only=false`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Cannot verify the Esmeralda marketplace. Try again.');
      const payload=await response.json(),component=payload?.substate?.Component,state=decodeChainValue(component?.body?.state);
      if(payload.verified!==true||component?.header?.template_address!=='ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a'||component?.header?.owner_rule!=='None'||!Array.isArray(state)||state.length!==15||state[0]!=='resource_0101010101010101010101010101010101010101010101010101010101010101'||state[1]!==MARKET_OWNER_ACCOUNT||state[10]!=='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828')throw new Error('Marketplace configuration could not be verified. Transaction stopped.');
    }
    function firstAddress(value){
      if(value&&typeof value==='object'&&value['@cbor'])return firstAddress(decodeChainValue(value));
      if(typeof value==='string')return value;
      if(!value||typeof value!=='object')return '';
      for(const key of ['address','component_address','account_address']){
        const found=firstAddress(value[key]);if(found)return found
      }
      for(const child of Object.values(value)){const found=firstAddress(child);if(found&&/^(component_|account_|[0-9a-f]{32})/i.test(found))return found}
      return ''
    }
    const SELLER_USERNAMES_READY=true;
    let sellerUsernames=new Map(),usernameOwners=new Map(),usernameListings=new Map(),usernameRegistryReady=false;
    function normalizeSellerUsername(value){const name=String(value||'').trim().toLowerCase();return /^[a-z0-9_]{3,24}$/.test(name)&&!['admin','administrator','owner','support','xtm_market','tari','ootle'].includes(name)?name:''}
    function sellerIdentity(item){const row=usernameListings.get(item.marketComponent+':'+item.chainId);return row&&row.address===String(item.paymentAddress||'').toLowerCase()?'@'+(row.name==='taritom'?'TariTom':row.name):shortAddress(item.paymentAddress||'Seller wallet pending')}
    function refreshUsernameRegistry(state){
      sellerUsernames=new Map();usernameOwners=new Map();usernameListings=new Map();usernameRegistryReady=false;
      if(!SELLER_USERNAMES_READY||!Array.isArray(state)||state.length!==15||!state[13]||!state[14])return;
      for(const [key,name] of Object.entries(state[13]))if(/^[0-9a-f]{64}$/.test(key)&&normalizeSellerUsername(name)===name&&state[14][name]===key){sellerUsernames.set(key,name);usernameOwners.set(name,key)}
      for(const [id,row] of Object.entries(state[3]||{})){const raw=reviewField(row,6,'seller'),signer=typeof raw==='string'?raw.toLowerCase():Array.isArray(raw)&&raw.length===32&&raw.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?raw.map(n=>n.toString(16).padStart(2,'0')).join(''):'';const name=sellerUsernames.get(signer),address=paymentAddress(reviewField(row,5,'seller_payment_address'));if(name)usernameListings.set(MARKET_COMPONENT_ADDRESS+':'+String(reviewField(row,0,'id')??id),{name,address})}
      usernameRegistryReady=true;
    }
    function updateUsernameStatus(){
      const input=$('#sellerUsername'),status=$('#sellerUsernameStatus');if(!input||!status)return;
      const name=normalizeSellerUsername(input.value);
      $('#sellerUsernameHelp').textContent='Choose once for your Tari wallet. 3–24 letters, numbers, or underscores. Names ignore capitalization and are reserved when your first listing is approved.'+(SELLER_USERNAMES_READY?'':' Username registration will open with the marketplace upgrade.');
      status.textContent=!input.value?'':!name?'Use 3–24 letters, numbers, or underscores; official names are reserved.':!usernameRegistryReady?'Availability will be checked on Ootle when registration opens.':usernameOwners.has(name)?'This name is registered. Only its original wallet can use it.':'This name appears available. Your wallet transaction reserves it.';
    }
    function shortAddress(address){return address.length>22?address.slice(0,11)+'…'+address.slice(-8):address}
    function trustRecord(address){return sellerTrustScores.get(String(address||'').toLowerCase())||null}
    function trustLabel(address){if(!trustRatingsReady)return'Trust pending upgrade';const trust=trustRecord(address);return trust?.ratingCount?`${(trust.totalStars/trust.ratingCount).toFixed(1)} ★ · ${trust.ratingCount} verified ${trust.ratingCount===1?'review':'reviews'}`:'New seller'}
    function readTrustValue(value){
      const total=Number(Array.isArray(value)?value[0]:value?.total_stars??value?.totalStars),count=Number(Array.isArray(value)?value[1]:value?.rating_count??value?.ratingCount);
      return Number.isFinite(total)&&Number.isInteger(count)&&count>0?{totalStars:total,ratingCount:count}:null
    }
    function reviewField(value,index,...names){if(Array.isArray(value))return value[index];for(const name of names)if(value&&value[name]!==undefined)return value[name];return undefined}
    function readReviewValue(value,key){
      const orderId=Number(reviewField(value,0,'order_id','orderId')??String(key).match(/\d+/)?.[0]),sellerAddress=firstAddress(reviewField(value,1,'seller_payment_address','sellerPaymentAddress')),stars=Number(reviewField(value,2,'stars')),comment=String(reviewField(value,3,'comment')??''),epoch=Number(reviewField(value,4,'created_epoch','createdEpoch')??0),disputed=Boolean(reviewField(value,5,'disputed')),reason=String(reviewField(value,6,'dispute_reason','disputeReason')??''),removed=Boolean(reviewField(value,7,'removed')),note=String(reviewField(value,8,'moderation_note','moderationNote')??'');
      return Number.isInteger(orderId)&&orderId>0&&sellerAddress&&Number.isInteger(stars)?{orderId,sellerAddress,stars,comment,epoch,disputed,reason,removed,note,automatic:reviewField(value,9,'automatic')===true}:null
    }
    function reviewsForSeller(address){
      const normalized=String(address||'').toLowerCase(),chain=sellerReviews.filter(review=>!review.removed&&review.sellerAddress.toLowerCase()===normalized),local=orders.filter(order=>order.review&&String(order.sellerAddress||'').toLowerCase()===normalized&&!chain.some(review=>review.orderId===order.chainOrderId)).map(order=>({orderId:order.chainOrderId,sellerAddress:order.sellerAddress,stars:order.review.stars,comment:order.review.comment,epoch:0,disputed:false,reason:'',removed:false,note:'',local:true}));return[...chain,...local]
    }
    async function refreshTrustScores(){
      const sequence=++roleRefreshSequence;
      try{
        const response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(MARKET_COMPONENT_ADDRESS)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error();
        const payload=await response.json();if(payload.verified!==true)throw new Error('Unverified marketplace');
        const state=decodeChainValue(payload?.substate?.Component?.body?.state);
        let legacy=null;try{legacy=await readListingMarket(PREVIOUS_MARKET_COMPONENT)}catch{}
        if(sequence!==roleRefreshSequence)return;
        adminRolesReady=Array.isArray(state)&&state.length>=12&&typeof state[10]==='string'&&Boolean(state[11])&&typeof state[11]==='object';
        adminRoles=new Map(adminRolesReady?Object.entries(state[11]).filter(([address,key])=>/^component_[0-9a-f]{64}$/i.test(address)&&/^[0-9a-f]{64}$/i.test(key)).map(([address,key])=>[address.toLowerCase(),key.toLowerCase()]):[]);adminRolesCheckedAt=Date.now();
        trustRatingsReady=Array.isArray(state)&&state.length>=9;
        reviewCommentsReady=Array.isArray(state)&&state.length>=10;
        const next=new Map(),ratings=trustRatingsReady?state[5]:null;
        if(ratings&&typeof ratings==='object')for(const [key,value] of Object.entries(ratings)){const address=(key.match(/component_[0-9a-f]{64}/i)||[])[0],record=readTrustValue(value);if(address&&record)next.set(address.toLowerCase(),record)}
        const nextReviews=[],reviews=reviewCommentsReady?state[7]:null;
        if(reviews&&typeof reviews==='object')for(const [key,value] of Object.entries(reviews)){const review=readReviewValue(value,key);if(review)nextReviews.push(review)}
        refreshUsernameRegistry(state);if(legacy)addLegacyUsernames(legacy);syncMarketListings(state,legacy);sellerTrustScores=next;sellerReviews=nextReviews
      }catch{if(sequence!==roleRefreshSequence)return;for(const item of listings)if(item.chainId)item.inventoryVerified=false;refreshUsernameRegistry(null);adminRolesReady=false;adminRoles.clear();trustRatingsReady=false;reviewCommentsReady=false;sellerTrustScores=new Map();sellerReviews=[]}
      updateUsernameStatus();render();renderSellerTrust();renderModeration();void refreshSharedMedia()
    }
    function renderSellerTrust(){
      const panel=$('#sellerTrustPanel'),list=$('#sellerReviewList');if(!panel)return;
      if(!walletConnection.connected){panel.innerHTML='<strong>Connect a Tari wallet to view its seller trust score.</strong><span>Ratings are tied to the seller\'s Ootle account address.</span>';if(list)list.innerHTML='';return}
      if(!reviewCommentsReady){panel.innerHTML='<strong>Seller reviews upgrade pending</strong><span>Automatic feedback is pending activation: an undisputed sale claimed after the 14-day purchase window receives 5 stars and “Sale Satisfactory” if the buyer has not reviewed it.</span>';if(list)list.innerHTML='';return}
      panel.innerHTML=`<strong>${escapeHtml(trustLabel(walletConnection.accountAddress))}</strong><span>Wallet-bound seller trust for ${escapeHtml(shortAddress(walletConnection.accountAddress))}. Buyers can leave one verified rating and comment per completed, non-refunded order.</span>`;
      if(list){const reviews=reviewsForSeller(walletConnection.accountAddress);list.innerHTML=reviews.length?`<div class="buyer-title">Public feedback</div>${reviews.map(review=>`${reviewCard(review)}${review.disputed?'<div class="moderation-note">Owner review pending.</div>':`<div class="order-actions"><button class="button small danger" data-dispute-review="${review.orderId}">Dispute rating or comment</button></div>`}`).join('')}`:'<div class="none">No verified buyer feedback yet.</div>';list.querySelectorAll('[data-dispute-review]').forEach(button=>button.onclick=()=>openReviewDispute(Number(button.dataset.disputeReview)))}
    }
    function safeImageSrc(src){if(typeof sharedImageUrl==='function'){const shared=sharedImageUrl(src);if(shared)return shared;}if(typeof src!=='string'||src.length>8*1024*1024)return '';return /^(?:assets\/[a-z0-9][a-z0-9.-]*\.(?:webp|png|jpe?g)|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/i.test(src)?src:''}
    function listingImages(item){const images=Array.isArray(item.sharedImages)&&item.sharedImages.length?item.sharedImages:Array.isArray(item.images)?item.images:[];return(images.length?images:[item.image]).map(safeImageSrc).filter(Boolean).slice(0,8)}
    function bytesToBase64(bytes){let binary='';for(const byte of new Uint8Array(bytes))binary+=String.fromCharCode(byte);return btoa(binary)}
    function base64ToBytes(value){const binary=atob(value),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes}
    function deliveryKeyStore(mode,action){return new Promise((resolve,reject)=>{const request=indexedDB.open('xtm-market-private-keys',1);request.onupgradeneeded=()=>request.result.createObjectStore('delivery');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('delivery',mode),operation=action(tx.objectStore('delivery'));let result;operation.onsuccess=()=>{result=operation.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error||new Error('Key storage failed'))}}})}
    async function generateDeliveryKeyPair(listingId){
      if(!window.crypto?.subtle)throw new Error('Secure key generation is unavailable in this browser.');
      const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['encrypt','decrypt']);
      const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);
      await deliveryKeyStore('readwrite',store=>store.put(pair.privateKey,String(listingId)));
      return JSON.stringify(publicKey)
    }
    async function loadDeliveryPrivateKey(listingId){
      const existing=await deliveryKeyStore('readonly',store=>store.get(String(listingId)));if(existing)return existing;
      const keyring=readStored('xtm-market-delivery-keys',{}),backup=keyring[String(listingId)];if(!backup?.privateKey)return null;
      const key=await crypto.subtle.importKey('jwk',backup.privateKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);
      await deliveryKeyStore('readwrite',store=>store.put(key,String(listingId)));
      delete backup.privateKey;localStorage.setItem('xtm-market-delivery-keys',JSON.stringify(keyring));return key;
    }
    async function encryptDeliveryDetails(publicKeyText,details){
      if(!publicKeyText)throw new Error('This seller has not configured encrypted delivery.');
      if(!window.crypto?.subtle)throw new Error('Secure checkout encryption is unavailable in this browser.');
      let jwk;try{jwk=JSON.parse(publicKeyText)}catch{throw new Error('The seller delivery key is invalid.')}
      try{
        const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
        const contentKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
        const plaintext=new TextEncoder().encode(JSON.stringify({name:details.name,address:details.address}));
        const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},contentKey,plaintext),rawKey=await crypto.subtle.exportKey('raw',contentKey);
        const wrappedKey=await crypto.subtle.encrypt({name:'RSA-OAEP'},publicKey,rawKey);
        return JSON.stringify({version:1,algorithm:'RSA-OAEP-256+A256GCM',wrappedKey:bytesToBase64(wrappedKey),iv:bytesToBase64(iv),ciphertext:bytesToBase64(ciphertext)})
      }catch(error){if(error.message?.includes('seller'))throw error;throw new Error('The seller delivery key could not encrypt this order.')}
    }
    async function decryptSellerDelivery(sale){
      try{
        const privateKey=await loadDeliveryPrivateKey(sale.listingId);if(!privateKey)return null;
        if(typeof sale.encryptedDelivery!=='string'||sale.encryptedDelivery.length>8192)return null;
        const payload=JSON.parse(sale.encryptedDelivery);
        if(payload.version!==1||payload.algorithm!=='RSA-OAEP-256+A256GCM')return null;
        const rawKey=await crypto.subtle.decrypt({name:'RSA-OAEP'},privateKey,base64ToBytes(payload.wrappedKey));
        const contentKey=await crypto.subtle.importKey('raw',rawKey,{name:'AES-GCM'},false,['decrypt']);
        const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(payload.iv)},contentKey,base64ToBytes(payload.ciphertext));
        const details=JSON.parse(new TextDecoder().decode(plaintext));
        return details&&typeof details.address==='string'&&details.address.length<=1500&&(!details.name||typeof details.name==='string'&&details.name.length<=100)?details:null;
      }catch{return null}
    }
    function saveListings(){
      try{localStorage.setItem('xtm-market-listings',JSON.stringify(listings));return true}
      catch{toast('These photos are too large to save in this browser');return false}
    }
    function prepareListingImage(file){
      return new Promise((resolve,reject)=>{
        if(!file||!file.size){resolve('');return}
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)){reject(new Error('Choose a JPG, PNG, or WebP image.'));return}
        if(file.size>5*1024*1024){reject(new Error('Choose an image smaller than 5 MB.'));return}
        const reader=new FileReader();
        reader.onerror=()=>reject(new Error('That picture could not be read.'));
        reader.onload=()=>{
          const image=new Image();
          image.onerror=()=>reject(new Error('That picture could not be opened.'));
          image.onload=()=>{
            const scale=Math.min(1,1200/image.width,900/image.height),canvas=document.createElement('canvas');
            canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
            canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
            resolve(canvas.toDataURL('image/webp',.82))
          };
          image.src=reader.result
        };
        reader.readAsDataURL(file)
      })
    }
    async function prepareListingImages(files){const prepared=[];for(const file of files)prepared.push(await prepareListingImage(file));return prepared.filter(Boolean)}
    const walletPreferenceKey='xtm-market-wallet-preference-v1';
    let browserUnlockPending=false;
    function savedBrowserWallet(){try{const value=JSON.parse(localStorage.getItem('xtm-market-esmeralda-wallet-v1')||'null');return value?.version===1&&['salt','iv','cipher'].every(key=>typeof value[key]==='string'&&value[key].length>0)}catch{return false}}
    function walletPreference(){try{return localStorage.getItem(walletPreferenceKey)||''}catch{return ''}}
    function rememberWalletPreference(method){browserUnlockPending=false;try{localStorage.setItem(walletPreferenceKey,method)}catch{}}
    function defaultWalletMethod(){
      if(walletConnection.connected)return walletConnection.transport==='testnet'?'testnet':walletConnection.transport==='window.tari'?'provider':walletConnection.transport==='local'?'local':'walletconnect';
      if(window.xtmLocalWallet?.available)return 'local';
      const preference=walletPreference();
      if(savedBrowserWallet()&&(!preference||preference==='testnet'||preference==='disconnected'))return 'testnet';
      if(preference==='walletconnect')return 'walletconnect';
      return hasAvailableTariProvider()?'provider':globalThis.location?.origin==='https://tari-market.johnnytsunami14.chatgpt.site'?'walletconnect':'testnet';
    }
    function openWalletConnection(method=defaultWalletMethod()){
      browserUnlockPending=false;
      $('#walletConnectionMethod').value=method;
      renderWalletConnectionChoice();
      $('#disconnectWallet').hidden=!walletConnection.connected&&!window.xtmLocalWallet?.rememberedAccount?.();
      $('#connectWallet').hidden=walletConnection.connected;
      $('#walletError').classList.remove('show');
      if(!$('#walletDialog').open)$('#walletDialog').showModal();
      if(method==='testnet'&&!walletConnection.connected)$('#testWalletPassword').focus({preventScroll:true});
    }
    function promptSavedBrowserWallet(){
      if(!browserUnlockPending||walletConnection.connected||document.hidden||document.querySelector('dialog[open]'))return;
      openWalletConnection('testnet');
    }
    let testWalletModulePromise;
    function testWalletModule(){return testWalletModulePromise||(testWalletModulePromise=import('./test-wallet/wallet.js').catch(error=>{testWalletModulePromise=null;throw error}))}
    async function finishTestWallet(){
      if(!savedBrowserWallet()&&!$('#testWalletConsent').checked)throw new Error('Confirm that you want to create a test-only wallet and request test funds.');
      const wasSaved=savedBrowserWallet();
      const password=$('#testWalletPassword').value;$('#testWalletPassword').value='';
      const test=await testWalletModule();
      $('#testWalletStatus').textContent='Unlocking your encrypted test wallet…';
      await test.unlock(password);
      rememberWalletPreference('testnet');
      let account=await test.connectAccount($('#testWalletAccount').value);
      if(!account.account){if(wasSaved&&!window.confirm('This browser wallet has not completed setup. Request 1,000 tTari (less up to 0.3 tTari in fees), or check its pending funding transaction?'))throw new Error('Test funding cancelled. Your wallet remains saved.');$('#testWalletStatus').textContent='Creating your Esmeralda account and requesting 1,000 tTari…';account=await test.fundNewWallet();}
      $('#testWalletReceiveAddress').value=account.address;$('#testWalletReceive').hidden=false;
      if(!account.account)throw new Error('Your account is not confirmed yet. Unlock again to check funding.');
      walletConnection={...walletConnection,connected:true,transport:'testnet',accountAddress:account.account,walletAddress:account.address,network:'esmeralda',networkByte:38,account:{component_address:account.account,owner_key_id:'browser-testnet'},session:null,capabilities:null};
      $('#walletDialog').close();renderWalletState();renderSellerOrders();refreshTrustScores().catch(()=>{});toast('Esmeralda test wallet connected');
      test.balance().then(amount=>{$('#testWalletStatus').textContent=`Balance: ${amount.toLocaleString()} tTari`}).catch(()=>{$('#testWalletStatus').textContent='Connected to Esmeralda. Balance is temporarily unavailable.'});
    }
    function hasAvailableTariProvider(){const provider=window.tari;return typeof provider?.request==='function'&&provider.isAvailable!==false&&(!(provider===window.tariUniverse||provider.info?.rdns==='mw.tari.universe')||provider.isEmbedded===true)}
    function renderWalletConnectionChoice(){
      const select=$('#walletConnectionMethod'),available=hasAvailableTariProvider();
      select.querySelector('option[value="provider"]').disabled=!available;
      const localOption=select.querySelector('option[value="local"]');localOption.hidden=!window.xtmLocalWallet?.available;localOption.disabled=!window.xtmLocalWallet?.available;
      if(select.value==='local'&&!window.xtmLocalWallet?.available)select.value='walletconnect';
      if(!available&&select.value==='provider')select.value=window.xtmLocalWallet?.available?'local':'walletconnect';
      const embedded=select.value==='provider',local=select.value==='local';
      const saved=savedBrowserWallet();
      $('#walletDialogTitle').textContent=select.value==='testnet'?(walletConnection.connected?'Browser test wallet':saved?'Unlock your browser test wallet':'Create a browser test wallet'):'Connect Tari wallet';
      $('#testWalletConsentLabel').hidden=saved;
      $('#testWalletPassword').autocomplete=saved?'current-password':'new-password';
      if(!$('#connectWallet').disabled)$('#connectWallet').textContent=select.value==='testnet'?(saved?'Unlock wallet':'Create wallet & get test funds'):'Connect wallet';
      $('#testWalletInstructions').hidden=select.value!=='testnet';
      $('#testWalletUnlockFields').hidden=walletConnection.connected;
      $('#testWalletRestore').disabled=walletConnection.connected||$('#connectWallet').disabled;
      $('#testWalletPassword').disabled=select.value!=='testnet'||walletConnection.connected;
      $('#walletConnectInstructions').hidden=select.value!=='walletconnect'||walletConnection.connected;
      $('#localWalletInstructions').hidden=select.value!=='local'||walletConnection.connected;
      $('#localLauncherSetup').hidden=Boolean(window.xtmLocalWallet?.available);
      $('#localLauncherReady').hidden=!window.xtmLocalWallet?.available;
      $('#walletDialogSubtitle').textContent=walletConnection.connected?`Connected through ${walletConnection.transport==='testnet'?'Esmeralda browser test wallet':walletConnection.transport==='local'?'local Asset Vault':walletConnection.transport==='window.tari'?'Tari browser wallet':'WalletConnect'}.`:select.value==='testnet'?(saved?'Your saved wallet was found. Enter its password to unlock and reconnect.':'Create your wallet here and receive test funds. No recovery phrase required.'):embedded?'Approve access in your Tari Universe or browser wallet.':local?'Use Asset Vault on this Mac with the local test launcher.':'Use a wallet that supports Tari Esmeralda WalletConnect sessions.';
      select.disabled=walletConnection.connected||$('#connectWallet').disabled;
    }
    let localReconnectBusy=false,localReconnectGeneration=0;
    async function readLocalWalletAccount(){
      if(!window.xtmLocalWallet?.available)throw new Error('Download and run the local launcher below, then open http://localhost:5180.');
      const info=await window.xtmLocalWallet.request('tari_getWalletInfo');
      if(info.network_byte!==38||String(info.network).toLowerCase()!=='esmeralda')throw new Error('Switch Asset Vault to Esmeralda.');
      const response=await window.xtmLocalWallet.request('tari_getDefaultAccount'),account=response?.account||response;
      if(!/^component_[0-9a-f]{64}$/i.test(account?.component_address||'')||!account.owner_key_id)throw new Error('Asset Vault did not return a default signing account.');
      return account;
    }
    function applyLocalWalletAccount(account){
      walletConnection={...walletConnection,connected:true,transport:'local',accountAddress:account.component_address,walletAddress:'',network:'esmeralda',networkByte:38,account,session:null,capabilities:null};
      $('#localReconnectStatus').textContent='Connected to Asset Vault. This browser will reconnect to the same account automatically.';
      renderWalletState();renderSellerOrders();refreshTrustScores().catch(()=>{});
    }
    async function finishLocalWallet(){
      const account=await readLocalWalletAccount();
      window.xtmLocalWallet.remember(account.component_address);
      applyLocalWalletAccount(account);
      $('#pairingPanel').classList.remove('show');$('#walletDialog').close();toast('Asset Vault connected. Automatic reconnect is enabled.');
    }
    async function reconnectLocalWallet(){
      const bridge=window.xtmLocalWallet,expected=bridge?.rememberedAccount();
      if(!bridge?.available||!expected||localReconnectBusy||document.hidden||transactionBusy||purchaseBusy||$('#connectWallet').disabled||(walletConnection.connected&&walletConnection.transport!=='local'))return;
      const generation=localReconnectGeneration;
      localReconnectBusy=true;
      const current=()=>generation===localReconnectGeneration&&bridge.rememberedAccount()===expected&&!transactionBusy&&!purchaseBusy&&!$('#connectWallet').disabled&&(!walletConnection.connected||walletConnection.transport==='local');
      const unavailable=message=>{
        if(walletConnection.transport==='local'){walletConnection={...walletConnection,connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,capabilities:null};renderWalletState();renderSellerOrders();}
        $('#localReconnectStatus').textContent=message;
      };
      try{
        const account=await readLocalWalletAccount();
        if(!current())return;
        if(account.component_address.toLowerCase()!==expected.toLowerCase()){
          bridge.forget();unavailable('Asset Vault switched accounts. Select Connect wallet to authorize this account.');return;
        }
        if(!walletConnection.connected)applyLocalWalletAccount(account);
      }catch(error){
        if(current())unavailable('Local wallet unavailable. Keep the launcher and Asset Vault running; reconnection will retry automatically. If access expired, restart the launcher with a valid API key.');
      }finally{localReconnectBusy=false}
    }
    let walletLibrariesPromise;
    function loadWalletLibraries(){
      if(!walletLibrariesPromise)walletLibrariesPromise=import('./vendor/walletconnect.mjs').then(sign=>({SignClient:sign.default||sign.SignClient}));
      return walletLibrariesPromise
    }
    async function getWalletClient(){
      if(walletConnection.client)return walletConnection.client;
      const {SignClient}=await loadWalletLibraries();
      const client=await SignClient.init({
        projectId:WALLETCONNECT_PROJECT_ID,
        metadata:{name:'Tari Market',description:'Buy and sell goods with Tari on Ootle',url:location.origin,icons:[]}
      });
      client.on('session_delete',()=>{walletConnection={connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,client,capabilities:null};renderWalletState();renderSellerOrders()});
      walletConnection.client=client;
      return client
    }
    async function walletRequest(method,params={}){
      if(walletConnection.transport==='testnet')return (await testWalletModule()).request(method,params);
      if(walletConnection.transport==='local')return window.xtmLocalWallet.request(method,params);
      if(walletConnection.transport==='window.tari'){
        if(!hasAvailableTariProvider())throw new Error('The Tari wallet provider is no longer available.');
        if(method==='tari_signAndSubmitTransaction'&&params.dryRun!==true)return window.xtmProviderTransactions.submit(window.tari,walletConnection.accountAddress,params);
        return window.xtmProviderTransactions.bounded(()=>window.tari.request({method,params}))
      }
      if(!walletConnection.client||!walletConnection.session)throw new Error('Connect your Tari wallet first.');
      return walletConnection.client.request({topic:walletConnection.session.topic,chainId:WALLETCONNECT_CHAIN,request:{method,params}})
    }
    async function finishWalletSession(session,client){
      walletConnection={...walletConnection,transport:'walletconnect',client,session};
      const accountResponse=await walletRequest('tari_getDefaultAccount',{});
      const account=accountResponse?.account||accountResponse;
      const sessionAddress=session.namespaces?.tari?.accounts?.[0]?.split(':').slice(2).join(':')||'';
      const accountAddress=account?.component_address||firstAddress(accountResponse)||sessionAddress;
      if(!/^component_[0-9a-f]{64}$/i.test(accountAddress))throw new Error('No default Tari account was returned by the wallet.');
      if(!account?.owner_key_id)throw new Error('The wallet account does not have an owner signing key.');
      walletConnection={...walletConnection,transport:'walletconnect',connected:true,accountAddress,walletAddress:'',network:'esmeralda',networkByte:null,account,capabilities:null};
      $('#pairingPanel').classList.remove('show');
      $('#walletDialog').close();await refreshTrustScores();renderWalletState();renderSellerOrders();toast('Tari wallet connected')
    }
    async function finishWindowTari(accounts){
      const accountAddress=firstAddress(accounts?.[0]||accounts);
      if(!/^component_[0-9a-f]{64}$/i.test(accountAddress))throw new Error('No Tari account was returned by the wallet.');
      const [network,walletAddress,capabilities]=await Promise.all([
        window.tari.request({method:'tari_getNetwork'}),
        window.tari.request({method:'tari_getWalletAddress'}).catch(()=> ''),
        window.tari.request({method:'tari_getCapabilities'}).catch(()=> null)
      ]);
      if(!String(network).toLowerCase().includes('esmeralda'))throw new Error('Switch your Tari wallet to the Esmeralda network.');
      walletConnection={...walletConnection,connected:true,transport:'window.tari',accountAddress,walletAddress:String(walletAddress||''),network:String(network),networkByte:null,account:{...(accounts?.[0]&&typeof accounts[0]==='object'?accounts[0]:{}),component_address:accountAddress},session:null,capabilities};
      $('#pairingPanel').classList.remove('show');$('#walletDialog').close();await refreshTrustScores();renderWalletState();renderSellerOrders();toast('Tari wallet connected through window.tari')
    }
    async function showPairingUri(uri){
      $('#pairingUri').value=uri;
      $('#pairingPanel').classList.add('show')
    }
    async function restoreWalletSession(){
      if(window.xtmLocalWallet?.available){
        reconnectLocalWallet();setInterval(reconnectLocalWallet,15000);
        window.addEventListener('focus',reconnectLocalWallet);
        document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconnectLocalWallet()});
        return;
      }
      const preference=walletPreference();
      if(preference==='disconnected')return;
      if(savedBrowserWallet()&&(!preference||preference==='testnet')){browserUnlockPending=true;promptSavedBrowserWallet();return;}
      const restoreGeneration=localReconnectGeneration;
      if(hasAvailableTariProvider()&&preference!=='walletconnect'){
        try{const accounts=await window.tari.request({method:'tari_getAccounts'});if(accounts?.length){if(restoreGeneration!==localReconnectGeneration)return;await finishWindowTari(accounts);return}}catch(error){console.warn('window.tari session restore failed',error)}
      }
      try{
        const client=await getWalletClient(),sessions=client.session.getAll(),session=sessions.find(candidate=>candidate.namespaces?.tari);
        if(session&&restoreGeneration===localReconnectGeneration)await finishWalletSession(session,client)
      }catch(error){console.warn('WalletConnect session restore failed',error)}
    }
    function manifestText(value){return JSON.stringify(String(value))}
    function atomicTari(value){const amount=Math.round(Number(value)*1_000_000);if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('The tTari amount is invalid.');return amount}
    function cborHead(major,value){
      const n=BigInt(value),prefix=major<<5;
      if(n<24n)return[prefix+Number(n)];
      if(n<=255n)return[prefix+24,Number(n)];
      if(n<=65535n)return[prefix+25,Number(n>>8n),Number(n&255n)];
      if(n<=4294967295n)return[prefix+26,Number(n>>24n)&255,Number(n>>16n)&255,Number(n>>8n)&255,Number(n)&255];
      if(n<=18446744073709551615n){const out=[prefix+27];for(let shift=56n;shift>=0n;shift-=8n)out.push(Number(n>>shift)&255);return out}
      const bytes=[];let x=n;while(x){bytes.unshift(Number(x&255n));x>>=8n}return[...cborHead(6,2),...cborHead(2,bytes.length),...bytes]
    }
    function cborBytes(bytes){return[...cborHead(2,bytes.length),...bytes]}
    function cborText(value){const bytes=[...new TextEncoder().encode(String(value))];return[...cborHead(3,bytes.length),...bytes]}
    function cborBool(value){return[value?0xf5:0xf4]}
    function cborAddress(address,tag){const hex=String(address).replace(/^[^_]+_/,'');if(!/^[0-9a-f]{64}$/i.test(hex))throw new Error('The Tari address is invalid.');const bytes=hex.match(/../g).map(part=>parseInt(part,16));return[...cborHead(6,tag),...cborBytes(bytes)]}
    function literal(bytes){return{Literal:bytes.map(byte=>byte.toString(16).padStart(2,'0')).join('')}}
    function componentCall(address,method,args){return{CallMethod:{call:{Address:address},method,args}}}
    function feeInstructions(accountAddress){return[componentCall(accountAddress,'pay_fee',[literal(cborHead(0,walletConnection.transport==='testnet'?300000:MAX_TRANSACTION_FEE))])]}
    async function networkState(){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
      try{const response=await fetch(INDEXER_URL+'network',{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error();const data=await response.json(),epoch=Number(data.epoch);if(!Number.isSafeInteger(epoch)||epoch<0)throw new Error();return data}
      catch{throw new Error('Could not read the current Esmeralda epoch. Please try again.')}finally{clearTimeout(timeout)}
    }
    let transactionBusy=false,purchaseBusy=false;
    const pendingWalletTransactions=new Map();
    function transactionOutcome(response){
      if(!response||typeof response!=='object')return 'pending';
      const status=String(response.status||'');
      const finalize=response.finalize||response.result;
      const decision=finalize&&typeof finalize==='object'?finalize.result:null;
      if(['Rejected','Failed','Aborted','InvalidTransaction','OnlyFeeAccepted'].includes(status)||decision&&(Object.hasOwn(decision,'Reject')||Object.hasOwn(decision,'AcceptFeeRejectRest')))return 'rejected';
      if(status==='Accepted'&&decision&&Object.hasOwn(decision,'Accept'))return 'accepted';

      // window.tari's tari_getTransactionResult returns the indexer's own raw envelope, not the
      // WalletConnect/local-daemon {status,result} shape the checks above expect -- neither
      // `response.status` nor `finalize.result` exist on it, so every check above silently falls
      // through to 'pending' forever, even for a transaction that finalized instantly. Real shape,
      // confirmed directly against the indexer: `{ result: { Finalized: { final_decision,
      // execution_result: { finalize: { result } } } } }` -- `final_decision` is the bare string
      // "Commit" on success, or an object like `{Abort:"..."}` when the network never ran it at all.
      const finalized=response.result&&typeof response.result==='object'?response.result.Finalized:null;
      if(finalized&&typeof finalized==='object'){
        const finalDecision=finalized.final_decision;
        const innerResult=finalized.execution_result&&finalized.execution_result.finalize?finalized.execution_result.finalize.result:null;
        if(finalDecision&&typeof finalDecision==='object')return 'rejected';
        if(innerResult&&typeof innerResult==='object'&&(Object.hasOwn(innerResult,'Reject')||Object.hasOwn(innerResult,'AcceptFeeRejectRest')))return 'rejected';
        if(finalDecision==='Commit'&&innerResult&&typeof innerResult==='object'&&Object.hasOwn(innerResult,'Accept'))return 'accepted';
      }
      return 'pending';
    }
    function signingAccountAddress(response){
      const account=response?.account||response;
      const selected=Array.isArray(account)?account[0]:account;
      if(typeof selected==='string')return /^component_[0-9a-f]{64}$/i.test(selected)?selected.toLowerCase():'';
      if(!selected||typeof selected!=='object')return '';
      // Asset Vault also returns a separate address field. Use the account
      // component, just as connection setup does, rather than that wallet address.
      for(const key of ['component_address','account_address','address']){
        const value=decodeChainValue(selected[key]);
        if(value===undefined||value===null)continue;
        if(typeof value==='string'&&/^component_[0-9a-f]{64}$/i.test(value))return value.toLowerCase();
        if(key==='component_address')return '';
      }
      return '';
    }
    async function submitInstructions(instructions,summary){
      if(transactionBusy)throw new Error('Another wallet transaction is in progress.');
      if(!walletConnection.connected)throw new Error('Connect your Tari wallet first.');
      const identity={account:walletConnection.accountAddress,transport:walletConnection.transport,session:walletConnection.session?.topic,provider:window.tari};
      const sameWallet=()=>{if(!walletConnection.connected||identity.account!==walletConnection.accountAddress||identity.transport!==walletConnection.transport||identity.session!==walletConnection.session?.topic||(identity.transport==='window.tari'&&identity.provider!==window.tari))throw new Error('Wallet changed. Check its transaction history before retrying.');};
      transactionBusy=true;
      const pendingKey='xtm-market-pending-tx:'+identity.account;
      let prior=pendingWalletTransactions.get(pendingKey);try{prior=prior||sessionStorage.getItem(pendingKey)}catch{}
      const remember=id=>{pendingWalletTransactions.set(pendingKey,id);try{sessionStorage.setItem(pendingKey,id)}catch{}};
      const forget=()=>{if(identity.transport==='window.tari'){const id=pendingWalletTransactions.get(pendingKey)||sessionStorage.getItem(pendingKey);window.xtmProviderTransactions.acknowledge(identity.account,id)}pendingWalletTransactions.delete(pendingKey);try{sessionStorage.removeItem(pendingKey)}catch{}};
      try{
        if(prior){
          const previous=await walletRequest('tari_getTransactionResult',identity.transport==='window.tari'?{transactionId:prior}:{transaction_id:prior});sameWallet();
          const outcome=transactionOutcome(previous);
          if(outcome==='pending')throw new Error('Your previous transaction is still unconfirmed. Check its status in your wallet before retrying.');
          if(identity.transport==='testnet')await (await testWalletModule()).acknowledge(prior);
          forget();
          if(outcome==='accepted')throw new Error('Your previous transaction completed. Refresh your orders before starting another transaction.');
        }
        if(!window.confirm(summary+'\n\nMaximum network fee: '+(identity.transport==='testnet'?'0.3 tTari':(MAX_TRANSACTION_FEE/1000000)+' tTari')+'\n\n'+(identity.transport==='testnet'?'Sign and submit with your browser test wallet?':'Continue in your connected Tari wallet?')))throw new Error('Payment cancelled.');
        sameWallet();
        const currentAccount=signingAccountAddress(await walletRequest(identity.transport==='window.tari'?'tari_getAccounts':'tari_getDefaultAccount',{}));sameWallet();
        if(String(currentAccount).toLowerCase()!==identity.account.toLowerCase())throw new Error('The wallet account changed. Reconnect before submitting.');
        await verifyActiveMarket();sameWallet();
        let submitted;
        if(identity.transport==='window.tari'){
          const network=await walletRequest('tari_getNetwork');sameWallet();
          if(String(network).toLowerCase()!=='esmeralda')throw new Error('Switch your wallet to Esmeralda.');
          submitted=await walletRequest('tari_signAndSubmitTransaction',{instructions,maxFee:String(MAX_TRANSACTION_FEE),dryRun:false});
        }else{
          const state=await networkState();sameWallet();
          const network=Number(state.network_byte);
          if(network!==ESMERALDA_NETWORK_BYTE)throw new Error('Network mismatch: this marketplace requires Esmeralda.');
          const transaction={V1:{network,fee_instructions:feeInstructions(identity.account),instructions,inputs:[],min_epoch:null,max_epoch:Number(state.epoch)+3,is_seal_signer_authorized:true,dry_run:false,blobs:[],nonce:(BigInt(Date.now())*1000000n+BigInt(crypto.getRandomValues(new Uint32Array(1))[0])).toString()}};
          submitted=await walletRequest('tari_submitTransaction',{transaction,seal_signer:walletConnection.account.owner_key_id,other_signers:[],signatures:[],detect_inputs:true,detect_inputs_use_unversioned:true,lock_ids:[]});
        }
        sameWallet();
        const transactionId=submitted?.transactionId||submitted?.transaction_id;
        if(!transactionId)throw new Error('No transaction ID returned. Check your wallet before retrying.');
        remember(transactionId);
        if(submitted.recovered)throw new Error('Your previous wallet request was submitted. Refresh your orders before starting another transaction.');
        if(transactionOutcome(submitted)==='rejected'){forget();throw new Error('Ootle rejected the transaction.')}
        if(transactionOutcome(submitted)==='accepted'){forget();return {transactionId,result:submitted}}
        for(let attempt=0;attempt<60;attempt++){
          await new Promise(resolve=>setTimeout(resolve,2000));sameWallet();
          const result=await walletRequest('tari_getTransactionResult',identity.transport==='window.tari'?{transactionId}:{transaction_id:transactionId});sameWallet();
          const outcome=transactionOutcome(result);
          if(outcome==='rejected'){if(identity.transport==='testnet')await (await testWalletModule()).acknowledge(transactionId);forget();throw new Error('Ootle rejected the transaction.')}
          if(outcome==='accepted'){if(identity.transport==='testnet')await (await testWalletModule()).acknowledge(transactionId);forget();return {transactionId,result}}
        }
        throw new Error('Transaction status is unconfirmed. Check your wallet before retrying; it may still complete.');
      }finally{transactionBusy=false;walletSummary.updated=0;renderConnectedWallet()}
    }
    function returnedListingId(result){
      let executionResults=null;
      (function visit(value){if(executionResults||!value||typeof value!=='object')return;if(Array.isArray(value.execution_results))executionResults=value.execution_results;else for(const child of Object.values(value))visit(child)})(result);
      if(!executionResults?.length)return null;
      const value=executionResults[executionResults.length-1]?.indexed?.value??executionResults[executionResults.length-1]?.value;
      const number=typeof value==='number'?value:typeof value==='string'&&/^\d+$/.test(value)?Number(value):null;
      return Number.isSafeInteger(number)&&number>0?number:null
    }
    let walletSummary={key:'',status:'idle',amount:null,owner:'',updated:0};
    function connectedWalletName(){
      const address=String(walletConnection.accountAddress||'').toLowerCase();
      const registered=[...usernameListings.values()].find(row=>row.address===address)?.name||sellerUsernames.get(walletSummary.owner);
      if(registered)return registered==='taritom'?'TariTom':registered;
      const name=walletConnection.account?.name||walletConnection.account?.account_name;
      if(typeof name==='string'&&name.trim())return name.trim().slice(0,64);
      return {testnet:'Browser test wallet',local:'Asset Vault wallet','window.tari':'Tari wallet',walletconnect:'Tari wallet'}[walletConnection.transport]||'Tari wallet';
    }
    function renderConnectedWallet(){
      const button=$('#walletButton');
      if(!walletConnection.connected){walletSummary={key:'',status:'idle',amount:null,owner:'',updated:0};button.title='';return;}
      const key=walletConnection.transport+':'+walletConnection.accountAddress;
      if(walletSummary.key!==key)walletSummary={key,status:'idle',amount:null,owner:'',updated:0};
      const name=connectedWalletName(),balance=walletSummary.status==='ready'?new Intl.NumberFormat(undefined,{maximumFractionDigits:6}).format(walletSummary.amount)+' tTari available':walletSummary.status==='error'?'Balance unavailable':'Loading balance…';
      button.replaceChildren();
      const title=document.createElement('span'),amount=document.createElement('span');
      title.className='connected-wallet-name';title.textContent=name;
      amount.className='connected-wallet-balance';amount.textContent=balance;button.append(title,amount);
      button.title='Public spendable balance; excludes shielded funds and escrow. Account: '+walletConnection.accountAddress;
      $('#walletCheckoutStatus').textContent=name+' · '+balance;
      if(walletSummary.status!=='loading'&&Date.now()-walletSummary.updated>=25000)refreshConnectedWallet();
    }
    async function refreshConnectedWallet(){
      if(!walletConnection.connected)return;
      const snapshot=walletSummary,account=walletConnection.accountAddress;
      if(snapshot.status==='loading')return;
      snapshot.status='loading';
      async function read(id){
        const response=await fetch(INDEXER_URL+'substates/'+encodeURIComponent(id)+'?local_search_only=false',{cache:'no-store',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error('Balance unavailable');
        const payload=await response.json();return decodeChainValue(payload.substate||payload.value?.substate);
      }
      try{
        const component=(await read(account))?.Component;
        if(!component)throw new Error('Account unavailable');
        const owner=component.header?.owner_rule?.ByPublicKey;
        const ids=new Set();
        (function visit(value){if(typeof value==='string'&&/^vault_[0-9a-f]{64}$/.test(value))ids.add(value);else if(value&&typeof value==='object')Object.values(value).forEach(visit)})(component.body?.state);
        let total=0n;
        for(const id of ids){
          const container=(await read(id))?.Vault?.resource_container;
          const funds=container?.Stealth||container?.Confidential||container?.Fungible;
          if(!funds||funds.address!=='resource_'+'01'.repeat(32))continue;
          const raw=funds.revealed_amount??funds.amount;
          if(!/^[0-9]+$/.test(String(raw))||(typeof raw==='number'&&!Number.isSafeInteger(raw)))throw new Error('Invalid balance');
          total+=BigInt(raw);
        }
        if(total>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Balance exceeds display precision');
        if(walletSummary!==snapshot||!walletConnection.connected)return;
        snapshot.owner=typeof owner==='string'?owner:'';snapshot.amount=Number(total)/1e6;snapshot.status='ready';
      }catch{if(walletSummary!==snapshot)return;snapshot.amount=null;snapshot.status='error';}
      if(walletSummary===snapshot){snapshot.updated=Date.now();renderConnectedWallet();}
    }
    // Owner-signed, shared listing visibility. Escrow and seller records stay untouched.
    const POST_MODERATION_COMPONENT='component_c8ea0a2b4bb31da5a80006b5047123d871bb495706e4b4040425763ac9914725';
    const POST_MODERATION_TEMPLATE='8ba3b838f72caf31b7dc9e45bfbcb58dd7d5cbbebbfd6993cd51396dda3d5583';
    let removedPosts=new Map(),postRegistryReady=false,postRegistryTask=null,postRows=[],postBusy=false,postAction=null,postListSequence=0;
    function postKey(item){return (item.marketComponent||item.component)+':'+(item.chainId||item.id)}
    function postVisible(item){return Boolean(item)&&(item.sample||!item.chainId||postRegistryReady&&!removedPosts.has(postKey(item)))}
    function parsePostRegistry(payload){
      const c=payload?.substate?.Component,state=decodeChainValue(c?.body?.state);
      if(payload.verified!==true||c?.header?.template_address!==POST_MODERATION_TEMPLATE||c?.header?.owner_rule!=='None'||!Array.isArray(state)||state.length!==2||state[0]!=='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828'||!state[1]||Array.isArray(state[1])||typeof state[1]!=='object')throw new Error('Listing moderation identity could not be verified.');
      const result=new Map();
      for(const [key,reason] of Object.entries(state[1])){
        const [component,id]=key.split(':');
        if(!TRUSTED_MARKET_COMPONENTS.has(component)||!safeId(Number(id))||String(Number(id))!==id||typeof reason!=='string'||!reason.trim()||new TextEncoder().encode(reason).length>500)throw new Error('Invalid listing moderation state.');
        result.set(key,reason);
      }
      return result;
    }
    async function refreshPostRegistry(){
      if(postRegistryTask)return postRegistryTask;
      postRegistryTask=(async()=>{
        try{
          if(!POST_MODERATION_COMPONENT)throw new Error('Post removal is awaiting testnet activation.');
          const response=await fetch(INDEXER_URL+'substates/'+POST_MODERATION_COMPONENT+'?local_search_only=false',{cache:'no-store',signal:AbortSignal.timeout(15000)});
          if(!response.ok)throw new Error('Cannot check listing moderation. Try refreshing.');
          removedPosts=parsePostRegistry(await response.json());postRegistryReady=true;
        }catch(error){postRegistryReady=false;$('#postRemovalStatus').textContent=error.message;}
        finally{postRegistryTask=null;$('#marketModerationStatus').textContent=postRegistryReady?'':'Listing checks are temporarily unavailable. Seller posts will return when verification succeeds.';render();renderPostRows();}
      })();
      return postRegistryTask;
    }
    function renderPostAccess(){
      const owner=isMarketplaceOwner();$('#removePostsTab').hidden=!owner;
      if(!owner){postRows=[];postListSequence++;$('#postRemovalList').innerHTML='';if(postAction){$('#removePostDialog').close();postAction=null;}if(pageFromHash()==='posts')setPage('market',false);}
      $('#postRemovalRefresh').disabled=!owner||postBusy;
    }
    function renderPostRows(){
      const box=$('#postRemovalList');if(!isMarketplaceOwner()){box.innerHTML='';return;}
      box.innerHTML=postRows.length?postRows.map((row,index)=>{const removed=removedPosts.has(postKey(row));return `<article class="review-card"><strong>${escapeHtml(row.name)}</strong><p>Seller: ${escapeHtml(row.username?'@'+row.username:shortAddress(row.paymentAddress))} · Listing #${row.id}</p><p>${xtm(row.price)} · ${row.component===MARKET_COMPONENT_ADDRESS?'Current marketplace':'Earlier marketplace'}</p>${removed?`<p class="moderation-note">Removed: ${escapeHtml(removedPosts.get(postKey(row)))}</p>`:''}<button type="button" class="button small ${removed?'':'danger'}" data-moderate-post="${index}" ${postBusy||!postRegistryReady?'disabled':''}>${removed?'Restore post':'Remove post'}</button></article>`}).join(''):'<div class="empty-panel">No seller posts available to review.</div>';
      box.querySelectorAll('[data-moderate-post]').forEach(button=>button.onclick=()=>openPostRemoval(Number(button.dataset.moderatePost)));
    }
    async function refreshPostList(){
      if(!isMarketplaceOwner())return;
      const sequence=++postListSequence,account=walletConnection.accountAddress;
      $('#postRemovalStatus').textContent='Loading seller posts…';
      try{
        const [current,previous]=await Promise.all([readListingMarket(MARKET_COMPONENT_ADDRESS),readListingMarket(PREVIOUS_MARKET_COMPONENT),refreshPostRegistry()]);
        if(sequence!==postListSequence||account!==walletConnection.accountAddress||!isMarketplaceOwner())return;
        postRows=[...listingRows(current,MARKET_COMPONENT_ADDRESS),...listingRows(previous,PREVIOUS_MARKET_COMPONENT)].filter(row=>row.active);
        if(postRegistryReady)$('#postRemovalStatus').textContent=postRows.length+' seller posts. Removal applies across updated Tari Market clients.';
        renderPostRows();
      }catch(error){if(sequence===postListSequence){postRows=[];renderPostRows();$('#postRemovalStatus').textContent=error.message;}}
    }
    function openPostRemoval(index){
      if(!isMarketplaceOwner()||!postRegistryReady||postBusy)return;
      const row=postRows[index];if(!row)return;
      postAction={...row,restore:removedPosts.has(postKey(row)),account:walletConnection.accountAddress};
      $('#removePostTitle').textContent=postAction.restore?'Restore post':'Remove post';
      $('#removePostName').textContent=row.name;
      $('#removePostReason').value='';$('#removePostError').textContent='';
      $('#removePostSubmit').textContent=postAction.restore?'Approve restoration':'Approve removal';
      $('#removePostDialog').showModal();$('#removePostReason').focus();
    }
    async function submitPostRemoval(event){
      event.preventDefault();if(postBusy||!postAction||!isMarketplaceOwner())return;
      const action={...postAction},reason=$('#removePostReason').value.trim();
      if(!reason||new TextEncoder().encode(reason).length>500){$('#removePostError').textContent='Enter a reason of up to 500 bytes.';return;}
      postBusy=true;$('#removePostSubmit').disabled=true;renderPostRows();
      try{
        await refreshPostRegistry();
        if(!postRegistryReady||!isMarketplaceOwner()||action.account!==walletConnection.accountAddress||!postAction||postKey(postAction)!==postKey(action))throw new Error('Your wallet or listing changed. Reopen the post.');
        if(removedPosts.has(postKey(action))!==action.restore)throw new Error('This post has changed. Refresh the list.');
        await submitInstructions([componentCall(POST_MODERATION_COMPONENT,action.restore?'restore_post':'remove_post',[literal(cborAddress(action.component,128)),literal(cborHead(0,action.id)),literal(cborText(reason))])],`${action.restore?'Restore':'Remove'} Tari Market post: ${action.name}\nReason (public): ${reason}\nExisting orders and escrow are unchanged.`);
        $('#removePostDialog').close();postAction=null;await refreshPostList();
        toast(postRegistryReady&&removedPosts.has(postKey(action))!==action.restore?(action.restore?'Post restored':'Post removed from Tari Market'):'Transaction accepted. Refresh to verify the updated post status.');
      }catch(error){$('#removePostError').textContent=error.message||'Removal was not approved.';}
      finally{postBusy=false;$('#removePostSubmit').disabled=false;renderPostRows();renderPostAccess();}
    }
    $('#postRemovalRefresh').onclick=refreshPostList;
    $('#removePostForm').onsubmit=submitPostRemoval;
    $('#removePostCancel').onclick=()=>{if(!postBusy){$('#removePostDialog').close();postAction=null;}};
    $('#removePostDialog').addEventListener('cancel',event=>{if(postBusy)event.preventDefault();else postAction=null;});
    setTimeout(()=>refreshPostRegistry(),0);
    setInterval(()=>{if(!document.hidden)refreshPostRegistry()},30000);

    // Enable only after publishing, validating, and configuring the seller-management contract.
    const LISTING_MANAGEMENT_READY=true;
    let myItems=[],myItemsSequence=0,editingItem=null,myItemsBusy=false;
    async function readListingMarket(component){
      const response=await fetch(INDEXER_URL+'substates/'+component+'?local_search_only=false',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Could not load listings. Try Refresh items.');
      const data=await response.json(),c=data?.substate?.Component,state=decodeChainValue(c?.body?.state);
      const template=component===MARKET_COMPONENT_ADDRESS?'ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a':'b10f1ab4c4902241f3e4592b1719ac8059aece55011a4e6f580c61f28ecfb7c2';
      if(data.verified!==true||c?.header?.template_address!==template||c?.header?.owner_rule!=='None'||!Array.isArray(state)||state.length!==15||state[10]!=='d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828'||state[1]!==MARKET_OWNER_ACCOUNT)throw new Error('Marketplace identity could not be verified.');
      return state;
    }
    function listingRows(state,component){return Object.values(state[3]).map(row=>({id:Number(row[0]),component,name:String(row[1]),usdCents:Number(row[2]),price:Number(row[3])/1e6,shipping:Number(row[4])/1e6,paymentAddress:paymentAddress(row[5]),signer:String(row[6]),deliveryPublicKey:String(row[7]),stock:Number(row[8]),active:row[9]===true,username:state[13][row[6]]||''}));}
    function sameListingOrigin(a,b){return a.signer===b.signer&&a.paymentAddress===b.paymentAddress&&a.deliveryPublicKey===b.deliveryPublicKey;}
    function addLegacyUsernames(state){
      for(const row of listingRows(state,PREVIOUS_MARKET_COMPONENT))if(normalizeSellerUsername(row.username)&&state[14][row.username]===row.signer)usernameListings.set(PREVIOUS_MARKET_COMPONENT+':'+row.id,{name:row.username,address:row.paymentAddress});
    }
    function syncMarketListings(state,legacy){
      const current=listingRows(state,MARKET_COMPONENT_ADDRESS),previous=legacy?listingRows(legacy,PREVIOUS_MARKET_COMPONENT):[];
      for(const item of listings)if(item.marketComponent===MARKET_COMPONENT_ADDRESS||item.marketComponent===PREVIOUS_MARKET_COMPONENT)item.inventoryVerified=false;
      for(const row of [...previous,...current]){
        const replacement=row.component===PREVIOUS_MARKET_COMPONENT?current.find(next=>sameListingOrigin(row,next)):null;
        let local=listings.find(item=>item.marketComponent===row.component&&item.chainId===row.id);
        if(replacement){if(local){local.previousListing={component:row.component,id:row.id};local.marketComponent=replacement.component;local.chainId=replacement.id;}continue;}
        if(!local){if(!row.active)continue;local={id:(row.component===MARKET_COMPONENT_ADDRESS?8000000000000:7000000000000)+row.id,chainId:row.id,marketComponent:row.component,description:'',category:'Other',images:[],image:''};listings.push(local);}
        // Every cached copy must receive the chain stock, including migrated duplicates.
        for(const copy of listings.filter(item=>item.marketComponent===row.component&&item.chainId===row.id))Object.assign(copy,{name:row.name,price:row.price,shipping:row.shipping,stock:row.active?row.stock:0,paymentAddress:row.paymentAddress,deliveryPublicKey:row.deliveryPublicKey,deleted:!row.active,inventoryVerified:true});
      }
      saveListings();
    }
    async function refreshMyItems(){
      const seq=++myItemsSequence,box=$('#myItemsList'),account=walletConnection.accountAddress;
      if(!walletConnection.connected){myItems=[];box.innerHTML='<div class="none">Connect your wallet to see your items.</div>';return;}
      box.textContent='Loading your listings…';
      try{
        const [state,legacy]=await Promise.all([readListingMarket(MARKET_COMPONENT_ADDRESS),readListingMarket(PREVIOUS_MARKET_COMPONENT)]);
        if(seq!==myItemsSequence||!walletConnection.connected||walletConnection.accountAddress!==account)return;
        const current=listingRows(state,MARKET_COMPONENT_ADDRESS),previous=listingRows(legacy,PREVIOUS_MARKET_COMPONENT).filter(row=>!current.some(next=>sameListingOrigin(row,next)));
        myItems=[...current,...previous].filter(row=>row.paymentAddress===account.toLowerCase()&&row.active);
        syncMarketListings(state,legacy);refreshUsernameRegistry(state);addLegacyUsernames(legacy);render();
        $('#myItemsAvailability').hidden=true;
        box.innerHTML=myItems.length?myItems.map(item=>`<article class="order"><div><strong>${escapeHtml(item.name)}</strong><p>${xtm(item.price)} · Shipping ${xtm(item.shipping)} · ${item.stock} available</p>${item.component===PREVIOUS_MARKET_COMPONENT?'<p>Relist once to enable editing and deletion. Your wallet approval is required.</p>':''}</div><div class="order-actions"><button class="button small" data-manage-photos="${item.id}" data-photo-component="${escapeHtml(item.component)}">Manage photos</button>${item.component===MARKET_COMPONENT_ADDRESS?`<button class="button small" data-edit-item="${item.id}">Edit</button><button class="button small danger" data-delete-item="${item.id}">Delete</button>`:`<button class="button small" data-relist-item="${item.id}">Relist to enable editing</button>`}</div></article>`).join(''):'<div class="none">You have no active listings on this marketplace.</div>';
        box.querySelectorAll('[data-manage-photos]').forEach(button=>button.onclick=()=>openMediaEditor(button.dataset.photoComponent,Number(button.dataset.managePhotos)));
        box.querySelectorAll('[data-edit-item]').forEach(button=>button.onclick=()=>openItemEditor(Number(button.dataset.editItem)));
        box.querySelectorAll('[data-delete-item]').forEach(button=>button.onclick=()=>deleteMyItem(Number(button.dataset.deleteItem)));
        box.querySelectorAll('[data-relist-item]').forEach(button=>button.onclick=()=>relistMyItem(Number(button.dataset.relistItem)));
      }catch(error){if(seq===myItemsSequence)box.textContent=error.message||'Could not load your listings.';}
    }
    async function relistMyItem(id){
      if(myItemsBusy||!walletConnection.connected)return;
      const account=walletConnection.accountAddress;myItemsBusy=true;
      try{
        const [legacy,current]=await Promise.all([readListingMarket(PREVIOUS_MARKET_COMPONENT),readListingMarket(MARKET_COMPONENT_ADDRESS)]);
        const item=listingRows(legacy,PREVIOUS_MARKET_COMPONENT).find(row=>row.id===id&&row.paymentAddress===account.toLowerCase()&&row.active);
        if(!item||item.stock<1)throw new Error('This listing has no remaining inventory to relist.');
        if(listingRows(current,MARKET_COMPONENT_ADDRESS).some(row=>sameListingOrigin(row,item)))throw new Error('This item has already been relisted. Refresh items.');
        const response=await fetch(INDEXER_URL+'substates/'+account+'?local_search_only=false',{cache:'no-store',signal:AbortSignal.timeout(15000)}),data=await response.json();
        if(data.verified!==true||decodeChainValue(data.substate?.Component?.header?.owner_rule?.ByPublicKey)!==item.signer)throw new Error('Use the original seller wallet to relist this item.');
        if(!normalizeSellerUsername(item.username)||(current[14][item.username]&&current[14][item.username]!==item.signer))throw new Error('The original username cannot be reserved. Contact the marketplace owner.');
        const local=listings.find(row=>row.marketComponent===PREVIOUS_MARKET_COMPONENT&&row.chainId===id);
        if(!local||!await loadDeliveryPrivateKey(local.id))throw new Error('Relist from the browser where you created this item so its shipping decryption key is available.');
        if(!window.confirm('Relist '+item.name+' with '+item.stock+' available? The old contract cannot remove its listing and remains callable directly. Check inventory for old-contract sales. Existing orders stay unchanged.'))return;
        if(!walletConnection.connected||walletConnection.accountAddress!==account)throw new Error('Wallet changed. Try again.');
        const receipt=await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'create_listing',[literal(cborText(item.name)),literal(cborHead(0,item.usdCents)),literal(cborHead(0,atomicTari(item.price))),literal(cborHead(0,item.shipping?atomicTari(item.shipping):0)),literal(cborAddress(item.paymentAddress,128)),literal(cborText(item.deliveryPublicKey)),literal(cborHead(0,item.stock)),literal(cborText(item.username))])],`Relist ${item.name} as @${item.username}. Existing escrow stays on the original marketplace.`);
        const chainId=returnedListingId(receipt.result);if(!chainId)throw new Error('Transaction finalized. Refresh items to recover the new listing before retrying.');
        local.previousListing={component:PREVIOUS_MARKET_COMPONENT,id};local.chainId=chainId;local.marketComponent=MARKET_COMPONENT_ADDRESS;saveListings();
        await refreshMyItems();await refreshTrustScores();toast('Item relisted. Editing and deletion are now available.');
      }catch(error){toast(error.message);}finally{myItemsBusy=false;}
    }
    function openItemEditor(id){
      if(!LISTING_MANAGEMENT_READY||myItemsBusy||!walletConnection.connected)return;
      const item=myItems.find(row=>row.id===id&&row.component===MARKET_COMPONENT_ADDRESS);if(!item)return;
      editingItem={...item,account:walletConnection.accountAddress};
      const form=$('#editItemForm');for(const [key,value] of Object.entries({title:item.name,price:item.price,shipping:item.shipping,stock:item.stock}))form.elements[key].value=value;
      $('#editItemError').textContent='';$('#editItemDialog').showModal();
    }
    async function saveMyItem(event){
      event.preventDefault();if(!LISTING_MANAGEMENT_READY||myItemsBusy||!editingItem)return;
      const item=editingItem,form=$('#editItemForm'),data=new FormData(form),name=String(data.get('title')).trim(),price=Number(data.get('price')),shipping=Number(data.get('shipping')),stock=Number(data.get('stock'));
      if(!walletConnection.connected||item.account!==walletConnection.accountAddress){$('#editItemError').textContent='Reconnect the wallet that owns this listing.';return;}
      myItemsBusy=true;$('#saveItemChanges').disabled=true;
      try{
        if(!name||new TextEncoder().encode(name).length>200||!Number.isSafeInteger(stock)||stock<0||!Number.isFinite(shipping)||shipping<0)throw new Error('Check the title, shipping, and quantity.');
        const args=[literal(cborHead(0,item.id)),literal(cborText(name)),literal(cborHead(0,Math.max(1,Math.round((price+shipping)*xtmRate()*100)))),literal(cborHead(0,atomicTari(price))),literal(cborHead(0,shipping?atomicTari(shipping):0)),literal(cborHead(0,stock))];
        await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'update_listing',args)],`Save changes to ${name}: ${xtm(price)}, shipping ${xtm(shipping)}, quantity ${stock}`);
        for(const row of listings)if(row.marketComponent===MARKET_COMPONENT_ADDRESS&&row.chainId===item.id)Object.assign(row,{name,price,shipping,stock});
        saveListings();$('#editItemDialog').close();editingItem=null;render();await refreshMyItems();toast('Listing updated');
      }catch(error){$('#editItemError').textContent=error.message;}finally{myItemsBusy=false;$('#saveItemChanges').disabled=false;}
    }
    async function deleteMyItem(id){
      if(!LISTING_MANAGEMENT_READY||myItemsBusy||!walletConnection.connected)return;
      const item=myItems.find(row=>row.id===id&&row.component===MARKET_COMPONENT_ADDRESS);if(!item)return;
      if(!window.confirm(`Delete ${item.name}? New purchases will stop. Existing orders and escrow remain unchanged.`))return;
      myItemsBusy=true;
      try{
        await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'cancel_listing',[literal(cborHead(0,id))])],`Delete listing: ${item.name}`);
        listings=listings.filter(row=>row.marketComponent!==MARKET_COMPONENT_ADDRESS||row.chainId!==id);saveListings();render();await refreshMyItems();toast('Listing deleted');
      }catch(error){toast(error.message);}finally{myItemsBusy=false;}
    }
    function renderWalletState(){
      renderPostAccess();
      renderAdminManagement();
      renderPaymentCases();if(walletConnection.connected&&['cases','moderation','recent','received'].includes(pageFromHash()))refreshPaymentCases();
      const connected=walletConnection.connected;
      $('#checkoutFeeCap').textContent=walletConnection.transport==='testnet'?'Separate · up to 0.3 tTari':'Separate · up to '+(MAX_TRANSACTION_FEE/1000000)+' tTari';
      const escrowReady=newPurchasesReady();
      const owner=isMarketplaceAdmin();$('#moderationTab').hidden=!owner;if(!owner){$('#moderationList').innerHTML='';$('#paymentOwnerList').innerHTML='';$('#adminPaymentSync').textContent='';if(paymentAction&&['refund','release'].includes(paymentAction.action)){$('#paymentActionDialog').close();paymentAction=null}}if(!owner&&pageFromHash()==='moderation')setPage('market',false);
      $('#escrowBannerText').textContent=escrowReady?'tTari enters escrow when the purchase completes and stays locked until release or refund. It releases on buyer confirmation or an eligible seller claim after the 14-day purchase window; disputes require an owner decision.':'Purchases will reopen after the new Ootle escrow component is deployed.';
      $('#walletButton').classList.toggle('connected',connected);
      $('#walletButton').textContent=connected?shortAddress(walletConnection.accountAddress):savedBrowserWallet()&&defaultWalletMethod()==='testnet'?'Unlock browser wallet':'Connect Tari wallet';
      $('#walletState').classList.toggle('connected',connected);
      $('#walletDot').classList.toggle('ready',connected);
      $('#walletCheckoutStatus').textContent=connected?`Connected · ${shortAddress(walletConnection.accountAddress)}`:'Tari wallet not connected';
      renderConnectedWallet();refreshListingBuyControls();
      if(pageFromHash()==='myitems')refreshMyItems();
      if(selected){
        const blocked=purchaseBlockReason(selected);
        $('#orderButton').disabled=Boolean(blocked);
        shippingInputs().forEach(field=>field.disabled=Boolean(blocked));
        $('#orderButton').textContent=blocked?(isOwnListing(selected)?'Your listing':selected.sample?'Catalog item — payment unavailable':'Payment unavailable'):connected?`Lock ${xtm((selectedQuote||values(selected)).totalXtm)} in escrow`:'Connect wallet to pay';
        $('#paymentNote').textContent=blocked|| (connected?'Your purchase immediately funds Ootle escrow with the full total. The seller receives payment when escrow is released after receipt confirmation, an eligible timeout claim, or a dispute decision.':'Connect an Esmeralda wallet to approve payment into escrow at purchase. Your wallet approval is required.');
      }
    }
    async function connectWallet(event){
      event.preventDefault();localReconnectGeneration++;
      rememberWalletPreference($('#walletConnectionMethod').value);
      if(window.xtmLocalWallet?.available&&$('#walletConnectionMethod').value!=='local')window.xtmLocalWallet.forget();
      const button=$('#connectWallet'),errorBox=$('#walletError');
      errorBox.classList.remove('show');button.disabled=true;button.textContent='Connecting…';$('#walletConnectionMethod').disabled=true;
      try{
        if($('#walletConnectionMethod').value==='testnet'){await finishTestWallet();return}
        if($('#walletConnectionMethod').value==='local'){await finishLocalWallet();return}
        if($('#walletConnectionMethod').value==='provider'){if(!hasAvailableTariProvider())throw new Error('Tari Universe is unavailable in this tab. Choose WalletConnect or the local Asset Vault launcher.');const accounts=await window.tari.request({method:'tari_requestAccounts'});await finishWindowTari(accounts);return}
        const client=await getWalletClient(),existing=client.session.getAll().find(candidate=>candidate.namespaces?.tari);
        if(existing){await finishWalletSession(existing,client);return}
        const {uri,approval}=await client.connect({requiredNamespaces:{tari:{methods:['tari_getDefaultAccount','tari_submitTransaction','tari_getTransactionResult'],chains:[WALLETCONNECT_CHAIN],events:[]}},sessionProperties:{required_permissions:JSON.stringify([{Accounts:['Read',null]},{Transactions:'Create'},{Transactions:'Read'}]),optional_permissions:'[]'}});
        if(!uri)throw new Error('WalletConnect did not return a pairing link.');
        await showPairingUri(uri);button.textContent='Waiting for approval…';
        const session=await approval();
        await finishWalletSession(session,client)
      }catch(error){
        if($('#walletConnectionMethod').value==='testnet'){try{(await testWalletModule()).lock()}catch{}}
        walletConnection={...walletConnection,connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,capabilities:null};
        errorBox.textContent=error.message||'The wallet connection was not approved.';
        errorBox.classList.add('show')
      }finally{button.disabled=false;button.textContent='Connect wallet';renderWalletConnectionChoice()}
    }
    async function disconnectWallet(){
      localReconnectGeneration++;window.xtmLocalWallet?.forget();rememberWalletPreference('disconnected');
      $('#localReconnectStatus').textContent='Automatic reconnect is off. Select Connect wallet to enable it again.';
      const {client,session,transport}=walletConnection;
      try{if(transport==='testnet')(await testWalletModule()).lock();else if(transport==='local')window.xtmLocalWallet.disconnect();else if(transport==='window.tari'&&window.tari?.request)await window.tari.request({method:'tari_disconnect'});else if(client&&session)await client.disconnect({topic:session.topic,reason:{code:6000,message:'User disconnected'}})}catch{}
      walletConnection={connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,client,capabilities:null};
      $('#pairingPanel').classList.remove('show');$('#pairingUri').value='';$('#disconnectWallet').hidden=true;$('#connectWallet').hidden=false;$('#walletDialog').close();renderWalletState();renderSellerOrders();toast('Wallet disconnected')
    }
    function shippingInputs(){return ['buyerName','shippingStreet','shippingUnit','shippingCity','shippingRegion','shippingPostal','shippingCountry'].map(id=>$('#'+id))}
    function clearShippingFields(){shippingInputs().forEach(field=>{field.value='';field.setCustomValidity('')})}
    function buyerDetails(){
      const fields=shippingInputs();
      for(const field of fields){field.setCustomValidity('');if(field.required&&!field.value.trim()){field.setCustomValidity('Please complete this field.');field.reportValidity();field.focus();return null}if(!field.checkValidity()){field.reportValidity();field.focus();return null}}
      const [name,street,unit,city,region,postal,country]=fields.map(field=>field.value.trim());
      const address=[street,unit,[city,region,postal].filter(Boolean).join(', '),country].filter(Boolean).join('\n');
      return {name,address}
    }
    async function verifyPurchaseListing(item,quote){
      await refreshPostRegistry();
      if(!postRegistryReady||!postVisible(item))throw new Error('This listing is removed or its moderation status could not be verified.');
      if(item.marketComponent!==MARKET_COMPONENT_ADDRESS)throw new Error("This listing belongs to an older marketplace. Ask the seller to list it again on this testnet component.");
      const response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(MARKET_COMPONENT_ADDRESS)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Could not verify the listing on Ootle.');
      const state=decodeChainValue((await response.json())?.substate?.Component?.body?.state),rows=Array.isArray(state)?state[3]:state?.listings;
      const listing=Object.values(rows||{}).find(row=>Number(reviewField(row,0,'id'))===item.chainId);
      if(!listing||reviewField(listing,9,'active')!==true||Number(reviewField(listing,8,'inventory'))<1||String(reviewField(listing,1,'title'))!==item.name||paymentAddress(reviewField(listing,5,'seller_payment_address'))!==String(item.paymentAddress).toLowerCase()||String(reviewField(listing,7,'delivery_public_key'))!==item.deliveryPublicKey||String(reviewField(listing,3,'xtm_price'))!==String(atomicTari(quote.itemXtm))||String(reviewField(listing,4,'shipping_xtm'))!==String(quote.shippingXtm===0?0:atomicTari(quote.shippingXtm)))throw new Error('Listing details differ from Ootle. Refresh and review the item before paying.');
    }
    async function verifyBuyerAccount(account){
      if(typeof account!=='string'||!/^component_[0-9a-f]{64}$/i.test(account))throw new Error('Reconnect your wallet to select a valid Esmeralda account.');
      const unavailable='Could not verify your Esmeralda account. No payment request was sent. Check your connection and try again.';
      let response,payload;
      try{
        response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(account)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
      }catch{throw new Error(unavailable)}
      if(response.status===404)throw new Error('Your Ootle account is not initialized yet, or is not visible on Esmeralda. Initialize and fund it with test Tari in your wallet, wait for confirmation, then retry. No payment request was sent.');
      if(!response.ok)throw new Error(unavailable);
      try{payload=await response.json()}catch{throw new Error(unavailable)}
      const component=decodeChainValue(payload?.substate||payload?.value?.substate)?.Component;
      if(payload?.verified!==true||!component?.header||!component?.body||typeof component.body!=='object'||!Object.hasOwn(component.body,'state'))throw new Error(unavailable);
    }
    async function payWithWallet(){
      if(!selected||purchaseBusy||transactionBusy)return;
      const blocked=purchaseBlockReason(selected);if(blocked){toast(blocked);return}
      const buyer=buyerDetails();if(!buyer)return;
      if(!walletConnection.connected){$('#disconnectWallet').hidden=true;$('#connectWallet').hidden=false;$('#walletDialog').showModal();return}
      if(!newPurchasesReady()){
        $('#paymentNote').textContent='Wallet connected. Publish and configure the v0.6 item-price-fee component before accepting a payment.';
        toast('The item-price-only fee component is not published yet');return
      }
      const item={...selected},account=walletConnection.accountAddress,button=$('#orderButton'),v={...(selectedQuote||values(selected))};let checkoutError='';purchaseBusy=true;button.disabled=true;button.textContent='Waiting for wallet…';
      try{
        $('#paymentNote').removeAttribute('role');
        button.textContent='Checking buyer account…';
        await verifyBuyerAccount(account);
        if(!walletConnection.connected||walletConnection.accountAddress!==account)throw new Error('Wallet changed. Review checkout again.');
        button.textContent='Verifying listing…';
        await verifyPurchaseListing(item,v);
        button.textContent='Encrypting delivery…';
        const encryptedDelivery=await encryptDeliveryDetails(item.deliveryPublicKey,buyer);
        button.textContent='Waiting for wallet…';
        if(selected?.id!==item.id||walletConnection.accountAddress!==account)throw new Error('Purchase or wallet changed. Review checkout again.');
        if(isOwnListing(item))throw new Error('This is your listing. You cannot buy it with the seller wallet.');
        const chainListingId=Number(item.chainId),amount=atomicTari(v.totalXtm);
        if(!safeId(chainListingId))throw new Error('Invalid listing ID.');
        const instructions=[
          componentCall(walletConnection.accountAddress,'withdraw',[literal(cborAddress('resource_0101010101010101010101010101010101010101010101010101010101010101',131)),literal(cborHead(0,amount))]),
          {PutLastInstructionOutputOnWorkspace:{key:0}},
          componentCall(MARKET_COMPONENT_ADDRESS,'buy',[literal(cborHead(0,chainListingId)),{Workspace:{id:0,offset:null}},literal(cborAddress(walletConnection.accountAddress,128)),literal(cborText(encryptedDelivery))])
        ];
        const platformFee=v.itemXtm*.03,sellerAfterRelease=v.totalXtm;
        const summary=`Pay ${xtm(v.totalXtm)} into escrow now to purchase ${selected.name}\nEscrow is funded when this purchase completes and remains held during shipping and delivery.\nSeller after release: ${xtm(sellerAfterRelease)}\nSeparate seller-approved fee (3% of item price): ${xtm(platformFee)}`;
        const receipt=await submitInstructions(instructions,summary),chainOrderId=returnedListingId(receipt.result);
        if(!chainOrderId)throw new Error('Payment was accepted, but the escrow order ID could not be read.');
        recordPaidOrder(receipt.transactionId,encryptedDelivery,chainOrderId,item,v)
      }catch(error){checkoutError=error.message||'Payment was not approved';toast(checkoutError)}
      finally{purchaseBusy=false;button.disabled=false;renderWalletState();if(checkoutError){$('#paymentNote').textContent=checkoutError;$('#paymentNote').setAttribute('role','alert')}}
    }
    async function refreshRates(){
      try{
        const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
        const response=await fetch(PRICE_URL,{headers:{Accept:'application/json'},signal:controller.signal});clearTimeout(timeout);
        if(!response.ok)throw new Error('Quote request failed');
        const data=await response.json(),xtmUsd=Number(data.minotari?.usd);
        if(!(xtmUsd>0))throw new Error('Invalid quote');
        marketRates={xtmUsd,updatedAt:(Number(data.minotari.last_updated_at)||0)*1000||Date.now()};
        localStorage.setItem('xtm-market-live-rates',JSON.stringify(marketRates));render();
      }catch{}
    }
    const CATEGORY_GROUPS={"Electronics": ["Computers", "PC hardware", "Phones", "Tablets", "Home theater", "Audio & headphones", "Cameras & photography", "Wearable technology", "Electronic accessories"], "Gaming": ["Gaming", "Video games", "Gaming accessories", "Board games & puzzles"], "Home & garden": ["Home & living", "Furniture", "Kitchen & dining", "Home decor", "Lighting", "Bedding & bath", "Garden & outdoor", "Tools & home improvement"], "Fashion": ["Clothing & accessories", "Shoes", "Bags & luggage", "Watches", "Jewelry"], "Sports & outdoors": ["Fitness equipment", "Cycling", "Camping & hiking", "Fishing", "Water sports", "Sports gear"], "Collectibles & hobbies": ["Collectibles", "Trading cards", "Coins & stamps", "Art", "Craft supplies", "Musical instruments", "Model kits"], "Books & media": ["Books", "Comics", "Music & vinyl", "Movies"], "Everyday essentials": ["Office supplies", "Pet supplies", "Baby & kids", "Toys", "Automotive accessories", "Other"]};
    const CATEGORIES=Object.values(CATEGORY_GROUPS).flat();
    let selectedCategory='All',selectedSeller=null;
    function sellerItems(items,seller){return items.filter(item=>item.id!==seller.itemId&&item.inventoryVerified!==false&&item.stock>0&&(seller.address?!item.sample&&String(item.paymentAddress||'').toLowerCase()===seller.address:false))}
    function showSellerItems(item){selectedSeller={address:item.sample?'':String(item.paymentAddress||'').toLowerCase(),itemId:item.id,sample:Boolean(item.sample)};selectedCategory='All';currentMarketPage=1;$('#productDialog').close();render();setPage('market');document.querySelector('.market-head').scrollIntoView({behavior:'smooth',block:'start'})}
    function listingCategory(item){return CATEGORIES.includes(item.category)?item.category:'Other'}
    function filterByCategory(items){return selectedCategory==='All'?items:items.filter(item=>listingCategory(item)===selectedCategory)}
    function chooseCategory(category){selectedSeller=null;selectedCategory=category;currentMarketPage=1;render();setPage('market')}
    function renderCategoryFilters(){
      $('#categoryFilters').innerHTML=`<button type="button" class="button small" id="browseCategories">Browse categories</button><button type="button" class="button small" id="browseEscrow">Ootle escrow</button><button type="button" class="button small" id="browseDisputes">Disputes &amp; refunds</button><button type="button" class="button small" id="browseFee">3% fee</button><span class="count">${selectedSeller?(selectedSeller.sample?'Sample seller’s other items':'Seller’s other items'):selectedCategory==='All'?'':escapeHtml(selectedCategory)}</span>${selectedCategory!=='All'||selectedSeller?'<button type="button" class="button small ghost" id="clearCategory">Clear filter</button>':''}`;
      $('#browseCategories').onclick=()=>setPage('categories');
      $('#browseEscrow').onclick=()=>setPage('escrow');
      $('#browseDisputes').onclick=()=>setPage('disputes');
      $('#browseFee').onclick=()=>setPage('fee');
      if($('#clearCategory'))$('#clearCategory').onclick=()=>chooseCategory('All');
      $('#categoryDirectory').innerHTML=Object.entries(CATEGORY_GROUPS).map(([group,categories])=>`<section class="category-group"><h2>${escapeHtml(group)}</h2>${categories.map(category=>`<button type="button" class="category-choice" data-category="${escapeHtml(category)}" aria-pressed="${selectedCategory===category}">${escapeHtml(category)}</button>`).join('')}</section>`).join('');
      $('#categoryDirectory').querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>chooseCategory(button.dataset.category));
    }
    $('#disputesBack').onclick=()=>setPage('market');
    $('#disputesOrders').onclick=()=>setPage('cases');
    $('#escrowBack').onclick=()=>setPage('market');
    $('#itemsPerPage').onchange=event=>{const size=Number(event.target.value);if(!PAGE_SIZE_OPTIONS.includes(size))return;itemsPerPage=size;currentMarketPage=1;try{localStorage.setItem('xtm-market-page-size',String(size))}catch{}render()};
    $('#browseAllCategories').onclick=()=>chooseCategory('All');
    $('#listingCategory').innerHTML='<option value="" disabled selected>Choose a category</option>'+Object.entries(CATEGORY_GROUPS).map(([group,categories])=>`<optgroup label="${escapeHtml(group)}">${categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</optgroup>`).join('');
    function marketplaceListings(){
      const isCatalog=item=>seed.some(product=>product.id===item.id),real=listings.filter(item=>!isCatalog(item)&&!item.deleted&&item.inventoryVerified!==false&&item.stock>0&&postVisible(item)),catalogSlots=Math.max(0,seed.length-real.length);
      return[...real,...listings.filter(item=>isCatalog(item)&&item.stock>0).slice(0,catalogSlots)]
    }
    function renderMarketPagination(totalPages){
      $('#itemsPerPage').value=String(itemsPerPage);
      const nav=$('#marketPagination');
      if(totalPages<=1){nav.classList.remove('show');nav.innerHTML='';return}
      let controls=`<button class="page-button" data-market-page="${currentMarketPage-1}" aria-label="Previous marketplace page" ${currentMarketPage===1?'disabled':''}>‹</button>`;
      for(let page=1;page<=totalPages;page++)controls+=`<button class="page-button ${page===currentMarketPage?'active':''}" data-market-page="${page}" ${page===currentMarketPage?'aria-current="page"':''}>${page}</button>`;
      controls+=`<button class="page-button" data-market-page="${currentMarketPage+1}" aria-label="Next marketplace page" ${currentMarketPage===totalPages?'disabled':''}>›</button>`;
      nav.innerHTML=controls;nav.classList.add('show');
      nav.querySelectorAll('[data-market-page]').forEach(button=>button.onclick=()=>{currentMarketPage=Number(button.dataset.marketPage);render();document.querySelector('.market-head').scrollIntoView({behavior:'smooth',block:'start'})})
    }
    function render(){
      renderCategoryFilters();
      const available=filterByCategory(selectedSeller?sellerItems(listings.filter(postVisible),selectedSeller):marketplaceListings()),totalPages=Math.max(1,Math.ceil(available.length/itemsPerPage));currentMarketPage=Math.min(Math.max(1,currentMarketPage),totalPages);const pageItems=available.slice((currentMarketPage-1)*itemsPerPage,currentMarketPage*itemsPerPage);
      $('#listingCount').textContent=available.length+' available'+(totalPages>1?` · page ${currentMarketPage} of ${totalPages}`:'');
      $('#listingGrid').innerHTML=pageItems.map(item=>{const v=values(item),photos=listingImages(item),catalogPhoto=catalogImages[item.id],src=photos[0]||safeImageSrc(catalogPhoto?.src),photoList=photos.length?photos:(src?[src]:[]),alt=item.alt||catalogPhoto?.alt||item.name,media=src?{src,alt}:null,purchasable=Boolean(item.chainId&&item.deliveryPublicKey&&item.paymentAddress),sampleTrust=item.sample?sampleTrustFor(item.id):null;const controls=photoList.length>1?`<div class="photo-nav"><button type="button" data-photo-prev="${item.id}" aria-label="Previous photo">‹</button><button type="button" data-photo-next="${item.id}" aria-label="Next photo">›</button></div><span class="photo-count" data-photo-count="${item.id}">1 / ${photoList.length}</span>`:'';const picture=media?`<div class="product-media" data-photo-gallery="${item.id}" data-photo-index="0" data-photo-sources="${escapeHtml(JSON.stringify(photoList))}"><img src="${media.src}" alt="${escapeHtml(media.alt)} — photo 1 of ${photoList.length}" loading="${item.id===1?'eager':'lazy'}" decoding="async" data-open-product="${item.id}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.name)}">${controls}</div>`:'<div class="product-media"><div class="product-placeholder">Photos not shared yet</div></div>',trust=sampleTrust?`<button class="trust-badge sample" data-profile-item="${item.id}" title="Open this sample seller profile">★ ${escapeHtml(sampleSellerName(item.id))} · ${sampleTrust.score.toFixed(1)} · ${sampleTrust.count} sample reviews</button>`:item.paymentAddress?`<button class="trust-badge" data-profile-item="${item.id}" title="Open this wallet-linked seller profile">★ ${escapeHtml(sellerIdentity(item))} · ${escapeHtml(trustLabel(item.paymentAddress))}</button>`:'';return `<article class="card" style="--glow:rgba(104,240,197,.18)">${picture}<span class="item-category">${escapeHtml(listingCategory(item))}</span><h3>${escapeHtml(item.name)}</h3><div class="stock">Condition: ${escapeHtml(listingCondition(item))}</div><p>${escapeHtml(item.description)}</p>${trust}<div class="price"><div><div class="primary-price">${xtm(v.itemXtm)}</div><div class="shipping">Shipping: ${xtm(v.shippingXtm)}</div><div class="stock">${item.stock} in stock</div></div><button class="button small" data-buy="${item.id}" ${purchasable?'':'disabled title="Only seller-published listings can be purchased"'}>${purchasable?'Buy':'Catalog'}</button></div></article>`}).join('')||`<div class="category-empty">${selectedSeller?(selectedSeller.sample?'This sample seller has no other linked items.':'This seller has no other available items.'):'No available listings in this category yet.'} Clear the filter or browse categories to see more items.</div>`;
      document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>selectListing(Number(b.dataset.buy)));
      document.querySelectorAll('[data-profile-item]').forEach(button=>button.onclick=()=>openSellerProfile(Number(button.dataset.profileItem)));
      document.querySelectorAll('[data-open-product]').forEach(image=>{image.onclick=()=>openProductDetail(Number(image.dataset.openProduct));image.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProductDetail(Number(image.dataset.openProduct))}}});
      document.querySelectorAll('[data-photo-prev],[data-photo-next]').forEach(button=>button.onclick=()=>cycleListingPhoto(Number(button.dataset.photoPrev||button.dataset.photoNext),button.hasAttribute('data-photo-next')?1:-1));
      renderMarketPagination(totalPages);
      renderOrders();
      renderSellerOrders();
      renderModeration();
      if(selected){selected=listings.find(x=>x.id===selected.id); selected?renderCheckout():clearCheckout()}
      renderWalletState()
    }
    function cycleListingPhoto(itemId,direction){const gallery=document.querySelector(`[data-photo-gallery="${itemId}"]`);if(!gallery)return;let sources=[];try{sources=JSON.parse(gallery.dataset.photoSources||'[]')}catch{}if(sources.length<2)return;const next=(Number(gallery.dataset.photoIndex||0)+direction+sources.length)%sources.length,img=gallery.querySelector('img'),item=listings.find(candidate=>candidate.id===itemId);gallery.dataset.photoIndex=next;img.src=sources[next];img.alt=`${item?.alt||item?.name||'Listing'} — photo ${next+1} of ${sources.length}`;const count=gallery.querySelector('[data-photo-count]');if(count)count.textContent=`${next+1} / ${sources.length}`}
    function openProductDetail(itemId){if(!postVisible(listings.find(item=>item.id===itemId))){toast('This listing is removed or its status is being checked.');return;}const item=listings.find(candidate=>candidate.id===itemId);if(!item)return;const v=values(item),catalogPhoto=catalogImages[item.id],photos=listingImages(item),fallback=safeImageSrc(catalogPhoto?.src),photoList=photos.length?photos:(fallback?[fallback]:[]),alt=item.alt||catalogPhoto?.alt||item.name,sample=item.sample?sampleTrustFor(item.id):null,trust=sample?{score:sample.score,count:sample.count}:trustRecord(item.paymentAddress),score=sample?`${trust.score.toFixed(1)} ★ · ${trust.count} verified ${trust.count===1?'review':'reviews'}`:trust?.ratingCount?`${(trust.totalStars/trust.ratingCount).toFixed(1)} ★ · ${trust.ratingCount} verified ${trust.ratingCount===1?'review':'reviews'}`:'New seller',seller=item.sample?sampleSellerName(item.id):sellerIdentity(item),purchasable=Boolean(item.chainId&&item.deliveryPublicKey&&item.paymentAddress&&newPurchasesReady());const gallery=photoList.length?`<div class="detail-main-photo"><img id="productDetailImage" src="${photoList[0]}" alt="${escapeHtml(alt)} — large photo 1 of ${photoList.length}"></div>${photoList.length>1?`<div class="detail-thumbnails" aria-label="Product photos">${photoList.map((src,index)=>`<button class="detail-thumb ${index===0?'active':''}" type="button" data-detail-photo="${index}" aria-label="View photo ${index+1}"><img src="${src}" alt=""></button>`).join('')}</div>`:''}`:'<div class="detail-main-photo"><div class="product-placeholder">Photos not shared yet</div></div>';$('#productDetailContent').innerHTML=`<div class="product-detail"><section>${gallery}</section><section class="detail-copy"><span class="item-category">${escapeHtml(listingCategory(item))}</span><h2 id="productDetailTitle">${escapeHtml(item.name)}</h2><p class="detail-description">${escapeHtml(item.description)}</p><div class="detail-pricing"><div class="row"><span>Condition</span><strong>${escapeHtml(listingCondition(item))}</strong></div><div class="row"><span>Item price</span><strong>${xtm(v.itemXtm)}</strong></div><div class="row"><span>Shipping</span><strong>${xtm(v.shippingXtm)}</strong></div><div class="row"><span>Total</span><strong>${xtm(v.totalXtm)}</strong></div><div class="row"><span>Available</span><strong>${item.stock} in stock</strong></div><div class="row"><span>Protection</span><strong>Escrow funded at purchase</strong></div></div><div class="seller-summary"><h3>About the seller</h3><div class="seller-summary-score">${escapeHtml(score)}</div><div class="seller-summary-wallet">${escapeHtml(seller)}</div><div class="fine">${item.sample?'Fictional username and sample reviews for this catalog preview.':"Ratings are attached to the seller's connected Ootle wallet and come from verified completed sales."}</div></div><div class="detail-actions"><button class="button" id="productSellerProfile" type="button">Seller profile &amp; reviews</button><button class="button" id="productSellerItems" type="button">See seller’s other items</button><button class="button primary" id="productBuy" type="button" ${item.stock>0?'':'disabled'}>${item.stock>0?'Buy':'Sold out'}</button></div></section></div>`;$('#productDetailContent').querySelectorAll('[data-detail-photo]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.detailPhoto),image=$('#productDetailImage');image.src=photoList[index];image.alt=`${alt} — large photo ${index+1} of ${photoList.length}`;$('#productDetailContent').querySelectorAll('[data-detail-photo]').forEach(candidate=>candidate.classList.toggle('active',candidate===button))});$('#productSellerProfile').onclick=()=>{$('#productDialog').close();openSellerProfile(item.id)};$('#productSellerItems').onclick=()=>showSellerItems(item);$('#productBuy').onclick=()=>{$('#productDialog').close();selectListing(item.id)};$('#productDialog').dataset.listingId=String(item.id);$('#productDialog').showModal();refreshListingBuyControls()}
    function isOwnListing(item){return Boolean(item&&!item.sample&&walletConnection.connected&&typeof item.paymentAddress==='string'&&item.paymentAddress.toLowerCase()===String(walletConnection.accountAddress).toLowerCase())}
    function refreshListingBuyControls(){
      const update=(button,item)=>{if(!button||!item)return;button.disabled=Boolean(purchaseBlockReason(item));button.textContent=isOwnListing(item)?'Your listing':item.stock<=0?'Sold out':item.sample?'Catalog':item.inventoryVerified===false?'Checking availability…':'Buy'};
      document.querySelectorAll('[data-buy]').forEach(button=>update(button,listings.find(item=>item.id===Number(button.dataset.buy))));
      const detail=$('#productDialog');if(detail?.open)update($('#productBuy'),listings.find(item=>item.id===Number(detail.dataset.listingId)));
    }
    function purchaseBlockReason(item){if(isOwnListing(item))return'This is your listing. You cannot buy it with the seller wallet.';if(item?.inventoryVerified===false)return'Listing availability could not be verified. Please refresh before buying.';if(item&&!postVisible(item))return postRegistryReady?'This listing has been removed from Tari Market.':'Checking listing moderation. Please try again shortly.';if(item?.chainId&&item.marketComponent!==MARKET_COMPONENT_ADDRESS)return'The seller needs to relist this item from My Items before it can be purchased.';if(!item||item.stock<=0)return'This item is sold out.';if(item.sample||!item.chainId||!item.deliveryPublicKey||!item.paymentAddress)return'This is a catalog sample. You can review the checkout, but this item is not available for purchase.';if(!newPurchasesReady())return'Payments are paused until the upgraded Ootle escrow contract is activated.';return''}
    function selectListing(id){const item=listings.find(x=>x.id===id);if(!item||!postVisible(item)||item.stock<=0){toast('This item is no longer available');return}if(selected?.id!==id){clearShippingFields()}selected=item;selectedQuote=values(selected);deadline=Date.now()+600000;renderCheckout();clearInterval(timerHandle);timerHandle=setInterval(updateTimer,1000);updateTimer();setPage('checkout')}
    function renderPurchaseItem(){if(!selected)return;const image=listingImages(selected)[0]||safeImageSrc(catalogImages[selected.id]?.src),reason=purchaseBlockReason(selected);$('#purchaseItem').innerHTML=`${image?`<img class="purchase-photo" src="${image}" alt="${escapeHtml(selected.name)}">`:''}<div class="item-category">${escapeHtml(listingCategory(selected))}</div><h2>${escapeHtml(selected.name)}</h2><div class="row"><span>Condition</span><strong>${escapeHtml(listingCondition(selected))}</strong></div><p>${escapeHtml(selected.description)}</p><p>Quantity: 1 · ${selected.stock} available</p><p>Seller: <span class="case-address">${escapeHtml(selected.sample?sampleSellerName(selected.id):selected.paymentAddress||'Seller not connected')}</span></p>${reason?`<div class="purchase-notice" role="status">${escapeHtml(reason)}</div>`:''}`}
    function renderCheckout(){renderPurchaseItem();const v=selectedQuote||values(selected),address=selected.paymentAddress||'';$('#checkoutEmpty').style.display='none';$('#checkoutSummary').classList.add('active');$('#summaryName').textContent=selected.name;$('#summaryReference').textContent='Item and shipping are fixed in tTari';$('#payAmount').textContent=xtm(v.totalXtm);$('#sumItem').textContent=xtm(v.itemXtm);$('#sumShipping').textContent=xtm(v.shippingXtm);$('#sumCondition').textContent=listingCondition(selected);$('#sumSellerTrust').textContent=selected.sample?sampleSellerName(selected.id)+' · Example':trustLabel(address);$('#addressRow').style.display=address?'flex':'none';$('#sumPaymentAddress').textContent=address;renderWalletState()}
    function clearCheckout(){selected=null;selectedQuote=null;$('#checkoutEmpty').style.display='block';$('#checkoutSummary').classList.remove('active');clearInterval(timerHandle)}
    function updateTimer(){const left=Math.max(0,deadline-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);$('#timer').textContent=`${m}:${String(s).padStart(2,'0')}`;if(!left){selectedQuote=values(selected);deadline=Date.now()+600000;renderCheckout();toast('Quote refreshed at current rates')}}
    function recordPaidOrder(transactionId,encryptedDelivery,chainOrderId,purchasedItem=selected,quote=selectedQuote){if(!purchasedItem)return;const selected=purchasedItem,v=quote||values(selected),id='XT-'+String(Date.now()).slice(-7),created=new Date().toISOString(),sellerAddress=selected.paymentAddress||'';const order={id,chainOrderId,name:selected.name,xtm:v.totalXtm,itemXtm:v.itemXtm,shippingXtm:v.shippingXtm,usd:v.usd,status:'In escrow',transactionId,created,sellerAddress,buyerAddress:walletConnection.accountAddress,marketComponent:MARKET_COMPONENT_ADDRESS};orders.unshift(order);orders=orders.slice(0,6);sellerOrders.unshift({id,chainOrderId,listingId:selected.id,name:selected.name,xtm:v.totalXtm,shippingXtm:v.shippingXtm,status:'In escrow',transactionId,created,sellerAddress,marketComponent:MARKET_COMPONENT_ADDRESS,encryptedDelivery});sellerOrders=sellerOrders.slice(0,20);const liveListing=listings.find(item=>item.id===selected.id);if(liveListing)liveListing.stock=Math.max(0,liveListing.stock-1);localStorage.setItem('xtm-market-orders',JSON.stringify(orders));localStorage.setItem('xtm-market-seller-orders',JSON.stringify(sellerOrders));saveListings();clearShippingFields();toast('Purchase completed — tTari deposited into escrow');clearCheckout();render()}
    // Payment cases are derived from contract state, not editable browser statuses.
    let paymentSnapshots=new Map(),paymentRefreshTask=null,paymentBusy=false,paymentAction=null,paymentPending=new Map();
    function paymentAddress(value){const address=firstAddress(value).toLowerCase();return /^[0-9a-f]{64}$/.test(address)?'component_'+address:address}
    function readPaymentOrder(value,key,component){
      if(!TRUSTED_MARKET_COMPONENTS.has(component)||!value||typeof value!=='object'||(Array.isArray(value)&&![15,16].includes(value.length)))throw new Error('Unsupported order format');
      const field=(i,name)=>reviewField(value,i,name),id=Number(field(0,'id')),listingId=Number(field(1,'listing_id')),buyer=paymentAddress(field(3,'buyer_refund_address')),seller=paymentAddress(field(6,'seller_payment_address'));
      const shipped=field(10,'shipped'),delivery=field(11,'delivery_recorded_epoch'),disputed=field(12,'disputed'),settled=field(13,'settled'),refunded=field(14,'refunded');
      if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(listingId)||!/^component_[0-9a-f]{64}$/.test(buyer)||!/^component_[0-9a-f]{64}$/.test(seller)||[shipped,disputed,settled,refunded].some(flag=>typeof flag!=='boolean')||(refunded&&!settled))throw new Error('Could not verify order state');
      const purchaseEpoch=field(15,'purchase_recorded_epoch');
      if(purchaseEpoch!==undefined&&(!Number.isSafeInteger(purchaseEpoch)||purchaseEpoch<0))throw new Error('Invalid purchase epoch');
      const feeValue=field(7,'platform_fee'),fee=typeof feeValue==='number'?feeValue:typeof feeValue==='string'&&/^\d+$/.test(feeValue)?Number(feeValue):NaN;
      return {id,listingId,buyer,seller,purchaseEpoch,fee:Number.isSafeInteger(fee)&&fee>=0?fee:null,shipped,delivered:delivery!==null&&delivery!==undefined,disputed,settled,refunded,component,key:component+':'+id};
    }
    function paymentOutcome(order){
      if(order.refunded)return {label:'Refund approved',detail:'Final verdict: full refund to the buyer’s recorded refund address.',stage:3};
      if(order.settled&&order.disputed)return {label:'Seller payment approved',detail:'Final verdict: the owner released escrow to the seller.',stage:3};
      if(order.settled)return {label:'Payment released',detail:'This order settled without a payment dispute. A new case cannot be opened.',stage:0};
      if(order.disputed)return {label:'Awaiting owner decision',detail:'The dispute is open. Escrow is held until the marketplace owner decides.',stage:2};
      return {label:order.delivered?'Delivered — in escrow':order.shipped?'Shipped — in escrow':'In escrow',detail:'You can request a refund or open a dispute before escrow is released.',stage:0};
    }
    function paymentRows(){return [...paymentSnapshots.values()].flatMap(snapshot=>snapshot.rows.map(order=>({...order,verified:!snapshot.error,checkedAt:snapshot.checkedAt})))}
    function paymentOwnedBy(order,account){return order.buyer===String(account||'').toLowerCase()}
    function paymentCard(order,owner=false){
      const outcome=paymentOutcome(order),waiting=paymentPending.has(order.key),disabled=paymentBusy||waiting||!order.verified,canOpen=!order.disputed&&!order.settled,canDecide=owner&&canModerateComponent(order.component)&&order.disputed&&!order.settled;
      const status=waiting?'Transaction completed — awaiting indexer update':outcome.label;
      const timeline=order.disputed||order.refunded?`<ol class="case-timeline" aria-label="Case progress"><li>Case opened</li><li>${order.settled?'Owner decision completed':'Awaiting owner decision'}</li><li>${order.settled?escapeHtml(outcome.label):'Verdict pending'}</li></ol>`:'';
      const actions=canDecide?`<button class="button small" data-case-action="refund" data-case-key="${order.key}" ${disabled?'disabled':''}>Approve full refund</button><button class="button small" data-case-action="release" data-case-key="${order.key}" ${disabled?'disabled':''}>Pay seller</button>`:!owner&&canOpen?`<button class="button small primary" data-case-action="request" data-case-key="${order.key}" ${disabled?'disabled':''}>Request refund</button><button class="button small" data-case-action="dispute" data-case-key="${order.key}" ${disabled?'disabled':''}>Open dispute</button>`:'';
      return `<article class="payment-case"><div class="case-heading"><h3>${escapeHtml(order.title||'Order #'+order.id)}</h3><span class="case-status">${escapeHtml(status)}</span></div><p class="case-id">Order #${escapeHtml(order.id)} · ${escapeHtml(shortAddress(order.component))}</p><p>${escapeHtml(outcome.detail)}</p>${timeline}${order.refunded?`<p>Refund destination: <span class="case-address">${escapeHtml(order.buyer)}</span></p>`:''}${owner?`<p>Buyer: <span class="case-address">${escapeHtml(order.buyer)}</span></p>`:''}${!order.verified?'<p class="case-warning">Last known state. Refresh successfully before taking action.</p>':''}${actions?`<div class="case-actions">${actions}</div>`:''}</article>`;
    }
    function renderPaymentCases(){
      const box=$('#paymentCaseList'),eligible=$('#paymentEligibleList'),ownerBox=$('#paymentOwnerList');if(!box)return;
      $('#paymentConnect').hidden=walletConnection.connected;
      $('#paymentRefresh').disabled=paymentBusy||Boolean(paymentRefreshTask)||!walletConnection.connected;
      $('#paymentOwnerSection').hidden=!isMarketplaceAdmin();$('#adminRefresh').disabled=!isMarketplaceAdmin()||paymentBusy||Boolean(paymentRefreshTask);
      if(!walletConnection.connected){box.innerHTML='<div class="empty-panel">Connect the wallet used to purchase your item to see its cases.</div>';eligible.innerHTML='';ownerBox.innerHTML='';$('#paymentSync').textContent='Wallet not connected';return}
      const rows=paymentRows(),mine=rows.filter(order=>paymentOwnedBy(order,walletConnection.accountAddress)),cases=mine.filter(order=>order.disputed||order.refunded),available=mine.filter(order=>!order.disputed&&!order.settled),errors=[...paymentSnapshots.values()].filter(s=>s.error);
      $('#paymentSync').textContent=paymentRefreshTask?'Checking on-chain order status…':errors.length?'Some order statuses could not be refreshed. Last known cases are shown; actions are disabled for unverified orders.':paymentSnapshots.size?'Status checked at '+new Date(Math.max(...[...paymentSnapshots.values()].map(s=>s.checkedAt||0))).toLocaleTimeString():'Refresh to load your orders.';
      $('#adminPaymentSync').textContent=isMarketplaceAdmin()?$('#paymentSync').textContent:'';
      box.innerHTML=cases.length?cases.map(order=>paymentCard(order)).join(''):`<div class="empty-panel">${errors.length?'Unable to confirm your complete case history. Try refreshing.':'No refund or dispute cases for this wallet.'}</div>`;
      eligible.innerHTML=available.length?available.map(order=>paymentCard(order)).join(''):`<div class="empty-panel">${errors.length?'Eligible orders are unavailable until their status can be verified.':'No eligible orders. Only purchases still held in escrow can start a case.'}</div>`;
      ownerBox.innerHTML=isMarketplaceAdmin()?(rows.filter(order=>order.disputed&&!order.settled).map(order=>paymentCard(order,true)).join('')||(errors.length?'<div class="empty-panel">Unable to confirm all pending disputes. Refresh to try again.</div>':'<div class="empty-panel">No cases awaiting a decision.</div>')):'';
      document.querySelectorAll('[data-case-action]').forEach(button=>button.onclick=()=>openPaymentAction(button.dataset.caseKey,button.dataset.caseAction));
    }
    function syncWalletOrderHistory(state,component,account){
      if(!walletConnection.connected||walletConnection.accountAddress!==account)return;
      for(const [key,value] of Object.entries(state[4]||{})){
        const row=readPaymentOrder(value,key,component),field=(i,name)=>reviewField(value,i,name);
        const paid=Number(field(5,'xtm_paid'))/1e6,usd=Number(field(4,'usd_cents'))/100;
        if(!Number.isFinite(paid)||paid<0||!Number.isFinite(usd)||usd<0)continue;
        const listing=Object.values(state[3]||{}).find(x=>Number(reviewField(x,0,'id'))===row.listingId);
        const local=listings.find(x=>x.marketComponent===component&&x.chainId===row.listingId);
        const status=row.refunded?'Refunded':row.settled?'Released':row.disputed?'Disputed':row.shipped?'Shipped':'In escrow';
        const common={chainOrderId:row.id,name:String(reviewField(listing,1,'title')||'Order #'+row.id),xtm:paid,usd,status,sellerAddress:row.seller,buyerAddress:row.buyer,marketComponent:component};
        const merge=(target,extra={})=>{let order=target.find(x=>x.marketComponent===component&&x.chainOrderId===row.id);if(!order){order={id:'Order #'+row.id};target.push(order)}Object.assign(order,common,extra)};
        if(row.buyer===account.toLowerCase())merge(orders);
        if(row.seller===account.toLowerCase())merge(sellerOrders,{listingId:local?.id,encryptedDelivery:String(field(9,'encrypted_delivery')||'')});
      }
      saveOrderState();
    }
    async function refreshPaymentCases(){
      if(!walletConnection.connected){renderPaymentCases();return}
      if(paymentRefreshTask)return paymentRefreshTask;
      const account=walletConnection.accountAddress;
      const components=[...new Set([MARKET_COMPONENT_ADDRESS,PREVIOUS_MARKET_COMPONENT,'component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9',...orders.map(order=>order.marketComponent)])].filter(address=>TRUSTED_MARKET_COMPONENTS.has(address));
      paymentRefreshTask=(async()=>{
        await Promise.all(components.map(async component=>{
          try{
            const response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(component)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw new Error('Indexer unavailable');
            const payload=await response.json();
            if(payload.verified!==true)throw new Error('Order state is not verified');
            const state=decodeChainValue(payload?.substate?.Component?.body?.state);
            if(!walletConnection.connected||walletConnection.accountAddress!==account)return;
            const chainOrders=Array.isArray(state)?state[4]:state?.orders,chainListings=Array.isArray(state)?state[3]:state?.listings;
            if(!chainOrders||typeof chainOrders!=='object')throw new Error('Orders unavailable');
            const listingMap=new Map(Object.entries(chainListings||{}).map(([key,value])=>[Number(reviewField(value,0,'id')??key),String(reviewField(value,1,'title')||'')]));
            const rows=Object.entries(chainOrders).map(([key,value])=>{const order=readPaymentOrder(value,key,component);order.title=listingMap.get(order.listingId)||'Order #'+order.id;order.feePaid=Array.isArray(state)&&state.length>=13&&state[12]?.[String(order.id)]===true;return order});
            paymentSnapshots.set(component,{rows,checkedAt:Date.now(),error:false});
            if(Array.isArray(state))syncWalletOrderHistory(state,component,account);
            for(const order of rows){if(order.settled||(paymentPending.get(order.key)==='open'&&order.disputed))paymentPending.delete(order.key)}
          }catch{const previous=paymentSnapshots.get(component);paymentSnapshots.set(component,{rows:previous?.rows||[],checkedAt:previous?.checkedAt||0,error:true})}
        }));
      })();
      renderPaymentCases();
      try{await paymentRefreshTask}finally{paymentRefreshTask=null;renderPaymentCases()}
    }
    let newCaseAction='dispute',caseOrderLoading=false;
    function renderCaseOrderPicker(){
      const select=$('#caseOrderSelect'),ready=walletConnection.connected?paymentRows().filter(order=>order.verified&&paymentOwnedBy(order,walletConnection.accountAddress)&&!order.disputed&&!order.settled&&!paymentPending.has(order.key)):[];
      select.innerHTML='<option value="">Choose an order</option>'+ready.map(order=>`<option value="${escapeHtml(order.key)}">Order #${order.id} · ${escapeHtml(order.title)}</option>`).join('');
      select.disabled=caseOrderLoading||!ready.length;
      $('#caseOrderContinue').disabled=caseOrderLoading||!ready.length||paymentBusy;
      $('#caseOrderRefresh').disabled=caseOrderLoading;
      const hasErrors=[...paymentSnapshots.values()].some(snapshot=>snapshot.error);
      $('#caseOrderStatus').textContent=caseOrderLoading?'Checking your purchases…':!walletConnection.connected?'Connect the wallet used for your purchase, then start your request again.':ready.length?'Choose an unsettled purchase. You will review the request before approving it in your wallet.':hasErrors?'We could not verify your orders. Refresh to try again.':'No eligible purchases found for this wallet. Settled orders and orders with an existing dispute cannot start a new case.';
    }
    async function startPaymentCase(action){
      if(paymentBusy||caseOrderLoading)return;
      newCaseAction=action==='request'?'request':'dispute';setPage('cases');
      if(!walletConnection.connected){$('#walletButton').click();toast('Connect your buying wallet, then select Request refund or Submit dispute.');return}
      $('#caseOrderTitle').textContent=newCaseAction==='request'?'Request a refund':'Submit a dispute';
      if(!$('#caseOrderDialog').open)$('#caseOrderDialog').showModal();
      caseOrderLoading=true;renderCaseOrderPicker();
      try{await refreshPaymentCases()}finally{caseOrderLoading=false;renderCaseOrderPicker()}
    }
    function openPaymentAction(key,action){
      if(paymentBusy)return;
      const order=paymentRows().find(row=>row.key===key);if(!order||!order.verified||!walletConnection.connected)return;
      const ownerAction=action==='refund'||action==='release';
      if(ownerAction?!canModerateComponent(order.component)||!order.disputed||order.settled:!paymentOwnedBy(order,walletConnection.accountAddress)||order.disputed||order.settled)return;
      paymentAction={key,action,account:walletConnection.accountAddress};
      $('#paymentActionTitle').textContent=action==='refund'?'Approve full refund':action==='release'?'Release payment to seller':action==='request'?'Request a refund':'Open a payment dispute';
      $('#paymentActionText').textContent=ownerAction?(action==='refund'?'This settles the case by returning the full escrowed item and shipping payment to the buyer.':'This settles the case in the seller’s favor and releases escrow to the original seller. The security upgrade handles the marketplace fee separately.'):'This opens an on-chain dispute and pauses escrow for owner review. A refund is not automatic. The current contract records the case status but does not accept a reason or evidence attachments.';
      $('#paymentActionOrder').textContent='Order #'+order.id+' · '+order.title;
      $('#paymentActionConfirm').textContent=ownerAction?'Approve in wallet':action==='request'?'Submit refund request':'Submit dispute';
      $('#paymentActionError').textContent='';$('#paymentActionConfirm').disabled=false;$('#paymentActionDialog').showModal();
    }
    async function submitPaymentAction(event){
      event.preventDefault();if(paymentBusy||!paymentAction)return;
      const request={...paymentAction};paymentBusy=true;$('#paymentActionConfirm').disabled=true;$('#paymentActionError').textContent='';
      try{
        await refreshPaymentCases();
        const order=paymentRows().find(row=>row.key===request.key),ownerAction=request.action==='refund'||request.action==='release';
        if(!walletConnection.connected||walletConnection.accountAddress!==request.account)throw new Error('Reconnect the wallet that started this action.');
        if(!order?.verified)throw new Error('The current order status could not be verified. Try again after refreshing.');
        if(order.settled)throw new Error('This order is already settled. Refresh to view its outcome.');
        if(ownerAction?(!canModerateComponent(order.component)||!order.disputed):(!paymentOwnedBy(order,request.account)||order.disputed))throw new Error('This action is no longer available for this order.');
        const method=ownerAction?'resolve_dispute':'open_dispute',args=[literal(cborHead(0,order.id))];if(ownerAction)args.push(literal(cborBool(request.action==='refund')));
        await submitInstructions([componentCall(order.component,method,args)],ownerAction?(request.action==='refund'?'Resolve case with a full buyer refund':'Resolve case by paying the seller'):'Open a refund or dispute case and hold escrow');
        paymentPending.set(order.key,ownerAction?'resolve':'open');$('#paymentActionDialog').close();paymentAction=null;
        await refreshPaymentCases();toast('Transaction completed. Case status is being refreshed.');
      }catch(error){$('#paymentActionError').textContent=error.message||'The transaction did not complete. No verdict has been recorded by this page.'}
      finally{paymentBusy=false;$('#paymentActionConfirm').disabled=false;renderPaymentCases()}
    }

    async function paySellerFee(orderId,component=MARKET_COMPONENT_ADDRESS){if(!TRUSTED_MARKET_COMPONENTS.has(component))return;
      if(!SECURITY_UPGRADE_READY||transactionBusy)return;
      const account=walletConnection.accountAddress;
      try{
        await refreshPaymentCases();
        const order=paymentRows().find(row=>row.component===component&&row.id===orderId);
        if(!walletConnection.connected||account!==walletConnection.accountAddress||!order?.verified||order.seller!==account.toLowerCase()||!order.settled||order.refunded||order.feePaid||order.fee===null)throw new Error('This fee is not available for payment. Refresh your orders.');
        if(order.fee===0){toast('No fee is due for this order.');return}
        await submitInstructions([
          componentCall(account,'withdraw',[literal(cborAddress('resource_0101010101010101010101010101010101010101010101010101010101010101',131)),literal(cborHead(0,order.fee))]),
          {PutLastInstructionOutputOnWorkspace:{key:0}},
          componentCall(order.component,'pay_marketplace_fee',[literal(cborHead(0,order.id)),{Workspace:{id:0,offset:null}}])
        ],`Pay the separate marketplace fee of ${xtm(order.fee/1000000)} from your wallet for order #${order.id}. Escrow funds are not used.`);
        await refreshPaymentCases();renderSellerOrders();toast('Marketplace fee payment completed.');
      }catch(error){toast(error.message||'Fee payment was not approved.')}
    }
    function saveOrderState(){localStorage.setItem('xtm-market-orders',JSON.stringify(orders));localStorage.setItem('xtm-market-seller-orders',JSON.stringify(sellerOrders))}
    function setEscrowStatus(chainOrderId,status,component=MARKET_COMPONENT_ADDRESS){orders.forEach(order=>{if(order.marketComponent===component&&order.chainOrderId===chainOrderId)order.status=status});sellerOrders.forEach(order=>{if(order.marketComponent===component&&order.chainOrderId===chainOrderId)order.status=status});saveOrderState();renderOrders();renderSellerOrders()}
    async function escrowOrderAction(chainOrderId,method,status,summary,component=MARKET_COMPONENT_ADDRESS){if(!TRUSTED_MARKET_COMPONENTS.has(component))return;if(!MARKET_COMPONENT_ADDRESS){toast('Escrow component deployment is pending');return}if(!walletConnection.connected){$('#walletDialog').showModal();return}try{await submitInstructions([componentCall(component,method,[literal(cborHead(0,Number(chainOrderId)))])],summary);setEscrowStatus(chainOrderId,status,component);await refreshTrustScores();toast(status==='Disputed'?'Escrow paused for dispute':status==='Released'?'Escrow released':'Order updated')}catch(error){toast(error.message||'The escrow update was not approved')}}
    function reviewCard(review){
      if(!Number.isInteger(review.stars)||review.stars<1||review.stars>5)return '';
      const comment=review.comment?`<p>${escapeHtml(review.comment)}</p>`:'<p class="fine">Legacy review: no written comment was recorded.</p>',status=review.disputed?'<span class="review-status">Under dispute</span>':'';
      return `<article class="review-card"><div class="review-head"><span class="review-stars">${'★'.repeat(review.stars)}${'☆'.repeat(5-review.stars)}</span><span class="count">${review.automatic?'Automatic review · completed sale':'Verified sale'}</span></div>${comment}<div class="review-meta">Order ${escapeHtml(review.orderId)} ${status}</div></article>`
    }
    function openSellerProfile(itemId){
      const item=listings.find(candidate=>candidate.id===itemId);if(!item)return;
      const isSample=Boolean(item.sample),reviews=isSample?(sampleReviews[item.id]||[]).map((review,index)=>({...review,orderId:`SAMPLE-${item.id}-${index+1}`,disputed:false})) : reviewsForSeller(item.paymentAddress),trust=isSample?sampleTrustFor(item.id):trustRecord(item.paymentAddress),score=isSample?`${trust.score.toFixed(1)} ★`:trust?.ratingCount?`${(trust.totalStars/trust.ratingCount).toFixed(1)} ★`:'New',count=isSample?trust.count:(trust?.ratingCount||0),identity=isSample?sampleSellerName(item.id):sellerIdentity(item);
      $('#profileContent').innerHTML=`<div class="profile-summary"><div class="profile-score">${escapeHtml(score)}</div><div><strong>${escapeHtml(identity)}</strong><div class="profile-wallet">${isSample?'Example ratings and comments for preview purposes.':escapeHtml(item.paymentAddress||'')}</div><div class="count">${count} verified ${count===1?'review':'reviews'}</div></div></div><div class="profile-reviews">${reviews.length?reviews.map(reviewCard).join(''):'<div class="empty-panel">This seller has no written reviews yet.</div>'}</div>`;
      $('#profileDialog').showModal()
    }
    async function submitSellerReview(chainOrderId,stars,comment){
      if(!reviewCommentsReady){toast('Buyer comments require the v0.5 market component');return}
      if(!comment.trim()){toast('A written review comment is required');return}
      if(!walletConnection.connected){$('#walletDialog').showModal();return}
      try{
        await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'review_seller',[literal(cborHead(0,Number(chainOrderId))),literal(cborHead(0,Number(stars))),literal(cborText(comment))])],`Leave this seller a ${stars}-star verified review`);
        const order=orders.find(candidate=>candidate.marketComponent===MARKET_COMPONENT_ADDRESS&&candidate.chainOrderId===chainOrderId);if(order)order.review={stars,comment};
        saveOrderState();await refreshTrustScores();toast('Verified rating and comment added')
      }catch(error){toast(error.message||'The seller review was not approved')}
    }
    function renderOrders(){
      const box=$('#orderList');
      const ownOrders=walletConnection.connected?orders.filter(order=>order.buyerAddress===walletConnection.accountAddress.toLowerCase()):[];
      box.innerHTML=ownOrders.length?ownOrders.map(order=>{
        const chainReview=order.marketComponent===MARKET_COMPONENT_ADDRESS?sellerReviews.find(candidate=>candidate.orderId===order.chainOrderId):null;
        const displayedReview=chainReview?(chainReview.removed?null:chainReview):order.review;
        const active=TRUSTED_MARKET_COMPONENTS.has(order.marketComponent)&&order.chainOrderId&&!['Released','Refunded','Disputed'].includes(order.status),actions=active?`<div class="order-actions"><button class="button small" data-component="${escapeHtml(order.marketComponent)}" data-buyer-action="confirm_receipt" data-order-id="${order.chainOrderId}">Confirm received &amp; review</button><button class="button small danger" data-buyer-action="open_dispute" data-order-id="${order.chainOrderId}">Open dispute</button></div>`:'',canReview=reviewCommentsReady&&order.status==='Released'&&order.chainOrderId&&!order.review&&!chainReview&&order.marketComponent===MARKET_COMPONENT_ADDRESS,review=displayedReview?reviewCard({orderId:order.chainOrderId,...displayedReview}):canReview?`<div class="review-form"><label>Rating and required public comment<select class="select" data-review-stars="${order.chainOrderId}" required><option value="">Choose a rating</option>${[5,4,3,2,1].map(stars=>`<option value="${stars}">${stars} star${stars===1?'':'s'}</option>`).join('')}</select><textarea class="input review-comment" data-review-comment="${order.chainOrderId}" maxlength="500" required placeholder="Describe the item, communication, shipping, and overall sale."></textarea></label><div class="review-submit"><span class="count">Comment required · 500 characters maximum</span><button class="button small primary" data-submit-review="${order.chainOrderId}">Post review</button></div></div>`:'';
        return `<div class="order"><div><strong>${escapeHtml(order.name)}</strong><small>${escapeHtml(order.id)}</small>${review}</div><div><strong>${xtm(order.xtm)}</strong><div class="status">${escapeHtml(order.status)}</div>${actions}</div></div>`
      }).join(''):'<div class="none">Connect the wallet used for your purchases. Orders load from the network; if none appear, check the network status in Refunds & disputes.</div>';
      box.querySelectorAll('[data-buyer-action]').forEach(button=>button.onclick=()=>button.dataset.buyerAction==='confirm_receipt'?openReceiptReview(Number(button.dataset.orderId),button.dataset.component):setPage('cases'));
      box.querySelectorAll('[data-submit-review]').forEach(button=>button.onclick=()=>{const id=Number(button.dataset.submitReview),stars=Number(box.querySelector(`[data-review-stars="${id}"]`).value),comment=box.querySelector(`[data-review-comment="${id}"]`).value.trim();if(!stars){toast('Choose a one-to-five-star rating');return}if(!comment){toast('A written review comment is required');return}submitSellerReview(id,stars,comment)})
    }
    function openReviewDispute(orderId){$('#reviewDisputeOrder').value=orderId;$('#reviewDisputeReason').value='';$('#reviewDisputeDialog').showModal()}
    async function renderSellerOrders(){
      const box=$('#sellerOrderList');if(!box)return;renderSellerTrust();
      if(!walletConnection.connected){box.innerHTML='<div class="none">Connect your Tari wallet to see sales and reviews for your listings.</div>';return}
      const account=walletConnection.accountAddress.toLowerCase(),sales=sellerOrders.filter(sale=>String(sale.sellerAddress||'').toLowerCase()===account);
      if(!sales.length){box.innerHTML='<div class="none">No sales have been received by this wallet yet.</div>';return}
      const rows=await Promise.all(sales.map(async sale=>{
        const delivery=await decryptSellerDelivery(sale),details=delivery?`<div class="delivery-address">${delivery.name?`<strong>${escapeHtml(delivery.name)}</strong>`:''}${escapeHtml(delivery.address)}</div>`:'<div class="delivery-address">Shipping details are encrypted. This listing’s key is available only in the browser where it was created.</div>',canShip=TRUSTED_MARKET_COMPONENTS.has(sale.marketComponent)&&sale.chainOrderId&&sale.status==='In escrow',canClaim=TRUSTED_MARKET_COMPONENTS.has(sale.marketComponent)&&sale.chainOrderId&&(SECURITY_UPGRADE_READY?['In escrow','Shipped','Delivered']:['Shipped','Delivered']).includes(sale.status),actions=(canShip?`<div class="order-actions"><button class="button small" data-component="${escapeHtml(sale.marketComponent)}" data-seller-action="mark_shipped" data-order-id="${sale.chainOrderId}">Mark shipped</button></div>`:'')+(canClaim?`<div class="order-actions"><button class="button small" data-component="${escapeHtml(sale.marketComponent)}" data-seller-action="claim_after_timeout" data-order-id="${sale.chainOrderId}">Claim eligible payment</button></div>`:''),review=sale.marketComponent===MARKET_COMPONENT_ADDRESS?sellerReviews.find(candidate=>candidate.orderId===sale.chainOrderId&&!candidate.removed):null,reviewView=review?`${reviewCard(review)}${review.disputed?'<div class="moderation-note">This review is waiting for an owner decision.</div>':`<div class="order-actions"><button class="button small danger" data-dispute-review="${review.orderId}">Dispute rating or comment</button></div>`}`:'';
        const feeOrder=paymentRows().find(order=>order.component===sale.marketComponent&&order.id===sale.chainOrderId),feeAction=SECURITY_UPGRADE_READY&&TRUSTED_MARKET_COMPONENTS.has(sale.marketComponent)&&feeOrder?.verified&&feeOrder.settled&&!feeOrder.refunded&&!feeOrder.feePaid&&feeOrder.fee>0?`<button class="button small" data-component="${escapeHtml(sale.marketComponent)}" data-pay-seller-fee="${feeOrder.id}">Pay separate 3% fee</button>`:'';
        return `<div class="order seller-order"><div><span class="new-sale">Escrow sale</span><strong>${escapeHtml(sale.name)}</strong><small>${escapeHtml(sale.id)} · ${sale.created?new Date(sale.created).toLocaleString():'Recovered from the network'}</small>${details}<div class="fine">Payment entered escrow at purchase and remains held until release or refund.</div>${reviewView}</div><div><strong>${xtm(sale.xtm)}</strong><div class="status">${escapeHtml(sale.status)}</div>${actions}${feeAction}</div></div>`
      }));
      box.innerHTML=rows.join('');
      box.querySelectorAll('[data-pay-seller-fee]').forEach(button=>button.onclick=()=>paySellerFee(Number(button.dataset.paySellerFee),button.dataset.component));
      box.querySelectorAll('[data-seller-action]').forEach(button=>button.onclick=()=>escrowOrderAction(Number(button.dataset.orderId),button.dataset.sellerAction,button.dataset.sellerAction==='mark_shipped'?'Shipped':'Released',button.dataset.sellerAction==='mark_shipped'?'Mark escrow order shipped':'Claim escrow after the 14-day release period',button.dataset.component));
      box.querySelectorAll('[data-dispute-review]').forEach(button=>button.onclick=()=>openReviewDispute(Number(button.dataset.disputeReview)))
    }
    function renderModeration(){
      const box=$('#moderationList');if(!box)return;if(!isMarketplaceAdmin()){box.innerHTML='';return}
      if(!reviewCommentsReady){box.innerHTML='<div class="empty-panel">Review moderation is unavailable until the review upgrade is active and its status can be loaded.</div>';return}
      const visible=sellerReviews.filter(review=>review.disputed&&!review.removed);
      box.innerHTML=visible.length?visible.map(review=>`<div>${reviewCard(review)}${review.disputed?`<div class="moderation-note"><strong>Seller dispute:</strong> ${escapeHtml(review.reason)}</div>`:''}<div class="profile-wallet">${escapeHtml(review.sellerAddress)}</div><div class="moderation-actions">${review.disputed?`<button class="button small" data-keep-review="${review.orderId}">Keep review</button>`:''}<button class="button small danger" data-remove-review="${review.orderId}">Remove review</button></div></div>`).join(''):'<div class="empty-panel">No active reviews require moderation.</div>';
      box.querySelectorAll('[data-keep-review]').forEach(button=>button.onclick=()=>moderateReview(Number(button.dataset.keepReview),false));
      box.querySelectorAll('[data-remove-review]').forEach(button=>button.onclick=()=>moderateReview(Number(button.dataset.removeReview),true))
    }
    async function moderateReview(orderId,remove){
      if(!isMarketplaceAdmin()){toast('Connect an authorized owner or admin wallet to resolve disputes.');return}
      const review=sellerReviews.find(candidate=>candidate.orderId===orderId);if(!review)return;
      try{
        const method=review.disputed?'resolve_review_dispute':'remove_review',args=review.disputed?[literal(cborHead(0,orderId)),literal(cborBool(remove)),literal(cborText(remove?'Removed by marketplace owner after review.':'Reviewed and retained by marketplace owner.'))]:[literal(cborHead(0,orderId)),literal(cborText('Removed by marketplace owner for policy enforcement.'))];
        await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,method,args)],remove?'Remove this seller review':'Keep this seller review');
        await refreshTrustScores();toast(remove?'Review removed from profile and score':'Review retained and dispute closed')
      }catch(error){toast(error.message||'Only the marketplace owner can moderate reviews')}
    }
    function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
    function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
    const legalDialog=$('#legalDialog'),legalAccept=$('#legalAccept'),legalEnter=$('#legalEnter');
    function legalNoticeAccepted(){try{return sessionStorage.getItem('xtm-market-legal-notice-v2')==='accepted'}catch{return false}}
    let legalReachedBottom=false;
    function updateLegalScroll(){
      if(!legalDialog.open)return;
      if(legalDialog.scrollTop+legalDialog.clientHeight>=legalDialog.scrollHeight-8)legalReachedBottom=true;
      legalAccept.disabled=!legalReachedBottom;
      legalEnter.disabled=!legalReachedBottom||!legalAccept.checked;
    }
    function openLegalNotice(){
      legalReachedBottom=false;
      legalAccept.checked=false;
      legalAccept.disabled=true;
      legalEnter.disabled=true;
      legalDialog.showModal();
      $('#legalTitle').focus({preventScroll:true});
      legalDialog.scrollTop=0;
      updateLegalScroll();
    }
    function showLegalNotice(){if(!legalNoticeAccepted()&&!legalDialog.open)openLegalNotice()}
    $('#legalReopen').addEventListener('click',openLegalNotice);
    legalDialog.addEventListener('scroll',updateLegalScroll);
    window.addEventListener('resize',updateLegalScroll);
    legalDialog.addEventListener('cancel',event=>event.preventDefault());
    legalAccept.addEventListener('change',updateLegalScroll);
    $('#legalForm').addEventListener('submit',event=>{event.preventDefault();if(!legalReachedBottom||!legalAccept.checked)return;try{sessionStorage.setItem('xtm-market-legal-notice-v2','accepted')}catch{}legalDialog.close()});
    $('#feeBack').onclick=()=>setPage('market');
    $('#purchaseBack').onclick=()=>setPage('market');
    $('#purchaseEscrowHelp').onclick=()=>setPage('escrow');
    $('#purchaseDisputeHelp').onclick=()=>setPage('disputes');
    $('#paymentRefresh').onclick=refreshPaymentCases;
    $('#paymentConnect').onclick=()=>$('#walletButton').click();
    $('#adminRoleForm').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);changeAdmin('grant_admin',String(data.get('account')).trim().toLowerCase(),String(data.get('key')).trim().toLowerCase())};
    setInterval(()=>{renderWalletState();if(walletConnection.connected)refreshTrustScores()},30000);
    $('#adminRefresh').onclick=async()=>{if(!isMarketplaceAdmin())return;await Promise.all([refreshPaymentCases(),refreshTrustScores()])};
    $('#paymentGuide').onclick=()=>setPage('disputes');
    document.querySelectorAll('[data-start-case]').forEach(button=>button.onclick=()=>startPaymentCase(button.dataset.startCase));
    $('#caseOrderClose').onclick=()=>$('#caseOrderDialog').close();
    $('#caseOrderRefresh').onclick=()=>startPaymentCase(newCaseAction);
    $('#caseOrderForm').onsubmit=event=>{event.preventDefault();if(caseOrderLoading||paymentBusy)return;const key=$('#caseOrderSelect').value,order=paymentRows().find(row=>row.key===key);if(!order||!order.verified||!walletConnection.connected||!paymentOwnedBy(order,walletConnection.accountAddress)||order.disputed||order.settled||paymentPending.has(key)){renderCaseOrderPicker();return}$('#caseOrderDialog').close();openPaymentAction(key,newCaseAction)};
    $('#paymentActionForm').onsubmit=submitPaymentAction;
    $('#paymentActionClose').onclick=$('#paymentActionCancel').onclick=()=>{if(!paymentBusy){paymentAction=null;$('#paymentActionDialog').close()}};
    $('#paymentActionDialog').addEventListener('cancel',event=>{if(paymentBusy)event.preventDefault();else paymentAction=null});
    setInterval(()=>{if(pageFromHash()==='cases'&&walletConnection.connected&&!document.hidden)refreshPaymentCases()},30000);
    $('#orderButton').onclick=payWithWallet;
    document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>setPage(button.dataset.page));
    window.addEventListener('hashchange',()=>setPage(pageFromHash(),false));
    const dialog=$('#listingDialog');$('#listButton').onclick=()=>{const address=$('#listingForm').elements.paymentAddress;address.value=walletConnection.connected?walletConnection.accountAddress:'';address.readOnly=true;const known=[...usernameListings.values()].find(row=>row.address===String(walletConnection.accountAddress||'').toLowerCase());$('#sellerUsername').value=known?.name||'';updateUsernameStatus();dialog.showModal()};$('#closeDialog').onclick=$('#cancelDialog').onclick=()=>dialog.close();
    const walletDialog=$('#walletDialog');$('#walletButton').onclick=()=>openWalletConnection();$('#closeWalletDialog').onclick=$('#cancelWallet').onclick=()=>walletDialog.close();$('#walletForm').onsubmit=connectWallet;$('#walletConnectionMethod').onchange=()=>{browserUnlockPending=false;$('#pairingPanel').classList.remove('show');$('#pairingUri').value='';renderWalletConnectionChoice()};$('#disconnectWallet').onclick=disconnectWallet;
    $('#closeProfile').onclick=()=>$('#profileDialog').close();
    $('#closeProduct').onclick=()=>$('#productDialog').close();
    let receiptReviewComponent=MARKET_COMPONENT_ADDRESS,receiptReviewBusy=false;
    function openReceiptReview(orderId,component=MARKET_COMPONENT_ADDRESS){if(receiptReviewBusy||!TRUSTED_MARKET_COMPONENTS.has(component))return;receiptReviewComponent=component;$('#receiptReviewOrder').value=orderId;$('#receiptReviewStars').value='';$('#receiptReviewComment').value='';$('#receiptReviewStatus').textContent='';$('#receiptReviewDialog').showModal()}
    $('#closeReceiptReview').onclick=$('#cancelReceiptReview').onclick=()=>{if(!receiptReviewBusy)$('#receiptReviewDialog').close()};
    $('#receiptReviewDialog').addEventListener('cancel',event=>{if(receiptReviewBusy)event.preventDefault()});
    async function submitReceiptReview(event){
      event.preventDefault();if(receiptReviewBusy)return;
      const component=receiptReviewComponent,orderId=Number($('#receiptReviewOrder').value),stars=Number($('#receiptReviewStars').value),comment=$('#receiptReviewComment').value.trim(),account=walletConnection.accountAddress;
      const status=$('#receiptReviewStatus'),button=$('#receiptReviewSubmit');
      if(!TRUSTED_MARKET_COMPONENTS.has(component)||!safeId(orderId)){status.textContent='Select a valid order.';return}
      if(!Number.isInteger(stars)||stars<1||stars>5||!comment){status.textContent='Choose a rating and enter a written review.';return}
      if(!walletConnection.connected){status.textContent='Connect the buyer wallet before confirming receipt.';return}
      const sameWallet=()=>walletConnection.connected&&walletConnection.accountAddress===account;
      const currentOrder=()=>paymentRows().find(row=>row.component===component&&row.id===orderId&&row.verified&&paymentOwnedBy(row,account));
      const refresh=async()=>{await refreshPaymentCases();if(!sameWallet())throw new Error('Wallet changed. Reconnect the buyer wallet and refresh your orders.');return currentOrder()};
      const finish=message=>{saveOrderState();renderOrders();void renderSellerOrders();$('#receiptReviewDialog').close();toast(message);void refreshTrustScores().catch(()=>{})};
      receiptReviewBusy=true;button.disabled=true;button.textContent='Checking order…';status.textContent='Checking the latest order status before requesting payment release.';
      for(const id of ['#closeReceiptReview','#cancelReceiptReview','#receiptReviewStars','#receiptReviewComment'])$(id).disabled=true;
      try{
        const before=await refresh();
        if(!before)throw new Error('Could not verify this order for your buyer wallet. No new request was sent.');
        if(before.settled){finish(before.refunded?'This order was already refunded. Orders refreshed.':'This order was already settled. Orders refreshed.');return}
        if(before.disputed)throw new Error('This order has an open dispute. Wait for its resolution before confirming receipt.');
        button.textContent='Waiting for wallet…';status.textContent='Approve the receipt confirmation in your wallet. Keep this page open; do not submit again.';
        await submitInstructions([componentCall(component,'confirm_receipt_and_review',[literal(cborHead(0,orderId)),literal(cborHead(0,stars)),literal(cborText(comment))])],`Confirm receipt, leave ${stars} stars, and release escrow`);
        if(!sameWallet())throw new Error('Wallet changed. Refresh your orders with the buyer wallet.');
        const order=orders.find(row=>row.marketComponent===component&&row.chainOrderId===orderId);
        if(order){order.status='Released';order.review={stars,comment}}
        sellerOrders.forEach(row=>{if(row.marketComponent===component&&row.chainOrderId===orderId)row.status='Released'});
        finish('Receipt confirmed, review posted, and escrow released.');
      }catch(error){
        button.textContent='Checking transaction…';status.textContent='Checking whether the order completed. No second transaction will be sent.';
        let reconciled;try{if(sameWallet())reconciled=await refresh()}catch{}
        if(reconciled?.settled){finish(reconciled.refunded?'This order is refunded. Orders refreshed.':'The order is settled on-chain. Orders refreshed.');}
        else status.textContent=(error.message||'Receipt confirmation could not be verified.')+' Check your wallet before retrying; a pending transaction may still complete.';
      }finally{
        receiptReviewBusy=false;button.disabled=false;button.textContent='Confirm receipt & release payment';
        for(const id of ['#closeReceiptReview','#cancelReceiptReview','#receiptReviewStars','#receiptReviewComment'])$(id).disabled=false;
      }
    }
    $('#receiptReviewForm').onsubmit=submitReceiptReview;
    $('#closeReviewDispute').onclick=$('#cancelReviewDispute').onclick=()=>$('#reviewDisputeDialog').close();
    $('#reviewDisputeForm').onsubmit=async event=>{event.preventDefault();if(!reviewCommentsReady){toast('Seller disputes require the v0.5 market component');return}if(!walletConnection.connected){$('#reviewDisputeDialog').close();$('#walletDialog').showModal();return}const orderId=Number($('#reviewDisputeOrder').value),reason=$('#reviewDisputeReason').value.trim();if(!reason)return;try{await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'dispute_review',[literal(cborHead(0,orderId)),literal(cborText(reason))])],'Dispute this seller review');$('#reviewDisputeDialog').close();await refreshTrustScores();toast('Review dispute sent to the marketplace owner')}catch(error){toast(error.message||'The review dispute was not approved')}};
    $('#copyPairing').onclick=async()=>{const uri=$('#pairingUri').value;if(!uri)return;try{await navigator.clipboard.writeText(uri);toast('Pairing link copied')}catch{toast('Select and copy the pairing link')} };
    let selectedListingFiles=[],listingPreviewUrls=[];
    function renderListingPreviews(){for(const url of listingPreviewUrls)URL.revokeObjectURL(url);listingPreviewUrls=[];const preview=$('#uploadPreview');if(!selectedListingFiles.length){preview.classList.remove('active');preview.innerHTML='';return}preview.classList.add('active');preview.innerHTML=selectedListingFiles.map((file,index)=>{const url=URL.createObjectURL(file);listingPreviewUrls.push(url);return `<div class="upload-preview-item"><img src="${url}" alt="Item photo ${index+1} preview"><button class="remove-upload" type="button" data-remove-upload="${index}" aria-label="Remove photo ${index+1}">×</button></div>`}).join('');preview.querySelectorAll('[data-remove-upload]').forEach(button=>button.onclick=()=>{selectedListingFiles.splice(Number(button.dataset.removeUpload),1);renderListingPreviews()})}
    $('#listingImage').onchange=e=>{const files=Array.from(e.target.files||[]);$('#listingError').textContent='';if(files.length>8){$('#listingError').textContent='Choose no more than 8 photos.';e.target.value='';selectedListingFiles=[];renderListingPreviews();return}const invalid=files.find(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024);if(invalid){$('#listingError').textContent=invalid.size>5*1024*1024?'Each photo must be smaller than 5 MB.':'Choose only JPG, PNG, or WebP photos.';e.target.value='';selectedListingFiles=[];renderListingPreviews();return}selectedListingFiles=files;renderListingPreviews()};
    $('#copyAddress').onclick=async()=>{const address=selected?.paymentAddress;if(!address)return;try{await navigator.clipboard.writeText(address);toast('Payment address copied')}catch{toast('Could not copy the address')}};
    $('#listingForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,d=new FormData(form),button=$('#publishListing'),errorBox=$('#listingError');errorBox.textContent='';if(!newPurchasesReady()){errorBox.textContent='Listing creation and username registration will reopen after the marketplace upgrade is activated.';return}if(!walletConnection.connected){dialog.close();$('#walletDialog').showModal();toast('Connect your Tari wallet before listing');return}button.disabled=true;button.textContent='Preparing listing…';try{const id=Date.now(),name=String(d.get('name')).trim(),description=String(d.get('description')).trim(),category=String(d.get('category')||''),condition=String(d.get('condition')||''),price=Number(d.get('price')),shipping=Number(d.get('shipping')),stock=Number(d.get('stock')),paymentAddress=String(d.get('paymentAddress')).trim(),sellerUsername=normalizeSellerUsername(d.get('sellerUsername'));if(!sellerUsername)throw new Error('Choose a valid seller username.');if(paymentAddress.toLowerCase()!==walletConnection.accountAddress.toLowerCase())throw new Error('Use your connected Tari wallet as the payment address.');if(!ITEM_CONDITIONS.includes(condition))throw new Error('Choose the item condition.');if(!CATEGORIES.includes(category))throw new Error('Choose a category for this item.');if(!/^component_[0-9a-f]{64}$/i.test(paymentAddress))throw new Error('Paste an Ootle Tari wallet address beginning with component_.');const images=await prepareListingImages(selectedListingFiles),deliveryPublicKey=await generateDeliveryKeyPair(id),usdCents=Math.max(1,Math.round((price+shipping)*xtmRate()*100)),instructions=[componentCall(MARKET_COMPONENT_ADDRESS,'create_listing',[literal(cborText(name)),literal(cborHead(0,usdCents)),literal(cborHead(0,atomicTari(price))),literal(cborHead(0,shipping>0?atomicTari(shipping):0)),literal(cborAddress(paymentAddress,128)),literal(cborText(deliveryPublicKey)),literal(cborHead(0,stock)),literal(cborText(sellerUsername))])];button.textContent='Waiting for wallet…';const receipt=await submitInstructions(instructions,`Publish as @${sellerUsername}: ${name} for ${xtm(price)} plus ${xtm(shipping)} shipping`),chainId=returnedListingId(receipt.result);if(!chainId)throw new Error('The listing transaction finalized, but its listing ID could not be read.');const listing={id,chainId,marketComponent:MARKET_COMPONENT_ADDRESS,name,description,price,shipping,stock,paymentAddress,deliveryPublicKey,category,condition,images,image:images[0]||'',alt:name,glow:'rgba(104,240,197,.2)'};listings.unshift(listing);selectedSeller=null;selectedCategory='All';currentMarketPage=1;saveListings();let photoMessage='';{try{await shareListingPhotos(listing,images);photoMessage='Listing details are shared with everyone.'}catch(photoError){listing.mediaPending=true;saveListings();photoMessage='Listing details are saved locally but not shared yet. Use Recover saved details & photos in My Items to retry.'}}form.reset();selectedListingFiles=[];renderListingPreviews();dialog.close();await refreshTrustScores();render();$('#sharedPhotoStatus').textContent=photoMessage;toast('Listing published'+(listing.mediaPending?' — sharing needs retrying':images.length?' with shared photos':''))}catch(problem){errorBox.textContent=problem.message||'Could not publish this listing.'}finally{button.disabled=false;button.textContent='Publish listing'}};
    $('#sellerUsername').oninput=updateUsernameStatus;
    document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',promptSavedBrowserWallet));
    document.addEventListener('visibilitychange',promptSavedBrowserWallet);
    showLegalNotice();render();renderWalletState();setPage(pageFromHash(),false);refreshRates();refreshTrustScores();setInterval(refreshRates,60000);setInterval(refreshTrustScores,30000);restoreWalletSession();
    $('#refreshMyItems').onclick=refreshMyItems;$('#editItemForm').onsubmit=saveMyItem;$('#closeEditItem').onclick=()=>$('#editItemDialog').close();
    const modelContext=document.modelContext;
    if(modelContext?.registerTool){
      try{void Promise.resolve(modelContext.registerTool({name:'quote_listing',title:'Quote listing',description:'Read the condition and fixed tTari item, shipping, and total prices for one marketplace listing.',inputSchema:{type:'object',properties:{listing_id:{type:'number'}},required:['listing_id'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async input=>{if(!input||typeof input.listing_id!=='number')throw new Error('listing_id must be a number');const item=listings.find(x=>x.id===input.listing_id);if(!item)throw new Error('Listing not found');const quote=values(item);return{listing_id:item.id,listing:item.name,condition:listingCondition(item),item_tTari:quote.itemXtm,shipping_tTari:quote.shippingXtm,total_tTari:quote.totalXtm}}})).catch(()=>{})}catch{}
    }

    $('#testWalletBackup').onclick=async()=>{try{const test=await testWalletModule(),blob=new Blob([test.backup()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tari-market-test-wallet-encrypted.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){$('#testWalletStatus').textContent=e.message}};
    $('#testWalletRestore').onclick=()=>$('#testWalletBackupFile').click();
    $('#testWalletBackupFile').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100000)throw new Error('Backup is too large.');(await testWalletModule()).restore(await file.text());rememberWalletPreference('testnet');renderWalletConnectionChoice();$('#testWalletStatus').textContent='Backup restored. Enter its password to unlock.'}catch(e){$('#testWalletStatus').textContent=e.message}finally{event.target.value=''}};
