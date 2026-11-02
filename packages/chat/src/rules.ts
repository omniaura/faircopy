import type { Diagnostic, Rule } from '@faircopy/core'
import { noCliches, noEmDash, noFillerWords, noRhetoricalScaffolding, noWeaselWords } from '@faircopy/rules-default'
import { noHedgeWords, noLlmSpeak, noNThings } from '@faircopy/rules-nlp'

/** Code half of the preset system: every rule a preset may name by ID.
 * Presets themselves are plain data in presets.ts.
 */

export interface ChatPhraseOptions {
  /** Exact phrases to allow, matched without case sensitivity. */
  allow?: string[]
  /** Additional literal phrases to flag with the rule's static guidance. */
  phrases?: string[]
}

export function phraseRule(id: string, description: string, phrases: readonly string[], help: string): Rule<ChatPhraseOptions> {
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

/** Reuse an existing Fair Copy rule under the review contract, which promises
 * static messages: the wrapped rule's dynamic message (which may quote the
 * matched draft text) is replaced, and its help and ranges are kept.
 */
export function withStaticMessage<Options>(rule: Rule<Options>, message: string): Rule<Options> {
  return {
    ...rule,
    check(input): Diagnostic[] {
      return rule.check(input).map(({ suggest: _suggest, ...finding }) => ({ ...finding, message }))
    },
  }
}

export const FORMAL_CHAT_PHRASES = Object.freeze([
  'I hope this message finds you well', 'I hope this email finds you well',
  'I am writing to', 'I wanted to reach out', 'please be advised', 'please do not hesitate to',
  'at your earliest convenience', 'kindly send', 'kindly provide', 'kindly confirm',
  'kindly let me know', 'kindly advise', 'kindly note', 'kindly review', 'furthermore', 'moreover',
  'in conclusion', 'best regards', 'yours sincerely', 'pursuant to',
])

export const ASSISTANT_PHRASES = Object.freeze([
  'as an AI language model', 'as an AI assistant', 'as an AI,', 'as an AI I',
  'as a language model', 'as a large language model',
  'I can certainly assist', 'I would be happy to assist', "I'd be happy to assist", 'I am here to help',
  "I'm here to help", 'I have successfully', "it's important to note",
  'it is important to note', "it's worth noting", 'it is worth noting',
  'delve into', 'I will now proceed',
])

export const SALES_PHRASES = Object.freeze([
  'unlock your potential', 'game-changing', 'game changer', 'revolutionary solution',
  'revolutionize', 'unparalleled', 'seamless experience', 'cutting-edge solution',
  'take it to the next level', 'supercharge your',
])

export const noFormalChatLanguage = phraseRule(
  'chat-no-formal-language', 'use everyday wording for a chat message', FORMAL_CHAT_PHRASES,
  'Say what you need directly. Keep the greeting and sign-off brief; use contractions if they fit. Fragments and optional final periods are fine.',
)

export const noAgentChatLanguage = phraseRule(
  'chat-no-agent-language', 'remove assistant framing and padded explanations', ASSISTANT_PHRASES,
  'Use the sender\'s own voice. Remove boilerplate about assisting or completing tasks; keep the concrete fact or request. Do not conceal a relevant AI disclosure.',
)

export const noSalesChatLanguage = phraseRule(
  'chat-no-sales-language', 'replace sales slogans with a concrete detail', SALES_PHRASES,
  'Describe what changes or ask the specific question. Avoid pitch language in a personal message; preserve useful facts.',
)

export const noAssistantFraming = phraseRule(
  'no-assistant-framing', 'remove assistant framing and padded explanations', ASSISTANT_PHRASES,
  'Write in the author\'s voice. Remove boilerplate about assisting or completing tasks and keep the concrete point. Do not conceal a relevant AI disclosure.',
)

export const noSalesSlogans = phraseRule(
  'no-sales-slogans', 'replace the slogan with a concrete detail', SALES_PHRASES,
  'Say what changes, for whom, or by how much. Keep the useful fact and drop the pitch.',
)

export const noRhetoricalScaffoldingStatic = withStaticMessage(
  noRhetoricalScaffolding, 'state the claim directly instead of setting up a contrast',
)

export const noLlmSpeakStatic = withStaticMessage(noLlmSpeak, 'replace the padded phrase with a direct word')
export const noNThingsStatic = withStaticMessage(noNThings, 'name the items instead of counting placeholder things')
export const noHedgeWordsStatic = withStaticMessage(noHedgeWords, 'remove the hedge or give the specific evidence')
export const noWeaselWordsStatic = withStaticMessage(noWeaselWords, 'remove the reinforcing adverb')
export const noClichesStatic = withStaticMessage(noCliches, 'replace the cliché with a specific detail')
export const noFillerWordsStatic = withStaticMessage(noFillerWords, 'remove the filler word')

/** Every rule a preset can reference. Adding a rule is a code change; using an
 * existing rule in a new or changed preset is a data change in presets.ts.
 */
export const RULE_CATALOG: ReadonlyMap<string, Rule> = new Map<string, Rule>([
  [noEmDash.id, noEmDash as Rule],
  [noFormalChatLanguage.id, noFormalChatLanguage as Rule],
  [noAgentChatLanguage.id, noAgentChatLanguage as Rule],
  [noSalesChatLanguage.id, noSalesChatLanguage as Rule],
  [noAssistantFraming.id, noAssistantFraming as Rule],
  [noSalesSlogans.id, noSalesSlogans as Rule],
  [noRhetoricalScaffoldingStatic.id, noRhetoricalScaffoldingStatic as Rule],
  [noLlmSpeakStatic.id, noLlmSpeakStatic as Rule],
  [noNThingsStatic.id, noNThingsStatic as Rule],
  [noHedgeWordsStatic.id, noHedgeWordsStatic as Rule],
  [noWeaselWordsStatic.id, noWeaselWordsStatic as Rule],
  [noClichesStatic.id, noClichesStatic as Rule],
  [noFillerWordsStatic.id, noFillerWordsStatic as Rule],
])
