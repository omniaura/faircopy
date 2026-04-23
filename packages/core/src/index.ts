export type {
  FaircopyConfig,
  RuleConfig,
  Severity,
  Adapter,
  ExtractedText,
  OptionsSchema,
  Rule,
  RuleInput,
  Diagnostic,
  Suggestion,
} from './types.js'

export { loadConfig, ConfigError } from './config.js'
export type { LoadConfigResult } from './config.js'

export { resolveFiles } from './resolver.js'

export { lintFile, parseSeverity } from './runner.js'
export type { ResolvedRule } from './runner.js'
