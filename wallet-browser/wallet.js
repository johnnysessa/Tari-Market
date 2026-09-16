// Browser-only Esmeralda wallet, using Tari's BSD-3-Clause Ootle SDK.
// Pattern: local keys, encrypted storage, local signing.
import {Network,amountLiteral,TransactionBuilder,resolveMaxEpoch,toHexStr,fromHexStr,signTransaction,sealTransaction,iterVaultIdsInState} from '@tari-project/ootle';
import {SecretKeyWallet} from '@tari-project/ootle-secret-key-wallet';
import {IndexerProvider} from '@tari-project/ootle-indexer';
import {generateOotleSecretKey} from '@tari-project/ootle-wasm';

const STORAGE='xtm-market-esmeralda-wallet-v1', NETWORK=Network.Esmeralda;
const URLS=['https://ootle-indexer-a.tari.com','https://ootle-indexer-b.tari.com'];
let state=null,key=null,salt=null,signer=null,provider=null,endpoint=null,busy=false;
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const un64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export function exists(){return !!localStorage.getItem(STORAGE)}
async function derive(password,s){const material=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:s,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function persist(){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(state)));localStorage.setItem(STORAGE,JSON.stringify({version:1,salt:b64(salt),iv:b64(iv),cipher:b64(cipher)}))}
async function getProvider(preferred=URLS){
  if(provider)return provider;
  for(const url of preferred){try{const response=await fetch(url+'/network',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Network unavailable');const network=await response.json();if(Number(network.network_byte)!==NETWORK)throw Error('Wrong network');const p=await IndexerProvider.connect({url,network:NETWORK});provider=p;endpoint=url;return p}catch{}}
  throw Error('Esmeralda is unavailable. Your saved test wallet is unchanged. Try again later.');
}
async function submitEnvelope(envelope){
  const p=await getProvider();
  try{return await p.submitTransaction(envelope)}catch(error){
    if(!/HTTP 5\d\d|fetch failed|network|timeout/i.test(String(error.message)))throw error;
    const previous=endpoint;provider=null;
    // An identical sealed transaction is safe to relay again; never re-sign it.
    return (await getProvider(URLS.filter(url=>url!==previous))).submitTransaction(envelope);
  }
}
export async function unlock(password){
  if(busy)throw Error('Wallet operation in progress.');
  if(!password||password.length<12)throw Error('Use a password of at least 12 characters.');
  busy=true;
  try{
    const saved=localStorage.getItem(STORAGE);
    if(saved){const record=JSON.parse(saved);salt=un64(record.salt);key=await derive(password,salt);try{state=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(record.iv)},key,un64(record.cipher))))}catch{throw Error('Incorrect password or damaged test-wallet backup.')}}
    else{const keys=generateOotleSecretKey();salt=crypto.getRandomValues(new Uint8Array(16));key=await derive(password,salt);state={network:NETWORK,owner:toHexStr(keys.owner_key),view:toHexStr(keys.view_key),account:null};keys.owner_key.fill(0);keys.view_key.fill(0);await persist()}
    if(state.network!==NETWORK)throw Error('This wallet is not an Esmeralda test wallet.');
    signer=SecretKeyWallet.fromSecretKey(fromHexStr(state.owner),NETWORK,fromHexStr(state.view));
    return {account:state.account,address:await signer.getAddress()};
  }catch(error){lock();throw error}finally{busy=false}
}
export function lock(){state=null;key=null;salt=null;signer=null;provider?.stopWatcher();provider=null;endpoint=null}
export function backup(){const data=localStorage.getItem(STORAGE);if(!data)throw Error('Create your test wallet first.');return data}
export function restore(text){if(exists())throw Error('A test wallet already exists in this browser. Use another browser profile to restore a different wallet.');const r=JSON.parse(text);if(r.version!==1||un64(r.salt).length!==16||un64(r.iv).length!==12||un64(r.cipher).length<16)throw Error('Invalid encrypted test-wallet backup.');localStorage.setItem(STORAGE,JSON.stringify(r))}
function requireUnlocked(){if(!state||!signer)throw Error('Unlock your test wallet first.')}
export async function connectAccount(account=''){
  requireUnlocked();
  const address=await signer.getAddress(),ownerPublicKey=toHexStr(await signer.getPublicKey());
  const selected=String(account||state.account||'').trim();
  if(!selected)return {account:null,address,ownerPublicKey};
  if(!/^component_[0-9a-f]{64}$/i.test(selected))throw Error('Enter your existing Esmeralda account address, beginning with component_.');
  const p=await getProvider(),response=await p.getSubstate(selected);
  const component=(response.substate||response.value?.substate)?.Component;
  const owner=component?.header?.owner_rule?.ByPublicKey;
  const actual=Array.isArray(owner)?toHexStr(Uint8Array.from(owner)):typeof owner==='string'?owner.toLowerCase():'';
  if(actual!==ownerPublicKey)throw Error('That account is not owned by this browser wallet. Connect its original wallet using one of the other options.');
  state.account=selected;await persist();
  return {account:selected,address,ownerPublicKey};
}
// Native Esmeralda faucet: a fixed 1,000 test Tari grant, less the network fee.
// Only called after an explicit Create wallet & get test funds action.
const FAUCET='component_010203'+'00'.repeat(29);
const FAUCET_INPUTS=[FAUCET,'vault_010203'+'00'.repeat(28)+'01','resource_010203'+'00'.repeat(28)+'02'];
export async function fundNewWallet(){
  requireUnlocked();
  if(busy)throw Error('Wallet operation in progress.');
  if(state.account)return connectAccount();
  busy=true;
  try{
    const p=await getProvider();
    if(!state.fundingEnvelope&&!state.fundingTransaction){
      const ownerPublicKey=toHexStr(await signer.getPublicKey());
      const tx=new TransactionBuilder(NETWORK,await resolveMaxEpoch(p))
        .withFeeInstructionsBuilder(b=>b.createAccount(ownerPublicKey).saveVar('account')
          .callMethod({componentAddress:FAUCET,methodName:'take'},[{Workspace:'account'}])
          .callMethod({fromWorkspace:'account',methodName:'pay_fee'},[amountLiteral(300000n)]))
        .withInputs(FAUCET_INPUTS.map(substate_id=>({substate_id,version:null})))
        .buildUnsignedTransaction();
      state.fundingEnvelope=sealTransaction(await signTransaction([signer],tx));
      await persist();
    }
    if(!state.fundingTransaction){
      const sent=await submitEnvelope(state.fundingEnvelope);
      state.fundingTransaction=sent.transaction_id;
      await persist();
    }
    for(let attempt=0;attempt<30;attempt++){
      const receipt=await p.getTransactionResult(state.fundingTransaction),result=normalizeReceipt(receipt);
      if(result.status==='Rejected'){
        delete state.fundingEnvelope;delete state.fundingTransaction;await persist();
        throw Error('Testnet funding was rejected. Your wallet is saved. Try again later.');
      }
      if(result.status==='Accepted'){
        const candidates=[...new Set(JSON.stringify(receipt).match(/component_[0-9a-f]{64}/g)||[])].filter(id=>id!==FAUCET);
        let account;
        for(const candidate of candidates){
          try{account=await connectAccount(candidate);break}catch{/* Only adopt a verified account owned by these keys. */}
        }
        if(!account)throw Error('Funding confirmed, but the account is still syncing. Unlock again to check; no new claim will be sent.');
        state.fundingConfirmed=state.fundingTransaction;
        delete state.fundingEnvelope;delete state.fundingTransaction;await persist();
        return account;
      }
      await new Promise(resolve=>setTimeout(resolve,2000));
    }
    throw Error('Funding is still pending. Your wallet is saved. Unlock again to check the same transaction.');
  }finally{busy=false}
}
export async function balance(){
  requireUnlocked();if(!state.account)return 0;
  const p=await getProvider(),res=await p.getSubstate(state.account),component=res.substate||res.value?.substate;
  let total=0;
  for(const id of iterVaultIdsInState(component?.Component?.body?.state)){
    const r=await p.getSubstate(id),v=(r.substate||r.value?.substate)?.Vault?.resource_container;
    const funds=v?.Stealth||v?.Confidential||v?.Fungible;
    if(funds?.address==='resource_'+'01'.repeat(32))total+=Number(funds.revealed_amount??funds.amount??0)/1e6;
  }
  return total;
}
function normalizeReceipt(r){const f=r.result?.Finalized;if(!f||f.final_decision==null)return {status:'Pending'};const result=f.execution_result;return {status:f.final_decision==='Commit'&&result?.finalize?.result?.Accept?'Accepted':'Rejected',result:result?.finalize,execution_results:result?.execution_results,receipt:r}}
async function inputsFor(instructions){
  const ids=new Set([state.account]);
  for(const match of JSON.stringify(instructions).matchAll(/(?:component|resource|vault)_[0-9a-f]{64}/g))ids.add(match[0]);
  // Literal CBOR references may contain component/resource addresses as tagged bytes.
  for(const match of JSON.stringify(instructions).matchAll(/d8(80|83)5820([0-9a-f]{64})/g))ids.add((match[1]==='80'?'component_':'resource_')+match[2]);
  const p=await getProvider();
  for(const id of [...ids].filter(id=>id.startsWith('component_'))){const r=await p.getSubstate(id);for(const vault of iterVaultIdsInState((r.substate||r.value?.substate)?.Component?.body?.state))ids.add(vault)}
  return [...ids].map(substate_id=>({substate_id,version:null}));
}
export async function request(method,params={}){
  requireUnlocked();
  if(method==='tari_getDefaultAccount')return {account:{component_address:state.account,owner_key_id:'browser-testnet'}};
  const p=await getProvider();
  if(method==='tari_getTransactionResult')return normalizeReceipt(await p.getTransactionResult(params.transaction_id));
  if(method!=='tari_submitTransaction')throw Error('Unsupported test-wallet request.');
  if(busy)throw Error('Wallet operation in progress.');busy=true;
  try{
    const tx=params.transaction?.V1;if(tx?.network!==NETWORK)throw Error('Only Esmeralda testnet is supported.');
    if(state.pendingTransaction){const prior=normalizeReceipt(await p.getTransactionResult(state.pendingTransaction));if(prior.status==='Pending')throw Error('Previous transaction is still unconfirmed. Check it before retrying.');state.pendingTransaction=null;delete state.pendingEnvelope;await persist();throw Error('Previous transaction finished. Review your orders before starting another.');}
    if(state.pendingEnvelope){const sent=await submitEnvelope(state.pendingEnvelope);state.pendingTransaction=sent.transaction_id;await persist();return sent}
    const unsigned=new TransactionBuilder(NETWORK,await resolveMaxEpoch(p)).withInstructions(tx.instructions).withFeeInstructions(tx.fee_instructions).withInputs(await inputsFor([...tx.instructions,...tx.fee_instructions])).buildUnsignedTransaction();
    const dry=sealTransaction(await signTransaction([signer],{...unsigned,dry_run:true}));
    const response=await fetch(endpoint+'/transactions/dry-run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transaction:dry}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Could not validate the test transaction. Nothing was submitted.');
    const result=(await response.json()).result?.finalize?.result;
    if(!result||!Object.hasOwn(result,'Accept'))throw Error('Test transaction validation failed: '+JSON.stringify(result).slice(0,250));
    state.pendingEnvelope=sealTransaction(await signTransaction([signer],unsigned));await persist();
    const submitted=await submitEnvelope(state.pendingEnvelope);state.pendingTransaction=submitted.transaction_id;await persist();return submitted;
  }finally{busy=false}
}
export async function acknowledge(transactionId){if(state?.pendingTransaction===transactionId){state.pendingTransaction=null;delete state.pendingEnvelope;await persist()}}
