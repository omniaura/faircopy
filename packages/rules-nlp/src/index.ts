import type { Rule } from '@faircopy/core'
import { noExpletiveOpeners } from './no-expletive-openers.js'
import { noFilterWords } from './no-filter-words.js'
import { noNominalizedPhrases } from './no-nominalized-phrases.js'
import { noPassiveVoice } from './no-passive-voice.js'
import { noStackedAdjectives } from './no-stacked-adjectives.js'
import { noWeakModals } from './no-weak-modals.js'

export { noExpletiveOpeners } from './no-expletive-openers.js'
export { noFilterWords } from './no-filter-words.js'
export { noNominalizedPhrases } from './no-nominalized-phrases.js'
export { noPassiveVoice } from './no-passive-voice.js'
export { noStackedAdjectives } from './no-stacked-adjectives.js'
export { noWeakModals } from './no-weak-modals.js'
export type { NoExpletiveOpenersOptions } from './no-expletive-openers.js'
export type { NoFilterWordsOptions } from './no-filter-words.js'
export type { NoNominalizedPhrasesOptions } from './no-nominalized-phrases.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'
export type { NoStackedAdjectivesOptions } from './no-stacked-adjectives.js'
export type { NoWeakModalsOptions } from './no-weak-modals.js'

/** All NLP rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-expletive-openers', noExpletiveOpeners as Rule],
  ['no-filter-words', noFilterWords as Rule],
  ['no-nominalized-phrases', noNominalizedPhrases as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
  ['no-stacked-adjectives', noStackedAdjectives as Rule],
  ['no-weak-modals', noWeakModals as Rule],
])
