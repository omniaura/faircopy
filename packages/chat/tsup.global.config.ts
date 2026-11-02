import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { review: 'src/runtime.ts' },
  format: 'iife',
  globalName: 'FaircopyChat',
  dts: false,
  sourcemap: false,
  clean: false,
  platform: 'browser',
  target: 'es2015',
  noExternal: ['@faircopy/core', '@faircopy/rules-default', '@faircopy/rules-nlp', 'compromise'],
  // compromise expects `self` and `console`; see src/embedded-globals.ts.
  inject: ['src/embedded-globals.ts'],
})
