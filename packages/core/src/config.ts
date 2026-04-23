import { createJiti } from 'jiti'
import path from 'node:path'
import type { FaircopyConfig } from './types.js'

const CANDIDATES = [
  'faircopy.config.ts',
  'faircopy.config.js',
  'faircopy.config.mjs',
  'faircopy.config.cjs',
]

export interface LoadConfigResult {
  config: FaircopyConfig
  configPath: string
}

export async function loadConfig(cwd: string = process.cwd()): Promise<LoadConfigResult> {
  for (const filename of CANDIDATES) {
    const configPath = path.resolve(cwd, filename)
    try {
      const jiti = createJiti(import.meta.url, { moduleCache: false })
      const mod = await jiti.import(configPath, { default: true }) as FaircopyConfig
      if (mod && typeof mod === 'object') {
        return { config: mod, configPath }
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code
      if (code !== 'MODULE_NOT_FOUND' && code !== 'ERR_MODULE_NOT_FOUND') {
        throw new ConfigError(`Failed to load ${configPath}:\n${(err as Error).message}`)
      }
    }
  }

  throw new ConfigError(
    `No faircopy config found in ${cwd}.\n` +
    `Expected one of: ${CANDIDATES.join(', ')}\n` +
    `Run \`faircopy init\` to scaffold one.`
  )
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}
