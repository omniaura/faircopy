// Loaded only by subprocess regression tests. No real network or publishing.
import childProcess from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { join } from 'node:path'

const scenario = JSON.parse(process.env.FAIRCOPY_RELEASE_TEST_SCENARIO)
const trace = event => appendFileSync(process.env.FAIRCOPY_RELEASE_TEST_TRACE, JSON.stringify(event) + '\n')
const published = new Set(scenario.published ?? [])
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input)
  const name = decodeURIComponent(url.pathname.replace('/-/npm/v1/oidc/token/exchange/package/', '').replace(/^\//, '').replace(/\/\d+\.\d+\.\d+$/, ''))
  trace({ kind: 'fetch', origin: url.origin, name, method: options.method ?? 'GET' })
  if (url.origin === 'https://oidc.example') {
    if (url.searchParams.get('audience') !== 'npm:registry.npmjs.org') throw new Error('Wrong OIDC audience')
    return Response.json({ value: 'fake-id-token-must-not-be-logged' })
  }
  if (url.origin !== 'https://registry.npmjs.org') throw new Error('Unexpected network destination')
  if (options.method === 'HEAD') return new Response(null, { status: scenario.newPackage === name ? 404 : 200 })
  if (options.method === 'POST') {
    if (options.headers.Authorization !== 'Bearer fake-id-token-must-not-be-logged') throw new Error('Wrong token')
    return scenario.denied === name
      ? Response.json({ error: 'OIDC token exchange error - package not found' }, { status: 404 })
      : Response.json({ token: 'fake-publish-token-must-not-be-logged' })
  }
  if (scenario.registryFailure === name) return new Response(null, { status: 503, statusText: 'Service Unavailable' })
  return new Response(null, { status: published.has(name) && scenario.neverVisible !== name ? 200 : 404 })
}
childProcess.execSync = (command, options) => {
  if (command !== 'npm publish --access public --provenance') throw new Error('Unexpected command')
  const manifest = JSON.parse(readFileSync(join(options.cwd, 'package.json'), 'utf8'))
  trace({ kind: 'publish', name: manifest.name, manifest })
  if (scenario.publishFailure === manifest.name) throw new Error('npm ENEEDAUTH')
  published.add(manifest.name)
}
syncBuiltinESMExports()
globalThis.setTimeout = callback => { queueMicrotask(callback); return 0 }
