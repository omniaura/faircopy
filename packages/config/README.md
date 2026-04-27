# @faircopy/config

`defineConfig()` helper for `faircopy.config.ts`. An identity function with full TypeScript inference — no runtime effect beyond type-checking.

## Install

```sh
npm i -D @faircopy/config
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'

export default defineConfig({
  files: ['src/**/*.astro'],
  ignore: ['src/content/blog/**'],
  adapters: [astro()],
  rulesets: ['@faircopy/rules-nlp'],
  rules: {
    'no-em-dash': 'error',
    'no-weasel-words': ['error', { words: ['actually', 'truly', 'really', 'literally'] }],
    'no-rhetorical-scaffolding': 'error',
    'no-passive-voice': 'warn',
  },
})
```

`rulesets` loads optional rule packages so their rule IDs can be used without repeating the package name. If multiple loaded packages expose the same bare rule name, use the package-qualified ID for that rule.

All public types from `@faircopy/core` are re-exported from this package.
