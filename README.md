# XTM Market

An Ootle marketplace prototype where every listing is priced and settled in XTM, with a live USD reference.

## What works now

- Fixed XTM pricing on every listing with a live USD reference
- Ten-minute XTM checkout quote
- Seller-set shipping prices in XTM, shown separately from the item price
- Checkout total combines the item price and shipping in XTM
- Required buyer name and shipping address held only in the checkout form and cleared after payment
- Browser-side hybrid encryption for shipping details using the seller's RSA-OAEP public key and a one-time AES-GCM key
- Automatic per-listing delivery encryption; sellers do not enter or manage an encryption key
- Encrypted buyer name and shipping address attached to the purchased order for the seller
- Wallet-matched Orders received view with new-sale status, amount, timestamp, and automatically decrypted shipping details on the seller's listing device
- Top navigation for the marketplace, recent buyer orders, and seller orders received
- Contract-owned XTM escrow vault; purchase funds are not deposited into the seller account at checkout
- Buyer receipt confirmation requires a one-to-five-star rating and a written public comment in the same atomic transaction that releases escrow
- Buyer-controlled dispute opening before escrow settles
- Seller shipping confirmation and an automatic-release claim 1,008 epochs (approximately 14 days) after delivery is recorded
- Marketplace-owner delivery recording and dispute resolution, including full buyer refunds
- Permanent escrow lifecycle events for funding, shipping, delivery, disputes, releases, and refunds
- Three-percent seller service fee calculated only from the item price and deducted when escrow releases; shipping passes through to the seller in full and refunded orders incur no marketplace fee
- Wallet-bound seller trust profiles stored on-chain by Ootle account component address
- One verified one-to-five-star seller rating per successfully released order, submitted only by that order's buyer
- Required nonblank public buyer comments of up to 500 characters attached to every verified rating
- Public wallet-linked seller profiles showing the aggregate score and individual verified-sale feedback before checkout
- Seller review disputes with a written reason, submitted only by the wallet that completed the sale
- Owner-only review moderation to retain or remove disputed feedback, plus direct removal of illegal, abusive, fraudulent, or policy-violating content
- Moderation navigation is visible only when the connected account matches the marketplace owner's AllGasNoBrakes Ootle account; contract owner-signature rules remain the authoritative security check
- Required entry disclaimer covering lawful-use obligations, risk of lost goods or XTM, reasonable problem-resolution efforts, and limitations of responsibility to the fullest extent permitted by law
- Removed reviews are excluded from both the public profile and the seller's aggregate trust score
- Refunded orders cannot produce ratings, and duplicate ratings are rejected by the contract
- Seller trust shown on community listings, at checkout, and in the connected seller's Orders received view
- Platform fees deposited into the AllGasNoBrakes Ootle account (`component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c`) at release
- `window.tari` integration for Tari Universe and compatible browser wallets, with account discovery, capability detection, transaction submission, result polling, and disconnect
- WalletConnect pairing with Tari Asset Vault as a fallback when `window.tari` is unavailable
- Wallet-gated checkout with API credentials kept only in memory
- Local listing creation, inventory, and submitted order history
- Seller listing form with a full description, Tari payment address, and up to eight item photos with in-browser resizing, removable previews, a cover photo, and buyer-facing gallery controls
- Clickable listing photos that open a full product-detail view with a large gallery, complete description, pricing, stock, escrow protection, seller wallet identity, trust score, review count, and Buy/Profile actions
- Seller payment address shown at checkout with one-click copy
- Original catalog photography for all six example listings
- Six product listings featuring Nintendo Switch 2, Mac mini, AMD Radeon RX 9070 GRE, Sony BRAVIA 8 II OLED TV, iPhone 18 Pro Max, and PlayStation 5 Pro
- Rust Ootle template for listings, USD-reference updates, pooled contract escrow, release, refund, and dispute handling

## Trust boundary

The wallet connection prefers Tari's standard `window.tari` provider, which works with compatible extensions and when the marketplace is embedded in Tari Universe. WalletConnect remains available as a fallback for Tari Asset Vault. Neither path requests or stores a wallet API key. Buyer names and shipping addresses are never written to browser storage or contract state as plaintext; previously stored delivery fields are removed when the site loads. The browser encrypts delivery details for the seller and supplies only the encrypted package to `buy`, making it part of the seller's purchased-order record without exposing it publicly. Each listing has a fixed item price and shipping price in XTM; the wallet signs an Ootle transaction that withdraws the exact checkout total from the buyer and deposits it into the market component's escrow vault.

Only the buyer signer can confirm receipt or open a dispute. Receipt confirmation, the one-to-five-star rating, the required written comment, and seller payment occur in one atomic transaction: if any feedback requirement fails, escrow is not released. Only the listing's seller signer can mark the order shipped or claim after the undisputed 14-day timeout. The component owner records carrier-confirmed delivery and resolves disputes. A dispute blocks buyer confirmation and seller timeout claims until the owner resolves it. A buyer refund returns the full escrowed amount and charges no platform fee.

Seller trust is keyed to the seller's Ootle account component address, so the score and verified reviews follow that wallet across browsers and devices. The contract accepts one rating and required nonblank comment per order only from the authenticated buyer, only after escrow has settled in the seller's favor, and never after a refund. A seller may dispute a review but cannot edit or remove it. Only the component owner can retain or remove disputed feedback or directly remove policy-violating content. Removal subtracts the review from the wallet's aggregate score. The browser reads profiles and reviews from public component state; it cannot edit or manufacture them locally.

The active Esmeralda escrow deployment uses template `template_19555399f19e664fe251a34b7ef1f470369a54ae33a9d5b1f4dfacaa7c12b3ac` and component `component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9`. The prior component (`component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15`) pays sellers immediately and is no longer used by the web app.

## v0.5 required receipt review upgrade

Version 0.5.0 introduced the combined receipt, required rating, required comment, dispute, profile, and owner-moderation flows. Its preserved artifact is `contracts/artifacts/XTM_Market_Escrow_ReceiptReviewRequired_v0.5.0_Esmeralda.wasm` (SHA-256: `36adc48b70ae05c826c1281f2bc22ec0f4a5dcd65696cfcd5e497d917fabc415`).

## v0.6 item-price-only marketplace fee upgrade

The source contract is now version 0.6.0. The marketplace fee is `3% × item price`; shipping is excluded from the fee and paid to the seller in full. Publish `contracts/artifacts/XTM_Market_Escrow_ItemPriceFeeOnly_v0.6.0_Esmeralda.wasm` (SHA-256: `caf0796f68fa2fa5a9a12a2be6b539187015638a2157a187e3c4589f463b51f7`) as a new template, instantiate it with `contracts/deployment/XTM_Market_Escrow_ItemPriceFeeOnly_v0.6.0_Esmeralda_instantiate.tm`, then replace `MARKET_COMPONENT_ADDRESS` in `dist/index.html`. Until that component address is configured, the active v0.2 escrow component retains its existing fee behavior.

## Next Ootle milestone

Verify a low-value escrow purchase between separate Esmeralda accounts. Test buyer release, dispute/refund, seller timeout, and unauthorized-caller rejection before using meaningful funds.

The verified active v0.2 escrow artifact remains `contracts/artifacts/xtm_market.wasm` (SHA-256: `7925fe468bf0057f891fe5232cbbbad5639341f9ca02fce789d3719d986c9ed6`). It is intentionally preserved separately from the uniquely named v0.3 through v0.6 upgrade artifacts.

## License

XTM Market is open-source software released under the [MIT License](LICENSE).
