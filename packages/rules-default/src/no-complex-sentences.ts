import type { Diagnostic, Rule, RuleInput, Suggestion } from '@faircopy/core'

export interface NoComplexSentencesOptions {
  /** Target Flesch-Kincaid grade level. Sentences scoring above this are flagged. */
  maxGradeLevel?: number
  /** Minimum words a sentence must contain before it is scored. Shorter sentences are too noisy. */
  minWords?: number
}

const DEFAULT_OPTIONS: Required<NoComplexSentencesOptions> = {
  maxGradeLevel: 12,
  minWords: 10,
}

export const noComplexSentences: Rule<NoComplexSentencesOptions> = {
  id: 'no-complex-sentences',
  description: 'Flag individual sentences whose Flesch-Kincaid grade level exceeds a target',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Long, syllable-dense sentences are hard to read. Break them into shorter sentences that each make one point.',

  check({ text, sourceMap, options }: RuleInput<NoComplexSentencesOptions>): Diagnostic[] {
    const maxGradeLevel = options.maxGradeLevel ?? DEFAULT_OPTIONS.maxGradeLevel
    const minWords = options.minWords ?? DEFAULT_OPTIONS.minWords

    const diagnostics: Diagnostic[] = []

    for (const { sentence, start, end } of getSentences(text)) {
      const words = getWords(sentence)
      if (words.length < minWords || words.length === 0) continue

      const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
      const grade = fleschKincaidGrade(words.length, 1, syllables)

      if (grade <= maxGradeLevel) continue

      const sourceStart = sourceMap[start]
      const sourceEnd = sourceMap[end - 1]
      if (sourceStart === undefined || sourceEnd === undefined) continue

      const roundedGrade = Math.round(grade * 10) / 10
      const suggest: Suggestion = {
        description: 'Split this sentence into shorter sentences, one idea each.',
        edits: [],
      }

      diagnostics.push({
        ruleId: 'no-complex-sentences',
        severity: 'warn',
        message: `sentence readability is grade ${roundedGrade.toFixed(1)} — simplify to ${maxGradeLevel} or below`,
        range: { start: sourceStart, end: sourceEnd + 1 },
        help: noComplexSentences.help,
        suggest,
      })
    }

    return diagnostics
  },
}

function getSentences(text: string): Array<{ sentence: string; start: number; end: number }> {
  const sentences: Array<{ sentence: string; start: number; end: number }> = []
  const abbreviationPattern = /\b(?:dr|mr|mrs|ms|prof|sr|jr|eg|ie|etc|vs|vol|fig|no)\.|\b(?:a|p)\.m\./gi
  const placeholder = '\u0000'
  const masked = text.replace(abbreviationPattern, (match, offset) => {
    // a.m./p.m. may use their trailing period as a sentence terminator. Keep it
    // when followed by whitespace and an uppercase letter or end of string.
    if (/\b(?:a|p)\.m\.$/i.test(match)) {
      const after = text.slice(offset + match.length)
      if (/^\s+(?:[A-Z]|$)/.test(after)) {
        return match[0] + placeholder + match.slice(2)
      }
    }
    return match.replaceAll('.', placeholder)
  })

  const terminator = /[.!?]+/g
  let lastEnd = 0
  let match: RegExpExecArray | null

  while ((match = terminator.exec(masked)) !== null) {
    const end = match.index + match[0].length
    const sentence = masked.slice(lastEnd, end).replaceAll(placeholder, '.')
    const trimmed = sentence.trimStart()
    const leadingSpace = sentence.length - trimmed.length
    sentences.push({ sentence: trimmed, start: lastEnd + leadingSpace, end })
    lastEnd = end
  }

  return sentences
}

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-z0-9]/.test(word))
}

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!cleaned) return 0
  if (cleaned.length <= 3) return 1

  const vowels = cleaned.match(/[aeiouy]+/g)
  if (!vowels) return 1

  let count = vowels.length
  if (cleaned.endsWith('e')) count--
  if (cleaned.endsWith('le') && cleaned.length > 2 && !/[aeiouy]$/.test(cleaned[cleaned.length - 3] ?? '')) {
    count++
  }
  return Math.max(1, count)
}

function fleschKincaidGrade(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
}
