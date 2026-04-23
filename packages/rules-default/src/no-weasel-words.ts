import type { Rule, RuleInput, Diagnostic } from '@faircopy/core'

export interface NoWeaselWordsOptions {
  words: string[]
}

const DEFAULT_WORDS = ['actually', 'truly', 'really', 'literally']

export const noWeaselWords: Rule<NoWeaselWordsOptions> = {
  id: 'no-weasel-words',
  description: 'Ban reinforcement adverbs that protest too much',
  defaults: { words: DEFAULT_WORDS },
  help: 'Reinforcement adverbs defend a claim instead of making it. ' +
    'Delete the word. If the sentence no longer reads right, ' +
    'the original claim was the problem — rewrite it, don\'t prop it up.',

  check({ text, sourceMap, options }: RuleInput<NoWeaselWordsOptions>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const words = options.words?.length ? options.words : DEFAULT_WORDS

    for (const word of words) {
      const re = new RegExp(`\\b${word}\\b`, 'gi')
      let m: RegExpExecArray | null
      while ((m = re.exec(text)) !== null) {
        const start = sourceMap[m.index]!
        const end = sourceMap[m.index + m[0].length - 1]! + 1
        diagnostics.push({
          ruleId: 'no-weasel-words',
          severity: 'error',
          message: `remove "${m[0].toLowerCase()}" — it weakens the claim`,
          range: { start, end },
          help: noWeaselWords.help,
        })
      }
    }

    return diagnostics
  },
}
