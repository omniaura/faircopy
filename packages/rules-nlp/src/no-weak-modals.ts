import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences, getOccurrenceRange } from './utils.js'

export interface NoWeakModalsOptions {
  modals?: string[]
  verbs?: string[]
}

const DEFAULT_MODALS = ['can', 'could', 'may', 'might']
const DEFAULT_VERBS = [
  'boost',
  'drive',
  'enable',
  'help',
  'improve',
  'increase',
  'make',
  'reduce',
  'support',
  'transform',
  'unlock',
]

export const noWeakModals: Rule<NoWeakModalsOptions> = {
  id: 'no-weak-modals',
  description: 'Flag hedged modal claims like "can help" and "might improve"',
  defaults: { modals: DEFAULT_MODALS, verbs: DEFAULT_VERBS },
  help: 'Hedged modal claims sound tentative. Replace them with the outcome, capability, or proof you can stand behind.',

  check({ text, sourceMap, options }: RuleInput<NoWeakModalsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const modals = new Set((options.modals?.length ? options.modals : DEFAULT_MODALS).map(value => value.toLowerCase()))
    const verbs = new Set((options.verbs?.length ? options.verbs : DEFAULT_VERBS).map(value => value.toLowerCase()))
    const doc = createDoc(text)
    const matches = doc.match('#Modal #Adverb? #Verb')

    for (const occurrence of getMatchOccurrences(text, matches)) {
      const words = occurrence.text.trim().split(/\s+/)
      const modal = words[0]?.toLowerCase()
      const verb = words[words.length - 1]?.toLowerCase()
      if (!modal || !verb || !modals.has(modal) || !verbs.has(verb)) continue

      const range = getOccurrenceRange(sourceMap, occurrence)
      if (!range) continue

      diagnostics.push({
        ruleId: 'no-weak-modals',
        severity: 'warn',
        message: `replace "${occurrence.text.toLowerCase()}" with a direct claim`,
        range,
        help: noWeakModals.help,
      })
    }

    return diagnostics
  },
}
