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
  const ignoredLines = collectIgnoredLines(source)
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
        const line = lineAtOffset(source, diag.range.start)
        const ignoredRules = ignoredLines.get(line)
        if (ignoredRules?.has('*') || ignoredRules?.has(diag.ruleId)) continue
        diagnostics.push({ ...diag, severity })
      }
    }
  }

  return diagnostics
}

function collectIgnoredLines(source: string): Map<number, Set<string>> {
  const ignored = new Map<number, Set<string>>()
  const lines = source.split(/\r?\n/)

  lines.forEach((line, index) => {
    const directive = line.match(
      /(?:\/\/|\/\*+|\*|<!--|\{\/\*)\s*faircopy-ignore-(line|next-line)(?:\s+([\w-]+(?:\s*,\s*[\w-]+)*))?/,
    )
    if (!directive) return

    const targetLine = index + (directive[1] === 'next-line' ? 2 : 1)
    const rules = directive[2]?.split(',').map(rule => rule.trim()) ?? ['*']
    const existing = ignored.get(targetLine) ?? new Set<string>()
    rules.forEach(rule => existing.add(rule))
    ignored.set(targetLine, existing)
  })

  return ignored
}

function lineAtOffset(source: string, offset: number): number {
  let line = 1
  for (let index = 0; index < offset; index++) {
    if (source[index] === '\n') line++
  }
  return line
}
