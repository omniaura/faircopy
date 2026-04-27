import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences, getOccurrenceRange } from './utils.js'

export interface NoNominalizedPhrasesOptions {
  suffixes?: string[]
  allowedWords?: string[]
}

const DEFAULT_SUFFIXES = ['tion', 'sion', 'ment', 'ance', 'ence', 'ity']
const DEFAULT_ALLOWED_WORDS = [
  'accessibility',
  'availability',
  'capacity',
  'community',
  'identity',
  'opportunity',
  'privacy',
  'quality',
  'reliability',
  'security',
]

export const noNominalizedPhrases: Rule<NoNominalizedPhrasesOptions> = {
  id: 'no-nominalized-phrases',
  description: 'Flag nominalized "X of Y" phrases that hide the action in a noun',
  defaults: { suffixes: DEFAULT_SUFFIXES, allowedWords: DEFAULT_ALLOWED_WORDS },
  help: 'Nominalized phrases bury the action. Rewrite the phrase with a verb so the sentence says who does what.',

  check({ text, sourceMap, options }: RuleInput<NoNominalizedPhrasesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const suffixes = options.suffixes?.length ? options.suffixes : DEFAULT_SUFFIXES
    const allowedWords = new Set((options.allowedWords?.length ? options.allowedWords : DEFAULT_ALLOWED_WORDS).map(value => value.toLowerCase()))
    const suffixPattern = suffixes.map(escapeRegex).join('|')
    if (!suffixPattern) return diagnostics

    const doc = createDoc(text)
    const matches = doc.match(`/[a-z]+(${suffixPattern})/ of .`)

    for (const occurrence of getMatchOccurrences(text, matches)) {
      const nominalization = occurrence.text.trim().split(/\s+/)[0]?.toLowerCase()
      if (!nominalization || allowedWords.has(nominalization)) continue

      const range = getOccurrenceRange(sourceMap, occurrence)
      if (!range) continue

      diagnostics.push({
        ruleId: 'no-nominalized-phrases',
        severity: 'warn',
        message: `rewrite "${occurrence.text}" with a verb`,
        range,
        help: noNominalizedPhrases.help,
      })
    }

    return diagnostics
  },
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
