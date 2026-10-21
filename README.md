# faircopy

A copy linter for landing pages. Catches writing-quality bugs in the prose that ships inside your codebase: em-dashes, weasel words, and rhetorical scaffolding patterns.

Maintainers: see the [release and recovery guide](docs/releasing.md) for npm trusted publishing and partial-release recovery.

```
error[no-em-dash]: use a sentence break instead of an em-dash
  ┌─ src/pages/index.astro:12:38
  │
12 │   <p>Omni Aura builds the memory layer — the part that matters.</p>
  │                                          ^
  │
  = help: Split the sentence. Use a period, a semicolon, or a new sentence.
```

## Install

```sh
npm i -D faircopy @faircopy/astro @faircopy/markdown
```

## Configure

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'
import { markdown } from '@faircopy/markdown'

export default defineConfig({
  files: ['src/**/*.astro', 'src/content/blog/**/*.md'],
  adapters: [astro(), markdown()],
  rules: {
    'no-em-dash': 'error',
    'no-weasel-words': 'error',
    'no-rhetorical-scaffolding': 'error',
  },
})
```

## Run

```sh
npx faircopy lint
```

Use `@faircopy/markdown` for authored blog prose and `@faircopy/html` for rendered
HTML. Choose one representation per generated article to avoid duplicate
findings, or check both when they are independently served/maintained surfaces.
See [blog copy integration and coverage](docs/blog-copy.md).

The CLI reports inspected files, prose segments, and characters on stderr.
Unsupported selected files and runs with no inspected prose exit 2.

### Informal chat

The optional [`@faircopy/chat`](packages/chat/README.md) package reviews literal
chat drafts with a separate extensible profile. It allows fragments, lowercase,
emoji, contractions and optional final periods, while flagging em dashes and
selected formal, assistant and sales phrases. It exposes the existing compact
Copy for LLM formatter through a bounded JSON contract and a standalone embedded
JavaScript bundle for runtimes such as Go. It also ships a launchable
`faircopy-chat-server` HTTP API with data-only personal voice profiles; see the
[@faircopy/chat server guide](packages/chat/README.md#http-api-server).
Default marketing rules are unchanged.

### Go templ

Use `@faircopy/templ` to lint visible HTML text, prose attributes, and user-facing Go string literals in `.templ` files:

```sh
npm i -D faircopy @faircopy/templ
```

```ts
import { defineConfig } from '@faircopy/config'
import { templ } from '@faircopy/templ'

export default defineConfig({
  files: ['**/*.templ'],
  adapters: [templ()],
  rules: { 'no-em-dash': 'error' },
})
```

### Go error messages

Use `@faircopy/go` to lint static message arguments passed to configured Go functions:

```sh
npm i -D faircopy @faircopy/go
```

```ts
import { defineConfig } from '@faircopy/config'
import { go } from '@faircopy/go'

export default defineConfig({
  files: ['**/*.go'],
  adapters: [go({ calls: [{ name: 'NewFactory', argumentIndex: 1 }] })],
  rules: { 'no-em-dash': 'error' },
})
```

## CI

```yaml
- uses: actions/checkout@v4
- run: npm ci
- run: npx faircopy lint --format github
```

`--format github` emits `::error` workflow commands so diagnostics appear as inline PR annotations.

## Claude Code plugin

Install the plugin to get a stop hook (blocks the turn if lint errors are found) and a skill (Claude runs faircopy automatically when editing marketing copy):

```
/plugin marketplace add github.com/omniaura/faircopy
/plugin install faircopy
```

## Rules

| Rule | Default | Description |
|---|---|---|
| `no-em-dash` | `error` | Ban `—` in marketing copy |
| `no-weasel-words` | `error` | Ban `actually`, `truly`, `really`, `literally` |
| `no-rhetorical-scaffolding` | `error` | Ban `X is Y, not Z`, `Without X / With X`, and standalone `That distinction matters.` announcements |
| `no-passive-voice` | `warn` | Flag likely passive-voice constructions |
| `no-complex-readability` | `warn` | Flag prose whose Flesch-Kincaid grade level exceeds a target |

Optional NLP rules live in `@faircopy/rules-nlp`. Load the ruleset once to configure its rules with bare IDs:

```ts
export default defineConfig({
  rulesets: ['@faircopy/rules-nlp'],
  rules: {
    'no-adverb-overuse': 'warn',
    'no-expletive-openers': 'warn',
    'no-filter-words': 'warn',
    'no-future-promises': 'warn',
    'no-hedge-words': 'warn',
    'no-jargon': 'warn',
    'no-passive-voice': 'warn',
    'no-weak-modals': 'warn',
    'no-stacked-adjectives': 'warn',
    'no-nominalized-phrases': 'warn',
    'no-pronoun-led-claims': 'warn',
    'no-buzzword-stacks': 'warn',
    'no-complex-readability': 'warn',
    'no-vague-quantifiers': 'warn',
    'no-meaningless-modifiers': 'warn',
    'no-superlative-claims': 'warn',
  },
})
```

Use a package-qualified ID if two loaded rulesets expose the same bare rule name.

| Rule | Description |
|---|---|
| `@faircopy/rules-nlp/no-adverb-overuse` | Flag sentences with more than two adverbs ending in `-ly` |
| `@faircopy/rules-nlp/no-expletive-openers` | Flag sentence openings like `There are` |
| `@faircopy/rules-nlp/no-filter-words` | Ban filter phrases like `I think` and `it seems` |
| `@faircopy/rules-nlp/no-future-promises` | Flag future-tense promises like `will help you` |
| `@faircopy/rules-nlp/no-hedge-words` | Flag hedge words like `kind of` and `somewhat` |
| `@faircopy/rules-nlp/no-jargon` | Flag business jargon like `leverage` and `circle back` |
| `@faircopy/rules-nlp/no-passive-voice` | Flag likely passive-voice constructions |
| `@faircopy/rules-nlp/no-weak-modals` | Flag hedged modal claims like `can help` and `might improve` |
| `@faircopy/rules-nlp/no-stacked-adjectives` | Flag noun phrases with multiple adjectives before the noun |
| `@faircopy/rules-nlp/no-nominalized-phrases` | Flag nominalized `X of Y` phrases like `optimization of onboarding` |
| `@faircopy/rules-nlp/no-pronoun-led-claims` | Flag vague sentence openers like `This helps` and `It enables` |
| `@faircopy/rules-nlp/no-buzzword-stacks` | Flag sentences overloaded with abstract benefit nouns |
| `@faircopy/rules-nlp/no-vague-quantifiers` | Flag bare quantifiers without numeric anchors |
| `@faircopy/rules-nlp/no-meaningless-modifiers` | Flag intensifiers like `very` and `obviously` that add no information |
| `@faircopy/rules-nlp/no-superlative-claims` | Flag unproven superlatives like `best` and `world-class` |

## Packages

| Package | Purpose |
|---|---|
| [`faircopy`](packages/faircopy) | Meta-package — install this |
| [`@faircopy/cli`](packages/cli) | `faircopy` binary |
| [`@faircopy/core`](packages/core) | Engine: types, config loader, file resolver, rule runner |
| [`@faircopy/astro`](packages/astro) | Astro adapter |
| [`@faircopy/markdown`](packages/markdown) | Markdown prose adapter |
| [`@faircopy/html`](packages/html) | Rendered HTML prose adapter |
| [`@faircopy/go`](packages/go) | Go message adapter |
| [`@faircopy/templ`](packages/templ) | Go templ adapter |
| [`@faircopy/rules-default`](packages/rules-default) | Default ruleset |
| [`@faircopy/rules-nlp`](packages/rules-nlp) | Optional NLP-powered ruleset |
| [`@faircopy/config`](packages/config) | `defineConfig()` helper |
| [`@faircopy/plugin`](packages/plugin) | Claude Code plugin |

## License

MIT
