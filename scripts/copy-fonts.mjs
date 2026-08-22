#!/usr/bin/env node
/**
 * Copy only the latin woff2 files the theme needs from npm @fontsource
 * packages into assets/ so Shopify can serve them next to theme.css.
 */
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assets = join(root, 'assets')
mkdirSync(assets, { recursive: true })

const files = [
  'node_modules/@fontsource/syne/files/syne-latin-400-normal.woff2',
  'node_modules/@fontsource/syne/files/syne-latin-500-normal.woff2',
  'node_modules/@fontsource/syne/files/syne-latin-600-normal.woff2',
  'node_modules/@fontsource/syne/files/syne-latin-700-normal.woff2',
  'node_modules/@fontsource/jost/files/jost-latin-300-normal.woff2',
  'node_modules/@fontsource/jost/files/jost-latin-400-normal.woff2',
  'node_modules/@fontsource/jost/files/jost-latin-400-italic.woff2',
  'node_modules/@fontsource/jost/files/jost-latin-500-normal.woff2',
  'node_modules/@fontsource/jost/files/jost-latin-600-normal.woff2',
  'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
  'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
]

for (const rel of files) {
  const src = join(root, rel)
  const dest = join(assets, rel.split('/').pop())
  if (!existsSync(src)) {
    console.error(`Missing font source: ${rel}`)
    process.exit(1)
  }
  copyFileSync(src, dest)
  console.log(`font → assets/${rel.split('/').pop()}`)
}
