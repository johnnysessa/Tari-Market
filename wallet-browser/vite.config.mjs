import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
export default defineConfig({plugins:[wasm()],build:{target:'esnext',outDir:'../dist/assets/test-wallet',emptyOutDir:true,lib:{entry:'wallet.js',formats:['es'],fileName:()=> 'wallet.js'},rollupOptions:{output:{assetFileNames:'[name][extname]'}}}});
