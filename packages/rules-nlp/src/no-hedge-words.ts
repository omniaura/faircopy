import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoHedgeWordsOptions {
  hedges?: string[]
}

const DEFAULT_HEDGES = [
  'kind of',
  'sort of',
  'somewhat',
  'fairly',
  'pretty',
  'rather',
  'quite',
  'arguably',
  'relatively',
  'more or less',
]

export const noHedgeWords: Rule<NoHedgeWordsOptions> = {
  id: 'no-hedge-words',
  description: 'Flag hedge words that soften claims',
  defaults: { hedges: DEFAULT_HEDGES },
  help: 'Hedge words make claims sound uncertain. Remove the hedge or replace the sentence with a specific proof point. Words like "pretty" and "quite" can be intentional adjectives in some contexts; override hedges when that trade-off is too noisy for your copy.',

  check({ text, sourceMap, options }: RuleInput<NoHedgeWordsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const hedges = options.hedges?.length ? options.hedges : DEFAULT_HEDGES

    for (const hedge of hedges) {
      const re = new RegExp(`\\b${escapeRegExp(hedge).replace(/\\s+/g, '\\s+')}\\b`, 'gi')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const phrase = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + phrase.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-hedge-words',
          severity: 'warn',
          message: `remove hedge "${phrase.toLowerCase()}"`,
          range: { start, end: end + 1 },
          help: noHedgeWords.help,
        })
      }
    }

    return diagnostics
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
