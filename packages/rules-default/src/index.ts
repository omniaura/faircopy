import type { Rule } from '@faircopy/core'
import { noEmDash } from './no-em-dash.js'
import { noWeaselWords } from './no-weasel-words.js'
import { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'

export { noEmDash } from './no-em-dash.js'
export { noWeaselWords } from './no-weasel-words.js'
export { noRhetoricalScaffolding } from './no-rhetorical-scaffolding.js'
export type { NoEmDashOptions } from './no-em-dash.js'
export type { NoWeaselWordsOptions } from './no-weasel-words.js'
export type { NoRhetoricalScaffoldingOptions } from './no-rhetorical-scaffolding.js'

/** All built-in rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-em-dash', noEmDash as Rule],
  ['no-weasel-words', noWeaselWords as Rule],
  ['no-rhetorical-scaffolding', noRhetoricalScaffolding as Rule],
])
