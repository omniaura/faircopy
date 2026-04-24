import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { cli: 'src/cli.ts' },
    format: 'esm',
    dts: false,
    sourcemap: true,
    clean: true,
    platform: 'node',
    target: 'node20',
    banner: { js: '#!/usr/bin/env node' },
    external: ['@faircopy/core', '@faircopy/rules-default'],
    noExternal: ['cac', 'picocolors'],
  },
  {
    entry: { index: 'src/index.ts' },
    format: 'esm',
    dts: true,
    sourcemap: true,
    platform: 'node',
    target: 'node20',
    external: ['@faircopy/core', '@faircopy/rules-default'],
  },
])
