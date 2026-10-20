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
  noExternal: ['@faircopy/core', '@faircopy/rules-default'],
})
