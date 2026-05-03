import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoEmptyTransformationClaimsOptions {
  allowedPhrases?: string[]
}

interface Pattern {
  re: RegExp
  message: string
}

const PATTERNS: Pattern[] = [
  {
    re: /\b(?:transform(?:s|ed|ing)?|chang(?:e|es|ed|ing)|reimagin(?:e|es|ed|ing)|revolutioniz(?:e|es|ed|ing))\s+the\s+way\s+(?:you|your\s+team|teams|companies|businesses|people)\s+(?:work|build|sell|operate|collaborate|communicate|create|grow|ship|scale|learn|manage)\b/gi,
    message: 'replace empty transformation claim with a concrete outcome',
  },
  {
    re: /\bunlock\s+(?:your|their|team|teams'|your\s+team's|the\s+team's|the\s+full)\s+(?:potential|productivity|growth|creativity|efficiency)\b/gi,
    message: 'replace empty unlock claim with the specific benefit',
  },
  {
    re: /\btake\s+(?:your|their|team|teams'|your\s+team's|the\s+team's)?\s*(?:productivity|workflow|workflows|growth|collaboration|business|operations|process|processes)\s+to\s+the\s+next\s+level\b/gi,
    message: 'replace next-level claim with measurable value',
  },
]

export const noEmptyTransformationClaims: Rule<NoEmptyTransformationClaimsOptions> = {
  id: 'no-empty-transformation-claims',
  description: 'Flag broad transformation claims that do not name a concrete outcome',
  defaults: { allowedPhrases: [] },
  help: 'Transformation cliches promise a feeling instead of a result. Replace them with the specific workflow, metric, or customer outcome the product changes.',

  check({ text, sourceMap, options }: RuleInput<NoEmptyTransformationClaimsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const allowedPhrases = new Set((options.allowedPhrases ?? []).map(value => normalize(value)))

    for (const pattern of PATTERNS) {
      const re = new RegExp(pattern.re.source, pattern.re.flags)
      let match: RegExpExecArray | null
      while ((match = re.exec(text)) !== null) {
        const phrase = match[0]
        if (allowedPhrases.has(normalize(phrase))) continue

        const start = sourceMap[match.index]
        const end = sourceMap[match.index + phrase.length - 1]
        if (start === undefined || end === undefined) continue

        diagnostics.push({
          ruleId: 'no-empty-transformation-claims',
          severity: 'warn',
          message: `${pattern.message}: "${phrase}"`,
          range: { start, end: end + 1 },
          help: noEmptyTransformationClaims.help,
        })
      }
    }

    return diagnostics
  },
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}
