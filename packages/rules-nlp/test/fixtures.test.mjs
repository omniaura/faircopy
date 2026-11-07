import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { ruleRegistry } from '../dist/index.js'

// Diagnostic counts for every rules-nlp rule, at its default options, over
// realistic marketing copy. A change here is a change in what users see:
// update the counts deliberately, in the same commit as the rule change.
const fixturesDir = new URL('./fixtures/', import.meta.url)

const EXPECTED = {
  'enterprise-feature.txt': {
    'no-complex-readability': 1,
    'no-jargon': 1,
    'no-llm-speak': 1,
    'no-nominalized-phrases': 2,
    'no-noun-strings': 4,
    'no-stacked-adjectives': 2,
    'no-superlative-claims': 1,
  },
  'launch-announcement.txt': {
    'no-filter-words': 3,
    'no-meaningless-modifiers': 1,
    'no-passive-voice': 2,
    'no-redundant-pairs': 2,
    'no-vague-comparatives': 2,
    'no-weak-modals': 1,
  },
  'onboarding-email.txt': {
    'no-meaningless-modifiers': 1,
  },
  'saas-hero.txt': {
    'no-buzzword-stacks': 2,
    'no-empty-transformation-claims': 2,
    'no-expletive-openers': 1,
    'no-pronoun-led-claims': 1,
    'no-stacked-adjectives': 2,
    'no-superlative-claims': 1,
    'no-weak-modals': 1,
  },
  'social-ad.txt': {
    'no-vague-comparatives': 2,
  },
}

function lint(text) {
  const counts = {}
  for (const [id, rule] of ruleRegistry) {
    const diagnostics = rule.check({
      text,
      sourceMap: Array.from({ length: text.length }, (_, index) => index),
      filePath: 'fixture.md',
      options: { ...(rule.defaults ?? {}) },
    })
    for (const diagnostic of diagnostics) {
      assert.ok(
        diagnostic.range.start >= 0 && diagnostic.range.start < diagnostic.range.end && diagnostic.range.end <= text.length,
        `${id} produced an out-of-bounds range ${JSON.stringify(diagnostic.range)}`,
      )
    }
    if (diagnostics.length > 0) counts[id] = diagnostics.length
  }
  return counts
}

const fixtureFiles = readdirSync(fixturesDir).filter(name => name.endsWith('.txt')).sort()

test('every fixture has expected counts and every expectation has a fixture', () => {
  assert.ok(fixtureFiles.length >= 5, `found ${fixtureFiles.length} fixtures`)
  assert.deepEqual(fixtureFiles, Object.keys(EXPECTED).sort())
})

for (const name of fixtureFiles) {
  test(`fixture ${name} keeps its per-rule diagnostic counts`, () => {
    const text = readFileSync(new URL(name, fixturesDir), 'utf8')
    assert.deepEqual(lint(text), EXPECTED[name])
  })
}

// FAIRCOPY_PRINT_FIXTURE_COUNTS=1 node --test test/fixtures.test.mjs prints the current counts.
if (process.env.FAIRCOPY_PRINT_FIXTURE_COUNTS) {
  const actual = Object.fromEntries(fixtureFiles.map(name => [name, lint(readFileSync(new URL(name, fixturesDir), 'utf8'))]))
  console.log(JSON.stringify(actual, null, 2))
}
