import assert from 'node:assert/strict'
import test from 'node:test'
import { noComplexSentences, noNonInclusiveLanguage, noRedundantPhrases, noPassiveVoice, noCliches, noRepetitiveSentenceStartings, noFillerWords, ruleRegistry } from '../dist/index.js'

function run(rule, text, options = {}) {
  return rule.check({
    text,
    sourceMap: Array.from({ length: text.length }, (_, index) => index),
    filePath: 'fixture.astro',
    options,
  })
}

test('no-non-inclusive-language flags default non-inclusive terms', () => {
  const text = 'Hey guys, add this to the whitelist and blacklist. It is a sanity check for mankind.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 5)
  assert.deepEqual(
    diagnostics.map(diagnostic => diagnostic.range),
    [
      { start: 4, end: 8 },
      { start: 26, end: 35 },
      { start: 40, end: 49 },
      { start: 59, end: 71 },
      { start: 76, end: 83 },
    ],
  )
  assert.ok(diagnostics.every(diagnostic => diagnostic.ruleId === 'no-non-inclusive-language'))
  assert.match(diagnostics[0].message, /guys/)
  assert.match(diagnostics[0].message, /everyone/)
})

test('no-non-inclusive-language suggests alternatives for ability metaphors', () => {
  const text = 'The crazy deadline and lame excuse created a blind spot.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 3)
  assert.match(diagnostics[0].message, /crazy/)
  assert.match(diagnostics[1].message, /lame/)
  assert.match(diagnostics[2].message, /blind spot/)
})

test('no-non-inclusive-language flags master and slave as standalone words', () => {
  const text = 'The master node replicates to every slave instance.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /master/)
  assert.match(diagnostics[1].message, /slave/)
})

test('no-non-inclusive-language does not match terms inside longer words', () => {
  const text = 'The masterpiece was mastered by a craftsman.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language respects allowed terms', () => {
  const text = 'Hey guys, add this to the whitelist.'
  const diagnostics = run(noNonInclusiveLanguage, text, { allowedTerms: ['guys', 'whitelist'] })

  assert.equal(diagnostics.length, 0)
})

test('no-non-inclusive-language supports custom terms', () => {
  const text = 'The rockstar engineer handled the ninja implementation.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [
      { term: 'rockstar', alternatives: ['skilled', 'expert'] },
      { term: 'ninja', alternatives: ['expert', 'specialist'] },
    ],
  })

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /rockstar/)
  assert.match(diagnostics[1].message, /ninja/)
})

test('no-non-inclusive-language supports exact phrase matching', () => {
  const text = 'Do a sanity check, not a sanity checker.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [{ term: 'sanity check', alternatives: ['verification'], exact: true }],
  })

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 17 })
})

test('no-non-inclusive-language uses exact matching for default multi-word phrases', () => {
  const text = 'Do a sanity check, not a sanity checker.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 17 })
})

test('no-non-inclusive-language supports substring matching for custom phrases with exact: false', () => {
  const text = 'Do a sanity check, not a sanity checker.'
  const diagnostics = run(noNonInclusiveLanguage, text, {
    terms: [{ term: 'sanity check', alternatives: ['verification'], exact: false }],
  })

  assert.equal(diagnostics.length, 2)
  assert.deepEqual(diagnostics[0].range, { start: 5, end: 17 })
  assert.deepEqual(diagnostics[1].range, { start: 25, end: 37 })
})

test('no-non-inclusive-language is case-insensitive', () => {
  const text = 'Add it to the WHITELIST, guys.'
  const diagnostics = run(noNonInclusiveLanguage, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /guys/i)
  assert.match(diagnostics[1].message, /whitelist/i)
})

test('rule registry exposes the new inclusive-language rule', () => {
  assert.ok(ruleRegistry.has('no-non-inclusive-language'))
})

test('no-redundant-phrases flags default redundant phrases', () => {
  const text = 'In order to win, we must act now. Due to the fact that we shipped early, we lead the market.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 2)
  assert.equal(diagnostics[0].ruleId, 'no-redundant-phrases')
  assert.match(diagnostics[0].message, /in order to/i)
  assert.match(diagnostics[0].message, /to/)
  assert.deepEqual(diagnostics[0].range, { start: 0, end: 11 })
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'to')
  assert.equal(diagnostics[1].ruleId, 'no-redundant-phrases')
  assert.match(diagnostics[1].message, /due to the fact that/i)
  assert.match(diagnostics[1].message, /because/)
  assert.deepEqual(diagnostics[1].range, { start: 34, end: 54 })
  assert.equal(diagnostics[1].suggest.edits[0].replacement, 'because')
})

test('no-redundant-phrases suggests deleting empty-replacement phrases', () => {
  const text = 'Needless to say, the product is fast.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /needless to say/i)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, '')
})

test('no-redundant-phrases is case-insensitive', () => {
  const text = 'IN ORDER TO succeed, plan ahead.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /IN ORDER TO/)
})

test('no-redundant-phrases supports custom phrases', () => {
  const text = 'We should touch base before the launch.'
  const diagnostics = run(noRedundantPhrases, text, {
    phrases: [{ phrase: 'touch base', replacement: 'talk' }],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /touch base/)
  assert.equal(diagnostics[0].suggest.edits[0].replacement, 'talk')
})

test('no-redundant-phrases does not match substrings inside longer words', () => {
  const text = 'The proximity sensor is in order.'
  const diagnostics = run(noRedundantPhrases, text)

  assert.equal(diagnostics.length, 0)
})

test('rule registry exposes the new redundant-phrases rule', () => {
  assert.ok(ruleRegistry.has('no-redundant-phrases'))
})

test('no-passive-voice flags common passive constructions', () => {
  const text = 'The page was approved. The rollout is delayed by unclear ownership. The report has been written.'
  const diagnostics = run(noPassiveVoice, text)

  assert.equal(diagnostics.length, 3)
  assert.equal(diagnostics[0].ruleId, 'no-passive-voice')
  assert.match(diagnostics[0].message, /was approved/)
  assert.deepEqual(diagnostics[0].range, { start: 9, end: 21 })
  assert.match(diagnostics[1].message, /is delayed/)
  assert.deepEqual(diagnostics[1].range, { start: 35, end: 45 })
  assert.match(diagnostics[2].message, /been written/)
  assert.deepEqual(diagnostics[2].range, { start: 83, end: 95 })
})

test('no-passive-voice ignores active voice', () => {
  const text = 'The team approved the page. Unclear ownership delayed the rollout.'
  const diagnostics = run(noPassiveVoice, text)

  assert.equal(diagnostics.length, 0)
})

test('no-passive-voice respects allowed phrases', () => {
  const text = 'The page was approved by the committee.'
  const diagnostics = run(noPassiveVoice, text, { allowedPhrases: ['was approved'] })

  assert.equal(diagnostics.length, 0)
})

test('no-passive-voice supports custom auxiliaries', () => {
  const text = 'The feature gets deployed every Friday.'
  const diagnostics = run(noPassiveVoice, text, { auxiliaries: ['gets'], participles: ['deployed'] })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /gets deployed/)
})

test('no-passive-voice supports custom participles', () => {
  const text = 'The build is greenlit every morning.'
  const diagnostics = run(noPassiveVoice, text, { participles: ['greenlit'] })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /is greenlit/)
})

test('no-passive-voice is case-insensitive', () => {
  const text = 'The Page Was Approved.'
  const diagnostics = run(noPassiveVoice, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /Was Approved/)
})

test('no-passive-voice does not match substrings inside longer words', () => {
  const text = 'The approvedly happy team was welcomed.'
  const diagnostics = run(noPassiveVoice, text)

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /was welcomed/)
})

test('rule registry exposes the new passive-voice rule', () => {
  assert.ok(ruleRegistry.has('no-passive-voice'))
})

test('no-complex-sentences flags a dense, multi-clause sentence', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables, which consequently produces a substantial augmentation in cognitive load for the average reader.'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-complex-sentences')
  assert.equal(diagnostics[0].severity, 'warn')
  assert.match(diagnostics[0].message, /grade/)
  assert.match(diagnostics[0].message, /simplify to 12/)
  assert.deepEqual(diagnostics[0].range, { start: 0, end: text.length })
})

test('no-complex-sentences allows short, simple sentences', () => {
  const text = 'Faircopy checks your copy. It finds weak words. Your page reads better.'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 0)
})

test('no-complex-sentences ignores sentences below the word threshold', () => {
  const text = 'The multifaceted implementation necessitates rigorous examination.'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 0)
})

test('no-complex-sentences flags only the complex sentence in mixed text', () => {
  const prefix = 'Faircopy checks your copy. '
  const complex = 'The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables, which consequently produces a substantial augmentation in cognitive load for the average reader.'
  const text = prefix + complex
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.deepEqual(diagnostics[0].range, { start: prefix.length, end: text.length })
})

test('no-complex-sentences respects custom max grade level', () => {
  const text = 'The quick brown fox jumps over the lazy dog while the sun sets behind the hills and the birds begin to sing in the trees.'
  const diagnostics = run(noComplexSentences, text, { maxGradeLevel: 1 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /simplify to 1/)
})

test('no-complex-sentences respects custom minimum word threshold', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates rigorous examination.'
  const diagnostics = run(noComplexSentences, text, { minWords: 5 })

  assert.equal(diagnostics.length, 1)
})

test('no-complex-sentences handles empty text', () => {
  const diagnostics = run(noComplexSentences, '')
  assert.equal(diagnostics.length, 0)
})

test('no-complex-sentences handles text without sentence terminators', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates rigorous examination of interdependent variables'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 0)
})

test('no-complex-sentences does not split on common abbreviations', () => {
  const text = 'Dr. Smith visited at 3 p.m. The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables.'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].range.start, text.indexOf('The implementation'))
})

test('no-complex-sentences flags sentences ending with question or exclamation marks', () => {
  const text = 'The implementation of multifaceted computational methodologies necessitates the rigorous examination of numerous interdependent variables!'
  const diagnostics = run(noComplexSentences, text)

  assert.equal(diagnostics.length, 1)
})

test('rule registry exposes the new complex-sentences rule', () => {
  assert.ok(ruleRegistry.has('no-complex-sentences'))
})

test('no-cliches flags default clichéd phrases', () => {
  const text = 'Our world-class, cutting-edge platform is a game changer. At the end of the day, we move the needle.'
  const diagnostics = run(noCliches, text)

  assert.equal(diagnostics.length, 5)
  assert.equal(diagnostics[0].ruleId, 'no-cliches')
  assert.match(diagnostics[0].message, /world-class/)
  assert.deepEqual(diagnostics[0].range, { start: 4, end: 15 })
  assert.match(diagnostics[1].message, /cutting-edge/)
  assert.match(diagnostics[2].message, /game changer/)
  assert.match(diagnostics[3].message, /at the end of the day/i)
  assert.match(diagnostics[4].message, /move the needle/)
  assert.ok(diagnostics.every(diagnostic => diagnostic.severity === 'warn'))
})

test('no-cliches is case-insensitive', () => {
  const text = 'This is a WORLD-CLASS solution with Seamless integration.'
  const diagnostics = run(noCliches, text)

  assert.equal(diagnostics.length, 2)
  assert.match(diagnostics[0].message, /WORLD-CLASS/)
  assert.match(diagnostics[1].message, /Seamless/)
})

test('no-cliches does not match substrings inside longer words', () => {
  const text = 'The seamlessness of their robustly engineered system is not a game-changingly bad idea.'
  const diagnostics = run(noCliches, text)

  assert.equal(diagnostics.length, 0)
})

test('no-cliches respects allowed phrases', () => {
  const text = 'Our robust, world-class product delivers synergy.'
  const diagnostics = run(noCliches, text, { allow: ['robust', 'synergy'] })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /world-class/)
})

test('no-cliches supports custom phrases', () => {
  const text = 'We should touch base before the launch.'
  const diagnostics = run(noCliches, text, {
    phrases: [{ phrase: 'touch base', alternatives: ['talk', 'connect'] }],
  })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /touch base/)
  assert.match(diagnostics[0].message, /talk/)
})

test('rule registry exposes the new no-cliches rule', () => {
  assert.ok(ruleRegistry.has('no-cliches'))
})

test('no-repetitive-sentence-startings flags three consecutive sentences starting with the same word', () => {
  const text = 'Faircopy checks your copy. Faircopy finds weak words. Faircopy improves readability.'
  const diagnostics = run(noRepetitiveSentenceStartings, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].ruleId, 'no-repetitive-sentence-startings')
  assert.match(diagnostics[0].message, /faircopy/)
  assert.match(diagnostics[0].message, /3 consecutive sentences/)
})

test('no-repetitive-sentence-startings ignores short sentences below minWords', () => {
  const text = 'Go. Go. Go fast now.'
  const diagnostics = run(noRepetitiveSentenceStartings, text)

  assert.equal(diagnostics.length, 0)
})

test('no-repetitive-sentence-startings ignores allowed words', () => {
  const text = 'The cat sat. The dog ran. The bird flew.'
  const diagnostics = run(noRepetitiveSentenceStartings, text)

  assert.equal(diagnostics.length, 0)
})

test('no-repetitive-sentence-startings respects custom threshold', () => {
  const text = 'We shipped the build. We tested every rule. We launched the site. We celebrated the release.'
  const diagnostics = run(noRepetitiveSentenceStartings, text, { threshold: 4 })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /4 consecutive sentences/)
})

test('no-repetitive-sentence-startings respects custom allow list', () => {
  const text = 'We shipped. We tested. We launched.'
  const diagnostics = run(noRepetitiveSentenceStartings, text, { allow: ['we'] })

  assert.equal(diagnostics.length, 0)
})

test('no-repetitive-sentence-startings does not flag two consecutive repetitions', () => {
  const text = 'Faircopy checks copy. Faircopy finds issues. It also explains them.'
  const diagnostics = run(noRepetitiveSentenceStartings, text)

  assert.equal(diagnostics.length, 0)
})

test('no-repetitive-sentence-startings handles text without sentence terminators', () => {
  const text = 'Faircopy checks copy and finds weak words'
  const diagnostics = run(noRepetitiveSentenceStartings, text)

  assert.equal(diagnostics.length, 0)
})

test('rule registry exposes the new no-repetitive-sentence-startings rule', () => {
  assert.ok(ruleRegistry.has('no-repetitive-sentence-startings'))
})

test('no-filler-words flags "just" by default', () => {
  const text = 'I just wanted to check in.'
  const diagnostics = run(noFillerWords, text)

  assert.equal(diagnostics.length, 1)
  assert.equal(diagnostics[0].severity, 'error')
  assert.match(diagnostics[0].message, /just/)
})

test('no-filler-words flags multiple occurrences of "just"', () => {
  const text = 'Just one issue. It is just a small change.'
  const diagnostics = run(noFillerWords, text)

  assert.equal(diagnostics.length, 2)
})

test('no-filler-words ignores non-filler text', () => {
  const text = 'Shipping faircopy changes how you write.'
  const diagnostics = run(noFillerWords, text)

  assert.equal(diagnostics.length, 0)
})

test('no-filler-words respects custom words', () => {
  const text = 'Basically, we need to move forward.'
  const diagnostics = run(noFillerWords, text, { words: ['basically'] })

  assert.equal(diagnostics.length, 1)
  assert.match(diagnostics[0].message, /basically/)
})

test('no-filler-words handles empty words option by falling back to defaults', () => {
  const text = 'I just wanted to check in.'
  const diagnostics = run(noFillerWords, text, { words: [] })

  assert.equal(diagnostics.length, 1)
})

test('rule registry exposes the new no-filler-words rule', () => {
  assert.ok(ruleRegistry.has('no-filler-words'))
})
