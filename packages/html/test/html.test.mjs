import assert from 'node:assert/strict'
import test from 'node:test'
import { html } from '../dist/index.js'
import { lintFileWithCoverage, offsetToLineCol } from '../../core/dist/index.js'
import { noWeaselWords } from '../../rules-default/dist/index.js'

const rules = [{ rule: noWeaselWords, severity: 'error', options: {} }]

test('rendered inline elements preserve phrases, entities and original offsets', async () => {
  const source = '<p>😀 This is <a href="https://really.example">act&#117;ally</a> useful &amp; clear.</p>\r\n<p>really.</p>'
  const extracted = await html().extract('post.html', source)
  assert.deepEqual(extracted.map(segment => segment.text), ['😀 This is actually useful & clear.', 'really.'])
  for (const segment of extracted) assert.equal(segment.text.length, segment.sourceMap.length)
  const { diagnostics } = await lintFileWithCoverage('post.html', source, [html()], rules)
  assert.deepEqual(diagnostics.map(diagnostic => source.slice(diagnostic.range.start, diagnostic.range.end)), ['act&#117;ally', 'really'])
  assert.deepEqual(offsetToLineCol(source, diagnostics[1].range.start), { line: 2, col: 4 })
})

test('skip code, scripts, styles, templates, hidden content, attributes and URLs', async () => {
  const source = '<script>actually</script><style>really</style><pre>truly</pre><code>literally</code><template>actually</template><svg><text>really</text></svg><p hidden>actually</p><div aria-hidden="true">really</div><aside data-faircopy-ignore>truly</aside><!-- literally --><p title="really" data-url="https://actually.example">Read <em>actually</em> <a href="https://really.example">the docs</a>.</p><p>https://actually.example</p>'
  const { diagnostics, coverage } = await lintFileWithCoverage('post.htm', source, [html()], rules)
  assert.equal(diagnostics.length, 1)
  assert.equal(source.slice(diagnostics[0].range.start, diagnostics[0].range.end), 'actually')
  assert.equal(coverage.characters, 'Read actually the docs.'.length)
})

test('omitted code and block boundaries cannot create a new phrase', async () => {
  const segments = await html().extract('post.html', '<p>This is<code>x</code>actually.</p><p>Next.</p>')
  assert.deepEqual(segments.map(segment => segment.text), ['This is', 'actually.', 'Next.'])
})
