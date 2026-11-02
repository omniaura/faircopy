import type { Rule, RuleConfig } from '@faircopy/core'
import { createPresetProfile } from './presets.js'
import type { ReviewProfile } from './presets.js'

export { noFormalChatLanguage, noAgentChatLanguage, noSalesChatLanguage } from './rules.js'
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
