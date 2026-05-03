#!/usr/bin/env node
// Publishes every public workspace package at the same version, replacing
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

const packageDirs = readdirSync('packages').sort()
const publishedPackages = []

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isPublished = async (name) => {
  const encodedName = name.replace('/', '%2f')
  const url = `https://registry.npmjs.org/${encodedName}/${version}`
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.status === 404) return false
      if (response.ok) return true
      if (attempt === 6) {
        throw new Error(`npm registry check failed for ${name}@${version}: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      if (attempt === 6) {
        throw new Error(`npm registry check failed for ${name}@${version}: ${error.message}`)
      }
    }
    await sleep(1000 * attempt)
  }
  return false
}

const publishPackage = (dir) => {
  try {
    execSync('npm publish --access public --provenance', {
      cwd: join('packages', dir),
      stdio: 'inherit',
    })
  } catch (error) {
    throw new Error(`Failed to publish packages/${dir}: ${error.message}`)
  }
}

const getWorkspaceDeps = (pkg, packageNames) => {
  const deps = {
    ...pkg.dependencies,
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
  }

  return Object.entries(deps)
    .filter(([name, range]) => (
      typeof range === 'string' && range.startsWith('workspace:') && packageNames.has(name)
    ))
    .map(([name]) => name)
    .sort()
}

const sortPackagesForPublish = (packages) => {
  const packageNames = new Set(packages.map(pkg => pkg.name))
  const packageByName = new Map(packages.map(pkg => [pkg.name, pkg]))
  const sorted = []
  const visiting = new Set()
  const visited = new Set()

  const visit = (pkg, path = []) => {
    if (visited.has(pkg.name)) return
    if (visiting.has(pkg.name)) {
      throw new Error(`Workspace dependency cycle detected: ${[...path, pkg.name].join(' -> ')}`)
    }

    visiting.add(pkg.name)
    for (const depName of getWorkspaceDeps(pkg.manifest, packageNames)) {
      visit(packageByName.get(depName), [...path, pkg.name])
    }
    visiting.delete(pkg.name)
    visited.add(pkg.name)
    sorted.push(pkg)
  }

  for (const pkg of packages) visit(pkg)
  return sorted
}

const packages = []
for (const dir of packageDirs) {
  const pkgPath = join('packages', dir, 'package.json')
  try { statSync(pkgPath) } catch { continue }

  const original = readFileSync(pkgPath, 'utf8')
  const pkg = JSON.parse(original)
  if (pkg.private) continue
  packages.push({ dir, manifest: pkg, name: pkg.name, original, pkgPath })
}

for (const { dir, manifest: pkg, original, pkgPath } of sortPackagesForPublish(packages)) {
  publishedPackages.push(pkg.name)

  if (await isPublished(pkg.name)) {
    console.log(`${pkg.name}@${version} is already published; skipping.`)
    continue
  }

  const patched = {
    ...pkg,
    dependencies: replaceWorkspace(pkg.dependencies),
    peerDependencies: replaceWorkspace(pkg.peerDependencies),
    optionalDependencies: replaceWorkspace(pkg.optionalDependencies),
  }

  writeFileSync(pkgPath, JSON.stringify(patched, null, 2) + '\n')
  try {
    console.log(`Publishing ${pkg.name}@${version}...`)
    publishPackage(dir)
  } finally {
    writeFileSync(pkgPath, original)
  }
}

const missing = []
for (const name of publishedPackages) {
  if (!(await isPublished(name))) missing.push(name)
}
if (missing.length > 0) {
  console.error(`Missing published packages for ${version}: ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`Published ${publishedPackages.length} faircopy packages at ${version}.`)
