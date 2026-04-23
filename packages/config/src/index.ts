export type {
  FaircopyConfig,
  RuleConfig,
  Severity,
  Adapter,
  ExtractedText,
  Rule,
  RuleInput,
  Diagnostic,
  Suggestion,
} from '@faircopy/core'

import type { FaircopyConfig } from '@faircopy/core'

/**
 * Identity function with full type inference. Modeled on Vite's defineConfig.
 * No runtime effect — purely for TypeScript completion on rule names and options.
 */
export function defineConfig(config: FaircopyConfig): FaircopyConfig {
  return config
}
