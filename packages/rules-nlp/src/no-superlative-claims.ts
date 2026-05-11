import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoSuperlativeClaimsOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'best',
  'leading',
  'world-class',
  'top',
  'premier',
  'ultimate',
  'industry-leading',
  'cutting-edge',
  'state-of-the-art',
]

export const noSuperlativeClaims: Rule<NoSuperlativeClaimsOptions> = {
  id: 'no-superlative-claims',
  description: 'Flag unproven superlatives and market-positioning claims',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Superlative claims need proof. Replace broad market-positioning words with evidence, scope, or a concrete product behavior.',

  check({ text, sourceMap, options }: RuleInput<NoSuperlativeClaimsOptions>): Diagnostic[] {
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
          ruleId: 'no-superlative-claims',
          severity: 'warn',
          message: `prove or remove superlative claim "${matchedPhrase.toLowerCase()}"`,
          range: { start, end: end + 1 },
          help: noSuperlativeClaims.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
