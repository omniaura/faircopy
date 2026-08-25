import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getOccurrenceRange } from './utils.js'
import type { JsonOffsetTerm } from './types.js'

export interface NoNounStringsOptions {
  /** Maximum consecutive nouns allowed before flagging. */
  maxConsecutiveNouns?: number
  /** Phrases to allow and skip. */
  allowedPhrases?: string[]
}

const DEFAULT_OPTIONS: Required<NoNounStringsOptions> = {
  maxConsecutiveNouns: 3,
  allowedPhrases: [],
}

interface TermEntry {
  text: string
  start: number
  end: number
  tags: string[]
}

function isCountableNoun(entry: TermEntry): boolean {
  return entry.tags.includes('Noun') && !entry.tags.includes('ProperNoun')
}

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().replace(/\s+/g, ' ').trim()
}

export const noNounStrings: Rule<NoNounStringsOptions> = {
  id: 'no-noun-strings',
  description: 'Flag dense strings of consecutive nouns',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Three or more nouns in a row create dense, hard-to-read compounds. Rewrite them with prepositions or verbs.',

  check({ text, sourceMap, options }: RuleInput<NoNounStringsOptions>): Diagnostic[] {
    const maxConsecutiveNouns = options.maxConsecutiveNouns ?? DEFAULT_OPTIONS.maxConsecutiveNouns
    const allowed = new Set((options.allowedPhrases ?? []).map(normalizePhrase))

    if (maxConsecutiveNouns <= 1 || text.length === 0) return []

    const doc = createDoc(text)
    const rawTerms = doc.terms().json({
      offset: true,
      terms: { offset: true, text: true, tags: true },
    }) as Array<{
      text?: string
      offset?: { start?: number; length?: number }
      terms?: JsonOffsetTerm[]
    }>

    const terms: TermEntry[] = []
    for (const entry of rawTerms) {
      const inner = entry.terms?.[0]
      if (!inner) continue
      const offset = inner.offset ?? entry.offset
      const start = offset?.start
      const length = offset?.length
      if (typeof start !== 'number' || typeof length !== 'number' || length <= 0) continue

      terms.push({
        text: inner.text ?? entry.text ?? text.slice(start, start + length),
        start,
        end: start + length,
        tags: inner.tags ?? [],
      })
    }

    const diagnostics: Diagnostic[] = []
    let runStart = -1
    let runEnd = -1
    const runWords: string[] = []

    function flushRun(): void {
      if (runWords.length < maxConsecutiveNouns) return

      const phrase = runWords.join(' ')
      if (allowed.has(normalizePhrase(phrase))) return

      const range = getOccurrenceRange(sourceMap, { start: runStart, end: runEnd, text: phrase })
      if (!range) return

      diagnostics.push({
        ruleId: 'no-noun-strings',
        severity: 'warn',
        message: `noun string "${phrase}" is dense — rewrite with verbs or prepositions`,
        range,
        help: noNounStrings.help,
      })
    }

    for (const term of terms) {
      if (isCountableNoun(term)) {
        if (runWords.length === 0) {
          runStart = term.start
        }
        runEnd = term.end
        runWords.push(term.text)
      } else {
        flushRun()
        runWords.length = 0
        runStart = -1
        runEnd = -1
      }
    }

    flushRun()

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
