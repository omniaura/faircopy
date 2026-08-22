import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'
import { createDoc } from './utils.js'

export interface LlmSpeakPhrase {
  phrase: string
  alternatives: string[]
}

export interface NoLlmSpeakOptions {
  phrases?: LlmSpeakPhrase[]
  allowedPhrases?: string[]
}

const DEFAULT_PHRASES: LlmSpeakPhrase[] = [
  { phrase: 'delve into', alternatives: ['explore', 'examine'] },
  { phrase: "it's important to note", alternatives: ['note', 'remember'] },
  { phrase: "it's worth noting", alternatives: ['note'] },
  { phrase: 'in the ever-evolving landscape', alternatives: ['today', 'now'] },
  { phrase: "in today's digital age", alternatives: ['today'] },
  { phrase: 'a myriad of', alternatives: ['many'] },
  { phrase: 'a wealth of', alternatives: ['rich', 'deep'] },
  { phrase: 'in the realm of', alternatives: ['in'] },
  { phrase: 'at the forefront of', alternatives: ['leading'] },
  { phrase: 'navigate the complexities of', alternatives: ['handle'] },
  { phrase: 'sheds light on', alternatives: ['explains', 'clarifies'] },
  { phrase: 'underscores', alternatives: ['shows', 'emphasizes'] },
  { phrase: 'furthermore', alternatives: ['also'] },
  { phrase: 'moreover', alternatives: ['also'] },
  { phrase: 'in conclusion', alternatives: ['so', 'finally'] },
  { phrase: 'it is interesting to note', alternatives: ['note'] },
  { phrase: 'it should be noted', alternatives: ['note'] },
  { phrase: 'it is worth noting', alternatives: ['note'] },
  { phrase: 'as mentioned earlier', alternatives: [] },
  { phrase: 'as noted above', alternatives: [] },
  { phrase: 'going forward', alternatives: ['next', 'later'] },
  { phrase: 'moving forward', alternatives: ['next'] },
  { phrase: 'tapestry', alternatives: ['pattern', 'mix'] },
  { phrase: 'multifaceted', alternatives: ['complex', 'many-sided'] },
  { phrase: 'intricate', alternatives: ['complex', 'detailed'] },
  { phrase: 'meticulous', alternatives: ['careful', 'precise'] },
  { phrase: 'pivotal', alternatives: ['key', 'critical'] },
  { phrase: 'crucial', alternatives: ['critical', 'key'] },
  { phrase: 'robust', alternatives: ['strong', 'resilient'] },
]

interface JsonTerm {
  text?: string
  normal?: string
  offset?: { start?: number; length?: number }
}

interface JsonMatch {
  text?: string
  terms?: JsonTerm[]
  offset?: { start?: number; length?: number }
}

function getOccurrenceFromMatch(
  entry: JsonMatch,
  originalText: string
): { text: string; start: number; end: number } | null {
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

export const noLlmSpeak: Rule<NoLlmSpeakOptions> = {
  id: 'no-llm-speak',
  description: 'Flag phrases commonly overused by LLMs and suggest concrete alternatives',
  defaults: { phrases: DEFAULT_PHRASES, allowedPhrases: [] },
  help: 'LLM-speak uses padded, abstract phrases that sound authoritative without saying much. Replace them with direct verbs, concrete nouns, or delete them entirely.',

  check({ text, sourceMap, options }: RuleInput<NoLlmSpeakOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const phrases = options.phrases?.length ? options.phrases : DEFAULT_PHRASES
    const allowed = new Set((options.allowedPhrases ?? []).map(phrase => phrase.toLowerCase()))
    const doc = createDoc(text)

    for (const { phrase, alternatives } of phrases) {
      if (allowed.has(phrase.toLowerCase())) continue

      const matches = doc.match(phrase)
      const json = matches.json({
        offset: true,
        text: true,
        terms: { offset: true, text: true },
      }) as JsonMatch[]

      for (const entry of json) {
        const occurrence = getOccurrenceFromMatch(entry, text)
        if (!occurrence) continue

        const start = sourceMap[occurrence.start]
        const end = sourceMap[occurrence.end - 1]
        if (start === undefined || end === undefined) continue

        const suggestion = alternatives.length
          ? `try "${alternatives.join('", "')}"`
          : 'remove this filler phrase'

        diagnostics.push({
          ruleId: 'no-llm-speak',
          severity: 'warn',
          message: `replace LLM-speak phrase "${occurrence.text}" — ${suggestion}`,
          range: { start, end: end + 1 },
          help: noLlmSpeak.help,
        })
      }
    }

    return diagnostics.sort((left, right) => left.range.start - right.range.start)
  },
}
