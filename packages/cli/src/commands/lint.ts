import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  loadConfig,
  resolveFiles,
  lintFile,
  parseSeverity,
  ConfigError,
  formatAgentCompact,
  offsetToLineCol,
} from '@faircopy/core'
import type { Diagnostic, ResolvedRule } from '@faircopy/core'
import { formatPretty } from '../reporters/pretty.js'
import { findRuleInRegistries, loadRuleRegistries } from '../rule-loader.js'

export interface LintOptions {
  config?: string
  format?: string
  quiet?: boolean
  maxWarnings?: string
  color?: boolean
}

export interface FileResult {
  filePath: string
  diagnostics: Diagnostic[]
  source: string
}

export async function runLint(files: string[], options: LintOptions): Promise<void> {
  const cwd = process.cwd()
  const start = performance.now()

  let config: Awaited<ReturnType<typeof loadConfig>>['config']
  try {
    const configCwd = options.config
      ? path.dirname(path.resolve(options.config))
      : cwd
    config = (await loadConfig(configCwd)).config
  } catch (err) {
    const msg = err instanceof ConfigError ? err.message : (err as Error).message
    process.stderr.write(`error: ${msg}\n`)
    process.exit(2)
  }

  const filePaths = files.length > 0
    ? files.map(f => path.resolve(cwd, f))
    : await resolveFiles(config, cwd)

  const registries = await loadRuleRegistries(Object.keys(config.rules))

  const resolvedRules: ResolvedRule[] = []
  for (const [ruleId, ruleConfig] of Object.entries(config.rules)) {
    const { severity, options: ruleOptions } = parseSeverity(ruleConfig)
    if (severity === 'off') continue
    const rule = findRuleInRegistries(ruleId, registries)
    if (!rule) {
      process.stderr.write(`warn: unknown rule "${ruleId}" — skipped\n`)
      continue
    }
    resolvedRules.push({ rule, severity, options: ruleOptions })
  }

  const adapters = config.adapters ?? []
  const results: FileResult[] = []

  for (const filePath of filePaths) {
    const source = await readFile(filePath, 'utf-8')
    let diagnostics = await lintFile(filePath, source, adapters, resolvedRules)
    if (options.quiet) {
      diagnostics = diagnostics.filter(d => d.severity === 'error')
    }
    results.push({ filePath, diagnostics, source })
  }

  const elapsed = Math.round(performance.now() - start)
  const fmt = options.format ?? 'pretty'

  if (fmt === 'json') {
    process.stdout.write(JSON.stringify(results.flatMap(r => r.diagnostics), null, 2) + '\n')
  } else if (fmt === 'github') {
    for (const { filePath, diagnostics, source } of results) {
      for (const d of diagnostics) {
        const { line, col } = offsetToLineCol(source, d.range.start)
        const level = d.severity === 'error' ? 'error' : 'warning'
        process.stdout.write(`::${level} file=${filePath},line=${line},col=${col}::${d.message}\n`)
      }
    }
  } else if (fmt === 'compact') {
    for (const { filePath, diagnostics, source } of results) {
      for (const d of diagnostics) {
        const { line, col } = offsetToLineCol(source, d.range.start)
        process.stdout.write(`${filePath}:${line}:${col} ${d.severity} [${d.ruleId}] ${d.message}\n`)
      }
    }
  } else if (fmt === 'agent-compact') {
    process.stdout.write(formatAgentCompact(results, { ...config.output?.agentCompact, includeFile: true }) + '\n')
  } else {
    process.stdout.write(formatPretty(results, elapsed) + '\n')
  }

  let errorCount = 0
  let warnCount = 0
  for (const { diagnostics } of results) {
    for (const d of diagnostics) {
      if (d.severity === 'error') errorCount++
      else if (d.severity === 'warn') warnCount++
    }
  }

  const maxWarnings = options.maxWarnings !== undefined ? Number(options.maxWarnings) : undefined
  if (errorCount > 0 || (maxWarnings !== undefined && warnCount > maxWarnings)) {
    process.exit(1)
  }
}
