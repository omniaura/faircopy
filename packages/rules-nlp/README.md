# @faircopy/rules-nlp

Optional NLP-powered ruleset for faircopy using `compromise`.

```sh
npm i -D @faircopy/rules-nlp
```

Configure rules with the package-qualified rule ID:

```ts
rules: {
  '@faircopy/rules-nlp/no-passive-voice': 'warn',
  '@faircopy/rules-nlp/no-weak-modals': 'warn',
  '@faircopy/rules-nlp/no-stacked-adjectives': 'warn',
  '@faircopy/rules-nlp/no-nominalized-phrases': 'warn',
}
```

## Rules

| Rule | Description |
|---|---|
| `no-filter-words` | Ban filter phrases like `I think` and `it seems` |
| `no-passive-voice` | Flag likely passive-voice constructions |
| `no-weak-modals` | Flag hedged modal claims like `can help` and `might improve` |
| `no-stacked-adjectives` | Flag noun phrases with multiple adjectives before the noun |
| `no-nominalized-phrases` | Flag nominalized `X of Y` phrases like `optimization of onboarding` |
