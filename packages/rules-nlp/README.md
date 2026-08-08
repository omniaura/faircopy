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
  'no-redundant-pairs': 'warn',
  'no-weak-modals': 'warn',
  'no-stacked-adjectives': 'warn',
  'no-nominalized-phrases': 'warn',
  'no-pronoun-led-claims': 'warn',
  'no-buzzword-stacks': 'warn',
  'no-complex-readability': 'warn',
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
| `no-redundant-pairs` | Flag redundant fixed phrases like `first and foremost` |
| `no-weak-modals` | Flag hedged modal claims like `can help` and `might improve` |
| `no-stacked-adjectives` | Flag noun phrases with multiple adjectives before the noun |
| `no-nominalized-phrases` | Flag nominalized `X of Y` phrases like `optimization of onboarding` |
| `no-pronoun-led-claims` | Flag vague sentence openers like `This helps` and `It enables` |
| `no-buzzword-stacks` | Flag sentences overloaded with abstract benefit nouns |
| `no-complex-readability` | Flag prose whose Flesch-Kincaid grade level exceeds a target |
| `no-vague-quantifiers` | Flag bare quantifiers without numeric anchors |
| `no-meaningless-modifiers` | Flag intensifiers like `very` and `obviously` that add no information |
| `no-superlative-claims` | Flag unproven superlatives like `best` and `world-class` |

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

### `no-adverb-overuse`

Sentences stacked with `-ly` adverbs feel padded. This rule flags each adverb past the configured threshold so you can replace it with a stronger verb or adjective.

```ts
rules: {
  'no-adverb-overuse': 'warn',
}
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `maxAdverbs` | `number` | `2` | Maximum `-ly` adverbs allowed per sentence before the rest are flagged |
| `allowedAdverbs` | `string[]` | `['only']` | Adverbs to ignore entirely |

Example:

```ts
'no-adverb-overuse': ['warn', {
  maxAdverbs: 3,
  allowedAdverbs: ['only', 'truly'],
}]
```
