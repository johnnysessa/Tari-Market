
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
    const savedCommunityListings=(savedListings||[]).filter(item=>!seed.some(product=>product.id===item.id));
    let listings=[...savedCommunityListings,...seed.map(item=>({...item,stock:savedCatalogStock.get(item.id)??item.stock}))];
    let orders=storedRows('xtm-market-orders',safeStoredOrder),sellerOrders=storedRows('xtm-market-seller-orders',safeStoredOrder),scrubbedOrderDetails=false;
    for(const order of orders){if('shippingName' in order||'shippingAddress' in order){delete order.shippingName;delete order.shippingAddress;scrubbedOrderDetails=true}}
    if(scrubbedOrderDetails)localStorage.setItem('xtm-market-orders',JSON.stringify(orders));
    let selected=null,selectedQuote=null,deadline=0,timerHandle,currentMarketPage=1;
    const PAGE_SIZE_OPTIONS=[8,16,24,32,64];
    const savedPageSize=Number(readStored('xtm-market-page-size',8));
    let itemsPerPage=PAGE_SIZE_OPTIONS.includes(savedPageSize)?savedPageSize:8;
    let walletConnection={connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',account:null,session:null,client:null,capabilities:null};
    const WALLETCONNECT_PROJECT_ID='5716089763e762b10c0c252a853a7ae4';
    const WALLETCONNECT_CHAIN='tari:devnet';
    const INDEXER_URL='https://ootle-indexer-a.tari.com/';
    let roleRefreshSequence=0;
    let sellerTrustScores=new Map(),sellerReviews=[],trustRatingsReady=false,reviewCommentsReady=false;
    const $=s=>document.querySelector(s);
    const pageIds={fee:'feeView',checkout:'checkoutView',cases:'paymentCasesView',disputes:'disputesView',escrow:'escrowView',categories:'categoriesView',market:'marketView',recent:'recentView',received:'receivedView',moderation:'moderationView'};
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
    function pageFromHash(){return location.hash==='#marketplace-fee'?'fee':location.hash==='#checkout'?'checkout':location.hash==='#refunds-disputes'?'cases':location.hash==='#disputes-refunds'?'disputes':location.hash==='#ootle-escrow'?'escrow':location.hash==='#categories'?'categories':location.hash==='#recent-orders'?'recent':location.hash==='#orders-received'?'received':location.hash==='#moderation'?'moderation':'market'}
    function setPage(page,updateHash=true){
      const requested=page==='checkout'&&!selected?'market':pageIds[page]?page:'market',next=requested==='moderation'&&!isMarketplaceAdmin()?'market':requested;
      if(requested==='moderation'&&next==='market')history.replaceState(null,'',location.pathname+location.search);
      for(const [name,id] of Object.entries(pageIds))document.getElementById(id).hidden=name!==next;
      document.querySelectorAll('[data-page]').forEach(button=>{const active=button.dataset.page===next;button.classList.toggle('active',active);active?button.setAttribute('aria-current','page'):button.removeAttribute('aria-current')});
      if(updateHash){const hash=next==='fee'?'#marketplace-fee':next==='checkout'?'#checkout':next==='cases'?'#refunds-disputes':next==='disputes'?'#disputes-refunds':next==='escrow'?'#ootle-escrow':next==='categories'?'#categories':next==='market'?'':next==='recent'?'#recent-orders':next==='received'?'#orders-received':'#moderation';history.replaceState(null,'',location.pathname+location.search+hash)}
      $('#'+(next==='checkout'?'checkoutPaymentHost':'marketCheckoutHost')).appendChild(document.querySelector('.checkout'));
      if(next==='cases'){renderPaymentCases();refreshPaymentCases()}
      if(next==='recent')renderOrders();
      if(next==='received'){renderSellerOrders();refreshPaymentCases().then(renderSellerOrders)}
      if(next==='moderation'){renderModeration();renderPaymentCases();refreshPaymentCases();refreshTrustScores()}
      scrollTo({top:0,behavior:'smooth'})
    }
    // Keep the active component address for existing-order actions until the v0.6
    // template is instantiated, then replace the address and set this flag true.
    const MARKET_COMPONENT_ADDRESS='component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9';
    const ITEM_PRICE_FEE_READY=false;
    const SECURITY_UPGRADE_READY=false;
    const TRUSTED_MARKET_COMPONENTS=new Set([MARKET_COMPONENT_ADDRESS,'component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15']);
    const newPurchasesReady=()=>Boolean(MARKET_COMPONENT_ADDRESS)&&ITEM_PRICE_FEE_READY&&SECURITY_UPGRADE_READY&&SELLER_USERNAMES_READY;
    const MAX_TRANSACTION_FEE=5000;
    const ESMERALDA_NETWORK_BYTE=38;
    const PRICE_URL='https://api.coingecko.com/api/v3/simple/price?ids=minotari&vs_currencies=usd&include_last_updated_at=true';
    const bundledRates={xtmUsd:0.00169228,updatedAt:1789299790000};
    const storedRates=readStored('xtm-market-live-rates',null),cachedRates=storedRates&&Number.isFinite(storedRates.xtmUsd)&&storedRates.xtmUsd>0?storedRates:null;
    let marketRates=cachedRates||bundledRates;
    const xtmRate=()=>marketRates.xtmUsd;
    function values(item){const itemXtm=Number(item.price)||0,shippingXtm=Number(item.shipping)||0,totalXtm=itemXtm+shippingXtm;return{itemXtm,shippingXtm,totalXtm,itemUsd:itemXtm*xtmRate(),usd:totalXtm*xtmRate(),xtm:totalXtm}}
    function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}
    function xtm(n){return n.toLocaleString(undefined,{maximumFractionDigits:2})+' XTM'}
    function firstAddress(value){
      if(typeof value==='string')return value;
      if(!value||typeof value!=='object')return '';
      for(const key of ['address','component_address','account_address']){
        const found=firstAddress(value[key]);if(found)return found
      }
      for(const child of Object.values(value)){const found=firstAddress(child);if(found&&/^(component_|account_|[0-9a-f]{32})/i.test(found))return found}
      return ''
    }
    const SELLER_USERNAMES_READY=false;
    let sellerUsernames=new Map(),usernameOwners=new Map(),usernameListings=new Map(),usernameRegistryReady=false;
    function normalizeSellerUsername(value){const name=String(value||'').trim().toLowerCase();return /^[a-z0-9_]{3,24}$/.test(name)&&!['admin','administrator','owner','support','xtm_market','tari','ootle'].includes(name)?name:''}
    function sellerIdentity(item){const row=usernameListings.get(String(item.chainId));return row&&row.address===String(item.paymentAddress||'').toLowerCase()?'@'+row.name:shortAddress(item.paymentAddress||'Seller wallet pending')}
    function refreshUsernameRegistry(state){
      sellerUsernames=new Map();usernameOwners=new Map();usernameListings=new Map();usernameRegistryReady=false;
      if(!SELLER_USERNAMES_READY||!Array.isArray(state)||state.length!==15||!state[13]||!state[14])return;
      for(const [key,name] of Object.entries(state[13]))if(/^[0-9a-f]{64}$/.test(key)&&normalizeSellerUsername(name)===name&&state[14][name]===key){sellerUsernames.set(key,name);usernameOwners.set(name,key)}
      for(const [id,row] of Object.entries(state[3]||{})){const raw=reviewField(row,6,'seller'),signer=typeof raw==='string'?raw.toLowerCase():Array.isArray(raw)&&raw.length===32&&raw.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?raw.map(n=>n.toString(16).padStart(2,'0')).join(''):'';const name=sellerUsernames.get(signer),address=paymentAddress(reviewField(row,5,'seller_payment_address'));if(name)usernameListings.set(String(reviewField(row,0,'id')??id),{name,address})}
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
        const state=(await response.json())?.substate?.Component?.body?.state;
        if(sequence!==roleRefreshSequence)return;
        adminRolesReady=Array.isArray(state)&&state.length>=12&&typeof state[10]==='string'&&Boolean(state[11])&&typeof state[11]==='object';
        adminRoles=new Map(adminRolesReady?Object.entries(state[11]).filter(([address,key])=>/^component_[0-9a-f]{64}$/i.test(address)&&/^[0-9a-f]{64}$/i.test(key)).map(([address,key])=>[address.toLowerCase(),key.toLowerCase()]):[]);adminRolesCheckedAt=Date.now();
        trustRatingsReady=Array.isArray(state)&&state.length>=9;
        reviewCommentsReady=Array.isArray(state)&&state.length>=10;
        const next=new Map(),ratings=trustRatingsReady?state[5]:null;
        if(ratings&&typeof ratings==='object')for(const [key,value] of Object.entries(ratings)){const address=(key.match(/component_[0-9a-f]{64}/i)||[])[0],record=readTrustValue(value);if(address&&record)next.set(address.toLowerCase(),record)}
        const nextReviews=[],reviews=reviewCommentsReady?state[7]:null;
        if(reviews&&typeof reviews==='object')for(const [key,value] of Object.entries(reviews)){const review=readReviewValue(value,key);if(review)nextReviews.push(review)}
        refreshUsernameRegistry(state);sellerTrustScores=next;sellerReviews=nextReviews
      }catch{if(sequence!==roleRefreshSequence)return;refreshUsernameRegistry(null);adminRolesReady=false;adminRoles.clear();trustRatingsReady=false;reviewCommentsReady=false;sellerTrustScores=new Map();sellerReviews=[]}
      updateUsernameStatus();render();renderSellerTrust();renderModeration()
    }
    function renderSellerTrust(){
      const panel=$('#sellerTrustPanel'),list=$('#sellerReviewList');if(!panel)return;
      if(!walletConnection.connected){panel.innerHTML='<strong>Connect a Tari wallet to view its seller trust score.</strong><span>Ratings are tied to the seller\'s Ootle account address.</span>';if(list)list.innerHTML='';return}
      if(!reviewCommentsReady){panel.innerHTML='<strong>Seller reviews upgrade pending</strong><span>Automatic feedback is pending activation: an undisputed sale claimed after the 14-day purchase window receives 5 stars and “Sale Satisfactory” if the buyer has not reviewed it.</span>';if(list)list.innerHTML='';return}
      panel.innerHTML=`<strong>${escapeHtml(trustLabel(walletConnection.accountAddress))}</strong><span>Wallet-bound seller trust for ${escapeHtml(shortAddress(walletConnection.accountAddress))}. Buyers can leave one verified rating and comment per completed, non-refunded order.</span>`;
      if(list){const reviews=reviewsForSeller(walletConnection.accountAddress);list.innerHTML=reviews.length?`<div class="buyer-title">Public feedback</div>${reviews.map(review=>`${reviewCard(review)}${review.disputed?'<div class="moderation-note">Owner review pending.</div>':`<div class="order-actions"><button class="button small danger" data-dispute-review="${review.orderId}">Dispute rating or comment</button></div>`}`).join('')}`:'<div class="none">No verified buyer feedback yet.</div>';list.querySelectorAll('[data-dispute-review]').forEach(button=>button.onclick=()=>openReviewDispute(Number(button.dataset.disputeReview)))}
    }
    function safeImageSrc(src){if(typeof src!=='string'||src.length>8*1024*1024)return '';return /^(?:assets\/[a-z0-9][a-z0-9.-]*\.(?:webp|png|jpe?g)|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2})$/i.test(src)?src:''}
    function listingImages(item){const images=Array.isArray(item.images)?item.images:[];return(images.length?images:[item.image]).map(safeImageSrc).filter(Boolean).slice(0,8)}
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
        metadata:{name:'XTM Market',description:'Buy and sell goods with Tari on Ootle',url:location.origin,icons:[]}
      });
      client.on('session_delete',()=>{walletConnection={connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,client,capabilities:null};renderWalletState();renderSellerOrders()});
      walletConnection.client=client;
      return client
    }
    async function walletRequest(method,params={}){
      if(walletConnection.transport==='window.tari'){
        if(!window.tari?.request)throw new Error('The Tari wallet provider is no longer available.');
        return window.tari.request({method,params})
      }
      if(!walletConnection.client||!walletConnection.session)throw new Error('Connect your Tari wallet first.');
      return walletConnection.client.request({topic:walletConnection.session.topic,chainId:WALLETCONNECT_CHAIN,request:{method,params}})
    }
    async function finishWalletSession(session,client){
      walletConnection={...walletConnection,client,session};
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
        window.tari.request({method:'tari_getNetwork'}).catch(()=> 'esmeralda'),
        window.tari.request({method:'tari_getWalletAddress'}).catch(()=> ''),
        window.tari.request({method:'tari_getCapabilities'}).catch(()=> null)
      ]);
      if(!String(network).toLowerCase().includes('esmeralda'))throw new Error('Switch your Tari wallet to the Esmeralda network.');
      walletConnection={...walletConnection,connected:true,transport:'window.tari',accountAddress,walletAddress:String(walletAddress||''),network:String(network),networkByte:null,account:{component_address:accountAddress},session:null,capabilities};
      $('#pairingPanel').classList.remove('show');$('#walletDialog').close();await refreshTrustScores();renderWalletState();renderSellerOrders();toast('Tari wallet connected through window.tari')
    }
    async function showPairingUri(uri){
      $('#pairingUri').value=uri;
      $('#pairingPanel').classList.add('show')
    }
    async function restoreWalletSession(){
      if(window.tari?.request){
        try{const accounts=await window.tari.request({method:'tari_getAccounts'});if(accounts?.length){await finishWindowTari(accounts);return}}catch(error){console.warn('window.tari session restore failed',error)}
      }
      try{
        const client=await getWalletClient(),sessions=client.session.getAll(),session=sessions.find(candidate=>candidate.namespaces?.tari);
        if(session)await finishWalletSession(session,client)
      }catch(error){console.warn('WalletConnect session restore failed',error)}
    }
    function manifestText(value){return JSON.stringify(String(value))}
    function atomicTari(value){const amount=Math.round(Number(value)*1_000_000);if(!Number.isSafeInteger(amount)||amount<=0)throw new Error('The XTM amount is invalid.');return amount}
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
    function feeInstructions(accountAddress){return[componentCall(accountAddress,'pay_fee',[literal(cborHead(0,MAX_TRANSACTION_FEE))])]}
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
      return status==='Accepted'&&decision&&Object.hasOwn(decision,'Accept')?'accepted':'pending';
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
      const forget=()=>{pendingWalletTransactions.delete(pendingKey);try{sessionStorage.removeItem(pendingKey)}catch{}};
      try{
        if(prior){
          const previous=await walletRequest('tari_getTransactionResult',identity.transport==='window.tari'?{transactionId:prior}:{transaction_id:prior});sameWallet();
          const outcome=transactionOutcome(previous);
          if(outcome==='pending')throw new Error('Your previous transaction is still unconfirmed. Check its status in your wallet before retrying.');
          forget();
          if(outcome==='accepted')throw new Error('Your previous transaction completed. Refresh your orders before starting another transaction.');
        }
        if(!window.confirm(summary+'\n\nMaximum network fee: 0.005 XTM\n\nContinue in your connected Tari wallet?'))throw new Error('Payment cancelled.');
        sameWallet();
        const currentAccount=firstAddress(await walletRequest(identity.transport==='window.tari'?'tari_getAccounts':'tari_getDefaultAccount',{}));sameWallet();
        if(String(currentAccount).toLowerCase()!==identity.account.toLowerCase())throw new Error('The wallet account changed. Reconnect before submitting.');
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
        if(transactionOutcome(submitted)==='rejected'){forget();throw new Error('Ootle rejected the transaction.')}
        if(transactionOutcome(submitted)==='accepted'){forget();return {transactionId,result:submitted}}
        for(let attempt=0;attempt<60;attempt++){
          await new Promise(resolve=>setTimeout(resolve,2000));sameWallet();
          const result=await walletRequest('tari_getTransactionResult',identity.transport==='window.tari'?{transactionId}:{transaction_id:transactionId});sameWallet();
          const outcome=transactionOutcome(result);
          if(outcome==='rejected'){forget();throw new Error('Ootle rejected the transaction.')}
          if(outcome==='accepted'){forget();return {transactionId,result}}
        }
        throw new Error('Transaction status is unconfirmed. Check your wallet before retrying; it may still complete.');
      }finally{transactionBusy=false}
    }
    function returnedListingId(result){
      let executionResults=null;
      (function visit(value){if(executionResults||!value||typeof value!=='object')return;if(Array.isArray(value.execution_results))executionResults=value.execution_results;else for(const child of Object.values(value))visit(child)})(result);
      if(!executionResults?.length)return null;
      const value=executionResults[executionResults.length-1]?.indexed?.value??executionResults[executionResults.length-1]?.value;
      const number=typeof value==='number'?value:typeof value==='string'&&/^\d+$/.test(value)?Number(value):null;
      return Number.isSafeInteger(number)&&number>0?number:null
    }
    function renderWalletState(){
      renderAdminManagement();
      renderPaymentCases();if(walletConnection.connected&&['cases','moderation'].includes(pageFromHash()))refreshPaymentCases();
      const connected=walletConnection.connected;
      const escrowReady=newPurchasesReady();
      const owner=isMarketplaceAdmin();$('#moderationTab').hidden=!owner;if(!owner){$('#moderationList').innerHTML='';$('#paymentOwnerList').innerHTML='';$('#adminPaymentSync').textContent='';if(paymentAction&&['refund','release'].includes(paymentAction.action)){$('#paymentActionDialog').close();paymentAction=null}}if(!owner&&pageFromHash()==='moderation')setPage('market',false);
      $('#escrowBannerText').textContent=escrowReady?'XTM enters escrow when the purchase completes and stays locked until release or refund. It releases on buyer confirmation or an eligible seller claim after the 14-day purchase window; disputes require an owner decision.':'Purchases will reopen after the new Ootle escrow component is deployed.';
      $('#walletButton').classList.toggle('connected',connected);
      $('#walletButton').textContent=connected?shortAddress(walletConnection.accountAddress):'Connect Tari wallet';
      $('#walletState').classList.toggle('connected',connected);
      $('#walletDot').classList.toggle('ready',connected);
      $('#walletCheckoutStatus').textContent=connected?`Connected · ${shortAddress(walletConnection.accountAddress)}`:'Tari wallet not connected';
      if(selected){
        const blocked=purchaseBlockReason(selected);
        $('#orderButton').disabled=Boolean(blocked);
        shippingInputs().forEach(field=>field.disabled=Boolean(blocked));
        $('#orderButton').textContent=blocked?(selected.sample?'Catalog item — payment unavailable':'Payment unavailable'):connected?`Lock ${xtm((selectedQuote||values(selected)).totalXtm)} in escrow`:'Connect wallet to pay';
        $('#paymentNote').textContent=blocked|| (connected?'Your purchase immediately funds Ootle escrow with the full total. The seller receives payment when escrow is released after receipt confirmation, an eligible timeout claim, or a dispute decision.':'Connect an Esmeralda wallet to approve payment into escrow at purchase. Your wallet approval is required.');
      }
    }
    async function connectWallet(event){
      event.preventDefault();
      const button=$('#connectWallet'),errorBox=$('#walletError');
      errorBox.classList.remove('show');button.disabled=true;button.textContent='Connecting…';
      try{
        if(window.tari?.request){const accounts=await window.tari.request({method:'tari_requestAccounts'});await finishWindowTari(accounts);return}
        const client=await getWalletClient(),existing=client.session.getAll().find(candidate=>candidate.namespaces?.tari);
        if(existing){await finishWalletSession(existing,client);return}
        const {uri,approval}=await client.connect({requiredNamespaces:{tari:{methods:['tari_getDefaultAccount','tari_submitTransaction','tari_getTransactionResult'],chains:[WALLETCONNECT_CHAIN],events:[]}},sessionProperties:{required_permissions:JSON.stringify([{Accounts:['Read',null]},{Transactions:'Create'},{Transactions:'Read'}]),optional_permissions:'[]'}});
        if(!uri)throw new Error('WalletConnect did not return a pairing link.');
        await showPairingUri(uri);button.textContent='Waiting for approval…';
        const session=await approval();
        await finishWalletSession(session,client)
      }catch(error){
        walletConnection={...walletConnection,connected:false,transport:'',accountAddress:'',walletAddress:'',network:'',networkByte:null,account:null,session:null,capabilities:null};
        errorBox.textContent=error.message||'The wallet connection was not approved.';
        errorBox.classList.add('show')
      }finally{button.disabled=false;button.textContent='Connect wallet'}
    }
    async function disconnectWallet(){
      const {client,session,transport}=walletConnection;
      try{if(transport==='window.tari'&&window.tari?.request)await window.tari.request({method:'tari_disconnect'});else if(client&&session)await client.disconnect({topic:session.topic,reason:{code:6000,message:'User disconnected'}})}catch{}
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
      const response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(MARKET_COMPONENT_ADDRESS)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Could not verify the listing on Ootle.');
      const state=(await response.json())?.substate?.Component?.body?.state,rows=Array.isArray(state)?state[3]:state?.listings;
      const listing=Object.values(rows||{}).find(row=>Number(reviewField(row,0,'id'))===item.chainId);
      if(!listing||reviewField(listing,9,'active')!==true||Number(reviewField(listing,8,'inventory'))<1||String(reviewField(listing,1,'title'))!==item.name||paymentAddress(reviewField(listing,5,'seller_payment_address'))!==String(item.paymentAddress).toLowerCase()||String(reviewField(listing,7,'delivery_public_key'))!==item.deliveryPublicKey||String(reviewField(listing,3,'xtm_price'))!==String(atomicTari(quote.itemXtm))||String(reviewField(listing,4,'shipping_xtm'))!==String(quote.shippingXtm===0?0:atomicTari(quote.shippingXtm)))throw new Error('Listing details differ from Ootle. Refresh and review the item before paying.');
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
      const item={...selected},account=walletConnection.accountAddress,button=$('#orderButton'),v={...(selectedQuote||values(selected))};purchaseBusy=true;button.disabled=true;button.textContent='Waiting for wallet…';
      try{
        button.textContent='Verifying listing…';
        await verifyPurchaseListing(item,v);
        button.textContent='Encrypting delivery…';
        const encryptedDelivery=await encryptDeliveryDetails(item.deliveryPublicKey,buyer);
        button.textContent='Waiting for wallet…';
        if(selected?.id!==item.id||walletConnection.accountAddress!==account)throw new Error('Purchase or wallet changed. Review checkout again.');
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
      }catch(error){toast(error.message||'Payment was not approved')}
      finally{purchaseBusy=false;button.disabled=false;renderWalletState()}
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
    function sellerItems(items,seller){return items.filter(item=>item.id!==seller.itemId&&item.stock>0&&(seller.address?!item.sample&&String(item.paymentAddress||'').toLowerCase()===seller.address:false))}
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
      const isCatalog=item=>seed.some(product=>product.id===item.id),real=listings.filter(item=>!isCatalog(item)),catalogSlots=Math.max(0,seed.length-real.length);
      return[...real.filter(item=>item.stock>0),...listings.filter(item=>isCatalog(item)&&item.stock>0).slice(0,catalogSlots)]
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
      const available=filterByCategory(selectedSeller?sellerItems(listings,selectedSeller):marketplaceListings()),totalPages=Math.max(1,Math.ceil(available.length/itemsPerPage));currentMarketPage=Math.min(Math.max(1,currentMarketPage),totalPages);const pageItems=available.slice((currentMarketPage-1)*itemsPerPage,currentMarketPage*itemsPerPage);
      $('#listingCount').textContent=available.length+' available'+(totalPages>1?` · page ${currentMarketPage} of ${totalPages}`:'');
      $('#listingGrid').innerHTML=pageItems.map(item=>{const v=values(item),photos=listingImages(item),catalogPhoto=catalogImages[item.id],src=photos[0]||safeImageSrc(catalogPhoto?.src),photoList=photos.length?photos:(src?[src]:[]),alt=item.alt||catalogPhoto?.alt||item.name,media=src?{src,alt}:null,purchasable=Boolean(item.chainId&&item.deliveryPublicKey&&item.paymentAddress),sampleTrust=item.sample?sampleTrustFor(item.id):null;const controls=photoList.length>1?`<div class="photo-nav"><button type="button" data-photo-prev="${item.id}" aria-label="Previous photo">‹</button><button type="button" data-photo-next="${item.id}" aria-label="Next photo">›</button></div><span class="photo-count" data-photo-count="${item.id}">1 / ${photoList.length}</span>`:'';const picture=media?`<div class="product-media" data-photo-gallery="${item.id}" data-photo-index="0" data-photo-sources="${escapeHtml(JSON.stringify(photoList))}"><img src="${media.src}" alt="${escapeHtml(media.alt)} — photo 1 of ${photoList.length}" loading="${item.id===1?'eager':'lazy'}" decoding="async" data-open-product="${item.id}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.name)}">${controls}</div>`:'<div class="product-media"><div class="product-placeholder">No image added</div></div>',trust=sampleTrust?`<button class="trust-badge sample" data-profile-item="${item.id}" title="Open this sample seller profile">★ ${escapeHtml(sampleSellerName(item.id))} · ${sampleTrust.score.toFixed(1)} · ${sampleTrust.count} sample reviews</button>`:item.paymentAddress?`<button class="trust-badge" data-profile-item="${item.id}" title="Open this wallet-linked seller profile">★ ${escapeHtml(sellerIdentity(item))} · ${escapeHtml(trustLabel(item.paymentAddress))}</button>`:'';return `<article class="card" style="--glow:rgba(104,240,197,.18)">${picture}<span class="item-category">${escapeHtml(listingCategory(item))}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>${trust}<div class="price"><div><div class="primary-price">${xtm(v.itemXtm)}</div><div class="usd">${money(v.itemUsd)} live reference</div><div class="shipping">Shipping: ${xtm(v.shippingXtm)}</div><div class="stock">${item.stock} in stock</div></div><button class="button small" data-buy="${item.id}" ${purchasable?'':'disabled title="Only seller-published listings can be purchased"'}>${purchasable?'Buy':'Catalog'}</button></div></article>`}).join('')||`<div class="category-empty">${selectedSeller?(selectedSeller.sample?'This sample seller has no other linked items.':'This seller has no other available items.'):'No available listings in this category yet.'} Clear the filter or browse categories to see more items.</div>`;
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
    function openProductDetail(itemId){const item=listings.find(candidate=>candidate.id===itemId);if(!item)return;const v=values(item),catalogPhoto=catalogImages[item.id],photos=listingImages(item),fallback=safeImageSrc(catalogPhoto?.src),photoList=photos.length?photos:(fallback?[fallback]:[]),alt=item.alt||catalogPhoto?.alt||item.name,sample=item.sample?sampleTrustFor(item.id):null,trust=sample?{score:sample.score,count:sample.count}:trustRecord(item.paymentAddress),score=sample?`${trust.score.toFixed(1)} ★ · ${trust.count} verified ${trust.count===1?'review':'reviews'}`:trust?.ratingCount?`${(trust.totalStars/trust.ratingCount).toFixed(1)} ★ · ${trust.ratingCount} verified ${trust.ratingCount===1?'review':'reviews'}`:'New seller',seller=item.sample?sampleSellerName(item.id):sellerIdentity(item),purchasable=Boolean(item.chainId&&item.deliveryPublicKey&&item.paymentAddress&&newPurchasesReady());const gallery=photoList.length?`<div class="detail-main-photo"><img id="productDetailImage" src="${photoList[0]}" alt="${escapeHtml(alt)} — large photo 1 of ${photoList.length}"></div>${photoList.length>1?`<div class="detail-thumbnails" aria-label="Product photos">${photoList.map((src,index)=>`<button class="detail-thumb ${index===0?'active':''}" type="button" data-detail-photo="${index}" aria-label="View photo ${index+1}"><img src="${src}" alt=""></button>`).join('')}</div>`:''}`:'<div class="detail-main-photo"><div class="product-placeholder">No image added</div></div>';$('#productDetailContent').innerHTML=`<div class="product-detail"><section>${gallery}</section><section class="detail-copy"><span class="item-category">${escapeHtml(listingCategory(item))}</span><h2 id="productDetailTitle">${escapeHtml(item.name)}</h2><p class="detail-description">${escapeHtml(item.description)}</p><div class="detail-pricing"><div class="row"><span>Item price</span><strong>${xtm(v.itemXtm)}</strong></div><div class="row"><span>Shipping</span><strong>${xtm(v.shippingXtm)}</strong></div><div class="row"><span>Total</span><strong>${xtm(v.totalXtm)}</strong></div><div class="row"><span>USD reference</span><strong>${money(v.usd)}</strong></div><div class="row"><span>Available</span><strong>${item.stock} in stock</strong></div><div class="row"><span>Protection</span><strong>Escrow funded at purchase</strong></div></div><div class="seller-summary"><h3>About the seller</h3><div class="seller-summary-score">${escapeHtml(score)}</div><div class="seller-summary-wallet">${escapeHtml(seller)}</div><div class="fine">${item.sample?'Fictional username and sample reviews for this catalog preview.':"Ratings are attached to the seller's connected Ootle wallet and come from verified completed sales."}</div></div><div class="detail-actions"><button class="button" id="productSellerProfile" type="button">Seller profile &amp; reviews</button><button class="button" id="productSellerItems" type="button">See seller’s other items</button><button class="button primary" id="productBuy" type="button" ${item.stock>0?'':'disabled'}>${item.stock>0?'Buy':'Sold out'}</button></div></section></div>`;$('#productDetailContent').querySelectorAll('[data-detail-photo]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.detailPhoto),image=$('#productDetailImage');image.src=photoList[index];image.alt=`${alt} — large photo ${index+1} of ${photoList.length}`;$('#productDetailContent').querySelectorAll('[data-detail-photo]').forEach(candidate=>candidate.classList.toggle('active',candidate===button))});$('#productSellerProfile').onclick=()=>{$('#productDialog').close();openSellerProfile(item.id)};$('#productSellerItems').onclick=()=>showSellerItems(item);$('#productBuy').onclick=()=>{$('#productDialog').close();selectListing(item.id)};$('#productDialog').showModal()}
    function purchaseBlockReason(item){if(!item||item.stock<=0)return'This item is sold out.';if(item.sample||!item.chainId||!item.deliveryPublicKey||!item.paymentAddress)return'This is a catalog sample. You can review the checkout, but this item is not available for purchase.';if(!newPurchasesReady())return'Payments are paused until the upgraded Ootle escrow contract is activated.';return''}
    function selectListing(id){const item=listings.find(x=>x.id===id);if(!item||item.stock<=0){toast('This item is no longer available');return}if(selected?.id!==id){clearShippingFields()}selected=item;selectedQuote=values(selected);deadline=Date.now()+600000;renderCheckout();clearInterval(timerHandle);timerHandle=setInterval(updateTimer,1000);updateTimer();setPage('checkout')}
    function renderPurchaseItem(){if(!selected)return;const image=listingImages(selected)[0]||safeImageSrc(catalogImages[selected.id]?.src),reason=purchaseBlockReason(selected);$('#purchaseItem').innerHTML=`${image?`<img class="purchase-photo" src="${image}" alt="${escapeHtml(selected.name)}">`:''}<div class="item-category">${escapeHtml(listingCategory(selected))}</div><h2>${escapeHtml(selected.name)}</h2><p>${escapeHtml(selected.description)}</p><p>Quantity: 1 · ${selected.stock} available</p><p>Seller: <span class="case-address">${escapeHtml(selected.sample?sampleSellerName(selected.id):selected.paymentAddress||'Seller not connected')}</span></p>${reason?`<div class="purchase-notice" role="status">${escapeHtml(reason)}</div>`:''}`}
    function renderCheckout(){renderPurchaseItem();const v=selectedQuote||values(selected),address=selected.paymentAddress||'';$('#checkoutEmpty').style.display='none';$('#checkoutSummary').classList.add('active');$('#summaryName').textContent=selected.name;$('#summaryReference').textContent='Item and shipping are fixed in XTM';$('#payAmount').textContent=xtm(v.totalXtm);$('#sumItem').textContent=xtm(v.itemXtm);$('#sumShipping').textContent=xtm(v.shippingXtm);$('#sumUsd').textContent=money(v.usd);$('#sumSellerTrust').textContent=selected.sample?sampleSellerName(selected.id)+' · Example':trustLabel(address);$('#addressRow').style.display=address?'flex':'none';$('#sumPaymentAddress').textContent=address;renderWalletState()}
    function clearCheckout(){selected=null;selectedQuote=null;$('#checkoutEmpty').style.display='block';$('#checkoutSummary').classList.remove('active');clearInterval(timerHandle)}
    function updateTimer(){const left=Math.max(0,deadline-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);$('#timer').textContent=`${m}:${String(s).padStart(2,'0')}`;if(!left){selectedQuote=values(selected);deadline=Date.now()+600000;renderCheckout();toast('Quote refreshed at current rates')}}
    function recordPaidOrder(transactionId,encryptedDelivery,chainOrderId,purchasedItem=selected,quote=selectedQuote){if(!purchasedItem)return;const selected=purchasedItem,v=quote||values(selected),id='XT-'+String(Date.now()).slice(-7),created=new Date().toISOString(),sellerAddress=selected.paymentAddress||'';const order={id,chainOrderId,name:selected.name,xtm:v.totalXtm,itemXtm:v.itemXtm,shippingXtm:v.shippingXtm,usd:v.usd,status:'In escrow',transactionId,created,sellerAddress,marketComponent:MARKET_COMPONENT_ADDRESS};orders.unshift(order);orders=orders.slice(0,6);sellerOrders.unshift({id,chainOrderId,listingId:selected.id,name:selected.name,xtm:v.totalXtm,shippingXtm:v.shippingXtm,status:'In escrow',transactionId,created,sellerAddress,marketComponent:MARKET_COMPONENT_ADDRESS,encryptedDelivery});sellerOrders=sellerOrders.slice(0,20);const liveListing=listings.find(item=>item.id===selected.id);if(liveListing)liveListing.stock=Math.max(0,liveListing.stock-1);localStorage.setItem('xtm-market-orders',JSON.stringify(orders));localStorage.setItem('xtm-market-seller-orders',JSON.stringify(sellerOrders));saveListings();clearShippingFields();toast('Purchase completed — XTM deposited into escrow');clearCheckout();render()}
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
    async function refreshPaymentCases(){
      if(!walletConnection.connected){renderPaymentCases();return}
      if(paymentRefreshTask)return paymentRefreshTask;
      const components=[...new Set([MARKET_COMPONENT_ADDRESS,...orders.map(order=>order.marketComponent)])].filter(address=>TRUSTED_MARKET_COMPONENTS.has(address));
      paymentRefreshTask=(async()=>{
        await Promise.all(components.map(async component=>{
          try{
            const response=await fetch(`${INDEXER_URL}substates/${encodeURIComponent(component)}?local_search_only=false`,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw new Error('Indexer unavailable');
            const state=(await response.json())?.substate?.Component?.body?.state;
            const chainOrders=Array.isArray(state)?state[4]:state?.orders,chainListings=Array.isArray(state)?state[3]:state?.listings;
            if(!chainOrders||typeof chainOrders!=='object')throw new Error('Orders unavailable');
            const listingMap=new Map(Object.entries(chainListings||{}).map(([key,value])=>[Number(reviewField(value,0,'id')??key),String(reviewField(value,1,'title')||'')]));
            const rows=Object.entries(chainOrders).map(([key,value])=>{const order=readPaymentOrder(value,key,component);order.title=listingMap.get(order.listingId)||'Order #'+order.id;order.feePaid=Array.isArray(state)&&state.length>=13&&state[12]?.[String(order.id)]===true;return order});
            paymentSnapshots.set(component,{rows,checkedAt:Date.now(),error:false});
            for(const order of rows){if(order.settled||(paymentPending.get(order.key)==='open'&&order.disputed))paymentPending.delete(order.key)}
          }catch{const previous=paymentSnapshots.get(component);paymentSnapshots.set(component,{rows:previous?.rows||[],checkedAt:previous?.checkedAt||0,error:true})}
        }));
      })();
      renderPaymentCases();
      try{await paymentRefreshTask}finally{paymentRefreshTask=null;renderPaymentCases()}
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

    async function paySellerFee(orderId){
      if(!SECURITY_UPGRADE_READY||transactionBusy)return;
      const account=walletConnection.accountAddress;
      try{
        await refreshPaymentCases();
        const order=paymentRows().find(row=>row.component===MARKET_COMPONENT_ADDRESS&&row.id===orderId);
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
    function setEscrowStatus(chainOrderId,status){orders.forEach(order=>{if(order.marketComponent===MARKET_COMPONENT_ADDRESS&&order.chainOrderId===chainOrderId)order.status=status});sellerOrders.forEach(order=>{if(order.marketComponent===MARKET_COMPONENT_ADDRESS&&order.chainOrderId===chainOrderId)order.status=status});saveOrderState();renderOrders();renderSellerOrders()}
    async function escrowOrderAction(chainOrderId,method,status,summary){if(!MARKET_COMPONENT_ADDRESS){toast('Escrow component deployment is pending');return}if(!walletConnection.connected){$('#walletDialog').showModal();return}try{await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,method,[literal(cborHead(0,Number(chainOrderId)))])],summary);setEscrowStatus(chainOrderId,status);await refreshTrustScores();toast(status==='Disputed'?'Escrow paused for dispute':status==='Released'?'Escrow released':'Order updated')}catch(error){toast(error.message||'The escrow update was not approved')}}
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
      box.innerHTML=orders.length?orders.map(order=>{
        const chainReview=order.marketComponent===MARKET_COMPONENT_ADDRESS?sellerReviews.find(candidate=>candidate.orderId===order.chainOrderId):null;
        const displayedReview=chainReview?(chainReview.removed?null:chainReview):order.review;
        const active=order.marketComponent===MARKET_COMPONENT_ADDRESS&&order.chainOrderId&&!['Released','Refunded','Disputed'].includes(order.status),actions=active?`<div class="order-actions"><button class="button small" data-buyer-action="confirm_receipt" data-order-id="${order.chainOrderId}">Confirm received &amp; review</button><button class="button small danger" data-buyer-action="open_dispute" data-order-id="${order.chainOrderId}">Open dispute</button></div>`:'',canReview=reviewCommentsReady&&order.status==='Released'&&order.chainOrderId&&!order.review&&!chainReview&&order.marketComponent===MARKET_COMPONENT_ADDRESS,review=displayedReview?reviewCard({orderId:order.chainOrderId,...displayedReview}):canReview?`<div class="review-form"><label>Rating and required public comment<select class="select" data-review-stars="${order.chainOrderId}" required><option value="">Choose a rating</option>${[5,4,3,2,1].map(stars=>`<option value="${stars}">${stars} star${stars===1?'':'s'}</option>`).join('')}</select><textarea class="input review-comment" data-review-comment="${order.chainOrderId}" maxlength="500" required placeholder="Describe the item, communication, shipping, and overall sale."></textarea></label><div class="review-submit"><span class="count">Comment required · 500 characters maximum</span><button class="button small primary" data-submit-review="${order.chainOrderId}">Post review</button></div></div>`:'';
        return `<div class="order"><div><strong>${escapeHtml(order.name)}</strong><small>${escapeHtml(order.id)} · ${money(order.usd)}</small>${review}</div><div><strong>${xtm(order.xtm)}</strong><div class="status">${escapeHtml(order.status)}</div>${actions}</div></div>`
      }).join(''):'<div class="none">No orders yet. Create one from a listing above.</div>';
      box.querySelectorAll('[data-buyer-action]').forEach(button=>button.onclick=()=>button.dataset.buyerAction==='confirm_receipt'?openReceiptReview(Number(button.dataset.orderId)):setPage('cases'));
      box.querySelectorAll('[data-submit-review]').forEach(button=>button.onclick=()=>{const id=Number(button.dataset.submitReview),stars=Number(box.querySelector(`[data-review-stars="${id}"]`).value),comment=box.querySelector(`[data-review-comment="${id}"]`).value.trim();if(!stars){toast('Choose a one-to-five-star rating');return}if(!comment){toast('A written review comment is required');return}submitSellerReview(id,stars,comment)})
    }
    function openReviewDispute(orderId){$('#reviewDisputeOrder').value=orderId;$('#reviewDisputeReason').value='';$('#reviewDisputeDialog').showModal()}
    async function renderSellerOrders(){
      const box=$('#sellerOrderList');if(!box)return;renderSellerTrust();
      if(!walletConnection.connected){box.innerHTML='<div class="none">Connect your Tari wallet to see sales and reviews for your listings.</div>';return}
      const account=walletConnection.accountAddress.toLowerCase(),sales=sellerOrders.filter(sale=>String(sale.sellerAddress||'').toLowerCase()===account);
      if(!sales.length){box.innerHTML='<div class="none">No sales have been received by this wallet yet.</div>';return}
      const rows=await Promise.all(sales.map(async sale=>{
        const delivery=await decryptSellerDelivery(sale),details=delivery?`<div class="delivery-address">${delivery.name?`<strong>${escapeHtml(delivery.name)}</strong>`:''}${escapeHtml(delivery.address)}</div>`:'<div class="delivery-address">Shipping details received securely.</div>',canShip=sale.marketComponent===MARKET_COMPONENT_ADDRESS&&sale.chainOrderId&&sale.status==='In escrow',canClaim=sale.marketComponent===MARKET_COMPONENT_ADDRESS&&sale.chainOrderId&&(SECURITY_UPGRADE_READY?['In escrow','Shipped','Delivered']:['Shipped','Delivered']).includes(sale.status),actions=(canShip?`<div class="order-actions"><button class="button small" data-seller-action="mark_shipped" data-order-id="${sale.chainOrderId}">Mark shipped</button></div>`:'')+(canClaim?`<div class="order-actions"><button class="button small" data-seller-action="claim_after_timeout" data-order-id="${sale.chainOrderId}">Claim eligible payment</button></div>`:''),review=sellerReviews.find(candidate=>candidate.orderId===sale.chainOrderId&&!candidate.removed),reviewView=review?`${reviewCard(review)}${review.disputed?'<div class="moderation-note">This review is waiting for an owner decision.</div>':`<div class="order-actions"><button class="button small danger" data-dispute-review="${review.orderId}">Dispute rating or comment</button></div>`}`:'';
        const feeOrder=paymentRows().find(order=>order.component===sale.marketComponent&&order.id===sale.chainOrderId),feeAction=SECURITY_UPGRADE_READY&&sale.marketComponent===MARKET_COMPONENT_ADDRESS&&feeOrder?.verified&&feeOrder.settled&&!feeOrder.refunded&&!feeOrder.feePaid&&feeOrder.fee>0?`<button class="button small" data-pay-seller-fee="${feeOrder.id}">Pay separate 3% fee</button>`:'';
        return `<div class="order seller-order"><div><span class="new-sale">Escrow sale</span><strong>${escapeHtml(sale.name)}</strong><small>${escapeHtml(sale.id)} · ${new Date(sale.created).toLocaleString()}</small>${details}<div class="fine">Payment entered escrow at purchase and remains held until release or refund.</div>${reviewView}</div><div><strong>${xtm(sale.xtm)}</strong><div class="status">${escapeHtml(sale.status)}</div>${actions}${feeAction}</div></div>`
      }));
      box.innerHTML=rows.join('');
      box.querySelectorAll('[data-pay-seller-fee]').forEach(button=>button.onclick=()=>paySellerFee(Number(button.dataset.paySellerFee)));
      box.querySelectorAll('[data-seller-action]').forEach(button=>button.onclick=()=>escrowOrderAction(Number(button.dataset.orderId),button.dataset.sellerAction,button.dataset.sellerAction==='mark_shipped'?'Shipped':'Released',button.dataset.sellerAction==='mark_shipped'?'Mark escrow order shipped':'Claim escrow after the 14-day release period'));
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
    function legalNoticeAccepted(){try{return sessionStorage.getItem('xtm-market-legal-notice-v1')==='accepted'}catch{return false}}
    function showLegalNotice(){if(!legalNoticeAccepted()&&!legalDialog.open)legalDialog.showModal()}
    legalDialog.addEventListener('cancel',event=>event.preventDefault());
    legalAccept.addEventListener('change',()=>{legalEnter.disabled=!legalAccept.checked});
    $('#legalForm').addEventListener('submit',event=>{event.preventDefault();if(!legalAccept.checked)return;try{sessionStorage.setItem('xtm-market-legal-notice-v1','accepted')}catch{}legalDialog.close()});
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
    $('#paymentActionForm').onsubmit=submitPaymentAction;
    $('#paymentActionClose').onclick=$('#paymentActionCancel').onclick=()=>{if(!paymentBusy){paymentAction=null;$('#paymentActionDialog').close()}};
    $('#paymentActionDialog').addEventListener('cancel',event=>{if(paymentBusy)event.preventDefault();else paymentAction=null});
    setInterval(()=>{if(pageFromHash()==='cases'&&walletConnection.connected&&!document.hidden)refreshPaymentCases()},30000);
    $('#orderButton').onclick=payWithWallet;
    document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>setPage(button.dataset.page));
    window.addEventListener('hashchange',()=>setPage(pageFromHash(),false));
    const dialog=$('#listingDialog');$('#listButton').onclick=()=>{const address=$('#listingForm').elements.paymentAddress;address.value=walletConnection.connected?walletConnection.accountAddress:'';address.readOnly=true;const known=[...usernameListings.values()].find(row=>row.address===String(walletConnection.accountAddress||'').toLowerCase());$('#sellerUsername').value=known?.name||'';updateUsernameStatus();dialog.showModal()};$('#closeDialog').onclick=$('#cancelDialog').onclick=()=>dialog.close();
    const walletDialog=$('#walletDialog');$('#walletButton').onclick=()=>{const injected=Boolean(window.tari?.request);$('#walletDialogSubtitle').textContent=walletConnection.connected?`Connected through ${walletConnection.transport==='window.tari'?'window.tari':'WalletConnect'}.`:injected?'Approve access in your Tari wallet.':'Pair with Tari Asset Vault using WalletConnect.';$('#walletConnectInstructions').hidden=injected||walletConnection.connected;if(walletConnection.connected){$('#disconnectWallet').hidden=false;$('#connectWallet').hidden=true}else{$('#disconnectWallet').hidden=true;$('#connectWallet').hidden=false}$('#walletError').classList.remove('show');walletDialog.showModal()};$('#closeWalletDialog').onclick=$('#cancelWallet').onclick=()=>walletDialog.close();$('#walletForm').onsubmit=connectWallet;$('#disconnectWallet').onclick=disconnectWallet;
    $('#closeProfile').onclick=()=>$('#profileDialog').close();
    $('#closeProduct').onclick=()=>$('#productDialog').close();
    function openReceiptReview(orderId){$('#receiptReviewOrder').value=orderId;$('#receiptReviewStars').value='';$('#receiptReviewComment').value='';$('#receiptReviewDialog').showModal()}
    $('#closeReceiptReview').onclick=$('#cancelReceiptReview').onclick=()=>$('#receiptReviewDialog').close();
    $('#receiptReviewForm').onsubmit=async event=>{event.preventDefault();const orderId=Number($('#receiptReviewOrder').value),stars=Number($('#receiptReviewStars').value),comment=$('#receiptReviewComment').value.trim();if(!Number.isInteger(stars)||stars<1||stars>5){toast('Choose a one-to-five-star rating');return}if(!comment){toast('A written review comment is required');return}if(!reviewCommentsReady){toast('Receipt confirmation with review requires the v0.5 market component');return}if(!walletConnection.connected){$('#receiptReviewDialog').close();$('#walletDialog').showModal();return}try{await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'confirm_receipt_and_review',[literal(cborHead(0,orderId)),literal(cborHead(0,stars)),literal(cborText(comment))])],`Confirm receipt, leave ${stars} stars, and release escrow`);const order=orders.find(candidate=>candidate.marketComponent===MARKET_COMPONENT_ADDRESS&&candidate.chainOrderId===orderId);if(order){order.status='Released';order.review={stars,comment}}sellerOrders.forEach(order=>{if(order.marketComponent===MARKET_COMPONENT_ADDRESS&&order.chainOrderId===orderId)order.status='Released'});saveOrderState();$('#receiptReviewDialog').close();await refreshTrustScores();toast('Receipt confirmed, review posted, and escrow released')}catch(error){toast(error.message||'Receipt confirmation and payment release were not approved')}};
    $('#closeReviewDispute').onclick=$('#cancelReviewDispute').onclick=()=>$('#reviewDisputeDialog').close();
    $('#reviewDisputeForm').onsubmit=async event=>{event.preventDefault();if(!reviewCommentsReady){toast('Seller disputes require the v0.5 market component');return}if(!walletConnection.connected){$('#reviewDisputeDialog').close();$('#walletDialog').showModal();return}const orderId=Number($('#reviewDisputeOrder').value),reason=$('#reviewDisputeReason').value.trim();if(!reason)return;try{await submitInstructions([componentCall(MARKET_COMPONENT_ADDRESS,'dispute_review',[literal(cborHead(0,orderId)),literal(cborText(reason))])],'Dispute this seller review');$('#reviewDisputeDialog').close();await refreshTrustScores();toast('Review dispute sent to the marketplace owner')}catch(error){toast(error.message||'The review dispute was not approved')}};
    $('#copyPairing').onclick=async()=>{const uri=$('#pairingUri').value;if(!uri)return;try{await navigator.clipboard.writeText(uri);toast('Pairing link copied')}catch{toast('Select and copy the pairing link')} };
    let selectedListingFiles=[],listingPreviewUrls=[];
    function renderListingPreviews(){for(const url of listingPreviewUrls)URL.revokeObjectURL(url);listingPreviewUrls=[];const preview=$('#uploadPreview');if(!selectedListingFiles.length){preview.classList.remove('active');preview.innerHTML='';return}preview.classList.add('active');preview.innerHTML=selectedListingFiles.map((file,index)=>{const url=URL.createObjectURL(file);listingPreviewUrls.push(url);return `<div class="upload-preview-item"><img src="${url}" alt="Item photo ${index+1} preview"><button class="remove-upload" type="button" data-remove-upload="${index}" aria-label="Remove photo ${index+1}">×</button></div>`}).join('');preview.querySelectorAll('[data-remove-upload]').forEach(button=>button.onclick=()=>{selectedListingFiles.splice(Number(button.dataset.removeUpload),1);renderListingPreviews()})}
    $('#listingImage').onchange=e=>{const files=Array.from(e.target.files||[]);$('#listingError').textContent='';if(files.length>8){$('#listingError').textContent='Choose no more than 8 photos.';e.target.value='';selectedListingFiles=[];renderListingPreviews();return}const invalid=files.find(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024);if(invalid){$('#listingError').textContent=invalid.size>5*1024*1024?'Each photo must be smaller than 5 MB.':'Choose only JPG, PNG, or WebP photos.';e.target.value='';selectedListingFiles=[];renderListingPreviews();return}selectedListingFiles=files;renderListingPreviews()};
    $('#copyAddress').onclick=async()=>{const address=selected?.paymentAddress;if(!address)return;try{await navigator.clipboard.writeText(address);toast('Payment address copied')}catch{toast('Could not copy the address')}};
    $('#listingForm').onsubmit=async e=>{e.preventDefault();const form=e.currentTarget,d=new FormData(form),button=$('#publishListing'),errorBox=$('#listingError');errorBox.textContent='';if(!newPurchasesReady()){errorBox.textContent='Listing creation and username registration will reopen after the marketplace upgrade is activated.';return}if(!walletConnection.connected){dialog.close();$('#walletDialog').showModal();toast('Connect your Tari wallet before listing');return}button.disabled=true;button.textContent='Preparing listing…';try{const id=Date.now(),name=String(d.get('name')).trim(),description=String(d.get('description')).trim(),category=String(d.get('category')||''),price=Number(d.get('price')),shipping=Number(d.get('shipping')),stock=Number(d.get('stock')),paymentAddress=String(d.get('paymentAddress')).trim(),sellerUsername=normalizeSellerUsername(d.get('sellerUsername'));if(!sellerUsername)throw new Error('Choose a valid seller username.');if(paymentAddress.toLowerCase()!==walletConnection.accountAddress.toLowerCase())throw new Error('Use your connected Tari wallet as the payment address.');if(!CATEGORIES.includes(category))throw new Error('Choose a category for this item.');if(!/^component_[0-9a-f]{64}$/i.test(paymentAddress))throw new Error('Paste an Ootle Tari wallet address beginning with component_.');const images=await prepareListingImages(selectedListingFiles),deliveryPublicKey=await generateDeliveryKeyPair(id),usdCents=Math.max(1,Math.round((price+shipping)*xtmRate()*100)),instructions=[componentCall(MARKET_COMPONENT_ADDRESS,'create_listing',[literal(cborText(name)),literal(cborHead(0,usdCents)),literal(cborHead(0,atomicTari(price))),literal(cborHead(0,shipping>0?atomicTari(shipping):0)),literal(cborAddress(paymentAddress,128)),literal(cborText(deliveryPublicKey)),literal(cborHead(0,stock)),literal(cborText(sellerUsername))])];button.textContent='Waiting for wallet…';const receipt=await submitInstructions(instructions,`Publish as @${sellerUsername}: ${name} for ${xtm(price)} plus ${xtm(shipping)} shipping`),chainId=returnedListingId(receipt.result);if(!chainId)throw new Error('The listing transaction finalized, but its listing ID could not be read.');const listing={id,chainId,name,description,price,shipping,stock,paymentAddress,deliveryPublicKey,category,images,image:images[0]||'',alt:name,glow:'rgba(104,240,197,.2)'};listings.unshift(listing);selectedSeller=null;selectedCategory='All';currentMarketPage=1;if(!saveListings()){listings.shift();return}form.reset();selectedListingFiles=[];renderListingPreviews();dialog.close();await refreshTrustScores();render();toast(`Listing published with ${images.length} photo${images.length===1?'':'s'}`)}catch(problem){errorBox.textContent=problem.message||'Could not publish this listing.'}finally{button.disabled=false;button.textContent='Publish listing'}};
    $('#sellerUsername').oninput=updateUsernameStatus;
    showLegalNotice();render();renderWalletState();setPage(pageFromHash(),false);refreshRates();refreshTrustScores();setInterval(refreshRates,60000);restoreWalletSession();
    const modelContext=document.modelContext;
    if(modelContext?.registerTool){
      try{void Promise.resolve(modelContext.registerTool({name:'quote_listing',title:'Quote listing',description:'Read the fixed XTM price and live USD reference for one marketplace listing.',inputSchema:{type:'object',properties:{listing_id:{type:'number'}},required:['listing_id'],additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async input=>{if(!input||typeof input.listing_id!=='number')throw new Error('listing_id must be a number');const item=listings.find(x=>x.id===input.listing_id);if(!item)throw new Error('Listing not found');return{listing_id:item.id,listing:item.name,...values(item)}}})).catch(()=>{})}catch{}
    }
  