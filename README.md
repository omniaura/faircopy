# faircopy

A copy linter for landing pages. Catches writing-quality bugs in the prose that ships inside your codebase: em-dashes, weasel words, and rhetorical scaffolding patterns.

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
npm i -D faircopy @faircopy/astro
```

## Configure

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'

export default defineConfig({
  files: ['src/**/*.astro'],
  ignore: ['src/content/blog/**'],
  adapters: [astro()],
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
| `no-rhetorical-scaffolding` | `error` | Ban `X is Y, not Z` and `Without X / With X` patterns |

## Packages

| Package | Purpose |
|---|---|
| [`faircopy`](packages/faircopy) | Meta-package — install this |
| [`@faircopy/cli`](packages/cli) | `faircopy` binary |
| [`@faircopy/core`](packages/core) | Engine: types, config loader, file resolver, rule runner |
| [`@faircopy/astro`](packages/astro) | Astro adapter |
| [`@faircopy/rules-default`](packages/rules-default) | Default ruleset |
| [`@faircopy/config`](packages/config) | `defineConfig()` helper |
| [`@faircopy/plugin`](packages/plugin) | Claude Code plugin |

## License

MIT
