#!/usr/bin/env node
// Publishes every public workspace package at the same version, replacing
// workspace:* deps with the release version before publish and restoring after.
//
// Resumable: versions already on npm are skipped, so rerunning after a partial
// failure publishes only what is missing. With no argument it publishes the
// version the workspace packages already declare (the Release workflow's
// `resume` mode uses this after a failed release commit landed on main).
import { writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { escapeName, listPublicPackages, lockstepVersion } from './workspace-packages.mjs'

const allPackages = listPublicPackages()
const declaredVersion = lockstepVersion(allPackages)
const version = process.argv[2] || declaredVersion
if (version !== declaredVersion) {
  console.error(`Refusing to publish ${version}: the workspace packages declare ${declaredVersion}.`)
  process.exit(1)
}

const replaceWorkspace = (deps) => {
  if (!deps) return deps
  return Object.fromEntries(
    Object.entries(deps).map(([k, v]) => [k, v.startsWith('workspace:') ? version : v])
  )
}

const publishedPackages = []

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isPublished = async (name) => {
  const encodedName = escapeName(name)
  const url = `https://registry.npmjs.org/${encodedName}/${version}`
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
      if (response.status === 404) return false
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

// The npm registry serves package data through a CDN that can lag the
// publish by minutes. A fresh publish can 404 here even though it
// succeeded, so the post-publish check retries the 404 through that
// window instead of failing the release (the 1.20.0 and 1.21.0 runs
// both failed this way while every package had actually published).
const isPublishedEventually = async (name) => {
  const encodedName = escapeName(name)
  const url = `https://registry.npmjs.org/${encodedName}/${version}`
  const attempts = 30
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
      if (response.status !== 404 && response.status !== 403) {
        throw new Error(`npm registry check failed for ${name}@${version}: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      if (attempt === attempts) {
        throw new Error(`npm registry check failed for ${name}@${version}: ${error.message}`)
      }
    }
    await sleep(10000)
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

const pending = sortPackagesForPublish(allPackages).map(pkg => pkg.name)

const reportUnpublished = (failure) => {
  console.error(`\n${failure}`)
  console.error(`Not yet published at ${version}: ${pending.join(', ')}`)
  console.error('Fix the cause, then run the Release workflow from main with mode=resume;')
  console.error('it publishes only the versions that are still missing.')
}

for (const { dir, manifest: pkg, original, pkgPath } of sortPackagesForPublish(allPackages)) {
  publishedPackages.push(pkg.name)

  if (await isPublished(pkg.name)) {
    console.log(`${pkg.name}@${version} is already published; skipping.`)
    pending.shift()
    continue
  }

  const patched = {
    ...pkg,
    dependencies: replaceWorkspace(pkg.dependencies),
    peerDependencies: replaceWorkspace(pkg.peerDependencies),
    optionalDependencies: replaceWorkspace(pkg.optionalDependencies),
  }

  writeFileSync(pkgPath, JSON.stringify(patched, null, 2) + '\n')
  let failure
  try {
    console.log(`Publishing ${pkg.name}@${version}...`)
    publishPackage(dir)
    pending.shift()
  } catch (error) {
    failure = error.message
  } finally {
    writeFileSync(pkgPath, original)
  }
  if (failure) {
    reportUnpublished(failure)
    process.exit(1)
  }
}

const missing = []
for (const name of publishedPackages) {
  if (!(await isPublishedEventually(name))) missing.push(name)
}
if (missing.length > 0) {
  console.error(`Missing published packages for ${version}: ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`Published ${publishedPackages.length} faircopy packages at ${version}.`)
