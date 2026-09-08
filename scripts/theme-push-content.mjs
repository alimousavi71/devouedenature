#!/usr/bin/env node
/**
 * Push Theme Editor JSON that is normally locked by .shopifyignore.
 *
 * Default: pull remote → local (safe sync down).
 * --no-pull: upload listed local files (rare; unlocks only those targets).
 *
 * Usage:
 *   npm run theme:push:content -- --theme "ON DEV 2" templates/page.about-us.json
 *   npm run theme:push:content -- --theme "ON DEV 2" --no-pull templates/page.about-us.json
 */

import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ignorePath = resolve(root, '.shopifyignore')
const backupPath = resolve(root, '.shopifyignore.content-push.bak')

const args = process.argv.slice(2)
const noPull = args.includes('--no-pull')
const filtered = args.filter((a) => a !== '--no-pull')

let theme = null
const rest = [...filtered]
const themeIdx = rest.indexOf('--theme')
if (themeIdx !== -1) {
  theme = rest[themeIdx + 1]
  rest.splice(themeIdx, 2)
}

const files = rest
  .filter((a) => !a.startsWith('-'))
  .map((f) => f.replace(/^\.\//, ''))

if (!files.length) {
  console.error(`
Content JSON is locked by .shopifyignore — normal push never overwrites Theme Editor data.

Usage:
  npm run theme:push:content -- --theme "ON DEV 2" templates/page.about-us.json
  npm run theme:push:content -- --theme "ON DEV 2" --no-pull templates/page.about-us.json

Prefer editing in Theme Editor, then: npm run theme:pull:content
`)
  process.exit(1)
}

function run(cmd, cmdArgs) {
  console.log(`\n> ${cmd} ${cmdArgs.join(' ')}\n`)
  const result = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const themeArgs = theme ? ['--theme', theme] : []

if (!noPull) {
  run('node', [
    'scripts/with-content-unlocked.mjs',
    'pull',
    ...themeArgs,
    ...files.flatMap((f) => ['--only', f]),
    '--force',
  ])
  console.log(`
Pulled remote content into local files.
If local files are already correct, upload with:

  npm run theme:push:content -- ${theme ? `--theme "${theme}" ` : ''}--no-pull ${files.join(' ')}
`)
  process.exit(0)
}

function walkJson(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkJson(p, acc)
    else if (name.endsWith('.json')) acc.push(relative(root, p))
  }
  return acc
}

const original = readFileSync(ignorePath, 'utf8')
copyFileSync(ignorePath, backupPath)

const targets = new Set(files)
let nextIgnore = original
  .split('\n')
  .filter((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return true
    if (trimmed === 'templates/**/*.json') return false
    if (trimmed === 'sections/*-group.json') {
      return !files.some((f) => /^sections\/.+-group\.json$/.test(f))
    }
    if (trimmed === 'config/settings_data.json') {
      return !files.includes('config/settings_data.json')
    }
    return !targets.has(trimmed)
  })
  .join('\n')

if (files.some((f) => f.startsWith('templates/') && f.endsWith('.json'))) {
  const others = walkJson(join(root, 'templates')).filter((f) => !targets.has(f))
  nextIgnore += `\n# temp: lock other templates during content push\n${others.join('\n')}\n`
}

try {
  writeFileSync(ignorePath, nextIgnore)
  const only = files.flatMap((f) => ['--only', f])
  run('npx', ['shopify', 'theme', 'push', ...themeArgs, ...only, '--force'])
} finally {
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, ignorePath)
    unlinkSync(backupPath)
  }
}

console.log('\nContent push done. .shopifyignore restored.')
