import type { Diagnostic, Rule, RuleInput, Suggestion } from '@faircopy/core'

export interface RedundantPhrase {
  phrase: string
  replacement: string
}

export interface NoRedundantPhrasesOptions {
  phrases?: RedundantPhrase[]
}

const DEFAULT_PHRASES: RedundantPhrase[] = [
  { phrase: 'in order to', replacement: 'to' },
  { phrase: 'due to the fact that', replacement: 'because' },
  { phrase: 'in spite of the fact that', replacement: 'although' },
  { phrase: 'at this point in time', replacement: 'now' },
  { phrase: 'in the event that', replacement: 'if' },
  { phrase: 'for the purpose of', replacement: 'to' },
  { phrase: 'with regard to', replacement: 'about' },
  { phrase: 'in close proximity to', replacement: 'near' },
  { phrase: 'a large number of', replacement: 'many' },
  { phrase: 'the reason is that', replacement: 'because' },
  { phrase: 'in the vicinity of', replacement: 'near' },
  { phrase: 'on the occasion of', replacement: 'when' },
  { phrase: 'in view of the fact that', replacement: 'because' },
  { phrase: 'owing to the fact that', replacement: 'because' },
  { phrase: 'for the reason that', replacement: 'because' },
  { phrase: 'in light of the fact that', replacement: 'because' },
  { phrase: 'it is important to note that', replacement: '' },
  { phrase: 'it should be noted that', replacement: '' },
  { phrase: 'needless to say', replacement: '' },
  { phrase: 'it goes without saying that', replacement: '' },
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPhrasePattern(phrase: string): RegExp {
  const escaped = escapeRegExp(phrase).replace(/\\s+/g, '\\s+')
  return new RegExp(`\\b${escaped}\\b`, 'gi')
}

export const noRedundantPhrases: Rule<NoRedundantPhrasesOptions> = {
  id: 'no-redundant-phrases',
  description: 'Flag wordy redundant phrases and suggest concise replacements',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Redundant phrases pad copy with extra words that add no meaning. ' +
    'Replace them with the concise alternative, or delete the phrase entirely ' +
    'if the replacement is empty.',

  check({ text, sourceMap, options }: RuleInput<NoRedundantPhrasesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES

    for (const { phrase, replacement } of phrases) {
      const re = buildPhrasePattern(phrase)
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedPhrase = match[0]
        const start = sourceMap[match.index]!
        const end = sourceMap[match.index + matchedPhrase.length - 1]! + 1

        const suggest: Suggestion = {
          description: replacement
            ? `replace "${matchedPhrase}" with "${replacement}"`
            : `delete "${matchedPhrase}"`,
          edits: [{ range: { start, end }, replacement }],
        }

        diagnostics.push({
          ruleId: 'no-redundant-phrases',
          severity: 'warn',
          message: replacement
            ? `"${matchedPhrase}" is redundant — use "${replacement}"`
            : `"${matchedPhrase}" is redundant — delete it`,
          range: { start, end },
          help: noRedundantPhrases.help,
          suggest,
        })
      }
    }

    return diagnostics
  },
}
