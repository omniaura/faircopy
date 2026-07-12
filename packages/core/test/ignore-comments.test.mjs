import assert from 'node:assert/strict'
import test from 'node:test'

import { lintFile } from '../dist/index.js'

const adapter = {
  name: 'fixture',
  extensions: ['.tsx'],
  async extract(_filePath, source) {
    return [...source.matchAll(/copy:\s*(.+)$/gm)].map(match => ({
      text: match[1],
      sourceMap: Array.from(
        { length: match[1].length },
        (_, index) => match.index + match[0].indexOf(match[1]) + index,
      ),
    }))
  },
}

const rules = [
  {
    severity: 'error',
    options: {},
    rule: {
      id: 'no-bad-copy',
      description: 'fixture rule',
      check({ text, sourceMap }) {
        if (!text.includes('bad')) return []
        return [{
          ruleId: 'no-bad-copy',
          severity: 'error',
          message: 'bad copy',
          range: { start: sourceMap[0], end: sourceMap.at(-1) + 1 },
        }]
      },
    },
  },
]

test('faircopy-ignore-next-line suppresses all rules on the following line', async () => {
  const source = [
    'copy: bad unsuppressed',
    '// faircopy-ignore-next-line',
    'copy: bad suppressed',
  ].join('\n')

  const diagnostics = await lintFile('fixture.tsx', source, [adapter], rules)

  assert.equal(diagnostics.length, 1)
  assert.equal(source.slice(diagnostics[0].range.start, diagnostics[0].range.end), 'bad unsuppressed')
})

test('faircopy-ignore-line suppresses the directive line', async () => {
  const source = 'copy: bad suppressed // faircopy-ignore-line'

  const diagnostics = await lintFile('fixture.tsx', source, [adapter], rules)

  assert.deepEqual(diagnostics, [])
})

test('rule-specific directives leave other rules enabled', async () => {
  const otherRule = {
    ...rules[0],
    rule: {
      ...rules[0].rule,
      id: 'other-rule',
      check(input) {
        return rules[0].rule.check(input).map(diagnostic => ({
          ...diagnostic,
          ruleId: 'other-rule',
        }))
      },
    },
  }
  const source = [
    '// faircopy-ignore-next-line no-bad-copy',
    'copy: bad copy',
  ].join('\n')

  const diagnostics = await lintFile('fixture.tsx', source, [adapter], [rules[0], otherRule])

  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.ruleId), ['other-rule'])
})
