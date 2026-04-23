import { defineConfig } from '@faircopy/config'
import { astro } from '@faircopy/astro'

export default defineConfig({
  files: ['src/**/*.astro'],
  adapters: [astro()],
  rules: {
    'no-em-dash': 'error',
    'no-weasel-words': 'error',
    'no-rhetorical-scaffolding': 'error',
  },
})
