# faircopy/go

A Go port of the `@faircopy/chat` review engine: the review presets
(`general-v1`, `chat-v1`, `email-v1`), the rules they run and the version 1
JSON contract. Hosts can review text in-process instead of evaluating
`packages/chat`'s standalone bundle in an embedded JavaScript VM. Standard
library only, no cgo.

```go
import faircopy "github.com/omniaura/faircopy/go"

out := faircopy.ReviewTextJSON(`{"version":1,"text":"Furthermore, it's important to note…","context":"email"}`)
chat := faircopy.ReviewChatJSON(`{"version":1,"profile":"chat-v1","text":"…"}`)
catalog := faircopy.DescribePresetsJSON()
```

The three functions return exactly the bytes that the bundle's
`reviewTextJSON`, `reviewChatJSON` and `describePresetsJSON` return for the same
input, including the error envelopes for malformed requests and every limit.

## What is ported

| Go | TypeScript |
|---|---|
| `review.go` | `packages/chat/src/index.ts`, `runtime.ts` (validation, URL masking, limits, results, summary) and `core/src/reporting.ts` `formatAgentCompact` |
| `presets.go` | `packages/chat/src/presets.ts` |
| `rules.go` | `packages/chat/src/rules.ts` phrase rules, `rules-default` `no-em-dash` and `no-rhetorical-scaffolding` |
| `jsonwriter.go` | `JSON.stringify` for the result shapes |
| `text.go` | JavaScript's UTF-16 string semantics |

Rules outside the presets, adapters, config loading and the CLI are not
ported; nothing in the review path uses them.

JavaScript semantics that the port reproduces explicitly:

- Ranges, line/column numbers, limits and the `{1,80}` / `{1,200}`
  repetitions count UTF-16 code units. Patterns that JavaScript runs without
  `/u` run here over a string with one rune per code unit.
- `\s` is JavaScript's Unicode whitespace set, not Go's ASCII one.
- `/i` without `/u` folds ASCII only; Go's `(?i)` would also match `ſ` and the
  Kelvin sign, so those patterns spell letters as `[xX]`. The `/iu` phrase
  patterns use Go's `(?i)`, which matches Unicode simple case folding.
- RE2 has no lookaround: the phrase rules' `(?<![\p{L}\p{N}_])…(?!…)` and the
  importance announcement's `(?=([.!?]+)|\s*$)` are checked by hand, resuming
  the search one character later on failure, as the JavaScript engine does.

## Parity

`go test ./...` replays `testdata/golden.jsonl.gz`: 11,163 calls produced by
the bundle over `testdata/corpus/*.txt` and the cases built into
`tools/goldens.mjs` (every phrase under 25 transformations, rhetorical
scaffolding edges, URLs and Markdown links, astral characters, case folding,
every limit and malformed request), with 0 differences.

The test fails when the port is wrong. Each of these single changes makes it
fail:

| Change | Mismatches |
|---|---|
| no URL masking | 38 |
| no phrase lookbehind / lookahead | 544 / 440 |
| importance range without its punctuation | 40 |
| Go case folding for the `/i` patterns | 4 |
| rune instead of UTF-16 counts in `{1,80}` | 8 |
| ASCII `\s` | 88 |
| text / findings limit off by one | 12 / 6 |

Two branches cannot be reached with the built-in presets, so no golden can
cover them: the rule-ID tiebreak when two rules flag an identical range (their
phrase lists do not overlap), and the output-size limit (the 100-finding cap
keeps output far below 16 KB).

CI rebuilds the bundle and checks the Go engine against goldens regenerated
from it, so a TypeScript rule or preset change fails CI until this port
follows. Regenerate the committed goldens with:

```sh
pnpm --filter @faircopy/chat build
node go/tools/goldens.mjs packages/chat/dist/review.global.js go/testdata/corpus/*.txt | gzip -9 -n > go/testdata/golden.jsonl.gz
```

## Benchmarks

`go test -bench . -benchmem`, `ReviewTextJSON` with `general-v1`, medians of 10
on a shared 4 vCPU Boat sandbox (load average ~2.5):

| 1 KB | 8 KB | 16 KB |
|---|---|---|
| 0.47 ms / 0.08 MiB | 3.9 ms / 0.63 MiB | 9.9 ms / 1.3 MiB |

## Versioning

This is a Go module in a subdirectory, so its versions are tags of the form
`go/vX.Y.Z`. Until one exists, depend on a pseudo-version of a `main` commit.
