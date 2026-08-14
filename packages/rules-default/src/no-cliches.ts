import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface ClichePhrase {
  phrase: string
  alternatives: string[]
}

export interface NoClichesOptions {
  /** Phrases to flag with suggested alternatives. Replaces the default list. */
  phrases?: ClichePhrase[]
  /** Default phrases to allow. */
  allow?: string[]
}

const DEFAULT_PHRASES: ClichePhrase[] = [
  { phrase: 'world-class', alternatives: ['top-tier', 'exceptional', 'outstanding'] },
  { phrase: 'best-in-class', alternatives: ['leading', 'top-performing', 'category-leading'] },
  { phrase: 'cutting-edge', alternatives: ['advanced', 'modern', 'latest'] },
  { phrase: 'state-of-the-art', alternatives: ['advanced', 'modern', 'sophisticated'] },
  { phrase: 'game changer', alternatives: ['breakthrough', 'transformation', 'major advance'] },
  { phrase: 'game-changing', alternatives: ['transformative', 'breakthrough', 'revolutionary'] },
  { phrase: 'think outside the box', alternatives: ['be creative', 'innovate', 'find a new approach'] },
  { phrase: 'at the end of the day', alternatives: ['ultimately', 'finally', 'in summary'] },
  { phrase: 'low-hanging fruit', alternatives: ['easy wins', 'quick opportunities', 'simple targets'] },
  { phrase: 'move the needle', alternatives: ['make a measurable difference', 'drive results', 'create impact'] },
  { phrase: 'circle back', alternatives: ['follow up', 'reconnect', 'return to this'] },
  { phrase: 'give 110%', alternatives: ['do your best', 'make a full effort', 'go all in'] },
  { phrase: 'hit the ground running', alternatives: ['start quickly', 'get started immediately', 'begin effectively'] },
  { phrase: 'boil the ocean', alternatives: ['take on too much', 'overcomplicate', 'lose focus'] },
  { phrase: 'paradigm shift', alternatives: ['fundamental change', 'new approach', 'transformation'] },
  { phrase: 'next level', alternatives: ['advanced', 'improved', 'elevated'] },
  { phrase: 'seamless', alternatives: ['smooth', 'effortless', 'frictionless'] },
  { phrase: 'robust', alternatives: ['strong', 'resilient', 'reliable'] },
  { phrase: 'leverage', alternatives: ['use', 'take advantage of', 'utilize'] },
  { phrase: 'synergy', alternatives: ['collaboration', 'combined effect', 'partnership'] },
]

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildPattern(phrase: string): RegExp {
  const escaped = escapeRegex(phrase)
  return new RegExp(`(?<!\\w)${escaped}(?!\\w)`, 'gi')
}

export const noCliches: Rule<NoClichesOptions> = {
  id: 'no-cliches',
  description: 'Flag overused or clichéd phrases and suggest fresher alternatives',
  defaults: { phrases: DEFAULT_PHRASES, allow: [] },
  help: 'Clichés and overused phrases make copy feel generic and forgettable. ' +
    'Replace them with specific, concrete language that reflects your actual product or idea.',

  check({ text, sourceMap, options }: RuleInput<NoClichesOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES
    const allowed = new Set((options.allow ?? []).map(phrase => phrase.toLowerCase()))

    for (const { phrase, alternatives } of phrases) {
      if (allowed.has(phrase.toLowerCase())) continue

      const re = buildPattern(phrase)
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedPhrase = match[0]
        const start = sourceMap[match.index]!
        const end = sourceMap[match.index + matchedPhrase.length - 1]! + 1
        const suggestion = alternatives.join(', ')

        diagnostics.push({
          ruleId: 'no-cliches',
          severity: 'warn',
          message: `replace "${matchedPhrase}" with a fresher alternative such as "${suggestion}"`,
          range: { start, end },
          help: noCliches.help,
        })
      }
    }

    return diagnostics
  },
}
