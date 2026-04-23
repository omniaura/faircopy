import path from 'node:path'
import type { Adapter, Diagnostic, Rule, RuleConfig, Severity } from './types.js'

export interface ResolvedRule {
  rule: Rule
  severity: Severity
  options: Record<string, unknown>
}

export function parseSeverity(config: RuleConfig): { severity: Severity; options: Record<string, unknown> } {
  if (typeof config === 'string') {
    return { severity: config, options: {} }
  }
  const [severity, options = {}] = config
  return { severity, options }
}

export async function lintFile(
  filePath: string,
  source: string,
  adapters: Adapter[],
  rules: ResolvedRule[]
): Promise<Diagnostic[]> {
  const ext = path.extname(filePath)
  const adapter = adapters.find(a => a.extensions.includes(ext))
  if (!adapter) return []

  const extractions = await adapter.extract(filePath, source)
  const diagnostics: Diagnostic[] = []

  for (const extraction of extractions) {
    for (const { rule, severity, options } of rules) {
      if (severity === 'off') continue
      const results = rule.check({
        text: extraction.text,
        sourceMap: extraction.sourceMap,
        filePath,
        options,
        meta: extraction.meta,
      })
      for (const diag of results) {
        diagnostics.push({ ...diag, severity })
      }
    }
  }

  return diagnostics
}
