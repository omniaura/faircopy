import type { Rule, RuleConfig } from '@faircopy/core'
import { createPresetProfile } from './presets.js'
import type { ReviewProfile } from './presets.js'
import type { ChatPhraseOptions } from './rules.js'

export type { ChatPhraseOptions } from './rules.js'

export const CHAT_PROFILE = 'chat-v1' as const

/** Kept for existing imports; every preset now resolves to this shape. */
export type ChatProfile = ReviewProfile

/** The chat-v1 preset with optional overrides. Equivalent to
 * `createPresetProfile('chat-v1', overrides, extraRules)`; this never
 * registers or changes default rules.
 */
export function createChatProfile(
  overrides: Record<string, RuleConfig> = {},
  extraRules: Rule[] = [],
): ChatProfile {
  return createPresetProfile(CHAT_PROFILE, overrides, extraRules)
}

export const chatProfile = createChatProfile()

function chatRule(id: string): Rule<ChatPhraseOptions> {
  const resolved = chatProfile.rules.find(({ rule }) => rule.id === id)
  if (!resolved) throw new TypeError('chat-v1 lacks a released rule')
  return resolved.rule as Rule<ChatPhraseOptions>
}

/** The released chat-v1 rule objects, kept for existing imports. Each is the
 * shared phrase rule as chat-v1 presents it; the wording lives in presets.ts.
 */
export const noFormalChatLanguage = chatRule('chat-no-formal-language')
export const noAgentChatLanguage = chatRule('chat-no-agent-language')
export const noSalesChatLanguage = chatRule('chat-no-sales-language')
