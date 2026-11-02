import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import vm from 'node:vm'
import test from 'node:test'
import {
  CONTEXT_PRESETS, REVIEW_CONTEXTS, REVIEW_LIMITS, REVIEW_PRESETS, RULE_CATALOG, ChatReviewFailure,
  createPresetProfile, describePresets, lintText, reviewChat, reviewText,
} from '../dist/index.js'
import { createFaircopyServer, parseVoiceProfile } from '../dist/server.js'

const bundle = await readFile(new URL('../dist/review.global.js', import.meta.url), 'utf8')
const review = (text, extra = {}) => reviewText({ version: 1, text, ...extra })

// Synthetic fixtures. The document and email are deliberately formal.
const DOCUMENT = `# Quarterly risk review

## Summary

Pursuant to Section 4.2 of the credit agreement, the leverage ratio must remain below 3.5x. Furthermore, the committee approved a robust regression model for default forecasting. In conclusion, the portfolio met its covenant thresholds in every month of the quarter.`

const EMAIL = `Dear Ms. Patel,

I am writing to confirm the delivery schedule for the Hartwell order. Please be advised that the second shipment will arrive on March 14. Kindly confirm receipt at your earliest convenience.

Best regards,
Jordan Lee`

const CHAT = "yeah sounds good, i'll be there by 7 👍"

const PROBLEM = "I'd be happy to assist with this. Our game-changing platform — built for teams — is a workflow tool, not just a chat app."

test('one entry point reviews a document, an email and a chat message by context', () => {
  const document = review(DOCUMENT)
  assert.equal(document.context, 'general')
  assert.equal(document.profile, 'general-v1')
  assert.equal(document.status, 'clean')
  assert.equal(document.feedback, 'faircopy errors=0 warnings=0')
  assert.equal(document.summary, 'No Fair Copy findings for general writing (general-v1).')

  const email = review(EMAIL, { context: 'email' })
  assert.deepEqual([email.context, email.profile, email.status], ['email', 'email-v1', 'clean'])

  const chat = review(CHAT, { context: 'chat' })
  assert.deepEqual([chat.context, chat.profile, chat.status], ['chat', 'chat-v1', 'clean'])
  for (const context of REVIEW_CONTEXTS) assert.equal(review(CHAT, { context }).status, 'clean', context)

  // The same formal text is what chat-v1 deliberately flags.
  for (const text of [DOCUMENT, EMAIL]) {
    const asChat = review(text, { context: 'chat' })
    assert.equal(asChat.status, 'warnings')
    assert.ok(lintText(text, createPresetProfile('chat-v1')).every(item => item.ruleId === 'chat-no-formal-language'))
  }
})

test('omitting the context means general writing, never chat', () => {
  assert.equal(review(EMAIL).context, 'general')
  assert.equal(review(EMAIL).status, 'clean')
  assert.deepEqual(review('ok'), review('ok', { context: 'general' }))
  assert.deepEqual(review('ok'), review('ok', { profile: 'general-v1' }))
})

test('a problematic draft gets precise static findings, without echoing the draft', () => {
  const result = review(PROBLEM)
  assert.equal(result.status, 'warnings')
  const ids = lintText(PROBLEM).map(item => item.ruleId)
  assert.deepEqual([...new Set(ids)].sort(), ['no-assistant-framing', 'no-em-dash', 'no-rhetorical-scaffolding', 'no-sales-slogans'])
  assert.equal(result.issueCount, 5)
  assert.equal(result.warningCount, 5)
  assert.match(result.summary, /^5 findings across 4 rules for general writing \(general-v1\)\./)
  const dash = PROBLEM.indexOf('—')
  assert.match(result.feedback, new RegExp(`chars=${dash}\\.\\.${dash + 1}`))
  assert.doesNotMatch(JSON.stringify(result), /workflow tool|chat app|happy to assist|game-changing|span=/)
  // No send, approval or workflow fields.
  assert.deepEqual(Object.keys(result).sort(), ['context', 'errorCount', 'feedback', 'issueCount', 'profile', 'status', 'summary', 'version', 'warningCount'])
})

test('chat context applies chat-v1 exactly as the legacy contract does', () => {
  for (const text of [CHAT, DOCUMENT, EMAIL, PROBLEM, 'kindly send — thanks', '', 'https://example.com/kindly-send']) {
    const legacy = reviewChat({ version: 1, profile: 'chat-v1', text })
    const { context, summary, ...current } = review(text, { context: 'chat' })
    assert.equal(context, 'chat')
    assert.equal(typeof summary, 'string')
    assert.deepEqual(current, legacy, text)
  }
})

test('request validation: text is the only required field', () => {
  for (const value of [
    null, {}, { version: 1 }, { version: 2, text: 'x' }, { version: 1, text: 7 },
    { version: 1, text: 'x', context: 'slack' }, { version: 1, text: 'x', profile: 'nope' },
    { version: 1, text: 'x', context: 'chat', profile: 'general-v1' }, { version: 1, text: 'x', rules: {} },
  ]) {
    assert.throws(() => reviewText(value), error => error instanceof ChatReviewFailure && error.code === 'invalid_request', JSON.stringify(value))
  }
})

test('oversized input returns a limit naming the bound; never a truncated review', () => {
  assert.equal(review('x'.repeat(REVIEW_LIMITS.textCodeUnits)).status, 'clean')
  assert.throws(() => review('x'.repeat(REVIEW_LIMITS.textCodeUnits + 1)), error =>
    error.code === 'limit_exceeded' && error.limit.name === 'text' && error.limit.unit === 'utf16CodeUnits'
    && error.limit.max === 16384 && error.limit.actual === 16385)
  assert.throws(() => review('—'.repeat(REVIEW_LIMITS.issues + 1)), error =>
    error.code === 'limit_exceeded' && error.limit.name === 'findings' && error.limit.max === 100)

  const context = vm.createContext({})
  vm.runInContext(bundle, context, { timeout: 2000 })
  const over = JSON.parse(context.FaircopyChat.reviewTextJSON(JSON.stringify({ version: 1, text: 'x'.repeat(16385), context: 'email' })))
  assert.deepEqual(over, {
    version: 1, status: 'error', code: 'limit_exceeded', profile: 'email-v1', context: 'email',
    limit: { name: 'text', unit: 'utf16CodeUnits', max: 16384, actual: 16385 },
  })
  const huge = JSON.parse(context.FaircopyChat.reviewTextJSON(' '.repeat(65537)))
  assert.deepEqual(huge, { version: 1, status: 'error', code: 'limit_exceeded', limit: { name: 'input', unit: 'utf8Bytes', max: 65536, actual: 65537 } })
  // The legacy chat boundary keeps its exact error envelope.
  assert.deepEqual(JSON.parse(context.FaircopyChat.reviewChatJSON(' '.repeat(65537))), { version: 1, profile: 'chat-v1', status: 'error', code: 'limit_exceeded' })
})

test('embedded bundle exposes the context contract and the preset catalog', () => {
  const context = vm.createContext({})
  vm.runInContext(bundle, context, { timeout: 2000 })
  for (const [text, extra] of [[DOCUMENT, {}], [EMAIL, { context: 'email' }], [EMAIL, { context: 'chat' }], [PROBLEM, {}], [CHAT, { profile: 'chat-v1' }]]) {
    const request = JSON.stringify({ version: 1, text, ...extra })
    assert.deepEqual(JSON.parse(context.FaircopyChat.reviewTextJSON(request)), review(text, extra))
  }
  assert.deepEqual(JSON.parse(context.FaircopyChat.describePresetsJSON()), describePresets())
})

test('presets are data in one registry: each entry is resolvable, listed and addressable by ID', () => {
  const catalog = describePresets()
  assert.equal(catalog.defaultContext, 'general')
  assert.deepEqual(catalog.contexts, { general: 'general-v1', chat: 'chat-v1', email: 'email-v1' })
  assert.deepEqual(catalog.presets.map(preset => preset.id), REVIEW_PRESETS.map(preset => preset.id))
  for (const preset of REVIEW_PRESETS) {
    assert.ok(Object.isFrozen(preset) && Object.isFrozen(preset.rules))
    for (const id of Object.keys(preset.rules)) assert.ok(RULE_CATALOG.has(id), `${preset.id} names ${id}`)
    assert.equal(createPresetProfile(preset.id).context, preset.context)
    assert.equal(review('ok', { profile: preset.id }).profile, preset.id)
  }
  for (const context of REVIEW_CONTEXTS) assert.equal(REVIEW_PRESETS.find(p => p.id === CONTEXT_PRESETS[context]).context, context)
  assert.throws(() => createPresetProfile('nope'), TypeError)
  assert.throws(() => createPresetProfile('general-v1', { 'chat-no-formal-language': 'warn' }), TypeError)
  assert.equal(lintText('— ok', createPresetProfile('general-v1', { 'no-em-dash': 'off' })).length, 0)
})

test('server reviews by context and keeps voice profiles on chat', async t => {
  const voice = parseVoiceProfile({ version: 1, id: 'my-voice', rules: { 'chat-no-formal-language': ['warn', { allow: ['best regards'] }] } })
  assert.equal(voice.context, 'chat')
  for (const id of REVIEW_PRESETS.map(preset => preset.id)) {
    assert.throws(() => parseVoiceProfile({ version: 1, id, rules: {} }), TypeError, id)
  }
  const server = createFaircopyServer({ profiles: [voice] })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => { server.close(); server.closeAllConnections() })
  const base = `http://127.0.0.1:${server.address().port}`
  const post = async body => {
    const response = await fetch(`${base}/v1/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return [response.status, await response.json()]
  }
  assert.deepEqual(await post({ version: 1, text: EMAIL }), [200, review(EMAIL)])
  assert.deepEqual(await post({ version: 1, text: EMAIL, context: 'chat' }), [200, review(EMAIL, { context: 'chat' })])
  const [status, mine] = await post({ version: 1, text: 'best regards', profile: 'my-voice' })
  assert.deepEqual([status, mine.status, mine.context, mine.profile], [200, 'clean', 'chat', 'my-voice'])
  const [limitStatus, limit] = await post({ version: 1, text: 'x'.repeat(16385) })
  assert.equal(limitStatus, 413)
  assert.deepEqual(limit.limit, { name: 'text', unit: 'utf16CodeUnits', max: 16384, actual: 16385 })
  const profiles = await (await fetch(`${base}/v1/profiles`)).json()
  assert.deepEqual(profiles.profiles.map(profile => [profile.id, profile.context]),
    [['general-v1', 'general'], ['chat-v1', 'chat'], ['email-v1', 'email'], ['my-voice', 'chat']])
})
