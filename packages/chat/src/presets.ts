import type { ResolvedRule, Rule, RuleConfig } from '@faircopy/core'
import { RULE_CATALOG, presentedAs } from './rules.js'

/** The writing contexts a caller can name. `general` is the default. */
export const REVIEW_CONTEXTS = Object.freeze(['general', 'chat', 'email'] as const)
export type ReviewContext = typeof REVIEW_CONTEXTS[number]
export const DEFAULT_REVIEW_CONTEXT: ReviewContext = 'general'

/** How a preset uses a catalog rule. A severity or `[severity, options]` uses
 * the catalog rule whose ID is the table key. The object form reports the
 * catalog rule named by `rule` under the table key, with this preset's own
 * message and help; omitted fields keep the catalog rule's wording and `warn`.
 */
export type PresetRuleEntry = RuleConfig | {
  readonly rule: string
  readonly config?: RuleConfig
  readonly message?: string
  readonly help?: string
}

/** A preset is data: an ID, the context it serves, a one-line summary for
 * agents and a rule table keyed by the rule IDs it reports. No code, regexes
 * or imports. Adding or revising a preset means adding an entry here (and a
 * new ID when the policy changes incompatibly); nothing new is published.
 */
export interface ReviewPreset {
  readonly id: string
  readonly context: ReviewContext
  readonly summary: string
  readonly rules: Readonly<Record<string, PresetRuleEntry>>
}

const PRESET_DATA: ReviewPreset[] = [
  {
    id: 'general-v1',
    context: 'general',
    summary: 'Documents, website copy and other general writing. Formal wording, headings and domain terms are fine; flags em dashes, assistant boilerplate, sales slogans and "X is Y, not Z" scaffolding.',
    rules: {
      'no-em-dash': 'warn',
      'no-assistant-framing': { rule: 'assistant-phrases' },
      'no-sales-slogans': { rule: 'sales-phrases' },
      'no-rhetorical-scaffolding': 'warn',
    },
  },
  {
    id: 'chat-v1',
    context: 'chat',
    summary: 'Everyday informal chat. Fragments, contractions, lowercase, emoji and optional final periods are fine; flags em dashes and formal, assistant-like or sales language.',
    rules: {
      'no-em-dash': 'warn',
      'chat-no-formal-language': {
        rule: 'formal-phrases',
        message: 'use everyday wording for a chat message',
        help: 'Say what you need directly. Keep the greeting and sign-off brief; use contractions if they fit. Fragments and optional final periods are fine.',
      },
      'chat-no-agent-language': {
        rule: 'assistant-phrases',
        message: 'remove assistant framing and padded explanations',
        help: 'Use the sender\'s own voice. Remove boilerplate about assisting or completing tasks; keep the concrete fact or request. Do not conceal a relevant AI disclosure.',
      },
      'chat-no-sales-language': {
        rule: 'sales-phrases',
        message: 'replace sales slogans with a concrete detail',
        help: 'Describe what changes or ask the specific question. Avoid pitch language in a personal message; preserve useful facts.',
      },
    },
  },
  {
    id: 'email-v1',
    context: 'email',
    summary: 'Email. Professional greetings, sign-offs and formal requests are fine; flags em dashes, assistant boilerplate, sales slogans and "X is Y, not Z" scaffolding.',
    rules: {
      'no-em-dash': 'warn',
      'no-assistant-framing': { rule: 'assistant-phrases' },
      'no-sales-slogans': { rule: 'sales-phrases' },
      'no-rhetorical-scaffolding': 'warn',
    },
  },
]

export const REVIEW_PRESETS: readonly ReviewPreset[] = Object.freeze(
  PRESET_DATA.map(preset => Object.freeze({
    ...preset,
    rules: Object.freeze(Object.fromEntries(Object.entries(preset.rules).map(([id, entry]) => [id, Object.freeze(entry) as PresetRuleEntry]))),
  })),
)

/** The preset each context uses when the caller names only a context. */
export const CONTEXT_PRESETS: Readonly<Record<ReviewContext, string>> = Object.freeze({
  general: 'general-v1',
  chat: 'chat-v1',
  email: 'email-v1',
})

export interface ReviewProfile {
  id: string
  /** Built-in presets always set this. Programmatic profiles may omit it. */
  context?: ReviewContext
  rules: ResolvedRule[]
}

export function isReviewContext(value: unknown): value is ReviewContext {
  return typeof value === 'string' && (REVIEW_CONTEXTS as readonly string[]).includes(value)
}

/** The configured severity of a preset entry, for catalogs shown to agents. */
export function presetEntrySeverity(entry: PresetRuleEntry): string {
  if (typeof entry === 'string') return entry
  if (Array.isArray(entry)) return entry[0]
  const { config = 'warn' } = entry as Exclude<PresetRuleEntry, RuleConfig>
  return typeof config === 'string' ? config : config[0]
}

function resolveEntry(id: string, entry: PresetRuleEntry): [Rule, RuleConfig] {
  if (typeof entry === 'string' || Array.isArray(entry)) {
    const rule = RULE_CATALOG.get(id)
    if (!rule) throw new TypeError('Preset names an unknown rule ID')
    return [rule, entry as RuleConfig]
  }
  const { rule: catalogID, config = 'warn', message, help } = entry as Exclude<PresetRuleEntry, RuleConfig>
  const rule = RULE_CATALOG.get(catalogID)
  if (!rule) throw new TypeError('Preset names an unknown rule ID')
  return [presentedAs(rule, id, message ?? rule.description, help ?? rule.help ?? ''), config]
}

export function getPreset(id: string): ReviewPreset | undefined {
  return REVIEW_PRESETS.find(preset => preset.id === id)
}

/** Resolve a preset (by ID) into a runnable profile. Overrides may change the
 * severity or options of a rule the preset names, or of an extra rule.
 */
export function createPresetProfile(
  presetId: string,
  overrides: Record<string, RuleConfig> = {},
  extraRules: Rule[] = [],
): ReviewProfile {
  const preset = getPreset(presetId)
  if (!preset) throw new TypeError('Unknown Fair Copy preset')
  const selected = new Map<string, [Rule, RuleConfig]>()
  for (const [id, entry] of Object.entries(preset.rules)) selected.set(id, resolveEntry(id, entry))
  for (const rule of extraRules) {
    if (selected.has(rule.id)) throw new TypeError('Duplicate rule ID')
    selected.set(rule.id, [rule, 'warn'])
  }
  for (const id of Object.keys(overrides)) {
    if (!selected.has(id)) throw new TypeError('Unknown rule ID for this preset')
  }
  return {
    id: preset.id,
    context: preset.context,
    rules: [...selected.values()].map(([rule, base]) => {
      const config = overrides[rule.id] ?? base
      const [severity, options] = typeof config === 'string' ? [config, {}] : config
      if (!['off', 'warn', 'error'].includes(severity)) throw new TypeError('Invalid rule severity')
      return { rule, severity, options: { ...rule.defaults as object, ...options } }
    }),
  }
}

/** Every built-in preset, resolved once. */
export const PRESET_PROFILES: ReadonlyMap<string, ReviewProfile> = new Map(
  REVIEW_PRESETS.map(preset => [preset.id, createPresetProfile(preset.id)]),
)
