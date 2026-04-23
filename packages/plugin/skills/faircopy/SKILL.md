---
name: faircopy
description: Lint marketing copy for writing quality issues. Use when writing or editing landing page copy, hero text, feature descriptions, Astro page content, frontmatter strings, or any marketing prose. Catches em-dashes, weasel words (actually, truly, really, literally), and rhetorical scaffolding patterns.
---

When you finish writing or editing marketing copy in `.astro` files, run faircopy to catch writing quality issues before ending your turn:

```bash
npx faircopy lint
```

If faircopy reports errors, fix them before marking the task complete:

- **no-em-dash** — Replace `—` with a sentence break. Use a period, semicolon, or rewrite as two sentences.
- **no-weasel-words** — Delete the flagged word (`actually`, `truly`, `really`, `literally`). If the sentence breaks, the claim was weak — rewrite it.
- **no-rhetorical-scaffolding** — Rewrite to state the claim directly. Drop "X is Y, not Z" and "Without X / With X" setups entirely.

A clean faircopy run is required before the turn ends. The stop hook enforces this automatically.
