import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface NoFillerWordsOptions {
  words: string[]
}

const DEFAULT_WORDS = ['just']

export const noFillerWords: Rule<NoFillerWordsOptions> = {
  id: 'no-filler-words',
  description: 'Ban filler words that pad out a sentence without adding meaning',
  defaults: { words: DEFAULT_WORDS },
  help: 'Filler words like "just" dilute your claim. ' +
    'Remove the word; if the sentence then feels too blunt, ' +
    'rewrite the surrounding copy instead of softening it.',

  check({ text, sourceMap, options }: RuleInput<NoFillerWordsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const words = options.words?.length ? options.words : DEFAULT_WORDS

    for (const word of words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`\\b${escaped}\\b`, 'gi')
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({
          ruleId: 'no-filler-words',
          severity: 'error',
          message: `remove "${m[0].toLowerCase()}" — it's filler`,
          range: { start, end },
          help: noFillerWords.help,
        })
      }
    }

    return diagnostics
  },
}
