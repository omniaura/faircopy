import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences } from './utils.js'

export interface NoFilterWordsOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'I think',
  'it seems',
  'basically',
  'in order to',
]

export const noFilterWords: Rule<NoFilterWordsOptions> = {
  id: 'no-filter-words',
  description: 'Ban filter phrases that distance the claim from the reader',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Filter phrases announce a perspective or pad the sentence instead of making the point. Delete the phrase or rewrite the sentence so the claim stands on its own.',

  check({ text, sourceMap, options }: RuleInput<NoFilterWordsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES
    const doc = createDoc(text)

    for (const phrase of phrases) {
      const matches = doc.match(phrase)
      for (const occurrence of getMatchOccurrences(text, matches)) {
        const start = sourceMap[occurrence.start]
        const end = sourceMap[occurrence.end - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-filter-words',
          severity: 'error',
          message: `remove "${occurrence.text.toLowerCase()}" — state the claim directly`,
          range: { start, end: end + 1 },
          help: noFilterWords.help,
        })
      }
    }

    return diagnostics
  },
}
