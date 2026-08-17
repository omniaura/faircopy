# @faircopy/rules-nlp

Optional NLP-powered ruleset for faircopy using `compromise`.

```sh
npm i -D @faircopy/rules-nlp
```

Load the ruleset once, then configure rules with bare rule IDs:

```ts
rulesets: ['@faircopy/rules-nlp'],
rules: {
  'no-absolute-intensifiers': 'warn',
  'no-adverb-overuse': 'warn',
  'no-expletive-openers': 'warn',
  'no-filter-words': 'warn',
  'no-future-promises': 'warn',
  'no-hedge-words': 'warn',
  'no-empty-transformation-claims': 'warn',
  'no-passive-voice': 'warn',
  'no-qualifier-creep': 'warn',
  'no-redundant-pairs': 'warn',
  'no-vague-comparatives': 'warn',
  'no-weak-modals': 'warn',
  'no-stacked-adjectives': 'warn',
  'no-nominalized-phrases': 'warn',
  'no-pronoun-led-claims': 'warn',
  'no-buzzword-stacks': 'warn',
  'no-complex-readability': 'warn',
  'no-overly-complex-sentences': 'warn',
  'no-vague-quantifiers': 'warn',
  'no-meaningless-modifiers': 'warn',
  'no-superlative-claims': 'warn',
}
```

Package-qualified IDs like `@faircopy/rules-nlp/no-passive-voice` still work and are required if another loaded ruleset exposes the same bare rule name.

## Rules

| Rule | Description |
|---|---|
| `no-absolute-intensifiers` | Flag intensifiers before absolute adjectives like `very unique` |
| `no-adverb-overuse` | Flag sentences with more than two adverbs ending in `-ly` |
| `no-empty-transformation-claims` | Flag broad transformation cliches like `transform the way teams work` |
| `no-expletive-openers` | Flag sentence openings like `There are` |
| `no-filter-words` | Ban filter phrases like `I think` and `it seems` |
| `no-future-promises` | Flag future-tense promises like `will help you` |
| `no-hedge-words` | Flag hedge words like `kind of` and `somewhat` |
| `no-jargon` | Flag business jargon like `leverage` and `circle back` |
| `no-passive-voice` | Flag likely passive-voice constructions |
| `no-qualifier-creep` | Flag stacked qualifiers or intensifiers like `very really good` |
| `no-redundant-pairs` | Flag redundant fixed phrases like `first and foremost` |
| `no-vague-comparatives` | Flag comparative claims that omit a clear baseline |
| `no-weak-modals` | Flag hedged modal claims like `can help` and `might improve` |
| `no-stacked-adjectives` | Flag noun phrases with multiple adjectives before the noun |
| `no-nominalized-phrases` | Flag nominalized `X of Y` phrases like `optimization of onboarding` |
| `no-pronoun-led-claims` | Flag vague sentence openers like `This helps` and `It enables` |
| `no-buzzword-stacks` | Flag sentences overloaded with abstract benefit nouns |
| `no-complex-readability` | Flag prose whose Flesch-Kincaid grade level exceeds a target |
| `no-overly-complex-sentences` | Flag sentences overloaded with coordinating or subordinating conjunctions |
| `no-vague-quantifiers` | Flag bare quantifiers without numeric anchors |
| `no-meaningless-modifiers` | Flag intensifiers like `very` and `obviously` that add no information |
| `no-superlative-claims` | Flag unproven superlatives like `best` and `world-class` |
| `sentence-complexity` | Flag sentences that exceed a word or clause threshold |

### `no-absolute-intensifiers`

Absolute adjectives already express an extreme, so intensifiers such as `very` are redundant.

```ts
rules: {
  'no-absolute-intensifiers': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `intensifiers` | `string[]` | `['very', 'really', 'completely', ...]` | Words or phrases to treat as intensifiers |
| `absolutes` | `string[]` | `['unique', 'finished', 'destroyed', ...]` | Absolute adjectives that should not be intensified |

Example:

```ts
'no-absolute-intensifiers': ['warn', {
  intensifiers: ['very', 'highly'],
  absolutes: ['unique', 'critical'],
}]
```

### `sentence-complexity`

Long, clause-heavy sentences are harder to read. This rule flags any sentence that exceeds a configurable word count or contains too many finite-verb clauses, and suggests splitting it into shorter sentences.

```ts
rules: {
  'sentence-complexity': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `maxWordCount` | `number` | `25` | Maximum words allowed per sentence |
| `maxClauseCount` | `number` | `3` | Maximum finite-verb clauses allowed per sentence |

Example with custom thresholds:

```ts
'sentence-complexity': ['warn', {
  maxWordCount: 20,
  maxClauseCount: 2,
}]
```

Flagged example:

```text
The engineer reviewed the requirements and wrote the code and ran the tests and deployed the application while the team watched and celebrated the release together.
```

Suggested fix: split the sentence around each independent clause.

```text
The engineer reviewed the requirements. They wrote the code, ran the tests, and deployed the application. The team watched and celebrated the release together.
```

### `no-overly-complex-sentences`

Sentences packed with conjunctions are often run-ons or nested too deeply. This rule flags any sentence that exceeds a configurable number of coordinating conjunctions, subordinating conjunctions, or total conjunctions.

```ts
rules: {
  'no-overly-complex-sentences': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `maxConjunctions` | `number` | `4` | Maximum total conjunctions allowed per sentence |
| `maxCoordinating` | `number` | `3` | Maximum coordinating conjunctions allowed per sentence |
| `maxSubordinating` | `number` | `2` | Maximum subordinating conjunctions allowed per sentence |
| `coordinating` | `string[]` | `['and', 'but', 'or', 'nor', 'yet', 'so']` | Words treated as coordinating conjunctions |
| `subordinating` | `string[]` | `['because', 'although', 'though', 'while', 'since', 'unless', 'if', 'when', 'after', 'before', 'until', 'whether', 'once']` | Words treated as subordinating conjunctions |
| `allowList` | `string[]` | `[]` | Words to ignore when counting |

Example with custom thresholds:

```ts
'no-overly-complex-sentences': ['warn', {
  maxConjunctions: 3,
  maxCoordinating: 2,
  maxSubordinating: 1,
}]
```

Flagged example:

```text
I ran and swam and biked and hiked and climbed.
```

Suggested fix: split the list into shorter sentences or use a bulleted list.

```text
I ran, swam, and biked. Then I hiked and climbed.
```

Some words, such as `since` or `so`, can be prepositions or adverbs in certain contexts. If the rule is too noisy for your copy, add the word to `allowList`.

### `no-vague-comparatives`

Comparative claims like `faster`, `easier`, or `more efficient` only persuade when the reader knows the baseline. This rule flags comparative adjectives and adverbs that are not paired with `than` in the same sentence.

```ts
rules: {
  'no-vague-comparatives': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `comparatives` | `string[]` | `['better', 'worse', 'more', 'less', 'faster', 'slower', 'easier', 'harder', 'stronger', 'weaker', 'higher', 'lower', 'bigger', 'smaller', 'greater']` | Comparative words or phrases that require a baseline |
| `requireThan` | `boolean` | `true` | Whether a `than` in the same sentence suppresses the diagnostic |

Example with custom settings:

```ts
'no-vague-comparatives': ['warn', {
  comparatives: ['superior', 'inferior', 'better'],
  requireThan: true,
}]
```

Flagged example:

```text
Our editor is faster. It is also easier to use.
```

Suggested fix: add a concrete baseline.

```text
Our editor is faster than the old one. It is also easier to use than a spreadsheet.
```

### `no-qualifier-creep`

Stacked qualifiers or intensifiers dilute a claim and make it sound hedged. This rule flags sequences of two or more qualifiers before an adjective or adverb.

```ts
rules: {
  'no-qualifier-creep': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `qualifiers` | `string[]` | `['very', 'really', 'quite', ...]` | Words treated as qualifiers or intensifiers |
| `maxQualifiers` | `number` | `1` | Maximum qualifiers allowed in a row before the excess are flagged |

Example with custom settings:

```ts
'no-qualifier-creep': ['warn', {
  qualifiers: ['very', 'really', 'quite'],
  maxQualifiers: 1,
}]
```

Flagged example:

```text
The result is very really quite good.
```

Suggested fix: keep the strongest qualifier or replace the phrase with concrete evidence.

```text
The result is excellent.
```
