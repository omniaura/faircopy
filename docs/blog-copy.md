# Lint authored and rendered blog copy

Registering `astro()` covers `.astro` templates. It does not cover Markdown
articles or rendered HTML. Explicit `faircopy lint article.md` arguments override
the configured file globs, but still require a registered Markdown adapter.

## Landing-astro integration

After the library change has been released and the consumer dependencies updated,
install the adapters at the same Faircopy release version. No release or consumer
deployment is part of this change.

```sh
npm i -D faircopy @faircopy/markdown @faircopy/html
```

Keep the existing Astro/fixture adapters, ignores, and rules. Add authored content
to `files` and register `markdown()`:

```ts
import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'
import { markdown } from '@faircopy/markdown'
import { fixtureStrings } from './scripts/faircopy-fixture-strings.mjs'

export default defineConfig({
  files: [
    'src/**/*.astro',
    'scripts/fixtures/**/*.mjs',
    'public/simulator-scenario.json',
    'src/content/blog/**/*.md',
    'src/content/docs/**/*.md',
  ],
  // Preserve the site's other existing ignores.
  ignore: ['src/site/data/resources/blog/**/*.html'],
  adapters: [astro(), fixtureStrings(), markdown()],
  // Preserve the site's other existing rule severities/options.
  rules: { 'no-weasel-words': 'error' },
})
```

The example shows the integration points; append them to the existing config
rather than replacing its rules and ignores. Run `faircopy lint` in CI, using
`--max-warnings 0` if the project also gates on warnings. New adapter packages
must first be bootstrapped/configured for publishing as described in the
[release guide](releasing.md). A consumer PR should depend on that release;
an unpublished registry dependency cannot pass a frozen install.

## Avoiding duplicate source/rendered reports

When HTML is regenerated from Markdown on every build, choose Markdown as the
canonical lint surface and exclude generated HTML from routine runs. For parity
QA, put `html()` from `@faircopy/html` and the HTML globs in a separate
`faircopy.rendered.config.ts`:

```sh
faircopy lint --config faircopy.rendered.config.ts
```

Landing-astro serves `src/site/data/resources/blog/*.html` directly, and those
bodies can drift independently from their editable Markdown. In that case, the
consumer may intentionally check both surfaces: remove the HTML ignore above,
add `src/site/data/resources/blog/**/*.html` to `files`, and add `html()` to
`adapters`. Findings retain their own source paths; Faircopy does not deduplicate
them across files. Its MDX article can be checked through its served HTML without
claiming native MDX support. Metadata JSON requires a separate consumer adapter.

`--config` honors the explicit filename, and globs/ignores resolve relative to
that file. Automatic discovery looks in the calling directory for
`faircopy.config.ts`, `.js`, `.mjs`, or `.cjs`. Explicit file arguments resolve
relative to the calling directory.

## Coverage and exit status

Every CLI output format writes a coverage summary to stderr, including `--quiet`:

```text
faircopy coverage: matched=1 inspected=1 segments=38 characters=7540 unsupported=0 empty=0 rules=4
```

`matched` counts selected paths after glob/ignore resolution (or unique explicit
paths). `inspected` counts files with nonblank extracted prose. `segments` and
`characters` count those extractions, including retained prose whitespace, in
UTF-16 code units. `rules` counts active resolved rules. Counts describe extraction
scope; they do not certify that every string in a file is marketing copy.

An unsupported selected file fails with exit 2, even alongside supported files.
Zero matched files or zero extracted prose across the run also fail with exit 2
and never print a clean result. Supported files with no prose are named in a
warning; if other files have prose the run continues and `empty` records them.
Rule findings use exit 1 as before, and a covered clean run uses exit 0.
JSON stdout remains the existing diagnostic array; coverage stays on stderr.

## Frozen regression

The fixtures copy the authored Markdown and rendered HTML from
[landing-astro PR #451](https://github.com/ditto-assistant/landing-astro/pull/451)
at commit `1101bcfe8d656e5a082ae1cbce97966b888bfff4`:

- `src/content/blog/predict-ai-credit-usage-with-ephemeris.md` →
  [`packages/markdown/test/fixtures/ephemeris.md`](../packages/markdown/test/fixtures/ephemeris.md)
- `src/site/data/resources/blog/predict-ai-credit-usage-with-ephemeris.html` →
  [`packages/html/test/fixtures/ephemeris.html`](../packages/html/test/fixtures/ephemeris.html)

At Faircopy main `c2f74c04f7377d03e89dc6f85c84082aa07c92e8`, explicitly linting
the Markdown with only `astro()` exits 0 and prints `No issues found` despite
extracting no article text. The new CLI exits 2 with `unsupported=1 inspected=0`
for the same configuration. Registering the Markdown adapter exits 1:

| Rule | Markdown | HTML |
|---|---:|---:|
| `no-weasel-words` (error) | 1 | 1 |
| NLP `no-stacked-adjectives` (warn) | 8 | 8 |
| NLP `no-passive-voice` (warn) | 6 | 6 |
| NLP `no-weak-modals` (warn) | 1 | 1 |
| Prose segments | 38 | 38 |
| Prose characters | 7,540 | 7,540 |

The `actually` error maps to Markdown line 11, column 168. These findings match
the original temporary body adapter; its 7,921 characters included Markdown
formatting, link destinations, and surrounding body whitespace removed by the
prose adapters. Tests freeze the counts and source locations without modifying
the consumer article. [Segment evidence](blog-copy-segments.md) lists the exact
inspected ranges in each fixture.
