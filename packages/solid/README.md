# @faircopy/solid

SolidJS adapter for [faircopy](https://github.com/omniaura/faircopy). Extracts prose from `.tsx` and `.jsx` files so faircopy can lint it for writing quality issues.

## Install

```sh
pnpm add -D @faircopy/solid
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { solid } from '@faircopy/solid'

export default defineConfig({
  adapters: [
    solid({
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

## SolidJS control-flow components

Attributes on `<Show>`, `<For>`, `<Switch>`, `<Match>`, `<Dynamic>`, `<Portal>`, and `<ErrorBoundary>` are skipped because their props (`when`, `each`, `component`, etc.) are code expressions. Children of these components are still extracted normally.

## What gets skipped

- Subtrees inside `<script>`, `<style>`, `<code>`, `<pre>`, `<kbd>` tags
- Any element with a `data-faircopy-ignore` attribute
- Whitespace-only text nodes
