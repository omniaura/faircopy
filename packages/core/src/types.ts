export interface FaircopyConfig {
  /** Globs of files to lint. Relative to the config file location. */
  files: string[]
  /** Globs to skip. Merged with .gitignore by default. */
  ignore?: string[]
  /** Registered adapters, in priority order. */
  adapters?: Adapter[]
  /** Optional rule packages to load so their rule IDs can be used bare. */
  rulesets?: string[]
  /** Rule severity and options. Key is `<package>/<rule>` or bare `<rule>`. */
  rules: Record<string, RuleConfig>
  /** Disable .gitignore integration. Default false. */
  noGitignore?: boolean
  /** Maximum concurrent file processing. Defaults to os.cpus().length. */
  concurrency?: number
  /** Output formatter defaults. CLI flags may override the selected format. */
  output?: FaircopyOutputConfig
}

export type RuleConfig =
  | Severity
  | [Severity, Record<string, unknown>]

export interface FaircopyOutputConfig {
  agentCompact?: AgentCompactConfig
}

export interface AgentCompactConfig {
  /**
   * Controls diagnostic snippets in agent-compact output.
   * `all` is most useful for grep/edit loops; `first` is leaner for repeated hits.
   */
  snippets?: AgentCompactSnippetMode
  /** Include byte-offset character ranges. Default false. */
  chars?: boolean
  /** Maximum normalized snippet length. Default 140. */
  snippetChars?: number
  /** Per-rule overrides keyed by rule id. */
  rules?: Record<string, AgentCompactRuleConfig>
}

export type AgentCompactSnippetMode = 'none' | 'first' | 'all'

export interface AgentCompactRuleConfig {
  snippets?: AgentCompactSnippetMode
  chars?: boolean
  snippetChars?: number
}

export type Severity = 'off' | 'warn' | 'error'

export interface Adapter {
  readonly name: string
  /** File extensions this adapter handles, including the dot (e.g. ".astro"). */
  readonly extensions: string[]
  /**
   * Extract prose segments from a source file.
   * Each segment carries a per-character source map back to the original file.
   */
  extract(filePath: string, source: string): Promise<ExtractedText[]>
}

export interface ExtractedText {
  /** The prose itself, with original whitespace preserved. */
  text: string
  /**
   * For each character index in `text`, the byte offset of that character
   * in the original source. Length must equal text.length.
   */
  sourceMap: number[]
  /** Free-form metadata the adapter wants to attach (e.g. element tag name). */
  meta?: Record<string, unknown>
}

/**
 * Structural type for rule options schemas.
 * Compatible with Zod schemas and anything with the same parse/safeParse shape.
 */
export interface OptionsSchema<Opts> {
  parse(data: unknown): Opts
  safeParse(data: unknown): { success: true; data: Opts } | { success: false; error: unknown }
}

export interface Rule<Opts = unknown> {
  readonly id: string
  readonly description: string
  /** Options schema — validated at config-load time. */
  readonly optionsSchema?: OptionsSchema<Opts>
  /** Default options applied when user provides severity only. */
  readonly defaults?: Opts
  /** Long help string, printed by `faircopy explain <rule-id>`. */
  readonly help?: string
  check(input: RuleInput<Opts>): Diagnostic[]
}

export interface RuleInput<Opts> {
  text: string
  sourceMap: number[]
  filePath: string
  options: Opts
  meta?: Record<string, unknown>
}

export interface Diagnostic {
  ruleId: string
  severity: Severity
  /** Short, imperative message. One line. */
  message: string
  /** Byte-offset range within the original source file. */
  range: { start: number; end: number }
  reason?: string
  help?: string
  suggest?: Suggestion
}

export interface Suggestion {
  description: string
  /** Non-overlapping edits to the original source, in order. */
  edits: { range: { start: number; end: number }; replacement: string }[]
}
