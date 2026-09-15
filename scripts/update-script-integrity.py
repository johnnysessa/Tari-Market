from pathlib import Path
import base64, hashlib, re
root = Path(__file__).resolve().parents[1]
page = root / 'dist/index.html'
html = page.read_text()
for name in ('app.js', 'tari-connector.js'):
    digest = base64.b64encode(hashlib.sha384((root / 'dist/assets' / name).read_bytes()).digest()).decode()
    pattern = r'(src="assets/' + re.escape(name) + r'" integrity=")sha384-[^"]+'
    html, count = re.subn(pattern, lambda m: m[1] + 'sha384-' + digest, html)
    assert count == 1, name
page.write_text(html)
