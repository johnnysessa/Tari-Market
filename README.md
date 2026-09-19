> Current active contract: v0.12.0. Earlier v0.11 rollout sections below are historical. See My Items at the end and contracts/deployment/esmeralda.json for the active deployment.

**GitHub repository:** [johnnysessa/Tari-Market](https://github.com/johnnysessa/Tari-Market)

# Tari Market

Tari Market is an open-source marketplace prototype for Tari Ootle. All current listings, shipping, escrow payments, marketplace fees and network fees use tTari on Esmeralda testnet. tTari has no monetary value. Prices are displayed only in tTari. The website includes product browsing, wallet checkout, seller profiles, escrow order management, disputes, and an admin workspace.

**[Open Tari Market](https://tari-market.johnnytsunami14.chatgpt.site)** · [Security review](SECURITY_REVIEW.md) · [AGPL-3.0 license](LICENSE)

Updated September 17, 2026. Current contract source: **v0.12.0**.

## Current status

The v0.12.0 marketplace is instantiated on **Esmeralda testnet**. Use test funds and test listings only. This remains a prototype, not a completed end-to-end audit.

Public visitors use their wallet connection: **no email or ChatGPT sign-in, launcher download, Terminal, or local web server is required with a compatible wallet**. An existing wallet must support Tari Esmeralda WalletConnect or the available Tari browser provider. Asset Vault v0.40.0 has a separate optional developer workflow below.

Current component: `component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938`.

Template: `template_ec7cb232c66177d465285ac5c45f3e3fd8fdca0c4382c3173f85267ab7ca476a`.

Creation transaction: `201ff42a769e7592b876712a4f5cfba2f86026a87f3720a718d43bde8a13837e`.

The application checks the expected contract identity before transactions. The September 17 fee-recipient read returned the configured account but `verified: false`; this is not a fresh verified on-chain confirmation. Network verification failures must not be treated as successful payments or proof of readiness.

## Access from another device

Connect the **same wallet account** on the public site to find its on-chain listings and recover buyer/seller order history from verified network responses. Wallet switches are checked during recovery, and recovered orders are filtered by wallet. Older components remain referenced for their existing orders.

Shipping-decryption keys intentionally remain in the **original browser**. Sellers need that browser to read encrypted shipping information and authorize shared-photo changes for those listings. Connecting the same wallet on another device does not recover these keys. No cloud key vault, email login, or ChatGPT login is implemented. The optional browser test wallet is also device-local; it is not automatic cross-device wallet recovery.

## Wallet connection options

**WalletConnect is the default on the public website.** Click **Connect Tari wallet → WalletConnect → Connect wallet** to generate a private pairing link for a compatible Tari Esmeralda wallet. Do not share that link.

| Where you open Tari Market | Default connection | Other options |
|---|---|---|
| Public site in a normal browser | WalletConnect for new visitors | Available browser provider; optional device-local browser test wallet |
| Inside Tari Universe with its provider available | Tari Universe / browser wallet | WalletConnect; optional device-local browser test wallet |
| Local launcher at `http://localhost:5180` | Asset Vault local connection | WalletConnect; browser provider if available |

Asset Vault **v0.40.0 does not expose its WalletConnect button**. Restoring WalletConnect on Tari Market does not enable it inside that wallet. Use the optional local launcher with this Asset Vault version.

**No template or component update is required for these wallet connection changes.** The existing v0.12.0 Esmeralda template and component remain active. A saved browser wallet may retain its unlock flow.

## Connect Asset Vault v0.40.0 on your Mac

Asset Vault's v0.40.0 build hides its WalletConnect button; the previous pairing instructions were incorrect for that release. Use the **local Esmeralda launcher** instead. This is an optional developer/owner workflow; the local option is hidden from public visitors unless a local launcher is available. Tari Universe and an explicit WalletConnect option for compatible wallets remain available.

1. Keep walletd running on Esmeralda and sign in at `http://localhost:5100`.
2. In **API Keys** (key icon), create a short-lived `Tari Market Local` key with only `accounts:read`, `transactions:read`, `transaction_requests:create`, and `transaction_requests:read`. Do not grant Admin, direct `transactions:create`, or `transaction_requests:approve`.
3. Download and unzip [the local launcher](https://tari-market.johnnytsunami14.chatgpt.site/downloads/xtm-market-local.zip). In a second Terminal run `cd "$HOME/Downloads/Tari-Market-Local"`, then `python3 start.py`. Python 3.9+ is required, with no additional packages.
4. Paste the key only into the hidden Terminal prompt. It stays in the launcher's memory, never in browser storage, a file, or the public site.
5. Open `http://localhost:5180`, connect, and create a test listing. Review its request at `http://localhost:5100/transaction-requests`. The daemon requires separate approval before it can be submitted.

The launcher binds only to loopback, rejects foreign hosts/origins, exposes a narrow operation list, checks Esmeralda and the fee cap, resolves inputs before creating the frozen approval request, and blocks duplicate pending requests. It cannot approve requests or directly submit arbitrary transactions. Stop it with Control+C and revoke the test key when done. See [full setup and troubleshooting](scripts/LOCAL-WALLET-START.txt).

**Validation:** seven simulated-wallet integration tests cover approval, rejection, response-loss recovery, input integrity, fee/network checks, request ownership, duplicate blocking, and the HTTP boundary. The existing 66 JavaScript regression checks also pass. This is not yet an end-to-end result with a live Mac wallet. The next check is the user's first listing followed by a test purchase.

The localhost origin retains separate local orders and delivery-decryption keys. Updated public and localhost clients share listing photos and descriptions through the hosted media service; eligible originals are recovered automatically from their original browser. Historical wallet-only updates did not change the template or component.

## Latest website updates

The website includes the following recent changes:

- Sellers choose a unique wallet-linked username in the listing form. Registration is available during Esmeralda testing.
- The buy page shows **Seller claim window — 14 days after recorded purchase**. Checkout terms, the escrow guide, dispute timing guidance, and automatic-review explanations use the same purchase-based rule.
- The top-left **Tari Market** button opens the Market page.
- The bottom of the Market page offers **8, 16, 24, 32, 64, or 128 items per page**, remembers the selection in this browser, and returns to page one when changed.
- The **v0.12.0** template is published and its component is instantiated on Esmeralda. The wallet updates do not change either address.
- WalletConnect is the default on the public website; the optional local launcher uses Asset Vault’s separate request approvals.

The new timeout is measured as **1,008 consensus epochs**, approximately 14 days, rather than an exact wall-clock deadline. An undisputed order can become eligible before shipping or delivery is recorded. The seller must submit a claim; payment does not release automatically when the deadline passes. This rule applies to the new testnet component, while existing orders retain their original contract rules.

## Website pages and navigation

| Page or view | Purpose |
|---|---|
| Market | Browse items, view prices and stock, and open product details or checkout. |
| Categories | Browse grouped categories and filter listings. |
| Product details | View the photo gallery, full description, pricing, seller profile, other seller items, and Buy action. |
| Checkout | Review one item, shipping, tTari total, condition, seller address, delivery details, and escrow terms before wallet approval. |
| Recent orders | Recover purchases for the connected wallet from verified network state and show available buyer actions. |
| Orders received | View sales for the connected seller wallet, decrypt delivery details on the listing device, update shipping, view feedback, dispute reviews, and access eligible seller actions. |
| Refunds & disputes | Start an eligible buyer refund request/payment dispute and follow its status and verdict. |
| Disputes & refunds guide | Explain payment disputes, refund outcomes, seller payouts, timing, and limitations. |
| Ootle escrow | Explain funding at purchase, shipping, delivery recording, receipt confirmation, timeout claims, and refunds. |
| 3% fee | Explain app-maintenance and future Tari-development funding, the item-price-only calculation, and separate seller payment under v0.12.0. |
| Admin disputes | Combined payment-dispute and rating-dispute workspace, including Manage admins. Hidden from disconnected and non-admin wallets. |

Clicking **Tari Market** in the top-left corner returns to the Market page. The brand button also supports keyboard navigation.

Admin navigation is an interface convenience; the contract's signer checks enforce authorization. Ordinary buyers retain their own Refunds & disputes page. Sellers start rating disputes from Orders received.

## Browsing and listings

- Fixed item and shipping prices displayed only in tTari.
- Real community listings appear first. Each added community listing reduces the sample-catalog slots until the examples are displaced.
- An **Items per page** selector below the listings offers 8, 16, 24, 32, 64, or 128 items. The default is 8; the choice is remembered in this browser. Changing it resets pagination to page one. Numbered pages and previous/next controls appear only when available listings exceed the selected size. Selecting 128 shows a second page when there are 129 available listings. Page controls use the selected size; with the default of 8, a seventeenth displayed item starts page three.
- Category filters, a category directory, seller profiles, and a seller's other-items view.
- Up to eight JPG, PNG, or WebP photos per listing, with browser resizing, removable previews, a cover photo, and gallery controls.
- Listing form includes title/description, category, required condition, item price, shipping, stock, and seller account address.
- Example catalog sellers use fictional usernames: `@pixel_trader`, `@orchard_tech`, `@frame_chaser`, `@cinema_corner`, `@pocket_gadgets`, and `@console_cove`. These display-only examples do not reserve on-chain names.
- Example catalog items and sample seller feedback are clearly identified. Catalog items can be previewed but cannot be purchased.
- A required legal-use notice describes prohibited goods, user responsibilities, and limits of recovery and liability.

Listing photos and descriptions now use shared object storage after a successful upload. Chain inventory remains authoritative. Browser-local originals are retained for recovery. Local order history and private delivery keys still require the original browser; full cross-device order-history recovery is not implemented.

### Item condition

Sellers must choose **New, Like New, Open Box, Refurbished, Used, For Parts or Not Working, or Other**. The condition appears on listing cards, product details, and the purchase screen. Existing listings without a condition show **Not specified**.

Condition, description, and category are shared through the authenticated listing-media service, including listings with no photos. A failed metadata upload is reported separately from a successful on-chain listing; use **My Items → Recover saved details & photos** to retry from the original browser. No template or component update is needed for this field.

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

The Buy action opens a dedicated purchase screen with item details and payment information. The buyer reviews one item plus seller-set shipping before approving a wallet transaction. The checkout has a ten-minute review window; XTM prices remain fixed while USD reference values can change. Network fees are separate, with a maximum transaction fee of 0.05 tTari in the current request flow.

Recipient name is **optional**: buyers may leave it blank or enter **Resident**. Shipping inputs are separated into street address, apartment/unit, city, state/region, postal code, and country, with applicable fields marked optional.

Delivery details are encrypted in the browser for the seller using RSA-OAEP with SHA-256 and a fresh AES-GCM content key. Only the encrypted package accompanies the purchase. Plaintext form values are cleared after payment and are not intentionally persisted as shipping records.

New per-listing private delivery keys are non-extractable CryptoKeys stored in IndexedDB. Legacy private JWKs migrate from localStorage when used; the old private key is deleted only after successful storage. Sellers need the listing browser's key to decrypt delivery details. Clearing site data may lose that access, and a compromised browser can still invoke decryption. This is not a cross-device key-backup system.

Before checkout submits, the app compares the selected listing's title, seller address, price, shipping, encryption key, and availability against fresh component state.

## Escrow lifecycle in v0.12.0

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

Under v0.12.0, the platform does not receive escrow withdrawals. After a successful sale, the original seller separately approves `pay_marketplace_fee`, supplying a new tTari payment bucket from their wallet. The contract checks the signer, resource, exact fee, completed-sale status, and whether the fee was already paid. Refunded orders owe no fee. Eligible sellers have a **Pay separate 3% fee** action after a completed, non-refunded sale.

Configured fee recipient (owner account):
`component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c`.
This is an account component, not a signer public key. The fee is **separately seller-approved**, not automatically withheld from escrow.

For a 100 tTari item with 10 tTari shipping:

| Event | Amount |
|---|---:|
| Buyer deposits into escrow at purchase | 110 tTari |
| Seller receives on successful escrow release | 110 tTari |
| Seller separately approves the platform fee | 3 tTari |
| Buyer receives on a full refund instead | 110 tTari |

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

## Historical v0.11 activation checklist

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

Tari Market is released under [GNU AGPL v3 only](LICENSE) (SPDX: `AGPL-3.0-only`) beginning with the September 19, 2026 licensing-change commit. See [licensing and legacy MIT notices](LICENSING.md). Earlier MIT releases and third-party license notices remain valid.

## Browser test wallet (Esmeralda only)

Optional, device-local mode: choose **Connect Tari wallet → Browser test wallet · this device**. Create a password
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
is shown if the faucet is unavailable. New public visitors default to WalletConnect (or an available provider); saved browser-wallet users keep their unlock flow. The launcher connection is shown only where the launcher is available.

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

## Owner post removal

**Remove posts** appears when the original configured owner account is connected.
The owner can review current and previous marketplace listings, enter a public reason,
and approve **Remove post** in the wallet. **Restore post** reverses a mistaken removal.
Delegated dispute admins do not receive this separate owner-only permission.

Removal is a shared, owner-signed on-chain visibility registry, not local browser
storage. Updated public and local Tari Market clients read it on startup, every
30 seconds, and before checkout. They hide removed listings and block checkout when
moderation cannot be verified. The exact registry template, owner signing key, and
native `OwnerRule::None` are verified before trusting its state. Each change checks
the original owner's transaction signing key inside the contract.

This does not erase immutable listing records or prevent transactions sent directly
to the original marketplace contract, including through old clients. Existing
orders, escrow balances, refunds, and seller-owned listing records are unchanged.
Removal reasons are public; do not include private customer information.

The separate registry is deployed on Esmeralda; identifiers, artifact hash, and
accepted publication/creation receipts are recorded in
`contracts/deployment/post-moderation.json`. Its deployer receives no moderation
rights. It has no vaults, transfers, ownership reassignment, or marketplace upgrade
capability. No replacement marketplace component or listing migration is required.
The WASM artifact and Rust source are included in this repository.

For the local launcher, download the updated ZIP, stop only the launcher, replace
its extracted folder, and run `python3 start.py` again with the same limited API-key
permissions. Keep walletd running. Reload `http://localhost:5180` and connect the
owner account. Existing installations do not update automatically.

Validation: six Rust permission/input tests, frontend removal/restoration and
checkout-guard tests, existing seller-listing tests, and 67 security checks passed.
A live Esmeralda attempt by the disposable deploying wallet was rejected by the
owner check and left the registry empty. No user listing was removed during testing.
The first owner-approved live removal still requires the owner's wallet approval.

### Asset Vault signing-account check

Transaction submission now reads `component_address` before Asset Vault's separate
`address` field, matching login and reconnect. Unsupported or malformed identities
still fail closed, and an actual change of signing account still stops submission.
Regression coverage: `node tests/signing-account.cjs` plus existing wallet reconnect,
post moderation, and security checks. Local users need the refreshed launcher bundle.


## Shared listing photos

New listing creation uploads condition, description, category, and any photos to the shared media service after the listing
transaction succeeds. Photos are optional. Public and localhost clients fetch the same saved image URLs
and descriptions. **My Items → Manage photos** lets sellers share saved originals or
upload replacements. A failed photo upload is reported separately from successful
listing publication, so users can retry without creating a duplicate listing.

Existing data-URL originals remain in browser storage. When their original browser
opens the updated site, recovery checks for missing shared metadata and uploads only
when it holds that listing's private delivery key. Recovery does not require a wallet
transaction or export a private key. Connecting a wallet on a new device does not
recover that private key. If original photos are gone they must be selected again;
if the original listing key is also gone, the current contract requires a new listing.
No original image is claimed to have been recovered until an upload succeeds.

The Worker stores image bytes and manifests in Sites-managed R2 (`BUCKET`). Uploads
require proof of possession of the RSA private key whose public key is recorded in
the verified marketplace listing. The server encrypts a fresh random challenge to
that public key. A short-lived HMAC ticket binds the proof to the listing, exact
content digest, expiry, and current manifest ETag. The browser decrypts the challenge
locally; keys and shipping data are never uploaded. Conditional writes prevent old
or concurrent tickets from overwriting a newer manifest. CORS permits only the
published site and local launcher origins. Read endpoints are intentionally public.
Only bounded PNG/JPEG/WebP uploads are accepted; no SVG or executable content.

No blockchain template/component upgrade is needed. The added server-side runtime
secret `MEDIA_UPLOAD_SECRET` is managed through Sites, never committed or sent to
the browser. `npm run build` emits a dependency-free Worker with the existing static
assets embedded; the local launcher remains a self-contained static client calling
the same shared media API. Run the Sites build helper for deployment.

Validation: `node tests/shared-media.mjs` checks valid uploads, private-key proof,
content tampering, independent-client photo reads, exact bytes, safe retries,
concurrent updates, replay, type validation, origins, chain identity, and storage
failures. `node tests/shared-media-client.cjs` checks recovery without wallet login,
original preservation, deduplication, listing binding and URL validation. Existing
wallet, listing management, moderation and security checks remain in place.

## September 17 validation

The condition and wallet-only access updates passed:
- `node tests/security.cjs` — 67 checks.
- `node tests/listing-management.cjs`.
- `node tests/shared-media.mjs` and `node tests/shared-media-client.cjs` — condition persistence without photos, tamper rejection, and legacy payload compatibility.
- `node tests/browser-wallet-return.cjs`.
- `node tests/wallet-order-history.cjs` — recovery from an empty order history, wallet isolation, wallet-switch races, deduplication, and status updates.

The hosted Worker and optional local ZIP were rebuilt. These checks do not constitute a live, two-device wallet checkout test. Existing shipping keys remain browser-bound by design.

### Buyer condition and pricing display

Condition is displayed on listing cards, item details, the purchase item, and the escrow checkout summary. Legacy items without saved condition show **Not specified**. Illustrative USD amounts have been removed from buyer views and order history; the contract’s existing internal reference fields are retained for compatibility. No template or component replacement is required.


## Browser-provider checkout recovery (PR #2)

Includes the transaction-result parsing contributed by chironbuilds in PR #2, with
additional compatibility and recovery protections. Indexer Finalized/Commit/Accept
responses now confirm successfully; aborted and fee-only transactions are rejected.

Providers with the transaction-request API use bounded create/read/submit calls.
Only status reads are retried automatically. Public request IDs are saved in the
browser before submission; a retry or reload checks the same request instead of
creating another purchase. A timed-out request does not keep polling or initiate a
later submission. Late responses may save the original request or transaction ID.
A previously approved request must be finished or rejected in the wallet.
Request-only providers retain their original submission method with a timeout and
a persistent guard against duplicate submissions.

If the wallet loses a creation/submission response without returning an ID, the
site cannot safely determine the outcome: it blocks further submissions from that
account until the request is reconciled. Do not clear browser storage to bypass
this protection; check wallet Requests and Transactions. Browser storage and tab
locks cannot prevent transactions initiated on another device or directly in a wallet.

The maximum network fee is 0.05 tTari for provider, WalletConnect and local Asset
Vault transactions, consistently displayed and enforced by the updated launcher.
The optional browser test wallet retains its existing 0.3 tTari cap. These are caps,
not estimates or guaranteed costs. No marketplace template/component update is needed.

The ZIP must be downloaded again to update an existing local installation. Keep
walletd running, stop only the old marketplace launcher, and start the new launcher.
Use the same browser at http://localhost:5180 to retain local delivery keys.

Validation: provider transaction regression checks cover indexer envelopes,
request-only providers, lost responses, delayed approval, reload recovery, late
responses, and duplicate blocking; local-wallet tests use a simulated Asset Vault.
Fresh live browser-extension and Mac Asset Vault listing/checkout confirmation
remains required. No user wallet transactions were sent during these tests.


## Buyer account check (issue #1)

Credit: [chironbuilds](https://github.com/chironbuilds) reported and reproduced both the insufficient checkout fee cap and the uninitialized buyer-account failure in [issue #1](https://github.com/johnnysessa/Tari-Market/issues/1). Their findings led to these fixes; they also contributed the transaction-confirmation fix in [PR #2](https://github.com/johnnysessa/Tari-Market/pull/2).

Before checkout requests wallet approval, it checks the connected buyer's account
against the Esmeralda indexer with a fresh network lookup. A missing account stops
checkout and asks the buyer to initialize and fund it with test Tari in their wallet,
wait for confirmation, and retry. Indexer outages, unverified or malformed responses
also stop checkout, with a separate verification-error message. No account creation
or funding transaction is initiated by this check. Wallet changes during the lookup
stop checkout. The error remains beside the payment button.

This checks account existence, not sufficient balance or guaranteed transaction
success. Tests: `node tests/buyer-account.cjs` covers ten account/checkout scenarios;
the existing provider and security regression checks pass. Live wallet testing is
still needed. Existing local installations must download the rebuilt launcher ZIP.


### Sample catalog replacement

Each visible, in-stock community listing replaces exactly one of the six sample
items. Sold-out, deleted, and moderated listings do not consume sample slots. Real
listings appear first; sample counts are calculated before category filtering and
pagination. Checked by `node tests/sample-catalog.cjs`.


### Stock synchronization and seller checkout

Cached community listings stay hidden until their stock is verified. Refreshing
updates every cached copy of each on-chain listing, including migrated duplicates;
sold-out items leave the available catalog. An unavailable legacy marketplace no
longer prevents current listings from syncing. Browser-local photos and delivery
keys are preserved.

The connected seller sees **Your listing** with buying disabled on cards, open
product details and checkout. Checkout also rejects the seller account before
submission. This is a website guard; it does not change the deployed contract.
Tests: `node tests/stock-and-owner.cjs` plus listing, catalog, buyer-account and
security regression checks. Download the rebuilt ZIP for existing local installs.


### Receipt confirmation feedback and recovery

The receipt/review dialog now shows progress and errors inside the dialog and
disables repeated submission while processing. It verifies buyer ownership and
order status before requesting release. Successful confirmation immediately closes
the dialog and refreshes the displayed order. A lost wallet response triggers a
read-only order refresh: verified settled orders are reflected without sending
another transaction. Pending/unknown outcomes remain visible with instructions to
check the wallet. Reconciliation reports settlement without claiming a review was
posted when its transaction response is unavailable.

Validation: `node tests/receipt-confirmation.cjs`, provider transaction checks and
security checks. Live user-wallet confirmation remains to be checked. Existing
local users must download the refreshed launcher.


## Receipt-release dependency fix (September 17)

The failed receipt transaction `898a5c542bee5c54c5bb5eef6c93f68117857ace991ed02ff6e25bc0d9472109`
called `confirm_receipt_and_review` for current-market order #5. Its input list included the seller component
but omitted the seller's existing vault. The finalized result was `AcceptFeeRejectRest`: 0.002550 tTari
in network fees, with the receipt/release operation rejected. This transaction did not release escrow.

The local Asset Vault connector now repeats read-only input detection until the dependency set stabilizes,
so indirect recipient accounts also contribute their vaults. Traversal is bounded and cannot change the
reviewed instructions. Before creating an approval request, the connector calls walletd's
`transactions.submit_dry_run` using the exact resolved inputs and rejects failed, unknown, or over-budget
simulations. This endpoint signs a simulation but does not finalize a transaction or charge a fee;
it is authorized by the existing `transactions:read` scope in walletd v0.40. No new API-key permissions
are needed. Real submission still requires the user's separate Asset Vault approval.

Ten simulated-wallet tests cover the dependency chain, exact simulated/request input equality,
failed simulation, fee cap, bounded traversal, separate approval, response loss, and prior safeguards.
These tests do not establish a successful live payout. Simulation cannot guarantee acceptance if chain
state changes before approval. The new preflight applies to the local Asset Vault connector; other
wallet transports retain their own validation. Download the updated local bundle and restart its launcher.

Upstream references: [v0.40 input resolver](https://github.com/tari-project/tari-ootle/blob/v0.40.0/crates/wallet/sdk/src/apis/substate.rs)
and [detection and dry-run handlers](https://github.com/tari-project/tari-ootle/blob/v0.40.0/applications/tari_walletd/src/handlers/transaction.rs).


## Faster local listing preparation

For a single `create_listing` call on the current v0.12 marketplace, the local launcher now
runs input detection once instead of expanding all indirectly referenced accounts to a stable set.
The contract only records the listing; it does not pay a recipient. The exact prepared transaction
must still pass the no-fee simulation and fee-cap check before the separate approval request is
created. Payment releases, refunds, other contracts, and mixed instruction batches retain full
dependency expansion. This reduces preparation work, not testnet consensus time; no live timing
improvement has been measured yet. Thirteen simulated-wallet tests pass, including the listing
shortcut and the original missing-recipient-vault regression.

The user confirmed a successful receipt release with the previous vault-resolution fix on
September 17. This is one reported end-to-end result, not validation of every payment path.


### September 19, 2026 — local wallet fee fix

Raised the provider, WalletConnect and local Asset Vault network-fee cap to 0.05 tTari. A listing estimate of 20,060 atomic units exceeded the previous 20,000 cap; the new cap is 50,000. Browser test wallets retain their existing 0.3 tTari cap. Simulation, fee validation and explicit wallet approval remain required. Error messages now include the fee estimate and retain the end of simulation rejection details. Existing local installations must update their launcher and site assets together, restart the launcher, and refresh the browser.

## My Profile

Open **My Profile** (or `#my-profile`) after connecting your seller wallet. The profile groups active listings, delisted listings, seller rating and buyer comments, review-dispute status and moderator decisions, and completed sales. Completed sales are verified settled orders excluding refunds; order history includes supported earlier marketplace components. Current-marketplace reviews can be disputed by the original seller with a written reason and wallet approval. Delisting uses `cancel_listing`, prevents new purchases, and leaves existing orders and escrow intact. Earlier listings retain the existing relisting flow before editing or delisting. Refund/payment disputes and fulfillment remain available through the profile’s links. Failed history refreshes are marked as incomplete, and another wallet’s profile data is cleared on disconnect or switching.

The public website is updated when deployed. Existing local launcher folders do not auto-update; install the refreshed download to get My Profile locally. The 0.05 tTari local/provider fee cap and explicit wallet approval remain in place.
