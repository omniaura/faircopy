import { access } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
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

    // Skip silently if the file doesn't exist
    try {
      await access(configPath)
    } catch {
      continue
    }

    return loadConfigFile(configPath)
  }

  throw new ConfigError(
    `No faircopy config found in ${cwd}.\n` +
    `Expected one of: ${CANDIDATES.join(', ')}\n` +
    `Run \`faircopy init\` to scaffold one.`
  )
}

/** Load the exact requested file, with imports resolved relative to it. */
export async function loadConfigFile(filename: string): Promise<LoadConfigResult> {
  const configPath = path.resolve(filename)
  try {
    const jiti = createJiti(pathToFileURL(configPath).href, { moduleCache: false })
    const mod = await jiti.import(configPath, { default: true }) as FaircopyConfig
    if (mod && typeof mod === 'object') return { config: mod, configPath }
    throw new ConfigError(`${configPath} has no default export`)
  } catch (err) {
    if (err instanceof ConfigError) throw err
    throw new ConfigError(`Failed to load ${configPath}:\n${(err as Error).message}`)
  }
}

/** Identity function for TypeScript inference. Same as @faircopy/config's defineConfig. */
export function defineConfig(config: FaircopyConfig): FaircopyConfig {
  return config
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}
