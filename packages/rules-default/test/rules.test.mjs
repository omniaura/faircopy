import assert from 'node:assert/strict'
import test from 'node:test'
import { noNonInclusiveLanguage, noRedundantPhrases, ruleRegistry } from '../dist/index.js'

function run(rule, text, options = {}) {
  return rule.check({
    text,
    sourceMap: Array.from({ length: text.length }, (_, index) => index),
    filePath: 'fixture.astro',
    options,
  })
}

test('no-non-inclusive-language flags default non-inclusive terms', () => {
  const text = 'Hey guys, add this to the whitelist and blacklist. It is a sanity check for mankind.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 5)
  assert.deepEqual(
    diagnostics.map(diagnostic => diagnostic.range),
    [
      { start: 4, end: 8 },
      { start: 26, end: 35 },
      { start: 40, end: 49 },
      { start: 59, end: 71 },
      { start: 76, end: 83 },
    ],
  )
  assert.ok(diagnostics.every(diagnostic => diagnostic.ruleId === 'no-non-inclusive-language'))
  assert.match(diagnostics[0].message, /guys/)
  assert.match(diagnostics[0].message, /everyone/)
})

test('no-non-inclusive-language suggests alternatives for ability metaphors', () => {
  const text = 'The crazy deadline and lame excuse created a blind spot.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 3)
  assert.match(diagnostics[0].message, /crazy/)
  assert.match(diagnostics[1].message, /lame/)
  assert.match(diagnostics[2].message, /blind spot/)
})

test('no-non-inclusive-language flags master and slave as standalone words', () => {
  const text = 'The master node replicates to every slave instance.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /master/)
  assert.match(diagnostics[1].message, /slave/)
})

test('no-non-inclusive-language does not match terms inside longer words', () => {
  const text = 'The masterpiece was mastered by a craftsman.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language respects allowed terms', () => {
  const text = 'Hey guys, add this to the whitelist.'
  const diagnostics = run(noNonInclusiveLanguage, text, { allowedTerms: ['guys', 'whitelist'] })

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language supports custom terms', () => {
  const text = 'The rockstar engineer handled the ninja implementation.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [
      { term: 'rockstar', alternatives: ['skilled', 'expert'] },
      { term: 'ninja', alternatives: ['expert', 'specialist'] },
    ],
  })

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /rockstar/)
  assert.match(diagnostics[1].message, /ninja/)
})

test('no-non-inclusive-language supports exact phrase matching', () => {
  const text = 'Do a sanity check, not a sanity checker.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [{ term: 'sanity check', alternatives: ['verification'], exact: true }],
  })

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 17 })
})

test('no-non-inclusive-language matches multi-word phrases as substrings by default', () => {
  const text = 'Do a sanity check, not a sanity checker.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [{ term: 'sanity check', alternatives: ['verification'] }],
  })

  assert.equal(diagnostics.length, 2)
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 17 })
  assert.deepEqual(diagnostics[1].range, { start: 25, end: 37 })
})

test('no-non-inclusive-language is case-insensitive', () => {
  const text = 'Add it to the WHITELIST, guys.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /guys/i)
  assert.match(diagnostics[1].message, /whitelist/i)
})

test('rule registry exposes the new inclusive-language rule', () => {
  assert.ok(ruleRegistry.has('no-non-inclusive-language'))
})

test('no-redundant-phrases flags default redundant phrases', () => {
  const text = 'In order to win, we must act now. Due to the fact that we shipped early, we lead the market.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-redundant-phrases')
  assert.match(diagnostics[0].message, /in order to/i)
  assert.match(diagnostics[0].message, /to/)
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 11 })
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'to')
  assert.equal(diagnostics[1].ruleId, 'no-redundant-phrases')
  assert.match(diagnostics[1].message, /due to the fact that/i)
  assert.match(diagnostics[1].message, /because/)
  assert.deepEqual(diagnostics[1].range, { start: 34, end: 54 })
  assert.equal(diagnostics[1].suggest.edits[0].replacement, 'because')
})

test('no-redundant-phrases suggests deleting empty-replacement phrases', () => {
  const text = 'Needless to say, the product is fast.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /needless to say/i)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, '')
})

test('no-redundant-phrases is case-insensitive', () => {
  const text = 'IN ORDER TO succeed, plan ahead.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /IN ORDER TO/)
})

test('no-redundant-phrases supports custom phrases', () => {
  const text = 'We should touch base before the launch.'
  const diagnostics = run(noRedundantPhrases, text, {
    phrases: [{ phrase: 'touch base', replacement: 'talk' }],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /touch base/)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'talk')
})

test('no-redundant-phrases does not match substrings inside longer words', () => {
  const text = 'The proximity sensor is in order.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 0)
})

test('rule registry exposes the new redundant-phrases rule', () => {
  assert.ok(ruleRegistry.has('no-redundant-phrases'))
})
