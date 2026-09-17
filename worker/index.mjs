import {mediaFetch} from './media.mjs';
import assets from './assets.mjs';
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/listing-'))return mediaFetch(request,env);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const path=url.pathname==='/'?'/index.html':url.pathname,asset=assets[path];
 if(!asset)return new Response('Not found',{status:404});
 const headers={'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
 if(asset.type.startsWith('text/html'))headers['Content-Security-Policy']=assets.csp;
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.bytes),c=>c.charCodeAt(0)),{headers});
}};
