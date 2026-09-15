/* XTM Market local walletd transport. The wallet API key never enters this page. */
(() => {
  'use strict';
  const available = location.origin === 'http://localhost:5180';
  let session = '', generation = 0;
  const pendingKey = 'xtm-market-local-approval';
  function notice(id, message = 'Review and approve this transaction in Asset Vault.') {
    const box = document.querySelector('#localApprovalNotice');
    if (!box) return;
    if (id) (document.querySelector('dialog[open]') || document.body).append(box);
    box.hidden = !id;
    box.querySelector('span').textContent = id ? `Request #${id}: ${message}` : '';
  }
  async function rpc(method, params = {}) {
    if (!available) throw new Error('Download and run the local launcher, then open http://localhost:5180.');
    if (!session) {
      const response = await fetch('/local-wallet/session', {headers: {'X-XTM-Local': '1'}, cache: 'no-store', signal: AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error('Restart the local launcher and reload this page.');
      session = (await response.json()).session;
    }
    const response = await fetch('/local-wallet/rpc', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'X-XTM-Local': '1', 'X-XTM-Session': session},
      body: JSON.stringify({method, params}), cache: 'no-store', signal: AbortSignal.timeout(60000),
    });
    const payload = await response.json();
    if (!response.ok || payload.error) throw new Error(payload.error || 'The local wallet request failed.');
    return payload.result;
  }
  async function request(method, params = {}) {
    if (method !== 'tari_submitTransaction') return rpc(method, params);
    const currentGeneration = generation;
    const previous = sessionStorage.getItem(pendingKey);
    if (previous) {
      const prior = await rpc('local_getApproval', {request_id: Number(previous)});
      if (!['Rejected', 'Expired', 'Submitted'].includes(prior.status)) {
        notice(previous);
        throw new Error(`Request #${previous} is still pending. Reject it in Asset Vault before retrying.`);
      }
      sessionStorage.removeItem(pendingKey);
      notice(null);
      if (prior.status === 'Submitted') throw new Error('Your previous approval was submitted. Check Asset Vault Transactions and refresh your orders before starting another transaction.');
    }
    const created = await rpc(method, params);
    const id = created.approval_request_id;
    if (!Number.isSafeInteger(id) || id < 0) throw new Error('No approval request ID returned. Check Asset Vault before retrying.');
    sessionStorage.setItem(pendingKey, String(id));
    notice(id);
    try {
      for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (generation !== currentGeneration) throw new Error('Wallet disconnected. Reject the pending request in Asset Vault if you no longer want it.');
        const result = await rpc('local_getApproval', {request_id: id});
        if (result.status === 'Submitted' && result.transaction_id) {
          sessionStorage.removeItem(pendingKey); notice(null);
          return {transaction_id: result.transaction_id};
        }
        if (['Rejected', 'Expired'].includes(result.status)) {
          sessionStorage.removeItem(pendingKey); notice(null);
          throw new Error(`Wallet request ${result.status.toLowerCase()}.`);
        }
      }
      throw new Error('Approval timed out. Check Asset Vault Requests before retrying.');
    } catch (error) {
      if (sessionStorage.getItem(pendingKey)) notice(id, 'Check its status in Asset Vault before retrying.');
      throw error;
    }
  }
  window.xtmLocalWallet = Object.freeze({available, request, disconnect() {generation++; session = '';}});
})();
