import type { Diagnostic } from '@faircopy/core'
import { formatAgentCompact } from '@faircopy/core/reporting'
import { CHAT_PROFILE, chatProfile } from './profile.js'
import type { ChatProfile } from './profile.js'
import {
  CONTEXT_PRESETS, DEFAULT_REVIEW_CONTEXT, PRESET_PROFILES, REVIEW_CONTEXTS, REVIEW_PRESETS, isReviewContext,
  presetEntrySeverity,
} from './presets.js'
import type { ReviewContext, ReviewProfile } from './presets.js'

export { CHAT_PROFILE, chatProfile, createChatProfile, noFormalChatLanguage, noAgentChatLanguage, noSalesChatLanguage } from './profile.js'
export type { ChatProfile, ChatPhraseOptions } from './profile.js'
export {
  CONTEXT_PRESETS, DEFAULT_REVIEW_CONTEXT, PRESET_PROFILES, REVIEW_CONTEXTS, REVIEW_PRESETS,
  createPresetProfile, getPreset, isReviewContext, presetEntrySeverity,
} from './presets.js'
export type { PresetRuleEntry, ReviewContext, ReviewPreset, ReviewProfile } from './presets.js'
export {
  RULE_CATALOG, assistantPhrases, formalPhrases, phraseRule, presentedAs, salesPhrases, withStaticMessage,
} from './rules.js'

export const REVIEW_VERSION = 1 as const
export const CHAT_REVIEW_VERSION = REVIEW_VERSION
/** Shared by every preset. Exceeding one is an error, never a partial or clean review. */
export const REVIEW_LIMITS = Object.freeze({ inputBytes: 65536, textCodeUnits: 16384, issues: 100, outputBytes: 16384 })
export const CHAT_REVIEW_LIMITS = REVIEW_LIMITS

export type ReviewLimitName = 'input' | 'text' | 'findings' | 'output'
/** Which bound a request crossed. `actual` is present when it is known. */
export interface ReviewLimit {
  name: ReviewLimitName
  unit: 'utf8Bytes' | 'utf16CodeUnits' | 'findings'
  max: number
  actual?: number
}

export interface ReviewRequest {
  version: 1
  text: string
  /** Defaults to `general`. */
  context?: ReviewContext
  /** A preset ID such as `general-v1`; must belong to `context` when both are given. */
  profile?: string
}

export interface ReviewResult {
  version: 1
  profile: string
  context: ReviewContext | 'custom'
  status: 'clean' | 'warnings'
  issueCount: number
  errorCount: number
  warningCount: number
  /** One static sentence naming the outcome, context and preset. */
  summary: string
  feedback: string
}

export type ChatReviewErrorCode = 'invalid_request' | 'limit_exceeded' | 'internal_error'

export interface ReviewError {
  version: 1
  status: 'error'
  code: ChatReviewErrorCode
  /** Present when the request named a preset before failing. */
  profile?: string
  context?: ReviewContext | 'custom'
  /** Present for `limit_exceeded`. */
  limit?: ReviewLimit
}

/** Legacy chat-v1 result: the version 1 shape without `context` or `summary`. */
export interface ChatReviewResult {
  version: 1
  profile: 'chat-v1'
  status: 'clean' | 'warnings'
  issueCount: number
  errorCount: number
  warningCount: number
  feedback: string
}

export interface ChatReviewError {
  version: 1
  profile: 'chat-v1'
  status: 'error'
  code: ChatReviewErrorCode
}

export class ChatReviewFailure extends Error {
  profile?: string
  context?: ReviewContext | 'custom'
  constructor(public readonly code: ChatReviewErrorCode, public readonly limit?: ReviewLimit) {
    super(code)
    this.name = 'ChatReviewFailure'
  }
}
export { ChatReviewFailure as ReviewFailure }

const LIMIT_UNITS = { input: 'utf8Bytes', text: 'utf16CodeUnits', findings: 'findings', output: 'utf8Bytes' } as const
const LIMIT_MAX = { input: REVIEW_LIMITS.inputBytes, text: REVIEW_LIMITS.textCodeUnits, findings: REVIEW_LIMITS.issues, output: REVIEW_LIMITS.outputBytes } as const

export function limitExceeded(name: ReviewLimitName, actual?: number): ChatReviewFailure {
  const limit: ReviewLimit = { name, unit: LIMIT_UNITS[name], max: LIMIT_MAX[name] }
  if (actual !== undefined) limit.actual = actual
  return new ChatReviewFailure('limit_exceeded', limit)
}

/** Review literal text, without adapters, ignore directives, config or I/O.
 * Ranges are zero-based UTF-16 code units; no rewriting or auto-fixing occurs.
 */
export function lintText(text: string, profile: ReviewProfile = PRESET_PROFILES.get(CONTEXT_PRESETS[DEFAULT_REVIEW_CONTEXT])!): Diagnostic[] {
  if (typeof text !== 'string') throw new ChatReviewFailure('invalid_request')
  if (text.length > REVIEW_LIMITS.textCodeUnits) throw limitExceeded('text', text.length)
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
    const findings = rule.check({ text: prose, sourceMap, filePath: 'review.txt', options })
    for (const finding of findings) {
      diagnostics.push({ ...finding, severity })
      if (diagnostics.length > REVIEW_LIMITS.issues) throw limitExceeded('findings')
    }
  }
  return diagnostics.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end || a.ruleId.localeCompare(b.ruleId))
}

/** chat-v1 by default, as before. */
export function lintChat(text: string, profile: ChatProfile = chatProfile): Diagnostic[] {
  return lintText(text, profile)
}

const CONTEXT_NAMES: Record<ReviewContext | 'custom', string> = {
  general: 'general writing', chat: 'chat', email: 'email', custom: 'a custom profile',
}

function summarize(issueCount: number, ruleCount: number, context: ReviewContext | 'custom', profile: string): string {
  const where = `${CONTEXT_NAMES[context]} (${profile})`
  if (issueCount === 0) return `No Fair Copy findings for ${where}.`
  const findings = issueCount === 1 ? '1 finding' : `${issueCount} findings`
  const rules = ruleCount === 1 ? '1 rule' : `${ruleCount} rules`
  return `${findings} across ${rules} for ${where}. Revise at the listed locations; review does not change the text.`
}

/** Version 1 review with a writing context. Text is the only required field;
 * `context` defaults to `general`. Feedback contains only static rule
 * guidance and locations: never matched text, draft snippets, filenames or
 * custom rules. `profiles` lets a host add trusted data-only profiles.
 */
export function reviewText(request: unknown, profiles: ReadonlyMap<string, ReviewProfile> = PRESET_PROFILES): ReviewResult {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new ChatReviewFailure('invalid_request')
  const value = request as Record<string, unknown>
  if (value.version !== REVIEW_VERSION || typeof value.text !== 'string'
    || Object.keys(value).some(key => !['version', 'text', 'context', 'profile'].includes(key))
    || (value.context !== undefined && !isReviewContext(value.context))
    || (value.profile !== undefined && typeof value.profile !== 'string')) {
    throw new ChatReviewFailure('invalid_request')
  }
  const context = value.context as ReviewContext | undefined
  const profile = profiles.get((value.profile as string | undefined) ?? CONTEXT_PRESETS[context ?? DEFAULT_REVIEW_CONTEXT])
  if (!profile || (context !== undefined && profile.context !== context)) throw new ChatReviewFailure('invalid_request')
  const appliedContext = profile.context ?? 'custom'
  try {
    const result = buildResult(value.text, profile, appliedContext)
    const bytes = utf8ByteLength(JSON.stringify(result) + '\n')
    if (bytes > REVIEW_LIMITS.outputBytes) throw limitExceeded('output', bytes)
    return result
  } catch (error) {
    if (error instanceof ChatReviewFailure) {
      error.profile = profile.id
      error.context = appliedContext
    }
    throw error
  }
}

function buildResult(text: string, profile: ReviewProfile, context: ReviewContext | 'custom'): ReviewResult {
  const diagnostics = lintText(text, profile)
  const errorCount = diagnostics.filter(item => item.severity === 'error').length
  const warningCount = diagnostics.filter(item => item.severity === 'warn').length
  return {
    version: REVIEW_VERSION, profile: profile.id, context,
    status: diagnostics.length ? 'warnings' : 'clean',
    issueCount: diagnostics.length, errorCount, warningCount,
    summary: summarize(diagnostics.length, new Set(diagnostics.map(item => item.ruleId)).size, context, profile.id),
    feedback: formatAgentCompact([{ source: text, diagnostics }], { snippets: 'none', chars: true }),
  }
}

/** Serializable error for any failure. Never includes draft text or messages. */
export function reviewErrorEnvelope(error: unknown): ReviewError {
  const result: ReviewError = { version: REVIEW_VERSION, status: 'error', code: 'internal_error' }
  if (error instanceof ChatReviewFailure) {
    result.code = error.code
    if (error.profile) result.profile = error.profile
    if (error.context) result.context = error.context
    if (error.limit) result.limit = { ...error.limit }
  }
  return result
}

/** Fixed chat-v1 contract, unchanged: exactly `version`, `profile: 'chat-v1'`
 * and `text`, and the original result shape. New callers use `reviewText`.
 */
export function reviewChat(request: unknown): ChatReviewResult {
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new ChatReviewFailure('invalid_request')
  const value = request as Record<string, unknown>
  if (value.version !== CHAT_REVIEW_VERSION || value.profile !== CHAT_PROFILE || typeof value.text !== 'string'
    || Object.keys(value).some(key => !['version', 'profile', 'text'].includes(key))) {
    throw new ChatReviewFailure('invalid_request')
  }
  // Same engine and preset data; the legacy shape and output bound are kept exactly.
  const { version, status, issueCount, errorCount, warningCount, feedback } = buildResult(value.text, chatProfile, 'chat')
  const result: ChatReviewResult = { version, profile: CHAT_PROFILE, status, issueCount, errorCount, warningCount, feedback }
  if (utf8ByteLength(JSON.stringify(result) + '\n') > REVIEW_LIMITS.outputBytes) throw new ChatReviewFailure('limit_exceeded')
  return result
}

export interface PresetCatalog {
  version: 1
  defaultContext: ReviewContext
  contexts: Record<ReviewContext, string>
  presets: Array<{ id: string; context: ReviewContext; summary: string; rules: Array<{ id: string; severity: string }> }>
  limits: typeof REVIEW_LIMITS
}

/** Data a host can show an agent: contexts, presets, their rules and limits. */
export function describePresets(): PresetCatalog {
  return {
    version: REVIEW_VERSION,
    defaultContext: DEFAULT_REVIEW_CONTEXT,
    contexts: Object.fromEntries(REVIEW_CONTEXTS.map(context => [context, CONTEXT_PRESETS[context]])) as Record<ReviewContext, string>,
    presets: REVIEW_PRESETS.map(preset => ({
      id: preset.id, context: preset.context, summary: preset.summary,
      rules: Object.entries(preset.rules).map(([id, entry]) => ({ id, severity: presetEntrySeverity(entry) })),
    })),
    limits: REVIEW_LIMITS,
  }
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
