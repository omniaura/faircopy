import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences, getOccurrenceRange } from './utils.js'

export interface NoQualifierCreepOptions {
  /** Qualifier words that count toward a stacked-qualifier pattern. */
  qualifiers?: string[]
  /** Maximum qualifiers allowed in a row before the excess are flagged. */
  maxQualifiers?: number
}

const DEFAULT_QUALIFIERS = [
  'very',
  'really',
  'quite',
  'fairly',
  'somewhat',
  'rather',
  'pretty',
  'basically',
  'actually',
  'literally',
  'essentially',
  'truly',
  'definitely',
  'clearly',
  'obviously',
  'absolutely',
  'completely',
  'totally',
  'utterly',
]

const DEFAULT_MAX_QUALIFIERS = 1

export const noQualifierCreep: Rule<NoQualifierCreepOptions> = {
  id: 'no-qualifier-creep',
  description: 'Flag stacked qualifiers or intensifiers before an adjective or adverb',
  defaults: { qualifiers: DEFAULT_QUALIFIERS, maxQualifiers: DEFAULT_MAX_QUALIFIERS },
  help: 'Stacked qualifiers dilute the claim and feel hedged. Keep the strongest qualifier or replace the phrase with concrete evidence.',

  check({ text, sourceMap, options }: RuleInput<NoQualifierCreepOptions>): Diagnostic[] {
    const qualifiers = new Set((options.qualifiers?.length ? options.qualifiers : DEFAULT_QUALIFIERS).map(value => value.toLowerCase()))
    const maxQualifiers = options.maxQualifiers ?? DEFAULT_MAX_QUALIFIERS
    if (maxQualifiers < 1) return []

    const doc = createDoc(text)
    const diagnostics: Diagnostic[] = []
    const seenRanges: Array<{ start: number; end: number }> = []

    const patterns = ['#Adverb #Adverb+ #Adjective', '#Adverb #Adverb+ #Adverb']
    for (const pattern of patterns) {
      const matches = doc.match(pattern)

      for (const occurrence of getMatchOccurrences(text, matches)) {
        const words = occurrence.text.trim().split(/\s+/)
        const qualifierWords = words.filter(word => qualifiers.has(word.toLowerCase().replace(/[^a-zA-Z]+$/, '')))
        if (qualifierWords.length <= maxQualifiers) continue

        if (seenRanges.some(range => occurrence.start < range.end && occurrence.end > range.start)) continue
        seenRanges.push({ start: occurrence.start, end: occurrence.end })

        const range = getOccurrenceRange(sourceMap, occurrence)
        if (!range) continue

        diagnostics.push({
          ruleId: 'no-qualifier-creep',
          severity: 'warn',
          message: `remove stacked qualifiers in "${occurrence.text}" — use one strong word or a concrete detail`,
          range,
          help: noQualifierCreep.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
