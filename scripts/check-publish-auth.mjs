#!/usr/bin/env node
// Release preflight: prove this workflow can publish EVERY public workspace
// package through npm trusted publishing (GitHub OIDC) before semantic-release
// creates a tag or pushes a release commit.
//
// Why: when npm cannot exchange the workflow's OIDC token for a package it
// silently falls back to anonymous and fails with ENEEDAUTH at publish time.
// That happened to @faircopy/templ (1.22.0) and @faircopy/go (1.23.0), both
// brand-new packages with no trusted publisher, after half the set had already
// published. Trusted publishing cannot create a package, so a new package must
// be published once by a maintainer and then given a trusted publisher on
// npmjs.com (package Settings -> Trusted Publisher -> GitHub Actions,
// repository omniaura/faircopy, workflow publish.yml).
//
// The exchange mints a short-lived publish token; this script discards it
// without printing it and publishes nothing.
import { escapeName, listPublicPackages, registry } from './workspace-packages.mjs'

const { ACTIONS_ID_TOKEN_REQUEST_URL: requestUrl, ACTIONS_ID_TOKEN_REQUEST_TOKEN: requestToken } = process.env

if (!requestUrl || !requestToken) {
  console.error('No GitHub OIDC token is available. Run this inside the Release workflow with `permissions: id-token: write`.')
  process.exit(1)
}

const getIdToken = async () => {
  const url = new URL(requestUrl)
  url.searchParams.set('audience', 'npm:registry.npmjs.org')
  const response = await fetch(url, { headers: { Authorization: `Bearer ${requestToken}` } })
  if (!response.ok) throw new Error(`GitHub OIDC token request failed: ${response.status} ${response.statusText}`)
  const { value } = await response.json()
  if (!value) throw new Error('GitHub OIDC token response had no value')
  return value
}

const describeFailure = async (response) => {
  let detail = ''
  try {
    const body = await response.json()
    detail = body.error || body.message || JSON.stringify(body)
  } catch {
    // Non-JSON error bodies carry nothing more useful than the status.
  }
  return `${response.status} ${response.statusText}${detail ? `: ${String(detail).slice(0, 200)}` : ''}`
}

const packages = listPublicPackages()
const problems = []

for (const { name } of packages) {
  const escaped = escapeName(name)

  const packument = await fetch(`${registry}/${escaped}`, { method: 'HEAD' })
  if (packument.status === 404) {
    problems.push(`${name}: not on npm yet. Trusted publishing cannot create a package; a maintainer must publish its first version, then add a trusted publisher at https://www.npmjs.com/package/${name}/access (GitHub Actions, omniaura/faircopy, workflow publish.yml).`)
    continue
  }

  const exchange = await fetch(`${registry}/-/npm/v1/oidc/token/exchange/package/${escaped}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getIdToken()}` },
  })
  if (exchange.ok) {
    await exchange.body?.cancel()
    console.log(`ok   ${name}: trusted publishing token exchange succeeded`)
  } else {
    const reason = await describeFailure(exchange)
    console.log(`FAIL ${name}: ${reason}`)
    problems.push(`${name}: OIDC token exchange failed (${reason}). Add or fix its trusted publisher at https://www.npmjs.com/package/${name}/access (GitHub Actions, omniaura/faircopy, workflow publish.yml).`)
  }
}

if (problems.length > 0) {
  console.error(`\nRelease preflight failed for ${problems.length} of ${packages.length} packages; nothing was tagged or published:`)
  for (const problem of problems) console.error(`- ${problem}`)
  process.exit(1)
}

console.log(`\nRelease preflight passed: all ${packages.length} packages can publish through trusted publishing.`)
