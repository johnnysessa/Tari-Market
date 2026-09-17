/* Persist approval request IDs before submission; retries resume, never recreate. */
(() => {
  'use strict';
  const active = new Set();
  const timeoutMessage = 'Wallet request timed out. Check your wallet, then retry to check the same request.';
  function bounded(call, ms = 120000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
      Promise.resolve().then(call).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
  }
  async function submit(provider, account, params) {
    const key = 'tari-market-provider-request-v1:' + account;
    if (active.has(key)) throw new Error('Another wallet request is in progress.');
    const run = async () => {
      active.add(key);
      try {
        // Storage must work before any wallet write. Only public request/transaction IDs are saved.
        let record = JSON.parse(localStorage.getItem(key) || 'null');
        const recovered = Boolean(record);
        const save = value => { localStorage.setItem(key, JSON.stringify(value)); record = value; };
        const clear = () => { localStorage.removeItem(key); record = null; };
        const result = value => {
          const id = value?.transactionId || value?.transaction_id;
          if (!id || typeof id !== 'string') throw new Error('No transaction ID returned. Check your wallet before retrying.');
          save({phase: 'submitted', result: {transactionId: id}});
          return {...value, recovered};
        };
        const rpc = (method, args) => provider.request({method, params: args});
        if (record?.phase === 'submitted') return {...record.result, recovered: true};
        if (record && record.requestId === undefined) throw new Error('The previous wallet request has an unknown outcome. Check wallet Requests and Transactions; do not submit it again.');
        if (!record) {
          save({phase: 'creating'});
          if (typeof provider.requestTransaction !== 'function') {
            // Older request-only providers retain their supported submission method.
            // A late result is recorded even after the UI timer expires.
            return await bounded(() => Promise.resolve(rpc('tari_signAndSubmitTransaction', params)).then(result, error => {
                if (error?.code === 4001) clear();
                throw error;
            }));
          }
          const operation = {kind: 'instructions', instructions: params.instructions, maxFee: params.maxFee};
          if (params.inputs !== undefined) operation.inputs = params.inputs;
          // Unlike the convenience helper, no polling/submission continues after our deadline.
          await bounded(() => Promise.resolve(rpc('tari_createTransactionRequest', operation)).then(created => {
            const id = created?.requestId;
            if (!(typeof id === 'string' && id.length) && !(Number.isSafeInteger(id) && id >= 0)) throw new Error('No approval request ID returned. Check your wallet.');
            save({phase: 'approval', requestId: id});
          }, error => { if (error?.code === 4001 || error?.code === -32601) clear(); throw error; }));
        }
        const deadline = Date.now() + 120000;
        let readError;
        while (Date.now() < deadline) {
          let summary;
          try {
            summary = await bounded(() => rpc('tari_getTransactionRequest', {requestId: record.requestId}), Math.min(15000, deadline - Date.now()));
          } catch (error) {
            // Only status reads are retried. A lost write response never triggers a second write.
            readError = error;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          if (Date.now() >= deadline) break;
          if (summary?.status === 'submitted') return result(summary.result || summary);
          if (['rejected', 'failed', 'expired'].includes(summary?.status)) {
            clear();
            throw new Error('The previous wallet request was ' + summary.status + '. No new request was created.');
          }
          if (summary?.status === 'approved' && record.phase === 'approval') {
            // Recovery only checks old requests; it does not submit an approval from another visit.
            if (recovered) throw new Error('Your previous request is approved but not submitted. Finish or reject it in your wallet before starting another transaction.');
            if (window.tari !== provider) throw new Error('Wallet changed. Finish or reject the pending request in your wallet.');
            const accounts = await bounded(() => rpc('tari_getAccounts', {}), Math.max(1, deadline - Date.now()));
            const selected = Array.isArray(accounts) ? accounts[0] : accounts?.account || accounts;
            const address = typeof selected === 'string' ? selected : selected?.component_address || selected?.account_address || selected?.address;
            if (String(address).toLowerCase() !== account.toLowerCase() || window.tari !== provider) throw new Error('Wallet account changed. Finish or reject the pending request in your wallet.');
            if (Date.now() >= deadline) break;
            save({...record, phase: 'submitting'});
            try {
              return await bounded(() => Promise.resolve(rpc('tari_submitTransactionRequest', {requestId: record.requestId})).then(result), Math.max(1, deadline - Date.now()));
            } catch (error) { readError = error; }
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error(timeoutMessage + (readError ? ' The wallet status could not be confirmed.' : ''));
      } finally { active.delete(key); }
    };
    if (navigator.locks?.request) return navigator.locks.request(key, {ifAvailable: true}, lock => {
      if (!lock) throw new Error('This wallet has a request open in another tab.');
      return run();
    });
    return run();
  }
  function acknowledge(account, transactionId) {
    const key = 'tari-market-provider-request-v1:' + account;
    const record = JSON.parse(localStorage.getItem(key) || 'null');
    if (record?.phase === 'submitted' && record.result?.transactionId === transactionId) localStorage.removeItem(key);
  }
  window.xtmProviderTransactions = Object.freeze({submit, acknowledge, bounded});
})();
