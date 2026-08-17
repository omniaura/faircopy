import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getOccurrenceRange } from './utils.js'

export interface NoOverusedAdverbsOptions {
  /** Maximum occurrences of a single adverb allowed before later ones are flagged. */
  threshold?: number
  /** Minimum character length for an adverb to be considered. */
  minLength?: number
  /** Adverbs that are allowed and do not count toward the threshold. */
  allowedAdverbs?: string[]
  /** If provided, only these adverbs are checked. */
  adverbs?: string[]
}

const DEFAULT_THRESHOLD = 3
const DEFAULT_MIN_LENGTH = 3
const DEFAULT_ALLOWED_ADVERBS = ['only', 'not']

export const noOverusedAdverbs: Rule<NoOverusedAdverbsOptions> = {
  id: 'no-overused-adverbs',
  description: 'Flag adverbs that appear excessively across the text',
  defaults: {
    threshold: DEFAULT_THRESHOLD,
    minLength: DEFAULT_MIN_LENGTH,
    allowedAdverbs: DEFAULT_ALLOWED_ADVERBS,
  },
  help: 'Repeating the same adverb throughout a passage weakens copy and reads as filler. Replace the adverb with a stronger verb or adjective, cut it, or add it to allowedAdverbs if it is essential.',

  check({ text, sourceMap, options }: RuleInput<NoOverusedAdverbsOptions>): Diagnostic[] {
    const threshold = options.threshold ?? DEFAULT_THRESHOLD
    const minLength = options.minLength ?? DEFAULT_MIN_LENGTH
    const allowed = new Set((options.allowedAdverbs ?? DEFAULT_ALLOWED_ADVERBS).map(value => value.toLowerCase()))
    const adverbFilter = options.adverbs ? new Set(options.adverbs.map(value => value.toLowerCase())) : null

    const doc = createDoc(text)
    const sentences = doc.json({ offset: true, terms: { offset: true, tags: true } })

    const occurrencesByAdverb = new Map<string, Array<{ text: string; start: number; end: number }>>()

    for (const sentence of sentences) {
      for (const term of sentence.terms ?? []) {
        if (!term.tags?.includes('Adverb')) continue

        const rawText = term.text?.replace(/[^a-zA-Z]+$/, '') ?? ''
        const normalized = rawText.toLowerCase()
        if (!normalized || normalized.length < minLength) continue
        if (allowed.has(normalized)) continue
        if (adverbFilter && !adverbFilter.has(normalized)) continue

        const start = term.offset?.start
        const length = term.offset?.length
        if (typeof start !== 'number' || typeof length !== 'number') continue

        const occurrence = { text: rawText, start, end: start + length }
        const existing = occurrencesByAdverb.get(normalized)
        if (existing) {
          existing.push(occurrence)
        } else {
          occurrencesByAdverb.set(normalized, [occurrence])
        }
      }
    }

    const diagnostics: Diagnostic[] = []

    for (const [, occurrences] of occurrencesByAdverb) {
      if (occurrences.length <= threshold) continue

      for (let index = threshold; index < occurrences.length; index += 1) {
        const occurrence = occurrences[index]!
        const range = getOccurrenceRange(sourceMap, occurrence)
        if (!range) continue

        diagnostics.push({
          ruleId: 'no-overused-adverbs',
          severity: 'warn',
          message: `reduce overused adverb: "${occurrence.text}" appears ${occurrences.length} times`,
          range,
          help: noOverusedAdverbs.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
