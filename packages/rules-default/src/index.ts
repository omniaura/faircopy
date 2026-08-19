import type { Rule } from '@faircopy/core'
import { noComplexSentences } from './no-complex-sentences.js'
import { noEmDash } from './no-em-dash.js'
import { noWeaselWords } from './no-weasel-words.js'
import { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'
import { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
import { noRedundantPhrases } from './no-redundant-phrases.js'
import { noPassiveVoice } from './no-passive-voice.js'
import { noCliches } from './no-cliches.js'
import { noRepetitiveSentenceStartings } from './no-repetitive-sentence-startings.js'
import { noFillerWords } from './no-filler-words.js'

export { noComplexSentences } from './no-complex-sentences.js'
export { noEmDash } from './no-em-dash.js'
export { noWeaselWords } from './no-weasel-words.js'
export { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'
export { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
export { noRedundantPhrases } from './no-redundant-phrases.js'
export { noPassiveVoice } from './no-passive-voice.js'
export { noCliches } from './no-cliches.js'
export { noRepetitiveSentenceStartings } from './no-repetitive-sentence-startings.js'
export { noFillerWords } from './no-filler-words.js'
export type { NoComplexSentencesOptions } from './no-complex-sentences.js'
export type { NoEmDashOptions } from './no-em-dash.js'
export type { NoWeaselWordsOptions } from './no-weasel-words.js'
export type { NoRhetoricalScaffoldingOptions } from './no-rhetorical-scaffolding.js'
export type { NoNonInclusiveLanguageOptions, NonInclusiveTerm } from './no-non-inclusive-language.js'
export type { NoRedundantPhrasesOptions, RedundantPhrase } from './no-redundant-phrases.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'
export type { NoClichesOptions, ClichePhrase } from './no-cliches.js'
export type { NoRepetitiveSentenceStartingsOptions } from './no-repetitive-sentence-startings.js'
export type { NoFillerWordsOptions } from './no-filler-words.js'

/** All built-in rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-complex-sentences', noComplexSentences as Rule],
  ['no-em-dash', noEmDash as Rule],
  ['no-weasel-words', noWeaselWords as Rule],
  ['no-rhetorical-scaffolding', noRhetoricalScaffolding as Rule],
  ['no-non-inclusive-language', noNonInclusiveLanguage as Rule],
  ['no-redundant-phrases', noRedundantPhrases as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
  ['no-cliches', noCliches as Rule],
  ['no-repetitive-sentence-startings', noRepetitiveSentenceStartings as Rule],
  ['no-filler-words', noFillerWords as Rule],
])
