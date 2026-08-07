import type { Diagnostic, Rule, RuleInput, Suggestion } from '@faircopy/core'

export interface NoAbsoluteIntensifiersOptions {
  intensifiers?: string[]
  absolutes?: string[]
}

const DEFAULT_INTENSIFIERS = [
  'very',
  'really',
  'completely',
  'totally',
  'absolutely',
  'utterly',
  'quite',
  'extremely',
  'perfectly',
  'entirely',
]

const DEFAULT_ABSOLUTES = [
  'unique',
  'finished',
  'destroyed',
  'essential',
  'perfect',
  'impossible',
  'dead',
  'empty',
  'full',
  'silent',
  'unanimous',
  'infinite',
  'eternal',
  'flawless',
  'ultimate',
  'final',
  'complete',
  'total',
  'absolute',
]

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function longestFirst(values: string[]): string[] {
  return [...values].sort((left, right) => right.length - left.length)
}

function buildPattern(intensifiers: string[], absolutes: string[]): RegExp {
  const intensifierPattern = longestFirst(intensifiers)
    .map(phrase => escapeRegExp(phrase).replace(/\\s+/g, '\\s+'))
    .join('|')
  const absolutePattern = longestFirst(absolutes)
    .map(phrase => escapeRegExp(phrase).replace(/\\s+/g, '\\s+'))
    .join('|')

  return new RegExp(
    `\\b(${intensifierPattern})\\s+\\b(${absolutePattern})(?![\\w'-])`,
    'gi',
  )
}

export const noAbsoluteIntensifiers: Rule<NoAbsoluteIntensifiersOptions> = {
  id: 'no-absolute-intensifiers',
  description: 'Flag intensifiers before absolute adjectives',
  defaults: {
    intensifiers: DEFAULT_INTENSIFIERS,
    absolutes: DEFAULT_ABSOLUTES,
  },
  help: 'Absolute adjectives already express an extreme. Intensifiers like "very" ' +
    'before them are redundant and weaken the claim. Remove the intensifier ' +
    'or replace the phrase with concrete evidence.',

  check({ text, sourceMap, options }: RuleInput<NoAbsoluteIntensifiersOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const intensifiers = options.intensifiers?.length ? options.intensifiers : DEFAULT_INTENSIFIERS
    const absolutes = options.absolutes?.length ? options.absolutes : DEFAULT_ABSOLUTES

    if (!intensifiers.length || !absolutes.length) return diagnostics

    const re = buildPattern(intensifiers, absolutes)
    let match: RegExpExecArray | null

    while ((match = re.exec(text)) !== null) {
      const matchedText = match[0]
      const intensifier = match[1]!
      const absolute = match[2]!
      const matchStart = match.index
      const matchEnd = matchStart + matchedText.length

      const start = sourceMap[matchStart]
      const end = sourceMap[matchEnd - 1]
      if (start === undefined || end === undefined) continue

      const suggest: Suggestion = {
        description: `remove "${intensifier}" before "${absolute}"`,
        edits: [{ range: { start, end: end + 1 }, replacement: absolute }],
      }

      diagnostics.push({
        ruleId: 'no-absolute-intensifiers',
        severity: 'warn',
        message: `"${matchedText}" is redundant — "${absolute}" is already absolute`,
        range: { start, end: end + 1 },
        help: noAbsoluteIntensifiers.help,
        suggest,
      })
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
