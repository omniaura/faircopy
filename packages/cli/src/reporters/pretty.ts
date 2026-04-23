import pc from 'picocolors'
import type { Diagnostic } from '@faircopy/core'
import type { FileResult } from '../commands/lint.js'

export function formatPretty(results: FileResult[], elapsedMs: number): string {
  const lines: string[] = []
  let errorCount = 0
  let warnCount = 0
  let filesWithIssues = 0

  for (const { filePath, diagnostics, source } of results) {
    if (diagnostics.length === 0) continue
    filesWithIssues++
    for (const diag of diagnostics) {
      if (diag.severity === 'error') errorCount++
      else if (diag.severity === 'warn') warnCount++
      lines.push(...renderDiagnostic(diag, filePath, source))
    }
  }

  lines.push(renderFooter(errorCount, warnCount, filesWithIssues, elapsedMs))
  return lines.join('\n')
}

function renderDiagnostic(diag: Diagnostic, filePath: string, source: string): string[] {
  const lines: string[] = []
  const { line, col } = offsetToLineCol(source, diag.range.start)
  const { col: endCol } = offsetToLineCol(source, diag.range.end)
  const sourceLine = source.split('\n')[line - 1] ?? ''

  const color = diag.severity === 'error' ? pc.red : pc.yellow
  const label = diag.severity === 'error' ? 'error' : 'warn'

  lines.push(`${color(`${label}[${diag.ruleId}]`)}: ${pc.bold(diag.message)}`)
  lines.push(`  ${pc.cyan('┌─')} ${pc.dim(filePath)}:${line}:${col}`)
  lines.push(`  ${pc.cyan('│')}`)

  const lineNum = String(line).padStart(3)
  lines.push(`${lineNum} ${pc.cyan('│')}   ${sourceLine}`)

  const caretStart = col - 1
  const caretLen = Math.max(1, endCol - col)
  lines.push(`  ${pc.cyan('│')}   ${' '.repeat(caretStart + 6)}${color('^'.repeat(caretLen))}`)
  lines.push(`  ${pc.cyan('│')}`)

  if (diag.help) {
    lines.push(`  ${pc.cyan('=')} ${pc.dim('help:')} ${diag.help}`)
  }
  if (diag.suggest) {
    lines.push(`  ${pc.cyan('=')} ${pc.dim('suggestion:')} ${diag.suggest.description}`)
  }
  lines.push('')

  return lines
}

function offsetToLineCol(source: string, offset: number): { line: number; col: number } {
  const before = source.slice(0, offset)
  const linesBefore = before.split('\n')
  return { line: linesBefore.length, col: (linesBefore.at(-1) ?? '').length + 1 }
}

function renderFooter(errors: number, warns: number, files: number, ms: number): string {
  if (errors === 0 && warns === 0) {
    return pc.green(`✓ No issues found. (ran in ${ms}ms)`)
  }
  const parts: string[] = []
  if (errors > 0) parts.push(pc.red(`${errors} ${errors === 1 ? 'error' : 'errors'}`))
  if (warns > 0) parts.push(pc.yellow(`${warns} ${warns === 1 ? 'warning' : 'warnings'}`))
  const fileLabel = `${files} ${files === 1 ? 'file' : 'files'}`
  return `✖ ${parts.join(', ')} across ${fileLabel}. (ran in ${ms}ms)`
}
