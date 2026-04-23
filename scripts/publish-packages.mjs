#!/usr/bin/env node
// Publishes each package via `npm publish --provenance`, replacing
// workspace:* deps with the release version before publish and restoring after.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const version = process.argv[2]
if (!version) { console.error('Usage: publish-packages.mjs <version>'); process.exit(1) }

const replaceWorkspace = (deps) => {
  if (!deps) return deps
  return Object.fromEntries(
    Object.entries(deps).map(([k, v]) => [k, v.startsWith('workspace:') ? version : v])
  )
}

for (const dir of readdirSync('packages')) {
  const pkgPath = join('packages', dir, 'package.json')
  try { statSync(pkgPath) } catch { continue }

  const original = readFileSync(pkgPath, 'utf8')
  const pkg = JSON.parse(original)
  if (pkg.private) continue

  const patched = {
    ...pkg,
    dependencies: replaceWorkspace(pkg.dependencies),
    peerDependencies: replaceWorkspace(pkg.peerDependencies),
    optionalDependencies: replaceWorkspace(pkg.optionalDependencies),
  }

  writeFileSync(pkgPath, JSON.stringify(patched, null, 2) + '\n')
  try {
    console.log(`Publishing ${pkg.name}@${version}...`)
    execSync('npm publish --provenance --access public', {
      cwd: join('packages', dir),
      stdio: 'inherit',
    })
  } finally {
    writeFileSync(pkgPath, original)
  }
}
