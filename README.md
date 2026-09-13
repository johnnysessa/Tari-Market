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
- Platform fees controlled by the AllGasNoBrakes Ootle account (`component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c`)
- Connection to a local Tari Ootle wallet daemon on Esmeralda
- Wallet-gated checkout with API credentials kept only in memory
- Local listing creation, inventory, and submitted order history
- Seller listing form with a full description, Tari payment address, and image upload with in-browser resizing
- Seller payment address shown at checkout with one-click copy
- Original catalog photography for all six example listings
- Six product listings featuring Nintendo Switch 2, Mac mini, AMD Radeon RX 9070 GRE, Sony OLED TV, iPhone 18 Plus, and PlayStation 5 Pro
- Rust Ootle template for listings, USD-reference updates, and atomic buyer-to-seller payments

## Trust boundary

The wallet connection authenticates with a local Esmeralda wallet and reads its default account. Buyer names and shipping addresses are never written to browser storage or contract state as plaintext; previously stored delivery fields are removed when the site loads. The browser encrypts delivery details for the seller and supplies only the encrypted package to `buy`, making it part of the seller's purchased-order record without exposing it publicly. The live component is configured at `component_256649b5849438698f37c43d642a567a6b284ecb7f337d23a3ec54ee91d32daf`. Each listing has a fixed item price and shipping price in XTM; the signed transaction manifest withdraws the exact checkout total from the buyer, then `buy` deposits 3% into the platform-fee vault and atomically deposits 97% into the seller's Ootle account.

## Next Ootle milestone

Create listings through the connected wallet, verify a low-value purchase between separate Esmeralda accounts, and connect seller notifications to indexed contract events across browsers.

The verified release artifact is `contracts/artifacts/xtm_market.wasm` (SHA-256: `e2f83e960e43e0f52a77e76677102a8fdfc420c02f95a5b1f2c53d3d64640837`).
