use tari_template_abi::rust::collections::BTreeMap;
use tari_template_lib::prelude::*;

// The deployer receives no authority. Only the existing Tari Market owner's
// signing key may change this registry. It has no vaults or escrow access.
const OWNER: &str = "d6197976d6706266852488070238710d1ee24f49f5dcbb1b8543cf5ba05cf828";
const MARKETS: [&str; 4] = [
    "component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938",
    "component_1bf64f1ee50461e47dba27d7b24326f356f30121f10c16a60eb91c2ced275a9c",
    "component_2f28005895aac7dfa3efed328980ebc0ecd8b26c3c1e06945c249503ca149cf9",
    "component_9e106bbe0e74d4abd9585cc4e3cc148ce65b69fca16848b0f3dc647d03558e15",
];

fn validate(signer: &str, market: &str, id: u64, reason: &str) {
    assert_eq!(signer, OWNER, "Only the Tari Market owner may remove posts");
    assert!(MARKETS.contains(&market), "Unknown marketplace");
    assert!(id > 0 && id <= 9_007_199_254_740_991, "Invalid listing ID");
    assert!(!reason.trim().is_empty() && reason.len() <= 500, "Reason must be 1–500 bytes");
}

#[template]
mod tari_market_moderation {
    use super::*;

    pub struct TariMarketModeration {
        owner_signer: String,
        removed_posts: BTreeMap<String, String>,
    }

    impl TariMarketModeration {
        pub fn new() -> Component<Self> {
            Component::new(Self { owner_signer: OWNER.to_string(), removed_posts: BTreeMap::new() })
                .with_owner_rule(OwnerRule::None)
                .with_access_rules(ComponentAccessRules::new()
                    .method("remove_post", rule!(allow_all))
                    .method("restore_post", rule!(allow_all)))
                .create()
        }

        pub fn remove_post(&mut self, market: ComponentAddress, listing_id: u64, reason: String) {
            let market = market.to_string();
            validate(&CallerContext::transaction_signer_public_key().to_string(), &market, listing_id, &reason);
            let key = format!("{}:{}", market, listing_id);
            assert!(!self.removed_posts.contains_key(&key), "Post already removed");
            self.removed_posts.insert(key.clone(), reason.clone());
            emit_event("tari_market.post_removed", Metadata::from_iter([("post", key), ("reason", reason)]));
        }

        pub fn restore_post(&mut self, market: ComponentAddress, listing_id: u64, reason: String) {
            let market = market.to_string();
            validate(&CallerContext::transaction_signer_public_key().to_string(), &market, listing_id, &reason);
            let key = format!("{}:{}", market, listing_id);
            assert!(self.removed_posts.remove(&key).is_some(), "Post is not removed");
            emit_event("tari_market.post_restored", Metadata::from_iter([("post", key), ("reason", reason)]));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn owner_can_moderate_supported_markets() { for market in MARKETS { validate(OWNER, market, 1, "Policy violation"); } }
    #[test] #[should_panic(expected="Only the Tari Market owner")] fn unrelated_signer_rejected() { validate("deployer", MARKETS[0], 1, "Spam"); }
    #[test] #[should_panic(expected="Unknown marketplace")] fn unknown_market_rejected() { validate(OWNER, "other", 1, "Spam"); }
    #[test] #[should_panic(expected="Invalid listing ID")] fn invalid_id_rejected() { validate(OWNER, MARKETS[0], 0, "Spam"); }
    #[test] #[should_panic(expected="Reason must")] fn empty_reason_rejected() { validate(OWNER, MARKETS[0], 1, " "); }
    #[test] #[should_panic(expected="Reason must")] fn oversized_reason_rejected() { validate(OWNER, MARKETS[0], 1, &"a".repeat(501)); }
}
