// Package faircopy is a Go port of the @faircopy/chat review engine: the
// review presets (general-v1, chat-v1, email-v1), their rules and the
// version 1 JSON contract.
//
// ReviewTextJSON, ReviewChatJSON and DescribePresetsJSON return exactly the
// bytes the bundle's reviewTextJSON, reviewChatJSON and describePresetsJSON
// return for the same input, so a host can run reviews in-process instead of
// evaluating packages/chat's IIFE in an embedded JavaScript VM. The parity
// tests compare every output with the built bundle.
package faircopy

import (
	"encoding/json"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// Version and limits shared by every preset (REVIEW_VERSION, REVIEW_LIMITS).
const (
	ReviewVersion   = 1
	InputBytes      = 65536
	TextCodeUnits   = 16384
	MaxIssues       = 100
	OutputBytes     = 16384
	ChatProfileID   = "chat-v1"
	errInvalid      = "invalid_request"
	errLimit        = "limit_exceeded"
	errInternal     = "internal_error"
	outputLineBreak = 1 // JSON.stringify(result) + '\n'
)

type reviewLimit struct {
	name, unit string
	max        int
	actual     int
	hasActual  bool
}

type reviewFailure struct {
	code    string
	limit   *reviewLimit
	profile string
	context string
}

func (f *reviewFailure) Error() string { return f.code }

func limitExceeded(name string, actual int, hasActual bool) *reviewFailure {
	units := map[string]string{"input": "utf8Bytes", "text": "utf16CodeUnits", "findings": "findings", "output": "utf8Bytes"}
	max := map[string]int{"input": InputBytes, "text": TextCodeUnits, "findings": MaxIssues, "output": OutputBytes}
	return &reviewFailure{code: errLimit, limit: &reviewLimit{name: name, unit: units[name], max: max[name], actual: actual, hasActual: hasActual}}
}

// --- lint -------------------------------------------------------------------

var reURL = regexp.MustCompile(foldASCII(`(?:https?://|www\.)[^` + jsSpace + "<>\"'`{}|]+"))

// maskURLs replaces URL text with spaces, unit for unit, so diagnostics
// still point into the original message. A closing Markdown delimiter ends
// the URL; balanced parentheses inside it belong to it.
func maskURLs(units string) string {
	return reURL.ReplaceAllStringFunc(units, func(url string) string {
		rs := []rune(url)
		depth, brackets, end := 0, 0, len(rs)
	scan:
		for i, r := range rs {
			switch r {
			case '(':
				depth++
			case '[':
				brackets++
			case ']':
				if brackets == 0 {
					end = i
					break scan
				}
				brackets--
			case ')':
				if depth == 0 {
					end = i
					break scan
				}
				depth--
			}
		}
		return strings.Repeat(" ", end) + string(rs[end:])
	})
}

// fromUnits turns a unit string back into text (stand-ins become the
// original astral characters).
func fromUnits(units string) string {
	rs := []rune(units)
	var b strings.Builder
	b.Grow(len(units))
	for i := 0; i < len(rs); i++ {
		r := rs[i]
		if r >= highStandIn && r < lowStandIn && i+1 < len(rs) && rs[i+1] >= lowStandIn && rs[i+1] < lowStandIn+0x400 {
			b.WriteRune(0x10000 + (r-highStandIn)<<10 + (rs[i+1] - lowStandIn))
			i++
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func lintText(text string, pr *profile) ([]diagnostic, error) {
	if n := utf16Len(text); n > TextCodeUnits {
		return nil, limitExceeded("text", n, true)
	}
	src := newJSText(text)
	prose := newJSText(fromUnits(maskURLs(src.units)))
	var out []diagnostic
	for _, rr := range pr.rules {
		if rr.severity == "off" {
			continue
		}
		for _, d := range rr.rule.check(prose) {
			d.severity = rr.severity
			out = append(out, d)
			if len(out) > MaxIssues {
				return nil, limitExceeded("findings", 0, false)
			}
		}
	}
	sort.SliceStable(out, func(a, b int) bool {
		x, y := out[a], out[b]
		if x.start != y.start {
			return x.start < y.start
		}
		if x.end != y.end {
			return x.end < y.end
		}
		// localeCompare; rule IDs are lowercase ASCII words joined by
		// hyphens, where it agrees with byte order.
		return x.ruleID < y.ruleID
	})
	return out, nil
}

// --- reporting (core/src/reporting.ts formatAgentCompact, snippets none, chars on)

// lineCol is offsetToLineCol: 1-based line, and 1 + the UTF-16 length of
// the text between the last newline and offset.
func lineCol(units []rune, offset int) (int, int) {
	if offset > len(units) {
		offset = len(units)
	}
	line, col := 1, 1
	for _, r := range units[:offset] {
		if r == '\n' {
			line++
			col = 1
		} else {
			col++
		}
	}
	return line, col
}

func formatAgentCompact(text string, ds []diagnostic) string {
	if len(ds) == 0 {
		return "faircopy errors=0 warnings=0"
	}
	units := []rune(newJSText(text).units)
	var order []string
	groups := map[string][]diagnostic{}
	errs, warns := 0, 0
	for _, d := range ds {
		if _, ok := groups[d.ruleID]; !ok {
			order = append(order, d.ruleID)
		}
		groups[d.ruleID] = append(groups[d.ruleID], d)
		switch d.severity {
		case "error":
			errs++
		case "warn":
			warns++
		}
	}
	lines := []string{"faircopy errors=" + strconv.Itoa(errs) + " warnings=" + strconv.Itoa(warns) + " rules=" + strconv.Itoa(len(order))}
	for _, id := range order {
		items := groups[id]
		lines = append(lines, "rule="+id+" count="+strconv.Itoa(len(items))+" severity="+items[0].severity)
		for i, d := range items {
			sl, sc := lineCol(units, d.start)
			endOffset := d.end - 1
			if endOffset < d.start {
				endOffset = d.start
			}
			el, ec := lineCol(units, endOffset)
			lines = append(lines, "  at="+strconv.Itoa(sl)+":"+strconv.Itoa(sc)+"-"+strconv.Itoa(el)+":"+strconv.Itoa(ec)+
				" chars="+strconv.Itoa(d.start)+".."+strconv.Itoa(d.end))
			if i == 0 {
				lines = append(lines, "  msg="+d.message)
				if d.help != "" {
					lines = append(lines, "  help="+d.help)
				}
			}
		}
	}
	return strings.Join(lines, "\n")
}

// --- results ----------------------------------------------------------------

var contextNames = map[string]string{"general": "general writing", "chat": "chat", "email": "email", "custom": "a custom profile"}

func summarize(issueCount, ruleCount int, context, profileID string) string {
	where := contextNames[context] + " (" + profileID + ")"
	if issueCount == 0 {
		return "No Fair Copy findings for " + where + "."
	}
	findings := strconv.Itoa(issueCount) + " findings"
	if issueCount == 1 {
		findings = "1 finding"
	}
	rules := strconv.Itoa(ruleCount) + " rules"
	if ruleCount == 1 {
		rules = "1 rule"
	}
	return findings + " across " + rules + " for " + where + ". Revise at the listed locations; review does not change the text."
}

type built struct {
	profile, context, status         string
	issues, errorCount, warningCount int
	summary, feedback                string
}

func buildResult(text string, pr *profile, context string) (*built, error) {
	ds, err := lintText(text, pr)
	if err != nil {
		return nil, err
	}
	b := &built{profile: pr.id, context: context, issues: len(ds), status: "clean"}
	if len(ds) > 0 {
		b.status = "warnings"
	}
	ruleIDs := map[string]bool{}
	for _, d := range ds {
		ruleIDs[d.ruleID] = true
		switch d.severity {
		case "error":
			b.errorCount++
		case "warn":
			b.warningCount++
		}
	}
	b.summary = summarize(len(ds), len(ruleIDs), context, pr.id)
	b.feedback = formatAgentCompact(text, ds)
	return b, nil
}

func (b *built) reviewJSON() string {
	var w jsonWriter
	w.obj()
	w.key("version").num(ReviewVersion)
	w.key("profile").str(b.profile)
	w.key("context").str(b.context)
	w.key("status").str(b.status)
	w.key("issueCount").num(b.issues)
	w.key("errorCount").num(b.errorCount)
	w.key("warningCount").num(b.warningCount)
	w.key("summary").str(b.summary)
	w.key("feedback").str(b.feedback)
	w.end()
	return w.String()
}

func (b *built) chatJSON() string {
	var w jsonWriter
	w.obj()
	w.key("version").num(ReviewVersion)
	w.key("profile").str(ChatProfileID)
	w.key("status").str(b.status)
	w.key("issueCount").num(b.issues)
	w.key("errorCount").num(b.errorCount)
	w.key("warningCount").num(b.warningCount)
	w.key("feedback").str(b.feedback)
	w.end()
	return w.String()
}

func errorJSON(err error) string {
	var w jsonWriter
	w.obj()
	w.key("version").num(ReviewVersion)
	w.key("status").str("error")
	f, ok := err.(*reviewFailure)
	if !ok {
		w.key("code").str(errInternal)
		w.end()
		return w.String()
	}
	w.key("code").str(f.code)
	if f.profile != "" {
		w.key("profile").str(f.profile)
	}
	if f.context != "" {
		w.key("context").str(f.context)
	}
	if f.limit != nil {
		w.key("limit").obj()
		w.key("name").str(f.limit.name)
		w.key("unit").str(f.limit.unit)
		w.key("max").num(f.limit.max)
		if f.limit.hasActual {
			w.key("actual").num(f.limit.actual)
		}
		w.end()
	}
	w.end()
	return w.String()
}

// --- the JSON boundary (packages/chat/src/runtime.ts) ------------------------

// parseBounded checks the input byte limit, then parses one JSON object.
// Top-level values that are not objects are invalid requests.
func parseBounded(input string) (map[string]json.RawMessage, error) {
	if n := utf8ByteLength(input); n > InputBytes {
		return nil, limitExceeded("input", n, true)
	}
	if !json.Valid([]byte(input)) {
		return nil, &reviewFailure{code: errInvalid}
	}
	trimmed := strings.TrimLeft(input, " \t\r\n")
	if !strings.HasPrefix(trimmed, "{") {
		return nil, &reviewFailure{code: errInvalid}
	}
	var m map[string]json.RawMessage
	if err := json.Unmarshal([]byte(input), &m); err != nil {
		return nil, &reviewFailure{code: errInvalid}
	}
	return m, nil
}

// isNumberOne is `value === 1` for a JSON value.
func isNumberOne(raw json.RawMessage) bool {
	s := strings.TrimSpace(string(raw))
	if s == "" || !(s[0] == '-' || (s[0] >= '0' && s[0] <= '9')) {
		return false
	}
	f, err := strconv.ParseFloat(s, 64)
	return err == nil && f == 1
}

func jsonString(raw json.RawMessage) (string, bool) {
	s := strings.TrimSpace(string(raw))
	if s == "" || s[0] != '"' {
		return "", false
	}
	var out string
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", false
	}
	return out, true
}

func reviewText(m map[string]json.RawMessage) (string, error) {
	for k := range m {
		switch k {
		case "version", "text", "context", "profile":
		default:
			return "", &reviewFailure{code: errInvalid}
		}
	}
	if !isNumberOne(m["version"]) {
		return "", &reviewFailure{code: errInvalid}
	}
	text, ok := jsonString(m["text"])
	if !ok {
		return "", &reviewFailure{code: errInvalid}
	}
	context, hasContext := "", false
	if raw, present := m["context"]; present {
		c, ok := jsonString(raw)
		if !ok || !isReviewContext(c) {
			return "", &reviewFailure{code: errInvalid}
		}
		context, hasContext = c, true
	}
	profileID := ""
	if raw, present := m["profile"]; present {
		p, ok := jsonString(raw)
		if !ok {
			return "", &reviewFailure{code: errInvalid}
		}
		profileID = p
	} else if hasContext {
		profileID = contextPresets[context]
	} else {
		profileID = contextPresets[defaultReviewContext]
	}
	pr := presetProfiles[profileID]
	if pr == nil || (hasContext && pr.context != context) {
		return "", &reviewFailure{code: errInvalid}
	}
	applied := pr.context
	if applied == "" {
		applied = "custom"
	}
	fail := func(err error) error {
		if f, ok := err.(*reviewFailure); ok {
			f.profile, f.context = pr.id, applied
		}
		return err
	}
	b, err := buildResult(text, pr, applied)
	if err != nil {
		return "", fail(err)
	}
	out := b.reviewJSON()
	if n := utf8ByteLength(out) + outputLineBreak; n > OutputBytes {
		return "", fail(limitExceeded("output", n, true))
	}
	return out, nil
}

// ReviewTextJSON is the bundle's reviewTextJSON: a version 1 review request
// ({"version":1,"text":"...","context":"general"|"chat"|"email","profile":"..."})
// in, a result or error envelope out.
func ReviewTextJSON(input string) (out string) {
	defer func() {
		if recover() != nil {
			out = errorJSON(nil)
		}
	}()
	m, err := parseBounded(input)
	if err != nil {
		return errorJSON(err)
	}
	res, err := reviewText(m)
	if err != nil {
		return errorJSON(err)
	}
	return res
}

func reviewChat(m map[string]json.RawMessage) (string, error) {
	for k := range m {
		switch k {
		case "version", "profile", "text":
		default:
			return "", &reviewFailure{code: errInvalid}
		}
	}
	if !isNumberOne(m["version"]) {
		return "", &reviewFailure{code: errInvalid}
	}
	if p, ok := jsonString(m["profile"]); !ok || p != ChatProfileID {
		return "", &reviewFailure{code: errInvalid}
	}
	text, ok := jsonString(m["text"])
	if !ok {
		return "", &reviewFailure{code: errInvalid}
	}
	b, err := buildResult(text, presetProfiles[ChatProfileID], "chat")
	if err != nil {
		return "", err
	}
	out := b.chatJSON()
	if utf8ByteLength(out)+outputLineBreak > OutputBytes {
		return "", &reviewFailure{code: errLimit}
	}
	return out, nil
}

// ReviewChatJSON is the bundle's reviewChatJSON: the fixed chat-v1 contract.
func ReviewChatJSON(input string) (out string) {
	chatError := func(code string) string {
		var w jsonWriter
		w.obj()
		w.key("version").num(ReviewVersion)
		w.key("profile").str(ChatProfileID)
		w.key("status").str("error")
		w.key("code").str(code)
		w.end()
		return w.String()
	}
	defer func() {
		if recover() != nil {
			out = chatError(errInternal)
		}
	}()
	m, err := parseBounded(input)
	if err == nil {
		out, err = reviewChat(m)
	}
	if err != nil {
		code := errInternal
		if f, ok := err.(*reviewFailure); ok {
			code = f.code
		}
		return chatError(code)
	}
	return out
}

// DescribePresetsJSON is the bundle's describePresetsJSON: contexts, presets,
// their rule IDs and the limits.
func DescribePresetsJSON() string {
	var w jsonWriter
	w.obj()
	w.key("version").num(ReviewVersion)
	w.key("defaultContext").str(defaultReviewContext)
	w.key("contexts").obj()
	for _, c := range reviewContexts {
		w.key(c).str(contextPresets[c])
	}
	w.end()
	w.key("presets").arr()
	for _, p := range reviewPresets {
		w.obj()
		w.key("id").str(p.id)
		w.key("context").str(p.context)
		w.key("summary").str(p.summary)
		w.key("rules").arr()
		for _, e := range p.rules {
			w.obj()
			w.key("id").str(e.id)
			w.key("severity").str(e.severity)
			w.end()
		}
		w.endArr()
		w.end()
	}
	w.endArr()
	w.key("limits").obj()
	w.key("inputBytes").num(InputBytes)
	w.key("textCodeUnits").num(TextCodeUnits)
	w.key("issues").num(MaxIssues)
	w.key("outputBytes").num(OutputBytes)
	w.end()
	w.end()
	return w.String()
}
