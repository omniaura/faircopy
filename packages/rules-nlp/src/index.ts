import type { Rule } from '@faircopy/core'
import { noFilterWords } from './no-filter-words.js'
import { noPassiveVoice } from './no-passive-voice.js'

export { noFilterWords } from './no-filter-words.js'
export { noPassiveVoice } from './no-passive-voice.js'
export type { NoFilterWordsOptions } from './no-filter-words.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'

/** All NLP rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-filter-words', noFilterWords as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
])
