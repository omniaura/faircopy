import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoVagueQuantifiersOptions {
  quantifiers?: string[]
}

const DEFAULT_QUANTIFIERS = [
  'many',
  'several',
  'various',
  'numerous',
  'multiple',
  'some',
  'a number of',
  'a variety of',
  'a range of',
  'a host of',
  'countless',
  'tons of',
  'lots of',
]

export const noVagueQuantifiers: Rule<NoVagueQuantifiersOptions> = {
  id: 'no-vague-quantifiers',
  description: 'Flag bare quantifiers without numeric anchors',
  defaults: { quantifiers: DEFAULT_QUANTIFIERS },
  help:
    'Vague quantifiers make claims hard to evaluate. Replace them with a number, range, or concrete scope when precision matters.',

  check({ text, sourceMap, options }: RuleInput<NoVagueQuantifiersOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const quantifiers = options.quantifiers?.length ? options.quantifiers : DEFAULT_QUANTIFIERS

    for (const quantifier of quantifiers) {
      const re = new RegExp(
        `\\b${escapeRegExp(quantifier).replace(/\\s+/g, '\\s+')}\\b`,
        'gi'
      )
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedQuantifier = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + matchedQuantifier.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-vague-quantifiers',
          severity: 'warn',
          message: `replace vague quantifier "${matchedQuantifier}" with a number or concrete scope`,
          range: { start, end: end + 1 },
          help: noVagueQuantifiers.help,
        })
      }
    }

    return diagnostics
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
