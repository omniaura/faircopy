# @faircopy/html

Extract static prose from rendered `.html` and `.htm` documents or fragments,
with locations in the original HTML. Parsing never executes scripts or loads
linked resources.

```sh
npm i -D faircopy @faircopy/html
```

```ts
import { defineConfig } from '@faircopy/config'
import { html } from '@faircopy/html'

export default defineConfig({
  files: ['src/site/data/resources/blog/**/*.html'],
  adapters: [html()],
  rules: { 'no-weasel-words': 'error' },
})
```

Inline elements keep their surrounding sentence intact. Block elements separate
segments. Entities decode without losing source locations. Attributes, comments,
URLs/email addresses, `script`, `style`, `code`, `pre`, `kbd`, `samp`, `template`,
`svg`, `math`, `noscript`, and subtrees marked `data-faircopy-ignore`, `hidden`,
or `aria-hidden="true"` are excluded. Code and URL spans separate prose segments.

This is static text extraction: CSS visibility, JavaScript-generated copy, and
attribute copy such as `alt` and `aria-label` are outside its scope. Prefer the
Markdown adapter for authored Markdown; use HTML for HTML-only content, a
separate rendered-copy audit, or an independently maintained served surface.
Including both representations produces separate findings in their own files.
