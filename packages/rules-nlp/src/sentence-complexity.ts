import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc } from './utils.js'

export interface SentenceComplexityOptions {
  /** Maximum number of words allowed in a single sentence. */
  maxWordCount?: number
  /** Maximum number of finite-verb clauses allowed in a single sentence. */
  maxClauseCount?: number
}

const DEFAULT_OPTIONS: Required<SentenceComplexityOptions> = {
  maxWordCount: 25,
  maxClauseCount: 3,
}

export const sentenceComplexity: Rule<SentenceComplexityOptions> = {
  id: 'sentence-complexity',
  description: 'Flag sentences that exceed a word or clause threshold',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Long, clause-heavy sentences are harder to read. Split them into shorter sentences that each make one point.',

  check({ text, sourceMap, options }: RuleInput<SentenceComplexityOptions>): Diagnostic[] {
    const maxWordCount = options.maxWordCount ?? DEFAULT_OPTIONS.maxWordCount
    const maxClauseCount = options.maxClauseCount ?? DEFAULT_OPTIONS.maxClauseCount

    const doc = createDoc(text)
    const sentences = doc.sentences().json({ offset: true, terms: { offset: true, tags: true } })

    const diagnostics: Diagnostic[] = []

    for (const sentence of sentences) {
      if (!sentence.offset || !sentence.terms) continue

      const terms = sentence.terms.filter(term => /[a-zA-Z0-9]/.test(term.text ?? ''))
      const wordCount = terms.length

      const clauseCount = terms.filter((term) => {
        const tags = term.tags ?? []
        return tags.includes('Verb') && !tags.includes('Gerund') && !tags.includes('Infinitive') && !tags.includes('Particle')
      }).length

      if (wordCount <= maxWordCount && clauseCount <= maxClauseCount) continue

      const start = sentence.offset.start ?? 0
      const length = sentence.offset.length ?? 0
      const end = start + length

      const sourceStart = sourceMap[start]
      const sourceEnd = sourceMap[end - 1]
      if (sourceStart === undefined || sourceEnd === undefined) continue

      const reasons: string[] = []
      if (wordCount > maxWordCount) reasons.push(`${wordCount} words (max ${maxWordCount})`)
      if (clauseCount > maxClauseCount) reasons.push(`${clauseCount} clauses (max ${maxClauseCount})`)

      diagnostics.push({
        ruleId: 'sentence-complexity',
        severity: 'warn',
        message: `sentence is too complex: ${reasons.join(', ')} — consider splitting it`,
        range: { start: sourceStart, end: sourceEnd + 1 },
        help: sentenceComplexity.help,
        suggest: {
          description: 'Split this sentence into shorter sentences, one idea each.',
          edits: [],
        },
      })
    }

    return diagnostics
  },
}
