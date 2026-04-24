import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc, getMatchOccurrences } from './utils.js'

export interface NoPassiveVoiceOptions {
  allowedAuxiliaries?: string[]
}

const DEFAULT_ALLOWED_AUXILIARIES = ['is', 'are', 'was', 'were', 'be', 'been', 'being']

export const noPassiveVoice: Rule<NoPassiveVoiceOptions> = {
  id: 'no-passive-voice',
  description: 'Flag likely passive-voice constructions using POS tagging patterns',
  defaults: { allowedAuxiliaries: DEFAULT_ALLOWED_AUXILIARIES },
  help: 'Passive voice often hides the actor and adds drag. Prefer naming who did the action unless the actor genuinely does not matter.',

  check({ text, sourceMap, options }: RuleInput<NoPassiveVoiceOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const auxiliaries = new Set((options.allowedAuxiliaries?.length ? options.allowedAuxiliaries : DEFAULT_ALLOWED_AUXILIARIES).map(value => value.toLowerCase()))
    const doc = createDoc(text)
    const matches = doc.match('(#Copula|#Auxiliary) #PastTense')

    for (const occurrence of getMatchOccurrences(text, matches)) {
      const words = occurrence.text.trim().split(/\s+/)
      if (words.length < 2) continue
      if (!auxiliaries.has(words[0]!.toLowerCase())) continue

      const start = sourceMap[occurrence.start]
      const end = sourceMap[occurrence.end - 1]
      if (start === undefined || end === undefined) continue

      diagnostics.push({
        ruleId: 'no-passive-voice',
        severity: 'warn',
        message: `rewrite passive construction "${occurrence.text}" with a named actor`,
        range: { start, end: end + 1 },
        help: noPassiveVoice.help,
      })
    }

    return dedupeDiagnostics(diagnostics)
  },
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>()
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.range.start}:${diagnostic.range.end}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
