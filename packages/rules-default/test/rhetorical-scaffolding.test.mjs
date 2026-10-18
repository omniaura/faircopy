import assert from 'node:assert/strict'
import test from 'node:test'
import { noRhetoricalScaffolding as rule, ruleRegistry } from '../dist/index.js'

function run(text, options = {}, sourceMap = Array.from({ length: text.length }, (_, index) => index)) {
  return rule.check({ text, sourceMap, filePath: 'fixture.astro', options })
}

test('flags the original importance announcement without custom patterns', () => {
  const before = 'That distinction matters. A plausible answer from a model cannot grant access to a graph, invent a valid database ID, or authorize moving someone’s history. Those checks happen in code.'
  const after = 'A model’s answer cannot grant access to a graph, invent a valid database ID, or authorize moving someone’s history. Those checks happen in code.'
  const diagnostics = run(before)
  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 25 })
  assert.equal(diagnostics[0].ruleId, rule.id)
  assert.equal(diagnostics[0].severity, 'error')
  assert.match(diagnostics[0].message, /state the point directly/)
  assert.equal(diagnostics[0].fix, undefined)
  assert.equal(diagnostics[0].suggest, undefined)
  assert.deepEqual(run(after), [])
  assert.equal(ruleRegistry.get(rule.id), rule)
})

test('handles the bounded family, case, whitespace, punctuation and complete text', () => {
  for (const text of [
    'That distinction matters.', 'This distinction matters.',
    'That difference matters.', 'This difference matters.',
    'THIS DIFFERENCE MATTERS!', 'this distinction matters?',
    'That\t distinction\r\nmatters.', 'This difference matters',
    '  That difference matters.  ',
  ]) {
    const diagnostics = run(text)
    assert.equal(diagnostics.length, 1, text)
    assert.equal(text.slice(diagnostics[0].range.start, diagnostics[0].range.end), text.trim())
  }
})

test('reports each sentence without including preceding boundaries or quotes', () => {
  const text = 'Access is checked. “That distinction matters.” This difference matters!\n\nThat difference matters.'
  const diagnostics = run(text)
  assert.deepEqual(diagnostics.map(({ range }) => text.slice(range.start, range.end)), [
    'That distinction matters.', 'This difference matters!', 'That difference matters.',
  ])
  assert.deepEqual(run('Heading\n\nThis distinction matters.').map(({ range }) => range), [
    { start: 9, end: 34 },
  ])
  assert.deepEqual(run('📝. (That difference matters.) "This distinction matters!"').map(({ range }) => range), [
    { start: 5, end: 29 }, { start: 32, end: 57 },
  ])
  assert.equal(run('Heading\r\n\r\nThis distinction matters.').length, 1)
})

test('maps only the offending span through offsets and gaps in the source map', () => {
  const text = 'Intro. That distinction matters.'
  const sourceMap = Array.from(text, (_, index) => index + 40 + (index >= 12 ? 8 : 0))
  const [diagnostic] = run(text, {}, sourceMap)
  assert.deepEqual(diagnostic.range, { start: sourceMap[7], end: sourceMap.at(-1) + 1 })
})

test('retains substantive explanations, conditions, embedded uses and unrelated words', () => {
  for (const text of [
    'The distinction between read and write access determines who can change the file.',
    'That distinction matters because only owners can change the file.',
    'This difference matters when the request changes stored data.',
    'That difference matters to the person paying the bill.',
    'This distinction matters: it determines who can write.',
    'That distinction matters; it determines who can write.',
    'Whether that distinction matters depends on the permissions.',
    'We know that difference matters.', 'We know\nthat difference matters.',
    'That distinction matters more than the label.',
    'This distinction matters if the file is shared.',
    'That distinction matters, so check permissions.',
    'That difference matters-of-factly.', 'That difference mattersExtra.',
    'This distinctionship matters.', 'NotThis difference matters.',
    'The difference is 10 ms. Response time matters.', '',
  ]) assert.deepEqual(run(text), [], text)
})

test('preserves existing patterns, options and extraPatterns with an independent opt-out', () => {
  assert.equal(run('Faircopy is a linter, not a spellchecker.').length, 1)
  assert.deepEqual(run('Faircopy is a linter, not a spellchecker.', { allowIsNotConstruction: true }), [])
  assert.equal(run('Without checks, access fails. With checks, it works.').length, 1)
  assert.deepEqual(run('Without checks, access fails. With checks, it works.', { allowWithoutWithConstruction: true }), [])
  assert.deepEqual(run('That distinction matters.', { allowImportanceAnnouncements: true }), [])
  assert.equal(run('That distinction matters.', { allowIsNotConstruction: true, allowWithoutWithConstruction: true }).length, 1)
  assert.equal(run('Faircopy is a linter, not a spellchecker.', { allowImportanceAnnouncements: true }).length, 1)
  assert.equal(run('Without checks, access fails. With checks, it works.', { allowImportanceAnnouncements: true }).length, 1)
  const diagnostics = run('That distinction matters. MAGIC REVEAL.', {
    allowImportanceAnnouncements: true, extraPatterns: ['magic reveal'],
  })
  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].message, 'banned rhetorical pattern')
  assert.deepEqual(diagnostics[0].range, { start: 26, end: 38 })
  assert.equal(run('That difference matters. MAGIC REVEAL.', { extraPatterns: ['magic reveal'] }).length, 2)
  assert.equal(run('That difference matters.').length, 1)
  assert.equal(run('That difference matters.').length, 1)
})
