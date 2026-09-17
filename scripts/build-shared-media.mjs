import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),dist=path.join(root,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.zip':'application/zip','.json':'application/json'};
const assets={};
function add(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())add(p);else{const key='/'+path.relative(dist,p).split(path.sep).join('/');assets[key]={type:types[path.extname(p)]||'application/octet-stream',bytes:fs.readFileSync(p).toString('base64')}}}}
add(path.join(dist,'assets'));add(path.join(dist,'downloads'));assets['/index.html']={type:types['.html'],bytes:fs.readFileSync(path.join(dist,'index.html')).toString('base64')};
assets.csp=fs.readFileSync(path.join(dist,'_headers'),'utf8').match(/Content-Security-Policy: (.+)/)[1];
fs.mkdirSync(path.join(dist,'server'),{recursive:true});fs.mkdirSync(path.join(dist,'.openai'),{recursive:true});
fs.writeFileSync(path.join(dist,'server/assets.mjs'),'export default '+JSON.stringify(assets)+';\n');
fs.copyFileSync(path.join(root,'worker/index.mjs'),path.join(dist,'server/index.js'));
fs.copyFileSync(path.join(root,'worker/media.mjs'),path.join(dist,'server/media.mjs'));
fs.copyFileSync(path.join(root,'.openai/hosting.json'),path.join(dist,'.openai/hosting.json'));
console.log('Built marketplace Worker, shared media API and '+(Object.keys(assets).length-1)+' static assets.');
