import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface NonInclusiveTerm {
  term: string
  alternatives: string[]
  /** Set to true on a multi-word phrase to require word boundaries. Default false matches the phrase anywhere. Single-word terms always use word boundaries. */
  exact?: boolean
}

export interface NoNonInclusiveLanguageOptions {
  /** Terms to flag with suggested alternatives. */
  terms?: NonInclusiveTerm[]
  /** Additional allowed terms that override defaults. */
  allowedTerms?: string[]
}

const DEFAULT_TERMS: NonInclusiveTerm[] = [
  { term: 'guys', alternatives: ['everyone', 'team', 'folks'] },
  { term: 'manpower', alternatives: ['workforce', 'staffing', 'personnel'] },
  { term: 'whitelist', alternatives: ['allowlist'] },
  { term: 'blacklist', alternatives: ['denylist', 'blocklist'] },
  { term: 'master', alternatives: ['primary', 'main', 'leader'] },
  { term: 'slave', alternatives: ['secondary', 'replica', 'follower'] },
  { term: 'crazy', alternatives: ['unexpected', 'intense', 'extreme'] },
  { term: 'insane', alternatives: ['extreme', 'unbelievable', 'remarkable'] },
  { term: 'dumb', alternatives: ['unhelpful', 'poor', 'uninformed'] },
  { term: 'lame', alternatives: ['unimpressive', 'inadequate', 'weak'] },
  { term: 'sanity check', alternatives: ['quick check', 'confidence check', 'verification'] },
  { term: 'blind spot', alternatives: ['unaware area', 'gap', 'oversight'] },
  { term: 'grandfathered', alternatives: ['legacy status', 'exempted'] },
  { term: 'mankind', alternatives: ['humanity', 'humankind', 'people'] },
]

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPattern(term: string, exact: boolean): RegExp {
  const escaped = escapeRegex(term)
  const isPhrase = /\s/.test(term)
  if (isPhrase) {
    if (exact) {
      return new RegExp(`\\b${escaped}\\b`, 'gi')
    }
    return new RegExp(escaped, 'gi')
  }
  return new RegExp(`\\b${escaped}\\b`, 'gi')
}

export const noNonInclusiveLanguage: Rule<NoNonInclusiveLanguageOptions> = {
  id: 'no-non-inclusive-language',
  description: 'Flag non-inclusive terms and suggest neutral alternatives',
  defaults: { terms: DEFAULT_TERMS, allowedTerms: [] },
  help: 'Non-inclusive terms can alienate readers. Replace them with neutral alternatives that name the same idea without relying on identity, ability, or historical power metaphors.',

  check({ text, sourceMap, options }: RuleInput<NoNonInclusiveLanguageOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const terms = options.terms?.length ? options.terms : DEFAULT_TERMS
    const allowed = new Set((options.allowedTerms ?? []).map(term => term.toLowerCase()))

    for (const { term, alternatives, exact } of terms) {
      if (allowed.has(term.toLowerCase())) continue

      const re = buildPattern(term, exact ?? false)
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        const suggestion = alternatives.join(', ')
        diagnostics.push({
          ruleId: 'no-non-inclusive-language',
          severity: 'error',
          message: `replace "${m[0]}" with a neutral alternative such as "${suggestion}"`,
          range: { start, end },
          help: noNonInclusiveLanguage.help,
        })
      }
    }

    return diagnostics
  },
}
