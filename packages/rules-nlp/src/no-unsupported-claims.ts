import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoUnsupportedClaimsOptions {
  phrases?: string[]
  allowedPhrases?: string[]
}

const DEFAULT_PHRASES = [
  'studies show',
  'research shows',
  'studies suggest',
  'research suggests',
  'experts agree',
  'many experts agree',
  'it is widely known',
  'widely known',
  'commonly understood',
  'it is well established',
  'well established',
  'it has been shown',
  'evidence suggests',
  'according to research',
  'sources say',
  'some say',
  'people are saying',
  'it is often said',
  'widely accepted',
  'generally accepted',
]

export const noUnsupportedClaims: Rule<NoUnsupportedClaimsOptions> = {
  id: 'no-unsupported-claims',
  description: 'Flag vague appeals to authority or consensus without a source',
  defaults: { phrases: DEFAULT_PHRASES, allowedPhrases: [] },
  help: 'Vague appeals to "studies", "experts", or "research" make copy sound like AI hallucination. Cite a specific source, name the study, or remove the claim.',

  check({ text, sourceMap, options }: RuleInput<NoUnsupportedClaimsOptions>): Diagnostic[] {
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
          ruleId: 'no-unsupported-claims',
          severity: 'warn',
          message: `unsupported claim "${matchedPhrase}" — cite a source or remove it`,
          range: { start, end: end + 1 },
          help: noUnsupportedClaims.help,
        })
      }
    }

    return dedupeByRange(diagnostics).sort((left, right) => left.range.start - right.range.start)
  },
}

function dedupeByRange(diagnostics: Diagnostic[]): Diagnostic[] {
  const sorted = diagnostics.slice().sort((left, right) => {
    if (left.range.start !== right.range.start) return left.range.start - right.range.start
    return right.range.end - left.range.end
  })

  const kept: Diagnostic[] = []
  for (const diagnostic of sorted) {
    const contained = kept.some(
      kept => kept.range.start <= diagnostic.range.start && kept.range.end >= diagnostic.range.end,
    )
    if (!contained) kept.push(diagnostic)
  }
  return kept
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
