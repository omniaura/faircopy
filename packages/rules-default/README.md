# @faircopy/rules-default

Default ruleset for faircopy. Ships four rules targeting the most common landing-page copy patterns.

## Install

Included automatically when you install `faircopy`. To use standalone:

```sh
npm i @faircopy/rules-default
```

## Rules

### `no-em-dash`

Bans the em-dash character (`—`, U+2014) in marketing copy.

```
error[no-em-dash]: use a sentence break instead of an em-dash
```

**Options:**

```ts
{
  flagEnDash?: boolean        // Also flag en-dashes (–). Default false.
  flagDoubleHyphen?: boolean  // Also flag --. Default false.
}
```

**Config example:**

```ts
rules: {
  'no-em-dash': ['error', { flagDoubleHyphen: true }],
}
```

---

### `no-weasel-words`

Bans reinforcement adverbs that weaken claims.

```
error[no-weasel-words]: remove "actually" — it weakens the claim
```

**Options:**

```ts
{
  words: string[]  // Default: ['actually', 'truly', 'really', 'literally']
}
```

**Config example:**

```ts
rules: {
  'no-weasel-words': ['error', { words: ['actually', 'truly', 'really', 'literally', 'just', 'simply'] }],
}
```

---

### `no-rhetorical-scaffolding`

Bans two formulaic patterns:

1. `X is Y, not Z` constructions
2. `Without X... With X...` sentence pairs

```
error[no-rhetorical-scaffolding]: avoid "X is Y, not Z" — state the claim directly
error[no-rhetorical-scaffolding]: avoid "Without X / With X" — drop the setup and make the claim
```

**Options:**

```ts
{
  allowIsNotConstruction?: boolean       // Disable pattern 1. Default false.
  allowWithoutWithConstruction?: boolean // Disable pattern 2. Default false.
  extraPatterns?: string[]               // Additional regex patterns to ban.
}
```

---

### `no-non-inclusive-language`

Flags non-inclusive terms and suggests neutral alternatives.

Default terms include `guys`, `manpower`, `whitelist`, `blacklist`, `master`, `slave`, `crazy`, `insane`, `dumb`, `lame`, `sanity check`, `blind spot`, `grandfathered`, and `mankind`.

```
error[no-non-inclusive-language]: replace "guys" with a neutral alternative such as "everyone, team, folks"
```

**Options:**

```ts
{
  terms?: { term: string; alternatives: string[]; exact?: boolean }[]
  allowedTerms?: string[]
}
```

**Config example:**

```ts
rules: {
  'no-non-inclusive-language': ['error', {
    terms: [
      { term: 'guys', alternatives: ['everyone', 'team'] },
      { term: 'rockstar', alternatives: ['expert', 'skilled'] },
    ],
    allowedTerms: ['master'],
  }],
}
```

Set `exact: true` on a multi-word term to match the whole phrase with word boundaries. This is useful for phrases like `sanity check`, ensuring `sanity checker` is not flagged.

---

### `no-redundant-phrases`

Flags wordy redundant phrases and suggests concise replacements.

Default phrases include:

| Phrase | Suggested replacement |
|---|---|
| `in order to` | `to` |
| `due to the fact that` | `because` |
| `in spite of the fact that` | `although` |
| `at this point in time` | `now` |
| `in the event that` | `if` |
| `for the purpose of` | `to` |
| `with regard to` | `about` |
| `in close proximity to` | `near` |
| `a large number of` | `many` |
| `the reason is that` | `because` |
| `it is important to note that` | *(delete)* |
| `needless to say` | *(delete)* |

```
warn[no-redundant-phrases]: "in order to" is redundant — use "to"
```

**Options:**

```ts
{
  phrases?: { phrase: string; replacement: string }[]
}
```

**Config example:**

```ts
rules: {
  'no-redundant-phrases': ['warn', {
    phrases: [
      { phrase: 'in order to', replacement: 'to' },
      { phrase: 'touch base', replacement: 'talk' },
    ],
  }],
}
```

Set `replacement` to an empty string to suggest deleting the phrase entirely.
