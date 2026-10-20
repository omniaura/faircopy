import type { Diagnostic } from '@faircopy/core'
import { formatAgentCompact } from '@faircopy/core/reporting'
import { CHAT_PROFILE, createChatProfile } from './profile.js'
import type { ChatProfile } from './profile.js'

export { CHAT_PROFILE, chatProfile, createChatProfile, noFormalChatLanguage, noAgentChatLanguage, noSalesChatLanguage } from './profile.js'
export type { ChatProfile, ChatPhraseOptions } from './profile.js'

export const CHAT_REVIEW_VERSION = 1 as const
export const CHAT_REVIEW_LIMITS = Object.freeze({ inputBytes: 65536, textCodeUnits: 16384, issues: 100, outputBytes: 16384 })

export interface ChatReviewRequest {
  version: 1
  profile: 'chat-v1'
  text: string
}

export interface ChatReviewResult {
  version: 1
  profile: 'chat-v1'
  status: 'clean' | 'warnings'
  issueCount: number
  errorCount: number
  warningCount: number
  feedback: string
}

export type ChatReviewErrorCode = 'invalid_request' | 'limit_exceeded' | 'internal_error'
export interface ChatReviewError {
  version: 1
  profile: 'chat-v1'
  status: 'error'
  code: ChatReviewErrorCode
}

export class ChatReviewFailure extends Error {
  constructor(public readonly code: ChatReviewErrorCode) {
    super(code)
    this.name = 'ChatReviewFailure'
  }
}

/** Review literal text, without adapters, ignore directives, config or I/O.
 * Ranges are zero-based UTF-16 code units; no rewriting or auto-fixing occurs.
 * Customized profiles belong to the programmatic API, not the fixed v1 wire API.
 */
export function lintChat(text: string, profile: ChatProfile = createChatProfile()): Diagnostic[] {
  if (typeof text !== 'string') throw new ChatReviewFailure('invalid_request')
  if (text.length > CHAT_REVIEW_LIMITS.textCodeUnits) throw new ChatReviewFailure('limit_exceeded')
  const sourceMap = Array.from({ length: text.length }, (_, index) => index)
  // URL text is data, not a pitch or formal request. Mask UTF-16 units without
  // removing them so diagnostics still point into the original message.
  const prose = text.replace(/(?:https?:\/\/|www\.)[^\s<>"'`{}|]+/gi, url => {
    // A closing Markdown delimiter ends the URL. Balanced parentheses inside
    // paths still belong to it (for example a wiki link ending in "_(topic)").
    let depth = 0
    let brackets = 0
    let end = url.length
    for (let index = 0; index < url.length; index++) {
      if (url[index] === '(') depth++
      else if (url[index] === '[') brackets++
      else if (url[index] === ']') {
        if (brackets === 0) { end = index; break }
        brackets--
      }
      else if (url[index] === ')') {
        if (depth === 0) { end = index; break }
        depth--
      }
    }
    return ' '.repeat(end) + url.slice(end)
  })
  const diagnostics: Diagnostic[] = []
  for (const { rule, severity, options } of profile.rules) {
    if (severity === 'off') continue
    const findings = rule.check({ text: prose, sourceMap, filePath: 'chat.txt', options })
    for (const finding of findings) {
      diagnostics.push({ ...finding, severity })
      if (diagnostics.length > CHAT_REVIEW_LIMITS.issues) throw new ChatReviewFailure('limit_exceeded')
    }
  }
  return diagnostics.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end || a.ruleId.localeCompare(b.ruleId))
}

/** Fixed, versioned contract. Feedback contains only static rule guidance and
 * locations: never matched text, draft snippets, filenames or custom rules.
 */
export function reviewChat(request: unknown): ChatReviewResult {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new ChatReviewFailure('invalid_request')
  const value = request as Record<string, unknown>
  if (value.version !== CHAT_REVIEW_VERSION || value.profile !== CHAT_PROFILE || typeof value.text !== 'string'
    || Object.keys(value).some(key => !['version', 'profile', 'text'].includes(key))) {
    throw new ChatReviewFailure('invalid_request')
  }
  const diagnostics = lintChat(value.text)
  const errorCount = diagnostics.filter(item => item.severity === 'error').length
  const warningCount = diagnostics.filter(item => item.severity === 'warn').length
  const result: ChatReviewResult = {
    version: CHAT_REVIEW_VERSION, profile: CHAT_PROFILE,
    status: diagnostics.length ? 'warnings' : 'clean',
    issueCount: diagnostics.length, errorCount, warningCount,
    feedback: formatAgentCompact([{ source: value.text, diagnostics }], { snippets: 'none', chars: true }),
  }
  if (utf8ByteLength(JSON.stringify(result) + '\n') > CHAT_REVIEW_LIMITS.outputBytes) {
    throw new ChatReviewFailure('limit_exceeded')
  }
  return result
}

/** No Node or browser globals, so embedded interpreters can use this too. */
export function utf8ByteLength(text: string): number {
  let bytes = 0
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index)
    if (unit < 0x80) bytes++
    else if (unit < 0x800) bytes += 2
    else if (unit >= 0xd800 && unit <= 0xdbff
      && index + 1 < text.length && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) {
      bytes += 4
      index++
    } else bytes += 3
  }
  return bytes
}
