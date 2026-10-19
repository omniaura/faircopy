import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import {
  loadConfig,
  loadConfigFile,
  resolveFiles,
  lintFileWithCoverage,
  parseSeverity,
  ConfigError,
  formatAgentCompact,
  offsetToLineCol,
} from '@faircopy/core'
import type { Diagnostic, FileCoverage, ResolvedRule } from '@faircopy/core'
import { formatPretty } from '../reporters/pretty.js'
import { loadRuleRegistries, resolveRuleInRegistries } from '../rule-loader.js'

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
  coverage: FileCoverage
}

export async function runLint(files: string[], options: LintOptions): Promise<void> {
  const cwd = process.cwd()
  const start = performance.now()

  let config: Awaited<ReturnType<typeof loadConfig>>['config']
  let configPath: string
  try {
    const loaded = options.config ? await loadConfigFile(options.config) : await loadConfig(cwd)
    config = loaded.config
    configPath = loaded.configPath
  } catch (err) {
    const msg = err instanceof ConfigError ? err.message : (err as Error).message
    process.stderr.write(`error: ${msg}\n`)
    process.exit(2)
    return
  }

  const filePaths = files.length > 0
    ? [...new Set(files.map(f => path.resolve(cwd, f)))]
    : await resolveFiles(config, path.dirname(configPath))

  const registries = await loadRuleRegistries(Object.keys(config.rules), config.rulesets)

  const resolvedRules: ResolvedRule[] = []
  for (const [ruleId, ruleConfig] of Object.entries(config.rules)) {
    const { severity, options: ruleOptions } = parseSeverity(ruleConfig)
    if (severity === 'off') continue
    const result = resolveRuleInRegistries(ruleId, registries)
    if (result.status === 'not-found') {
      process.stderr.write(`warn: unknown rule "${ruleId}" — skipped\n`)
      continue
    }
    if (result.status === 'ambiguous') {
      process.stderr.write(
        `warn: ambiguous rule "${ruleId}" found in ${result.packageNames.join(', ')} — use a package-qualified rule ID\n`
      )
      continue
    }
    resolvedRules.push({ rule: result.rule, severity, options: ruleOptions })
  }

  const adapters = config.adapters ?? []
  const results: FileResult[] = []
  let unsupported = 0

  for (const filePath of filePaths) {
    const source = await readFile(filePath, 'utf-8')
    const linted = await lintFileWithCoverage(filePath, source, adapters, resolvedRules)
    let diagnostics = linted.diagnostics
    if (!linted.coverage.adapter) {
      unsupported++
      process.stderr.write(`error: no adapter supports ${filePath}; register an adapter for ${path.extname(filePath) || '(no extension)'}\n`)
    } else if (linted.coverage.characters === 0) {
      process.stderr.write(`warn: no prose extracted from ${filePath} by ${linted.coverage.adapter}\n`)
    }
    if (options.quiet) {
      diagnostics = diagnostics.filter(d => d.severity === 'error')
    }
    results.push({ filePath, diagnostics, source, coverage: linted.coverage })
  }

  const inspected = results.filter(result => result.coverage.characters > 0).length
  const segments = results.reduce((sum, result) => sum + result.coverage.segments, 0)
  const characters = results.reduce((sum, result) => sum + result.coverage.characters, 0)
  const empty = results.length - unsupported - inspected
  // stderr keeps JSON diagnostics backwards compatible and compact/GitHub stdout
  // consumable. Every format, including --quiet, carries the same coverage proof.
  process.stderr.write(`faircopy coverage: matched=${filePaths.length} inspected=${inspected} segments=${segments} characters=${characters} unsupported=${unsupported} empty=${empty} rules=${resolvedRules.length}\n`)
  if (unsupported > 0 || inspected === 0) {
    if (inspected === 0) process.stderr.write('error: no prose inspected; check files, ignores, and registered adapters\n')
    process.exit(2)
    return
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
