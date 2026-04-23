# faircopy

A copy linter for landing pages and marketing surfaces. Catches em-dashes, weasel words, and rhetorical scaffolding before they ship.

## Repo layout

- `packages/core` — types, config loader, file resolver, rule runner
- `packages/cli` — `faircopy` binary, reporters
- `packages/config` — `defineConfig()` helper (M1)
- `packages/rules-default` — default ruleset: no-em-dash, no-weasel-words, no-rhetorical-scaffolding (M1)
- `packages/astro` — Astro adapter (M1)
- `examples/` — integration examples

## Development

```sh
pnpm install
pnpm build        # builds topologically — core before cli
pnpm typecheck    # must run after build; cli imports from built core
pnpm test
```

## Milestone status

- M0 (scaffold): complete — `faircopy lint` runs and prints the summary footer
- M1 (three rules + Astro adapter + defineConfig): pending
- M2 (CI + Claude Code stop-hook + autofix + npm publish): pending
