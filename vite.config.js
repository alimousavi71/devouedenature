import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Single production JS bundle for Shopify: assets/theme.js (IIFE).
// GSAP is imported from npm in src/ and bundled here — never copied into assets/.
export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    sourcemap: false,
    minify: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/js/main.js'),
      output: {
        format: 'iife',
        entryFileNames: 'theme.js',
      },
    },
  },
})
