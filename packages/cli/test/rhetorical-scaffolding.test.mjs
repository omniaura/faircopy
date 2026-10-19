import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const astroUrl = new URL('../../astro/dist/index.js', import.meta.url).href
const ruleId = 'no-rhetorical-scaffolding'

async function lint(t, source, ruleConfig = 'error', format = 'json') {
  const cwd = await mkdtemp(path.join(tmpdir(), 'faircopy-scaffolding-'))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  await writeFile(path.join(cwd, 'fixture.astro'), source)
  await writeFile(path.join(cwd, 'faircopy.config.mjs'), `
    import { astro } from ${JSON.stringify(astroUrl)}
    export default {
      adapters: [astro()],
      rules: { ${JSON.stringify(ruleId)}: ${JSON.stringify(ruleConfig)} },
    }
  `)
  const result = spawnSync(process.execPath, [cli, 'lint', 'fixture.astro', '--format', format], {
    cwd, encoding: 'utf8', timeout: 15_000,
  })
  assert.ifError(result.error)
  assert.match(result.stderr, /^faircopy coverage: matched=1 inspected=1 segments=\d+ characters=\d+ unsupported=0 empty=0 rules=\d+\n$/)
  return result
}

test('CLI loads the canonical default rule and maps diagnostics to Astro source', async t => {
  const source = '<main>\n  <p>That distinction matters.</p>\n</main>'
  const result = await lint(t, source)
  assert.equal(result.status, 1)
  const diagnostics = JSON.parse(result.stdout)
  assert.equal(diagnostics.length, 1)
  const [diagnostic] = diagnostics
  assert.equal(diagnostic.ruleId, ruleId)
  assert.equal(diagnostic.severity, 'error')
  assert.deepEqual(diagnostic.range, { start: 12, end: 37 })
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), 'That distinction matters.')
  assert.match(diagnostic.message, /state the point directly/)
  assert.equal(diagnostic.suggest, undefined)
})

test('CLI reports line and column through the real adapter', async t => {
  const result = await lint(t, '<main>\n  <p>This difference matters.</p>\n</main>', 'error', 'compact')
  assert.equal(result.status, 1)
  assert.match(result.stdout, /fixture\.astro:2:6 error \[no-rhetorical-scaffolding\]/)
})

test('CLI applies configured severity and family opt-out', async t => {
  const source = '<p>That difference matters.</p>'
  const warning = await lint(t, source, 'warn')
  assert.equal(warning.status, 0)
  assert.equal(JSON.parse(warning.stdout)[0].severity, 'warn')
  for (const config of ['off', ['error', { allowImportanceAnnouncements: true }]]) {
    const result = await lint(t, source, config)
    assert.equal(result.status, 0)
    assert.deepEqual(JSON.parse(result.stdout), [])
  }
})

test('CLI respects rule-specific inline suppression and preserves substantive copy', async t => {
  const source = [
    '<!-- faircopy-ignore-next-line no-rhetorical-scaffolding -->',
    '<p>That distinction matters.</p>',
    '<p>This distinction matters because only owners can change the file.</p>',
    '<p>This difference matters.</p>',
  ].join('\n')
  const result = await lint(t, source)
  assert.equal(result.status, 1)
  const diagnostics = JSON.parse(result.stdout)
  assert.equal(diagnostics.length, 1)
  assert.equal(source.slice(diagnostics[0].range.start, diagnostics[0].range.end), 'This difference matters.')
})
