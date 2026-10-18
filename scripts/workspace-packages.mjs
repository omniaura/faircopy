// Shared helpers for the release scripts: the public workspace packages and
// the single lockstep version they are expected to share.
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export const registry = 'https://registry.npmjs.org'

// npm addresses a scoped package as "@scope%2fname" in registry URLs.
export const escapeName = (name) => name.replace('/', '%2f')

export const listPublicPackages = () => {
  const packages = []
  for (const dir of readdirSync('packages').sort()) {
    const pkgPath = join('packages', dir, 'package.json')
    try { statSync(pkgPath) } catch { continue }
    const original = readFileSync(pkgPath, 'utf8')
    const manifest = JSON.parse(original)
    if (manifest.private) continue
    packages.push({ dir, manifest, name: manifest.name, original, pkgPath })
  }
  return packages
}

// Returns the version every public package declares, or throws when they
// disagree: a lockstep release must never publish a mixed set.
export const lockstepVersion = (packages = listPublicPackages()) => {
  const versions = new Set(packages.map(pkg => pkg.manifest.version))
  if (versions.size !== 1) {
    const detail = packages.map(pkg => `${pkg.name}@${pkg.manifest.version}`).join(', ')
    throw new Error(`Workspace packages are not on one version: ${detail}`)
  }
  return [...versions][0]
}
