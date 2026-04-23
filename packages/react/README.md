# @faircopy/react

React/Vite adapter for [faircopy](https://github.com/omniaura/faircopy). Extracts prose from `.tsx` and `.jsx` files so faircopy can lint it for writing quality issues.

## Install

```sh
pnpm add -D @faircopy/react
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { react } from '@faircopy/react'

export default defineConfig({
  adapters: [
    react({
      lintExpressionStrings: true,   // lint { 'string literals' } in JSX (default: true)
      lintProseProps: true,           // lint prose-named attributes like alt, label (default: true)
      // lintProseProps: { props: ['label', 'placeholder'] }, // custom prop list
    }),
  ],
})
```

## What gets extracted

- **JSXText nodes** — visible text content between tags
- **JSX expression string literals** `{'like this'}` when `lintExpressionStrings` is true
- **Prose attribute values** for `label`, `placeholder`, `alt`, `title`, `aria-label`, `aria-description`, `tooltip`, `description` when `lintProseProps` is true

## What gets skipped

- Subtrees inside `<script>`, `<style>`, `<code>`, `<pre>`, `<kbd>` tags
- Any element with a `data-faircopy-ignore` attribute
- Whitespace-only text nodes
