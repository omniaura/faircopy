import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const hook = fileURLToPath(new URL('./fixtures/release-hook.mjs', import.meta.url))
const script = name => fileURLToPath(new URL(`../${name}.mjs`, import.meta.url))
const packages = [
  { dir: 'a-consumer', name: '@faircopy/consumer', dependencies: { '@faircopy/base': 'workspace:*', other: '^2.0.0' } },
  { dir: 'z-base', name: '@faircopy/base' },
]

async function run(t, entry, scenario = {}, args = []) {
  const cwd = await mkdtemp(join(tmpdir(), 'faircopy-release-test-'))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  const originals = new Map()
  for (const { dir, ...pkg } of [...packages, { dir: 'private', name: 'private-fixture', private: true }]) {
    const original = JSON.stringify({ version: '1.24.0', ...pkg }, null, 2) + '\n'
    const filename = join(cwd, 'packages', dir, 'package.json')
    await mkdir(join(cwd, 'packages', dir), { recursive: true })
    await writeFile(filename, original)
    originals.set(filename, original)
  }
  const traceFile = join(cwd, 'trace.jsonl')
  await writeFile(traceFile, '')
  const result = spawnSync(process.execPath, ['--import', hook, script(entry), ...args], {
    cwd, encoding: 'utf8', timeout: 10_000,
    env: {
      ...process.env,
      ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.example/token',
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fake-request-token-must-not-be-logged',
      FAIRCOPY_RELEASE_TEST_SCENARIO: JSON.stringify(scenario),
      FAIRCOPY_RELEASE_TEST_TRACE: traceFile,
    },
  })
  assert.ifError(result.error)
  for (const [filename, original] of originals) assert.equal(await readFile(filename, 'utf8'), original)
  const trace = (await readFile(traceFile, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  const output = result.stdout + result.stderr
  assert.doesNotMatch(output, /fake-(?:id|publish|request)-token-must-not-be-logged/)
  return { ...result, trace, output }
}

test('preflight checks every public package and never publishes', async t => {
  const result = await run(t, 'check-publish-auth')
  assert.equal(result.status, 0, result.output)
  assert.equal(result.trace.filter(event => event.method === 'POST').length, 2)
  assert.equal(result.trace.filter(event => event.kind === 'publish').length, 0)
  assert.match(result.output, /all 2 packages/)
})

test('preflight aggregates missing packages and mismatched publishers without token output', async t => {
  const result = await run(t, 'check-publish-auth', { denied: '@faircopy/base', newPackage: '@faircopy/consumer' })
  assert.equal(result.status, 1)
  assert.match(result.output, /failed for 2 of 2 packages/)
  assert.match(result.output, /nothing was tagged or published/)
  assert.match(result.output, /https:\/\/www.npmjs.com\/package\/@faircopy\/base\/access/)
  assert.match(result.output, /consumer: not on npm yet/)
  assert.equal(result.trace.filter(event => event.kind === 'publish').length, 0)
})

test('publishes in dependency order, rewrites workspace deps and restores manifests', async t => {
  const result = await run(t, 'publish-packages')
  assert.equal(result.status, 0, result.output)
  const published = result.trace.filter(event => event.kind === 'publish')
  assert.deepEqual(published.map(event => event.name), ['@faircopy/base', '@faircopy/consumer'])
  assert.deepEqual(published[1].manifest.dependencies, { '@faircopy/base': '1.24.0', other: '^2.0.0' })
  assert.match(result.output, /Published 2 faircopy packages at 1.24.0/)
})

test('resume skips versions already published and reports failures with restored manifests', async t => {
  const result = await run(t, 'publish-packages', { published: ['@faircopy/base'], publishFailure: '@faircopy/consumer' })
  assert.equal(result.status, 1)
  assert.deepEqual(result.trace.filter(event => event.kind === 'publish').map(event => event.name), ['@faircopy/consumer'])
  assert.match(result.output, /Not yet published at 1.24.0: @faircopy\/consumer/)
  assert.match(result.output, /mode=resume/)
})

test('refuses a version different from the committed workspace before any side effect', async t => {
  const result = await run(t, 'publish-packages', {}, ['1.25.0'])
  assert.equal(result.status, 1)
  assert.match(result.output, /Refusing to publish 1.25.0/)
  assert.deepEqual(result.trace, [])
})

test('registry lookup failure lists unconfirmed packages and the resume instruction', async t => {
  const result = await run(t, 'publish-packages', { registryFailure: '@faircopy/base' })
  assert.equal(result.status, 1)
  assert.match(result.output, /Not yet published at 1.24.0: @faircopy\/base, @faircopy\/consumer/)
  assert.match(result.output, /mode=resume/)
  assert.equal(result.trace.filter(event => event.kind === 'publish').length, 0)
})

test('failed post-publish visibility verification also provides recovery instructions', async t => {
  const result = await run(t, 'publish-packages', { neverVisible: '@faircopy/consumer' })
  assert.equal(result.status, 1)
  assert.match(result.output, /Missing published packages for 1.24.0: @faircopy\/consumer/)
  assert.match(result.output, /mode=resume/)
})
