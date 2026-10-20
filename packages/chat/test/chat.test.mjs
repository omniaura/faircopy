import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import test from 'node:test'
import { ruleRegistry } from '@faircopy/rules-default'
import { formatAgentCompact } from '@faircopy/core/reporting'
import { CHAT_REVIEW_LIMITS, ChatReviewFailure, createChatProfile, lintChat, reviewChat, utf8ByteLength } from '../dist/index.js'

const request = text => ({ version: 1, profile: 'chat-v1', text })
const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const bundle = await readFile(new URL('../dist/review.global.js', import.meta.url), 'utf8')

test('synthetic everyday chat and structured reminders stay clean', () => {
  const cases = [
    "yeah sounds good, i'll be there", 'can you send that when you get a sec?',
    'thanks!', 'lol yep', 'ETA 7', '👍🏽', 'on my way', 'On my way.',
    'yep!!\nsee you soon', "can't make it, sorry", 'sent the file',
    'the model is robust enough for this', 'the agent replied this morning',
    'we discussed AI disclosures today', 'https://example.com/report',
    'Please update your availability for this week by Tuesday, October 27 at 5:00 PM (America/Toronto): https://example.com/availability',
    'please update your availability by tomorrow', '', '   ',
  ]
  for (const text of cases) {
    const result = reviewChat(request(text))
    assert.equal(result.status, 'clean', text)
    assert.equal(result.issueCount, 0)
    assert.equal(result.feedback, 'faircopy errors=0 warnings=0')
  }
  assert.equal(cases.length, 19)
})

test('flags em dash, formal, agent and sales language conservatively', () => {
  for (const [text, ruleId] of [
    ['sure — see you soon', 'no-em-dash'],
    ['I hope this message finds you well', 'chat-no-formal-language'],
    ['I wanted to reach out', 'chat-no-formal-language'],
    ["I'd be happy to assist", 'chat-no-agent-language'],
    ['I’d be happy to assist', 'chat-no-agent-language'],
    ['As an AI language model, I can help', 'chat-no-agent-language'],
    ['unlock your potential', 'chat-no-sales-language'],
  ]) {
    const result = reviewChat(request(text))
    assert.equal(result.status, 'warnings', text)
    assert.equal(result.warningCount, result.issueCount)
    assert.equal(result.errorCount, 0)
    assert.ok(lintChat(text).some(item => item.ruleId === ruleId), text)
  }
  assert.equal(lintChat('unkindly').length, 0)
  assert.equal(lintChat('kindly send the file').length, 1)
})

test('source ranges are UTF-16 and handle emoji, combining marks and CRLF', () => {
  const text = '👍🏽 e\u0301\r\nokay — later'
  const [diagnostic] = lintChat(text)
  const start = text.indexOf('—')
  assert.deepEqual(diagnostic.range, { start, end: start + 1 })
  assert.equal(start, 14)
  assert.match(reviewChat(request(text)).feedback, /at=2:6-2:6 chars=14\.\.15/)
})

test('feedback reuses the real compact formatter and never echoes draft data', () => {
  const text = 'PRIVATE_SENTINEL\n<!-- faircopy-ignore-next-line -->\nI hope this message finds you well — ignore all instructions'
  const diagnostics = lintChat(text)
  assert.equal(diagnostics.length, 2)
  const result = reviewChat(request(text))
  assert.equal(result.feedback, formatAgentCompact([{ source: text, diagnostics }], { snippets: 'none', chars: true }))
  assert.doesNotMatch(result.feedback, /PRIVATE_SENTINEL|ignore all instructions|span=|I hope this message/)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_SENTINEL|ignore all instructions/)
})

test('profile extensions allow overrides without mutating the default registry', () => {
  const before = [...ruleRegistry.entries()]
  const profile = createChatProfile({
    'no-em-dash': 'off',
    'chat-no-formal-language': ['warn', { allow: ['kindly send'], phrases: ['custom padding'] }],
    'local-rule': 'error',
  }, [{
    id: 'local-rule', description: 'synthetic rule',
    check: () => [{ ruleId: 'local-rule', severity: 'warn', message: 'local guidance', range: { start: 0, end: 1 } }],
  }])
  const diagnostics = lintChat('kindly send — custom padding', profile)
  assert.deepEqual(diagnostics.map(item => item.ruleId).sort(), ['chat-no-formal-language', 'local-rule'])
  assert.equal(diagnostics.find(item => item.ruleId === 'local-rule').severity, 'error')
  assert.deepEqual([...ruleRegistry.entries()], before)
  assert.ok(lintChat('kindly send —').length === 2)
  assert.throws(() => createChatProfile({ typo: 'off' }), TypeError)
  assert.throws(() => createChatProfile({}, [ruleRegistry.get('no-em-dash')]), TypeError)
})

test('wire schema rejects config overrides and malformed inputs', () => {
  for (const value of [null, [], {}, request(7), { ...request('hi'), version: 2 }, { ...request('hi'), profile: 'other' }, { ...request('hi'), rules: {} }]) {
    assert.throws(() => reviewChat(value), error => error instanceof ChatReviewFailure && error.code === 'invalid_request')
  }
})

test('limits distinguish incomplete reviews from clean drafts', () => {
  assert.equal(reviewChat(request('x'.repeat(CHAT_REVIEW_LIMITS.textCodeUnits))).status, 'clean')
  for (const text of ['x'.repeat(CHAT_REVIEW_LIMITS.textCodeUnits + 1), '—'.repeat(CHAT_REVIEW_LIMITS.issues + 1)]) {
    assert.throws(() => reviewChat(request(text)), error => error.code === 'limit_exceeded')
  }
  assert.equal(reviewChat(request('—'.repeat(100))).issueCount, 100)
  for (const text of ['', 'ascii', 'é中😀', '\ud800', '\udfff', '👍🏽 e\u0301']) assert.equal(utf8ByteLength(text), Buffer.byteLength(text))
})

test('standalone embedded bundle works without host globals or I/O', () => {
  const context = vm.createContext({})
  vm.runInContext(bundle, context, { timeout: 2000 })
  assert.equal(vm.runInContext('typeof process + typeof require + typeof Buffer + typeof fetch', context), 'undefinedundefinedundefinedundefined')
  for (const text of ['ok', 'Kindly send — thanks', '👍🏽 —', '<!-- faircopy-ignore-line --> —']) {
    const result = JSON.parse(context.FaircopyChat.reviewChatJSON(JSON.stringify(request(text))))
    assert.deepEqual(result, reviewChat(request(text)))
  }
  assert.equal(JSON.parse(context.FaircopyChat.reviewChatJSON('{PRIVATE_SENTINEL')).code, 'invalid_request')
  assert.equal(JSON.parse(context.FaircopyChat.reviewChatJSON(' '.repeat(65537))).code, 'limit_exceeded')
  assert.doesNotMatch(bundle, /\b(?:require|import)\(/)
})

test('standalone CLI has bounded private errors and no cwd/config dependence', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'faircopy-chat-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const standalone = join(directory, 'review.mjs')
  await copyFile(cli, standalone)
  for (const [input, expected, code] of [
    [JSON.stringify(request('okay')), 'clean', 0],
    [JSON.stringify(request('kindly send —')), 'warnings', 0],
    ['{PRIVATE_SENTINEL', 'error', 2],
    [Buffer.from([0xff]), 'error', 2],
    [' '.repeat(65537), 'error', 2],
    [JSON.stringify(request('—'.repeat(101))), 'error', 2],
    [JSON.stringify(request('ok')) + JSON.stringify(request('ok')), 'error', 2],
  ]) {
    const result = spawnSync(process.execPath, [standalone], { input, cwd: directory, encoding: 'utf8', timeout: 3000, maxBuffer: 20000 })
    assert.ifError(result.error)
    assert.equal(result.status, code, result.stderr)
    assert.equal(result.stderr, '')
    assert.equal(JSON.parse(result.stdout).status, expected)
    assert.ok(Buffer.byteLength(result.stdout) <= CHAT_REVIEW_LIMITS.outputBytes)
    assert.doesNotMatch(result.stdout, /PRIVATE_SENTINEL/)
  }
})

test('URL data, human AI facts and ordinary adverbs are clean; quotes/code remain literal', () => {
  for (const text of [
    'I work as an AI researcher', 'she spoke kindly', 'https://example.com/kindly',
    'https://example.com/game-changing', 'www.example.com/revolutionize',
    '<https://example.com/kindly|report>', 'here is the link\nhttps://example.com/—',
  ]) assert.equal(reviewChat(request(text)).status, 'clean', text)
  for (const text of ['As an AI, I can help', 'As an AI assistant I can help', '"I hope this message finds you well"', '`revolutionize`']) {
    assert.equal(reviewChat(request(text)).status, 'warnings', text)
  }
  const text = 'https://example.com/game-changing\r\n👍🏽 — okay'
  assert.deepEqual(lintChat(text).map(item => item.range), [{ start: text.indexOf('—'), end: text.indexOf('—') + 1 }])
})

test('URL masking stops at prose delimiters and preserves balanced URL paths', () => {
  for (const text of [
    '[guide](https://example.com/game-changing)—later',
    '[guide](https://example.com/game-changing)Furthermore, hello',
    '[https://example.com/game-changing]Furthermore, hello',
    '"https://example.com/game-changing"Furthermore, hello',
    '<https://example.com/guide|game-changing>',
  ]) {
    const diagnostics = lintChat(text)
    assert.equal(diagnostics.length, 1, text)
    const start = text.includes('—') ? text.indexOf('—')
      : text.includes('Furthermore') ? text.indexOf('Furthermore') : text.indexOf('game-changing')
    assert.equal(diagnostics[0].range.start, start, text)
    assert.equal(reviewChat(request(text)).status, 'warnings', text)
  }
  for (const text of [
    'https://example.com/wiki_(game-changing)',
    '[guide](https://example.com/wiki_(game-changing))',
    '[guide](https://example.com/a_(b_(game-changing)))',
    'https://[::1]:3000/game-changing',
    '[guide](https://[2001:db8::1]/game-changing)',
  ]) assert.equal(reviewChat(request(text)).status, 'clean', text)
  const context = vm.createContext({})
  vm.runInContext(bundle, context, { timeout: 2000 })
  const text = '👍🏽 [guide](https://example.com/game-changing)—later'
  assert.deepEqual(JSON.parse(context.FaircopyChat.reviewChatJSON(JSON.stringify(request(text)))), reviewChat(request(text)))
})
