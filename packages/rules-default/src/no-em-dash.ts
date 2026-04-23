import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface NoEmDashOptions {
  /** Additionally flag en-dashes (U+2013). Default false. */
  flagEnDash?: boolean
  /** Additionally flag ASCII double-hyphen --. Default false. */
  flagDoubleHyphen?: boolean
}

export const noEmDash: Rule<NoEmDashOptions> = {
  id: 'no-em-dash',
  description: 'Ban the em-dash character in marketing copy',
  defaults: { flagEnDash: false, flagDoubleHyphen: false },
  help: 'Em-dashes are a stylistic tell. Split the sentence at the break. ' +
    'Use a period, a semicolon, parentheses, or a new sentence. ' +
    'If the clauses genuinely belong together and a comma reads worse, write shorter sentences.',

  check({ text, sourceMap, options }: RuleInput<NoEmDashOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const opts = { ...noEmDash.defaults, ...options }

    const flag = (re: RegExp, message: string) => {
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({ ruleId: 'no-em-dash', severity: 'error', message, range: { start, end }, help: noEmDash.help })
      }
    }

    flag(/—/g, 'use a sentence break instead of an em-dash')
    if (opts.flagEnDash) flag(/–/g, 'use a hyphen instead of an en-dash')
    if (opts.flagDoubleHyphen) flag(/--/g, 'use a sentence break instead of --')

    return diagnostics
  },
}
