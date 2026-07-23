import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoComplexReadabilityOptions {
  /** Target Flesch-Kincaid grade level. Text scoring above this is flagged. */
  maxGradeLevel?: number
  /** Minimum sentence count before scoring. Shorter passages are too noisy. */
  minSentences?: number
  /** Minimum word count before scoring. */
  minWords?: number
}

const DEFAULT_OPTIONS: Required<NoComplexReadabilityOptions> = {
  maxGradeLevel: 12,
  minSentences: 3,
  minWords: 30,
}

export const noComplexReadability: Rule<NoComplexReadabilityOptions> = {
  id: 'no-complex-readability',
  description: 'Flag prose whose Flesch-Kincaid grade level exceeds a target',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Landing-page copy should be readable by a broad audience. Break long sentences, replace jargon, and front-load the point until the grade level drops.',

  check({ text, sourceMap, options }: RuleInput<NoComplexReadabilityOptions>): Diagnostic[] {
    const maxGradeLevel = options.maxGradeLevel ?? DEFAULT_OPTIONS.maxGradeLevel
    const minSentences = options.minSentences ?? DEFAULT_OPTIONS.minSentences
    const minWords = options.minWords ?? DEFAULT_OPTIONS.minWords

    const sentences = getSentences(text)
    const words = getWords(text)

    if (sentences.length < minSentences || words.length < minWords) {
      return []
    }

    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
    const grade = fleschKincaidGrade(words.length, sentences.length, syllables)

    if (grade <= maxGradeLevel) {
      return []
    }

    const start = sourceMap[0]
    const end = sourceMap[sourceMap.length - 1]
    if (start === undefined || end === undefined) return []

    return [{
      ruleId: 'no-complex-readability',
      severity: 'warn',
      message: `readability is grade ${grade.toFixed(1)} — simplify to ${maxGradeLevel} or below`,
      range: { start, end: end + 1 },
      help: noComplexReadability.help,
    }]
  },
}

function getSentences(text: string): string[] {
  // Split on sentence terminators, keeping the delimiter so trailing spaces are preserved.
  const parts = text.split(/([.!?]+)/)
  const sentences: string[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i]
    const terminator = parts[i + 1] ?? ''
    const combined = (sentence ?? '') + terminator
    const trimmed = combined.trim()
    if (trimmed) sentences.push(trimmed)
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
