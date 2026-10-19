# @faircopy/cli

The `faircopy` CLI binary.

## Install

```sh
npm i -D faircopy
```

## Commands

```
faircopy lint [files...]     Lint the files or the configured globs
faircopy hook-stop           Claude Code Stop hook handler
faircopy --help
faircopy --version
```

## `faircopy lint` flags

| Flag | Default | Description |
|---|---|---|
| `--config <path>` | auto-detect | Explicit config file |
| `--format <name>` | `pretty` | `pretty` / `json` / `github` / `compact` / `agent-compact` |
| `--quiet` | false | Suppress warnings, only show errors |
| `--max-warnings <n>` | unset | Exit 1 if warnings exceed n |
| `--no-color` | auto | Disable ANSI colors |

## Exit codes

- `0` — clean
- `1` — errors found, or warnings exceeded `--max-warnings`
- `2` — configuration/coverage error: unsupported selected files, no matched files,
  or no extracted prose across the run

All lint formats report coverage on stderr, even with `--quiet`: selected and
inspected file counts, prose segments and UTF-16 character counts, unsupported
and empty file counts, and active resolved rule counts. A supported empty file
is named in a warning. JSON stdout remains a diagnostic array. Explicit file
arguments override config globs and resolve relative to the calling directory;
configured globs resolve relative to the loaded config. `--config` loads that
exact filename. See [blog copy coverage](../../docs/blog-copy.md) for adapters
and avoiding duplicate reports from source and generated content.

## Output formats

**`pretty`** — colored, caret-annotated diagnostics (default in TTY)

**`github`** — `::error file=...,line=...,col=...::message` for GitHub Actions PR annotations

**`json`** — JSON array of diagnostic objects

**`compact`** — `path:line:col severity [ruleId] message`, one per line

**`agent-compact`** — grouped, token-efficient output for coding agents. It includes line/column ranges, messages, help text, and normalized span snippets by default.
