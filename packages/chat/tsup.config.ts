import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
  format: 'esm',
  dts: true,
  sourcemap: true,
  clean: true,
  platform: 'node',
  target: 'node20',
  // The executable can be copied with its package, without installing a service
  // or resolving workspace dependencies at review time.
  noExternal: ['@faircopy/core', '@faircopy/rules-default'],
  splitting: false,
})
