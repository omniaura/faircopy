import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import nlp from 'compromise'
import { getMatchOccurrences, getOccurrenceRange } from './utils.js'
import type { JsonOffsetEntry } from './types.js'

export interface NoVagueComparativesOptions {
  /** Comparative words or phrases that require a baseline. */
  comparatives?: string[]
  /** Whether to require "than" in the same sentence to avoid flagging. */
  requireThan?: boolean
}

const DEFAULT_OPTIONS: Required<NoVagueComparativesOptions> = {
  comparatives: [
    'better',
    'worse',
    'more',
    'less',
    'faster',
    'slower',
    'easier',
    'harder',
    'stronger',
    'weaker',
    'higher',
    'lower',
    'bigger',
    'smaller',
    'greater',
  ],
  requireThan: true,
}

export const noVagueComparatives: Rule<NoVagueComparativesOptions> = {
  id: 'no-vague-comparatives',
  description: 'Flag comparative claims that omit a clear baseline',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Comparative words like "better" or "faster" only persuade when the reader knows what is being compared. ' +
    'Add "than" and a concrete baseline, or rephrase with a specific metric.',

  check({ text, sourceMap, options }: RuleInput<NoVagueComparativesOptions>): Diagnostic[] {
    const comparatives = new Set(
      (options.comparatives ?? DEFAULT_OPTIONS.comparatives).map(word => word.toLowerCase())
    )
    const requireThan = options.requireThan ?? DEFAULT_OPTIONS.requireThan

    if (comparatives.size === 0) return []

    const doc = nlp(text)
    const diagnostics: Diagnostic[] = []
    const seenRanges: Array<{ start: number; end: number }> = []

    const sentences = doc.sentences().json({ offset: true, terms: { offset: true, text: true } }) as JsonOffsetEntry[]

    for (const sentence of sentences) {
      const sentenceStart = sentence.offset?.start ?? sentence.terms?.[0]?.offset?.start
      const sentenceLength = sentence.offset?.length ?? sentence.terms?.reduce((sum, term) => sum + (term.offset?.length ?? 0), 0)
      if (typeof sentenceStart !== 'number' || typeof sentenceLength !== 'number') continue
      const sentenceEnd = sentenceStart + sentenceLength

      const sentenceText = sentence.text ?? text.slice(sentenceStart, sentenceEnd)
      const sentenceDoc = nlp(sentenceText)

      // Build patterns that capture both compromise-tagged comparatives and explicit user-configured words.
      const explicitComparatives = Array.from(comparatives).join('|')
      const patterns = [
        '#Comparative',
        `(more|less) #Adjective`,
        `(more|less) #Adverb`,
        `(${explicitComparatives})`,
      ]

      for (const pattern of patterns) {
        const matches = sentenceDoc.match(pattern)

        for (const occurrence of getMatchOccurrences(sentenceText, matches)) {
          const words = occurrence.text.trim().toLowerCase().split(/\s+/)
          const matchedComparative = words.find(word => comparatives.has(word.replace(/[^a-zA-Z]+$/, '')))
          if (!matchedComparative) continue

          // Occurrence offsets are relative to the sentence; convert to full-text offsets.
          const trailingPunctuation = occurrence.text.match(/[^a-zA-Z\s]+$/)?.[0].length ?? 0
          const occurrenceStart = sentenceStart + occurrence.start
          const occurrenceEnd = sentenceStart + occurrence.end - trailingPunctuation

          if (seenRanges.some(range => occurrenceStart < range.end && occurrenceEnd > range.start)) continue
          seenRanges.push({ start: occurrenceStart, end: occurrenceEnd })

          if (requireThan && sentenceDoc.has('than')) continue

          const range = getOccurrenceRange(sourceMap, { text: occurrence.text, start: occurrenceStart, end: occurrenceEnd })
          if (!range) continue

          diagnostics.push({
            ruleId: 'no-vague-comparatives',
            severity: 'warn',
            message: `comparative "${occurrence.text.trim().replace(/[^a-zA-Z\s]+$/, '')}" needs a baseline — add "than" or a concrete comparison`,
            range,
            help: noVagueComparatives.help,
          })
        }
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
