package faircopy

import (
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

// Port of the rules the review presets use: no-em-dash and
// no-rhetorical-scaffolding (packages/rules-default) and the phrase rules
// (packages/chat/src/rules.ts).

type diagnostic struct {
	ruleID   string
	severity string
	message  string
	help     string
	start    int // UTF-16
	end      int
}

type rule struct {
	id          string
	description string
	help        string
	check       func(t *jsText) []diagnostic
}

// foldASCII spells each ASCII letter of a pattern as [xX]: JavaScript's /i
// without /u folds only ASCII, while Go's (?i) would also match ſ and K.
func foldASCII(p string) string {
	var b strings.Builder
	inClass := false
	for i := 0; i < len(p); i++ {
		c := p[i]
		switch {
		case c == '\\' && i+1 < len(p):
			b.WriteByte(c)
			b.WriteByte(p[i+1])
			i++
		case c == '[':
			inClass = true
			b.WriteByte(c)
		case c == ']':
			inClass = false
			b.WriteByte(c)
		case !inClass && ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')):
			lo, up := c|0x20, c&^0x20
			b.WriteString("[" + string(lo) + string(up) + "]")
		default:
			b.WriteByte(c)
		}
	}
	return b.String()
}

const sp = `[` + jsSpace + `]`

// --- no-em-dash -------------------------------------------------------------

const emDashHelp = "Em-dashes are a stylistic tell. Split the sentence at the break. " +
	"Use a period, a semicolon, parentheses, or a new sentence. " +
	"If the clauses genuinely belong together and a comma reads worse, write shorter sentences."

var noEmDash = &rule{
	id:          "no-em-dash",
	description: "Ban the em-dash character in marketing copy",
	help:        emDashHelp,
	check: func(t *jsText) []diagnostic {
		var out []diagnostic
		for i, r := range t.s {
			if r == '—' {
				u := t.unitAt[i]
				out = append(out, diagnostic{ruleID: "no-em-dash", severity: "error",
					message: "use a sentence break instead of an em-dash", help: emDashHelp, start: u, end: u + 1})
			}
		}
		return out
	},
}

// --- no-rhetorical-scaffolding ---------------------------------------------

const scaffoldingHelp = "These patterns spend a clause denying a straw man or performing a reveal instead of making a claim. " +
	"State the claim or consequence directly. Standalone importance announcements should explain what changes or why."

var (
	// /\b(is|are|was|were)\s+[^.!?]{1,80},\s+not\s+(a|an|the|just|only|merely|simply)\b/gi
	reIsNot = regexp.MustCompile(foldASCII(`\b(is|are|was|were)` + sp + `+[^.!?]{1,80},` + sp + `+not` + sp + `+(a|an|the|just|only|merely|simply)\b`))
	// /\bWithout\b[^.!?]{1,200}[.!?]\s*(?:[^.!?]{1,200}[.!?]\s*){0,2}With\b/gs
	reWithoutWith = regexp.MustCompile(`\bWithout\b[^.!?]{1,200}[.!?]` + sp + `*(?:[^.!?]{1,200}[.!?]` + sp + `*){0,2}With\b`)
	// IMPORTANCE_ANNOUNCEMENT_RE without its trailing lookahead, which is
	// checked by hand. `^` (start of input; no /m) can only match at 0.
	importanceBody  = `[` + `"'”’)\]]*` + sp + `+|\r?\n[\t ]*\r?\n)` + sp + `*["'“‘(\[]*((?:this|that)` + sp + `+(?:distinction|difference)` + sp + `+matters)`
	reImportanceAt0 = regexp.MustCompile(foldASCII(`(?:^|[.!?]` + importanceBody))
	reImportance    = regexp.MustCompile(foldASCII(`(?:[.!?]` + importanceBody))
)

// execAll is a JS `while (re.exec(text))` loop for a pattern that never
// matches the empty string, over the unit string. It returns submatch
// indexes as UTF-16 offsets.
func execAll(t *jsText, re *regexp.Regexp) [][]int {
	var out [][]int
	for pos := 0; pos <= len(t.units); {
		loc := re.FindStringSubmatchIndex(t.units[pos:])
		if loc == nil {
			break
		}
		units := make([]int, len(loc))
		for i, b := range loc {
			if b < 0 {
				units[i] = -1
			} else {
				units[i] = t.unitOfUnitsByte(pos + b)
			}
		}
		out = append(out, units)
		pos += loc[1]
	}
	return out
}

func scaffoldingDiag(start, end int) diagnostic {
	// The review wraps this rule in withStaticMessage, so the rule's own
	// (draft-quoting) message never reaches the output.
	return diagnostic{ruleID: "no-rhetorical-scaffolding", severity: "error", help: scaffoldingHelp, start: start, end: end}
}

func checkScaffolding(t *jsText) []diagnostic {
	var out []diagnostic
	for _, m := range execAll(t, reIsNot) {
		out = append(out, scaffoldingDiag(m[0], m[1]))
	}
	for _, m := range execAll(t, reWithoutWith) {
		out = append(out, scaffoldingDiag(m[0], m[1]))
	}
	// (?=([.!?]+)|\s*$): the lookahead is checked at the end of each
	// candidate; when it fails the search resumes one unit later, as the JS
	// engine would try the next start.
	units := []rune(t.units)
	for pos := 0; pos < len(units); {
		re := reImportance
		if pos == 0 {
			re = reImportanceAt0
		}
		bytePos := t.uByteAt[pos]
		loc := re.FindStringSubmatchIndex(t.units[bytePos:])
		if loc == nil {
			break
		}
		start := t.unitOfUnitsByte(bytePos + loc[0])
		end := t.unitOfUnitsByte(bytePos + loc[1])
		phraseStart := t.unitOfUnitsByte(bytePos + loc[2])
		punct := 0
		for end+punct < len(units) && strings.ContainsRune(".!?", units[end+punct]) {
			punct++
		}
		ok := punct > 0
		if !ok {
			ok = true
			for _, r := range units[end:] {
				if !isJSSpace(r) {
					ok = false
					break
				}
			}
		}
		if !ok {
			pos = start + 1
			continue
		}
		phraseLen := end - phraseStart
		out = append(out, scaffoldingDiag(phraseStart, phraseStart+phraseLen+punct))
		pos = end
		if end == start {
			pos++
		}
	}
	return out
}

var noRhetoricalScaffolding = &rule{
	id:          "no-rhetorical-scaffolding",
	description: `Ban formulaic "X is Y, not Z", "Without X / With X" and standalone importance announcements`,
	help:        scaffoldingHelp,
	check:       checkScaffolding,
}

// --- phrase rules -----------------------------------------------------------

var (
	formalChatPhrases = []string{
		"I hope this message finds you well", "I hope this email finds you well",
		"I am writing to", "I wanted to reach out", "please be advised", "please do not hesitate to",
		"at your earliest convenience", "kindly send", "kindly provide", "kindly confirm",
		"kindly let me know", "kindly advise", "kindly note", "kindly review", "furthermore", "moreover",
		"in conclusion", "best regards", "yours sincerely", "pursuant to",
	}
	assistantPhrases = []string{
		"as an AI language model", "as an AI assistant", "as an AI,", "as an AI I",
		"as a language model", "as a large language model",
		"I can certainly assist", "I would be happy to assist", "I'd be happy to assist", "I am here to help",
		"I'm here to help", "I have successfully", "it's important to note",
		"it is important to note", "it's worth noting", "it is worth noting",
		"delve into", "I will now proceed",
	}
	salesPhrases = []string{
		"unlock your potential", "game-changing", "game changer", "revolutionary solution",
		"revolutionize", "unparalleled", "seamless experience", "cutting-edge solution",
		"take it to the next level", "supercharge your",
	}
)

var (
	reRegexSpecial = regexp.MustCompile(`[.*+?^${}()|[\]\\]`)
	reJSWhitespace = regexp.MustCompile(sp + `+`)
)

// phrasePattern builds the body of
// new RegExp(`(?<![\p{L}\p{N}_])${escaped}(?![\p{L}\p{N}_])`, 'giu');
// the two lookarounds are checked by hand.
func phrasePattern(phrase string) *regexp.Regexp {
	escaped := reRegexSpecial.ReplaceAllString(phrase, `\$0`)
	escaped = reJSWhitespace.ReplaceAllLiteralString(escaped, sp+`+`)
	escaped = strings.NewReplacer("'", "['’]", "’", "['’]").Replace(escaped)
	// Go's (?i) folds by Unicode simple case folding, as /iu does.
	return regexp.MustCompile(`(?i)` + escaped)
}

func isWordish(r rune) bool { return r == '_' || unicode.IsLetter(r) || unicode.IsNumber(r) }

func phraseRule(id, description string, phrases []string, help string) *rule {
	seen := map[string]bool{}
	var res []*regexp.Regexp
	for _, p := range phrases {
		if seen[p] || strings.TrimSpace(p) == "" {
			continue
		}
		seen[p] = true
		res = append(res, phrasePattern(p))
	}
	return &rule{id: id, description: description, help: help, check: func(t *jsText) []diagnostic {
		var out []diagnostic
		for _, re := range res {
			for pos := 0; pos < len(t.s); {
				loc := re.FindStringIndex(t.s[pos:])
				if loc == nil {
					break
				}
				start, end := pos+loc[0], pos+loc[1]
				before, _ := utf8.DecodeLastRuneInString(t.s[:start])
				after, _ := utf8.DecodeRuneInString(t.s[end:])
				if (start > 0 && isWordish(before)) || (end < len(t.s) && isWordish(after)) {
					_, size := utf8.DecodeRuneInString(t.s[start:])
					pos = start + size
					continue
				}
				out = append(out, diagnostic{ruleID: id, severity: "warn", message: description, help: help,
					start: t.unitAt[start], end: t.unitAt[end]})
				pos = end
			}
		}
		return out
	}}
}

var (
	formalPhrasesRule = phraseRule("formal-phrases", "use everyday wording", formalChatPhrases,
		"Say what you need directly. Keep the greeting and sign-off brief.")
	assistantPhrasesRule = phraseRule("assistant-phrases", "remove assistant framing and padded explanations", assistantPhrases,
		"Write in the author's voice. Remove boilerplate about assisting or completing tasks and keep the concrete point. Do not conceal a relevant AI disclosure.")
	salesPhrasesRule = phraseRule("sales-phrases", "replace the slogan with a concrete detail", salesPhrases,
		"Say what changes, for whom, or by how much. Keep the useful fact and drop the pitch.")
)

// withStaticMessage replaces a rule's (possibly draft-quoting) message.
func withStaticMessage(r *rule, message string) *rule {
	return &rule{id: r.id, description: r.description, help: r.help, check: func(t *jsText) []diagnostic {
		out := r.check(t)
		for i := range out {
			out[i].message = message
		}
		return out
	}}
}

// presentedAs reports a catalog rule under a preset's own ID, message and help.
func presentedAs(r *rule, id, message, help string) *rule {
	return &rule{id: id, description: message, help: help, check: func(t *jsText) []diagnostic {
		out := r.check(t)
		for i := range out {
			out[i].ruleID, out[i].message, out[i].help = id, message, help
		}
		return out
	}}
}

var ruleCatalog = map[string]*rule{
	"no-em-dash":                noEmDash,
	"formal-phrases":            formalPhrasesRule,
	"assistant-phrases":         assistantPhrasesRule,
	"sales-phrases":             salesPhrasesRule,
	"no-rhetorical-scaffolding": withStaticMessage(noRhetoricalScaffolding, "state the claim directly instead of setting up a contrast"),
}
