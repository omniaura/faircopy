import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { markdown } from '../dist/index.js'
import { html } from '../../html/dist/index.js'
import { lintFileWithCoverage, offsetToLineCol } from '../../core/dist/index.js'
import { noWeaselWords } from '../../rules-default/dist/index.js'
import { noStackedAdjectives, noPassiveVoice, noWeakModals } from '../../rules-nlp/dist/index.js'

const rules = [noWeaselWords, noStackedAdjectives, noPassiveVoice, noWeakModals].map(rule => ({
  rule, severity: rule === noWeaselWords ? 'error' : 'warn', options: {},
}))

test('links and emphasis preserve a sentence and map diagnostics through syntax', async () => {
  const source = '# Heading\n\nThis is [**actually** useful](https://really.example "truly"). It might *improve* results.'
  const extracted = await markdown().extract('post.md', source)
  assert.deepEqual(extracted.map(segment => segment.text), ['Heading', 'This is actually useful. It might improve results.'])
  const { diagnostics } = await lintFileWithCoverage('post.md', source, [markdown()], rules)
  assert.deepEqual(diagnostics.map(diagnostic => source.slice(diagnostic.range.start, diagnostic.range.end)), [
    'actually', 'might *improve',
  ])
  assert.deepEqual(offsetToLineCol(source, diagnostics[0].range.start), { line: 3, col: 12 })
})

test('frontmatter, code, definitions, comments, URLs and image syntax are excluded', async () => {
  const source = [
    '---', 'title: actually', 'description: really', '---', '',
    '```md', 'actually really', '```', '',
    '    actually indented code', '',
    'Visible `actually` copy and ![really](https://truly.example) [label][ref].', '',
    '[ref]: https://actually.example "really"', '',
    '<!-- actually -->', '',
    '<https://actually.example> https://really.example www.truly.example', '',
    'End **actually**.',
  ].join('\n')
  const { diagnostics, coverage } = await lintFileWithCoverage('post.md', source, [markdown()], rules)
  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].range.start, source.lastIndexOf('actually'))
  assert.equal(coverage.adapter, '@faircopy/markdown')
  const text = (await markdown().extract('post.md', source)).map(segment => segment.text).join('\n')
  assert.doesNotMatch(text, /https|www\.|title:|description:|really|truly|`|\[|\]/)
  assert.match(text, /label/)
})

test('TOML frontmatter, GFM tables, lists and quotes retain prose and locations', async () => {
  const source = '+++\ntitle = "really"\n+++\n\n> Start\n> actually.\n\n- First\n  really.\n\n| Label | Copy |\n| --- | --- |\n| ~~old~~ | truly |'
  const { diagnostics } = await lintFileWithCoverage('post.markdown', source, [markdown()], [rules[0]])
  assert.deepEqual(diagnostics.map(diagnostic => source.slice(diagnostic.range.start, diagnostic.range.end)), ['actually', 'really', 'truly'])
  for (const diagnostic of diagnostics) assert.ok(diagnostic.range.start > source.indexOf('+++', 3))
})

test('decoded entities, escaped syntax, Unicode and CRLF retain source offsets', async () => {
  const source = '> 😀 \\* act&#117;ally &amp; text\r\n> **really**.'
  const segments = await markdown().extract('post.md', source)
  assert.equal(segments[0].text, '😀 * actually & text\nreally.')
  assert.equal(segments[0].sourceMap.length, segments[0].text.length)
  const { diagnostics } = await lintFileWithCoverage('post.md', source, [markdown()], [rules[0]])
  assert.deepEqual(diagnostics.map(diagnostic => source.slice(diagnostic.range.start, diagnostic.range.end)), ['act&#117;ally', 'really'])
  assert.deepEqual(offsetToLineCol(source, diagnostics[1].range.start), { line: 2, col: 5 })
})

test('GFM autolinks inside emphasis never replace source-positioned text with synthetic nodes', async () => {
  const source = '*Actually, contact support@heyditto.ai or www.really.example.*\n\n**Reach us at really@example.com. Actually useful.**'
  const segments = await markdown().extract('post.md', source)
  assert.doesNotMatch(segments.map(segment => segment.text).join('\n'), /@|www\./)
  const { diagnostics } = await lintFileWithCoverage('post.md', source, [markdown()], [rules[0]])
  assert.equal(diagnostics.length, 2)
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range.start), [source.indexOf('Actually'), source.lastIndexOf('Actually')])
})

test('HTML blocks and inline code/ignored subtrees exclude noncopy', async () => {
  const source = 'Text <em>actually</em> <code>really</code> <span data-faircopy-ignore>truly</span> end.\n\n<div>Visible <strong>actually</strong><pre>really</pre></div>'
  const { diagnostics } = await lintFileWithCoverage('post.md', source, [markdown()], [rules[0]])
  assert.equal(diagnostics.length, 2)
  for (const diagnostic of diagnostics) assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), 'actually')
})

test('suppression comments still refer to original Markdown source lines', async () => {
  const source = '<!-- faircopy-ignore-next-line no-weasel-words -->\nActually suppressed.\n\nActually visible.'
  const { diagnostics } = await lintFileWithCoverage('post.md', source, [markdown()], [rules[0]])
  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].range.start, source.lastIndexOf('Actually'))
})

test('frozen missed Ephemeris article: Markdown and rendered HTML expose the same findings', async () => {
  for (const [adapter, file, url] of [
    [markdown(), 'ephemeris.md', new URL('./fixtures/ephemeris.md', import.meta.url)],
    [html(), 'ephemeris.html', new URL('../../html/test/fixtures/ephemeris.html', import.meta.url)],
  ]) {
    const source = await readFile(url, 'utf8')
    const result = await lintFileWithCoverage(file, source, [adapter], rules)
    const counts = Object.fromEntries(rules.map(({ rule }) => [rule.id, result.diagnostics.filter(d => d.ruleId === rule.id).length]))
    assert.deepEqual(result.coverage, { adapter: adapter.name, segments: 38, characters: 7540 })
    assert.deepEqual(counts, {
      'no-weasel-words': 1,
      'no-stacked-adjectives': 8,
      'no-passive-voice': 6,
      'no-weak-modals': 1,
    })
    for (const diagnostic of result.diagnostics) {
      assert.ok(diagnostic.range.start >= 0 && diagnostic.range.end <= source.length)
      assert.ok(source.slice(diagnostic.range.start, diagnostic.range.end).trim())
    }
  }
})
