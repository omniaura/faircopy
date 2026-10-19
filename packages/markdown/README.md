# @faircopy/markdown

Extract CommonMark and GitHub Flavored Markdown prose with locations in the
original source. Supports `.md` and `.markdown`; MDX requires its own adapter.

```sh
npm i -D faircopy @faircopy/markdown
```

```ts
import { defineConfig } from '@faircopy/config'
import { markdown } from '@faircopy/markdown'

export default defineConfig({
  files: ['src/content/blog/**/*.md'],
  adapters: [markdown()],
  rules: { 'no-weasel-words': 'error' },
})
```

Headings, paragraphs, lists, quotes, link labels, emphasis, strikethrough, and
table cells are copy. Inline markup stays within a prose segment, so a phrase
split across emphasis or a link still reaches the rules as a sentence.

YAML/TOML frontmatter, fenced/indented/inline code, image syntax (including alt
text), comments, link definitions/destinations/titles, and URL-looking text are
excluded. Raw HTML blocks and inline HTML use `@faircopy/html` and its skip rules.
Code and URLs create segment boundaries. Entities and escaped punctuation are
decoded while source maps continue to point to the original Markdown. Character
offsets use JavaScript UTF-16 code units, including CRLF and Unicode input.

Choose one representation per article for routine linting when HTML is generated
from the Markdown. Both adapters report independently. When HTML is served and
maintained independently, check both as separate surfaces and retain their file
paths to distinguish findings. See the [blog guide](../../docs/blog-copy.md).
