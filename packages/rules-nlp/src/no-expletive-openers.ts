import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences, getOccurrenceRange } from './utils.js'

export interface NoExpletiveOpenersOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'there is',
  'there are',
  'there was',
  'there were',
  'there will be',
  'it is',
  'it was',
]

export const noExpletiveOpeners: Rule<NoExpletiveOpenersOptions> = {
  id: 'no-expletive-openers',
  description: 'Flag sentence openings that delay the real subject',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Expletive openers like "there are" and "it is" make copy indirect. Start with the actor, product, or benefit so the sentence lands faster.',

  check({ text, sourceMap, options }: RuleInput<NoExpletiveOpenersOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES
    const doc = createDoc(text)

    for (const phrase of phrases) {
      const matches = doc.match(phrase)
      for (const occurrence of getMatchOccurrences(text, matches)) {
        if (!startsSentence(text, occurrence.start)) continue

        const range = getOccurrenceRange(sourceMap, occurrence)
        if (!range) continue

        diagnostics.push({
          ruleId: 'no-expletive-openers',
          severity: 'warn',
          message: `start with the real subject instead of "${occurrence.text.toLowerCase()}"`,
          range,
          help: noExpletiveOpeners.help,
        })
      }
    }

    return diagnostics
  },
}

function startsSentence(text: string, start: number): boolean {
  let index = start - 1
  while (index >= 0 && /\s/.test(text[index]!)) index--
  return index < 0 || /[.!?]/.test(text[index]!)
}
