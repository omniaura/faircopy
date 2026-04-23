import { cac } from 'cac'
import { runLint } from './commands/lint.js'
import { runHookStop } from './commands/hook-stop.js'

const cli = cac('faircopy')

cli
  .command('lint [...files]', 'Lint files or configured globs')
  .option('-c, --config <path>', 'Explicit config file path')
  .option('--format <name>', 'Output format: pretty | json | github | compact', { default: 'pretty' })
  .option('--quiet', 'Suppress warnings; only errors')
  .option('--max-warnings <n>', 'Exit 1 if warnings exceed n')
  .option('--no-color', 'Disable ANSI colors')
  .action(runLint)

cli
  .command('hook-stop', 'Claude Code Stop hook — blocks the turn if lint errors are found')
  .action(runHookStop)

cli.version('0.1.0')
cli.help()

cli.parse()
