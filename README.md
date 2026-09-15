# XTM Market

XTM Market is an open-source marketplace prototype for Tari Ootle. Items and shipping are priced in XTM, with a live USD reference. The website includes product browsing, wallet checkout, seller profiles, escrow order management, disputes, and an admin workspace.

**[Open XTM Market](https://xtm-market.johnnytsunami14.chatgpt.site)** · [Security review](SECURITY_REVIEW.md) · [MIT license](LICENSE)

Updated September 15, 2026. Current contract source: **v0.11.0**.

## Current status

The updated website is published. The v0.11.0 contract is written, tested at the unit level, and compiled, but **has not been published or instantiated on Ootle**. Updating the website does not activate new blockchain behavior.

New purchases and listings remain disabled by the readiness flags in `dist/assets/app.js`. Seller usernames, the purchase-based seller claim window, admin delegation, updated review behavior, and two-party-only escrow require the appropriate new component to be activated. Existing orders remain governed by their original deployed component. Live deployed bytecode and balances were not independently verified during the latest security review because indexer access returned HTTP 403.

The **Current availability** notice was removed from the disputes guide as requested. Removing that notice did not enable payments or alter contract permissions.

## Latest website updates

The website includes the following recent changes:

- Sellers choose a unique wallet-linked username in the listing form. Registration becomes available when the v0.11.0 component is activated.
- The buy page shows **Seller claim window — 14 days after recorded purchase**. Checkout terms, the escrow guide, dispute timing guidance, and automatic-review explanations use the same purchase-based rule.
- The top-left **XTM Market** button opens the Market page.
- The bottom of the Market page offers **8, 16, 24, 32, or 64 items per page**, remembers the selection in this browser, and returns to page one when changed.
- The README and pending deployment metadata identify the compiled **v0.11.0** contract as the next Ootle publication target.

The new timeout is measured as **1,008 consensus epochs**, approximately 14 days, rather than an exact wall-clock deadline. An undisputed order can become eligible before shipping or delivery is recorded. The seller must submit a claim; payment does not release automatically when the deadline passes. This rule applies after the new component is activated, while existing orders retain their original contract rules.

## Website pages and navigation

| Page or view | Purpose |
|---|---|
| Market | Browse items, view prices and stock, and open product details or checkout. |
| Categories | Browse grouped categories and filter listings. |
| Product details | View the photo gallery, full description, pricing, seller profile, other seller items, and Buy action. |
| Checkout | Review one item, shipping, XTM total, USD reference, seller address, delivery details, and escrow terms before wallet approval. |
| Recent orders | View purchases submitted from this browser and available buyer actions. |
| Orders received | View sales for the connected seller wallet, decrypt delivery details on the listing device, update shipping, view feedback, dispute reviews, and access eligible seller actions. |
| Refunds & disputes | Start an eligible buyer refund request/payment dispute and follow its status and verdict. |
| Disputes & refunds guide | Explain payment disputes, refund outcomes, seller payouts, timing, and limitations. |
| Ootle escrow | Explain funding at purchase, shipping, delivery recording, receipt confirmation, timeout claims, and refunds. |
| 3% fee | Explain app-maintenance and future Tari-development funding, the item-price-only calculation, and separate seller payment under v0.11.0. |
| Admin disputes | Combined payment-dispute and rating-dispute workspace, including Manage admins. Hidden from disconnected and non-admin wallets. |

Clicking **XTM Market** in the top-left corner returns to the Market page. The brand button also supports keyboard navigation.

Admin navigation is an interface convenience; the contract's signer checks enforce authorization. Ordinary buyers retain their own Refunds & disputes page. Sellers start rating disputes from Orders received.

## Browsing and listings

- Fixed item and shipping prices in XTM; USD values are a live reference, not the settlement currency.
- Real community listings appear first. Each added community listing reduces the sample-catalog slots until the examples are displaced.
- An **Items per page** selector below the listings offers 8, 16, 24, 32, or 64 items. The default is 8; the choice is remembered in this browser. Changing it resets pagination to page one. Numbered pages and previous/next controls use the selected size; with the default of 8, a seventeenth displayed item starts page three.
- Category filters, a category directory, seller profiles, and a seller's other-items view.
- Up to eight JPG, PNG, or WebP photos per listing, with browser resizing, removable previews, a cover photo, and gallery controls.
- Listing form includes title/description, category, item price, shipping, stock, and seller account address.
- Example catalog sellers use fictional usernames: `@pixel_trader`, `@orchard_tech`, `@frame_chaser`, `@cinema_corner`, `@pocket_gadgets`, and `@console_cove`. These display-only examples do not reserve on-chain names.
- Example catalog items and sample seller feedback are clearly identified. Catalog items can be previewed but cannot be purchased.
- A required legal-use notice describes prohibited goods, user responsibilities, and limits of recovery and liability.

Listing metadata, photos, inventory display, and local order history are partly browser-local. The project does not yet provide a durable shared catalogue database or full cross-device order-history recovery.

## Wallet-linked seller usernames

Sellers choose a username in **List an item**. The first successful listing transaction reserves it; later listings from the same signing key must reuse it. The connected wallet supplies the payment address in the website form.

- Names are 3–24 ASCII letters, numbers, or underscores, stored in lowercase. Capitalization cannot bypass uniqueness.
- `admin`, `administrator`, `owner`, `support`, `xtm_market`, `tari`, and `ootle` are reserved.
- The contract derives identity from the transaction signing key, never a user-entered wallet address. Each signing key gets one permanent name; there is no rename, transfer, or admin reassignment method.
- Reservation and listing creation occur atomically. Concurrent attempts at the same name must be resolved by contract state; the browser's availability hint is advisory.
- Listing cards, product details, and seller profiles display verified `@username` values. If the registry cannot be read, the website falls back to the wallet address and does not trust a browser-saved username.
- Uniqueness is scoped to this marketplace component, not all of Tari. Accounts sharing a signing key share a username; key recovery, key rotation, and cross-component username migration are not implemented.

The contract appends `seller_usernames` and `username_owners` to state and adds `seller_username` as the final `create_listing` argument. `SELLER_USERNAMES_READY` stays false until the new contract is published, instantiated, and verified. Existing deployed listings and orders are unchanged.

## Checkout and delivery privacy

The Buy action opens a dedicated purchase screen with item details and payment information. The buyer reviews one item plus seller-set shipping before approving a wallet transaction. The checkout has a ten-minute review window; XTM prices remain fixed while USD reference values can change. Network fees are separate, with a maximum transaction fee of 0.005 XTM in the current request flow.

Recipient name is **optional**: buyers may leave it blank or enter **Resident**. Shipping inputs are separated into street address, apartment/unit, city, state/region, postal code, and country, with applicable fields marked optional.

Delivery details are encrypted in the browser for the seller using RSA-OAEP with SHA-256 and a fresh AES-GCM content key. Only the encrypted package accompanies the purchase. Plaintext form values are cleared after payment and are not intentionally persisted as shipping records.

New per-listing private delivery keys are non-extractable CryptoKeys stored in IndexedDB. Legacy private JWKs migrate from localStorage when used; the old private key is deleted only after successful storage. Sellers need the listing browser's key to decrypt delivery details. Clearing site data may lose that access, and a compromised browser can still invoke decryption. This is not a cross-device key-backup system.

Before checkout submits, the app compares the selected listing's title, seller address, price, shipping, encryption key, and availability against fresh component state.

## Escrow lifecycle in v0.11.0

1. **Purchase funds escrow.** The wallet withdraws the full item price plus shipping and passes it to `buy`. The order and escrow deposit complete in the same transaction. Funding does not wait for delivery.
2. **Shipping leaves funds held.** Only the original seller signer can mark an order shipped.
3. **Purchase starts the claim window.** The contract records the consensus epoch at purchase. Owner-recorded delivery is tracking only and cannot reset the clock.
4. **Buyer confirmation releases payment.** The original buyer confirms receipt and supplies a 1–5 star rating and a nonblank comment. Confirmation, review, and release occur atomically.
5. **An eligible timeout claim can release payment.** After 1,008 epochs—approximately 14 days after recorded purchase—the original seller may submit a claim if the order is unsettled and undisputed. Delivery is not required for this claim. The passage of time alone does not move funds.
6. **A dispute pauses settlement.** The buyer can open a dispute before settlement. Buyer confirmation and seller timeout claims are blocked until an authorized admin resolves it.
7. **Resolution selects an original party.** A refund returns the full escrow amount to the recorded buyer refund address. A seller outcome sends the full escrow amount to the recorded seller payment address.

The single private escrow-withdrawal function obtains its amount and destination from the stored order. Admins cannot supply a replacement destination, change the amount, sweep funds, or withdraw to themselves as a third party. An admin can still decide which original party wins a dispute; destination restrictions do not guarantee fair decisions.

The new component uses native `OwnerRule::None` to remove native owner-based template replacement authority. Application ownership remains tied to the constructor signer, with explicit checks inside privileged methods. Future code changes require a new component; existing escrow must not be silently migrated. Protocol behavior and these protections still require live integration verification.

“Original buyer/seller” refers to the addresses recorded in the signed order/listing, not verification of real-world identity. Historical components retain their original settlement and fee rules.

## The 3% marketplace fee

The fee supports app maintenance and future development of Tari. It is calculated from the **item price only**, excluding shipping.

Under v0.11.0, the platform does not receive escrow withdrawals. After a successful sale, the original seller separately approves `pay_marketplace_fee`, supplying a new XTM payment bucket from their wallet. The contract checks the signer, resource, exact fee, completed-sale status, and whether the fee was already paid. Refunded orders owe no fee. Eligible sellers have a **Pay separate 3% fee** action once the security upgrade is active.

For a 100 XTM item with 10 XTM shipping:

| Event | Amount |
|---|---:|
| Buyer deposits into escrow at purchase | 110 XTM |
| Seller receives on successful escrow release | 110 XTM |
| Seller separately approves the platform fee | 3 XTM |
| Buyer receives on a full refund instead | 110 XTM |

Separate fee collection cannot block escrow settlement and is not guaranteed if the seller declines to pay. Older contracts that deduct fees during release are not changed by the new source.

## Refunds and disputes

The buyer-facing page shows eligible unsettled orders, pending cases, and available outcomes. **Request refund** and **Open dispute** both open an on-chain payment dispute for admin review; neither guarantees a refund. Admins choose a full buyer refund or seller payment, with wallet approval required for the decision.

The app refreshes status from allowed marketplace components and disables actions when an order cannot be verified. It does not currently support payment-dispute evidence uploads, a written payment-case submission, a support inbox, partial refunds, return-label handling, automatic appeals, or a guaranteed decision deadline. A settled order cannot be reopened through this contract's dispute flow.

## Seller ratings and review disputes

- One verified 1–5 star rating and nonblank comment per completed, non-refunded order; comments are limited to 500 bytes by the contract.
- Seller profiles show aggregate scores and individual feedback linked to the seller account.
- Buyer receipt confirmation includes the required rating and comment in the release transaction.
- An eligible undisputed timeout claim creates five stars and **Sale Satisfactory** if no buyer review exists. This feedback is labeled automatic.
- Sellers can select **Dispute rating or comment** in Orders received and provide a written reason.
- Admin disputes contains the review queue and **Keep review** / **Remove review** actions.
- Removing a review adjusts the seller's aggregate score. Keeping it closes the dispute without changing the rating.
- A review dispute does not freeze escrow, release payment, or refund a purchase.

The contract also retains a guarded direct-review-removal method for moderation; the combined website queue focuses on disputed reviews.

## Owner and admin permissions

| Action | Authorized signer |
|---|---|
| Add or revoke an admin | Original application owner or an active admin |
| Resolve a payment dispute | Original application owner or an active admin |
| Keep/remove a disputed review | Original application owner or an active admin |
| Record delivery or update a USD reference | Original application owner |
| Confirm receipt or open an order dispute | That order's buyer |
| Mark shipped, claim after timeout, or dispute seller feedback | That listing's seller |
| Pay the separate marketplace fee | Original seller after a completed, non-refunded sale |
| Change an escrow recipient, choose an arbitrary withdrawal amount, or use native owner upgrade authority | No such application capability in v0.11.0 |

**Manage admins** accepts an account component address and its 64-character public signing key. The key grants authority; the account address identifies the admin in the interface. Verify these details with the recipient. Never enter a private key or seed phrase.

Admins can appoint or revoke other admins. The original owner is not a removable admin-list entry. The registry is capped at 32 additional admins, rejects duplicate account/key entries, and emits grant/revoke events. Role data is refreshed, expires in the interface, and fails closed for delegated admins on read errors. Every privileged contract transaction independently checks the signer. A compromised admin can delegate access before being revoked; see the security review for this trust limitation.

## Wallet integration and security changes

- Compatible `window.tari` providers and WalletConnect pairing with Tari Asset Vault.
- A locally bundled Tari Universe bridge restricted to the known `https://universe.tari.mw` parent origin and frame source, with request timeouts.
- WalletConnect 2.23.7 and its seven-module static import graph vendored locally, with provenance hashes in `security/vendor-manifest.json`.
- Esmeralda network-byte check, fresh wallet-account verification, account/session/provider checks, transaction and purchase locks, and tracking of unconfirmed transaction IDs before retry.
- Success requires exact accepted status plus an accepted execution decision. Unknown, rejected, or fee-only outcomes do not count as completed purchases.
- Full-string image-source validation, guarded browser-storage reads, numeric checks, escaped rendered text, bounded review stars, and component-scoped order updates.
- Local application scripts with integrity hashes and a Content Security Policy that allows scripts only from this site.
- Additional security-header configuration in `dist/_headers`; actual header delivery by hosting still needs verification.
- Checked contract arithmetic and counters, release overflow checks, and input/admin bounds.

No wallet private key, seed phrase, or wallet API key is requested by the application. Wallet signing remains external. These measures do not make the application attack-proof or replace an independent audit.

## Validation and known limits

The v0.11.0 update passed 14 Rust unit tests, 58 JavaScript/security regression checks, and a release WASM build. The earlier security review also recorded the dependency and secret-pattern checks below; those scans were not rerun for this documentation update:

- 14 passing Rust unit tests for settlement-party selection, repeated-settlement rejection, full shipping amounts, overflow/zero-price checks, admin signing-key grants/revocation, purchase deadline/overflow checks, username normalization, duplicate rejection, immutable ownership, and invalid/reserved names.
- 58 passing JavaScript/security regression checks, plus a successful import of the vendored WalletConnect graph.
- A successful v0.11.0 WASM release build with overflow checks enabled.
- An OSV query covering 34 locked Rust packages and the direct WalletConnect package with no listed advisories returned at the time of the scan. This did not reconstruct the full transitive npm advisory inventory.
- A limited secret-pattern scan with no matching private-key blocks or token patterns in the checked first-party text files.

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for findings, remediations, evidence, and limitations. Live contract identity/balances, engine rollback and reentrancy behavior, native upgrade denial, real-wallet flows, production headers, and adversarial integration tests remain unverified. Browser data/key recovery, marketplace availability, and dispute fairness also remain explicit limitations.

## Source layout

| Path | Contents |
|---|---|
| `dist/index.html` | Website structure, styling, CSP, and script integrity references |
| `dist/assets/app.js` | Marketplace, wallet, checkout, role, dispute, and order logic |
| `dist/assets/tari-connector.js` | Locally pinned and hardened Universe bridge |
| `dist/assets/vendor/` | Vendored WalletConnect modules and shims |
| `dist/assets/` | Product photography and client assets |
| `dist/_headers` | Static hosting security-header configuration |
| `contracts/xtm_market/src/lib.rs` | Current v0.11.0 Rust contract source |
| `contracts/xtm_market/Cargo.toml` and `Cargo.lock` | Contract dependencies and build configuration |
| `contracts/artifacts/` | Versioned compiled WASM artifacts and checksums |
| `contracts/deployment/esmeralda.json` | Recorded deployment references and pending-upgrade metadata |
| `contracts/deployment/` | Historical instantiate manifests |
| `tests/security.cjs` | JavaScript and source-invariant regression checks |
| `scripts/update-script-integrity.py` | Regenerate HTML integrity hashes after JavaScript changes |
| `security/` | Dependency inventory, OSV results, and vendor provenance |
| `SECURITY_REVIEW.md` | Security audit scope, findings, tests, and activation requirements |

## Local development and verification

The website uses static HTML, CSS, JavaScript, and vendored modules; there is no npm build step. From the repository root:

```bash
python -m http.server 8080 --directory dist
```

Open `http://localhost:8080` to inspect the website. Wallet-host behavior and live transactions require their separate integration environment.

After modifying `app.js` or the wallet bridge:

```bash
python scripts/update-script-integrity.py
node tests/security.cjs
```

Build and test the contract with the appropriate Rust toolchain and WASM target installed:

```bash
cargo test --manifest-path contracts/xtm_market/Cargo.toml
cargo build --release --target wasm32-unknown-unknown --manifest-path contracts/xtm_market/Cargo.toml
```

Unit and source checks do not simulate a full Ootle transaction or prove that a deployed component matches this repository.

## Ootle activation

The next publication target is **v0.11.0**, which incorporates the earlier review and admin work. Historical upgrade instructions are not the current rollout plan.

Artifact: `contracts/artifacts/XTM_Market_SellerUsernames_v0.11.0_Esmeralda.wasm`

SHA-256: `689b7224e5f571bb3b6a71fa83f31558e1c6d8637ed17a915974c2c09299d65d`

1. Publish the reviewed v0.11.0 artifact and instantiate a new component from the intended owner wallet using the XTM resource and intended platform account.
2. Verify the returned template/component, native `OwnerRule::None`, original owner signer, token resource rules, and platform address.
3. Test a small Esmeralda purchase between separate buyer and seller accounts, then buyer release, refund, disputed seller release, purchase-epoch recording, rejection before the 1,008-epoch deadline, eligibility at the deadline without recorded delivery, delivery updates that do not reset the deadline, dispute-blocked timeout claims, separate fee payment, duplicate settlement, revoked-admin rejection, recipient restrictions, and native upgrade denial.
4. Update the verified component configuration in `dist/assets/app.js` and deployment records. Verify duplicate username rejection across different wallets, same-wallet reuse, concurrent reservations, and rollback of a failed listing. Enable `ITEM_PRICE_FEE_READY`, `SECURITY_UPGRADE_READY`, and `SELLER_USERNAMES_READY` only after the matching tests and configuration checks succeed. Refresh script integrity hashes and publish the website update.
5. Preserve the old component addresses for their existing orders. Do not change an order's component ID or silently move outstanding escrow.

The currently configured component reference is `component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9`; its recorded template is `template_19555399f19e664fe251a34b7ef1f470369a54ae33a9d5b1f4dfacaa7c12b3ac`. These are historical/configured references, not fresh verification of the live deployment. `esmeralda.json` also retains older version labels and separate pending-upgrade records; consult its `pending_seller_username_upgrade` section for the v0.11.0 target.

## Update history

| Update | Summary |
|---|---|
| Initial marketplace | Fixed-XTM items/shipping, USD references, wallets, listings/photos, and local order views |
| Escrow | Funding at purchase, shipment/delivery tracking, buyer release, disputes, refunds, and seller timeout claims |
| v0.3–v0.5 | Seller trust, profiles, written feedback, review disputes/moderation, and required review on receipt confirmation |
| v0.6 | Item-price-only 3% fee; historical release-time deduction subsequently superseded in v0.9.0 |
| v0.7 | Automatic five-star **Sale Satisfactory** feedback on eligible undisputed timeout claims |
| Brand navigation | Top-left XTM Market button returns to the Market page with keyboard support |
| Marketplace browsing | Community listings first, samples displaced as listings grow, category/seller browsing, and adjustable 8/16/24/32/64-item pagination |
| Purchase screen | Buy action in product details, dedicated checkout, optional name/Resident, and structured shipping inputs |
| Explanatory pages | Ootle escrow guide, dispute/refund guide, and 3% fee maintenance/Tari-development explanation |
| Escrow wording | Consistent funding-at-purchase wording across checkout, orders, and guides |
| Admin workspace | Payment and rating disputes combined in the admin-only **Admin disputes** page |
| v0.8 | On-chain admin grants/revocations and Manage admins controls |
| v0.9 | Two-party-only escrow, separate seller fee, removed native upgrade authority, browser/wallet hardening, tests, and security report |
| v0.10 | Seller timeout starts at recorded purchase; delivery no longer gates or resets the 1,008-epoch window. Existing deployed orders retain their original rules. |
| v0.11 | Wallet-linked unique seller usernames, atomic first-listing registration, verified profile display, and duplicate/ownership tests |
| Latest notice change | Removed the disputes guide's **Current availability** block without enabling transactions |
| Documentation refresh | Replaced outdated README claims with the current website behavior, source structure, security changes, and activation status |

Compiled historical artifacts are preserved for provenance. Their presence is not evidence that a particular version is deployed or covered by the latest security fixes.

## License

XTM Market is released under the [MIT License](LICENSE). Retain applicable third-party notices when redistributing vendored dependencies.
