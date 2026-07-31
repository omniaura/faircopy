import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoAiGenericPhrasesOptions {
  phrases?: string[]
  allowedPhrases?: string[]
}

const DEFAULT_PHRASES = [
  'delve',
  'in the world of',
  'in the realm of',
  "it's important to note",
  'it is important to note',
  'it should be noted',
  'as an ai',
  'as a language model',
  'as an artificial intelligence',
  'tapestry',
  'landscape',
  'ever-evolving',
  'ever evolving',
  'multifaceted',
  'robust',
  'leverage',
  'utilize',
  'foster',
  'cascade',
  'orchestrate',
  'spearhead',
  'pivotal',
  'crucial',
  'vital',
  'essential',
  'remember that',
  'keep in mind',
  'it is worth noting',
  "it's worth noting",
  'notably',
  'undoubtedly',
  'certainly',
  'obviously',
  'needless to say',
  'it goes without saying',
  'in conclusion',
  'to conclude',
  'ultimately',
  'overall',
  'all in all',
  'at the end of the day',
  'in summary',
  'to summarize',
  'going forward',
  'moving forward',
]

export const noAiGenericPhrases: Rule<NoAiGenericPhrasesOptions> = {
  id: 'no-ai-generic-phrases',
  description: 'Flag generic AI-text phrases and empty rhetorical fillers',
  defaults: { phrases: DEFAULT_PHRASES, allowedPhrases: [] },
  help: 'Generic AI phrases make copy sound impersonal and interchangeable. Replace them with a concrete observation, a specific action, or delete the filler entirely. Use allowedPhrases for terms that are acceptable in your domain.',

  check({ text, sourceMap, options }: RuleInput<NoAiGenericPhrasesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES
    const allowed = new Set((options.allowedPhrases ?? []).map(normalize))

    for (const phrase of phrases) {
      const normalizedPhrase = normalize(phrase)
      if (allowed.has(normalizedPhrase)) continue

      const re = new RegExp(`\\b${escapeRegExp(phrase).replace(/\\s+/g, '\\s+')}\\b`, 'gi')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedPhrase = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + matchedPhrase.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-ai-generic-phrases',
          severity: 'warn',
          message: `replace generic phrase "${matchedPhrase}"`,
          range: { start, end: end + 1 },
          help: noAiGenericPhrases.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
