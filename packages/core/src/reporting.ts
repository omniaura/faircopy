import type {
  AgentCompactConfig,
  AgentCompactSnippetMode,
  Diagnostic,
  Severity,
} from './types.js'

export interface ReportFileResult {
  filePath?: string
  diagnostics: Diagnostic[]
  source: string
}

export interface DiagnosticReportItem extends Diagnostic {
  filePath?: string
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  snippet: string
}

export interface AgentJsonPayload {
  tool: 'faircopy'
  errorCount: number
  warningCount: number
  issueCount: number
  errors: Array<{
    filePath?: string
    ruleId: string
    severity: Severity
    message: string
    help: string | null
    start: number
    end: number
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
    snippet: string
  }>
}

export interface AgentCompactFormatOptions extends AgentCompactConfig {
  includeFile?: boolean
}

export function formatAgentCompact(
  results: ReportFileResult[],
  options: AgentCompactFormatOptions = {}
): string {
  const items = collectDiagnosticReportItems(results)
  if (items.length === 0) return 'faircopy errors=0 warnings=0'

  const grouped = new Map<string, DiagnosticReportItem[]>()
  for (const item of items) {
    if (!grouped.has(item.ruleId)) grouped.set(item.ruleId, [])
    grouped.get(item.ruleId)?.push(item)
  }

  const errorCount = items.filter(item => item.severity === 'error').length
  const warnCount = items.filter(item => item.severity === 'warn').length
  const lines = [`faircopy errors=${errorCount} warnings=${warnCount} rules=${grouped.size}`]

  for (const [ruleId, ruleItems] of grouped.entries()) {
    lines.push(`rule=${ruleId} count=${ruleItems.length} severity=${ruleItems[0]?.severity ?? 'error'}`)
    ruleItems.forEach((item, index) => {
      lines.push(formatAgentCompactLocation(item, index, options))
      if (index === 0) {
        lines.push(`  msg=${item.message}`)
        if (item.help) lines.push(`  help=${item.help}`)
      }
    })
  }

  return lines.join('\n')
}

export function buildAgentJsonPayload(results: ReportFileResult[]): AgentJsonPayload {
  const items = collectDiagnosticReportItems(results)
  return {
    tool: 'faircopy',
    errorCount: items.filter(item => item.severity === 'error').length,
    warningCount: items.filter(item => item.severity === 'warn').length,
    issueCount: items.length,
    errors: items.map(item => ({
      filePath: item.filePath,
      ruleId: item.ruleId,
      severity: item.severity,
      message: item.message,
      help: item.help ?? null,
      start: item.range.start,
      end: item.range.end,
      startLine: item.startLine,
      startColumn: item.startColumn,
      endLine: item.endLine,
      endColumn: item.endColumn,
      snippet: item.snippet,
    })),
  }
}

export function collectDiagnosticReportItems(results: ReportFileResult[]): DiagnosticReportItem[] {
  return results.flatMap(result =>
    result.diagnostics.map(diagnostic => {
      const start = offsetToLineCol(result.source, diagnostic.range.start)
      const endOffset = Math.max(diagnostic.range.start, diagnostic.range.end - 1)
      const end = offsetToLineCol(result.source, endOffset)
      return {
        ...diagnostic,
        filePath: result.filePath,
        startLine: start.line,
        startColumn: start.col,
        endLine: end.line,
        endColumn: end.col,
        snippet: collapseWhitespace(result.source.slice(diagnostic.range.start, diagnostic.range.end)) || '(empty span)',
      }
    })
  )
}

export function offsetToLineCol(source: string, offset: number): { line: number; col: number } {
  const before = source.slice(0, offset)
  const linesBefore = before.split('\n')
  return { line: linesBefore.length, col: (linesBefore.at(-1) ?? '').length + 1 }
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function truncate(value: string, max = 180): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3).trimEnd()}...`
}

function formatAgentCompactLocation(
  item: DiagnosticReportItem,
  index: number,
  options: AgentCompactFormatOptions
): string {
  const linePrefix = options.includeFile && item.filePath
    ? `${item.filePath}:${item.startLine}:${item.startColumn}-${item.endLine}:${item.endColumn}`
    : `${item.startLine}:${item.startColumn}-${item.endLine}:${item.endColumn}`
  let line = `  at=${linePrefix}`
  if (shouldPrintChars(item.ruleId, options)) line += ` chars=${item.range.start}..${item.range.end}`
  const snippetMode = getRuleSnippetMode(item.ruleId, options)
  if (shouldPrintSnippet(snippetMode, index)) {
    line += ` span=${JSON.stringify(resizeSnippet(item.snippet, item.ruleId, options))}`
  }
  return line
}

function getRuleSnippetMode(ruleId: string, options: AgentCompactFormatOptions): AgentCompactSnippetMode {
  return options.rules?.[ruleId]?.snippets ?? options.snippets ?? 'all'
}

function shouldPrintSnippet(mode: AgentCompactSnippetMode, index: number): boolean {
  if (mode === 'none') return false
  if (mode === 'first') return index === 0
  return true
}

function shouldPrintChars(ruleId: string, options: AgentCompactFormatOptions): boolean {
  return options.rules?.[ruleId]?.chars ?? options.chars ?? false
}

function resizeSnippet(snippet: string, ruleId: string, options: AgentCompactFormatOptions): string {
  const max = options.rules?.[ruleId]?.snippetChars ?? options.snippetChars ?? 140
  return truncate(snippet, max)
}
