# Listing management v0.12 rollout

The v0.12 component is now active. The owner-signed instantiation was accepted and independently verified on 2026-09-16. Transaction: 201ff42a769e7592b876712a4f5cfba2f86026a87f3720a718d43bde8a13837e.

My Items supports seller edit/delete and explicit relisting from v0.11. Relisting requires the original account signer and locally available delivery decryption key. Existing orders retain their original component. Original v0.11 listings remain callable directly; sellers are warned before relisting. Images/descriptions remain browser-local.

## Completed verification

- Rust unit tests: 14 passed; release WASM compiled with the locked dependencies.
- Disposable-wallet live smoke test: instantiate, create listing, seller edit, seller delete.
- A different signer was rejected for both edit and delete; editing a deleted item was rejected.
- State inspection confirmed updated title, USD reference, tTari price and inventory; deletion retained the record and changed active=false and inventory=0.
- Public transaction IDs and artifact SHA-256 are in esmeralda.json. The QA component must never be configured as the marketplace.
- Existing-order lifecycle regression scenarios were not rerun in this smoke test.

## Owner transaction — completed (historical instructions)

Run XTM_Market_ListingManagement_v0.12.0_Esmeralda_instantiate.tm in the Esmeralda wallet that owns the current marketplace. The required signer is:

d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828

The constructor records its transaction signer as marketplace owner. This is why the production instance cannot be created with the disposable QA wallet. Keep the original platform payment component in the supplied manifest. Approve the network fee in the wallet and provide the accepted transaction ID and new component address. No recovery phrase is needed. The template is already published; do not publish it again.

## Activation checklist (implemented; seller relisting is user initiated)

1. Query the new component from the indexer and require verified=true, the v0.12 template hash, owner_rule=None, original owner signer, original platform payout component and TARI resource.
2. Snapshot the old component's listings, username reservations, and order references. Preserve each listing's old component plus ID; IDs can collide between components.
3. Add the new verified component to the trusted set. Keep every existing component trusted for its existing orders and escrow. Do not rewrite historical order references or move funds.
4. Provide seller-approved relisting from the old listing details. Preserve title, price, shipping, delivery public key, payment account and off-chain images/descriptions; read remaining stock again immediately before signing. The original seller signs create_listing on the new component and reserves their username there. Username uniqueness does not span components; resolve any conflict before activation.
5. Only after an accepted relisting receipt, replace the catalog entry's component/ID reference. Keep the old reference in history. Old contract listings cannot be cancelled and remain callable directly; removing them from the website does not disable that contract. Sellers must account for any direct old-contract sales when reconciling inventory.
6. Update MARKET_COMPONENT_ADDRESS, the expected template in verifyActiveMarket and deployment metadata together. Enable LISTING_MANAGEMENT_READY only after the new identity is verified and the relisting path is ready. New submissions then use v0.12.
7. Confirm seller edit/delete, wrong-wallet rejection, refreshed inventory/catalog and existing-order access through the website. Run JavaScript regressions, update script integrity/download package, then publish the website.

The new component identity is configured and listing management is enabled. No seller listing was copied automatically. Existing users approve relisting from My Items.
