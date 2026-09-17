// Isolated Esmeralda QA. Uses only disposable test wallets, never user keys.
// Build SDK: cd wallet-browser && npx vite build --config qa.vite.config.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as sdk from '/tmp/xtm-contract-qa/sdk.mjs';
const {Network,TransactionBuilder,resolveMaxEpoch,signTransaction,sealTransaction,amountLiteral,componentAddressLiteral,resourceAddressLiteral,stringLiteral,intLiteral,iterVaultIdsInState,SecretKeyWallet,IndexerProvider,generateOotleSecretKey,toHexStr,fromHexStr}=sdk;
const NETWORK=Network.Esmeralda,INDEXER_URL='https://ootle-indexer-a.tari.com',STATE='/tmp/tari-post-moderation-state.json';
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

const deployer=await newWallet('deployer');
const binary=fs.readFileSync(new URL('../contracts/artifacts/Tari_Market_PostModeration_v0.1.0_Esmeralda.wasm',import.meta.url));
const sha=crypto.createHash('sha256').update(binary).digest('hex');
if(state.binarySha256&&state.binarySha256!==sha)throw Error('Artifact changed; inspect prior publication before proceeding');
state.binarySha256=sha;save();
if(!state.template){
 const ins=await inputs(state.deployer.account);
 const receipt=await submit(deployer,b=>b.withInputs(ins).withFeeInstructionsBuilder(f=>f.callMethod({componentAddress:state.deployer.account,methodName:'pay_fee'},[amountLiteral(30000000n)])).publishTemplate(binary.toString('base64')),'moderation-publish');
 state.template=JSON.stringify(receipt).match(/template_[0-9a-f]{64}/)[0];state.publishTransaction=state.last.transaction;save();
}
if(!state.registry){
 const ins=await inputs(state.deployer.account);
 const receipt=await submit(deployer,b=>b.withInputs(ins).withFeeInstructionsBuilder(f=>f.callMethod({componentAddress:state.deployer.account,methodName:'pay_fee'},[amountLiteral(3000000n)])).callFunction({templateAddress:state.template,functionName:'new'},[]),'moderation-instantiate');
 for(const a of [...new Set(JSON.stringify(receipt).match(/component_[0-9a-f]{64}/g)||[])]){
  const c=(await p.getSubstate(a)).substate?.Component;
  if(c?.header?.template_address===state.template.slice(9)){state.registry=a;state.creationTransaction=state.last.transaction;save();break;}
 }
 if(!state.registry)throw Error('Inspect instantiate receipt for component');
}
if(!state.unauthorizedTest){
 const ins=await inputs(state.deployer.account,[state.registry,'component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938']);
 await submit(deployer,b=>b.withInputs(ins).withFeeInstructionsBuilder(f=>f.callMethod({componentAddress:state.deployer.account,methodName:'pay_fee'},[amountLiteral(3000000n)])).callMethod({componentAddress:state.registry,methodName:'remove_post'},[componentAddressLiteral('component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938'),intLiteral(1n),stringLiteral('Unauthorized QA removal')]),'moderation-reject-deployer','Only the Tari Market owner');
 state.unauthorizedTest=state.last.transaction;save();
}
const response=await p.getSubstate(state.registry),c=response.substate.Component;
assert.equal(c.header.owner_rule,'None');assert.equal(c.body.state[0],'d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828');
const registry=JSON.parse(JSON.stringify(c.body.state[1]));assert.deepEqual(registry,{});
const publicRecord={network:'esmeralda',template:state.template,component:state.registry,owner_signer:c.body.state[0],owner_rule:c.header.owner_rule,artifact_sha256:sha,publish_transaction:state.publishTransaction,creation_transaction:state.creationTransaction,unauthorized_deployer_test:state.unauthorizedTest,scope:'Owner-signed Tari Market listing visibility only. No escrow, transfer or market-upgrade capability.'};
fs.writeFileSync(new URL('../contracts/deployment/post-moderation.json',import.meta.url),JSON.stringify(publicRecord,null,2)+'\n');
console.log(JSON.stringify(publicRecord));p.stopWatcher();
