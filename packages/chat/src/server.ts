import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { timingSafeEqual } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { formatAgentCompact } from '@faircopy/core/reporting'
import type { RuleConfig } from '@faircopy/core'
import { CHAT_REVIEW_LIMITS, ChatReviewFailure, createChatProfile, lintChat } from './index.js'
import type { ChatProfile } from './index.js'

export interface FaircopyServerOptions {
  /** Trusted startup configuration, never draft-supplied code or rules. */
  profiles?: ChatProfile[]
  token?: string
}

/** Parse a data-only personal voice profile. No JS imports or custom regexes. */
export function parseVoiceProfile(value: unknown): ChatProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Invalid voice profile')
  const profile = value as Record<string, unknown>
  if (profile.version !== 1 || typeof profile.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(profile.id)
    || profile.id === 'chat-v1' || Object.keys(profile).some(key => !['version', 'id', 'rules'].includes(key))
    || !profile.rules || typeof profile.rules !== 'object' || Array.isArray(profile.rules)) throw new TypeError('Invalid voice profile')
  const rules = profile.rules as Record<string, unknown>
  let phraseCount = 0
  for (const [id, config] of Object.entries(rules)) {
    const [severity, options] = typeof config === 'string' ? [config, {}] : Array.isArray(config) && config.length === 2 ? config : []
    if (!['off', 'warn', 'error'].includes(severity as string) || !options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Invalid voice rule')
    for (const [key, phrases] of Object.entries(options)) {
      if (id === 'no-em-dash' || !['allow', 'phrases'].includes(key) || !Array.isArray(phrases)
        || phrases.some(phrase => typeof phrase !== 'string' || !phrase.trim() || phrase.length > 128)) throw new TypeError('Invalid voice phrase')
      phraseCount += phrases.length
    }
  }
  if (phraseCount > 64) throw new TypeError('Too many voice phrases')
  const resolved = createChatProfile(rules as Record<string, RuleConfig>)
  return { ...resolved, id: profile.id }
}

/** Stateless review API. The caller chooses the listen address; the CLI defaults
 * to loopback. This API has no connector, send, approval or stored-draft state.
 */
export function createFaircopyServer(options: FaircopyServerOptions = {}): Server {
  const profiles = new Map<string, ChatProfile>([['chat-v1', createChatProfile()]])
  for (const profile of options.profiles ?? []) {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(profile.id) || profiles.has(profile.id)) throw new TypeError('Duplicate or invalid profile ID')
    profiles.set(profile.id, profile)
  }
  const token = options.token ? Buffer.from(`Bearer ${options.token}`) : undefined
  const server = createServer(async (req, res) => {
    const respond = (status: number, body: unknown): void => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      res.end(JSON.stringify(body) + '\n')
    }
    if (token) {
      const supplied = Buffer.from(req.headers.authorization ?? '')
      if (supplied.length !== token.length || !timingSafeEqual(supplied, token)) {
        respond(401, { status: 'error', code: 'unauthorized' })
        return
      }
    }
    if (req.url === '/health' && req.method === 'GET') { respond(200, { status: 'ok' }); return }
    if (req.url === '/v1/profiles' && req.method === 'GET') {
      respond(200, { profiles: [...profiles.values()].map(profile => ({
        id: profile.id, rules: profile.rules.map(({ rule, severity, options: settings }) => ({ id: rule.id, severity, options: settings })),
      })) })
      return
    }
    if (req.url !== '/v1/review') { respond(404, { status: 'error', code: 'not_found' }); return }
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); respond(405, { status: 'error', code: 'method_not_allowed' }); return }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
      respond(415, { status: 'error', code: 'unsupported_media_type' }); return
    }
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req.iterator({ destroyOnReturn: false })) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        size += buffer.length
        if (size > CHAT_REVIEW_LIMITS.inputBytes) throw new ChatReviewFailure('limit_exceeded')
        chunks.push(buffer)
      }
      let value: unknown
      try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))) }
      catch { throw new ChatReviewFailure('invalid_request') }
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ChatReviewFailure('invalid_request')
      const request = value as Record<string, unknown>
      if (request.version !== 1 || typeof request.profile !== 'string' || typeof request.text !== 'string'
        || Object.keys(request).some(key => !['version', 'profile', 'text'].includes(key))) throw new ChatReviewFailure('invalid_request')
      const profile = profiles.get(request.profile)
      if (!profile) throw new ChatReviewFailure('invalid_request')
      const diagnostics = lintChat(request.text, profile)
      const errorCount = diagnostics.filter(item => item.severity === 'error').length
      const warningCount = diagnostics.filter(item => item.severity === 'warn').length
      const result = {
        version: 1, profile: profile.id, status: diagnostics.length ? 'warnings' : 'clean',
        issueCount: diagnostics.length, errorCount, warningCount,
        feedback: formatAgentCompact([{ source: request.text, diagnostics }], { snippets: 'none', chars: true }),
      }
      if (Buffer.byteLength(JSON.stringify(result) + '\n') > CHAT_REVIEW_LIMITS.outputBytes) throw new ChatReviewFailure('limit_exceeded')
      respond(200, result)
    } catch (error) {
      const code = error instanceof ChatReviewFailure ? error.code : 'internal_error'
      req.resume()
      res.setHeader('Connection', 'close')
      respond(code === 'limit_exceeded' ? 413 : code === 'invalid_request' ? 400 : 500, { version: 1, status: 'error', code })
    }
  })
  server.requestTimeout = 10_000
  server.headersTimeout = 10_000
  server.keepAliveTimeout = 5_000
  server.maxConnections = 32
  return server
}
