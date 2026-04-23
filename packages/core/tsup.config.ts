import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: 'esm',
  dts: true,
  sourcemap: true,
  clean: true,
  platform: 'node',
  target: 'node20',
})
