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
| `--format <name>` | `pretty` | `pretty` / `json` / `github` / `compact` |
| `--quiet` | false | Suppress warnings, only show errors |
| `--max-warnings <n>` | unset | Exit 1 if warnings exceed n |
| `--no-color` | auto | Disable ANSI colors |

## Exit codes

- `0` — clean
- `1` — errors found, or warnings exceeded `--max-warnings`
- `2` — configuration error

## Output formats

**`pretty`** — colored, caret-annotated diagnostics (default in TTY)

**`github`** — `::error file=...,line=...,col=...::message` for GitHub Actions PR annotations

**`json`** — JSON array of diagnostic objects

**`compact`** — `path:line:col severity [ruleId] message`, one per line
