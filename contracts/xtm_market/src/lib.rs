use tari_template_abi::rust::collections::BTreeMap;
use tari_template_lib::prelude::*;

#[template]
mod xtm_market {
    use super::*;

    // Esmeralda runs approximately 72 epochs per day.
    const AUTO_RELEASE_EPOCHS: u64 = 14 * 72;

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
            })
            .with_access_rules(
                ComponentAccessRules::new()
                    .method("buy", rule!(allow_all))
                    .method("create_listing", rule!(allow_all))
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
            .with_owner_rule(OwnerRule::OwnedBySigner)
            .create()
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
        ) -> u64 {
            assert!(!title.is_empty(), "Title is required");
            assert!(usd_cents > 0, "USD reference must be positive");
            assert!(xtm_price.is_positive(), "XTM price must be positive");
            assert!(
                !delivery_public_key.is_empty(),
                "Delivery encryption key is required"
            );
            assert!(inventory > 0, "Inventory must be positive");

            let id = self.next_listing_id;
            self.next_listing_id += 1;
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

        // The owner-authorized oracle updates the USD reference; the XTM price stays fixed.
        pub fn update_usd_reference(&mut self, listing_id: u64, usd_cents: u64) {
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
            let total = listing.xtm_price + listing.shipping_xtm;
            assert_eq!(payment.amount(), total, "Payment amount is incorrect");
            let platform_fee = total * 3 / 100;
            let seller_proceeds = total - platform_fee;

            let order_id = self.next_order_id;
            self.next_order_id += 1;
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

        // Owner-only by the component's default access rule. A carrier integration or
        // marketplace operator records delivery before the 14-day clock begins.
        pub fn record_delivery(&mut self, order_id: u64) {
            let order = self.orders.get_mut(&order_id).expect("Order not found");
            assert!(order.shipped, "Order must be marked shipped first");
            assert!(!order.settled, "Order is already settled");
            assert!(!order.disputed, "Disputed orders cannot start auto-release");
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
                        (epoch + AUTO_RELEASE_EPOCHS).to_string(),
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
                let delivered = order
                    .delivery_recorded_epoch
                    .expect("Delivery has not been recorded");
                assert!(
                    Consensus::current_epoch() >= delivered + AUTO_RELEASE_EPOCHS,
                    "The 14-day release period has not ended"
                );
            }
            self.release_to_seller(order_id, "timeout_elapsed");
        }

        // A verified review combines the wallet-bound rating with a required
        // public buyer comment. This also supports orders released by timeout.
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
            let seller_key = {
                let order = self.orders.get(&order_id).expect("Order not found");
                assert_eq!(signer, order.buyer, "Only the buyer may rate this seller");
                assert!(
                    order.settled,
                    "The transaction must be completed before rating"
                );
                assert!(!order.refunded, "Refunded orders cannot be rated");
                order.seller_payment_address.to_string()
            };

            let trust = self
                .seller_trust
                .entry(seller_key.clone())
                .or_insert(SellerTrust {
                    total_stars: 0,
                    rating_count: 0,
                });
            trust.total_stars += stars;
            trust.rating_count += 1;
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
            trust.total_stars -= stars;
            trust.rating_count -= 1;
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
            {
                let order = self.orders.get(&order_id).expect("Order not found");
                assert!(order.disputed, "Order is not disputed");
                assert!(!order.settled, "Order is already settled");
            }
            if refund_buyer {
                let (total, buyer_refund_address) = {
                    let order = self.orders.get_mut(&order_id).expect("Order not found");
                    order.settled = true;
                    order.refunded = true;
                    (order.xtm_paid, order.buyer_refund_address.clone())
                };
                let refund = self.escrow_vault.withdraw(total);
                ComponentManager::get(buyer_refund_address).invoke("deposit", args![refund]);
                emit_event(
                    "xtm_market.escrow_refunded",
                    Metadata::from_iter([
                        ("order_id", order_id.to_string()),
                        ("xtm_refunded", total.to_string()),
                    ]),
                );
            } else {
                self.release_to_seller(order_id, "dispute_resolved_for_seller");
            }
        }

        fn release_to_seller(&mut self, order_id: u64, reason: &str) {
            let (total, platform_fee, seller_payment_address) = {
                let order = self.orders.get_mut(&order_id).expect("Order not found");
                assert!(!order.settled, "Order is already settled");
                order.settled = true;
                (
                    order.xtm_paid,
                    order.platform_fee,
                    order.seller_payment_address.clone(),
                )
            };
            let mut payment = self.escrow_vault.withdraw(total);
            ComponentManager::get(self.platform_payment_address.clone())
                .invoke("deposit", args![payment.take(platform_fee)]);
            ComponentManager::get(seller_payment_address).invoke("deposit", args![payment]);
            emit_event(
                "xtm_market.escrow_released",
                Metadata::from_iter([
                    ("order_id", order_id.to_string()),
                    ("xtm_released", total.to_string()),
                    ("reason", reason.to_string()),
                ]),
            );
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
