import type { Rule } from '@faircopy/core'
import { noExpletiveOpeners } from './no-expletive-openers.js'
import { noFilterWords } from './no-filter-words.js'
import { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
import { noNominalizedPhrases } from './no-nominalized-phrases.js'
import { noPassiveVoice } from './no-passive-voice.js'
import { noStackedAdjectives } from './no-stacked-adjectives.js'
import { noWeakModals } from './no-weak-modals.js'

export { noExpletiveOpeners } from './no-expletive-openers.js'
export { noFilterWords } from './no-filter-words.js'
export { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
export { noNominalizedPhrases } from './no-nominalized-phrases.js'
export { noPassiveVoice } from './no-passive-voice.js'
export { noStackedAdjectives } from './no-stacked-adjectives.js'
export { noWeakModals } from './no-weak-modals.js'
export type { NoExpletiveOpenersOptions } from './no-expletive-openers.js'
export type { NoFilterWordsOptions } from './no-filter-words.js'
export type { NoEmptyTransformationClaimsOptions } from './no-empty-transformation-claims.js'
export type { NoNominalizedPhrasesOptions } from './no-nominalized-phrases.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'
export type { NoStackedAdjectivesOptions } from './no-stacked-adjectives.js'
export type { NoWeakModalsOptions } from './no-weak-modals.js'

/** All NLP rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-empty-transformation-claims', noEmptyTransformationClaims as Rule],
  ['no-expletive-openers', noExpletiveOpeners as Rule],
  ['no-filter-words', noFilterWords as Rule],
  ['no-nominalized-phrases', noNominalizedPhrases as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
  ['no-stacked-adjectives', noStackedAdjectives as Rule],
  ['no-weak-modals', noWeakModals as Rule],
])
