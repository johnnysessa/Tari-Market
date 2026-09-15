"""Integration checks using a simulated walletd; never signs a real transaction."""
import copy
import http.client
import importlib.util
import json
from pathlib import Path
import threading
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("local_wallet", ROOT / "scripts/local-wallet.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
ADDRESS = "component_" + "a" * 64
TXID = "b" * 64


class FakeWallet(mod.Wallet):
    def __init__(self):
        super().__init__("tw_test_secret_never_exposed")
        self.calls = []
        self.status = "Pending"
        self.network_byte = 38
        self.auth_method = "webauthn"
        self.mutate = False
        self.lose_submit = False
        self.created_transaction = None

    def rpc(self, method, params):
        self.calls.append((method, copy.deepcopy(params)))
        if method == "auth.method":
            return {"method": self.auth_method}
        if method == "wallet.get_info":
            return {"network": "esmeralda", "network_byte": self.network_byte}
        if method == "accounts.get_default":
            return {"account": {"component_address": ADDRESS, "owner_key_id": {"Derived": {"key_index": 0}}}}
        if method == "transactions.detect_inputs":
            transaction = copy.deepcopy(params["transaction"])
            transaction["V1"]["inputs"] = [ADDRESS]
            transaction["V1"]["nonce"] = int(transaction["V1"]["nonce"])
            if self.mutate:
                transaction["V1"]["instructions"] = []
            return {"transaction": transaction}
        if method == "transaction_requests.create":
            self.created_transaction = params["transaction"]
            return {"request_id": 7}
        if method == "transaction_requests.get":
            return {"request": {"status": self.status, "transaction_id": TXID if self.status == "Submitted" else None}}
        if method == "transaction_requests.submit":
            assert self.status == "Approved"
            self.status = "Submitted"
            if self.lose_submit:
                raise mod.WalletError("Simulated lost response")
            return {"transaction_id": TXID}
        raise AssertionError("Unexpected upstream method: " + method)


def transaction():
    return {"transaction": {"V1": {"network": 38, "dry_run": False,
        "instructions": [{"CallMethod": {"method": "create_listing"}}], "inputs": [],
        "nonce": "1789488366123456789", "fee_instructions": [{"CallMethod": {
            "call": {"Address": ADDRESS}, "method": "pay_fee", "args": [{"Literal": "191388"}]}}]}},
        "seal_signer": {"Derived": {"key_index": 0}}, "other_signers": [], "signatures": [], "lock_ids": []}


class Tests(unittest.TestCase):
    def setUp(self):
        self.wallet = FakeWallet()

    def test_requires_separate_approval_and_no_duplicate_submit(self):
        result = self.wallet.dispatch("tari_submitTransaction", transaction())
        self.assertEqual(result, {"approval_request_id": 7})
        self.assertEqual(self.wallet.check_request(7)["status"], "Pending")
        self.assertNotIn("transaction_requests.submit", [m for m, _ in self.wallet.calls])
        self.wallet.status = "Approved"
        self.assertEqual(self.wallet.check_request(7)["transaction_id"], TXID)
        self.wallet.check_request(7)
        self.assertEqual([m for m, _ in self.wallet.calls].count("transaction_requests.submit"), 1)
        self.assertEqual(self.wallet.created_transaction["V1"]["nonce"], 1789488366123456789)

    def test_rejection_does_not_submit(self):
        self.wallet.create_request(transaction())
        self.wallet.status = "Rejected"
        self.assertEqual(self.wallet.check_request(7)["status"], "Rejected")
        self.assertNotIn("transaction_requests.submit", [m for m, _ in self.wallet.calls])

    def test_lost_submission_response_recovers_same_transaction(self):
        self.wallet.create_request(transaction())
        self.wallet.status, self.wallet.lose_submit = "Approved", True
        with self.assertRaises(mod.WalletError):
            self.wallet.check_request(7)
        self.assertEqual(self.wallet.check_request(7)["transaction_id"], TXID)
        self.assertEqual([m for m, _ in self.wallet.calls].count("transaction_requests.submit"), 1)

    def test_blocked_methods_and_foreign_request(self):
        for method in ("transaction_requests.approve", "transactions.submit", "accounts.transfer", "auth.create_api_key"):
            with self.assertRaises(mod.WalletError):
                self.wallet.dispatch(method, {})
        with self.assertRaises(mod.WalletError):
            self.wallet.check_request(99)
        self.assertEqual(self.wallet.calls, [])

    def test_network_key_fee_and_detection_integrity(self):
        for mutation in ("auth", "network", "key", "fee", "detect"):
            with self.subTest(mutation=mutation):
                wallet = FakeWallet()
                params = transaction()
                if mutation == "auth": wallet.auth_method = "none"
                if mutation == "network": wallet.network_byte = 0
                if mutation == "key": params["seal_signer"] = "other"
                if mutation == "fee": params["transaction"]["V1"]["fee_instructions"] = []
                if mutation == "detect": wallet.mutate = True
                with self.assertRaises(mod.WalletError): wallet.create_request(params)
                self.assertNotIn("transaction_requests.create", [m for m, _ in wallet.calls])

    def test_second_pending_transaction_is_blocked(self):
        self.wallet.create_request(transaction())
        with self.assertRaises(mod.WalletError): self.wallet.create_request(transaction())
        self.assertEqual([m for m, _ in self.wallet.calls].count("transaction_requests.create"), 1)

    def test_local_http_boundary_and_secret_isolation(self):
        server = mod.LocalServer(ROOT / "dist", self.wallet, ("127.0.0.1", 0))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        def send(method, path, headers=None, body=None):
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port)
            connection.request(method, path, body=body, headers={"Host": "localhost:5180", **(headers or {})})
            response = connection.getresponse()
            result = response.status, response.read(), dict(response.getheaders())
            connection.close()
            return result
        try:
            self.assertEqual(send("GET", "/")[0], 200)
            for path in ("/../scripts/local-wallet.py", "/assets/../../README.md", "/assets/%2e%2e/%2e%2e/README.md"):
                self.assertEqual(send("GET", path)[0], 404)
            self.assertEqual(send("GET", "/", {"Host": "evil.test:5180"})[0], 403)
            self.assertEqual(send("OPTIONS", "/local-wallet/rpc")[0], 403)
            self.assertEqual(send("GET", "/local-wallet/session")[0], 403)
            self.assertEqual(send("GET", "/local-wallet/session", {"X-XTM-Local": "1", "Origin": "https://evil.test"})[0], 403)
            _, payload, headers = send("GET", "/local-wallet/session", {"X-XTM-Local": "1", "Sec-Fetch-Site": "same-origin"})
            token = json.loads(payload)["session"]
            self.assertNotIn("tw_test", payload.decode())
            self.assertNotIn("Access-Control-Allow-Origin", headers)
            body = json.dumps({"method": "tari_getDefaultAccount", "params": {}})
            auth = {"Origin": mod.ORIGIN, "X-XTM-Local": "1", "X-XTM-Session": token, "Content-Type": "application/json"}
            self.assertEqual(send("POST", "/local-wallet/rpc", auth, body)[0], 200)
            self.assertEqual(send("POST", "/local-wallet/rpc", {**auth, "Origin": "https://evil.test"}, body)[0], 403)
            self.assertEqual(send("POST", "/local-wallet/rpc", {**auth, "X-XTM-Session": "wrong"}, body)[0], 403)
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    unittest.main()
