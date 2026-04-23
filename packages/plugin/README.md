# @faircopy/plugin

Claude Code plugin for faircopy. Installs a stop hook that blocks a turn if lint errors are found, and a skill that teaches Claude to run faircopy when editing marketing copy.

## Install

In Claude Code:

```
/plugin marketplace add github.com/omniaura/faircopy
/plugin install faircopy
```

Or load locally during development:

```sh
claude --plugin-dir ./node_modules/@faircopy/plugin
```

## What's included

### Stop hook

Fires when Claude finishes a turn. If any `.astro` files were modified and faircopy finds errors, it blocks the turn and returns the full diagnostic output so Claude can fix the issues before ending.

Requires a `faircopy.config.ts` in the project root. If no config is found, the hook exits cleanly.

### Skill: `/faircopy:faircopy`

Loaded automatically when Claude is working on Astro files or marketing copy. Instructs Claude to:

1. Run `npx faircopy lint` after writing or editing prose
2. Fix all reported errors before marking the task complete

## Manual hook setup

If you prefer to configure the hook without the plugin:

```json
// .claude/settings.json
{
  "hooks": {
    "Stop": [{ "command": "npx faircopy hook-stop" }]
  }
}
```

## Requirements

- `faircopy.config.ts` in the project root
- `faircopy` and `@faircopy/astro` installed in the project
