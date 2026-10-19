# faircopy

Copy linter for landing pages. Meta-package that installs the CLI, core engine, and default ruleset.

```sh
npm i -D faircopy @faircopy/astro
```

For Go templ projects, install `faircopy @faircopy/templ` instead.

For Go source error messages, install `faircopy @faircopy/go` and configure the function calls and message argument positions that contain user-facing copy.

For blog prose, register `markdown()` from `@faircopy/markdown` and include your
`.md`/`.markdown` paths. Use `html()` from `@faircopy/html` for rendered HTML.
Choose one representation per generated article to avoid duplicate findings.

See the [full documentation](https://github.com/omniaura/faircopy) for configuration and usage.
