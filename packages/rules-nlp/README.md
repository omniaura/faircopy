# @faircopy/rules-nlp

Optional NLP-powered ruleset for faircopy using `compromise`.

```sh
npm i -D @faircopy/rules-nlp
```

Load the ruleset once, then configure rules with bare rule IDs:

```ts
rulesets: ['@faircopy/rules-nlp'],
rules: {
  'no-filter-words': 'warn',
  'no-empty-transformation-claims': 'warn',
  'no-passive-voice': 'warn',
  'no-weak-modals': 'warn',
  'no-stacked-adjectives': 'warn',
  'no-nominalized-phrases': 'warn',
}
```

Package-qualified IDs like `@faircopy/rules-nlp/no-passive-voice` still work and are required if another loaded ruleset exposes the same bare rule name.

## Rules

| Rule | Description |
|---|---|
| `no-empty-transformation-claims` | Flag broad transformation cliches like `transform the way teams work` |
| `no-filter-words` | Ban filter phrases like `I think` and `it seems` |
| `no-passive-voice` | Flag likely passive-voice constructions |
| `no-weak-modals` | Flag hedged modal claims like `can help` and `might improve` |
| `no-stacked-adjectives` | Flag noun phrases with multiple adjectives before the noun |
| `no-nominalized-phrases` | Flag nominalized `X of Y` phrases like `optimization of onboarding` |
