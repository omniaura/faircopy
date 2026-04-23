# @faircopy/core

Core engine for faircopy. Provides types, config loading, file resolution, and the rule runner. This package is for adapter and rule authors — most users should install `faircopy` instead.

## Install

```sh
npm i @faircopy/core
```

## Public API

### `loadConfig(cwd?)`

Finds and loads `faircopy.config.ts` (or `.js`, `.mjs`, `.cjs`) via `jiti`. Throws `ConfigError` if no config is found.

```ts
import { loadConfig } from '@faircopy/core'
const { config, configPath } = await loadConfig(process.cwd())
```

### `resolveFiles(config, cwd?)`

Resolves file globs from `config.files`, respecting `config.ignore` and `.gitignore`.

```ts
import { resolveFiles } from '@faircopy/core'
const files = await resolveFiles(config, cwd)
```

### `lintFile(filePath, source, adapters, rules)`

Runs a set of resolved rules against a single file using the appropriate adapter.

```ts
import { lintFile } from '@faircopy/core'
const diagnostics = await lintFile(filePath, source, adapters, resolvedRules)
```

### `parseSeverity(ruleConfig)`

Parses a `RuleConfig` value into `{ severity, options }`.

## Key types

```ts
interface FaircopyConfig { files, ignore?, adapters?, rules, noGitignore?, concurrency? }
interface Adapter { name, extensions, extract(filePath, source) }
interface Rule<Opts> { id, description, check(input) }
interface Diagnostic { ruleId, severity, message, range, help?, suggest? }
interface ExtractedText { text, sourceMap, meta? }
```

See [types.ts](src/types.ts) for the full schema.
