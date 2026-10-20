#!/usr/bin/env node
import { CHAT_REVIEW_LIMITS, ChatReviewFailure, reviewChat } from './index.js'
import type { ChatReviewError } from './index.js'
import { TextDecoder } from 'node:util'

async function main(): Promise<void> {
  let response
  try {
    if (process.argv.length !== 2) throw new ChatReviewFailure('invalid_request')
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of process.stdin) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += buffer.length
      if (size > CHAT_REVIEW_LIMITS.inputBytes) throw new ChatReviewFailure('limit_exceeded')
      chunks.push(buffer)
    }
    let request: unknown
    try {
      request = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
    } catch {
      throw new ChatReviewFailure('invalid_request')
    }
    response = reviewChat(request)
  } catch (error) {
    response = {
      version: 1, profile: 'chat-v1', status: 'error',
      code: error instanceof ChatReviewFailure ? error.code : 'internal_error',
    } satisfies ChatReviewError
    process.exitCode = 2
  }
  process.stdout.write(JSON.stringify(response) + '\n')
}

await main()
