// Run with: npm run validate
// Checks public/data/developments.json against the editorial rules and exits
// with a non-zero code on errors, so a broken entry cannot be deployed.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validateDataset } from '../src/lib/validate.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (p: string) => JSON.parse(readFileSync(root + p, 'utf8'))

let items, config
try {
  items = read('public/data/developments.json')
  config = read('public/data/config.json')
} catch (e) {
  console.error('Could not parse the data files:', (e as Error).message)
  process.exit(1)
}

const issues = validateDataset(items, config)

// Country names must match the map so that map selection finds them.
const mapNames = new Set<string>(read('src/data/world-map.json').countries.map((c: { name: string }) => c.name))
for (const d of items) {
  for (const c of d.geography?.countries ?? []) {
    if (!mapNames.has(c)) issues.push({ id: d.id, level: 'warning', message: `country "${c}" does not match a map name; check spelling (see src/data/world-map.json)` })
  }
}
for (const i of issues) {
  console[i.level === 'error' ? 'error' : 'warn'](`${i.level.toUpperCase()}  ${i.id}: ${i.message}`)
}
const errors = issues.filter((i) => i.level === 'error').length
const warnings = issues.length - errors
console.log(`\n${items.length} developments checked: ${errors} error(s), ${warnings} warning(s).`)
process.exit(errors ? 1 : 0)
