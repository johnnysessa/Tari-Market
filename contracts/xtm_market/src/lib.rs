use tari_template_abi::rust::collections::BTreeMap;
use tari_template_lib::prelude::*;

#[template]
mod xtm_market {
    use super::*;

    pub struct XtmMarket {
        xtm_resource: ResourceAddress,
        platform_payment_address: ComponentAddress,
        listings: BTreeMap<u64, Listing>,
        orders: BTreeMap<u64, Order>,
        next_listing_id: u64,
        next_order_id: u64,
    }

    #[derive(Clone)]
    pub struct Listing {
        pub id: u64,
        pub title: String,
        pub usd_cents: u64,
        pub xtm_price: Amount,
        pub shipping_xtm: Amount,
        pub seller_payment_address: ComponentAddress,
        pub delivery_public_key: String,
        pub inventory: u64,
        pub active: bool,
    }

    #[derive(Clone)]
    pub struct Order {
        pub id: u64,
        pub listing_id: u64,
        pub buyer: RistrettoPublicKeyBytes,
        pub usd_cents: u64,
        pub xtm_paid: Amount,
        pub seller_payment_address: ComponentAddress,
        pub platform_fee: Amount,
        pub seller_proceeds: Amount,
        pub encrypted_delivery: String,
        pub fulfilled: bool,
    }

    impl XtmMarket {
        pub fn new(xtm_resource: ResourceAddress, platform_payment_address: ComponentAddress) -> Component<Self> {
            Component::new(Self {
                xtm_resource,
                platform_payment_address,
                listings: BTreeMap::new(),
                orders: BTreeMap::new(),
                next_listing_id: 1,
                next_order_id: 1,
            })
            .with_access_rules(
                ComponentAccessRules::new()
                    .method("buy", rule!(allow_all))
                    .method("create_listing", rule!(allow_all))
                    .method("get_listing", rule!(allow_all))
                    .method("get_order", rule!(allow_all))
                    .method("get_platform_payment_address", rule!(allow_all)),
            )
            .with_owner_rule(OwnerRule::OwnedBySigner)
            .create()
        }

        // Owner-curated in V1. Multi-merchant seller badges are the next contract milestone.
        pub fn create_listing(
            &mut self,
            title: String,
            usd_cents: u64,
            xtm_price: Amount,
            shipping_xtm: Amount,
            seller_payment_address: ComponentAddress,
            delivery_public_key: String,
            inventory: u64,
        ) -> u64 {
            assert!(!title.is_empty(), "Title is required");
            assert!(usd_cents > 0, "USD reference must be positive");
            assert!(xtm_price.is_positive(), "XTM price must be positive");
            assert!(!delivery_public_key.is_empty(), "Delivery encryption key is required");
            assert!(inventory > 0, "Inventory must be positive");

            let id = self.next_listing_id;
            self.next_listing_id += 1;
            self.listings.insert(id, Listing {
                id,
                title,
                usd_cents,
                xtm_price,
                shipping_xtm,
                seller_payment_address,
                delivery_public_key,
                inventory,
                active: true,
            });
            id
        }

        // The owner-authorized oracle updates the USD reference; the XTM price stays fixed.
        pub fn update_usd_reference(&mut self, listing_id: u64, usd_cents: u64) {
            let listing = self.listings.get_mut(&listing_id).expect("Listing not found");
            assert!(usd_cents > 0, "Invalid USD reference");
            listing.usd_cents = usd_cents;
        }

        pub fn buy(&mut self, listing_id: u64, mut payment: Bucket, encrypted_delivery: String) -> u64 {
            assert_eq!(payment.resource_address(), self.xtm_resource, "Payment must be XTM");
            let listing = self.listings.get_mut(&listing_id).expect("Listing not found");
            assert!(listing.active && listing.inventory > 0, "Listing unavailable");
            assert!(!encrypted_delivery.is_empty(), "Encrypted delivery details are required");
            assert!(encrypted_delivery.len() <= 8192, "Encrypted delivery details are too large");
            let total = listing.xtm_price + listing.shipping_xtm;
            assert_eq!(payment.amount(), total, "Payment amount is incorrect");
            let platform_fee = total * 3 / 100;
            let seller_proceeds = total - platform_fee;

            let order_id = self.next_order_id;
            self.next_order_id += 1;
            listing.inventory -= 1;
            let seller_payment_address = listing.seller_payment_address;
            let platform_payment_address = self.platform_payment_address;
            self.orders.insert(order_id, Order {
                id: order_id,
                listing_id,
                buyer: CallerContext::transaction_signer_public_key(),
                usd_cents: listing.usd_cents,
                xtm_paid: payment.amount(),
                seller_payment_address: listing.seller_payment_address.clone(),
                platform_fee,
                seller_proceeds,
                encrypted_delivery,
                fulfilled: true,
            });
            emit_event("xtm_market.sale", Metadata::from_iter([
                ("order_id", order_id.to_string()),
                ("listing_id", listing_id.to_string()),
                ("seller", listing.seller_payment_address.to_string()),
                ("xtm_paid", total.to_string()),
                ("status", "paid".to_string()),
            ]));
            ComponentManager::get(platform_payment_address)
                .invoke("deposit", args![payment.take(platform_fee)]);
            ComponentManager::get(seller_payment_address).invoke("deposit", args![payment]);
            order_id
        }

        pub fn get_platform_payment_address(&self) -> ComponentAddress {
            self.platform_payment_address
        }

        pub fn get_listing(&self, listing_id: u64) -> Option<Listing> {
            self.listings.get(&listing_id).cloned()
        }

        pub fn get_order(&self, order_id: u64) -> Option<Order> {
            self.orders.get(&order_id).cloned()
        }
    }
}
