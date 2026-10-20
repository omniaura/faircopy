import { CHAT_REVIEW_LIMITS, ChatReviewFailure, reviewChat, utf8ByteLength } from './index.js'
import type { ChatReviewError } from './index.js'

export { reviewChat, CHAT_REVIEW_VERSION, CHAT_REVIEW_LIMITS } from './index.js'

/** Single-call JSON boundary for embedded JS interpreters. No I/O, eval,
 * config loading, dynamic imports or host globals. The host owns time limits.
 */
export function reviewChatJSON(input: string): string {
  try {
    if (typeof input !== 'string') throw new ChatReviewFailure('invalid_request')
    if (utf8ByteLength(input) > CHAT_REVIEW_LIMITS.inputBytes) throw new ChatReviewFailure('limit_exceeded')
    let request: unknown
    try { request = JSON.parse(input) } catch { throw new ChatReviewFailure('invalid_request') }
    return JSON.stringify(reviewChat(request))
  } catch (error) {
    const result: ChatReviewError = {
      version: 1, profile: 'chat-v1', status: 'error',
      code: error instanceof ChatReviewFailure ? error.code : 'internal_error',
    }
    return JSON.stringify(result)
  }
}
