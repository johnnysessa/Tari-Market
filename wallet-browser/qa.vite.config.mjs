import {defineConfig} from 'vite';
import wasm from 'vite-plugin-wasm';
export default defineConfig({plugins:[wasm()],build:{target:'esnext',outDir:'/tmp/xtm-contract-qa',emptyOutDir:true,lib:{entry:'qa-sdk.js',formats:['es'],fileName:()=> 'sdk.mjs'}}});
