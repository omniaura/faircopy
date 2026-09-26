import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const cliPath = fileURLToPath(new URL('../dist/cli.js', import.meta.url))
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

test('--version prints the version from package.json', () => {
  const output = execFileSync(process.execPath, [cliPath, '--version'], { encoding: 'utf8' })
  // cac prints "<name>/<version> <platform>-<arch> node-<version>".
  assert.match(output, new RegExp(`^faircopy/${version.replaceAll('.', '\\.')} `))
})
