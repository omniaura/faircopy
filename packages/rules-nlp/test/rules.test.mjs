import assert from 'node:assert/strict'
import test from 'node:test'
import {
  noBuzzwordStacks,
  noNominalizedPhrases,
  noPronounLedClaims,
  noStackedAdjectives,
  noWeakModals,
  ruleRegistry,
} from '../dist/index.js'

function run(rule, text, options = {}) {
  return rule.check({
    text,
    sourceMap: Array.from({ length: text.length }, (_, index) => index),
    filePath: 'fixture.astro',
    options,
  })
}

test('no-weak-modals flags hedged helper claims but allows concrete capabilities', () => {
  const text = 'This can help teams grow. You can export CSV.'
  const diagnostics = run(noWeakModals, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-weak-modals')
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 13 })
})

test('no-stacked-adjectives flags adjective-heavy noun phrases', () => {
  const text = 'Powerful intuitive collaborative workflows help teams move.'
  const diagnostics = run(noStackedAdjectives, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-stacked-adjectives')
  assert.match(diagnostics[0].message, /Powerful intuitive collaborative workflows/)
})

test('no-stacked-adjectives respects allowed phrases', () => {
  const text = 'Powerful intuitive collaborative workflows help teams move.'
  const diagnostics = run(noStackedAdjectives, text, {
    allowedPhrases: ['powerful intuitive collaborative workflows'],
  })

  assert.equal(diagnostics.length, 0)
})

test('no-nominalized-phrases flags nominalized of-phrases', () => {
  const text = 'Optimization of onboarding improves activation.'
  const diagnostics = run(noNominalizedPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-nominalized-phrases')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 26 })
})

test('no-nominalized-phrases allows configured concrete nouns', () => {
  const text = 'Security of customer data comes first.'
  const diagnostics = run(noNominalizedPhrases, text)

  assert.equal(diagnostics.length, 0)
})

test('no-pronoun-led-claims flags vague sentence openers', () => {
  const text = 'This helps teams move faster. The assistant helps teams decide.'
  const diagnostics = run(noPronounLedClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-pronoun-led-claims')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 10 })
})

test('no-pronoun-led-claims allows configured verbs', () => {
  const text = 'This helps teams move faster.'
  const diagnostics = run(noPronounLedClaims, text, {
    verbs: ['delivers'],
  })

  assert.equal(diagnostics.length, 0)
})

test('no-buzzword-stacks flags abstract benefit pileups', () => {
  const text = 'Our platform drives productivity, collaboration, and transformation.'
  const diagnostics = run(noBuzzwordStacks, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-buzzword-stacks')
  assert.deepEqual(diagnostics[0].range, { start: 4, end: 67 })
  assert.match(diagnostics[0].message, /platform, productivity, collaboration, transformation/)
})

test('no-buzzword-stacks respects the configured threshold', () => {
  const text = 'Our platform drives productivity, collaboration, and transformation.'
  const diagnostics = run(noBuzzwordStacks, text, {
    maxTermsPerSentence: 4,
  })

  assert.equal(diagnostics.length, 0)
})

test('rule registry exposes all nlp rules', () => {
  assert.ok(ruleRegistry.has('no-buzzword-stacks'))
  assert.ok(ruleRegistry.has('no-filter-words'))
  assert.ok(ruleRegistry.has('no-passive-voice'))
  assert.ok(ruleRegistry.has('no-pronoun-led-claims'))
  assert.ok(ruleRegistry.has('no-weak-modals'))
  assert.ok(ruleRegistry.has('no-stacked-adjectives'))
  assert.ok(ruleRegistry.has('no-nominalized-phrases'))
})
