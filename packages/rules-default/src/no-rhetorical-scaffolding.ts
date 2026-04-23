import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface NoRhetoricalScaffoldingOptions {
  /** Disable "X is Y, not Z" detection. Default false. */
  allowIsNotConstruction?: boolean
  /** Disable "Without X / With X" detection. Default false. */
  allowWithoutWithConstruction?: boolean
  /** Additional banned patterns as regex strings. */
  extraPatterns?: string[]
}

// "X is Y, not a/an/the/just/only/merely/simply..."
const IS_NOT_RE = /\b(is|are|was|were)\s+[^.!?]{1,80},\s+not\s+(a|an|the|just|only|merely|simply)\b/gi

// "Without ... [sentences] ... With ..."
const WITHOUT_WITH_RE = /\bWithout\b[^.!?]{1,200}[.!?]\s*(?:[^.!?]{1,200}[.!?]\s*){0,2}With\b/gs

export const noRhetoricalScaffolding: Rule<NoRhetoricalScaffoldingOptions> = {
  id: 'no-rhetorical-scaffolding',
  description: 'Ban formulaic "X is Y, not Z" and "Without X / With X" patterns',
  defaults: { allowIsNotConstruction: false, allowWithoutWithConstruction: false, extraPatterns: [] },
  help: 'These patterns spend a clause denying a straw man or performing a reveal instead of making a claim. ' +
    'Delete the setup and keep the claim.',

  check({ text, sourceMap, options }: RuleInput<NoRhetoricalScaffoldingOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const opts = { ...noRhetoricalScaffolding.defaults, ...options }

    if (!opts.allowIsNotConstruction) {
      const re = new RegExp(IS_NOT_RE.source, IS_NOT_RE.flags)
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({
          ruleId: 'no-rhetorical-scaffolding',
          severity: 'error',
          message: 'avoid "X is Y, not Z" — state the claim directly',
          range: { start, end },
          help: noRhetoricalScaffolding.help,
        })
      }
    }

    if (!opts.allowWithoutWithConstruction) {
      const re = new RegExp(WITHOUT_WITH_RE.source, WITHOUT_WITH_RE.flags)
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({
          ruleId: 'no-rhetorical-scaffolding',
          severity: 'error',
          message: 'avoid "Without X / With X" — drop the setup and make the claim',
          range: { start, end },
          help: noRhetoricalScaffolding.help,
        })
      }
    }

    for (const pattern of opts.extraPatterns ?? []) {
      const re = new RegExp(pattern, 'gi')
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({
          ruleId: 'no-rhetorical-scaffolding',
          severity: 'error',
          message: 'banned rhetorical pattern',
          range: { start, end },
        })
      }
    }

    return diagnostics
  },
}
