# XTM Market — public security summary

Updated September 15, 2026. Contract source: **v0.11.0**. Website: **version 78**.

## Current status

XTM Market is open for **Esmeralda testnet trials using test funds and test listings**. This summary describes implemented protections, recorded checks, and remaining limitations. It is not an independent audit, production certification, or a guarantee against attacks.

The v0.11.0 template has been published and a new marketplace component instantiated. Accepted wallet transaction exports and a live indexer response confirmed the expected template, component configuration, application owner signing key, resource, platform address, and state layout. The indexer reported `verified: true`, and the component has native `OwnerRule::None`.

- Template: `template_b10f1ab4c4902241f3e4592b1719ac8059aece55011a4e6f580c61f28ecfb7c2`
- Component: `component_1bf64f1ee50461e47dba27d7b24326f356f30121f10c16a60eb91c2ced275a9c`
- Creation transaction: `e71313961ceac2699aefacf56a4b8eea9afd0e6dbf11362210ecd49e24713b8f`

The published binary was optimized by the wallet and has not been proven byte-identical to the local artifact. Component creation is confirmed; complete website-driven listing, purchase, refund, and settlement flows remain to be validated with real testnet wallets. Readiness flags permit these trials, not real-money deployment. Checks of deployed state describe the observation at the time, not continuous independent monitoring.

## Implemented protections

### Escrow and fees

The full item price and shipping payment enter escrow at purchase. Settlement obtains its amount and destination from the stored order, paying the original seller payment address or refunding the original buyer refund address. The application offers no arbitrary recipient selection, escrow sweep, or escrow migration method. Settlement state is updated before the recipient call.

The native owner rule is None. Application ownership and delegated admin permissions are enforced through signing-key checks. Admins decide payment and review disputes but cannot choose an unrelated escrow recipient. This does not guarantee fair dispute decisions.

The seller separately authorizes the 3% item-price fee from a fresh payment bucket after a completed sale. The fee does not access escrow and is not guaranteed if the seller declines to pay. Shipping is excluded from the fee.

Existing orders remain governed by their original deployed components. New source code does not retroactively change old escrow protections.

### Timing and seller identity

The seller timeout is 1,008 consensus epochs, approximately 14 days after recorded purchase. Shipping or delivery need not be recorded for an eligible claim. An open payment dispute blocks the timeout claim, and time alone does not transfer funds. Buyers must raise payment disputes before settlement.

Usernames are reserved atomically with the first listing and are tied to the transaction signing key. Names are case-insensitive, bounded, and unique within this marketplace component. There is no username transfer, rename, or admin reassignment method. Accounts sharing a signing key share an identity; usernames do not establish real-world identity.

### Website and wallet handling

- Both the embedded Tari Universe wallet and WalletConnect/Tari Asset Vault are supported. An unavailable Universe bridge is skipped in standalone browsers.
- The Universe bridge checks its parent origin and message source. Scripts and wallet dependencies are stored with the site, with integrity/provenance hashes and a restrictive script policy.
- Transaction handling checks the wallet, network, account, and accepted execution result; submissions are serialized and unconfirmed transaction IDs are tracked.
- Before submission, the app rechecks the current component configuration. Checkout compares listing details with fresh contract state, and old listing IDs cannot be reused against the new component.
- Rendering and browser storage use input validation, escaping, bounded data, and guarded reads. Contract arithmetic and input sizes are checked.
- Shipping information is encrypted in the browser for the seller. New delivery keys are non-extractable browser CryptoKeys; legacy keys migrate when used.

## Validation recorded

- **14 Rust unit tests** passed for settlement helpers, amounts, admin signing keys, purchase deadlines, and username rules.
- The **v0.11.0 WASM release build** succeeded with overflow checks. Versioned artifacts and checksums are retained in `contracts/artifacts/`.
- **66 JavaScript/security regression checks** passed after the dual-wallet connection fix. They include provider routing, bridge message boundaries, storage and rendering validation, transaction classification, username display, and script integrity.
- Targeted local checks exercised pagination boundaries, dispute-order eligibility, receipt decoding, and rejection of an unexpected component configuration.
- An earlier dependency advisory query covered 34 locked Rust packages and the direct WalletConnect package, with no listed advisories returned at that time. This was not a full transitive dependency audit or a fresh scan for every website change.
- An earlier limited secret-pattern scan found no matching private-key blocks or token patterns in the checked first-party files. This is not exhaustive secret detection.

Local tests and source inspection do not simulate all Ootle engine behavior or prove successful browser-to-wallet transactions.

## Remaining limits and testing

Before any production use, obtain independent review and validate complete multi-wallet transaction flows, concurrent operations, failed-recipient rollback, unauthorized action rejection, native upgrade restrictions, and settlement behavior on the target engine version.

The project relies on wallet security, the indexer, network consensus, token rules, hosting, and repository access controls. These dependencies have not received a comprehensive audit as part of this work. WalletConnect's complete dependency tree and production response-header delivery also require further verification.

Admins can delegate privileges and decide disputed outcomes. Role management and recipient restrictions do not eliminate administrative trust or biased decisions.

Listings, photos, and some order information remain browser-local. There is no durable shared catalogue, complete cross-device recovery, delivery-key backup, or key-rotation flow. Clearing browser data can lose decryption access. Encryption protects delivery content, not public marketplace metadata or a compromised device.

Availability/load testing, payment-case evidence uploads, automatic appeals, and guaranteed resolution times are not provided. Settled orders cannot be reopened by the contract's dispute flow.

## Maintenance and reporting

After JavaScript changes, regenerate script integrity hashes and run the regression checks before publishing. Contract changes require a new component and a reviewed transition that preserves existing orders.

Report suspected issues privately to the repository owner first when reproduction details could put users at risk. Do not post credentials, private keys, seed phrases, private delivery information, or actionable exploit instructions in public issues. Public updates should describe impact, fixes, validation, and remaining limitations without exposing sensitive material.
