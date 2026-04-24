export type {
  FaircopyConfig,
  FaircopyOutputConfig,
  AgentCompactConfig,
  AgentCompactSnippetMode,
  AgentCompactRuleConfig,
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

export { loadConfig, ConfigError, defineConfig } from './config.js'
export type { LoadConfigResult } from './config.js'

export { resolveFiles } from './resolver.js'

export { lintFile, parseSeverity } from './runner.js'
export type { ResolvedRule } from './runner.js'

export {
  buildAgentJsonPayload,
  collapseWhitespace,
  collectDiagnosticReportItems,
  formatAgentCompact,
  offsetToLineCol,
  truncate,
} from './reporting.js'
export type {
  AgentCompactFormatOptions,
  AgentJsonPayload,
  DiagnosticReportItem,
  ReportFileResult,
} from './reporting.js'
