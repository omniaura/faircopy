import type { Rule } from '@faircopy/core'
import { noBuzzwordStacks } from './no-buzzword-stacks.js'
import { noExpletiveOpeners } from './no-expletive-openers.js'
import { noFilterWords } from './no-filter-words.js'
import { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
import { noHedgeWords } from './no-hedge-words.js'
import { noJargon } from './no-jargon.js'
import { noMeaninglessModifiers } from './no-meaningless-modifiers.js'
import { noNominalizedPhrases } from './no-nominalized-phrases.js'
import { noPassiveVoice } from './no-passive-voice.js'
import { noPronounLedClaims } from './no-pronoun-led-claims.js'
import { noRedundantPairs } from './no-redundant-pairs.js'
import { noStackedAdjectives } from './no-stacked-adjectives.js'
import { noVagueQuantifiers } from './no-vague-quantifiers.js'
import { noWeakModals } from './no-weak-modals.js'

export { noBuzzwordStacks } from './no-buzzword-stacks.js'
export { noExpletiveOpeners } from './no-expletive-openers.js'
export { noFilterWords } from './no-filter-words.js'
export { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
export { noHedgeWords } from './no-hedge-words.js'
export { noJargon } from './no-jargon.js'
export { noMeaninglessModifiers } from './no-meaningless-modifiers.js'
export { noNominalizedPhrases } from './no-nominalized-phrases.js'
export { noPassiveVoice } from './no-passive-voice.js'
export { noPronounLedClaims } from './no-pronoun-led-claims.js'
export { noRedundantPairs } from './no-redundant-pairs.js'
export { noStackedAdjectives } from './no-stacked-adjectives.js'
export { noVagueQuantifiers } from './no-vague-quantifiers.js'
export { noWeakModals } from './no-weak-modals.js'
export type { NoBuzzwordStacksOptions } from './no-buzzword-stacks.js'
export type { NoExpletiveOpenersOptions } from './no-expletive-openers.js'
export type { NoFilterWordsOptions } from './no-filter-words.js'
export type { NoEmptyTransformationClaimsOptions } from './no-empty-transformation-claims.js'
export type { NoHedgeWordsOptions } from './no-hedge-words.js'
export type { NoJargonOptions } from './no-jargon.js'
export type { NoMeaninglessModifiersOptions } from './no-meaningless-modifiers.js'
export type { NoNominalizedPhrasesOptions } from './no-nominalized-phrases.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'
export type { NoPronounLedClaimsOptions } from './no-pronoun-led-claims.js'
export type { NoRedundantPairsOptions } from './no-redundant-pairs.js'
export type { NoStackedAdjectivesOptions } from './no-stacked-adjectives.js'
export type { NoVagueQuantifiersOptions } from './no-vague-quantifiers.js'
export type { NoWeakModalsOptions } from './no-weak-modals.js'

/** All NLP rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-buzzword-stacks', noBuzzwordStacks as Rule],
  ['no-empty-transformation-claims', noEmptyTransformationClaims as Rule],
  ['no-expletive-openers', noExpletiveOpeners as Rule],
  ['no-filter-words', noFilterWords as Rule],
  ['no-hedge-words', noHedgeWords as Rule],
  ['no-jargon', noJargon as Rule],
  ['no-meaningless-modifiers', noMeaninglessModifiers as Rule],
  ['no-nominalized-phrases', noNominalizedPhrases as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
  ['no-pronoun-led-claims', noPronounLedClaims as Rule],
  ['no-redundant-pairs', noRedundantPairs as Rule],
  ['no-stacked-adjectives', noStackedAdjectives as Rule],
  ['no-vague-quantifiers', noVagueQuantifiers as Rule],
  ['no-weak-modals', noWeakModals as Rule],
])
