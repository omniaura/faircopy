# @faircopy/chat

An optional, deterministic profile for informal English chat. It flags the actual
em dash (`U+2014`), selected formal openers/sign-offs, assistant boilerplate and
sales slogans. It allows fragments, contractions, lowercase, emoji, shorthand,
links and either presence or absence of a final period. It does not rewrite text.
Warnings are style suggestions, not evidence that a person used AI.

## HTTP API server

The package also ships `faircopy-chat-server` and the programmatic
`@faircopy/chat/server` entry point. After building from this repository:

```sh
node packages/chat/dist/server-cli.js --port 8787
curl http://127.0.0.1:8787/v1/profiles
curl -H 'Content-Type: application/json' --data-binary @draft.json http://127.0.0.1:8787/v1/review
```

`draft.json` contains the same bounded request as the local reviewer:

```json
{"version":1,"profile":"chat-v1","text":"okay — see you later"}
```

`GET /health` reports health. `GET /v1/profiles` lists configured profiles and
their rule settings. `POST /v1/review` returns compact feedback without snippets;
drafts are neither stored nor logged. Invalid requests return 400, oversized
input/output 413, and non-JSON bodies 415. All responses disable caching. Each
request uses the existing 64-KiB body, 16384 UTF-16 code-unit text, 100-finding
and 16-KiB output limits. Request/header timeouts are 10 seconds, with at most
32 simultaneous connections. Built-in phrase rules run synchronously; there is
no worker isolation or hard CPU deadline for operator-supplied programmatic
rules. Use process supervision for a deployed sidecar.

The CLI binds `127.0.0.1` by default. Set `FAIRCOPY_API_TOKEN` to require
`Authorization: Bearer ...` on every route. Non-loopback binding requires that
environment variable. There is no CORS or TLS listener: place any externally
reachable service behind your authenticated TLS ingress.

To configure your voice, load data-only JSON at startup:

```sh
node packages/chat/dist/server-cli.js --profile voice.json
```

```json
{
  "version": 1,
  "id": "my-voice",
  "rules": {
    "no-em-dash": "off",
    "chat-no-formal-language": ["warn", {"allow": ["kindly send"]}],
    "chat-no-agent-language": ["warn", {"phrases": ["custom padding"]}]
  }
}
```

Use `"profile":"my-voice"` in review requests. Repeat `--profile` for additional
profiles. The built-in `chat-v1` cannot be replaced. Configuration accepts only
known chat rules, severities and literal `allow`/`phrases` arrays, with at most
64 configured phrases of 128 code units each. It loads no JavaScript, regex,
remote URL or draft-supplied configuration. Profiles are fixed for the lifetime
of the server; edit the file and restart to change them. A profile is a set of
style preferences, not a learned impersonation model.

Applications can call `createFaircopyServer({ profiles, token })` and listen on
their chosen address, using `parseVoiceProfile(json)` for the same bounded
data-only configuration. A server review is advisory and has no send, approval
or idempotency token. Existing embedded interpreters and the fixed `reviewChat`
wire contract continue to work without Node or a network service.

This package does not change the default marketing rules, CLI configuration or
plugin behavior. Chat text is literal input: adapters, comments such as
`faircopy-ignore-line`, filesystem config and ruleset loading do not apply.

## Programmatic API

```ts
import { reviewChat, lintChat, createChatProfile } from '@faircopy/chat'

const result = reviewChat({ version: 1, profile: 'chat-v1', text: 'on my way 👍' })
// { version: 1, profile: 'chat-v1', status: 'clean', issueCount: 0,
//   errorCount: 0, warningCount: 0, feedback: 'faircopy errors=0 warnings=0' }

const profile = createChatProfile({
  'no-em-dash': 'off',
  'chat-no-formal-language': ['warn', { allow: ['kindly send'], phrases: ['custom padding'] }],
})
const diagnostics = lintChat('custom padding', profile)
```

`lintChat` returns standard Fair Copy diagnostics with zero-based, half-open
UTF-16 code-unit ranges. `createChatProfile(overrides, extraRules)` accepts
severity/options overrides and extra `Rule` objects. Unknown or duplicate rule
IDs throw. Phrase-rule options are `allow: string[]` and `phrases: string[]`;
phrases are literal, case-insensitive and permit whitespace between words.
The built-in rule IDs are `no-em-dash`, `chat-no-formal-language`,
`chat-no-agent-language` and `chat-no-sales-language`. All default to `warn`.
The `no-em-dash` rule and the formatter are reused from existing Fair Copy.

`reviewChat` uses the fixed built-in `chat-v1` profile, without overrides. Its
`feedback` is the existing `formatAgentCompact` format used by Copy for LLM,
with `snippets: 'none'` and `chars: true`. Rule messages and help are static;
draft excerpts and matched phrases are never copied into the response. Feedback
is data for a caller to inspect, not permission or instructions to send anything.

## Version 1 wire contract

One JSON request, with exactly these keys:

```json
{"version":1,"profile":"chat-v1","text":"okay — see you later"}
```

Success has `version`, `profile`, `status` (`clean` or `warnings`), `issueCount`,
`errorCount`, `warningCount`, and `feedback`. Counts describe the complete review;
no findings are silently dropped. No diagnostic array is sent on the wire.
An error has exactly `version: 1`, `profile: 'chat-v1'`, `status: 'error'` and
`code: 'invalid_request' | 'limit_exceeded' | 'internal_error'`. Errors contain
no draft, stack, exception message or partial review. Programmatic `reviewChat`
throws `ChatReviewFailure`; the runtime and executable serialize that error.

| Bound | Maximum |
| --- | --- |
| JSON input | 65,536 UTF-8 bytes |
| Text | 16,384 UTF-16 code units |
| Findings | 100 |
| JSON output, including optional trailing newline | 16,384 UTF-8 bytes |

Empty text is clean; the caller decides whether an empty send is valid. An
unknown version/profile, unexpected key or malformed JSON is invalid. An
over-limit input or result is an error, never a clean review. The pure object
API applies text/findings/output limits; serialized-input limits belong to the
JSON boundary. Callers must also bound input/output and enforce a deadline.

## Embedded runtime (including Go)

Build with the repository's pnpm 10 workflow. `packages/chat/dist/review.global.js`
is a standalone ES2015 IIFE that defines `FaircopyChat`. It requires no Node,
browser, network, files, dynamic imports or host callbacks:

```js
FaircopyChat.reviewChatJSON('{"version":1,"profile":"chat-v1","text":"hey"}')
// returns a JSON string; errors use the wire error envelope
FaircopyChat.reviewChat({ version: 1, profile: 'chat-v1', text: 'hey' })
// returns an object; throws on errors
```

Compile a pinned bundle once, then run it in an isolated interpreter for each
review. Record the upstream source commit, build command, package MIT license
metadata and artifact SHA-256 when embedding it. The caller owns interpreter
timeouts and response validation. A new profile revision must have a new profile
identifier if its fixed contract or policy changes incompatibly.

## Local executable

`faircopy-chat-review` (Node 20+) reads one UTF-8 JSON request from stdin and
writes one JSON response plus newline. Clean and warnings exit 0; errors exit 2.
It accepts no arguments, reads no config and makes no network requests. It is
also bundled, so `node packages/chat/dist/cli.js < request.json` works outside
the repository without workspace dependencies. The embedded runtime avoids
requiring Node in a Go-only deployment.

## Evidence and limitations

The initial policy was informed by a bounded private review of four retrieved
human conversation records: three Telegram records (eight text messages) and one
Slack link-only record. Aggregate patterns included short replies, omitted final
periods, fragments, informal spelling, contractions, emoji and link-only sends.
No usable human WhatsApp or GroupMe bodies were found in that bounded search.
Agent-generated memories were excluded. This is qualitative evidence, not a
representative corpus or a precision/recall benchmark across providers.

All public examples and tests are synthetic. No private message, identity,
conversation title, provider identifier or private link is included. The profile
uses conservative English phrase matching; it cannot judge intent, multilingual
tone or contextual quotations. Appropriate AI disclosure should be preserved
even when assistant framing receives a warning. Customize the programmatic
profile for another context rather than enabling marketing rules for chat.

HTTP(S) and `www.` URLs are masked while preserving UTF-16 positions, so a
path containing a style phrase does not trigger a warning. Markdown closing
delimiters and link labels remain prose; balanced parentheses in URL paths are
preserved as part of the URL. Ordinary quotations
and code remain literal input and can trigger advisory warnings. The profile
does not flag the factual phrase "I work as an AI researcher" or the adverb
in "she spoke kindly"; it targets assistant introductions and formal requests.

## Validation

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
```

The package tests cover clean/noisy synthetic controls, ordinary structured
reminders, default-registry compatibility, extensibility, source ranges, compact
formatter identity, inert feedback, standalone execution and malformed/limit
errors. Consumers must additionally exercise their real interpreter and send
approval flow; a package test does not prove deployment or provider delivery.
