import type { Diagnostic, ResolvedRule, Rule, RuleConfig } from '@faircopy/core'
import { noEmDash } from '@faircopy/rules-default'

export const CHAT_PROFILE = 'chat-v1' as const

export interface ChatPhraseOptions {
  /** Exact phrases to allow, matched without case sensitivity. */
  allow?: string[]
  /** Additional literal phrases to flag with the rule's static guidance. */
  phrases?: string[]
}

function phraseRule(id: string, description: string, phrases: string[], help: string): Rule<ChatPhraseOptions> {
  return {
    id, description, help,
    check({ text, sourceMap, options }): Diagnostic[] {
      const allowed = new Set((options?.allow ?? []).map(phrase => phrase.toLowerCase()))
      const candidates = [...new Set([...phrases, ...options?.phrases ?? []])]
        .filter(phrase => phrase.trim() && !allowed.has(phrase.toLowerCase()))
      const diagnostics: Diagnostic[] = []
      for (const phrase of candidates) {
        // Literal phrases, Unicode word boundaries, and flexible whitespace.
        // Short common words such as "AI", "model" and "agent" are not rules.
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+').replace(/['’]/g, "['’]")
        const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'giu')
        for (const match of text.matchAll(pattern)) {
          diagnostics.push({
            ruleId: id, severity: 'warn', message: description, help,
            range: { start: sourceMap[match.index]!, end: sourceMap[match.index + match[0].length - 1]! + 1 },
          })
        }
      }
      return diagnostics
    },
  }
}

export const noFormalChatLanguage = phraseRule(
  'chat-no-formal-language', 'use everyday wording for a chat message',
  [
    'I hope this message finds you well', 'I hope this email finds you well',
    'I am writing to', 'I wanted to reach out', 'please be advised', 'please do not hesitate to',
    'at your earliest convenience', 'kindly send', 'kindly provide', 'kindly confirm',
    'kindly let me know', 'kindly advise', 'kindly note', 'kindly review', 'furthermore', 'moreover',
    'in conclusion', 'best regards', 'yours sincerely', 'pursuant to',
  ],
  'Say what you need directly. Keep the greeting and sign-off brief; use contractions if they fit. Fragments and optional final periods are fine.',
)

export const noAgentChatLanguage = phraseRule(
  'chat-no-agent-language', 'remove assistant framing and padded explanations',
  [
    'as an AI language model', 'as an AI assistant', 'as an AI,', 'as an AI I',
    'as a language model', 'as a large language model',
    'I can certainly assist', 'I would be happy to assist', "I'd be happy to assist", 'I am here to help',
    "I'm here to help", 'I have successfully', "it's important to note",
    'it is important to note', "it's worth noting", 'it is worth noting',
    'delve into', 'I will now proceed',
  ],
  'Use the sender\'s own voice. Remove boilerplate about assisting or completing tasks; keep the concrete fact or request. Do not conceal a relevant AI disclosure.',
)

export const noSalesChatLanguage = phraseRule(
  'chat-no-sales-language', 'replace sales slogans with a concrete detail',
  [
    'unlock your potential', 'game-changing', 'game changer', 'revolutionary solution',
    'revolutionize', 'unparalleled', 'seamless experience', 'cutting-edge solution',
    'take it to the next level', 'supercharge your',
  ],
  'Describe what changes or ask the specific question. Avoid pitch language in a personal message; preserve useful facts.',
)

export interface ChatProfile {
  id: string
  rules: ResolvedRule[]
}

/** A separate opt-in ruleset; this never registers or changes default rules. */
export function createChatProfile(
  overrides: Record<string, RuleConfig> = {},
  extraRules: Rule[] = [],
): ChatProfile {
  const registry = new Map<string, Rule>([
    [noEmDash.id, noEmDash as Rule],
    [noFormalChatLanguage.id, noFormalChatLanguage as Rule],
    [noAgentChatLanguage.id, noAgentChatLanguage as Rule],
    [noSalesChatLanguage.id, noSalesChatLanguage as Rule],
  ])
  for (const rule of extraRules) {
    if (registry.has(rule.id)) throw new TypeError('Duplicate chat rule ID')
    registry.set(rule.id, rule)
  }
  for (const id of Object.keys(overrides)) {
    if (!registry.has(id)) throw new TypeError('Unknown chat rule ID')
  }
  return {
    id: CHAT_PROFILE,
    rules: [...registry.values()].map(rule => {
      const config = overrides[rule.id] ?? 'warn'
      const [severity, options] = typeof config === 'string' ? [config, {}] : config
      if (!['off', 'warn', 'error'].includes(severity)) throw new TypeError('Invalid chat rule severity')
      return { rule, severity, options: { ...rule.defaults as object, ...options } }
    }),
  }
}

export const chatProfile = createChatProfile()
