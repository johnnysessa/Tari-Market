// Isolated Esmeralda QA. Uses only disposable test wallets, never user keys.
// Build SDK: cd wallet-browser && npx vite build --config qa.vite.config.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as sdk from '/tmp/xtm-contract-qa/sdk.mjs';
const {Network,TransactionBuilder,resolveMaxEpoch,signTransaction,sealTransaction,amountLiteral,componentAddressLiteral,resourceAddressLiteral,stringLiteral,intLiteral,iterVaultIdsInState,SecretKeyWallet,IndexerProvider,generateOotleSecretKey,toHexStr,fromHexStr}=sdk;
const NETWORK=Network.Esmeralda,INDEXER_URL='https://ootle-indexer-a.tari.com',STATE='/tmp/xtm-contract-qa-state.json';
const TARI='resource_'+'01'.repeat(32),FAUCET='component_010203'+'00'.repeat(29);
let state=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE)):{};
function save(){fs.writeFileSync(STATE,JSON.stringify(state),{mode:0o600});}
const p=await IndexerProvider.connect({url:INDEXER_URL,network:NETWORK});
function wallet(w){return SecretKeyWallet.fromSecretKey(fromHexStr(w.owner),NETWORK,fromHexStr(w.view));}
async function submit(signer,build,label,expectedError){
 const tx=build(new TransactionBuilder(NETWORK,await resolveMaxEpoch(p))).buildUnsignedTransaction();
 const envelope=sealTransaction(await signTransaction([signer],tx));
 const sent=await p.submitTransaction(envelope);console.log(label,sent.transaction_id);
 state.last={label,transaction:sent.transaction_id};save();
 for(let i=0;i<60;i++){
  const receipt=await p.getTransactionResult(sent.transaction_id),f=receipt.result?.Finalized;
  if(f?.final_decision){fs.writeFileSync('/tmp/xtm-qa-'+label+'.json',JSON.stringify(receipt,null,2));if(expectedError){if(JSON.stringify(f).includes(expectedError)&&!f.execution_result?.finalize?.result?.Accept)return receipt;throw Error('Expected rejection: '+expectedError);}if(f.final_decision!=='Commit'||!f.execution_result?.finalize?.result?.Accept)throw Error(label+': '+JSON.stringify(f.execution_result?.finalize?.result||f).slice(0,1000));return receipt;}
  await new Promise(r=>setTimeout(r,2000));
 }
 throw Error('Unconfirmed '+label+'; inspect '+sent.transaction_id+' before retrying.');
}
async function newWallet(name){
 if(state[name]?.account)return wallet(state[name]);
 if(state[name])throw Error('Incomplete test wallet setup; inspect last transaction before retrying.');
 const keys=generateOotleSecretKey();state[name]={owner:toHexStr(keys.owner_key),view:toHexStr(keys.view_key)};save();
 const signer=wallet(state[name]),pub=toHexStr(await signer.getPublicKey());
 const receipt=await submit(signer,b=>b.withFeeInstructionsBuilder(f=>f.createAccount(pub).saveVar('account').callMethod({componentAddress:FAUCET,methodName:'take'},[{Workspace:'account'}]).callMethod({fromWorkspace:'account',methodName:'pay_fee'},[amountLiteral(300000n)])).withInputs([FAUCET,'vault_010203'+'00'.repeat(28)+'01','resource_010203'+'00'.repeat(28)+'02'].map(substate_id=>({substate_id,version:null}))),name+'-fund');
 for(const a of [...new Set(JSON.stringify(receipt).match(/component_[0-9a-f]{64}/g)||[])]){
  if(a===FAUCET)continue;const c=(await p.getSubstate(a)).substate?.Component;
  const raw=c?.header?.owner_rule?.ByPublicKey,owner=Array.isArray(raw)?toHexStr(Uint8Array.from(raw)):raw;
  if(owner===pub){state[name].account=a;save();return signer;}
 }
 throw Error('Could not verify new test account');
}
async function inputs(account,extra=[]){
 const c=(await p.getSubstate(account)).substate?.Component;
 return [...new Set([account,...iterVaultIdsInState(c?.body?.state),...extra])].map(substate_id=>({substate_id,version:null}));
}
const seller=await newWallet('seller');
if(!state.template){
 const binary=fs.readFileSync(new URL('../contracts/artifacts/XTM_Market_ListingManagement_v0.12.0_Esmeralda.wasm',import.meta.url));
 state.binarySha256=crypto.createHash('sha256').update(binary).digest('hex');save();
 const ins=await inputs(state.seller.account);
 const receipt=await submit(seller,b=>b.withInputs(ins).withFeeInstructionsBuilder(f=>f.callMethod({componentAddress:state.seller.account,methodName:'pay_fee'},[amountLiteral(30000000n)])).publishTemplate(binary.toString('base64')),'publish');
 state.template=JSON.stringify(receipt).match(/template_[0-9a-f]{64}/)[0];state.publishTransaction=state.last.transaction;save();
}
async function run(name, signer, account, operation, extra=[], expectedError){
 if(state.tests?.[name])return;
 const ins=await inputs(account,extra);
 const receipt=await submit(signer,b=>operation(b.withInputs(ins).withFeeInstructionsBuilder(f=>f.callMethod({componentAddress:account,methodName:'pay_fee'},[amountLiteral(3000000n)]))),name,expectedError);
 state.tests??={};state.tests[name]=state.last.transaction;save();return receipt;
}
if(!state.market){
 const receipt=await run('instantiate',seller,state.seller.account,b=>b.callFunction({templateAddress:state.template,functionName:'new'},[resourceAddressLiteral(TARI),componentAddressLiteral(state.seller.account)]));
 for(const a of [...new Set(JSON.stringify(receipt).match(/component_[0-9a-f]{64}/g)||[])]){
  const c=(await p.getSubstate(a)).substate?.Component;
  if(c?.header?.template_address===state.template.slice(9)){state.market=a;save();break;}
 }
 if(!state.market)throw Error('Inspect instantiate receipt for component');
}
const other=await newWallet('other');
const call=(method,args)=>b=>b.callMethod({componentAddress:state.market,methodName:method},args);
await run('create',seller,state.seller.account,call('create_listing',[stringLiteral('QA item'),intLiteral(100n),amountLiteral(1000000n),amountLiteral(0n),componentAddressLiteral(state.seller.account),stringLiteral('qa-delivery-key'),intLiteral(2n),stringLiteral('qa_seller')]),[state.market]);
const edit=[intLiteral(1n),stringLiteral('QA edited'),intLiteral(200n),amountLiteral(2000000n),amountLiteral(0n),intLiteral(3n)];
await run('reject-other-edit',other,state.other.account,call('update_listing',edit),[state.market],'Only the original seller may edit');
await run('reject-other-delete',other,state.other.account,call('cancel_listing',[intLiteral(1n)]),[state.market],'Only the original seller may delete');
const editedReceipt=await run('seller-edit',seller,state.seller.account,call('update_listing',edit),[state.market]);
if(editedReceipt)fs.writeFileSync('/tmp/xtm-qa-edited-state.json',JSON.stringify(await p.getSubstate(state.market),null,2));
await run('seller-delete',seller,state.seller.account,call('cancel_listing',[intLiteral(1n)]),[state.market]);
await run('reject-edit-deleted',seller,state.seller.account,call('update_listing',edit),[state.market],'Listing is deleted');
fs.writeFileSync('/tmp/xtm-qa-deleted-state.json',JSON.stringify(await p.getSubstate(state.market),null,2));
const edited=JSON.parse(fs.readFileSync('/tmp/xtm-qa-edited-state.json')).substate.Component.body.state[3].entries[0][1];
const deleted=JSON.parse(fs.readFileSync('/tmp/xtm-qa-deleted-state.json')).substate.Component.body.state[3].entries[0][1];
assert.deepEqual(edited.slice(0,5),[1,'QA edited',200,2000000,0]);
assert.equal(edited[8],3);assert.equal(edited[9],true);
assert.deepEqual(deleted.slice(0,8),edited.slice(0,8));
assert.equal(deleted[8],0);assert.equal(deleted[9],false);
console.log(JSON.stringify({template:state.template,qaComponent:state.market,tests:state.tests}));
p.stopWatcher();
