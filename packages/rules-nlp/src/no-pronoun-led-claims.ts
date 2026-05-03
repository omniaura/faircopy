import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoPronounLedClaimsOptions {
  pronouns?: string[]
  verbs?: string[]
}

const DEFAULT_PRONOUNS = ['it', 'this', 'that', 'these', 'those']
const DEFAULT_VERBS = [
  'brings',
  'delivers',
  'enables',
  'gives',
  'helps',
  'keeps',
  'lets',
  'makes',
  'turns',
  'unlocks',
]

export const noPronounLedClaims: Rule<NoPronounLedClaimsOptions> = {
  id: 'no-pronoun-led-claims',
  description: 'Flag vague claims that start with it, this, that, these, or those',
  defaults: { pronouns: DEFAULT_PRONOUNS, verbs: DEFAULT_VERBS },
  help: 'Pronoun-led claims make the reader infer the subject. Name the feature, product, or user action that creates the outcome.',

  check({ text, sourceMap, options }: RuleInput<NoPronounLedClaimsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const pronouns = options.pronouns?.length ? options.pronouns : DEFAULT_PRONOUNS
    const verbs = options.verbs?.length ? options.verbs : DEFAULT_VERBS
    if (!pronouns.length || !verbs.length) return diagnostics

    const re = new RegExp(
      `(?:^|[.!?]\\s+)(${pronouns.map(escapeRegex).join('|')})\\s+(${verbs.map(escapeRegex).join('|')})\\b`,
      'gi'
    )
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      const phrase = `${match[1]} ${match[2]}`
      const phraseStart = match.index + match[0].indexOf(phrase)
      const start = sourceMap[phraseStart]
      const end = sourceMap[phraseStart + phrase.length - 1]
      if (start === undefined || end === undefined) continue

      diagnostics.push({
        ruleId: 'no-pronoun-led-claims',
        severity: 'warn',
        message: `name the subject instead of "${phrase.toLowerCase()}"`,
        range: { start, end: end + 1 },
        help: noPronounLedClaims.help,
      })
    }

    return diagnostics
  },
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
