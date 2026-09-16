use tari_template_abi::rust::collections::BTreeMap;
use tari_template_lib::prelude::*;

fn has_admin_access(owner: &str, admins: &BTreeMap<String, String>, signer: &str) -> bool {
    signer == owner || admins.values().any(|key| key == signer)
}

fn settlement_destination<T: Clone>(settled: bool, refund: bool, buyer: &T, seller: &T) -> T {
    assert!(!settled, "Order is already settled");
    if refund { buyer.clone() } else { seller.clone() }
}

fn order_total(item: Amount, shipping: Amount) -> Amount {
    assert!(item.is_positive(), "Item price must be positive");
    item.checked_add(shipping).expect("Order amount overflow")
}

// Esmeralda runs approximately 72 epochs per day.
fn seller_claim_epoch(purchase_epoch: u64) -> u64 {
    purchase_epoch.checked_add(14 * 72).expect("Epoch overflow")
}

fn reserve_seller_username(
    by_signer: &mut BTreeMap<String, String>,
    by_name: &mut BTreeMap<String, String>,
    signer: String,
    requested: String,
) -> String {
    let name = requested.trim().to_ascii_lowercase();
    assert!((3..=24).contains(&name.len()) && name.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'_'),
        "Username must be 3-24 letters, numbers, or underscores");
    assert!(!["admin", "administrator", "owner", "support", "xtm_market", "tari", "ootle"].contains(&name.as_str()), "Username is reserved");
    if let Some(existing) = by_signer.get(&signer) {
        assert_eq!(existing, &name, "This wallet already has a username");
    }
    if let Some(existing) = by_name.get(&name) {
        assert_eq!(existing, &signer, "Username is already taken");
    }
    by_signer.insert(signer.clone(), name.clone());
    by_name.insert(name.clone(), signer);
    name
}

#[cfg(test)]
mod admin_tests {
    use super::*;
    #[test]
    fn username_normalizes_and_reuses_for_same_signer() {
        let (mut signers, mut names) = (BTreeMap::new(), BTreeMap::new());
        assert_eq!(reserve_seller_username(&mut signers, &mut names, "wallet_a".into(), " Shop_One ".into()), "shop_one");
        reserve_seller_username(&mut signers, &mut names, "wallet_a".into(), "SHOP_ONE".into());
        assert_eq!(signers.len(), 1);
        assert_eq!(names.len(), 1);
    }
    #[test]
    #[should_panic(expected = "already taken")]
    fn other_signer_cannot_take_username_with_different_case() {
        let (mut signers, mut names) = (BTreeMap::new(), BTreeMap::new());
        reserve_seller_username(&mut signers, &mut names, "wallet_a".into(), "shop_one".into());
        reserve_seller_username(&mut signers, &mut names, "wallet_b".into(), "SHOP_ONE".into());
    }
    #[test]
    #[should_panic(expected = "already has a username")]
    fn signer_cannot_reserve_multiple_names() {
        let (mut signers, mut names) = (BTreeMap::new(), BTreeMap::new());
        reserve_seller_username(&mut signers, &mut names, "wallet_a".into(), "shop_one".into());
        reserve_seller_username(&mut signers, &mut names, "wallet_a".into(), "shop_two".into());
    }
    #[test]
    #[should_panic(expected = "reserved")]
    fn official_username_is_reserved() {
        reserve_seller_username(&mut BTreeMap::new(), &mut BTreeMap::new(), "wallet_a".into(), "ADMIN".into());
    }
    #[test]
    #[should_panic(expected = "3-24")]
    fn unicode_username_is_rejected() {
        reserve_seller_username(&mut BTreeMap::new(), &mut BTreeMap::new(), "wallet_a".into(), "shоp".into());
    }
    #[test]
    #[should_panic(expected = "3-24")]
    fn oversized_username_is_rejected() {
        reserve_seller_username(&mut BTreeMap::new(), &mut BTreeMap::new(), "wallet_a".into(), "a".repeat(25));
    }
    #[test]
    fn purchase_claim_deadline_is_fourteen_days() {
        let deadline = seller_claim_epoch(500);
        assert_eq!(deadline, 1508);
        assert!(1507 < deadline);
        assert!(1508 >= deadline);
        assert!(1509 >= deadline);
    }
    #[test]
    #[should_panic(expected = "Epoch overflow")]
    fn purchase_deadline_overflow_is_rejected() { seller_claim_epoch(u64::MAX); }
    #[test]
    fn settlement_can_only_select_original_parties() {
        assert_eq!(settlement_destination(false, true, &"buyer", &"seller"), "buyer");
        assert_eq!(settlement_destination(false, false, &"buyer", &"seller"), "seller");
    }
    #[test]
    #[should_panic(expected = "already settled")]
    fn repeated_settlement_is_rejected() { settlement_destination(true, true, &"buyer", &"seller"); }
    #[test]
    fn escrow_includes_all_shipping() {
        assert_eq!(order_total(Amount::from(100u64), Amount::from(10u64)), Amount::from(110u64));
    }
    #[test]
    #[should_panic(expected = "overflow")]
    fn oversized_total_is_rejected() { order_total(Amount::MAX, Amount::ONE); }
    #[test]
    #[should_panic(expected = "positive")]
    fn zero_item_price_is_rejected() { order_total(Amount::ZERO, Amount::ONE); }
    #[test]
    fn grants_and_revocations_follow_signing_keys() {
        let mut admins = BTreeMap::new();
        assert!(has_admin_access("owner", &admins, "owner"));
        assert!(!has_admin_access("owner", &admins, "stranger"));
        admins.insert("wallet".to_string(), "admin_key".to_string());
        assert!(has_admin_access("owner", &admins, "admin_key"));
        assert!(!has_admin_access("owner", &admins, "wallet"));
        admins.remove("wallet");
        assert!(!has_admin_access("owner", &admins, "admin_key"));
        assert!(has_admin_access("owner", &admins, "owner"));
    }
}

#[template]
mod xtm_market {
    use super::*;


    pub struct XtmMarket {
        xtm_resource: ResourceAddress,
        platform_payment_address: ComponentAddress,
        escrow_vault: Vault,
        listings: BTreeMap<u64, Listing>,
        orders: BTreeMap<u64, Order>,
        seller_trust: BTreeMap<String, SellerTrust>,
        order_ratings: BTreeMap<u64, u64>,
        seller_reviews: BTreeMap<u64, SellerReview>,
        next_listing_id: u64,
        next_order_id: u64,
        owner_signer: String,
        admins: BTreeMap<String, String>,
        paid_marketplace_fees: BTreeMap<u64, bool>,
        seller_usernames: BTreeMap<String, String>,
        username_owners: BTreeMap<String, String>,
    }

    #[derive(Clone)]
    pub struct Listing {
        pub id: u64,
        pub title: String,
        pub usd_cents: u64,
        pub xtm_price: Amount,
        pub shipping_xtm: Amount,
        pub seller_payment_address: ComponentAddress,
        pub seller: RistrettoPublicKeyBytes,
        pub delivery_public_key: String,
        pub inventory: u64,
        pub active: bool,
    }

    #[derive(Clone)]
    pub struct Order {
        pub id: u64,
        pub listing_id: u64,
        pub buyer: RistrettoPublicKeyBytes,
        pub buyer_refund_address: ComponentAddress,
        pub usd_cents: u64,
        pub xtm_paid: Amount,
        pub seller_payment_address: ComponentAddress,
        pub platform_fee: Amount,
        pub seller_proceeds: Amount,
        pub encrypted_delivery: String,
        pub shipped: bool,
        pub delivery_recorded_epoch: Option<u64>,
        pub disputed: bool,
        pub settled: bool,
        pub refunded: bool,
        pub purchase_recorded_epoch: u64,
    }

    #[derive(Clone)]
    pub struct SellerTrust {
        pub total_stars: u64,
        pub rating_count: u64,
    }

    #[derive(Clone)]
    pub struct SellerReview {
        pub order_id: u64,
        pub seller_payment_address: ComponentAddress,
        pub stars: u64,
        pub comment: String,
        pub created_epoch: u64,
        pub disputed: bool,
        pub dispute_reason: String,
        pub removed: bool,
        pub moderation_note: String,
        pub automatic: bool,
    }

    impl XtmMarket {
        pub fn new(
            xtm_resource: ResourceAddress,
            platform_payment_address: ComponentAddress,
        ) -> Component<Self> {
            Component::new(Self {
                xtm_resource: xtm_resource.clone(),
                platform_payment_address,
                escrow_vault: Vault::new_empty(xtm_resource),
                listings: BTreeMap::new(),
                orders: BTreeMap::new(),
                seller_trust: BTreeMap::new(),
                order_ratings: BTreeMap::new(),
                seller_reviews: BTreeMap::new(),
                next_listing_id: 1,
                next_order_id: 1,
                owner_signer: CallerContext::transaction_signer_public_key().to_string(),
                admins: BTreeMap::new(),
                paid_marketplace_fees: BTreeMap::new(),
                seller_usernames: BTreeMap::new(),
                username_owners: BTreeMap::new(),
            })
            .with_access_rules(
                ComponentAccessRules::new()
                    .method("record_delivery", rule!(allow_all))
                    .method("update_usd_reference", rule!(allow_all))
                    .method("pay_marketplace_fee", rule!(allow_all))
                    .method("grant_admin", rule!(allow_all))
                    .method("revoke_admin", rule!(allow_all))
                    .method("resolve_dispute", rule!(allow_all))
                    .method("resolve_review_dispute", rule!(allow_all))
                    .method("remove_review", rule!(allow_all))
                    .method("buy", rule!(allow_all))
                    .method("create_listing", rule!(allow_all))
                    .method("update_listing", rule!(allow_all))
                    .method("cancel_listing", rule!(allow_all))
                    .method("mark_shipped", rule!(allow_all))
                    .method("confirm_receipt_and_review", rule!(allow_all))
                    .method("open_dispute", rule!(allow_all))
                    .method("claim_after_timeout", rule!(allow_all))
                    .method("review_seller", rule!(allow_all))
                    .method("dispute_review", rule!(allow_all))
                    .method("get_listing", rule!(allow_all))
                    .method("get_order", rule!(allow_all))
                    .method("get_seller_trust", rule!(allow_all))
                    .method("get_order_rating", rule!(allow_all))
                    .method("get_review", rule!(allow_all))
                    .method("get_platform_payment_address", rule!(allow_all)),
            )
            .with_owner_rule(OwnerRule::None)
            .create()
        }

        // Roles are enforced against the transaction signer, never a browser flag
        // or the display account address. Owner authority is permanent.
        fn assert_admin(&self) {
            let signer = CallerContext::transaction_signer_public_key().to_string();
            assert!(has_admin_access(&self.owner_signer, &self.admins, &signer),
                "Only the owner or an active admin may perform this action");
        }

        fn assert_owner(&self) {
            assert_eq!(CallerContext::transaction_signer_public_key().to_string(), self.owner_signer,
                "Only the original owner may perform this action");
        }

        pub fn grant_admin(&mut self, account: ComponentAddress, signer_public_key: String) {
            self.assert_admin();
            assert!(self.admins.len() < 32, "Admin limit reached");
            let key = signer_public_key.trim().to_lowercase();
            assert!(key.len() == 64 && key.bytes().all(|byte| byte.is_ascii_hexdigit()),
                "Enter a 64-character public signing key");
            assert!(key != self.owner_signer, "The owner already has permanent access");
            let address = account.to_string();
            assert!(!self.admins.contains_key(&address), "Revoke the existing admin before replacing it");
            assert!(!self.admins.values().any(|existing| existing == &key), "This signing key is already an admin");
            self.admins.insert(address.clone(), key.clone());
            emit_event("xtm_market.admin_granted", Metadata::from_iter([
                ("account", address), ("signer_public_key", key),
                ("authorized_by", CallerContext::transaction_signer_public_key().to_string()),
            ]));
        }

        pub fn revoke_admin(&mut self, account: ComponentAddress) {
            self.assert_admin();
            let address = account.to_string();
            assert!(self.admins.remove(&address).is_some(), "Admin not found");
            emit_event("xtm_market.admin_revoked", Metadata::from_iter([
                ("account", address),
                ("authorized_by", CallerContext::transaction_signer_public_key().to_string()),
            ]));
        }

        // The transaction signer becomes the authenticated seller for this listing.
        pub fn create_listing(
            &mut self,
            title: String,
            usd_cents: u64,
            xtm_price: Amount,
            shipping_xtm: Amount,
            seller_payment_address: ComponentAddress,
            delivery_public_key: String,
            inventory: u64,
            seller_username: String,
        ) -> u64 {
            assert!(!title.trim().is_empty() && title.len() <= 200, "Title must be 1–200 bytes");
            assert!(usd_cents > 0, "USD reference must be positive");
            assert!(xtm_price.is_positive(), "XTM price must be positive");
            assert!(
                !delivery_public_key.is_empty() && delivery_public_key.len() <= 2048,
                "Delivery encryption key is required"
            );
            assert!(inventory > 0, "Inventory must be positive");

            // Registration and listing creation commit atomically; the signer is never a caller-supplied address.
            reserve_seller_username(&mut self.seller_usernames, &mut self.username_owners,
                CallerContext::transaction_signer_public_key().to_string(), seller_username);
            let id = self.next_listing_id;
            self.next_listing_id = self.next_listing_id.checked_add(1).expect("Listing ID overflow");
            self.listings.insert(
                id,
                Listing {
                    id,
                    title,
                    usd_cents,
                    xtm_price,
                    shipping_xtm,
                    seller_payment_address,
                    seller: CallerContext::transaction_signer_public_key(),
                    delivery_public_key,
                    inventory,
                    active: true,
                },
            );
            id
        }

        // Listing management is seller-only, including when the caller is an admin.
        // Existing orders keep their captured amounts and settlement destinations.
        pub fn update_listing(&mut self, listing_id: u64, title: String, usd_cents: u64,
            xtm_price: Amount, shipping_xtm: Amount, inventory: u64) {
            let listing = self.listings.get_mut(&listing_id).expect("Listing not found");
            assert_eq!(CallerContext::transaction_signer_public_key(), listing.seller,
                "Only the original seller may edit this listing");
            assert!(listing.active, "Listing is deleted");
            assert!(!title.trim().is_empty() && title.len() <= 200, "Title must be 1–200 bytes");
            assert!(usd_cents > 0 && xtm_price.is_positive(), "Price must be positive");
            assert!(shipping_xtm >= Amount::ZERO, "Shipping must not be negative");
            listing.title = title;
            listing.usd_cents = usd_cents;
            listing.xtm_price = xtm_price;
            listing.shipping_xtm = shipping_xtm;
            listing.inventory = inventory;
        }

        // Retain the listing record for order history while preventing new purchases.
        pub fn cancel_listing(&mut self, listing_id: u64) {
            let listing = self.listings.get_mut(&listing_id).expect("Listing not found");
            assert_eq!(CallerContext::transaction_signer_public_key(), listing.seller,
                "Only the original seller may delete this listing");
            assert!(listing.active, "Listing is already deleted");
            listing.active = false;
            listing.inventory = 0;
        }

        // The owner-authorized oracle updates the USD reference; the XTM price stays fixed.
        pub fn update_usd_reference(&mut self, listing_id: u64, usd_cents: u64) {
            self.assert_owner();
            let listing = self
                .listings
                .get_mut(&listing_id)
                .expect("Listing not found");
            assert!(usd_cents > 0, "Invalid USD reference");
            listing.usd_cents = usd_cents;
        }

        pub fn buy(
            &mut self,
            listing_id: u64,
            payment: Bucket,
            buyer_refund_address: ComponentAddress,
            encrypted_delivery: String,
        ) -> u64 {
            assert_eq!(
                payment.resource_address(),
                self.xtm_resource,
                "Payment must be XTM"
            );
            let listing = self
                .listings
                .get_mut(&listing_id)
                .expect("Listing not found");
            assert!(
                listing.active && listing.inventory > 0,
                "Listing unavailable"
            );
            assert!(
                !encrypted_delivery.is_empty(),
                "Encrypted delivery details are required"
            );
            assert!(
                encrypted_delivery.len() <= 8192,
                "Encrypted delivery details are too large"
            );
            let total = order_total(listing.xtm_price, listing.shipping_xtm);
            assert_eq!(payment.amount(), total, "Payment amount is incorrect");
            // Fee is recorded separately; no platform payment can withdraw escrow.
            let platform_fee = listing.xtm_price.checked_mul(Amount::from(3u64)).expect("Fee overflow") / 100;
            let seller_proceeds = total;

            let order_id = self.next_order_id;
            self.next_order_id = self.next_order_id.checked_add(1).expect("Order ID overflow");
            listing.inventory -= 1;
            let xtm_paid = payment.amount();
            let buyer = CallerContext::transaction_signer_public_key();
            self.orders.insert(
                order_id,
                Order {
                    id: order_id,
                    listing_id,
                    buyer,
                    buyer_refund_address,
                    usd_cents: listing.usd_cents,
                    xtm_paid,
                    seller_payment_address: listing.seller_payment_address.clone(),
                    platform_fee,
                    seller_proceeds,
                    encrypted_delivery,
                    shipped: false,
                    delivery_recorded_epoch: None,
                    purchase_recorded_epoch: Consensus::current_epoch(),
                    disputed: false,
                    settled: false,
                    refunded: false,
                },
            );
            self.escrow_vault.deposit(payment);
            emit_event(
                "xtm_market.sale",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("listing_id", listing_id.to_string()),
                    ("seller", listing.seller_payment_address.to_string()),
                    ("xtm_paid", total.to_string()),
                    ("status", "in_escrow".to_string()),
                ]),
            );
            emit_event(
                "xtm_market.escrow_funded",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("xtm_locked", total.to_string()),
                ]),
            );
            order_id
        }

        pub fn mark_shipped(&mut self, order_id: u64) {
            let signer = CallerContext::transaction_signer_public_key();
            let order = self.orders.get_mut(&order_id).expect("Order not found");
            let listing = self
                .listings
                .get(&order.listing_id)
                .expect("Listing not found");
            assert_eq!(
                signer, listing.seller,
                "Only the seller may mark this order shipped"
            );
            assert!(!order.settled, "Order is already settled");
            assert!(
                !order.disputed,
                "Disputed orders cannot be updated by the seller"
            );
            order.shipped = true;
            emit_event(
                "xtm_market.order_shipped",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("status", "shipped".to_string()),
                ]),
            );
        }

        // Owner records delivery for tracking; it never starts or resets the purchase clock.
        pub fn record_delivery(&mut self, order_id: u64) {
            self.assert_owner();
            let order = self.orders.get_mut(&order_id).expect("Order not found");
            assert!(order.shipped, "Order must be marked shipped first");
            assert!(!order.settled, "Order is already settled");
            assert!(!order.disputed, "Disputed orders cannot update delivery");
            assert!(
                order.delivery_recorded_epoch.is_none(),
                "Delivery is already recorded"
            );
            let epoch = Consensus::current_epoch();
            order.delivery_recorded_epoch = Some(epoch);
            emit_event(
                "xtm_market.delivery_recorded",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("delivery_epoch", epoch.to_string()),
                    (
                        "auto_release_epoch",
                        seller_claim_epoch(order.purchase_recorded_epoch).to_string(),
                    ),
                ]),
            );
        }

        // Buyer receipt confirmation, verified feedback, and seller payment are
        // one atomic transaction. A missing or invalid review prevents release.
        pub fn confirm_receipt_and_review(&mut self, order_id: u64, stars: u64, comment: String) {
            assert!(
                (1..=5).contains(&stars),
                "Rating must be between one and five stars"
            );
            assert!(!comment.trim().is_empty(), "A review comment is required");
            assert!(comment.len() <= 500, "Review comment is too long");
            assert!(
                !self.order_ratings.contains_key(&order_id),
                "This order has already been rated"
            );
            let signer = CallerContext::transaction_signer_public_key();
            {
                let order = self.orders.get(&order_id).expect("Order not found");
                assert_eq!(signer, order.buyer, "Only the buyer may confirm receipt");
                assert!(
                    !order.disputed,
                    "A disputed order must be resolved by the marketplace"
                );
                assert!(!order.settled, "Order is already settled");
            }
            self.release_to_seller(order_id, "buyer_confirmed_with_review");
            self.review_seller(order_id, stars, comment);
        }

        pub fn open_dispute(&mut self, order_id: u64) {
            let signer = CallerContext::transaction_signer_public_key();
            let order = self.orders.get_mut(&order_id).expect("Order not found");
            assert_eq!(signer, order.buyer, "Only the buyer may dispute this order");
            assert!(!order.settled, "Order is already settled");
            order.disputed = true;
            emit_event(
                "xtm_market.dispute_opened",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("status", "disputed".to_string()),
                ]),
            );
        }

        pub fn claim_after_timeout(&mut self, order_id: u64) {
            let signer = CallerContext::transaction_signer_public_key();
            {
                let order = self.orders.get(&order_id).expect("Order not found");
                let listing = self
                    .listings
                    .get(&order.listing_id)
                    .expect("Listing not found");
                assert_eq!(
                    signer, listing.seller,
                    "Only the seller may claim this order"
                );
                assert!(
                    !order.disputed,
                    "A disputed order must be resolved by the marketplace"
                );
                assert!(!order.settled, "Order is already settled");
                assert!(
                    Consensus::current_epoch() >= seller_claim_epoch(order.purchase_recorded_epoch),
                    "The 14-day release period has not ended"
                );
            }
            self.release_to_seller(order_id, "timeout_elapsed");
            if !self.order_ratings.contains_key(&order_id) {
                self.record_review(order_id, 5, "Sale Satisfactory".to_string(), true);
            }
        }

        // A verified review combines the wallet-bound rating with a required
        // public buyer comment. Timeout claims instead record an automatic review.
        // One completed, non-refunded order gets one review.
        pub fn review_seller(&mut self, order_id: u64, stars: u64, comment: String) {
            assert!(
                (1..=5).contains(&stars),
                "Rating must be between one and five stars"
            );
            assert!(!comment.trim().is_empty(), "A review comment is required");
            assert!(comment.len() <= 500, "Review comment is too long");
            assert!(
                !self.order_ratings.contains_key(&order_id),
                "This order has already been rated"
            );

            let signer = CallerContext::transaction_signer_public_key();
            {
                let order = self.orders.get(&order_id).expect("Order not found");
                assert_eq!(signer, order.buyer, "Only the buyer may rate this seller");
                assert!(
                    order.settled,
                    "The transaction must be completed before rating"
                );
                assert!(!order.refunded, "Refunded orders cannot be rated");
            }
            self.record_review(order_id, stars, comment, false);
        }

        // Private: automatic feedback can only be created by the guarded timeout claim.
        fn record_review(&mut self, order_id: u64, stars: u64, comment: String, automatic: bool) {
            assert!(
                !self.order_ratings.contains_key(&order_id),
                "This order has already been rated"
            );
            let order = self.orders.get(&order_id).expect("Order not found");
            assert!(
                order.settled && !order.refunded,
                "Only completed sales can be rated"
            );
            let seller_key = order.seller_payment_address.to_string();
            let trust = self
                .seller_trust
                .entry(seller_key.clone())
                .or_insert(SellerTrust {
                    total_stars: 0,
                    rating_count: 0,
                });
            trust.total_stars = trust.total_stars.checked_add(stars).expect("Rating overflow");
            trust.rating_count = trust.rating_count.checked_add(1).expect("Rating count overflow");
            let rating_count = trust.rating_count;
            let total_stars = trust.total_stars;
            self.order_ratings.insert(order_id, stars);
            self.seller_reviews.insert(
                order_id,
                SellerReview {
                    order_id,
                    seller_payment_address: self
                        .orders
                        .get(&order_id)
                        .expect("Order not found")
                        .seller_payment_address
                        .clone(),
                    stars,
                    comment,
                    created_epoch: Consensus::current_epoch(),
                    disputed: false,
                    dispute_reason: String::new(),
                    removed: false,
                    moderation_note: String::new(),
                    automatic,
                },
            );

            emit_event(
                "xtm_market.seller_rated",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("seller", seller_key),
                    ("stars", stars.to_string()),
                    ("rating_count", rating_count.to_string()),
                    ("total_stars", total_stars.to_string()),
                    ("automatic", automatic.to_string()),
                ]),
            );
        }

        // Only the reviewed seller may ask the marketplace owner to examine a
        // review. The review remains visible, marked as disputed, until decided.
        pub fn dispute_review(&mut self, order_id: u64, reason: String) {
            assert!(!reason.is_empty(), "A dispute reason is required");
            assert!(reason.len() <= 500, "Dispute reason is too long");
            let signer = CallerContext::transaction_signer_public_key();
            let order = self.orders.get(&order_id).expect("Order not found");
            let listing = self
                .listings
                .get(&order.listing_id)
                .expect("Listing not found");
            assert_eq!(
                signer, listing.seller,
                "Only the seller may dispute this review"
            );
            let review = self
                .seller_reviews
                .get_mut(&order_id)
                .expect("Review not found");
            assert!(!review.removed, "Review is already removed");
            assert!(!review.disputed, "Review is already disputed");
            review.disputed = true;
            review.dispute_reason = reason;
            emit_event(
                "xtm_market.review_disputed",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("seller", review.seller_payment_address.to_string()),
                ]),
            );
        }

        // Owner-only. Removing a review also removes its stars from the public
        // aggregate. Keeping it closes the dispute without changing the score.
        pub fn resolve_review_dispute(
            &mut self,
            order_id: u64,
            remove_review: bool,
            moderation_note: String,
        ) {
            self.assert_admin();
            assert!(moderation_note.len() <= 500, "Moderation note is too long");
            let review = self
                .seller_reviews
                .get(&order_id)
                .expect("Review not found");
            assert!(review.disputed, "Review is not disputed");
            if remove_review {
                self.remove_review_internal(order_id, moderation_note);
            } else {
                let review = self
                    .seller_reviews
                    .get_mut(&order_id)
                    .expect("Review not found");
                review.disputed = false;
                review.moderation_note = moderation_note;
                emit_event(
                    "xtm_market.review_retained",
                    Metadata::from_iter([("order_id", order_id.to_string())]),
                );
            }
        }

        // Owner-only removal is also available for illegal, abusive, fraudulent,
        // or otherwise policy-violating content before a seller files a dispute.
        pub fn remove_review(&mut self, order_id: u64, moderation_note: String) {
            self.assert_admin();
            assert!(moderation_note.len() <= 500, "Moderation note is too long");
            self.remove_review_internal(order_id, moderation_note);
        }

        fn remove_review_internal(&mut self, order_id: u64, moderation_note: String) {
            let (seller_key, stars) = {
                let review = self
                    .seller_reviews
                    .get(&order_id)
                    .expect("Review not found");
                assert!(!review.removed, "Review is already removed");
                (review.seller_payment_address.to_string(), review.stars)
            };
            let trust = self
                .seller_trust
                .get_mut(&seller_key)
                .expect("Seller trust record not found");
            trust.total_stars = trust.total_stars.checked_sub(stars).expect("Invalid rating total");
            trust.rating_count = trust.rating_count.checked_sub(1).expect("Invalid rating count");
            let review = self
                .seller_reviews
                .get_mut(&order_id)
                .expect("Review not found");
            review.removed = true;
            review.disputed = false;
            review.moderation_note = moderation_note;
            emit_event(
                "xtm_market.review_removed",
                Metadata::from_iter([("order_id", order_id.to_string()), ("seller", seller_key)]),
            );
        }

        // Owner-only. refund_buyer=true refunds the full escrow balance for
        // this order; false releases the normal seller proceeds and platform fee.
        pub fn resolve_dispute(&mut self, order_id: u64, refund_buyer: bool) {
            self.assert_admin();
            {
                let order = self.orders.get(&order_id).expect("Order not found");
                assert!(order.disputed, "Order is not disputed");
                assert!(!order.settled, "Order is already settled");
            }
            self.settle_order(order_id, refund_buyer, "dispute_resolved");
        }

        fn release_to_seller(&mut self, order_id: u64, reason: &str) {
            self.settle_order(order_id, false, reason);
        }

        // The ONLY withdrawal from escrow. Neither public methods nor admins
        // supply a recipient or amount. Both come from the immutable order.
        fn settle_order(&mut self, order_id: u64, refund: bool, reason: &str) {
            let (total, destination) = {
                let order = self.orders.get_mut(&order_id).expect("Order not found");
                let destination = settlement_destination(order.settled, refund,
                    &order.buyer_refund_address, &order.seller_payment_address);
                order.settled = true;
                order.refunded = refund;
                (order.xtm_paid, destination)
            };
            // Mark settled BEFORE calling an external account. A failed deposit
            // must roll back atomically under the Ootle engine transaction rules.
            let payment = self.escrow_vault.withdraw(total);
            ComponentManager::get(destination).invoke("deposit", args![payment]);
            emit_event(if refund { "xtm_market.escrow_refunded" } else { "xtm_market.escrow_released" },
                Metadata::from_iter([
                    ("order_id", order_id.to_string()), ("xtm_paid", total.to_string()),
                    ("destination", destination.to_string()), ("reason", reason.to_string()),
                ]));
        }

        // A seller-approved fee payment uses a NEW bucket from their wallet.
        // It never reads or withdraws the escrow vault, and cannot block release.
        pub fn pay_marketplace_fee(&mut self, order_id: u64, payment: Bucket) {
            let order = self.orders.get(&order_id).expect("Order not found");
            let listing = self.listings.get(&order.listing_id).expect("Listing not found");
            assert_eq!(CallerContext::transaction_signer_public_key(), listing.seller,
                "Only the original seller may pay this fee");
            assert!(order.settled && !order.refunded, "Fee is due only on a completed sale");
            assert!(!self.paid_marketplace_fees.contains_key(&order_id), "Fee already paid");
            assert_eq!(payment.resource_address(), self.xtm_resource, "Fee must be XTM");
            assert_eq!(payment.amount(), order.platform_fee, "Incorrect fee amount");
            self.paid_marketplace_fees.insert(order_id, true);
            ComponentManager::get(self.platform_payment_address).invoke("deposit", args![payment]);
            emit_event("xtm_market.fee_paid", Metadata::from_iter([("order_id", order_id.to_string())]));
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

        pub fn get_seller_trust(
            &self,
            seller_payment_address: ComponentAddress,
        ) -> Option<SellerTrust> {
            self.seller_trust
                .get(&seller_payment_address.to_string())
                .cloned()
        }

        pub fn get_order_rating(&self, order_id: u64) -> Option<u64> {
            self.order_ratings.get(&order_id).copied()
        }

        pub fn get_review(&self, order_id: u64) -> Option<SellerReview> {
            self.seller_reviews.get(&order_id).cloned()
        }
    }
}
