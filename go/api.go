package faircopy

import "sort"

// Finding is one diagnostic. Start and End are UTF-16 code-unit offsets into
// the reviewed text, the unit Fair Copy reports ranges in.
type Finding struct {
	RuleID   string
	Severity string // "warn" or "error"
	Message  string // static guidance; never draft text
	Help     string
	Start    int
	End      int
}

// Limit names the bound a request crossed. Actual is nil when unknown.
type Limit struct {
	Name   string // "input", "text", "findings" or "output"
	Unit   string // "utf8Bytes", "utf16CodeUnits" or "findings"
	Max    int
	Actual *int
}

// Failure is a review error: Code is "invalid_request" or "limit_exceeded".
type Failure struct {
	Code  string
	Limit *Limit
}

func (f *Failure) Error() string { return "faircopy: " + f.Code }

func exported(err error) error {
	rf, ok := err.(*reviewFailure)
	if !ok {
		return err
	}
	f := &Failure{Code: rf.code}
	if rf.limit != nil {
		f.Limit = &Limit{Name: rf.limit.name, Unit: rf.limit.unit, Max: rf.limit.max}
		if rf.limit.hasActual {
			n := rf.limit.actual
			f.Limit.Actual = &n
		}
	}
	return f
}

// ContextProfile is the preset a writing context ("general", "chat",
// "email") uses when a request names no profile.
func ContextProfile(context string) (string, bool) {
	p, ok := contextPresets[context]
	return p, ok
}

// Lint runs a preset (such as "general-v1") over text and returns its
// findings in review order, exactly as the review results count and format
// them. Text over the length limit or more than MaxIssues findings is a
// *Failure, as in the JSON API.
func Lint(text, profileID string) ([]Finding, error) {
	pr := presetProfiles[profileID]
	if pr == nil {
		return nil, &Failure{Code: errInvalid}
	}
	ds, err := lintText(text, pr)
	if err != nil {
		return nil, exported(err)
	}
	out := make([]Finding, len(ds))
	for i, d := range ds {
		out[i] = Finding{RuleID: d.ruleID, Severity: d.severity, Message: d.message, Help: d.help, Start: d.start, End: d.end}
	}
	return out, nil
}

// SortFindings orders findings the way a review does: by start, then end,
// then rule ID. Use it after adding findings from another source.
func SortFindings(fs []Finding) {
	sort.SliceStable(fs, func(a, b int) bool {
		x, y := fs[a], fs[b]
		if x.Start != y.Start {
			return x.Start < y.Start
		}
		if x.End != y.End {
			return x.End < y.End
		}
		return x.RuleID < y.RuleID
	})
}

// FormatFeedback is the review's feedback text (formatAgentCompact with no
// snippets and character ranges) for findings over text. It contains rule
// IDs, locations and static guidance, never draft text.
func FormatFeedback(text string, fs []Finding) string {
	ds := make([]diagnostic, len(fs))
	for i, f := range fs {
		ds[i] = diagnostic{ruleID: f.RuleID, severity: f.Severity, message: f.Message, help: f.Help, start: f.Start, end: f.End}
	}
	return formatAgentCompact(text, ds)
}

// Summary is the review's one-sentence summary for a context and profile.
func Summary(fs []Finding, context, profileID string) string {
	rules := map[string]bool{}
	for _, f := range fs {
		rules[f.RuleID] = true
	}
	return summarize(len(fs), len(rules), context, profileID)
}
