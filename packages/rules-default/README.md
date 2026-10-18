# @faircopy/rules-default

Default ruleset for faircopy. Ships nine rules targeting the most common landing-page copy patterns.

## Install

Included automatically when you install `faircopy`. To use standalone:

```sh
npm i @faircopy/rules-default
```

## Rules

### `no-complex-sentences`

Flags individual sentences whose Flesch-Kincaid grade level exceeds a target.

```
warn[no-complex-sentences]: sentence readability is grade 18.5 — simplify to 12 or below
```

**Options:**

```ts
{
  maxGradeLevel?: number  // Default: 12
  minWords?: number       // Minimum words before scoring a sentence. Default: 10
}
```

**Config example:**

```ts
rules: {
  'no-complex-sentences': ['warn', { maxGradeLevel: 10, minWords: 8 }],
}
```

---

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

### `no-filler-words`

Bans filler words that pad out a sentence without adding meaning.

```
error[no-filler-words]: remove "just" — it's filler
```

**Options:**

```ts
{
  words: string[]  // Default: ['just']
}
```

**Config example:**

```ts
rules: {
  'no-filler-words': ['error', { words: ['just', 'basically', 'literally'] }],
}
```

---

### `no-rhetorical-scaffolding`

Bans three formulaic patterns:

1. `X is Y, not Z` constructions
2. `Without X... With X...` sentence pairs
3. Standalone `This/That distinction/difference matters.` importance announcements

```
error[no-rhetorical-scaffolding]: avoid "X is Y, not Z" — state the claim directly
error[no-rhetorical-scaffolding]: avoid "Without X / With X" — drop the setup and make the claim
error[no-rhetorical-scaffolding]: avoid "That distinction matters" — state the point directly
```

**Options:**

```ts
{
  allowIsNotConstruction?: boolean       // Disable pattern 1. Default false.
  allowWithoutWithConstruction?: boolean // Disable pattern 2. Default false.
  allowImportanceAnnouncements?: boolean // Disable pattern 3. Default false.
  extraPatterns?: string[]               // Additional regex patterns to ban.
}
```

Importance announcements match only the four combinations of `This` or `That`,
`distinction` or `difference`, and `matters`, case-insensitively. They must start
the extracted text, a sentence, or a blank-line-separated paragraph, and end
with `.`, `!`, `?`, or the end of the extracted text. Whitespace between words
may include line breaks; surrounding quotes and parentheses are allowed.
Diagnostics highlight the phrase and terminal punctuation, excluding leading
whitespace and surrounding quotes. No automatic deletion or replacement is offered.

State the consequence directly:

- Before: `That distinction matters. Only owners can change the file.`
- After: `Only owners can change the file.`

Substantive uses remain valid, including `That distinction matters because only
owners can change the file.`, `This difference matters when access changes.`,
and `The distinction between read and write access determines who can change
the file.` Clauses continued with a comma, colon, or semicolon are also retained.
This is a bounded stock-phrase check, not a ban on these words.

Use the existing severity and suppression conventions, or allow only this family
while retaining the other scaffolding checks:

```ts
rules: {
  'no-rhetorical-scaffolding': ['warn', { allowImportanceAnnouncements: true }],
}
```

Set the rule to `'off'` to disable every family, or use a rule-specific comment
such as `// faircopy-ignore-next-line no-rhetorical-scaffolding` for an intentional
use. The CLI and downstream consumers use the same exported rule and registry.

---

### `no-non-inclusive-language`

Flags non-inclusive terms and suggests neutral alternatives.

```
error[no-non-inclusive-language]: replace "guys" with a neutral alternative such as "everyone, team, folks"
```

**Default terms:**

| Term | Suggested alternatives |
|---|---|
| `guys` | `everyone`, `team`, `folks` |
| `manpower` | `workforce`, `staffing`, `personnel` |
| `whitelist` | `allowlist` |
| `blacklist` | `denylist`, `blocklist` |
| `master` | `primary`, `main`, `leader` |
| `slave` | `secondary`, `replica`, `follower` |
| `crazy` | `unexpected`, `intense`, `extreme` |
| `insane` | `extreme`, `unbelievable`, `remarkable` |
| `dumb` | `unhelpful`, `poor`, `uninformed` |
| `lame` | `unimpressive`, `inadequate`, `weak` |
| `sanity check` | `quick check`, `confidence check`, `verification` |
| `blind spot` | `unaware area`, `gap`, `oversight` |
| `grandfathered` | `legacy status`, `exempted` |
| `mankind` | `humanity`, `humankind`, `people` |

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

Single-word terms always match with word boundaries, so `master` will not flag `masterpiece`. Default multi-word phrases such as `sanity check` and `blind spot` use `exact: true`, so `sanity checker` is not flagged. Set `exact: false` on a custom multi-word term to match it as a substring anywhere in the text.

`allowedTerms` is case-insensitive: adding `master` also permits `Master` or `MASTER`.

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

---

### `no-cliches`

Flags overused or clichéd phrases and suggests fresher alternatives.

Default phrases include:

| Phrase | Suggested alternatives |
|---|---|
| `world-class` | `top-tier`, `exceptional`, `outstanding` |
| `best-in-class` | `leading`, `top-performing`, `category-leading` |
| `cutting-edge` | `advanced`, `modern`, `latest` |
| `state-of-the-art` | `advanced`, `modern`, `sophisticated` |
| `game changer` | `breakthrough`, `transformation`, `major advance` |
| `think outside the box` | `be creative`, `innovate`, `find a new approach` |
| `at the end of the day` | `ultimately`, `finally`, `in summary` |
| `low-hanging fruit` | `easy wins`, `quick opportunities`, `simple targets` |
| `move the needle` | `make a measurable difference`, `drive results`, `create impact` |
| `circle back` | `follow up`, `reconnect`, `return to this` |
| `hit the ground running` | `start quickly`, `get started immediately`, `begin effectively` |
| `boil the ocean` | `take on too much`, `overcomplicate`, `lose focus` |
| `paradigm shift` | `fundamental change`, `new approach`, `transformation` |
| `next level` | `advanced`, `improved`, `elevated` |
| `seamless` | `smooth`, `effortless`, `frictionless` |
| `robust` | `strong`, `resilient`, `reliable` |
| `leverage` | `use`, `take advantage of`, `utilize` |
| `synergy` | `collaboration`, `combined effect`, `partnership` |

```
warn[no-cliches]: replace "world-class" with a fresher alternative such as "top-tier, exceptional, outstanding"
```

**Options:**

```ts
{
  phrases?: { phrase: string; alternatives: string[] }[]
  allow?: string[]
}
```

**Config example:**

```ts
rules: {
  'no-cliches': ['warn', {
    phrases: [
      { phrase: 'world-class', alternatives: ['top-tier', 'exceptional'] },
      { phrase: 'low-hanging fruit', alternatives: ['easy wins'] },
    ],
    allow: ['robust'],
  }],
}
```

---

### `no-passive-voice`

Flags likely passive-voice constructions using auxiliary + past participle patterns.

```
warn[no-passive-voice]: rewrite passive construction "was approved" with a named actor
```

Passive voice often hides the actor and adds drag. Prefer naming who did the action unless the actor genuinely does not matter.

**Options:**

```ts
{
  auxiliaries?: string[]  // Default: ['is', 'are', 'was', 'were', 'be', 'been', 'being']
  participles?: string[]  // Past participles to flag. Default is a curated list of common action participles.
  allowedPhrases?: string[] // Phrases to allow even if they match the passive pattern.
}
```

**Config example:**

```ts
rules: {
  'no-passive-voice': ['warn', {
    allowedPhrases: ['is licensed', 'was founded'],
  }],
}
```
