#!/usr/bin/env node
/**
 * Temporarily unlock content paths in .shopifyignore, run a Shopify CLI command, restore.
 *
 * Usage:
 *   node scripts/with-content-unlocked.mjs pull --theme "ON DEV 2" --only templates ...
 *   node scripts/with-content-unlocked.mjs -- templates/**  (raw passthrough after --)
 */

import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ignorePath = resolve(root, '.shopifyignore')
const backupPath = resolve(root, '.shopifyignore.content-unlock.bak')

const CONTENT_RULES = new Set([
  'config/settings_data.json',
  'sections/*-group.json',
  'templates/**/*.json',
])

const cliArgs = process.argv.slice(2)
if (!cliArgs.length) {
  console.error('Usage: node scripts/with-content-unlocked.mjs <shopify theme args...>')
  process.exit(1)
}

const original = readFileSync(ignorePath, 'utf8')
copyFileSync(ignorePath, backupPath)

const unlocked = original
  .split('\n')
  .filter((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return true
    return !CONTENT_RULES.has(trimmed)
  })
  .join('\n')

try {
  writeFileSync(ignorePath, unlocked)
  console.log('> content lock temporarily disabled')
  const result = spawnSync('npx', ['shopify', 'theme', ...cliArgs], {
    cwd: root,
    stdio: 'inherit',
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
} finally {
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, ignorePath)
    unlinkSync(backupPath)
  }
  console.log('> content lock restored')
}
