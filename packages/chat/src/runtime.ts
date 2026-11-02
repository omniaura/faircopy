import { ChatReviewFailure, REVIEW_LIMITS, describePresets, limitExceeded, reviewChat, reviewErrorEnvelope, reviewText, utf8ByteLength } from './index.js'
import type { ChatReviewError } from './index.js'

export { reviewChat, reviewText, describePresets, CHAT_REVIEW_VERSION, CHAT_REVIEW_LIMITS, REVIEW_VERSION, REVIEW_LIMITS } from './index.js'

function parseBounded(input: unknown): unknown {
  if (typeof input !== 'string') throw new ChatReviewFailure('invalid_request')
  const bytes = utf8ByteLength(input)
  if (bytes > REVIEW_LIMITS.inputBytes) throw limitExceeded('input', bytes)
  try { return JSON.parse(input) } catch { throw new ChatReviewFailure('invalid_request') }
}

/** Single-call JSON boundary for embedded JS interpreters. No I/O, eval,
 * config loading, dynamic imports or host globals. The host owns time limits.
 * Accepts `{"version":1,"text":"...","context":"general"|"chat"|"email"}`
 * (context optional, default general) or a preset `profile` ID.
 */
export function reviewTextJSON(input: string): string {
  try {
    return JSON.stringify(reviewText(parseBounded(input)))
  } catch (error) {
    return JSON.stringify(reviewErrorEnvelope(error))
  }
}

/** The fixed chat-v1 boundary, byte-for-byte as before. */
export function reviewChatJSON(input: string): string {
  try {
    return JSON.stringify(reviewChat(parseBounded(input)))
  } catch (error) {
    const result: ChatReviewError = {
      version: 1, profile: 'chat-v1', status: 'error',
      code: error instanceof ChatReviewFailure ? error.code : 'internal_error',
    }
    return JSON.stringify(result)
  }
}

/** Contexts, presets, rule IDs and limits, for a host to show agents. */
export function describePresetsJSON(): string {
  return JSON.stringify(describePresets())
}
