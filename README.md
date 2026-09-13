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
- Permanent `xtm_market.sale` Ootle event for seller inventory and order notifications
- Three-percent seller service fee deducted from the complete item-and-shipping payment; buyer total is unchanged
- Platform fees deposited directly into the AllGasNoBrakes Ootle account (`component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c`)
- Connection to a local Tari Ootle wallet daemon on Esmeralda
- Wallet-gated checkout with API credentials kept only in memory
- Local listing creation, inventory, and submitted order history
- Seller listing form with a full description, Tari payment address, and image upload with in-browser resizing
- Seller payment address shown at checkout with one-click copy
- Original catalog photography for all six example listings
- Six product listings featuring Nintendo Switch 2, Mac mini, AMD Radeon RX 9070 GRE, Sony OLED TV, iPhone 18 Plus, and PlayStation 5 Pro
- Rust Ootle template for listings, USD-reference updates, and atomic buyer-to-seller payments

## Trust boundary

The wallet connection authenticates with a local Esmeralda wallet and reads its default account. Buyer names and shipping addresses are never written to browser storage or contract state as plaintext; previously stored delivery fields are removed when the site loads. The browser encrypts delivery details for the seller and supplies only the encrypted package to `buy`, making it part of the seller's purchased-order record without exposing it publicly. Each listing has a fixed item price and shipping price in XTM; the signed transaction manifest withdraws the exact checkout total from the buyer, then `buy` atomically deposits 3% into the configured platform account and 97% into the seller's Ootle account.

The active Esmeralda deployment uses template `template_0f72672b92965e4862d781de1ce141adf92958aa92ba37eb9df755412d97c49b` and market component `component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15`.

## Next Ootle milestone

Create listings through the connected wallet, verify a low-value purchase between separate Esmeralda accounts, and connect seller notifications to indexed contract events across browsers.

The verified release artifact is `contracts/artifacts/xtm_market.wasm` (SHA-256: `c2758a29cf63dfb9d9d1be6f42e4de67c4417d8141c4443bae9684588cf1c24c`).
