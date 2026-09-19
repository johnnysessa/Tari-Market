"""Build a reproducible, self-contained local test download from reviewed files."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / "dist/downloads/xtm-market-local.zip"
output.parent.mkdir(exist_ok=True)
files = [(root / "scripts/local-wallet.py", "start.py"),
         (root / "scripts/LOCAL-WALLET-START.txt", "START-HERE.txt"),
         (root / "LICENSE", "LICENSE"),
         (root / "LICENSE-MIT-LEGACY", "LICENSE-MIT-LEGACY"),
         (root / "LICENSING.md", "LICENSING.md"),
         (root / "wallet-browser/TARI-SDK-LICENSE", "TARI-SDK-LICENSE"),
         (root / "dist/index.html", "site/index.html")]
files.extend((p, "site/" + p.relative_to(root / "dist").as_posix())
             for p in sorted((root / "dist/assets").rglob("*")) if p.is_file())
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for path, name in files:
        info = zipfile.ZipInfo("Tari-Market-Local/" + name, (2026, 9, 15, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, path.read_bytes())
print("Packaged %d files: %s" % (len(files), output.name))
