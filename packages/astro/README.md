# @faircopy/astro

Astro adapter for faircopy. Extracts prose from `.astro` files with precise source maps, so diagnostics point at the exact character in the original file.

## Install

```sh
npm i -D @faircopy/astro
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'

export default defineConfig({
  files: ['src/**/*.astro'],
  adapters: [astro()],
  rules: { 'no-em-dash': 'error' },
})
```

## What gets extracted

**Template text nodes** — prose between HTML tags, excluding `<script>`, `<style>`, `<code>`, `<pre>`, and `<kbd>` elements.

**Frontmatter string literals** — `const`/`let` assignments to identifiers in the prose list: `title`, `description`, `subtitle`, `tagline`, `lede`, `metaDescription`, `ogTitle`, `ogDescription`, `heading`.

## Options

```ts
astro({
  // Additional frontmatter identifiers to treat as prose.
  proseIdentifiers?: string[]

  // Lint HTML attribute values (alt, aria-label, etc.). Default false.
  lintAttributes?: boolean | { attributes: string[] }

  // Lint JSX expression string literals { 'like this' }. Default true.
  lintExpressionStrings?: boolean
})
```

## Suppress a node

Add `data-faircopy-ignore` to any element to skip it and all its descendants:

```astro
<div data-faircopy-ignore>
  <p>This prose won't be linted.</p>
</div>
```
