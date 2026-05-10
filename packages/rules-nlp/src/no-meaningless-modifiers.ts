import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoMeaninglessModifiersOptions {
  modifiers?: string[]
}

const DEFAULT_MODIFIERS = [
  'very',
  'really',
  'actually',
  'basically',
  'literally',
  'essentially',
  'truly',
  'definitely',
  'clearly',
  'obviously',
]

export const noMeaninglessModifiers: Rule<NoMeaninglessModifiersOptions> = {
  id: 'no-meaningless-modifiers',
  description: 'Flag intensifiers that add no information',
  defaults: { modifiers: DEFAULT_MODIFIERS },
  help: 'Meaningless modifiers inflate a claim without adding evidence. Delete the modifier, replace it with a concrete detail, or opt out specific words such as "clearly" and "obviously" when they are part of your voice.',

  check({ text, sourceMap, options }: RuleInput<NoMeaninglessModifiersOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const modifiers = options.modifiers?.length ? options.modifiers : DEFAULT_MODIFIERS

    for (const modifier of modifiers) {
      const re = new RegExp(`\\b${escapeRegExp(modifier).replace(/\\s+/g, '\\s+')}\\b`, 'gi')
      let match: RegExpExecArray | null

      while ((match = re.exec(text)) !== null) {
        const matchedModifier = match[0]
        const start = sourceMap[match.index]
        const end = sourceMap[match.index + matchedModifier.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-meaningless-modifiers',
          severity: 'warn',
          message: `remove meaningless modifier "${matchedModifier}"`,
          range: { start, end: end + 1 },
          help: noMeaninglessModifiers.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
