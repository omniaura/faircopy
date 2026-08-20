import assert from 'node:assert/strict'
import test from 'node:test'
import {
  noNonInclusiveLanguage,
  noAbsoluteIntensifiers,
  noAdverbOveruse,
  noBuzzwordStacks,
  noEmptyTransformationClaims,
  noExpletiveOpeners,
  noFuturePromises,
  noHedgeWords,
  noJargon,
  noMeaninglessModifiers,
  noNominalizedPhrases,
  noOverlyComplexSentences,
  noOverusedAdverbs,
  noPronounLedClaims,
  noQualifierCreep,
  noRedundantPairs,
  noStackedAdjectives,
  noSuperlativeClaims,
  noVagueComparatives,
  noVagueQuantifiers,
  noWeakModals,
  ruleRegistry,
  sentenceComplexity,
} from '../dist/index.js'

function run(rule, text, options = {}) {
  return rule.check({
    text,
    sourceMap: Array.from({ length: text.length }, (_, index) => index),
    filePath: 'fixture.astro',
    options,
  })
}

test('no-empty-transformation-claims flags broad transformation cliches', () => {
  const text = 'Faircopy transforms the way teams work. It also reduces review time by 30%.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-empty-transformation-claims')
  assert.deepEqual(diagnostics[0].range, { start: 9, end: 38 })
  assert.match(diagnostics[0].message, /concrete outcome/)
})

test('no-empty-transformation-claims flags next-level and unlock claims', () => {
  const text = 'Unlock your productivity. Take your workflow to the next level.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 2)
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 0, end: 24 },
    { start: 26, end: 62 },
  ])
})

test('no-empty-transformation-claims avoids concrete transformation language', () => {
  const text = 'Convert support tickets into prioritized Jira issues in one click.'
  const diagnostics = run(noEmptyTransformationClaims, text)

  assert.equal(diagnostics.length, 0)
})

test('no-empty-transformation-claims respects allowed phrases', () => {
  const text = 'Faircopy transforms the way teams work.'
  const diagnostics = run(noEmptyTransformationClaims, text, {
    allowedPhrases: ['transforms the way teams work'],
  })

  assert.equal(diagnostics.length, 0)
})

test('no-weak-modals flags hedged helper claims but allows concrete capabilities', () => {
  const text = 'This can help teams grow. You can export CSV.'
  const diagnostics = run(noWeakModals, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-weak-modals')
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 13 })
})

test('no-stacked-adjectives flags adjective-heavy noun phrases', () => {
  const text = 'Powerful intuitive collaborative workflows help teams move.'
  const diagnostics = run(noStackedAdjectives, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-stacked-adjectives')
  assert.match(diagnostics[0].message, /Powerful intuitive collaborative workflows/)
})

test('no-stacked-adjectives respects allowed phrases', () => {
  const text = 'Powerful intuitive collaborative workflows help teams move.'
  const diagnostics = run(noStackedAdjectives, text, {
    allowedPhrases: ['powerful intuitive collaborative workflows'],
  })

  assert.equal(diagnostics.length, 0)
})

test('no-nominalized-phrases flags nominalized of-phrases', () => {
  const text = 'Optimization of onboarding improves activation.'
  const diagnostics = run(noNominalizedPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-nominalized-phrases')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 26 })
})

test('no-nominalized-phrases allows configured concrete nouns', () => {
  const text = 'Security of customer data comes first.'
  const diagnostics = run(noNominalizedPhrases, text)

  assert.equal(diagnostics.length, 0)
})

test('no-redundant-pairs flags default redundant phrases', () => {
  const text = 'First and foremost, remove the end result from your future plans.'
  const diagnostics = run(noRedundantPairs, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-redundant-pairs')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 0, end: 18 },
    { start: 31, end: 41 },
    { start: 52, end: 64 },
  ])
})

test('no-redundant-pairs supports custom phrase lists', () => {
  const text = 'The real truth is clear, but the end result is noisy.'
  const diagnostics = run(noRedundantPairs, text, {
    phrases: ['real truth'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /real truth/)
})

test('no-expletive-openers flags there sentence openers', () => {
  const text = 'There are faster ways to ship. There is less review churn with Faircopy.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-expletive-openers')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 9 })
  assert.deepEqual(diagnostics[1].range, { start: 31, end: 39 })
})

test('no-expletive-openers ignores referential it openers by default', () => {
  const text = 'Faircopy is small. It is fast.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 0)
})

test('no-expletive-openers ignores matching phrases mid-sentence', () => {
  const text = 'We know there are faster ways to ship.'
  const diagnostics = run(noExpletiveOpeners, text)

  assert.equal(diagnostics.length, 0)
})

test('no-hedge-words flags default hedge words', () => {
  const text = 'This is kind of fast, somewhat useful, and more or less ready.'
  const diagnostics = run(noHedgeWords, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-hedge-words')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 8, end: 15 },
    { start: 22, end: 30 },
    { start: 43, end: 55 },
  ])
})

test('no-hedge-words supports custom hedge lists', () => {
  const text = 'The workflow is pretty fast and arguably safer.'
  const diagnostics = run(noHedgeWords, text, {
    hedges: ['arguably'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /arguably/)
})

test('no-pronoun-led-claims flags vague sentence openers', () => {
  const text = 'This helps teams move faster. The assistant helps teams decide.'
  const diagnostics = run(noPronounLedClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-pronoun-led-claims')
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 10 })
})

test('no-pronoun-led-claims allows configured verbs', () => {
  const text = 'This helps teams move faster.'
  const diagnostics = run(noPronounLedClaims, text, {
    verbs: ['delivers'],
  })

  assert.equal(diagnostics.length, 0)
})

test('no-buzzword-stacks flags abstract benefit pileups', () => {
  const text = 'Our platform drives productivity, collaboration, and transformation.'
  const diagnostics = run(noBuzzwordStacks, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-buzzword-stacks')
  assert.deepEqual(diagnostics[0].range, { start: 4, end: 67 })
  assert.match(diagnostics[0].message, /platform, productivity, collaboration, transformation/)
})

test('no-buzzword-stacks respects the configured threshold', () => {
  const text = 'Our platform drives productivity, collaboration, and transformation.'
  const diagnostics = run(noBuzzwordStacks, text, {
    maxTermsPerSentence: 4,
  })

  assert.equal(diagnostics.length, 0)
})

test('no-vague-quantifiers flags default bare quantifiers', () => {
  const text = 'Many teams see several wins across a range of workflows.'
  const diagnostics = run(noVagueQuantifiers, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-vague-quantifiers')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 0, end: 4 },
    { start: 15, end: 22 },
    { start: 35, end: 45 },
  ])
})

test('no-vague-quantifiers supports custom phrases', () => {
  const text = 'Heaps of users asked for a bunch of exports.'
  const diagnostics = run(noVagueQuantifiers, text, {
    quantifiers: ['a bunch of'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /a bunch of/)
})

test('no-vague-quantifiers flags matching phrases mid-sentence', () => {
  const text = 'The report mentions lots of customers but includes no count.'
  const diagnostics = run(noVagueQuantifiers, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 20, end: 27 })
})

test('no-meaningless-modifiers flags default intensifiers', () => {
  const text = 'This is very fast and obviously better. It is really useful.'
  const diagnostics = run(noMeaninglessModifiers, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-meaningless-modifiers')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 8, end: 12 },
    { start: 22, end: 31 },
    { start: 46, end: 52 },
  ])
})

test('no-meaningless-modifiers supports custom modifier lists', () => {
  const text = 'This is super fast and very stable.'
  const diagnostics = run(noMeaninglessModifiers, text, {
    modifiers: ['super'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /super/)
})

test('no-meaningless-modifiers matches modifiers mid-sentence', () => {
  const text = 'The workflow is clearly faster after caching.'
  const diagnostics = run(noMeaninglessModifiers, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 16, end: 23 })
})

test('no-superlative-claims flags default superlatives', () => {
  const text = 'The best world-class platform uses state-of-the-art review.'
  const diagnostics = run(noSuperlativeClaims, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-superlative-claims')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 4, end: 8 },
    { start: 9, end: 20 },
    { start: 35, end: 51 },
  ])
})

test('no-superlative-claims supports custom phrase lists', () => {
  const text = 'The gold standard workflow is the best option.'
  const diagnostics = run(noSuperlativeClaims, text, {
    phrases: ['gold standard'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /gold standard/)
})

test('no-superlative-claims matches phrases mid-sentence', () => {
  const text = 'The workflow is cutting-edge after caching.'
  const diagnostics = run(noSuperlativeClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 16, end: 28 })
})

test('no-superlative-claims prefers longer overlapping phrases', () => {
  const text = 'The workflow is industry-leading after caching.'
  const diagnostics = run(noSuperlativeClaims, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].message, 'prove or remove superlative claim "industry-leading"')
  assert.deepEqual(diagnostics[0].range, { start: 16, end: 32 })
})

test('no-superlative-claims does not match substrings inside longer words', () => {
  const text = 'The topology page mentions bestowed access and premiere support.'
  const diagnostics = run(noSuperlativeClaims, text)

  assert.equal(diagnostics.length, 0)
})

test('no-future-promises flags default future-tense promises', () => {
  const text = 'Faircopy will help you write faster and will enable cleaner launches.'
  const diagnostics = run(noFuturePromises, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-future-promises')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 9, end: 22 },
    { start: 40, end: 51 },
  ])
})

test('no-future-promises supports custom phrase lists', () => {
  const text = 'The assistant will streamline approvals and will help you ship.'
  const diagnostics = run(noFuturePromises, text, {
    phrases: ['will streamline'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /will streamline/)
})

test('no-future-promises matches phrases mid-sentence', () => {
  const text = 'The onboarding checklist will allow you to launch without rewriting copy.'
  const diagnostics = run(noFuturePromises, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 25, end: 42 })
})

test('no-jargon flags default business jargon phrases', () => {
  const text = 'We leverage synergy, circle back, and move the needle.'
  const diagnostics = run(noJargon, text)

  assert.equal(diagnostics.length, 4)
  assert.equal(diagnostics[0].ruleId, 'no-jargon')
  assert.deepEqual(diagnostics.map(diagnostic => diagnostic.range), [
    { start: 3, end: 11 },
    { start: 12, end: 19 },
    { start: 21, end: 32 },
    { start: 38, end: 53 },
  ])
})

test('no-jargon supports custom phrase lists', () => {
  const text = 'We leverage data and boil the ocean later.'
  const diagnostics = run(noJargon, text, {
    phrases: ['boil the ocean'],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /boil the ocean/)
})

test('no-jargon matches phrases mid-sentence', () => {
  const text = 'The migration plan includes a deep dive after schema review.'
  const diagnostics = run(noJargon, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 30, end: 39 })
})

test('rule registry exposes all nlp rules', () => {
  assert.ok(ruleRegistry.has('no-buzzword-stacks'))
  assert.ok(ruleRegistry.has('no-empty-transformation-claims'))
  assert.ok(ruleRegistry.has('no-expletive-openers'))
  assert.ok(ruleRegistry.has('no-filter-words'))
  assert.ok(ruleRegistry.has('no-future-promises'))
  assert.ok(ruleRegistry.has('no-hedge-words'))
  assert.ok(ruleRegistry.has('no-jargon'))
  assert.ok(ruleRegistry.has('no-meaningless-modifiers'))
  assert.ok(ruleRegistry.has('no-passive-voice'))
  assert.ok(ruleRegistry.has('no-pronoun-led-claims'))
  assert.ok(ruleRegistry.has('no-redundant-pairs'))
  assert.ok(ruleRegistry.has('no-weak-modals'))
  assert.ok(ruleRegistry.has('no-stacked-adjectives'))
  assert.ok(ruleRegistry.has('no-superlative-claims'))
  assert.ok(ruleRegistry.has('no-nominalized-phrases'))
  assert.ok(ruleRegistry.has('no-vague-quantifiers'))
})

import {
  noComplexReadability } from '../dist/index.js'

test('no-complex-readability flags dense academic prose', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables, which consequently produces a substantial augmentation in cognitive load for the average reader. Furthermore, the proliferation of obfuscatory terminology within technical documentation frequently undermines the accessibility of otherwise straightforward conceptual frameworks. Consequently, practitioners must prioritize clarity and concision when communicating complex ideas to heterogeneous audiences.'
  const diagnostics = run(noComplexReadability, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-complex-readability')
  assert.match(diagnostics[0].message, /grade/)
})

test('no-complex-readability allows simple landing-page copy', () => {
  const text = 'Faircopy checks your copy. It finds weak words and passive voice. Your landing page reads better with every edit.'
  const diagnostics = run(noComplexReadability, text)

  assert.equal(diagnostics.length, 0)
})

test('no-complex-readability ignores short passages', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates rigorous examination.'
  const diagnostics = run(noComplexReadability, text)

  assert.equal(diagnostics.length, 0)
})

test('no-complex-readability respects custom max grade level', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables, which consequently produces a substantial augmentation in cognitive load for the average reader. Furthermore, the proliferation of obfuscatory terminology within technical documentation frequently undermines the accessibility of otherwise straightforward conceptual frameworks. Consequently, practitioners must prioritize clarity and concision when communicating complex ideas to heterogeneous audiences.'
  const diagnostics = run(noComplexReadability, text, { maxGradeLevel: -2 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /simplify to -2/)
})

test('no-complex-readability respects custom minimum thresholds', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates rigorous examination of interdependent variables, which consequently produces substantial augmentation in cognitive load for the average reader.'
  const diagnostics = run(noComplexReadability, text, { minSentences: 5, minWords: 100 })

  assert.equal(diagnostics.length, 0)
})

test('no-complex-readability handles empty text', () => {
  const diagnostics = run(noComplexReadability, '')
  assert.equal(diagnostics.length, 0)
})

test('no-complex-readability handles text without sentence terminators', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates rigorous examination of interdependent variables'
  const diagnostics = run(noComplexReadability, text)

  assert.equal(diagnostics.length, 0)
})

test('no-adverb-overuse flags the third -ly adverb in a sentence', () => {
  const text = 'Quickly, quietly, and carefully, she walked into the dark room.'
  const diagnostics = run(noAdverbOveruse, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-adverb-overuse')
  assert.equal(diagnostics[0].severity, 'warn')
  assert.equal(diagnostics[0].message, 'reduce adverb overuse: "carefully" exceeds the limit of 2 -ly adverbs per sentence')
  assert.deepEqual(diagnostics[0].range, { start: 22, end: 31 })
})

test('no-adverb-overuse flags multiple adverbs beyond the threshold', () => {
  const text = 'She ran quickly, easily, slowly, and loudly.'
  const diagnostics = run(noAdverbOveruse, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /slowly/)
  assert.match(diagnostics[1].message, /loudly/)
})

test('no-adverb-overuse ignores allowed adverbs and non-adverbs ending in -ly', () => {
  const text = 'Only family members can apply this policy easily.'
  const diagnostics = run(noAdverbOveruse, text)

  assert.equal(diagnostics.length, 0)
})

test('no-adverb-overuse respects custom maxAdverbs', () => {
  const text = 'She ran quickly and quietly.'
  const diagnostics = run(noAdverbOveruse, text, { maxAdverbs: 1 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /quietly/)
})

test('no-adverb-overuse respects custom allowedAdverbs', () => {
  const text = 'Truly, honestly, and deeply, he cared.'
  const diagnostics = run(noAdverbOveruse, text, { allowedAdverbs: ['truly'], maxAdverbs: 1 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /deeply/)
})

test('no-adverb-overuse reports nothing when adverb count is within threshold', () => {
  const text = 'The team shipped quickly and quietly.'
  const diagnostics = run(noAdverbOveruse, text)

  assert.equal(diagnostics.length, 0)
})

test('no-adverb-overuse evaluates each sentence independently', () => {
  const text = 'She walked slowly. He ran quickly, easily, and quietly.'
  const diagnostics = run(noAdverbOveruse, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /quietly/)
})

test('no-overused-adverbs flags occurrences beyond the default threshold', () => {
  const text = 'She quickly finished. He quickly left. They quickly agreed. We quickly moved.'
  const diagnostics = run(noOverusedAdverbs, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-overused-adverbs')
  assert.equal(diagnostics[0].severity, 'warn')
  assert.match(diagnostics[0].message, /"quickly" appears 4 times/)
})

test('no-overused-adverbs reports each excessive occurrence', () => {
  const text = 'Run fast. Move fast. Think fast. Speak fast. Write fast.'
  const diagnostics = run(noOverusedAdverbs, text, { threshold: 2 })

  assert.equal(diagnostics.length, 3)
  assert.ok(diagnostics.every(diagnostic => diagnostic.message.includes('fast')))
})

test('no-overused-adverbs ignores allowed adverbs', () => {
  const text = 'Only this works. Only that works. Only these work. Only those work.'
  const diagnostics = run(noOverusedAdverbs, text)

  assert.equal(diagnostics.length, 0)
})

test('no-overused-adverbs respects custom adverb list', () => {
  const text = 'She ran quickly. He ran quickly. They ran quickly.'
  const diagnostics = run(noOverusedAdverbs, text, { adverbs: ['slowly'], threshold: 1 })

  assert.equal(diagnostics.length, 0)
})

test('no-overused-adverbs respects custom threshold', () => {
  const text = 'It happened suddenly. Suddenly, the door opened. She suddenly stopped.'
  const diagnostics = run(noOverusedAdverbs, text, { threshold: 1 })

  assert.equal(diagnostics.length, 2)
  assert.ok(diagnostics.every(diagnostic => /suddenly/i.test(diagnostic.message)))
})

test('no-overused-adverbs skips short adverbs', () => {
  const text = 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z.'
  const diagnostics = run(noOverusedAdverbs, text, { threshold: 1, minLength: 1 })

  assert.equal(diagnostics.length, 0)
})

test('no-overused-adverbs reports nothing when counts are within threshold', () => {
  const text = 'She walked slowly. He walked slowly.'
  const diagnostics = run(noOverusedAdverbs, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers flags default intensifier + absolute pairs', () => {
  const text = 'This is very unique and completely finished.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-absolute-intensifiers')
  assert.deepEqual(diagnostics[0].range, { start: 8, end: 19 })
  assert.match(diagnostics[0].message, /very unique/i)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'unique')
  assert.deepEqual(diagnostics[1].range, { start: 24, end: 43 })
  assert.match(diagnostics[1].message, /completely finished/i)
  assert.equal(diagnostics[1].suggest.edits[0].replacement, 'finished')
})

test('no-absolute-intensifiers is case-insensitive', () => {
  const text = 'It is VERY UNIQUE.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /VERY UNIQUE/)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'UNIQUE')
})

test('no-absolute-intensifiers does not match absolutes without intensifiers', () => {
  const text = 'The design is unique and the work is finished.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers does not match intensifiers before non-absolutes', () => {
  const text = 'It is very fast and completely done.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers does not match substrings inside longer words', () => {
  const text = 'The uniqueness is very clearly shown.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers does not match hyphenated or possessive compounds', () => {
  const text = 'A very unique-ish design and completely finished-looking work.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers does not match when absolute is embedded in another word', () => {
  const text = 'It is very 123unique and completely abcfinished.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 0)
})

test('no-absolute-intensifiers supports custom intensifiers and absolutes', () => {
  const text = 'The plan is highly critical and somewhat absolute.'
  const diagnostics = run(noAbsoluteIntensifiers, text, {
    intensifiers: ['highly', 'somewhat'],
    absolutes: ['critical', 'absolute'],
  })

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /highly critical/)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'critical')
  assert.match(diagnostics[1].message, /somewhat absolute/)
  assert.equal(diagnostics[1].suggest.edits[0].replacement, 'absolute')
})

test('no-absolute-intensifiers handles multiple spaces between words', () => {
  const text = 'It is very   unique.'
  const diagnostics = run(noAbsoluteIntensifiers, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'unique')
})

test('no-absolute-intensifiers falls back to defaults when options are empty', () => {
  const text = 'It is very unique.'
  const diagnostics = run(noAbsoluteIntensifiers, text, {})

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /very unique/i)
})

test('ruleRegistry contains no-absolute-intensifiers', () => {
  assert.ok(ruleRegistry.has('no-absolute-intensifiers'))
})

test('ruleRegistry contains no-adverb-overuse', () => {
  assert.ok(ruleRegistry.has('no-adverb-overuse'))
})

test('ruleRegistry contains no-overused-adverbs', () => {
  assert.ok(ruleRegistry.has('no-overused-adverbs'))
})

test('sentence-complexity flags sentences that exceed the default word limit', () => {
  const text = 'The quick brown fox jumps over the lazy dog and then runs through the meadow while the sun sets behind the hills and the birds begin to sing in the trees.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'sentence-complexity')
  assert.match(diagnostics[0].message, /words \(max 25\)/)
  assert.match(diagnostics[0].message, /consider splitting/)
  assert.equal(diagnostics[0].severity, 'warn')
  assert.ok(diagnostics[0].suggest)
  assert.match(diagnostics[0].suggest.description, /shorter sentences/)
})

test('sentence-complexity flags sentences that exceed the default clause limit', () => {
  const text = 'I woke up and I ate breakfast and I went to work and I attended a meeting and I returned home.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'sentence-complexity')
  assert.match(diagnostics[0].message, /clauses \(max 3\)/)
})

test('sentence-complexity flags sentences that exceed both limits', () => {
  const text = 'The engineer reviewed the requirements and wrote the code and ran the tests and deployed the application while the team watched and celebrated the release together.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /words \(max 25\)/)
  assert.match(diagnostics[0].message, /clauses \(max 3\)/)
})

test('sentence-complexity allows short simple sentences', () => {
  const text = 'The fox jumps. The dog sleeps.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 0)
})

test('sentence-complexity allows sentences at the word threshold', () => {
  // Exactly 25 words, no extra clauses.
  const text = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 0)
})

test('sentence-complexity flags sentences just above the word threshold', () => {
  const text = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /words \(max 25\)/)
})

test('sentence-complexity allows sentences at the clause threshold', () => {
  const text = 'I ran, I swam, and I cycled.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 0)
})

test('sentence-complexity respects custom word threshold', () => {
  const text = 'The cat sat on the mat and looked at the bird.'
  const diagnostics = run(sentenceComplexity, text, { maxWordCount: 5 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /words \(max 5\)/)
})

test('sentence-complexity respects custom clause threshold', () => {
  const text = 'I ran and I swam.'
  const diagnostics = run(sentenceComplexity, text, { maxClauseCount: 1 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /clauses \(max 1\)/)
})

test('sentence-complexity ignores punctuation-only tokens when counting words', () => {
  const text = 'Well — that is it, then.'
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 0)
})

test('sentence-complexity reports accurate byte ranges', () => {
  const prefix = 'Short sentence. '
  const longSentence = 'The quick brown fox jumps over the lazy dog and then runs through the meadow while the sun sets behind the hills and the birds begin to sing in the trees.'
  const text = prefix + longSentence
  const diagnostics = run(sentenceComplexity, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: prefix.length, end: text.length })
})

test('ruleRegistry contains sentence-complexity', () => {
  assert.ok(ruleRegistry.has('sentence-complexity'))
})

test('no-overly-complex-sentences flags sentences with too many coordinating conjunctions', () => {
  const text = 'I ran and swam and biked and hiked and climbed.'
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-overly-complex-sentences')
  assert.match(diagnostics[0].message, /coordinating \(max 3\)/)
  assert.match(diagnostics[0].message, /consider splitting/)
  assert.equal(diagnostics[0].severity, 'warn')
  assert.ok(diagnostics[0].suggest)
})

test('no-overly-complex-sentences flags sentences with too many subordinating conjunctions', () => {
  const text = 'Because it rained, we stayed inside, although we wanted to go out, while the sun was shining, since we had planned a picnic.'
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /subordinating \(max 2\)/)
})

test('no-overly-complex-sentences flags sentences exceeding the total conjunction threshold', () => {
  const text = 'I ran and swam but got tired, although I rested, because the sun was out, while it shone.'
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /conjunctions \(max 4\)/)
})

test('no-overly-complex-sentences allows short simple sentences', () => {
  const text = 'The fox jumps. The dog sleeps.'
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 0)
})

test('no-overly-complex-sentences allows sentences at the default thresholds', () => {
  const text = 'I ran and swam and biked, although I was tired.'
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 0)
})

test('no-overly-complex-sentences respects custom thresholds', () => {
  const text = 'I ran and swam and biked.'
  const diagnostics = run(noOverlyComplexSentences, text, { maxCoordinating: 1 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /coordinating \(max 1\)/)
})

test('no-overly-complex-sentences respects custom conjunction lists', () => {
  const text = 'I ran plus swam plus biked plus hiked.'
  const diagnostics = run(noOverlyComplexSentences, text, {
    coordinating: ['plus'],
    maxCoordinating: 2,
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /coordinating \(max 2\)/)
})

test('no-overly-complex-sentences ignores words in the allow list', () => {
  const text = 'I ran and swam and biked and hiked and climbed.'
  const diagnostics = run(noOverlyComplexSentences, text, { allowList: ['and'] })

  assert.equal(diagnostics.length, 0)
})

test('no-overly-complex-sentences reports accurate byte ranges', () => {
  const prefix = 'Short sentence. '
  const complexSentence = 'I ran and swam and biked and hiked and climbed.'
  const text = prefix + complexSentence
  const diagnostics = run(noOverlyComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: prefix.length, end: text.length })
})

test('no-overly-complex-sentences handles empty text', () => {
  const diagnostics = run(noOverlyComplexSentences, '')
  assert.equal(diagnostics.length, 0)
})

test('no-overly-complex-sentences supports multi-word conjunction phrases', () => {
  const text = 'Even though it rained, we went out, and as if that were not enough, it hailed.'
  const diagnostics = run(noOverlyComplexSentences, text, {
    subordinating: ['even though', 'as if', 'because'],
    maxSubordinating: 1,
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /subordinating \(max 1\)/)
})

test('no-overly-complex-sentences counts overlapping phrases once', () => {
  const text = 'As if that were not enough, we stayed.'
  const diagnostics = run(noOverlyComplexSentences, text, {
    subordinating: ['as if', 'if'],
    maxSubordinating: 0,
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /subordinating \(max 0\)/)
})

test('no-overly-complex-sentences allowList handles multi-word phrases', () => {
  const text = 'Even though it rained, we went out, and even though it hailed, we stayed.'
  const diagnostics = run(noOverlyComplexSentences, text, {
    subordinating: ['even though', 'because'],
    maxSubordinating: 1,
    allowList: ['even though'],
  })

  assert.equal(diagnostics.length, 0)
})

test('ruleRegistry contains no-overly-complex-sentences', () => {
  assert.ok(ruleRegistry.has('no-overly-complex-sentences'))
})

test('no-vague-comparatives flags comparative adjectives without a baseline', () => {
  const text = 'Our editor is faster. It is also easier to use.'
  const diagnostics = run(noVagueComparatives, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-vague-comparatives')
  assert.equal(diagnostics[1].ruleId, 'no-vague-comparatives')
  assert.match(diagnostics[0].message, /faster/)
  assert.match(diagnostics[1].message, /easier/)
})

test('no-vague-comparatives ignores comparatives with "than"', () => {
  const text = 'Our editor is faster than the old one. It is easier than a spreadsheet.'
  const diagnostics = run(noVagueComparatives, text)

  assert.equal(diagnostics.length, 0)
})

test('no-vague-comparatives flags explicit more/less patterns', () => {
  const text = 'Teams need more efficient tools. They want less confusing copy.'
  const diagnostics = run(noVagueComparatives, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /more efficient/)
  assert.match(diagnostics[1].message, /less confusing/)
})

test('no-vague-comparatives ignores non-comparative uses of default words', () => {
  const text = 'We have a great product. It is a better world.'
  const diagnostics = run(noVagueComparatives, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /better/)
})

test('no-vague-comparatives respects custom comparatives list', () => {
  const text = 'This result is superior. That one is inferior.'
  const diagnostics = run(noVagueComparatives, text, { comparatives: ['superior', 'inferior'] })

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /superior/)
  assert.match(diagnostics[1].message, /inferior/)
})

test('no-vague-comparatives allows disabling the "than" requirement', () => {
  const text = 'Our editor is faster than the old one.'
  const diagnostics = run(noVagueComparatives, text, { requireThan: false })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /faster/)
})

test('no-vague-comparatives reports accurate byte ranges', () => {
  const prefix = 'The intro. '
  const body = 'Our editor is faster. It is also easier.'
  const text = prefix + body
  const diagnostics = run(noVagueComparatives, text)

  assert.equal(diagnostics.length, 2)
  const fasterIndex = text.indexOf('faster')
  assert.deepEqual(diagnostics[0].range, { start: fasterIndex, end: fasterIndex + 'faster'.length })
  const easierIndex = text.indexOf('easier')
  assert.deepEqual(diagnostics[1].range, { start: easierIndex, end: easierIndex + 'easier'.length })
})

test('no-vague-comparatives handles empty text', () => {
  const diagnostics = run(noVagueComparatives, '')
  assert.equal(diagnostics.length, 0)
})

test('ruleRegistry contains no-vague-comparatives', () => {
  assert.ok(ruleRegistry.has('no-vague-comparatives'))
})

test('no-qualifier-creep flags stacked qualifiers before an adjective', () => {
  const text = 'The result is very really good.'
  const diagnostics = run(noQualifierCreep, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-qualifier-creep')
  assert.match(diagnostics[0].message, /very really good/)
})

test('no-qualifier-creep flags stacked qualifiers before an adverb', () => {
  const text = 'It works very really well.'
  const diagnostics = run(noQualifierCreep, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /very really well/)
})

test('no-qualifier-creep allows a single qualifier', () => {
  const text = 'The result is very good. It works really well.'
  const diagnostics = run(noQualifierCreep, text)

  assert.equal(diagnostics.length, 0)
})

test('no-qualifier-creep respects custom maxQualifiers', () => {
  const text = 'The result is very really quite good.'
  const diagnostics = run(noQualifierCreep, text, { maxQualifiers: 2 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /very really quite good/)
})

test('no-qualifier-creep respects custom qualifiers', () => {
  const text = 'The result is highly extremely good.'
  const diagnostics = run(noQualifierCreep, text, { qualifiers: ['highly', 'extremely'] })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /highly extremely good/)
})

test('no-qualifier-creep ignores non-qualifier adverbs', () => {
  const text = 'The result is quickly becoming good.'
  const diagnostics = run(noQualifierCreep, text)

  assert.equal(diagnostics.length, 0)
})

test('no-qualifier-creep handles empty text', () => {
  const diagnostics = run(noQualifierCreep, '')
  assert.equal(diagnostics.length, 0)
})

test('ruleRegistry contains no-qualifier-creep', () => {
  assert.ok(ruleRegistry.has('no-qualifier-creep'))
})

test('no-non-inclusive-language-nlp flags common non-inclusive terms', () => {
  const text = 'Hey guys, add this to the blacklist and do a sanity check.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 3)
  assert.deepEqual(
    diagnostics.map(d => ({ ruleId: d.ruleId, text: text.slice(d.range.start, d.range.end) })),
    [
      { ruleId: 'no-non-inclusive-language-nlp', text: 'guys' },
      { ruleId: 'no-non-inclusive-language-nlp', text: 'blacklist' },
      { ruleId: 'no-non-inclusive-language-nlp', text: 'sanity check' },
    ]
  )
})

test('no-non-inclusive-language-nlp suggests alternatives', () => {
  const text = 'We need more manpower.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /workforce, staffing, personnel/)
})

test('no-non-inclusive-language-nlp avoids verb-only false positives for master', () => {
  const text = 'She will master the skill.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language-nlp still flags master as a noun', () => {
  const text = 'Push to the master branch.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(text.slice(diagnostics[0].range.start, diagnostics[0].range.end), 'master')
})

test('no-non-inclusive-language-nlp avoids partial-word false positives', () => {
  const text = 'The guyses report was wrong.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language-nlp respects allowedTerms', () => {
  const text = 'Add the IP to the whitelist.'
  const diagnostics = run(noNonInclusiveLanguage, text, { allowedTerms: ['whitelist'] })

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language-nlp supports custom terms', () => {
  const text = 'This is a bespoke problem.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [{ term: 'bespoke', alternatives: ['custom', 'tailored'] }],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /custom, tailored/)
})

test('no-non-inclusive-language-nlp handles empty text', () => {
  const diagnostics = run(noNonInclusiveLanguage, '')
  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language-nlp handles text with no flagged terms', () => {
  const text = 'The team worked together to verify the allowlist.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 0)
})

test('ruleRegistry contains no-non-inclusive-language-nlp', () => {
  assert.ok(ruleRegistry.has('no-non-inclusive-language-nlp'))
})
