package faircopy

// Port of packages/chat/src/presets.ts. Presets are data; the order of each
// rule table is the order rules run and report in.

type presetEntry struct {
	id       string // the rule ID this preset reports
	catalog  string // the catalog rule it runs
	severity string
	// presented is true for the object form ({rule, message?, help?}), which
	// re-reports the catalog rule under id with its own wording.
	presented bool
	message   string // "" = the catalog rule's description
	help      string // "" = the catalog rule's help
}

type preset struct {
	id      string
	context string
	summary string
	rules   []presetEntry
}

var reviewContexts = []string{"general", "chat", "email"}

const defaultReviewContext = "general"

var contextPresets = map[string]string{"general": "general-v1", "chat": "chat-v1", "email": "email-v1"}

var reviewPresets = []preset{
	{
		id:      "general-v1",
		context: "general",
		summary: `Documents, website copy and other general writing. Formal wording, headings and domain terms are fine; flags em dashes, assistant boilerplate, sales slogans and "X is Y, not Z" scaffolding.`,
		rules: []presetEntry{
			{id: "no-em-dash", catalog: "no-em-dash", severity: "warn"},
			{id: "no-assistant-framing", catalog: "assistant-phrases", severity: "warn", presented: true},
			{id: "no-sales-slogans", catalog: "sales-phrases", severity: "warn", presented: true},
			{id: "no-rhetorical-scaffolding", catalog: "no-rhetorical-scaffolding", severity: "warn"},
		},
	},
	{
		id:      "chat-v1",
		context: "chat",
		summary: "Everyday informal chat. Fragments, contractions, lowercase, emoji and optional final periods are fine; flags em dashes and formal, assistant-like or sales language.",
		rules: []presetEntry{
			{id: "no-em-dash", catalog: "no-em-dash", severity: "warn"},
			{id: "chat-no-formal-language", catalog: "formal-phrases", severity: "warn", presented: true,
				message: "use everyday wording for a chat message",
				help:    "Say what you need directly. Keep the greeting and sign-off brief; use contractions if they fit. Fragments and optional final periods are fine."},
			{id: "chat-no-agent-language", catalog: "assistant-phrases", severity: "warn", presented: true,
				message: "remove assistant framing and padded explanations",
				help:    "Use the sender's own voice. Remove boilerplate about assisting or completing tasks; keep the concrete fact or request. Do not conceal a relevant AI disclosure."},
			{id: "chat-no-sales-language", catalog: "sales-phrases", severity: "warn", presented: true,
				message: "replace sales slogans with a concrete detail",
				help:    "Describe what changes or ask the specific question. Avoid pitch language in a personal message; preserve useful facts."},
		},
	},
	{
		id:      "email-v1",
		context: "email",
		summary: `Email. Professional greetings, sign-offs and formal requests are fine; flags em dashes, assistant boilerplate, sales slogans and "X is Y, not Z" scaffolding.`,
		rules: []presetEntry{
			{id: "no-em-dash", catalog: "no-em-dash", severity: "warn"},
			{id: "no-assistant-framing", catalog: "assistant-phrases", severity: "warn", presented: true},
			{id: "no-sales-slogans", catalog: "sales-phrases", severity: "warn", presented: true},
			{id: "no-rhetorical-scaffolding", catalog: "no-rhetorical-scaffolding", severity: "warn"},
		},
	},
}

type resolvedRule struct {
	rule     *rule
	severity string
}

type profile struct {
	id      string
	context string
	rules   []resolvedRule
}

func resolvePreset(p preset) *profile {
	pr := &profile{id: p.id, context: p.context}
	for _, e := range p.rules {
		r := ruleCatalog[e.catalog]
		if r == nil {
			panic("faircopy: preset names an unknown rule ID")
		}
		if e.presented {
			msg, help := e.message, e.help
			if msg == "" {
				msg = r.description
			}
			if help == "" {
				help = r.help
			}
			r = presentedAs(r, e.id, msg, help)
		}
		pr.rules = append(pr.rules, resolvedRule{rule: r, severity: e.severity})
	}
	return pr
}

var presetProfiles = func() map[string]*profile {
	m := map[string]*profile{}
	for _, p := range reviewPresets {
		m[p.id] = resolvePreset(p)
	}
	return m
}()

func isReviewContext(s string) bool {
	for _, c := range reviewContexts {
		if c == s {
			return true
		}
	}
	return false
}
