#!/usr/bin/env node
// Updates version field in all packages/*/package.json files.
// Usage: node scripts/bump-packages.mjs <version>
import { readFileSync, writeFileSync } from 'fs'
import { globSync } from 'glob'

const version = process.argv[2]
if (!version) { console.error('Usage: bump-packages.mjs <version>'); process.exit(1) }

for (const file of globSync('packages/*/package.json')) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  pkg.version = version
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  ${pkg.name} → ${version}`)
}
