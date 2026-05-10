import assert from 'node:assert/strict'
import test from 'node:test'
import {
  noEmptyTransformationClaims,
  noExpletiveOpeners,
  noNominalizedPhrases,
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

test('no-empty-transformation-claims flags broad transformation cliches', () => {
  const text = 'Faircopy transforms the way teams work. It also reduces review time by 30%.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-empty-transformation-claims')
  assert.deepEqual(diagnostics[0].range, { start: 9, end: 38 })
  assert.match(diagnostics[0].message, /concrete outcome/)
})

test('no-empty-transformation-claims flags next-level and unlock claims', () => {
  const text = 'Unlock your productivity. Take your workflow to the next level.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 2)
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 0, end: 24 },
    { start: 26, end: 62 },
  ])
})

test('no-empty-transformation-claims avoids concrete transformation language', () => {
  const text = 'Convert support tickets into prioritized Jira issues in one click.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 0)
})

test('no-empty-transformation-claims respects allowed phrases', () => {
  const text = 'Faircopy transforms the way teams work.'
  const diagnostics = run(noEmptyTransformationClaims, text, {
    allowedPhrases: ['transforms the way teams work'],
  })

  assert.equal(diagnostics.length, 0)
})

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

test('no-expletive-openers flags there sentence openers', () => {
  const text = 'There are faster ways to ship. There is less review churn with Faircopy.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-expletive-openers')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 9 })
  assert.deepEqual(diagnostics[1].range, { start: 31, end: 39 })
})

test('no-expletive-openers ignores referential it openers by default', () => {
  const text = 'Faircopy is small. It is fast.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 0)
})

test('no-expletive-openers ignores matching phrases mid-sentence', () => {
  const text = 'We know there are faster ways to ship.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 0)
})

test('rule registry exposes all nlp rules', () => {
  assert.ok(ruleRegistry.has('no-empty-transformation-claims'))
  assert.ok(ruleRegistry.has('no-expletive-openers'))
  assert.ok(ruleRegistry.has('no-filter-words'))
  assert.ok(ruleRegistry.has('no-passive-voice'))
  assert.ok(ruleRegistry.has('no-weak-modals'))
  assert.ok(ruleRegistry.has('no-stacked-adjectives'))
  assert.ok(ruleRegistry.has('no-nominalized-phrases'))
})
