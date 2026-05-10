import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoRedundantPairsOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'first and foremost',
  'each and every',
  'various different',
  'end result',
  'final outcome',
  'past history',
  'future plans',
  'unexpected surprise',
  'advance planning',
]

export const noRedundantPairs: Rule<NoRedundantPairsOptions> = {
  id: 'no-redundant-pairs',
  description: 'Flag redundant word pairs and padded fixed phrases',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Redundant pairs repeat the same idea twice. Keep the stronger word or replace the phrase with a more specific claim.',

  check({ text, sourceMap, options }: RuleInput<NoRedundantPairsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES

    for (const phrase of phrases) {
      const re = new RegExp(`\\b${escapeRegExp(phrase).replace(/\\s+/g, '\\s+')}\\b`, 'gi')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedPhrase = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + matchedPhrase.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-redundant-pairs',
          severity: 'warn',
          message: `tighten redundant phrase "${matchedPhrase}"`,
          range: { start, end: end + 1 },
          help: noRedundantPairs.help,
        })
      }
    }

    return diagnostics
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
