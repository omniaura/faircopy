import assert from 'node:assert/strict'
import test from 'node:test'
import { go } from '../dist/index.js'

test('extracts configured static call messages and formatted literals with source maps', async () => {
  const source = String.raw`package sample

// errs.NewFactory(400, "ignore this comment —")
var invalid = errs.NewFactory(http.StatusBadRequest, "This is actually invalid — please try again.")
var formatted = errs.NewFactory(http.StatusTooManyRequests, fmt.Sprintf("Rate limit reached after %d tries", count))
var unrelated = errors.New("Ignore this standalone error —")
var logged = errs.Unknown.New(ctx).AddMessage("This is only logged —")
`
  const extracted = await go({
    calls: [{ name: 'errs.NewFactory', argumentIndex: 1 }],
  }).extract('sample.go', source)

  assert.deepEqual(extracted.map(({ text }) => text), [
    'This is actually invalid — please try again.',
    'Rate limit reached after %d tries',
  ])
  for (const item of extracted) {
    assert.equal(item.sourceMap.length, item.text.length)
    for (let index = 0; index < item.text.length; index++) {
      assert.equal(source[item.sourceMap[index]], item.text[index])
    }
  }
})

test('skips nonliteral arguments, comments, and strings outside configured calls', async () => {
  const source = String.raw`// NewFactory(400, "This sentence is a comment")
var body = "NewFactory(400, 'not a call')"
var dynamic = NewFactory(http.StatusBadRequest, message)
var joined = NewFactory(http.StatusBadRequest, "First half." + " Second half.")
`
  const extracted = await go({
    calls: [{ name: 'NewFactory', argumentIndex: 1 }],
  }).extract('sample.go', source)

  assert.deepEqual(extracted, [])
})

test('maps decoded characters to the source escape', async () => {
  const source = String.raw`var err = NewFactory(400, "Use a sentence break \u2014 please.")`
  const [extracted] = await go({
    calls: [{ name: 'NewFactory', argumentIndex: 1 }],
  }).extract('sample.go', source)

  assert.equal(extracted.text, 'Use a sentence break — please.')
  const emDash = extracted.text.indexOf('—')
  assert.equal(source[extracted.sourceMap[emDash]], '\\')
})
