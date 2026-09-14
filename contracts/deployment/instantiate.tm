// Replace this placeholder with the v0.2 template address returned by the
// Esmeralda wallet after publishing contracts/artifacts/xtm_market.wasm.
// Do not use the superseded v0.1 template address.
use template_REPLACE_WITH_V0_2_TEMPLATE_ADDRESS as XtmMarket;

fn main() {
    XtmMarket::new(
        TARI,
        Address("component_6f33184eb2f3606248f78d54a9d466d5a520356f72d50c3febafa537286cf41c")
    );
}
