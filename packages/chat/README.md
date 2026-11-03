# @faircopy/chat

Deterministic, advisory review of a literal draft for a named writing context.
It does not rewrite text, send anything or fact-check content. Warnings are
style suggestions, not evidence that a person used AI.

## Writing contexts and presets

| Context | Default preset | Use for | Flags |
| --- | --- | --- | --- |
| `general` (default) | `general-v1` | Documents, website copy, notes | Em dashes, assistant boilerplate, sales slogans, "X is Y, not Z" scaffolding |
| `email` | `email-v1` | Email | The same as `general`; professional greetings, sign-offs and formal requests are fine |
| `chat` | `chat-v1` | Informal chat messages | Em dashes and selected formal openers/sign-offs, assistant boilerplate and sales slogans |

`general` and `email` do not flag formal wording ("pursuant to", "furthermore",
"Best regards"), Markdown headings or domain terms ("leverage ratio", "robust
regression") because they would be unusual in chat. `chat-v1` keeps its
intentional informal rules unchanged: it allows fragments, contractions,
lowercase, emoji, shorthand, links and optional final periods.

Presets are **data**, all in this one package (`src/presets.ts`): an ID, the
context it serves, a one-line summary and a table of the rule IDs it reports.
The rules they may use live in one catalog (`RULE_CATALOG`, `src/rules.ts`).
Each phrase list is registered there once; a preset entry such as
`{ rule: 'assistant-phrases', message, help }` reports that rule under the
preset's own ID and wording, so chat and general guidance share one list.
Adding or revising a preset is a data edit to `REVIEW_PRESETS` (plus
`CONTEXT_PRESETS` if it becomes a context's default); it is published with the
next lockstep release of this package, with no new npm package or trusted
publisher. Give a preset a new ID (`email-v2`) when its policy changes
incompatibly, so pinned callers keep the old behavior. A new *rule* is still a
code change to the catalog.

```ts
import { REVIEW_PRESETS, CONTEXT_PRESETS, describePresets } from '@faircopy/chat'
describePresets()
// { version: 1, defaultContext: 'general', contexts: { general: 'general-v1', ... },
//   presets: [{ id, context, summary, rules: [{ id, severity }] }], limits }
```

## HTTP API server

The package also ships `faircopy-chat-server` and the programmatic
`@faircopy/chat/server` entry point. After building from this repository:

```sh
node packages/chat/dist/server-cli.js --port 8787
curl http://127.0.0.1:8787/v1/profiles
curl -H 'Content-Type: application/json' --data-binary @draft.json http://127.0.0.1:8787/v1/review
```

`draft.json` contains the same bounded [version 1 request](#version-1-wire-contract)
as the local reviewer:

```json
{"version":1,"context":"chat","text":"okay — see you later"}
```

`GET /health` reports health. `GET /v1/profiles` lists the built-in presets and
configured voice profiles, with their contexts and rule settings. `POST /v1/review` returns compact feedback without snippets;
drafts are neither stored nor logged. Invalid requests return 400, oversized
input/output 413 with the `limit` envelope, and non-JSON bodies 415. All responses disable caching. Each
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
profiles. Voice profiles customize `chat-v1` and report context `chat`; built-in
preset IDs cannot be replaced. Configuration accepts only known chat rules, severities and literal `allow`/`phrases` arrays, with at most
64 configured phrases of 128 code units each. It loads no JavaScript, regex,
remote URL or draft-supplied configuration. Profiles are fixed for the lifetime
of the server; edit the file and restart to change them. A profile is a set of
style preferences, not a learned impersonation model.

Applications can call `createFaircopyServer({ profiles, token })` and listen on
their chosen address, using `parseVoiceProfile(json)` for the same bounded
data-only configuration. A server review is advisory and has no send, approval
or idempotency token. Existing embedded interpreters and the fixed `reviewChat`
wire contract continue to work without Node or a network service.

Compatibility: a server request without `profile` now reviews as `general`
instead of being rejected, and responses gained `context` and `summary`.

This package does not change the default marketing rules, CLI configuration or
plugin behavior. Draft text is literal input: adapters, comments such as
`faircopy-ignore-line`, filesystem config and ruleset loading do not apply.

## Programmatic API

```ts
import { reviewText, lintText, createPresetProfile } from '@faircopy/chat'

reviewText({ version: 1, text: 'Pursuant to Section 4.2, the ratio must remain below 3.5x.' })
// { version: 1, profile: 'general-v1', context: 'general', status: 'clean',
//   issueCount: 0, errorCount: 0, warningCount: 0,
//   summary: 'No Fair Copy findings for general writing (general-v1).',
//   feedback: 'faircopy errors=0 warnings=0' }

reviewText({ version: 1, context: 'chat', text: 'on my way 👍' })

const profile = createPresetProfile('chat-v1', {
  'no-em-dash': 'off',
  'chat-no-formal-language': ['warn', { allow: ['kindly send'], phrases: ['custom padding'] }],
})
const diagnostics = lintText('custom padding', profile)
```

`lintText` returns standard Fair Copy diagnostics with zero-based, half-open
UTF-16 code-unit ranges. `createPresetProfile(id, overrides, extraRules)`
accepts severity/options overrides for rules the preset names, and extra `Rule`
objects. Unknown presets, unknown or duplicate rule IDs throw. Phrase-rule
options are `allow: string[]` and `phrases: string[]`; phrases are literal,
case-insensitive and permit whitespace between words. Overrides and findings
use the IDs a preset reports: `no-em-dash`, `no-assistant-framing`,
`no-sales-slogans` and `no-rhetorical-scaffolding` in general-v1 and email-v1;
`no-em-dash`, `chat-no-formal-language`, `chat-no-agent-language` and
`chat-no-sales-language` in chat-v1. The catalog behind them holds `no-em-dash`,
`no-rhetorical-scaffolding` (both reused from existing Fair Copy rules) and the
phrase lists `formal-phrases`, `assistant-phrases` and `sales-phrases`.

`feedback` is the existing `formatAgentCompact` format used by Copy for LLM,
with `snippets: 'none'` and `chars: true`. Rule messages and help are static
(reused rules get a static message in the catalog); draft excerpts and matched
phrases are never copied into the response. Feedback is data for a caller to
inspect, not permission or instructions to send anything.

The chat-only names remain and behave as before: `reviewChat`, `lintChat`
(chat-v1 by default), `createChatProfile(overrides, extraRules)` (equivalent to
`createPresetProfile('chat-v1', ...)`), `chatProfile`, `CHAT_PROFILE`,
`CHAT_REVIEW_LIMITS` and `ChatProfile`.

## Version 1 wire contract

One JSON request. `text` is the only required field:

```json
{"version":1,"text":"Dear Ms. Patel, ... Best regards, Jordan","context":"email"}
```

Optional keys are `context` (`general`, `email` or `chat`; default `general`)
and `profile` (a preset ID, or a host-configured voice profile). When both are
given the profile must belong to that context. Any other key, an unknown
context or profile, or malformed JSON is `invalid_request`.

Success has `version`, `profile` and `context` (what was applied), `status`
(`clean` or `warnings`), `issueCount`, `errorCount`, `warningCount`, a one-line
static `summary`, and `feedback`. Counts describe the complete review; no
findings are silently dropped. No diagnostic array is sent on the wire.

An error has `version: 1`, `status: 'error'` and
`code: 'invalid_request' | 'limit_exceeded' | 'internal_error'`, plus `profile`
and `context` when the request resolved a preset, and for `limit_exceeded` a
`limit` naming the bound crossed:

```json
{"version":1,"status":"error","code":"limit_exceeded","profile":"general-v1","context":"general",
 "limit":{"name":"text","unit":"utf16CodeUnits","max":16384,"actual":20000}}
```

`limit.name` is `input`, `text`, `findings` or `output`; `actual` is omitted for
`findings`, where review stops at the first finding over the maximum. Errors
contain no draft, stack, exception message or partial review. Programmatic
`reviewText` throws `ChatReviewFailure` (also exported as `ReviewFailure`, with
`code` and `limit`); `reviewErrorEnvelope(error)` serializes one.

| Bound | Maximum |
| --- | --- |
| JSON input | 65,536 UTF-8 bytes |
| Text | 16,384 UTF-16 code units |
| Findings | 100 |
| JSON output, including optional trailing newline | 16,384 UTF-8 bytes |

Empty text is clean; the caller decides whether an empty draft is valid. An
over-limit input or result is an error, never a clean or truncated review. Split
a longer document and review the parts. The pure object API applies
text/findings/output limits; serialized-input limits belong to the JSON
boundary. Callers must also bound input/output and enforce a deadline.

### Legacy chat-v1 contract

`reviewChat` and `reviewChatJSON` keep the original fixed contract exactly:
the request has exactly `version: 1`, `profile: 'chat-v1'` and `text`; success
has no `context` or `summary`; an error has exactly `version`,
`profile: 'chat-v1'`, `status: 'error'` and `code`. Existing embedders
(including Ditto's connected-chat send review) need no change.

## Embedded runtime (including Go)

Build with the repository's pnpm 10 workflow. `packages/chat/dist/review.global.js`
is a standalone ES2015 IIFE that defines `FaircopyChat`. It requires no Node,
browser, network, files, dynamic imports or host callbacks:

```js
FaircopyChat.reviewTextJSON('{"version":1,"text":"hey","context":"chat"}')
// returns a JSON string; errors use the wire error envelope
FaircopyChat.reviewText({ version: 1, text: 'hey' })
// returns an object; throws on errors
FaircopyChat.describePresetsJSON()
// contexts, presets, rule IDs and limits as JSON
FaircopyChat.reviewChatJSON('{"version":1,"profile":"chat-v1","text":"hey"}')
// legacy fixed chat-v1 contract
```

Compile a pinned bundle once, then run it in an isolated interpreter for each
review. Record the upstream source commit, build command, package MIT license
metadata and artifact SHA-256 when embedding it. The caller owns interpreter
timeouts and response validation. A new profile revision must have a new profile
identifier if its fixed contract or policy changes incompatibly.

## Local executable

`faircopy-chat-review` (Node 20+) reads one UTF-8 [version 1 request](#version-1-wire-contract)
(any context) from stdin and writes one JSON response plus newline. Clean and warnings exit 0; errors exit 2.
It accepts no arguments, reads no config and makes no network requests. It is
also bundled, so `node packages/chat/dist/cli.js < request.json` works outside
the repository without workspace dependencies. Errors use the version 1 error
envelope above, so `profile` appears only when the request resolved one. The
embedded runtime avoids
requiring Node in a Go-only deployment.

## Evidence and limitations

The initial policy was informed by a bounded private review of four retrieved
human conversation records: three Telegram records (eight text messages) and one
Slack link-only record. Aggregate patterns included short replies, omitted final
periods, fragments, informal spelling, contractions, emoji and link-only sends.
No usable human WhatsApp or GroupMe bodies were found in that bounded search.
Agent-generated memories were excluded. This is qualitative evidence, not a
representative corpus or a precision/recall benchmark across providers.

That evidence informed `chat-v1` only. `general-v1` and `email-v1` reuse the
assistant and sales phrase lists and Fair Copy's existing em-dash and
rhetorical-scaffolding rules, chosen for precision on formal text; they have not
been measured against a corpus of real documents or email.

All public examples and tests are synthetic. No private message, identity,
conversation title, provider identifier or private link is included. The presets
use conservative English phrase matching; it cannot judge intent, multilingual
tone or contextual quotations. Appropriate AI disclosure should be preserved
even when assistant framing receives a warning. Add a preset for another
context rather than enabling marketing rules for chat.

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
