# XTM Market security review — September 15, 2026

**Status: security hardening implemented; not an independent audit, not a guarantee, and not clearance for real-money use.** Website source and the new v0.9.0 contract were reviewed. The new contract compiled to WASM, but has NOT been published or instantiated on Ootle. Existing escrow is unaffected by source changes. New purchases remain disabled.

## Escrow rule in v0.9.0

All escrow withdrawals go through one private `settle_order` function. It takes an order ID, a refund boolean, and an audit reason. It does not accept an amount or recipient. The function chooses the buyer refund address or seller payment address saved at purchase, withdraws exactly the saved order amount, and marks the order settled before calling the recipient. There is no public withdrawal, sweep, recipient setter, emergency drain, or escrow migration method.

“Original buyer/seller” means the account addresses recorded in the signed purchase/listing. It is not verification of a person's real-world identity or proof that an arbitrary supplied component is a standard wallet account. A bad recipient may prevent its own settlement. Transaction atomicity, resource ownership and rollback remain responsibilities of the Ootle engine.

The component uses native `OwnerRule::None`, rather than `OwnedBySigner`, so native owner-based template replacement is not available. Application ownership is retained in the constructor signing key and enforced inside guarded methods. This is intentionally an immutable escrow component: fixes require a new component for future purchases. The existing owner retains delivery recording and USD-reference updates. Admins can resolve disputes and manage admins, but cannot specify escrow recipients or amounts.

The 3% platform fee previously went to a third party directly from escrow. That conflicts with the requested two-party-only rule. In v0.9.0 the full escrow payment goes to the seller or buyer. A separate `pay_marketplace_fee` method accepts a fresh bucket explicitly authorized by the original seller after a completed sale, with exact resource/amount checks and a paid-once record. It never accesses the escrow vault. The website contains a separate fee-payment action. Fee collection is consequently not guaranteed; the seller can decline to pay, and this cannot prevent escrow settlement.

## Findings and changes

| Severity | Finding | Remediation / status |
|---|---|---|
| Critical to requested invariant | Native component owner could potentially replace escrow logic using engine upgrade authority. Upstream engine tests demonstrate owner-authorized migration. | New component has no native owner; application permissions are checked in code. Native-engine enforcement still needs integration testing against the deployment network. Existing components remain unchanged. |
| High | Platform fee was withdrawn from escrow to a third-party platform account. | Single two-party settlement route; fee uses a separate seller-supplied bucket. |
| High | `safeImageSrc` checked a prefix, allowing trailing quote/event-handler payloads into image attributes. | Full-string allowlist for local raster assets and raster base64 data; regression payloads rejected. |
| High | Universe bridge accepted any parent-frame origin, and sent requests to `*`. | Locally pinned bridge; exact parent origin and source checks; requests target `https://universe.tari.mw`; request timeouts added. Other embedding origins need a reviewed integration, not a wildcard. |
| High | Runtime bridge script could change remotely without a site update. | Checked-in bridge snapshot with integrity hash. WalletConnect and its imported shims are also checked in with provenance hashes; no remote script origin is allowed by CSP. |
| High | Truthy transaction results / status substrings could be mistaken for success. | Only exact `Accepted` status with an `Accept` execution decision is accepted. Rejection and fee-only acceptance do not count as purchase success. Unknown formats fail closed. Needs real-wallet compatibility testing. |
| Medium | Concurrent requests or wallet changes could corrupt payment attribution or duplicate submission. | Transaction mutex, purchase mutex, captured purchase data, account/session/provider checks, fresh wallet-account verification, pinned Esmeralda network byte (38, matching the recorded Esmeralda transaction), remembered unconfirmed transaction IDs and status check before retry. Browser clearing or lost response before an ID is returned still requires wallet-history reconciliation. |
| Medium | Local listing metadata and encryption key were trusted at checkout. | Compare listing ID, availability, title, seller address, XTM price, shipping and delivery key with fresh component state before encryption/payment. Indexer authenticity is still a trust dependency. |
| Medium | Local order data could nominate arbitrary marketplace component addresses. | Explicit component allowlist for case fetching; delegated admins do not gain permissions over legacy components; single-component review actions and local status updates restricted to matching components, preventing order-ID collisions with legacy components. |
| Medium | Exportable private delivery JWKs were saved in localStorage. | New keys are non-extractable CryptoKeys in IndexedDB. Legacy keys migrate when used, deleting the localStorage private JWK only after storage succeeds. Browser compromise can still invoke decryption; non-extractable is not hardware protection. Clearing site data can destroy keys. |
| Medium | Corrupt storage and unvalidated IDs, stock, prices or review stars could break rendering or reach unsafe attributes. | Guarded JSON reads, bounded stored-row counts, numeric validation, output escaping, static card style and bounded review-star rendering. |
| Medium | Release builds could wrap counters or arithmetic; some strings were unbounded. | Checked amount/counter/rating/epoch arithmetic, release overflow checks, title/key/admin bounds. Protocol fees and practical state-size limits still matter. |
| Defense in depth | Inline app execution lacked a restrictive script policy. | App moved to a local file; CSP blocks inline scripts and event handlers, objects, base-URL changes and form navigation. Script integrity hashes added. `_headers` declares frame restrictions, nosniff, referrer and permissions policy. Actual header delivery by hosting was not verified. |
| Defense in depth | Stale out-of-order role fetches could repaint outdated UI access. | No-cache timed fetches, response sequence checks and role expiration. Every contract action rechecks the signer; UI checks are not authorization. |

## Verification performed

- `cargo test --offline`: six passing unit tests using production helpers for party selection, repeated-settlement rejection, full shipping amount, overflow rejection, zero-price rejection, and signer grants/revocation.
- WASM release build for `wasm32-unknown-unknown`: succeeded with overflow checks.
- `node tests/security.cjs`: 46 passing assertions covering injection payloads, storage validation, exact transaction-result classification, bridge source/origin checks, one escrow withdrawal site, separate fee flow, effects-before-external-call ordering, CSP and script integrity.
- Secret-pattern scan of 11 first-party text files found no matching private-key blocks or token patterns; this is not exhaustive secret detection.
- Source review of all public contract methods and their callers, constructor/access rules, fee paths, frontend wallet submission, storage, rendered data and encryption handling. Static checks complement, but do not replace, runtime tests.
- OSV batch query for all 34 locked crates.io packages and direct `@walletconnect/sign-client` 2.23.7 returned no listed advisories. Raw inventory/results are in `security/`. This is advisory coverage at the time of the query, not proof that dependencies are safe. WalletConnect transitive dependencies and the native wallet/engine were not comprehensively scanned.
- Built artifact checksum saved next to the v0.9.0 WASM. Historical WASM files are retained for provenance; they have not been retroactively hardened.

## What remains unverified or trusted

1. **Live Ootle contract:** indexer requests were blocked with HTTP 403 in this environment. Its deployed bytecode, owner rule, balances, outstanding orders and correspondence to the repository could not be independently verified. Do not assume the new protections cover existing funds.
2. **Engine integration:** no on-chain or engine-harness adversarial transaction tests were run. Rollback after failed recipient deposits, reentrancy behavior, concurrent settlement, native upgrade denial and unauthorized transaction rejection require integration tests against the actual engine build. Unit tests are not substitutes for these tests.
3. **Wallet/infrastructure:** wallet key security, validator consensus, token recall/freeze rules, DNS, TLS, host permissions, and GitHub/Sites account access are outside the audited application source. A compromised host could replace the app and its integrity hashes; a compromised wallet can sign malicious transactions.
4. **Third-party JavaScript:** WalletConnect 2.23.7 and its complete static import graph (seven modules) are vendored locally with hashes in `security/vendor-manifest.json`; CSP allows scripts only from this site. This removes mutable remote-script loading, but is not a full audit of bundled third-party source. The transitive npm advisory inventory was not reconstructed. Future vendor updates require explicit review.
5. **Dispute fairness:** admins can choose which original party wins a disputed order. This prevents arbitrary recipient diversion, not biased or collusive decisions. Owner delivery recording is trusted. Admins can delegate to other admins by design; a compromised admin can extend that trust before revocation.
6. **Availability and privacy:** no SLA, DDoS/load test, private key recovery flow, durable cross-device catalogue database or independent cryptographic audit. Listings/orders remain partly browser-local. Encryption protects delivery content, not public order metadata or a compromised browser. Legacy private delivery keys remain in localStorage until migrated during use.
7. **Browser integration:** full interactive testing in the real Universe/WalletConnect host and verification of production response headers remain required. Exact success-format checks may reject unsupported provider responses until deliberately adapted.

## Activation requirements

Publish the reviewed v0.9.0 artifact and create a new component from the intended owner wallet. Verify its deployed template, `OwnerRule::None`, XTM resource, platform address, constructor signer, and test settlement behavior before enabling purchases. Update the site's explicit component configuration and security readiness flag only after verification. Keep all old component IDs for their existing orders; do not mutate IDs or silently migrate pooled funds. Website publication alone does not activate a new contract. No wallet transaction or admin grant was performed during this audit.

After any JavaScript changes, run `python scripts/update-script-integrity.py` and `node tests/security.cjs` before publishing.

## Purchase-window update — v0.10.0

The contract now records `purchase_recorded_epoch` from consensus during `buy` and allows the original seller to claim at that epoch plus 1,008 epochs. Delivery is not required and cannot reset the deadline. This permits claims before delivery if no dispute is open; buyer disputes must precede settlement. Disputed/settled checks and the original-party settlement restrictions remain in place. Existing deployed orders keep their original code.

Validation: eight Rust unit tests pass, including purchase deadline arithmetic and overflow rejection; 46 existing browser/security regression checks pass; the v0.10.0 release WASM builds successfully. These are local checks, not new on-chain integration or adversarial evidence. The artifact is pending Ootle publication and instantiation.

## Seller usernames — v0.11.0

Usernames are reserved atomically with listing creation. The registry uses the transaction signer, with one immutable lowercase name per key and a reverse index preventing duplicates. No caller-supplied identity, rename, transfer, or admin reassignment is accepted. Names are limited to 3–24 ASCII letters, numbers, and underscores, with selected official names reserved. Browser availability is advisory; only a successful contract transaction reserves the name. Display names are loaded from the registry and linked to the listing signer rather than trusted from local storage.

Scope: uniqueness is per marketplace component and signing key, not per human or across all Tari accounts/components. Multiple accounts may share a key. The website uses the connected payment address, but contract username ownership is the signer regardless of payout address. No key-rotation/recovery or namespace migration mechanism is implemented.

Validation: 14 Rust unit tests and 58 JavaScript/security checks pass, and the v0.11.0 WASM release builds. Added checks cover normalization, case-insensitive collisions, same-key reuse, prevention of multiple names per key, invalid/reserved names, verified registry display, mismatched registry indexes, and unavailable-state fallback. Live multi-wallet/concurrent transaction and rollback tests remain required before activating `SELLER_USERNAMES_READY`. Earlier audit limitations still apply; this is not a new full audit.
