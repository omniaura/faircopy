import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc } from './utils.js'

export interface WeakVerb {
  verb: string
  alternatives: string[]
}

export interface NoWeakVerbsOptions {
  /** Weak verbs to flag, each with suggested stronger alternatives. */
  verbs?: WeakVerb[]
  /** Verbs or phrases to allow and skip. */
  allowList?: string[]
}

const DEFAULT_VERBS: WeakVerb[] = [
  { verb: 'make', alternatives: ['create', 'build', 'produce'] },
  { verb: 'perform', alternatives: ['execute', 'run', 'complete'] },
  { verb: 'conduct', alternatives: ['lead', 'run', 'manage'] },
  { verb: 'carry out', alternatives: ['execute', 'complete', 'implement'] },
]

interface JsonTerm {
  text?: string
  offset?: { start?: number; length?: number }
}

interface JsonVerb {
  text?: string
  terms?: JsonTerm[]
  offset?: { start?: number; length?: number }
  verb?: {
    infinitive?: string
  }
}

function getOccurrenceFromVerb(entry: JsonVerb, originalText: string): { text: string; start: number; end: number } | null {
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

export const noWeakVerbs: Rule<NoWeakVerbsOptions> = {
  id: 'no-weak-verbs',
  description: 'Flag vague action verbs and suggest stronger alternatives',
  defaults: { verbs: DEFAULT_VERBS, allowList: [] },
  help: 'Weak verbs like "make" and "do" hide the real action. Replace them with specific verbs that tell the reader exactly what happens.',

  check({ text, sourceMap, options }: RuleInput<NoWeakVerbsOptions>): Diagnostic[] {
    const verbs = options.verbs?.length ? options.verbs : DEFAULT_VERBS
    const allowed = new Set((options.allowList ?? []).map(verb => verb.toLowerCase()))
    const weakByInfinitive = new Map<string, WeakVerb>()
    for (const entry of verbs) {
      weakByInfinitive.set(entry.verb.toLowerCase(), entry)
    }

    const doc = createDoc(text)
    const diagnostics: Diagnostic[] = []

    const verbMatches = doc.verbs().json({
      offset: true,
      text: true,
      terms: { offset: true, text: true },
    }) as JsonVerb[]

    for (const entry of verbMatches) {
      const infinitive = entry.verb?.infinitive?.toLowerCase()
      if (!infinitive) continue
      if (allowed.has(infinitive)) continue

      const weakVerb = weakByInfinitive.get(infinitive)
      if (!weakVerb) continue

      const occurrence = getOccurrenceFromVerb(entry, text)
      if (!occurrence) continue

      const start = sourceMap[occurrence.start]
      const end = sourceMap[occurrence.end - 1]
      if (start === undefined || end === undefined) continue

      diagnostics.push({
        ruleId: 'no-weak-verbs',
        severity: 'warn',
        message: `replace weak verb "${occurrence.text}" with a stronger alternative such as "${weakVerb.alternatives.join('", "')}"`,
        range: { start, end: end + 1 },
        help: noWeakVerbs.help,
      })
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
