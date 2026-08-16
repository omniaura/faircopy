import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc } from './utils.js'

export interface NoOverlyComplexSentencesOptions {
  /** Maximum total conjunctions allowed in a single sentence. */
  maxConjunctions?: number
  /** Maximum coordinating conjunctions allowed in a single sentence. */
  maxCoordinating?: number
  /** Maximum subordinating conjunctions allowed in a single sentence. */
  maxSubordinating?: number
  /** Words or phrases to treat as coordinating conjunctions. */
  coordinating?: string[]
  /** Words or phrases to treat as subordinating conjunctions. */
  subordinating?: string[]
  /** Words or phrases to ignore when counting. */
  allowList?: string[]
}

const DEFAULT_MAX_CONJUNCTIONS = 4
const DEFAULT_MAX_COORDINATING = 3
const DEFAULT_MAX_SUBORDINATING = 2

const DEFAULT_COORDINATING = ['and', 'but', 'or', 'nor', 'yet', 'so']
const DEFAULT_SUBORDINATING = [
  'because',
  'although',
  'though',
  'while',
  'since',
  'unless',
  'if',
  'when',
  'after',
  'before',
  'until',
  'whether',
  'once',
]

interface ConjunctionPattern {
  phrase: string
  category: 'coordinating' | 'subordinating'
  regex: RegExp
}

export const noOverlyComplexSentences: Rule<NoOverlyComplexSentencesOptions> = {
  id: 'no-overly-complex-sentences',
  description: 'Flag sentences with too many coordinating or subordinating conjunctions',
  defaults: {
    maxConjunctions: DEFAULT_MAX_CONJUNCTIONS,
    maxCoordinating: DEFAULT_MAX_COORDINATING,
    maxSubordinating: DEFAULT_MAX_SUBORDINATING,
    coordinating: DEFAULT_COORDINATING,
    subordinating: DEFAULT_SUBORDINATING,
    allowList: [],
  },
  help: 'Sentences packed with conjunctions are often run-ons or nested too deeply. Break them into shorter sentences so each point stands on its own.',

  check({ text, sourceMap, options }: RuleInput<NoOverlyComplexSentencesOptions>): Diagnostic[] {
    const maxConjunctions = options.maxConjunctions ?? DEFAULT_MAX_CONJUNCTIONS
    const maxCoordinating = options.maxCoordinating ?? DEFAULT_MAX_COORDINATING
    const maxSubordinating = options.maxSubordinating ?? DEFAULT_MAX_SUBORDINATING

    const coordinating = (options.coordinating ?? DEFAULT_COORDINATING).map(value =>
      value.toLowerCase().trim(),
    )
    const subordinating = (options.subordinating ?? DEFAULT_SUBORDINATING).map(value =>
      value.toLowerCase().trim(),
    )
    const allowList = new Set(
      (options.allowList ?? []).map(value => value.toLowerCase().trim()),
    )

    const patterns: ConjunctionPattern[] = [
      ...coordinating.map(phrase => ({
        phrase,
        category: 'coordinating' as const,
        regex: phraseToRegex(phrase),
      })),
      ...subordinating.map(phrase => ({
        phrase,
        category: 'subordinating' as const,
        regex: phraseToRegex(phrase),
      })),
    ].sort((a, b) => b.phrase.length - a.phrase.length)

    const doc = createDoc(text)
    const sentences = doc.sentences().json({ offset: true, terms: { offset: true } })

    const diagnostics: Diagnostic[] = []

    for (const sentence of sentences) {
      if (!sentence.offset || !sentence.terms) continue

      const sentenceStart = sentence.offset.start ?? 0
      const sentenceText = sentence.text ?? ''
      const matchedRanges: Array<{ start: number; end: number }> = []

      let coordinatingCount = 0
      let subordinatingCount = 0

      for (const { phrase, category, regex } of patterns) {
        if (allowList.has(phrase)) continue

        let match: RegExpExecArray | null
        while ((match = regex.exec(sentenceText)) !== null) {
          const matchStart = match.index
          const matchEnd = match.index + match[0].length

          // Avoid counting the same tokens twice when shorter phrases overlap.
          if (matchedRanges.some(range => matchStart < range.end && matchEnd > range.start)) {
            continue
          }

          matchedRanges.push({ start: matchStart, end: matchEnd })

          if (category === 'coordinating') {
            coordinatingCount += 1
          } else {
            subordinatingCount += 1
          }
        }
      }

      const total = coordinatingCount + subordinatingCount
      if (
        total <= maxConjunctions &&
        coordinatingCount <= maxCoordinating &&
        subordinatingCount <= maxSubordinating
      ) {
        continue
      }

      const length = sentence.offset.length ?? 0
      const sentenceEnd = sentenceStart + length

      const sourceStart = sourceMap[sentenceStart]
      const sourceEnd = sourceMap[sentenceEnd - 1]
      if (sourceStart === undefined || sourceEnd === undefined) continue

      const reasons: string[] = []
      if (total > maxConjunctions) {
        reasons.push(`${total} conjunctions (max ${maxConjunctions})`)
      }
      if (coordinatingCount > maxCoordinating) {
        reasons.push(`${coordinatingCount} coordinating (max ${maxCoordinating})`)
      }
      if (subordinatingCount > maxSubordinating) {
        reasons.push(`${subordinatingCount} subordinating (max ${maxSubordinating})`)
      }

      diagnostics.push({
        ruleId: 'no-overly-complex-sentences',
        severity: 'warn',
        message: `sentence is overly complex: ${reasons.join(', ')} — consider splitting it`,
        range: { start: sourceStart, end: sourceEnd + 1 },
        help: noOverlyComplexSentences.help,
        suggest: {
          description: 'Split this sentence into shorter sentences, one idea each.',
          edits: [],
        },
      })
    }

    return diagnostics
  },
}

function phraseToRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const spaced = escaped.replace(/\s+/g, '\\s+')
  const source = spaced.includes('\\s+') ? spaced : `\\b${spaced}\\b`
  return new RegExp(source, 'gi')
}
