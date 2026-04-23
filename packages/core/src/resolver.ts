import { globby } from 'globby'
import type { FaircopyConfig } from './types.js'

export async function resolveFiles(
  config: FaircopyConfig,
  cwd: string = process.cwd()
): Promise<string[]> {
  const files = await globby(config.files, {
    cwd,
    ignore: config.ignore ?? [],
    gitignore: !config.noGitignore,
    absolute: true,
    onlyFiles: true,
  })
  return files.sort()
}
