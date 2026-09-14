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
- Buyer-controlled receipt confirmation and dispute opening
- Seller shipping confirmation and an automatic-release claim 1,008 epochs (approximately 14 days) after delivery is recorded
- Marketplace-owner delivery recording and dispute resolution, including full buyer refunds
- Permanent escrow lifecycle events for funding, shipping, delivery, disputes, releases, and refunds
- Three-percent seller service fee deducted only when escrow releases to the seller; refunded orders incur no marketplace fee
- Platform fees deposited into the AllGasNoBrakes Ootle account (`component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c`) at release
- `window.tari` integration for Tari Universe and compatible browser wallets, with account discovery, capability detection, transaction submission, result polling, and disconnect
- WalletConnect pairing with Tari Asset Vault as a fallback when `window.tari` is unavailable
- Wallet-gated checkout with API credentials kept only in memory
- Local listing creation, inventory, and submitted order history
- Seller listing form with a full description, Tari payment address, and image upload with in-browser resizing
- Seller payment address shown at checkout with one-click copy
- Original catalog photography for all six example listings
- Six product listings featuring Nintendo Switch 2, Mac mini, AMD Radeon RX 9070 GRE, Sony BRAVIA 8 II OLED TV, iPhone 18 Pro Max, and PlayStation 5 Pro
- Rust Ootle template for listings, USD-reference updates, pooled contract escrow, release, refund, and dispute handling

## Trust boundary

The wallet connection prefers Tari's standard `window.tari` provider, which works with compatible extensions and when the marketplace is embedded in Tari Universe. WalletConnect remains available as a fallback for Tari Asset Vault. Neither path requests or stores a wallet API key. Buyer names and shipping addresses are never written to browser storage or contract state as plaintext; previously stored delivery fields are removed when the site loads. The browser encrypts delivery details for the seller and supplies only the encrypted package to `buy`, making it part of the seller's purchased-order record without exposing it publicly. Each listing has a fixed item price and shipping price in XTM; the wallet signs an Ootle transaction that withdraws the exact checkout total from the buyer and deposits it into the market component's escrow vault.

Only the buyer signer can confirm receipt or open a dispute. Only the listing's seller signer can mark the order shipped or claim after the timeout. The component owner records carrier-confirmed delivery and resolves disputes. A dispute blocks buyer confirmation and automatic seller claims until the owner resolves it. A buyer refund returns the full escrowed amount and charges no platform fee.

The prior Esmeralda component (`component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15`) pays sellers immediately and is intentionally disabled in the web app. The v0.2 escrow template must be built, published, instantiated, and configured in `dist/index.html` before purchases reopen.

## Next Ootle milestone

Build and publish v0.2, instantiate the new escrow component, configure its address in the web app, and verify a low-value escrow purchase between separate Esmeralda accounts. Test buyer release, dispute/refund, seller timeout, and unauthorized-caller rejection before using meaningful funds.

The verified v0.2 escrow release artifact is `contracts/artifacts/xtm_market.wasm` (SHA-256: `7925fe468bf0057f891fe5232cbbbad5639341f9ca02fce789d3719d986c9ed6`). Publish it through the Tari Wallet Web UI, which performs the required WASM optimization before submitting it to Esmeralda.

## License

XTM Market is open-source software released under the [MIT License](LICENSE).
