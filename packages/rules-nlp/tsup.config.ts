import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: 'esm',
  dts: true,
  sourcemap: true,
  clean: true,
  platform: 'neutral',
  target: 'es2020',
  external: ['@faircopy/core', 'compromise'],
})
