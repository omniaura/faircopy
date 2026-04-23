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
  rules: {
    'no-em-dash': 'error',
    'no-weasel-words': ['error', { words: ['actually', 'truly', 'really', 'literally'] }],
    'no-rhetorical-scaffolding': 'error',
  },
})
```

All public types from `@faircopy/core` are re-exported from this package.
