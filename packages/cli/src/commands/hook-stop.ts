import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  loadConfig,
  resolveFiles,
  lintFile,
  parseSeverity,
  ConfigError,
} from '@faircopy/core'
import type { Diagnostic, ResolvedRule } from '@faircopy/core'
import { formatPretty } from '../reporters/pretty.js'

interface StopHookInput {
  session_id?: string
  transcript_path?: string
  cwd?: string
  hook_event_name?: string
  stop_hook_active?: boolean
}

interface BlockDecision {
  decision: 'block'
  reason: string
}

export async function runHookStop(): Promise<void> {
  // Read the Stop hook payload from stdin
  let payload: StopHookInput = {}
  try {
    const raw = await readStdin()
    if (raw.trim()) payload = JSON.parse(raw) as StopHookInput
  } catch {
    // Malformed input — run on all configured files as fallback
  }

  // Guard: if we're already in a forced-continuation from a previous block,
  // don't block again to avoid an infinite loop.
  if (payload.stop_hook_active) {
    process.exit(0)
  }

  const cwd = payload.cwd ?? process.cwd()

  // Load config
  let config: Awaited<ReturnType<typeof loadConfig>>['config']
  try {
    config = (await loadConfig(cwd)).config
  } catch (err) {
    if (err instanceof ConfigError) {
      // No faircopy config in this project — nothing to lint
      process.exit(0)
    }
    throw err
  }

  // Determine which files to lint: modified files from transcript, or all configured files
  const modifiedFiles = payload.transcript_path
    ? await extractModifiedFiles(payload.transcript_path)
    : []

  let filePaths: string[]
  if (modifiedFiles.length > 0) {
    // Filter to files that faircopy is configured to handle
    const configuredExts = (config.adapters ?? []).flatMap(a => a.extensions)
    filePaths = modifiedFiles.filter(f =>
      configuredExts.includes(path.extname(f)) &&
      matchesGlobs(f, config.files, cwd)
    )
  } else {
    filePaths = await resolveFiles(config, cwd)
  }

  if (filePaths.length === 0) {
    process.exit(0)
  }

  // Load rules
  let defaultRegistry: Map<string, import('@faircopy/core').Rule> = new Map()
  try {
    const mod = await import('@faircopy/rules-default') as { ruleRegistry: Map<string, import('@faircopy/core').Rule> }
    defaultRegistry = mod.ruleRegistry
  } catch {
    process.exit(0) // No rules installed — nothing to enforce
  }

  const resolvedRules: ResolvedRule[] = []
  for (const [ruleId, ruleConfig] of Object.entries(config.rules)) {
    const { severity, options } = parseSeverity(ruleConfig)
    if (severity === 'off') continue
    const rule = defaultRegistry.get(ruleId)
    if (rule) resolvedRules.push({ rule, severity, options })
  }

  if (resolvedRules.length === 0) {
    process.exit(0)
  }

  // Lint
  const adapters = config.adapters ?? []
  const results: { filePath: string; diagnostics: Diagnostic[]; source: string }[] = []
  let errorCount = 0

  for (const filePath of filePaths) {
    let source: string
    try {
      source = await readFile(filePath, 'utf-8')
    } catch {
      continue
    }
    const diagnostics = await lintFile(filePath, source, adapters, resolvedRules)
    const errors = diagnostics.filter(d => d.severity === 'error')
    if (errors.length > 0) {
      results.push({ filePath, diagnostics: errors, source })
      errorCount += errors.length
    }
  }

  if (errorCount === 0) {
    process.exit(0)
  }

  // Block: return JSON decision with formatted diagnostics as reason
  const prettyOutput = formatPretty(results, 0)
    .replace(/\x1b\[[0-9;]*m/g, '') // strip ANSI for the reason string

  const block: BlockDecision = {
    decision: 'block',
    reason: `faircopy found ${errorCount} error${errorCount === 1 ? '' : 's'}. Fix them before ending the turn.\n\n${prettyOutput}`,
  }

  process.stdout.write(JSON.stringify(block) + '\n')
  process.exit(0)
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

async function extractModifiedFiles(transcriptPath: string): Promise<string[]> {
  const files = new Set<string>()
  try {
    const content = await readFile(transcriptPath, 'utf-8')
    for (const line of content.trim().split('\n')) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>
        // Transcript lines can be messages with content arrays containing tool_use items
        const contentItems = getContentItems(entry)
        for (const item of contentItems) {
          if (!item || typeof item !== 'object') continue
          const { type, name, input } = item as { type?: string; name?: string; input?: Record<string, unknown> }
          if (type !== 'tool_use' || !input) continue
          if (name === 'Write' || name === 'Edit') {
            if (typeof input['file_path'] === 'string') files.add(input['file_path'])
          }
          if (name === 'MultiEdit' && Array.isArray(input['edits'])) {
            for (const edit of input['edits'] as Array<Record<string, unknown>>) {
              if (typeof edit['file_path'] === 'string') files.add(edit['file_path'])
            }
          }
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Transcript unreadable
  }
  return [...files]
}

function getContentItems(entry: Record<string, unknown>): unknown[] {
  // Handle: { content: [...] } or { message: { content: [...] } }
  const direct = entry['content']
  if (Array.isArray(direct)) return direct
  const msg = entry['message']
  if (msg && typeof msg === 'object') {
    const nested = (msg as Record<string, unknown>)['content']
    if (Array.isArray(nested)) return nested
  }
  return []
}

function matchesGlobs(filePath: string, globs: string[], cwd: string): boolean {
  // Simple extension-based check; full glob matching is handled by resolveFiles
  // Here we just verify the file is under cwd and not obviously excluded
  try {
    const rel = path.relative(cwd, filePath)
    return !rel.startsWith('..') && !rel.startsWith('node_modules')
  } catch {
    return false
  }
}
