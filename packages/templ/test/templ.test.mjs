import assert from 'node:assert/strict'
import test from 'node:test'
import { templ } from '../dist/index.js'

async function extract(source, options) {
  return templ(options).extract('email.templ', source)
}

test('extracts visible text, prose attributes, and Go string literals in source order', async () => {
  const source = `package emails

templ Invitation(name string) {
  @layout("Your invitation is still open", "Review the latest invitation") {
    <main>
      <h1>Welcome back</h1>
      <p>Hello, { name }!</p>
      <img src="logo.png" alt="The Ditto logo"/>
    </main>
  }
}`

  const results = await extract(source)
  assert.deepEqual(
    results.map(result => [result.text, result.meta]),
    [
      ['Your invitation is still open', { type: 'go-string', quote: 'interpreted' }],
      ['Review the latest invitation', { type: 'go-string', quote: 'interpreted' }],
      ['Welcome back', { type: 'html-text' }],
      ['Hello,', { type: 'html-text' }],
      ['The Ditto logo', { type: 'html-attribute', attribute: 'alt' }],
    ],
  )

  for (const result of results) {
    assert.equal(result.sourceMap.length, result.text.length)
    for (let index = 0; index < result.text.length; index++) {
      assert.equal(source[result.sourceMap[index]], result.text[index])
    }
  }
})

test('skips comments, markup attributes, code-oriented strings, and ignored subtrees', async () => {
  const source = `package emails

// "This comment is not copy."
templ Page() {
  <style>.message { color: red; }</style>
  <script>console.log("This script is not copy.")</script>
  <a href="https://example.com/path" class="button primary">Read the invitation</a>
  <section data-faircopy-ignore>
    <p>This deliberately ignored sentence is not copy.</p>
    @card("Nor is this ignored argument.")
  </section>
  @icon("arrow-right")
}`

  const results = await extract(source)
  assert.deepEqual(results.map(result => result.text), ['Read the invitation'])
})

test('decodes interpreted Go strings and maps decoded characters to their escapes', async () => {
  const source = `templ Message() { @text("You\\'re invited.\\nOpen Ditto today. \\u263a") }`
  const [result] = await extract(source)

  assert.equal(result.text, "You're invited.\nOpen Ditto today. ☺")
  assert.equal(result.sourceMap.length, result.text.length)
  assert.equal(source[result.sourceMap[result.text.indexOf("'")]], '\\')
  assert.equal(source[result.sourceMap[result.text.indexOf('\n')]], '\\')
  assert.equal(source[result.sourceMap[result.text.indexOf('☺')]], '\\')
})

test('extracts raw Go strings and supports opt-outs and custom attributes', async () => {
  const source = 'templ Message() { @text(`A raw invitation sentence.`) <button data-copy="Choose a workspace">Continue</button> }'

  assert.deepEqual(
    (await extract(source)).map(result => result.text),
    ['A raw invitation sentence.', 'Continue'],
  )
  assert.deepEqual(
    (await extract(source, {
      lintGoStrings: false,
      lintAttributes: { attributes: ['data-copy'] },
    })).map(result => result.text),
    ['Choose a workspace', 'Continue'],
  )
})

test('maps an attribute value correctly when it repeats the attribute name', async () => {
  const source = '<p title="title">if you need help, contact support.</p>'
  const results = await extract(source)

  assert.deepEqual(results.map(result => result.text), ['title', 'if you need help, contact support.'])
  assert.equal(source[results[0].sourceMap[0]], 't')
  assert.equal(results[0].sourceMap[0], source.lastIndexOf('title'))
})

test('skips custom code-like tags and tolerates malformed templates', async () => {
  const source = '<prose>Keep this sentence.</prose><markdown>Do not lint this sentence.</markdown><p>Still lint this.</p><broken'
  const results = await extract(source, { skipTags: ['markdown'] })

  assert.deepEqual(results.map(result => result.text), ['Keep this sentence.', 'Still lint this.'])
})
