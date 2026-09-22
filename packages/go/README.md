# @faircopy/go

Go message adapter for [faircopy](https://github.com/omniaura/faircopy). It extracts static string arguments from configured Go function calls and maps every extracted character back to the source file.

## Install

```sh
npm i -D faircopy @faircopy/config @faircopy/go
```

## Usage

```ts
// faircopy.config.ts
import { defineConfig } from '@faircopy/config'
import { go } from '@faircopy/go'

export default defineConfig({
  files: ['**/*.go'],
  adapters: [
    go({
      calls: [
        { name: 'NewFactory', argumentIndex: 1 },
        { name: 'Errorf', argumentIndex: 0 },
      ],
    }),
  ],
  rules: {
    'no-em-dash': 'error',
  },
})
```

`name` matches the called function's final identifier, so package aliases work. `argumentIndex` is zero-based. A configured argument can be a double-quoted or raw Go string, or a literal format string passed to `fmt.Sprintf` (or another configured `formatFunctions` entry). Dynamic values, concatenations, comments, and unrelated strings are skipped. Numeric status arguments are ignored unless explicitly selected as message arguments.

```ts
go({
  calls: [{ name: 'NewFactory', argumentIndex: 1 }],
  formatFunctions: ['Sprintf'], // default
})
```
