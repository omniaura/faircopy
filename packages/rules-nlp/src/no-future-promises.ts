import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoFuturePromisesOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'will help you',
  'will enable',
  'will transform',
  'will allow you to',
  'will empower',
]

export const noFuturePromises: Rule<NoFuturePromisesOptions> = {
  id: 'no-future-promises',
  description: 'Flag future-tense promises without present evidence',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Future promises defer proof. Rewrite the claim around current behavior, concrete evidence, or a specific outcome already available.',

  check({ text, sourceMap, options }: RuleInput<NoFuturePromisesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES

    for (const phrase of phrases) {
      const re = new RegExp(`\\b${escapeRegExp(phrase).replace(/\\s+/g, '\\s+')}\\b`, 'gi')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedPhrase = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + matchedPhrase.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-future-promises',
          severity: 'warn',
          message: `replace future promise "${matchedPhrase}" with present evidence`,
          range: { start, end: end + 1 },
          help: noFuturePromises.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
