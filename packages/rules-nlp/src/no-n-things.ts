import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc } from './utils.js'

export interface NoNThingsOptions {
  /** Minimum cardinal count before the frame is flagged. Default 2, which leaves "one thing" idioms alone. */
  minCount?: number
  /** Placeholder nouns that complete the "N ___" frame. */
  nouns?: string[]
  /** Phrases to ignore entirely. */
  allowedPhrases?: string[]
}

const DEFAULT_OPTIONS: Required<NoNThingsOptions> = {
  minCount: 2,
  nouns: ['thing', 'things'],
  allowedPhrases: [],
}

interface JsonTerm {
  text?: string
  offset?: { start?: number; length?: number }
  tags?: string[]
}

interface JsonMatch {
  text?: string
  terms?: JsonTerm[]
}

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, ' ').trim()
}

function escapeMatchWord(word: string): string {
  return word.replace(/[^\w-]/g, '')
}

/**
 * "Three things." / "5 things to know" borrows its number for rhythm, not
 * content — the count-noun cousin of the rule of three, and a widely
 * documented AI-writing tell.
 */
export const noNThings: Rule<NoNThingsOptions> = {
  id: 'no-n-things',
  description: 'Flag the enumerated "N things" frame common in AI-generated copy',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'A count plus a placeholder noun ("three things", "5 things to know") spends its number on rhythm instead of meaning. ' +
    'Name the items in the heading, or drop the count and state the claim.',

  check({ text, sourceMap, options }: RuleInput<NoNThingsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const minCount = options.minCount ?? DEFAULT_OPTIONS.minCount
    const allowed = new Set((options.allowedPhrases ?? []).map(normalizePhrase))
    const nouns = (options.nouns?.length ? options.nouns : DEFAULT_OPTIONS.nouns)
      .map(escapeMatchWord)
      .filter(Boolean)
    if (!nouns.length || text.length === 0) return []

    const doc = createDoc(text)
    const matches = doc
      .match(`#Value+ (${nouns.join('|')})`)
      .json({ offset: true, text: true, terms: { offset: true, text: true, tags: true } }) as JsonMatch[]

    for (const entry of matches) {
      const terms = entry.terms ?? []
      if (terms.length < 2) continue

      const firstOffset = terms[0]!.offset
      const lastOffset = terms[terms.length - 1]!.offset
      if (
        typeof firstOffset?.start !== 'number' ||
        typeof firstOffset.length !== 'number' ||
        typeof lastOffset?.start !== 'number' ||
        typeof lastOffset.length !== 'number'
      ) {
        continue
      }

      const start = firstOffset.start
      const end = lastOffset.start + lastOffset.length
      if (end <= start) continue

      const matchedText = text.slice(start, end)
      if (allowed.has(normalizePhrase(matchedText))) continue

      // Only a cardinal count frames the trope. Ordinals ("first things
      // first") and vague values ("a few things") parse to non-numbers here.
      const countOut = doc.match(matchedText).values?.().toNumber().out('array') ?? []
      const countText = countOut[0]
      const count = typeof countText === 'string' ? Number(countText) : Number.NaN
      if (!Number.isFinite(count) || count < minCount) continue

      const sourceStart = sourceMap[start]
      const sourceEnd = sourceMap[end - 1]
      if (sourceStart === undefined || sourceEnd === undefined) continue

      diagnostics.push({
        ruleId: 'no-n-things',
        severity: 'warn',
        message: `rewrite "${matchedText}" with the concrete subject — a counted placeholder is an AI-writing tell`,
        range: { start: sourceStart, end: sourceEnd + 1 },
        help: noNThings.help,
      })
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
