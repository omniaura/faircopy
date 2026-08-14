import type { Diagnostic, Rule, RuleInput } from '@faircopy/core'

export interface NoRepetitiveSentenceStartingsOptions {
  /** Number of consecutive sentences that must share the same starting word before flagging. */
  threshold?: number
  /** Minimum sentence length (in words) to count. Very short sentences are ignored. */
  minWords?: number
  /** Words or phrases that are allowed to start multiple sentences. */
  allow?: string[]
}

const DEFAULT_OPTIONS: Required<NoRepetitiveSentenceStartingsOptions> = {
  threshold: 3,
  minWords: 3,
  allow: ['the', 'a', 'an', 'it', 'this', 'that'],
}

function getSentences(text: string): Array<{ sentence: string; start: number; end: number }> {
  const sentences: Array<{ sentence: string; start: number; end: number }> = []
  const abbreviationPattern = /\b(?:dr|mr|mrs|ms|prof|sr|jr|eg|ie|etc|vs|vol|fig|no)\.|\b(?:a|p)\.m\./gi
  const placeholder = '\u0000'
  const masked = text.replace(abbreviationPattern, (match, offset) => {
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

  const trailing = masked.slice(lastEnd).trim()
  if (trailing) {
    sentences.push({ sentence: trailing, start: lastEnd, end: text.length })
  }

  return sentences
}

function getFirstWord(sentence: string): string | null {
  const match = sentence.trim().match(/^[a-zA-Z0-9]+/)
  return match ? match[0].toLowerCase() : null
}

function countWords(sentence: string): number {
  return sentence
    .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && /[a-zA-Z0-9]/.test(word))
    .length
}

export const noRepetitiveSentenceStartings: Rule<NoRepetitiveSentenceStartingsOptions> = {
  id: 'no-repetitive-sentence-startings',
  description: 'Flag consecutive sentences that start with the same word',
  defaults: { ...DEFAULT_OPTIONS },
  help: 'Starting several consecutive sentences with the same word creates a repetitive rhythm. ' +
    'Vary the sentence openings or combine related sentences to keep the reader engaged.',

  check({ text, sourceMap, options }: RuleInput<NoRepetitiveSentenceStartingsOptions>): Diagnostic[] {
    const threshold = options.threshold ?? DEFAULT_OPTIONS.threshold
    const minWords = options.minWords ?? DEFAULT_OPTIONS.minWords
    const allowed = new Set((options.allow ?? DEFAULT_OPTIONS.allow).map(word => word.toLowerCase()))

    const diagnostics: Diagnostic[] = []
    const sentences = getSentences(text)

    let runStart = 0
    let runWord: string | null = null
    let runLength = 0

    for (let index = 0; index < sentences.length; index++) {
      const { sentence, start, end } = sentences[index]!
      const firstWord = getFirstWord(sentence)
      const words = countWords(sentence)

      if (!firstWord || words < minWords || allowed.has(firstWord)) {
        if (runLength >= threshold && runWord) {
          const first = sentences[runStart]!
          const last = sentences[index - 1]!
          const sourceStart = sourceMap[first.start]
          const sourceEnd = sourceMap[last.end - 1]
          if (sourceStart !== undefined && sourceEnd !== undefined) {
            diagnostics.push({
              ruleId: 'no-repetitive-sentence-startings',
              severity: 'warn',
              message: `${runLength} consecutive sentences start with "${runWord}" — vary the openings`,
              range: { start: sourceStart, end: sourceEnd + 1 },
              help: noRepetitiveSentenceStartings.help,
            })
          }
        }
        runWord = null
        runLength = 0
        runStart = index + 1
        continue
      }

      if (firstWord === runWord) {
        runLength++
      } else {
        if (runLength >= threshold && runWord) {
          const first = sentences[runStart]!
          const last = sentences[index - 1]!
          const sourceStart = sourceMap[first.start]
          const sourceEnd = sourceMap[last.end - 1]
          if (sourceStart !== undefined && sourceEnd !== undefined) {
            diagnostics.push({
              ruleId: 'no-repetitive-sentence-startings',
              severity: 'warn',
              message: `${runLength} consecutive sentences start with "${runWord}" — vary the openings`,
              range: { start: sourceStart, end: sourceEnd + 1 },
              help: noRepetitiveSentenceStartings.help,
            })
          }
        }
        runWord = firstWord
        runStart = index
        runLength = 1
      }
    }

    if (runLength >= threshold && runWord) {
      const first = sentences[runStart]!
      const last = sentences[sentences.length - 1]!
      const sourceStart = sourceMap[first.start]
      const sourceEnd = sourceMap[last.end - 1]
      if (sourceStart !== undefined && sourceEnd !== undefined) {
        diagnostics.push({
          ruleId: 'no-repetitive-sentence-startings',
          severity: 'warn',
          message: `${runLength} consecutive sentences start with "${runWord}" — vary the openings`,
          range: { start: sourceStart, end: sourceEnd + 1 },
          help: noRepetitiveSentenceStartings.help,
        })
      }
    }

    return diagnostics
  },
}
