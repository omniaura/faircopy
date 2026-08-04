import type { Rule } from '@faircopy/core'
import { noEmDash } from './no-em-dash.js'
import { noWeaselWords } from './no-weasel-words.js'
import { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'
import { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
import { noRedundantPhrases } from './no-redundant-phrases.js'

export { noEmDash } from './no-em-dash.js'
export { noWeaselWords } from './no-weasel-words.js'
export { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'
export { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
export { noRedundantPhrases } from './no-redundant-phrases.js'
export type { NoEmDashOptions } from './no-em-dash.js'
export type { NoWeaselWordsOptions } from './no-weasel-words.js'
export type { NoRhetoricalScaffoldingOptions } from './no-rhetorical-scaffolding.js'
export type { NoNonInclusiveLanguageOptions, NonInclusiveTerm } from './no-non-inclusive-language.js'
export type { NoRedundantPhrasesOptions, RedundantPhrase } from './no-redundant-phrases.js'

/** All built-in rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-em-dash', noEmDash as Rule],
  ['no-weasel-words', noWeaselWords as Rule],
  ['no-rhetorical-scaffolding', noRhetoricalScaffolding as Rule],
  ['no-non-inclusive-language', noNonInclusiveLanguage as Rule],
  ['no-redundant-phrases', noRedundantPhrases as Rule],
])
