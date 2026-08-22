import type { Rule } from '@faircopy/core'
import { noAbsoluteIntensifiers } from './no-absolute-intensifiers.js'
import { noAdverbOveruse } from './no-adverb-overuse.js'
import { noBuzzwordStacks } from './no-buzzword-stacks.js'
import { noComplexReadability } from './no-complex-readability.js'
import { noExpletiveOpeners } from './no-expletive-openers.js'
import { noFilterWords } from './no-filter-words.js'
import { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
import { noFuturePromises } from './no-future-promises.js'
import { noHedgeWords } from './no-hedge-words.js'
import { noJargon } from './no-jargon.js'
import { noLlmSpeak } from './no-llm-speak.js'
import { noMeaninglessModifiers } from './no-meaningless-modifiers.js'
import { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
import { noNominalizedPhrases } from './no-nominalized-phrases.js'
import { noOverlyComplexSentences } from './no-overly-complex-sentences.js'
import { noOverusedAdverbs } from './no-overused-adverbs.js'
import { noPassiveVoice } from './no-passive-voice.js'
import { noPronounLedClaims } from './no-pronoun-led-claims.js'
import { noQualifierCreep } from './no-qualifier-creep.js'
import { noRedundantPairs } from './no-redundant-pairs.js'
import { noStackedAdjectives } from './no-stacked-adjectives.js'
import { noSuperlativeClaims } from './no-superlative-claims.js'
import { noVagueComparatives } from './no-vague-comparatives.js'
import { noVagueQuantifiers } from './no-vague-quantifiers.js'
import { noWeakModals } from './no-weak-modals.js'
import { sentenceComplexity } from './sentence-complexity.js'

export { noAbsoluteIntensifiers } from './no-absolute-intensifiers.js'
export { noAdverbOveruse } from './no-adverb-overuse.js'
export { noBuzzwordStacks } from './no-buzzword-stacks.js'
export { noComplexReadability } from './no-complex-readability.js'
export { noExpletiveOpeners } from './no-expletive-openers.js'
export { noFilterWords } from './no-filter-words.js'
export { noEmptyTransformationClaims } from './no-empty-transformation-claims.js'
export { noFuturePromises } from './no-future-promises.js'
export { noHedgeWords } from './no-hedge-words.js'
export { noJargon } from './no-jargon.js'
export { noLlmSpeak } from './no-llm-speak.js'
export { noMeaninglessModifiers } from './no-meaningless-modifiers.js'
export { noNonInclusiveLanguage } from './no-non-inclusive-language.js'
export { noNominalizedPhrases } from './no-nominalized-phrases.js'
export { noOverlyComplexSentences } from './no-overly-complex-sentences.js'
export { noOverusedAdverbs } from './no-overused-adverbs.js'
export { noPassiveVoice } from './no-passive-voice.js'
export { noPronounLedClaims } from './no-pronoun-led-claims.js'
export { noQualifierCreep } from './no-qualifier-creep.js'
export { noRedundantPairs } from './no-redundant-pairs.js'
export { noStackedAdjectives } from './no-stacked-adjectives.js'
export { noSuperlativeClaims } from './no-superlative-claims.js'
export { noVagueComparatives } from './no-vague-comparatives.js'
export { noVagueQuantifiers } from './no-vague-quantifiers.js'
export { noWeakModals } from './no-weak-modals.js'
export { sentenceComplexity } from './sentence-complexity.js'
export type { NoAbsoluteIntensifiersOptions } from './no-absolute-intensifiers.js'
export type { NoAdverbOveruseOptions } from './no-adverb-overuse.js'
export type { NoBuzzwordStacksOptions } from './no-buzzword-stacks.js'
export type { NoComplexReadabilityOptions } from './no-complex-readability.js'
export type { NoExpletiveOpenersOptions } from './no-expletive-openers.js'
export type { NoFilterWordsOptions } from './no-filter-words.js'
export type { NoEmptyTransformationClaimsOptions } from './no-empty-transformation-claims.js'
export type { NoFuturePromisesOptions } from './no-future-promises.js'
export type { NoHedgeWordsOptions } from './no-hedge-words.js'
export type { NoJargonOptions } from './no-jargon.js'
export type { NoLlmSpeakOptions } from './no-llm-speak.js'
export type { NoMeaninglessModifiersOptions } from './no-meaningless-modifiers.js'
export type { NoNonInclusiveLanguageOptions } from './no-non-inclusive-language.js'
export type { NoNominalizedPhrasesOptions } from './no-nominalized-phrases.js'
export type { NoOverlyComplexSentencesOptions } from './no-overly-complex-sentences.js'
export type { NoOverusedAdverbsOptions } from './no-overused-adverbs.js'
export type { NoPassiveVoiceOptions } from './no-passive-voice.js'
export type { NoPronounLedClaimsOptions } from './no-pronoun-led-claims.js'
export type { NoQualifierCreepOptions } from './no-qualifier-creep.js'
export type { NoRedundantPairsOptions } from './no-redundant-pairs.js'
export type { NoStackedAdjectivesOptions } from './no-stacked-adjectives.js'
export type { NoSuperlativeClaimsOptions } from './no-superlative-claims.js'
export type { NoVagueComparativesOptions } from './no-vague-comparatives.js'
export type { NoVagueQuantifiersOptions } from './no-vague-quantifiers.js'
export type { NoWeakModalsOptions } from './no-weak-modals.js'
export type { SentenceComplexityOptions } from './sentence-complexity.js'

/** All NLP rules keyed by their rule ID. */
export const ruleRegistry: Map<string, Rule> = new Map([
  ['no-absolute-intensifiers', noAbsoluteIntensifiers as Rule],
  ['no-adverb-overuse', noAdverbOveruse as Rule],
  ['no-buzzword-stacks', noBuzzwordStacks as Rule],
  ['no-complex-readability', noComplexReadability as Rule],
  ['no-empty-transformation-claims', noEmptyTransformationClaims as Rule],
  ['no-expletive-openers', noExpletiveOpeners as Rule],
  ['no-filter-words', noFilterWords as Rule],
  ['no-future-promises', noFuturePromises as Rule],
  ['no-hedge-words', noHedgeWords as Rule],
  ['no-jargon', noJargon as Rule],
  ['no-llm-speak', noLlmSpeak as Rule],
  ['no-meaningless-modifiers', noMeaninglessModifiers as Rule],
  ['no-non-inclusive-language-nlp', noNonInclusiveLanguage as Rule],
  ['no-nominalized-phrases', noNominalizedPhrases as Rule],
  ['no-overly-complex-sentences', noOverlyComplexSentences as Rule],
  ['no-overused-adverbs', noOverusedAdverbs as Rule],
  ['no-passive-voice', noPassiveVoice as Rule],
  ['no-pronoun-led-claims', noPronounLedClaims as Rule],
  ['no-qualifier-creep', noQualifierCreep as Rule],
  ['no-redundant-pairs', noRedundantPairs as Rule],
  ['no-stacked-adjectives', noStackedAdjectives as Rule],
  ['no-superlative-claims', noSuperlativeClaims as Rule],
  ['no-vague-comparatives', noVagueComparatives as Rule],
  ['no-vague-quantifiers', noVagueQuantifiers as Rule],
  ['no-weak-modals', noWeakModals as Rule],
  ['sentence-complexity', sentenceComplexity as Rule],
])
