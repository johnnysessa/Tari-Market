#!/usr/bin/env python3
"""Run Tari Market locally with walletd's separately approved transaction requests.

Python 3.9+; standard library only. The wallet API key stays in this process.
Only a no-fee simulation is signed before approval. The helper never approves
a request or submits a real transaction through a direct-submit endpoint.
"""
import getpass
import json
import mimetypes
import re
import secrets
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ORIGIN = "http://localhost:5180"
WALLET_URL = "http://127.0.0.1:5100/json_rpc"
MARKET_COMPONENT = "component_cade995859ea67035bed27bfc95dfca41e26914f529b862bf2def5467b706938"
MAX_BODY = 512 * 1024
PERMISSIONS = "accounts:read, transactions:read, transaction_requests:create, transaction_requests:read"


class WalletError(Exception):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise WalletError("Wallet redirects are not allowed.")


class Wallet:
    def __init__(self, api_key):
        self._api_key = api_key
        self._http = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        self._lock = threading.Lock()
        self._requests = set()
        self._pending = None
        self._uncertain = False

    def rpc(self, method, params):
        data = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
        req = urllib.request.Request(WALLET_URL, data, {
            "Content-Type": "application/json", "Authorization": "Bearer " + self._api_key,
        })
        try:
            with self._http.open(req, timeout=25) as response:
                payload = response.read(4 * 1024 * 1024 + 1)
            if len(payload) > 4 * 1024 * 1024:
                raise WalletError("Wallet response was too large.")
            result = json.loads(payload)
            if result.get("error"):
                message = str(result["error"].get("message", "Wallet rejected the request."))
                raise WalletError(message.replace(self._api_key, "[redacted]")[:500])
            if "result" not in result:
                raise WalletError("Unexpected wallet response.")
            return result["result"]
        except urllib.error.HTTPError as error:
            raise WalletError("Wallet HTTP error %s. Check the API key and its permissions." % error.code) from None
        except (urllib.error.URLError, TimeoutError, OSError, ValueError):
            raise WalletError("Could not reach Asset Vault at localhost:5100. Keep its terminal running.") from None

    def network(self):
        if self.rpc("auth.method", {}).get("method") != "webauthn":
            raise WalletError("Asset Vault must have passkey authentication enabled. Restart walletd with --network esme --auth webauthn.")
        info = self.rpc("wallet.get_info", {})
        if info.get("network_byte") != 38 or str(info.get("network", "")).lower() != "esmeralda":
            raise WalletError("This launcher requires an Esmeralda wallet (network 38).")
        return info

    def dispatch(self, method, params):
        # There is deliberately no generic JSON-RPC proxy.
        if method == "tari_getWalletInfo":
            return self.network()
        if method == "tari_getDefaultAccount":
            self.network()
            return self.rpc("accounts.get_default", {})
        if method == "tari_getTransactionResult":
            txid = params.get("transaction_id", "")
            if not isinstance(txid, str) or not re.fullmatch(r"[0-9a-f]{64}", txid):
                raise WalletError("Invalid transaction ID.")
            return self.rpc("transactions.get_result", {"transaction_id": txid})
        if method == "tari_submitTransaction":
            return self.create_request(params)
        if method == "local_getApproval":
            return self.check_request(params.get("request_id"))
        raise WalletError("This operation is not available through the local connector.")

    def create_request(self, params):
        with self._lock:
            started = time.monotonic()
            self.network()
            if self._uncertain:
                raise WalletError("A previous request has an uncertain result. Check Asset Vault Requests and Transactions before restarting the launcher.")
            if self._pending is not None:
                prior = self.rpc("transaction_requests.get", {"request_id": self._pending})["request"]
                if prior["status"] not in ("Rejected", "Expired", "Submitted"):
                    raise WalletError("Finish or reject request %s in Asset Vault before creating another." % self._pending)
                self._pending = None
            account_result = self.rpc("accounts.get_default", {})
            account = account_result.get("account", account_result)
            tx = params.get("transaction")
            if not isinstance(tx, dict) or set(tx) != {"V1"} or not isinstance(tx["V1"], dict):
                raise WalletError("Expected a V1 transaction.")
            body = tx["V1"]
            if body.get("network") != 38 or body.get("dry_run") is not False:
                raise WalletError("Only Esmeralda transactions are supported.")
            if params.get("seal_signer") != account.get("owner_key_id") or not account.get("owner_key_id"):
                raise WalletError("The default account changed. Reconnect your wallet.")
            if any(params.get(name) for name in ("other_signers", "signatures", "lock_ids")):
                raise WalletError("Additional signers or external input locks are not supported.")
            expected_fee = [{"CallMethod": {"call": {"Address": account["component_address"]},
                "method": "pay_fee", "args": [{"Literal": "194e20"}]}}]
            if body.get("fee_instructions") != expected_fee:
                raise WalletError("Network fee must be capped at 0.02 tTari from the connected account.")
            if not isinstance(body.get("instructions"), list) or not 1 <= len(body["instructions"]) <= 16:
                raise WalletError("Invalid instruction count.")
            # The reviewed v0.12 create_listing only changes marketplace state.
            # It never deposits into another account. One detection pass is enough
            # if the exact resulting transaction also passes simulation below.
            calls = body["instructions"]
            call = calls[0].get("CallMethod") if len(calls) == 1 and isinstance(calls[0], dict) else None
            listing_only = (isinstance(call, dict) and call.get("method") == "create_listing" and
                            call.get("call") == {"Address": MARKET_COMPONENT})
            detected = self.resolve_inputs(tx, expand=not listing_only)
            # Simulate this exact input set; never let simulation silently repair it.
            # walletd v0.40 authorizes this non-finalizing endpoint with transactions:read.
            simulation = self.rpc("transactions.submit_dry_run", {
                "transaction": detected, "seal_signer": account["owner_key_id"],
                "other_signers": [], "signatures": [], "lock_ids": [],
                "detect_inputs": False, "detect_inputs_use_unversioned": True,
            })
            outcome = simulation.get("result", {}).get("finalize", {}).get("result")
            if not isinstance(outcome, dict) or set(outcome) != {"Accept"}:
                raise WalletError("Transaction simulation failed. No approval request was created and no network fee was charged. " +
                                  json.dumps(outcome, ensure_ascii=True)[:300])
            required = simulation.get("required_fees")
            if type(required) is not int or not 0 <= required <= 20000:
                raise WalletError("The simulation could not confirm the 0.02 tTari fee limit. Nothing was submitted.")
            request = {"transaction": detected, "seal_signer": account["owner_key_id"],
                "other_signers": [], "signatures": [], "lock_ids": [], "ttl_secs": 600}
            if time.monotonic() - started > 90:
                raise WalletError("Transaction preparation took too long. No approval request was created. Refresh and try again.")
            # A lost create response must never trigger an automatic duplicate.
            self._uncertain = True
            result = self.rpc("transaction_requests.create", request)
            request_id = result["request_id"]
            if type(request_id) is not int or request_id < 0:
                raise WalletError("Unexpected approval request ID. Check Asset Vault.")
            self._requests.add(request_id)
            self._pending = request_id
            self._uncertain = False
            return {"approval_request_id": request_id}

    def resolve_inputs(self, transaction, expand=True):
        """Expand indirect account dependencies before freezing the approval request.

        walletd v0.40 includes component references without recursively expanding
        their vaults. Feeding detected inputs back makes those accounts roots.
        Bound the traversal and fail closed if it cannot reach a stable set.
        Listing creation may stop after one pass, but must still pass simulation.
        """
        def instructions(tx):
            if not isinstance(tx, dict) or set(tx) != {"V1"} or not isinstance(tx["V1"], dict):
                raise WalletError("Unexpected input detection response.")
            body = {k: v for k, v in tx["V1"].items() if k != "inputs"}
            body["nonce"] = int(body.get("nonce", 0))
            return body

        def inputs(tx):
            rows = tx["V1"].get("inputs")
            if not isinstance(rows, list) or len(rows) > 256:
                raise WalletError("Transaction dependencies exceed the local connector limit.")
            ids = set()
            for row in rows:
                if (not isinstance(row, dict) or set(row) != {"substate_id", "version"} or
                        not isinstance(row["substate_id"], str) or row["version"] is not None):
                    raise WalletError("Unexpected transaction input format.")
                ids.add(row["substate_id"])
            return ids

        expected = instructions(transaction)
        previous = inputs(transaction)
        for _ in range(8):
            detected = self.rpc("transactions.detect_inputs", {
                "transaction": transaction, "use_unversioned": True,
            })["transaction"]
            if instructions(detected) != expected:
                raise WalletError("Input detection unexpectedly changed the transaction.")
            current = inputs(detected)
            if not previous.issubset(current):
                raise WalletError("Input detection removed a required transaction input.")
            if not expand or current == previous:
                return detected
            previous, transaction = current, detected
        raise WalletError("Could not finish resolving transaction dependencies. Nothing was submitted.")

    def check_request(self, request_id):
        with self._lock:
            if type(request_id) is not int or request_id not in self._requests:
                raise WalletError("This approval request does not belong to this launcher session.")
            self.network()
            request = self.rpc("transaction_requests.get", {"request_id": request_id})["request"]
            status = request["status"]
            if status == "Approved":
                # The daemon enforces approval and seals the frozen transaction atomically.
                # If the response is lost, the next poll reads the same request's status.
                result = self.rpc("transaction_requests.submit", {"request_id": request_id})
                return {"status": "Submitted", "transaction_id": result["transaction_id"]}
            return {"status": status, "transaction_id": request.get("transaction_id")}


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False

    def __init__(self, root, wallet, address=("127.0.0.1", 5180)):
        self.root = Path(root).resolve()
        self.wallet = wallet
        self.secret = secrets.token_urlsafe(32)
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, *args):
        pass  # No credentials, payloads, or account data in request logs.

    def reply(self, status, payload, mime="application/json"):
        if not isinstance(payload, bytes):
            payload = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "frame-ancestors 'none'")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(payload)

    def valid_host(self):
        # Reject DNS rebinding, alternate loopback names and forwarded hosts.
        return self.headers.get("Host") == "localhost:5180"

    def same_site(self):
        origin = self.headers.get("Origin")
        site = self.headers.get("Sec-Fetch-Site")
        return self.valid_host() and origin in (None, ORIGIN) and site in (None, "same-origin") and self.headers.get("X-XTM-Local") == "1"

    def do_OPTIONS(self):
        self.reply(403, {"error": "Cross-origin access is not allowed."})

    def do_GET(self):
        if not self.valid_host():
            self.reply(403, {"error": "Open http://localhost:5180 only."})
            return
        path = urlsplit(self.path).path
        if path == "/local-wallet/session":
            if not self.same_site():
                self.reply(403, {"error": "Same-origin request required."})
                return
            self.reply(200, {"session": self.server.secret})
            return
        relative = unquote(path).lstrip("/") or "index.html"
        target = (self.server.root / relative).resolve()
        if (relative != "index.html" and not relative.startswith("assets/")) or not target.is_relative_to(self.server.root) or not target.is_file():
            self.reply(404, {"error": "Not found."})
            return
        mime = "text/javascript" if target.suffix in (".js", ".mjs") else mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.reply(200, target.read_bytes(), mime)

    def do_POST(self):
        if self.path != "/local-wallet/rpc" or not self.same_site() or self.headers.get("Origin") != ORIGIN or not secrets.compare_digest(self.headers.get("X-XTM-Session", ""), self.server.secret):
            self.reply(403, {"error": "Local session or origin is invalid. Reload the local marketplace."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_BODY or self.headers.get("Transfer-Encoding") or self.headers.get("Content-Type") != "application/json":
                raise ValueError()
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict) or not isinstance(data.get("params", {}), dict):
                raise ValueError()
            result = self.server.wallet.dispatch(data.get("method"), data.get("params", {}))
            self.reply(200, {"result": result})
        except WalletError as error:
            self.reply(400, {"error": str(error)})
        except (ValueError, TypeError, KeyError):
            self.reply(400, {"error": "Invalid request or unexpected wallet response."})
        except Exception:
            self.reply(500, {"error": "Local connector failed. Check Asset Vault before retrying."})


def main():
    import sys
    if sys.version_info < (3, 9):
        raise SystemExit("Python 3.9 or newer is required.")
    if not sys.stdin.isatty():
        raise SystemExit("Run this launcher in an interactive Terminal so the API key stays hidden.")
    here = Path(__file__).resolve().parent
    root = here / "site" if (here / "site").is_dir() else here.parent / "dist"
    if not (root / "index.html").is_file():
        raise SystemExit("Keep this launcher beside its site folder, or inside the Tari Market scripts folder.")
    print("Tari Market — Esmeralda local test launcher\n")
    print("Keep Asset Vault running at http://localhost:5100 and sign in there.")
    print("Open its key icon (API Keys), create a short-lived key named Tari Market Local.")
    print("Select ONLY: " + PERMISSIONS)
    print("Do not grant Admin, transactions:create, or transaction_requests:approve.")
    print("Paste that API key below. It stays in memory here, never in the website or a file.\n")
    key = getpass.getpass("Wallet API key (typing is hidden): ").strip()
    if not key.startswith("tw_") or any(c.isspace() for c in key):
        raise SystemExit("Expected a tw_ API key from Asset Vault. Do not enter a seed phrase.")
    wallet = Wallet(key)
    try:
        wallet.network()
        wallet.rpc("accounts.get_default", {})
        wallet.rpc("transaction_requests.list", {"status": None})
        server = LocalServer(root, wallet)
    except (WalletError, OSError) as error:
        raise SystemExit(str(error)) from None
    print("\nOpen " + ORIGIN + ". Connect once; this browser reconnects to the same account on later visits.")
    print("Approve each transaction at http://localhost:5100/transaction-requests")
    print("Keep BOTH terminal windows running. Ctrl+C stops this launcher.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nLocal launcher stopped. Revoke the test API key in Asset Vault when finished.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
