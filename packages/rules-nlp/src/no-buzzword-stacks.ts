import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoBuzzwordStacksOptions {
  terms?: string[]
  maxTermsPerSentence?: number
}

const DEFAULT_TERMS = [
  'alignment',
  'automation',
  'collaboration',
  'efficiency',
  'engagement',
  'experience',
  'growth',
  'impact',
  'innovation',
  'intelligence',
  'optimization',
  'platform',
  'productivity',
  'solution',
  'strategy',
  'transformation',
  'value',
  'velocity',
  'workflow',
]

export const noBuzzwordStacks: Rule<NoBuzzwordStacksOptions> = {
  id: 'no-buzzword-stacks',
  description: 'Flag sentences overloaded with abstract benefit nouns',
  defaults: { terms: DEFAULT_TERMS, maxTermsPerSentence: 2 },
  help: 'Buzzword-heavy sentences make copy sound interchangeable. Replace abstract benefit nouns with the specific product behavior, customer outcome, or proof point.',

  check({ text, sourceMap, options }: RuleInput<NoBuzzwordStacksOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const terms = options.terms?.length ? options.terms : DEFAULT_TERMS
    const maxTermsPerSentence = options.maxTermsPerSentence ?? 2
    if (maxTermsPerSentence < 1) return diagnostics

    for (const sentence of getSentenceRanges(text)) {
      const hits = getTermHits(sentence.text, terms)
      if (hits.length <= maxTermsPerSentence) continue

      const startOffset = sentence.start + hits[0]!.start
      const endOffset = sentence.start + hits[hits.length - 1]!.end
      const start = sourceMap[startOffset]
      const end = sourceMap[endOffset - 1]
      if (start === undefined || end === undefined) continue

      const words = hits.map(hit => hit.text.toLowerCase()).join(', ')
      diagnostics.push({
        ruleId: 'no-buzzword-stacks',
        severity: 'warn',
        message: `replace buzzword stack: ${words}`,
        range: { start, end: end + 1 },
        help: noBuzzwordStacks.help,
      })
    }

    return diagnostics
  },
}

interface SentenceRange {
  text: string
  start: number
}

interface TermHit {
  text: string
  start: number
  end: number
}

function getSentenceRanges(text: string): SentenceRange[] {
  const ranges: SentenceRange[] = []
  const re = /[^.!?]+[.!?]?/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const leadingWhitespaceLength = match[0].match(/^\s*/)?.[0].length ?? 0
    const sentence = match[0].trim()
    if (!sentence) continue
    ranges.push({ text: sentence, start: match.index + leadingWhitespaceLength })
  }
  return ranges
}

function getTermHits(text: string, terms: string[]): TermHit[] {
  const termPattern = terms.map(escapeRegex).join('|')
  if (!termPattern) return []

  const hits: TermHit[] = []
  const re = new RegExp(`\\b(${termPattern})\\b`, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    hits.push({ text: match[0], start: match.index, end: match.index + match[0].length })
  }
  return hits
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
