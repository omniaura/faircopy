#!/usr/bin/env node
import { REVIEW_LIMITS, ChatReviewFailure, limitExceeded, reviewErrorEnvelope, reviewText } from './index.js'
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
      if (size > REVIEW_LIMITS.inputBytes) throw limitExceeded('input')
      chunks.push(buffer)
    }
    let request: unknown
    try {
      request = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))
    } catch {
      throw new ChatReviewFailure('invalid_request')
    }
    response = reviewText(request)
  } catch (error) {
    response = reviewErrorEnvelope(error)
    process.exitCode = 2
  }
  process.stdout.write(JSON.stringify(response) + '\n')
}

await main()
