import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoJargonOptions {
  phrases?: string[]
}

const DEFAULT_PHRASES = [
  'leverage',
  'synergy',
  'ideate',
  'circle back',
  'deep dive',
  'drill down',
  'move the needle',
  'best of breed',
  'best in class',
]

export const noJargon: Rule<NoJargonOptions> = {
  id: 'no-jargon',
  description: 'Flag business jargon and vague workplace idioms',
  defaults: { phrases: DEFAULT_PHRASES },
  help: 'Jargon makes copy sound generic. Replace it with the specific action, technical behavior, or customer outcome, or tune the phrase list for terms that are legitimate in your context.',

  check({ text, sourceMap, options }: RuleInput<NoJargonOptions>): Diagnostic[] {
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
          ruleId: 'no-jargon',
          severity: 'warn',
          message: `replace jargon phrase "${matchedPhrase}"`,
          range: { start, end: end + 1 },
          help: noJargon.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
