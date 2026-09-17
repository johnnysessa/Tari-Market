/* Shared listing photos; private delivery keys never leave this browser. */
const SHARED_MEDIA_ORIGIN='https://tari-market.johnnytsunami14.chatgpt.site';
const LEGACY_MEDIA_ORIGIN='https://xtm-market.johnnytsunami14.chatgpt.site';
let sharedMediaBusy=false,sharedMediaLast=0,mediaEditorItem=null,mediaUploadBusy=false;
const mediaRecoveryAttempts=new Set();
function sharedImageUrl(value){
 if(typeof value!=='string')return '';
 const origin=[SHARED_MEDIA_ORIGIN,LEGACY_MEDIA_ORIGIN].find(origin=>value.startsWith(origin+'/'));
 const path=origin?value.slice(origin.length):value;
 return /^\/api\/listing-images\/[a-f0-9]{64}$/.test(path)?SHARED_MEDIA_ORIGIN+path:'';
}
async function mediaRequest(path,options={}){
 const response=await fetch(SHARED_MEDIA_ORIGIN+path,{...options,credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(45000)});
 let data;try{data=await response.json()}catch{throw new Error('Photo sharing is unavailable. Your originals are still saved in this browser.')}
 if(!response.ok)throw new Error(data.error||'Photos could not be shared. Try again.');return data;
}
function applySharedPhotos(item,manifest){
 if(!manifest||manifest.component!==item.marketComponent||manifest.id!==item.chainId||!Array.isArray(manifest.images)||manifest.images.length>8)return false;
 const images=manifest.images.map(sharedImageUrl);if(images.some(v=>!v))return false;
 item.sharedImages=images;item.mediaShared=true;item.mediaPending=false;
 if(typeof manifest.description==='string')item.description=manifest.description.slice(0,5000);
 if(typeof manifest.category==='string'&&CATEGORIES.includes(manifest.category))item.category=manifest.category;
 if(typeof manifest.condition==='string'&&ITEM_CONDITIONS.includes(manifest.condition))item.condition=manifest.condition;
 return true;
}
async function shareListingPhotos(item,images,recover=false){
 const account=walletConnection.accountAddress;
 if(!recover&&(!walletConnection.connected||String(item.paymentAddress).toLowerCase()!==String(account).toLowerCase()))throw new Error('Connect the wallet that owns this listing.');
 const key=await loadDeliveryPrivateKey(item.id);
 if(!key)throw new Error('Open the browser where this listing was created to share or replace its photos. Its private listing key is not on this device.');
 const content={images,description:String(item.description||''),category:String(item.category||'Other')};
 if(ITEM_CONDITIONS.includes(item.condition))content.condition=item.condition;
 const serialized=new TextEncoder().encode(JSON.stringify(content));
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',serialized)),v=>v.toString(16).padStart(2,'0')).join('');
 const challenge=await mediaRequest('/api/listing-media/challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({component:item.marketComponent,id:item.chainId,digest})});
 if(typeof challenge.encrypted!=='string'||challenge.encrypted.length>1400)throw new Error('Invalid photo authorization response.');
 const plaintext=await crypto.subtle.decrypt({name:'RSA-OAEP'},key,base64ToBytes(challenge.encrypted));
 if(plaintext.byteLength!==32)throw new Error('Invalid photo authorization response.');
 if(!recover&&(!walletConnection.connected||account!==walletConnection.accountAddress))throw new Error('Wallet changed. Reconnect before sharing photos.');
 const manifest=await mediaRequest('/api/listing-media/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket:challenge.ticket,signature:challenge.signature,proof:bytesToBase64(plaintext),content})});
 if(!applySharedPhotos(item,manifest))throw new Error('Could not verify the saved photos. Refresh before retrying.');
 saveListings();return manifest;
}
async function refreshSharedMedia(force=false){
 if(sharedMediaBusy||!force&&Date.now()-sharedMediaLast<30000)return;
 sharedMediaBusy=true;let failed=false,recovered=0;
 try{
  for(const component of [MARKET_COMPONENT_ADDRESS,PREVIOUS_MARKET_COMPONENT]){
   const items=listings.filter(item=>item.marketComponent===component&&safeId(item.chainId)&&!item.sample&&!item.deleted);
   for(let offset=0;offset<items.length;offset+=64){
    const batch=items.slice(offset,offset+64),result=await mediaRequest('/api/listing-media?component='+component+'&ids='+batch.map(item=>item.chainId).join(','));
    for(const item of batch){
     const manifest=result.listings?.[String(item.chainId)];
     if(manifest){applySharedPhotos(item,manifest);continue;}
     const original=(Array.isArray(item.images)&&item.images.length?item.images:[item.image]).filter(value=>typeof value==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(value));
     const attempt=component+':'+item.chainId+':'+walletConnection.accountAddress;
     if((!original.length&&!ITEM_CONDITIONS.includes(item.condition))||mediaRecoveryAttempts.has(attempt))continue;
     mediaRecoveryAttempts.add(attempt);
     if(!await loadDeliveryPrivateKey(item.id))continue;
     try{await shareListingPhotos(item,original,true);recovered++;}catch{item.mediaPending=true;failed=true;}
    }
   }
  }
  sharedMediaLast=Date.now();saveListings();render();
 }catch{failed=true;}
 finally{sharedMediaBusy=false;document.querySelector('#sharedPhotoStatus').textContent=failed?'Some listing details or photos could not be shared. Use Recover saved details & photos to retry.':recovered?`${recovered} listing photo set${recovered===1?'':'s'} recovered and shared.`:'';}
}
async function openMediaEditor(component,id){
 const item=listings.find(row=>row.marketComponent===component&&row.chainId===id);
 if(!item||!walletConnection.connected||String(item.paymentAddress).toLowerCase()!==String(walletConnection.accountAddress).toLowerCase()){toast('Connect the seller wallet to manage these photos.');return;}
 mediaEditorItem=item;document.querySelector('#mediaPhotoFiles').value='';document.querySelector('#mediaPhotoTitle').textContent=item.name;
 document.querySelector('#mediaPhotoStatus').textContent='Choose replacement photos, or share the originals saved in this browser. Photos will be visible to everyone.';
 document.querySelector('#mediaPhotoDialog').showModal();
 const hasKey=Boolean(await loadDeliveryPrivateKey(item.id));
 if(mediaEditorItem!==item)return;
 document.querySelector('#mediaPhotoSubmit').disabled=!hasKey;
 if(!hasKey)document.querySelector('#mediaPhotoStatus').textContent='Open this listing in the original browser to manage its photos. If that browser data is gone, recreate the listing with your photos; connecting the wallet alone cannot recover its private listing key.';
}
async function saveMediaPhotos(event){
 event.preventDefault();if(mediaUploadBusy||!mediaEditorItem)return;
 const item=mediaEditorItem,files=Array.from(document.querySelector('#mediaPhotoFiles').files||[]),status=document.querySelector('#mediaPhotoStatus');
 mediaUploadBusy=true;document.querySelector('#mediaPhotoSubmit').disabled=true;
 try{
  const images=files.length?await prepareListingImages(files):(Array.isArray(item.images)&&item.images.length?item.images:[item.image]).filter(value=>typeof value==='string'&&value.startsWith('data:image/'));
  if(!images.length)throw new Error('Choose the original photos to upload.');
  // Preserve originals even if the network upload fails; never claim a shared save early.
  item.images=images;item.image=images[0];item.mediaPending=true;saveListings();
  status.textContent='Saving shared photos…';await shareListingPhotos(item,images);
  document.querySelector('#mediaPhotoDialog').close();mediaEditorItem=null;render();toast('Photos saved and visible to everyone.');
 }catch(error){status.textContent=error.message||'Photos could not be shared. Retry from this screen.';}
 finally{mediaUploadBusy=false;document.querySelector('#mediaPhotoSubmit').disabled=false;}
}
document.querySelector('#mediaPhotoForm').onsubmit=saveMediaPhotos;
document.querySelector('#mediaPhotoCancel').onclick=()=>{if(!mediaUploadBusy){document.querySelector('#mediaPhotoDialog').close();mediaEditorItem=null;}};
document.querySelector('#mediaPhotoDialog').addEventListener('cancel',event=>{if(mediaUploadBusy)event.preventDefault();else mediaEditorItem=null;});
document.querySelector('#recoverListingPhotos').onclick=()=>{mediaRecoveryAttempts.clear();refreshSharedMedia(true)};
setInterval(()=>{if(!document.hidden)refreshSharedMedia()},45000);
