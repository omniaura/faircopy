import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences, getOccurrenceRange } from './utils.js'

export interface NoStackedAdjectivesOptions {
  allowedPhrases?: string[]
}

export const noStackedAdjectives: Rule<NoStackedAdjectivesOptions> = {
  id: 'no-stacked-adjectives',
  description: 'Flag noun phrases with multiple adjectives before the noun',
  defaults: { allowedPhrases: [] },
  help: 'Stacked adjectives make copy feel generic. Keep the one descriptor that earns its place or replace the phrase with concrete evidence.',

  check({ text, sourceMap, options }: RuleInput<NoStackedAdjectivesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const allowedPhrases = new Set((options.allowedPhrases ?? []).map(value => value.toLowerCase()))
    const doc = createDoc(text)
    const matches = doc.match('#Adjective #Adjective+ #Noun')

    for (const occurrence of getMatchOccurrences(text, matches)) {
      if (allowedPhrases.has(occurrence.text.toLowerCase())) continue

      const range = getOccurrenceRange(sourceMap, occurrence)
      if (!range) continue

      diagnostics.push({
        ruleId: 'no-stacked-adjectives',
        severity: 'warn',
        message: `cut stacked adjectives in "${occurrence.text}"`,
        range,
        help: noStackedAdjectives.help,
      })
    }

    return diagnostics
  },
}
