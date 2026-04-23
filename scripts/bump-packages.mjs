#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const version = process.argv[2]
if (!version) { console.error('Usage: bump-packages.mjs <version>'); process.exit(1) }

for (const dir of readdirSync('packages')) {
  const file = join('packages', dir, 'package.json')
  try { statSync(file) } catch { continue }
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  pkg.version = version
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`  ${pkg.name} → ${version}`)
}
