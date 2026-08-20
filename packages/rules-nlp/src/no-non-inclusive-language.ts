import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getOccurrenceRange, type MatchOccurrence } from './utils.js'

export interface NonInclusiveTerm {
  term: string
  alternatives: string[]
  /** Require the whole phrase to match with word boundaries. Default false. */
  exact?: boolean
}

export interface NoNonInclusiveLanguageOptions {
  /** Terms to flag with suggested alternatives. */
  terms?: NonInclusiveTerm[]
  /** Terms to allow and skip. */
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
  { term: 'sanity check', alternatives: ['quick check', 'confidence check', 'verification'], exact: true },
  { term: 'blind spot', alternatives: ['unaware area', 'gap', 'oversight'], exact: true },
  { term: 'grandfathered', alternatives: ['legacy status', 'exempted'] },
  { term: 'mankind', alternatives: ['humanity', 'humankind', 'people'] },
]

/** Terms that can also be verbs; only flag when used as nouns or adjectives. */
const VERB_AMBIGUOUS_TERMS = new Set(['master', 'slave'])

interface JsonTerm {
  text?: string
  normal?: string
  tags?: string[]
  offset?: { start?: number; length?: number }
}

interface JsonMatch {
  text?: string
  terms?: JsonTerm[]
  offset?: { start?: number; length?: number }
}

function toMatchPattern(rawTerm: string): string {
  return rawTerm
}

function isProblematicUsage(term: NonInclusiveTerm, terms: JsonTerm[]): boolean {
  if (!VERB_AMBIGUOUS_TERMS.has(term.term.toLowerCase())) return true
  if (terms.length !== 1) return true
  const tags = terms[0]!.tags ?? []
  const isVerb = tags.includes('Verb')
  const isNounOrAdjective = tags.includes('Noun') || tags.includes('Adjective')
  // Skip verb-only usages of ambiguous terms (e.g., "master the skill").
  return !isVerb || isNounOrAdjective
}

function getOccurrenceFromMatch(entry: JsonMatch, originalText: string): MatchOccurrence | null {
  const terms = entry.terms
  if (!terms?.length) return null

  const firstOffset = terms[0]!.offset
  const lastOffset = terms[terms.length - 1]!.offset
  if (
    typeof firstOffset?.start !== 'number' ||
    typeof firstOffset.length !== 'number' ||
    typeof lastOffset?.start !== 'number' ||
    typeof lastOffset.length !== 'number'
  ) {
    return null
  }

  const start = firstOffset.start
  const end = lastOffset.start + lastOffset.length
  if (end <= start) return null

  return {
    text: originalText.slice(start, end),
    start,
    end,
  }
}

export const noNonInclusiveLanguage: Rule<NoNonInclusiveLanguageOptions> = {
  id: 'no-non-inclusive-language-nlp',
  description: 'Flag non-inclusive terms and suggest neutral alternatives using NLP-aware matching',
  defaults: { terms: DEFAULT_TERMS, allowedTerms: [] },
  help: 'Non-inclusive terms can alienate readers. Replace them with neutral alternatives that name the same idea without relying on identity, ability, or historical power metaphors.',

  check({ text, sourceMap, options }: RuleInput<NoNonInclusiveLanguageOptions>): Diagnostic[] {
    const terms = options.terms?.length ? options.terms : DEFAULT_TERMS
    const allowed = new Set((options.allowedTerms ?? []).map(term => term.toLowerCase()))

    const doc = createDoc(text)
    const diagnostics: Diagnostic[] = []

    for (const term of terms) {
      if (allowed.has(term.term.toLowerCase())) continue

      const pattern = toMatchPattern(term.term)
      const matches = doc.match(pattern)
      const json = matches.json({ offset: true, text: true, terms: { offset: true, text: true, tags: true } }) as JsonMatch[]

      for (const entry of json) {
        if (!isProblematicUsage(term, entry.terms ?? [])) continue

        const occurrence = getOccurrenceFromMatch(entry, text)
        if (!occurrence) continue

        const range = getOccurrenceRange(sourceMap, occurrence)
        if (!range) continue

        const suggestion = term.alternatives.join(', ')
        diagnostics.push({
          ruleId: 'no-non-inclusive-language-nlp',
          severity: 'error',
          message: `replace "${occurrence.text}" with a neutral alternative such as "${suggestion}"`,
          range,
          help: noNonInclusiveLanguage.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
