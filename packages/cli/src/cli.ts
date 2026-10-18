import { createRequire } from 'node:module'
import { cac } from 'cac'
import { runLint } from './commands/lint.js'
import { runHookStop } from './commands/hook-stop.js'

// Read the version from this package's own manifest at runtime, so it tracks
// the lockstep release version instead of a hard-coded string. Both src/ and
// dist/ sit one level below package.json, which npm always ships.
const { version } = createRequire(import.meta.url)('../package.json') as { version: string }

const cli = cac('faircopy')

cli
  .command('lint [...files]', 'Lint files or configured globs')
  .option('-c, --config <path>', 'Explicit config file path')
  .option('--format <name>', 'Output format: pretty | json | github | compact | agent-compact', { default: 'pretty' })
  .option('--quiet', 'Suppress warnings; only errors')
  .option('--max-warnings <n>', 'Exit 1 if warnings exceed n')
  .option('--no-color', 'Disable ANSI colors')
  .action(runLint)

cli
  .command('hook-stop', 'Claude Code Stop hook — blocks the turn if lint errors are found')
  .action(runHookStop)

cli.version(version)
cli.help()

cli.parse()
