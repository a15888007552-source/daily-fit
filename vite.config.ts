import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({base:'/daily-fit/',resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}}});
