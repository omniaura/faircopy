import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences } from './utils.js'

export interface NoAdverbOveruseOptions {
  /** Maximum number of -ly adverbs allowed before the rest are flagged. */
  maxAdverbs?: number
  /** Adverbs that are allowed and do not count toward the threshold. */
  allowedAdverbs?: string[]
}

const DEFAULT_MAX_ADVERBS = 3
const DEFAULT_ALLOWED_ADVERBS = ['only']

export const noAdverbOveruse: Rule<NoAdverbOveruseOptions> = {
  id: 'no-adverb-overuse',
  description: 'Flag overuse of adverbs ending in -ly',
  defaults: { maxAdverbs: DEFAULT_MAX_ADVERBS, allowedAdverbs: DEFAULT_ALLOWED_ADVERBS },
  help: 'Too many -ly adverbs make copy feel padded. Remove the adverb, replace it with a stronger verb or adjective, or add it to allowedAdverbs if it is essential.',

  check({ text, sourceMap, options }: RuleInput<NoAdverbOveruseOptions>): Diagnostic[] {
    const maxAdverbs = options.maxAdverbs ?? DEFAULT_MAX_ADVERBS
    const allowed = new Set((options.allowedAdverbs ?? DEFAULT_ALLOWED_ADVERBS).map(value => value.toLowerCase()))

    const doc = createDoc(text)
    const matches = doc.match('#Adverb')

    const occurrences = getMatchOccurrences(text, matches)
      .map((occurrence) => ({
        ...occurrence,
        text: occurrence.text.replace(/[^a-zA-Z]+$/, ''),
      }))
      .filter((occurrence) => /ly$/i.test(occurrence.text))
      .filter((occurrence) => !allowed.has(occurrence.text.toLowerCase()))
      .sort((left, right) => left.start - right.start)

    const diagnostics: Diagnostic[] = []

    for (let index = maxAdverbs; index < occurrences.length; index += 1) {
      const occurrence = occurrences[index]!
      const start = sourceMap[occurrence.start]
      const end = sourceMap[occurrence.end - 1]
      if (start === undefined || end === undefined) continue

      diagnostics.push({
        ruleId: 'no-adverb-overuse',
        severity: 'warn',
        message: `reduce adverb overuse: "${occurrence.text}" exceeds the limit of ${maxAdverbs} -ly adverb${maxAdverbs === 1 ? '' : 's'}`,
        range: { start, end: end + 1 },
        help: noAdverbOveruse.help,
      })
    }

    return diagnostics
  },
}
