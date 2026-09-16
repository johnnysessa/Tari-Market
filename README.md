> Current active contract: v0.12.0. Earlier v0.11 rollout sections below are historical. See My Items at the end and contracts/deployment/esmeralda.json for the active deployment.

# Tari Market

Tari Market is an open-source marketplace prototype for Tari Ootle. All current listings, shipping, escrow payments, marketplace fees and network fees use tTari on Esmeralda testnet. tTari has no monetary value; USD figures are illustrative and use the mainnet XTM reference price. The website includes product browsing, wallet checkout, seller profiles, escrow order management, disputes, and an admin workspace.

**[Open Tari Market](https://xtm-market.johnnytsunami14.chatgpt.site)** · [Security review](SECURITY_REVIEW.md) · [MIT license](LICENSE)

Updated September 15, 2026. Current contract source: **v0.11.0**.

## Current status

The v0.11.0 template is published and its marketplace component is instantiated on **Esmeralda testnet**. The website is open for user-authorized test transactions, with visible testnet labeling. Use test funds and test listings only. This is not production readiness or a completed end-to-end audit.

The live indexer returned `verified: true` for the expected template, native `OwnerRule::None`, owner signing key, XTM resource, platform address, and 15-field component state. Every submission rechecks this configuration. Wallet signing, purchases, refunds, seller claims, and admin flows still need live user testing. Previous components are retained for existing orders; older listings must be recreated for new purchases.

Current component: `component_1bf64f1ee50461e47dba27d7b24326f356f30121f10c16a60eb91c2ced275a9c`.

Template: `template_b10f1ab4c4902241f3e4592b1719ac8059aece55011a4e6f580c61f28ecfb7c2`.

Creation transaction: `e71313961ceac2699aefacf56a4b8eea9afd0e6dbf11362210ecd49e24713b8f`.

## Wallet connection options

**WalletConnect is the default on the public website.** Click **Connect Tari wallet → WalletConnect → Connect wallet** to generate a private pairing link for a compatible Tari Esmeralda wallet. Do not share that link.

| Where you open Tari Market | Default connection | Other options |
|---|---|---|
| Public site in a normal browser | WalletConnect | Local Asset Vault launcher; browser provider if available |
| Inside Tari Universe with its provider available | Tari Universe / browser wallet | WalletConnect and local launcher instructions |
| Local launcher at `http://localhost:5180` | Asset Vault local connection | WalletConnect; browser provider if available |

Asset Vault **v0.40.0 does not expose its WalletConnect button**. Restoring WalletConnect on Tari Market does not enable it inside that wallet. Use the optional local launcher with this Asset Vault version.

**No template or component update is required for these wallet connection changes.** The existing v0.11.0 Esmeralda template and component remain active. Website versions 79–80 added the local launcher and restored WalletConnect as the public default.

## Connect Asset Vault v0.40.0 on your Mac

Asset Vault's v0.40.0 build hides its WalletConnect button; the previous pairing instructions were incorrect for that release. Use the **local Esmeralda launcher** instead. The public site offers the download under **Connect Tari wallet → Asset Vault / local test launcher**. Tari Universe and an explicit WalletConnect option for compatible wallets remain available.

1. Keep walletd running on Esmeralda and sign in at `http://localhost:5100`.
2. In **API Keys** (key icon), create a short-lived `Tari Market Local` key with only `accounts:read`, `transactions:read`, `transaction_requests:create`, and `transaction_requests:read`. Do not grant Admin, direct `transactions:create`, or `transaction_requests:approve`.
3. Download and unzip [the local launcher](https://xtm-market.johnnytsunami14.chatgpt.site/downloads/xtm-market-local.zip). In a second Terminal run `cd "$HOME/Downloads/Tari-Market-Local"`, then `python3 start.py`. Python 3.9+ is required, with no additional packages.
4. Paste the key only into the hidden Terminal prompt. It stays in the launcher's memory, never in browser storage, a file, or the public site.
5. Open `http://localhost:5180`, connect, and create a test listing. Review its request at `http://localhost:5100/transaction-requests`. The daemon requires separate approval before it can be submitted.

The launcher binds only to loopback, rejects foreign hosts/origins, exposes a narrow operation list, checks Esmeralda and the fee cap, resolves inputs before creating the frozen approval request, and blocks duplicate pending requests. It cannot approve requests or directly submit arbitrary transactions. Stop it with Control+C and revoke the test key when done. See [full setup and troubleshooting](scripts/LOCAL-WALLET-START.txt).

**Validation:** seven simulated-wallet integration tests cover approval, rejection, response-loss recovery, input integrity, fee/network checks, request ownership, duplicate blocking, and the HTTP boundary. The existing 66 JavaScript regression checks also pass. This is not yet an end-to-end result with a live Mac wallet. The next check is the user's first listing followed by a test purchase.

The localhost origin has separate listings, orders, photos and delivery-decryption keys from the public site. These are not copied automatically. Cross-device catalog synchronization remains unimplemented. The template and component have not changed for this connection update.

## Latest website updates

The website includes the following recent changes:

- Sellers choose a unique wallet-linked username in the listing form. Registration is available during Esmeralda testing.
- The buy page shows **Seller claim window — 14 days after recorded purchase**. Checkout terms, the escrow guide, dispute timing guidance, and automatic-review explanations use the same purchase-based rule.
- The top-left **Tari Market** button opens the Market page.
- The bottom of the Market page offers **8, 16, 24, 32, 64, or 128 items per page**, remembers the selection in this browser, and returns to page one when changed.
- The **v0.11.0** template is published and its component is instantiated on Esmeralda. The wallet updates do not change either address.
- WalletConnect is the default on the public website; the optional local launcher uses Asset Vault’s separate request approvals.

The new timeout is measured as **1,008 consensus epochs**, approximately 14 days, rather than an exact wall-clock deadline. An undisputed order can become eligible before shipping or delivery is recorded. The seller must submit a claim; payment does not release automatically when the deadline passes. This rule applies to the new testnet component, while existing orders retain their original contract rules.

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

Clicking **Tari Market** in the top-left corner returns to the Market page. The brand button also supports keyboard navigation.

Admin navigation is an interface convenience; the contract's signer checks enforce authorization. Ordinary buyers retain their own Refunds & disputes page. Sellers start rating disputes from Orders received.

## Browsing and listings

- Fixed item and shipping prices in XTM; USD values are a live reference, not the settlement currency.
- Real community listings appear first. Each added community listing reduces the sample-catalog slots until the examples are displaced.
- An **Items per page** selector below the listings offers 8, 16, 24, 32, 64, or 128 items. The default is 8; the choice is remembered in this browser. Changing it resets pagination to page one. Numbered pages and previous/next controls appear only when available listings exceed the selected size. Selecting 128 shows a second page when there are 129 available listings. Page controls use the selected size; with the default of 8, a seventeenth displayed item starts page three.
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

The contract appends `seller_usernames` and `username_owners` to state and adds `seller_username` as the final `create_listing` argument. `SELLER_USERNAMES_READY` is enabled for Esmeralda testing. Existing deployed listings and orders are unchanged.

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

Both the disputes guide and the buyer case page have visible **Request refund** and **Submit dispute** buttons. Buyers connect their purchasing wallet, choose a verified eligible order, review the request, and submit it through their wallet. The order picker explains disconnected, loading, verification-error, and no-eligible-order states.

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

- Tari Universe/browser provider support and explicit WalletConnect selection remain. The public site defaults to WalletConnect again, with the local Asset Vault launcher optional. Inside the local launcher, local connection is selected; inside Universe, the browser provider is selected. Asset Vault v0.40.0 does not expose WalletConnect pairing. Local sessions require one explicit Connect action per account; the same browser then reconnects to that account while the local launcher runs. Disconnect disables reconnect. Changing the default wallet account requires connecting again.
- A locally bundled Tari Universe bridge restricted to the known `https://universe.tari.mw` parent origin and frame source, with request timeouts.
- WalletConnect 2.23.7 and its seven-module static import graph vendored locally, with provenance hashes in `security/vendor-manifest.json`.
- Esmeralda network-byte check, fresh wallet-account verification, account/session/provider checks, transaction and purchase locks, and tracking of unconfirmed transaction IDs before retry.
- Success requires exact accepted status plus an accepted execution decision. Unknown, rejected, or fee-only outcomes do not count as completed purchases.
- Full-string image-source validation, guarded browser-storage reads, numeric checks, escaped rendered text, bounded review stars, and component-scoped order updates.
- Local application scripts with integrity hashes and a Content Security Policy that allows scripts only from this site.
- Additional security-header configuration in `dist/_headers`; actual header delivery by hosting still needs verification.
- Checked contract arithmetic and counters, release overflow checks, and input/admin bounds.

The website never requests a private key, seed phrase or wallet API key. The optional local launcher requests a limited API key in Terminal and keeps it in memory; signing and separate approval remain in Asset Vault. These measures do not make the application attack-proof or replace an independent audit.

## Validation and known limits

The latest connection changes passed 66 JavaScript/security regression checks and seven local-wallet integration tests using a simulated daemon. The contract previously passed 14 Rust unit tests and a v0.11.0 release WASM build. The earlier security review also recorded the dependency and secret-pattern checks below; those scans were not rerun for this documentation update:

- 14 passing Rust unit tests for settlement-party selection, repeated-settlement rejection, full shipping amounts, overflow/zero-price checks, admin signing-key grants/revocation, purchase deadline/overflow checks, username normalization, duplicate rejection, immutable ownership, and invalid/reserved names.
- 66 passing JavaScript/security regression checks. The vendored WalletConnect graph import was also verified previously.
- Seven passing simulated-wallet integration tests, including separate approval, rejection, duplicate prevention, recovery after a lost submission response, and localhost request boundaries.
- A successful v0.11.0 WASM release build with overflow checks enabled.
- An OSV query covering 34 locked Rust packages and the direct WalletConnect package with no listed advisories returned at the time of the scan. This did not reconstruct the full transitive npm advisory inventory.
- A limited secret-pattern scan with no matching private-key blocks or token patterns in the checked first-party text files.

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for findings, remediations, evidence, and limitations. The observed deployment identity was checked as described above. Complete live-wallet flows, engine rollback and reentrancy behavior, adversarial native-upgrade tests, production headers, and broader adversarial integration tests remain unverified. Browser data/key recovery, marketplace availability, and dispute fairness also remain explicit limitations.

## Source layout

| Path | Contents |
|---|---|
| `dist/index.html` | Website structure, styling, CSP, and script integrity references |
| `dist/assets/app.js` | Marketplace, wallet, checkout, role, dispute, and order logic |
| `dist/assets/local-wallet.js` | Browser transport for the optional local launcher |
| `dist/downloads/xtm-market-local.zip` | Downloadable local marketplace and launcher bundle |
| `scripts/local-wallet.py` | Loopback-only connector using separately approved wallet requests |
| `scripts/LOCAL-WALLET-START.txt` | Mac setup instructions and troubleshooting |
| `scripts/package-local-wallet.py` | Rebuild the launcher download from current site files |
| `tests/local-wallet.py` | Simulated-wallet and HTTP-boundary integration tests |
| `dist/assets/tari-connector.js` | Locally pinned and hardened Universe bridge |
| `dist/assets/vendor/` | Vendored WalletConnect modules and shims |
| `dist/assets/` | Product photography and client assets |
| `dist/_headers` | Static hosting security-header configuration |
| `contracts/xtm_market/src/lib.rs` | Current v0.12.0 Rust contract source |
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

After modifying any first-party JavaScript asset, refresh integrity hashes. After changing the local launcher or any bundled site asset, rebuild the download with `python3 scripts/package-local-wallet.py`. Test the local connector with `python3 tests/local-wallet.py`.

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

## Ootle activation checklist (remaining integration checks apply)

**v0.11.0 is published and instantiated.** The checklist below documents rollout verification; transaction scenarios remain to be tested. Historical upgrade instructions are not the current rollout plan.

Artifact: `contracts/artifacts/XTM_Market_SellerUsernames_v0.11.0_Esmeralda.wasm`

SHA-256: `689b7224e5f571bb3b6a71fa83f31558e1c6d8637ed17a915974c2c09299d65d`

1. **Completed:** publish the v0.11.0 template and instantiate the Esmeralda component recorded above. Do not republish it for website-only wallet changes.
2. Verify the returned template/component, native `OwnerRule::None`, original owner signer, token resource rules, and platform address.
3. Test a small Esmeralda purchase between separate buyer and seller accounts, then buyer release, refund, disputed seller release, purchase-epoch recording, rejection before the 1,008-epoch deadline, eligibility at the deadline without recorded delivery, delivery updates that do not reset the deadline, dispute-blocked timeout claims, separate fee payment, duplicate settlement, revoked-admin rejection, recipient restrictions, and native upgrade denial.
4. The current component configuration and testnet readiness flags are already set in `dist/assets/app.js`. Complete live checks of duplicate username rejection across different wallets, same-wallet reuse, concurrent reservations, and rollback of a failed listing. These enabled testnet flags do not certify production readiness.
5. Preserve the old component addresses for their existing orders. Do not change an order's component ID or silently move outstanding escrow.

The current component and template are listed in Current status above and in `contracts/deployment/esmeralda.json`. Historical pending-upgrade entries remain as provenance; their older artifacts are not the active testnet target.

## Update history

| Update | Summary |
|---|---|
| Initial marketplace | Fixed-XTM items/shipping, USD references, wallets, listings/photos, and local order views |
| Escrow | Funding at purchase, shipment/delivery tracking, buyer release, disputes, refunds, and seller timeout claims |
| v0.3–v0.5 | Seller trust, profiles, written feedback, review disputes/moderation, and required review on receipt confirmation |
| v0.6 | Item-price-only 3% fee; historical release-time deduction subsequently superseded in v0.9.0 |
| v0.7 | Automatic five-star **Sale Satisfactory** feedback on eligible undisputed timeout claims |
| Brand navigation | Top-left Tari Market button returns to the Market page with keyboard support |
| Marketplace browsing | Community listings first, samples displaced as listings grow, category/seller browsing, and adjustable 8/16/24/32/64/128-item pagination |
| Purchase screen | Buy action in product details, dedicated checkout, optional name/Resident, and structured shipping inputs |
| Explanatory pages | Ootle escrow guide, dispute/refund guide, and 3% fee maintenance/Tari-development explanation |
| Escrow wording | Consistent funding-at-purchase wording across checkout, orders, and guides |
| Admin workspace | Payment and rating disputes combined in the admin-only **Admin disputes** page |
| v0.8 | On-chain admin grants/revocations and Manage admins controls |
| v0.9 | Two-party-only escrow, separate seller fee, removed native upgrade authority, browser/wallet hardening, tests, and security report |
| v0.10 | Seller timeout starts at recorded purchase; delivery no longer gates or resets the 1,008-epoch window. Existing deployed orders retain their original rules. |
| v0.11 | Wallet-linked unique seller usernames, atomic first-listing registration, verified profile display, and duplicate/ownership tests |
| Latest notice change | Removed the disputes guide's **Current availability** block without enabling transactions |
| Website v79 | Optional local Esmeralda launcher, limited API-key permissions, native Asset Vault approvals, setup download and integration checks |
| Website v80 | WalletConnect restored as the public default; Universe and local connections retained |
| Documentation refresh | Replaced outdated README claims with the current website behavior, source structure, security changes, and activation status |

Compiled historical artifacts are preserved for provenance. Their presence is not evidence that a particular version is deployed or covered by the latest security fixes.

## License

Tari Market is released under the [MIT License](LICENSE). Retain applicable third-party notices when redistributing vendored dependencies.

## Browser test wallet (Esmeralda only)

Choose **Connect Tari wallet → Browser test wallet · Esmeralda**. Create a password
(at least 12 characters), acknowledge test-only use, and connect. The wallet creates
keys locally, then requests the native faucet’s 1,000 test Tari grant (less the
network fee, capped at 0.3 test Tari) after the explicit setup action. No recovery
phrase is requested. Returning users
unlock the same encrypted wallet. Download the encrypted backup from this panel;
restore it in a browser without an existing Tari Market test wallet, using the same
password. There is no server-side password reset. Browser data deletion without a
backup loses access.

All previous options remain: WalletConnect, Tari Universe/browser wallet, and the
Asset Vault/local launcher. The browser wallet uses no SOOON backend or API keys.
It follows the local-key/encrypted-storage pattern inspected on
https://sooon.fun/wallet/ and is independently implemented with Tari's BSD-3-Clause
SDK: https://github.com/tari-project/ootle.ts . SOOON's own repository was not
identified during this implementation.

Implementation: `wallet-browser/wallet.js`; pinned dependencies are recorded in
`wallet-browser/package-lock.json`. Run `npm ci` and `npm run build` in that folder
to rebuild `dist/assets/test-wallet/wallet.js`. WASM runs locally. Storage uses
AES-256-GCM with a PBKDF2-SHA256 key (310,000 iterations), random salt and IV; secrets
and passwords are not sent to the indexer. The wallet locks on disconnect/reload.
Marketplace transactions require confirmation and successful dry-run, with a displayed
maximum fee of 0.3 test Tari. Signed envelopes are saved encrypted before submission
so network retries reuse the identical transaction. The indexer network must be
Esmeralda (38); no mainnet mode is included. Native Esmeralda faucet funding is included. Signed funding requests are saved
encrypted before submission, and pending transactions are resumed on unlock.
Advanced account linking remains optional; ownership is checked against the wallet
public key before connecting.
New wallets automatically create an on-chain account through the native faucet.
The account must be confirmed and ownership checked before it is shown connected.
Existing unfunded browser wallets can complete funding on unlock. No fake balance
is shown if the faucet is unavailable. The default connection method is the
browser test wallet, while other existing methods remain available.

Validation: `node tests/security.cjs`, `node tests/browser-test-wallet.mjs`,
`node tests/browser-wallet-return.cjs`, and `node tests/browser-wallet-funding.mjs`.
A live Esmeralda funding test confirmed an account with 999.997253 test Tari after fees.
After edits to the marketplace scripts, run `python scripts/update-script-integrity.py`
to refresh their required SRI hashes before publishing.

### Local wallet automatic reconnect

Download the updated local launcher and connect Asset Vault once at
`http://localhost:5180`. Only the public account address is remembered in that
browser. Later visits reconnect automatically, with read-only checks every 15
seconds while the page is visible. A temporary wallet/launcher outage can recover
without another Connect click. Restarting the launcher still requires entering
its limited API key in Terminal; no credential is stored in browser storage or
on disk. Disconnect disables reconnect, and switching to a different account
requires a fresh Connect action. Reconnect never creates, approves, retries, or
submits a transaction. Asset Vault's separate approval remains required.

### Returning to the public site with a browser wallet

The public site recognizes an encrypted browser-wallet record and prompts for its
password on return, after any required legal notice is dismissed. A previously
linked account is read from encrypted storage and reconnected after unlock; it
does not need to be pasted again. No password or decrypted key is persisted.
Cancel dismisses the prompt for that visit. Disconnect disables automatic prompts
until the browser wallet is selected again. Explicitly choosing WalletConnect or
Tari Universe preserves that choice instead. The local launcher retains its
existing account reconnect flow. A new browser wallet still needs its own funded
on-chain account for payments; no faucet or automatic transaction is added.

### Connected wallet display

The header and checkout show the registered seller username, or the wallet-provided
account name when available, plus the public spendable tTari balance. Unnamed
accounts use the wallet type as a label. Balance reads use the connected Esmeralda
account and its Tari vaults, refresh every 30 seconds and after transactions, and
show an unavailable state on read errors. Shielded funds and escrow are excluded.
Responses from disconnected or replaced wallets are discarded.

Validation: `node tests/wallet-summary.cjs`.

### My Items — active on v0.12

The owner-signed v0.12 component is verified and activated. My Items lets the original seller edit title, price, shipping, and quantity, or delete a listing. Deletion deactivates it and retains order history; existing escrow is unchanged. The public catalog refreshes on-chain title, prices, inventory, and deletion state every 30 seconds.

Older v0.11 listings show **Relist to enable editing**. The original seller approves this once, from the browser holding that item's delivery decryption key. Local photos/descriptions and the delivery key are preserved. Relisting is not automatic, and old contract listings remain callable directly; the confirmation explains the inventory implications. Existing orders and disputes keep their original component references.

The v0.12 template passed 14 Rust unit tests and isolated live Esmeralda seller edit/delete and unauthorized-wallet rejection scenarios. The UI regression covers relisting guards, duplicate recovery, metadata retention, component-ID collisions and catalog reconciliation. Full buyer-to-seller lifecycle regression testing on v0.12 is still pending.

Current deployment identities and accepted transaction IDs are recorded in `contracts/deployment/esmeralda.json`; rollout notes are in `contracts/deployment/LISTING_MANAGEMENT_ROLLOUT.md`.
