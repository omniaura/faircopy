import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getOccurrenceRange } from './utils.js'

export interface NoAdverbOveruseOptions {
  /** Maximum number of -ly adverbs allowed per sentence before the rest are flagged. */
  maxAdverbs?: number
  /** Adverbs that are allowed and do not count toward the threshold. */
  allowedAdverbs?: string[]
}

const DEFAULT_MAX_ADVERBS = 2
const DEFAULT_ALLOWED_ADVERBS = ['only']

export const noAdverbOveruse: Rule<NoAdverbOveruseOptions> = {
  id: 'no-adverb-overuse',
  description: 'Flag sentences with more than two -ly adverbs',
  defaults: { maxAdverbs: DEFAULT_MAX_ADVERBS, allowedAdverbs: DEFAULT_ALLOWED_ADVERBS },
  help: 'Too many -ly adverbs in one sentence make copy feel padded. Remove the adverb, replace it with a stronger verb or adjective, or add it to allowedAdverbs if it is essential.',

  check({ text, sourceMap, options }: RuleInput<NoAdverbOveruseOptions>): Diagnostic[] {
    const maxAdverbs = options.maxAdverbs ?? DEFAULT_MAX_ADVERBS
    const allowed = new Set((options.allowedAdverbs ?? DEFAULT_ALLOWED_ADVERBS).map(value => value.toLowerCase()))

    const doc = createDoc(text)
    const sentences = doc.sentences().json({ offset: true, terms: { offset: true, tags: true } })

    const diagnostics: Diagnostic[] = []

    for (const sentence of sentences) {
      if (!sentence.terms) continue

      const occurrences = sentence.terms
        .filter((term) => term.tags?.includes('Adverb'))
        .map((term) => {
          const start = term.offset?.start
          const length = term.offset?.length
          return {
            text: term.text?.replace(/[^a-zA-Z]+$/, '') ?? '',
            start: typeof start === 'number' ? start : 0,
            end: typeof start === 'number' && typeof length === 'number' ? start + length : 0,
          }
        })
        .filter((occurrence) => /ly$/i.test(occurrence.text))
        .filter((occurrence) => !allowed.has(occurrence.text.toLowerCase()))
        .sort((left, right) => left.start - right.start)

      for (let index = maxAdverbs; index < occurrences.length; index += 1) {
        const occurrence = occurrences[index]!
        const range = getOccurrenceRange(sourceMap, occurrence)
        if (!range) continue

        diagnostics.push({
          ruleId: 'no-adverb-overuse',
          severity: 'warn',
          message: `reduce adverb overuse: "${occurrence.text}" exceeds the limit of ${maxAdverbs} -ly adverb${maxAdverbs === 1 ? '' : 's'} per sentence`,
          range,
          help: noAdverbOveruse.help,
        })
      }
    }

    return diagnostics
  },
}
