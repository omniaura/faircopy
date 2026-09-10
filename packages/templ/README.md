# @faircopy/templ

Go [templ](https://templ.guide/) adapter for [faircopy](https://github.com/omniaura/faircopy). It extracts user-facing copy from `.templ` files with per-character source maps, so diagnostics point back to the original template.

## Install

```sh
npm i -D faircopy @faircopy/templ
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { templ } from '@faircopy/templ'

export default defineConfig({
  files: ['**/*.templ'],
  adapters: [templ()],
  rules: {
    'no-em-dash': 'error',
    'no-weasel-words': 'error',
  },
})
```

## What gets extracted

- Visible text between HTML tags, including the static portions around templ expressions
- Interpreted and raw Go string literals that look like prose, including component arguments
- `alt`, `title`, `placeholder`, `aria-label`, and `aria-description` attribute values

Comments, URLs, identifiers, CSS-like values, and code-oriented strings are filtered out. Content inside `<script>`, `<style>`, `<code>`, `<pre>`, and `<kbd>` is skipped.

## Options

```ts
templ({
  // Lint prose-like interpreted and raw Go strings. Default true.
  lintGoStrings: true,

  // Lint the default prose attributes, disable attributes, or provide a custom list.
  lintAttributes: true,
  // lintAttributes: false,
  // lintAttributes: { attributes: ['alt', 'data-copy'] },

  // Add tags whose entire contents should be skipped.
  skipTags: ['markdown'],
})
```

Add `data-faircopy-ignore` to an element to skip it and its descendants:

```templ
<section data-faircopy-ignore>
  <p>This content is not linted.</p>
</section>
```
