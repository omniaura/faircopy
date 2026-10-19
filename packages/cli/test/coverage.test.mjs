import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const markdownUrl = new URL('../../markdown/dist/index.js', import.meta.url).href

async function fixture(t, { files = ['*.md'], ignore = [], adapters = '[markdown()]' } = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'faircopy-coverage-'))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  await writeFile(path.join(cwd, 'faircopy.config.mjs'), `
    import { markdown } from ${JSON.stringify(markdownUrl)}
    export default {
      files: ${JSON.stringify(files)}, ignore: ${JSON.stringify(ignore)},
      adapters: ${adapters}, rules: { 'no-weasel-words': 'error' },
    }
  `)
  const run = (...args) => {
    const result = spawnSync(process.execPath, [cli, 'lint', ...args], { cwd, encoding: 'utf8', timeout: 15_000 })
    assert.ifError(result.error)
    return result
  }
  return { cwd, run }
}

test('zero matching files and ignored files exit 2 without a clean claim in every format', async t => {
  const { cwd, run } = await fixture(t, { ignore: ['ignored.md'] })
  await writeFile(path.join(cwd, 'ignored.md'), 'Actually excluded.')
  for (const format of ['pretty', 'json', 'github', 'compact', 'agent-compact']) {
    const result = run('--format', format, '--quiet')
    assert.equal(result.status, 2, result.stderr)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /matched=0 inspected=0 segments=0 characters=0/)
    assert.match(result.stderr, /no prose inspected/)
  }
})

test('explicit unsupported Markdown, missing adapters and MDX never produce a clean claim', async t => {
  const { cwd, run } = await fixture(t, { adapters: '[]' })
  await writeFile(path.join(cwd, 'article.md'), 'Actually missed before.')
  let result = run('article.md')
  assert.equal(result.status, 2)
  assert.match(result.stderr, /no adapter supports .*article\.md/)
  assert.match(result.stderr, /matched=1 inspected=0 .*unsupported=1/)
  assert.doesNotMatch(result.stdout, /No issues|errors=0/)
  const mdx = await fixture(t)
  await writeFile(path.join(mdx.cwd, 'article.mdx'), '<Component>Actually</Component>')
  result = mdx.run('article.mdx')
  assert.equal(result.status, 2)
  assert.match(result.stderr, /no adapter supports .*article\.mdx/)
})

test('frontmatter and code alone exit 2 with zero extracted prose', async t => {
  const { cwd, run } = await fixture(t)
  await writeFile(path.join(cwd, 'empty.md'), '---\ntitle: Actually\n---\n\n```txt\nReally\n```\n')
  const result = run('--format', 'json')
  assert.equal(result.status, 2)
  assert.equal(result.stdout, '')
  assert.match(result.stderr, /no prose extracted from .*empty\.md/)
  assert.match(result.stderr, /matched=1 inspected=0 segments=0 characters=0 unsupported=0 empty=1/)
})

test('mixed supported and unsupported files fail coverage; empty supported files are visible', async t => {
  const { cwd, run } = await fixture(t, { files: ['*'] })
  await writeFile(path.join(cwd, 'clean.md'), 'Clear copy.')
  await writeFile(path.join(cwd, 'empty.md'), '```txt\nActually\n```')
  await writeFile(path.join(cwd, 'missed.txt'), 'Actually missed.')
  const unsupported = run('clean.md', 'missed.txt', '--format', 'agent-compact')
  assert.equal(unsupported.status, 2)
  assert.match(unsupported.stderr, /matched=2 inspected=1 .*unsupported=1/)
  assert.doesNotMatch(unsupported.stdout, /errors=0/)
  const empty = run('clean.md', 'empty.md')
  assert.equal(empty.status, 0)
  assert.match(empty.stderr, /no prose extracted from .*empty\.md/)
  assert.match(empty.stderr, /matched=2 inspected=1 .*unsupported=0 empty=1/)
})

test('a clean result reports actual file, segment and character coverage', async t => {
  const { cwd, run } = await fixture(t)
  await writeFile(path.join(cwd, 'clean.md'), '# Clear\n\nUseful copy.')
  const result = run('--format', 'json')
  assert.equal(result.status, 0)
  assert.deepEqual(JSON.parse(result.stdout), [])
  assert.match(result.stderr, /matched=1 inspected=1 segments=2 characters=17 unsupported=0 empty=0/)
})

test('the real missed article produces diagnostics through CLI rule loading', async t => {
  const { cwd, run } = await fixture(t)
  await copyFile(new URL('../../markdown/test/fixtures/ephemeris.md', import.meta.url), path.join(cwd, 'article.md'))
  const result = run('article.md', '--format', 'compact')
  assert.equal(result.status, 1)
  assert.match(result.stdout, /article\.md:11:168 error \[no-weasel-words\]/)
  assert.match(result.stderr, /matched=1 inspected=1 segments=38 characters=7540/)
})

test('--config loads the exact file and resolves globs relative to it, not the calling directory', async t => {
  const { cwd, run } = await fixture(t)
  const nested = path.join(cwd, 'site')
  await mkdir(nested)
  await writeFile(path.join(nested, 'article.md'), 'Actually covered.')
  await writeFile(path.join(nested, 'blog.config.mjs'), `
    import { markdown } from ${JSON.stringify(markdownUrl)}
    export default { files: ['*.md'], adapters: [markdown()], rules: { 'no-weasel-words': 'error' } }
  `)
  // A conventional config beside it must not replace the explicit filename.
  await writeFile(path.join(nested, 'faircopy.config.mjs'), 'export default { files: [], rules: {} }')
  const result = run('--config', 'site/blog.config.mjs', '--format', 'json')
  assert.equal(result.status, 1)
  assert.equal(JSON.parse(result.stdout).length, 1)
  assert.match(result.stderr, /matched=1 inspected=1/)
  const missing = run('--config', 'site/missing.config.mjs')
  assert.equal(missing.status, 2)
  assert.match(missing.stderr, /Failed to load .*missing\.config\.mjs/)
})

test('explicit files override config globs and duplicate arguments are inspected only once', async t => {
  const { cwd, run } = await fixture(t, { files: ['src/**/*.astro'] })
  await writeFile(path.join(cwd, 'article.md'), 'Actually covered.')
  const result = run('article.md', 'article.md', '--format', 'json')
  assert.equal(result.status, 1)
  assert.equal(JSON.parse(result.stdout).length, 1)
  assert.match(result.stderr, /matched=1 inspected=1/)
})
