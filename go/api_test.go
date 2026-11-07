package faircopy

import (
	"bufio"
	"compress/gzip"
	"encoding/json"
	"os"
	"testing"
)

// TestLintMatchesReviews rebuilds every successful golden review from the
// structured API (Lint, FormatFeedback, Summary) and requires the same
// feedback, summary and counts the bundle produced.
func TestLintMatchesReviews(t *testing.T) {
	f, err := os.Open(committedGolden)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	zr, err := gzip.NewReader(f)
	if err != nil {
		t.Fatal(err)
	}
	sc := bufio.NewScanner(zr)
	sc.Buffer(make([]byte, 1<<20), 1<<24)
	checked, limits := 0, 0
	for sc.Scan() {
		var row [3]*string
		if err := json.Unmarshal(sc.Bytes(), &row); err != nil {
			t.Fatal(err)
		}
		fn := *row[0]
		if fn == "describePresetsJSON" {
			continue
		}
		var req struct {
			Text    *string `json:"text"`
			Context *string `json:"context"`
			Profile *string `json:"profile"`
		}
		var res struct {
			Status       string `json:"status"`
			Code         string `json:"code"`
			Context      string `json:"context"`
			IssueCount   int    `json:"issueCount"`
			ErrorCount   int    `json:"errorCount"`
			WarningCount int    `json:"warningCount"`
			Summary      string `json:"summary"`
			Feedback     string `json:"feedback"`
			Limit        *struct {
				Name   string `json:"name"`
				Actual *int   `json:"actual"`
			} `json:"limit"`
		}
		if json.Unmarshal([]byte(*row[1]), &req) != nil || req.Text == nil || json.Unmarshal([]byte(*row[2]), &res) != nil {
			continue
		}
		profileID, context := ChatProfileID, "chat"
		if fn == "reviewTextJSON" {
			if res.Status == "error" && res.Code == "invalid_request" {
				continue
			}
			context = defaultReviewContext
			if req.Context != nil {
				context = *req.Context
			}
			profileID, _ = ContextProfile(context)
			if req.Profile != nil {
				profileID = *req.Profile
			}
			if res.Context != "" {
				context = res.Context
			}
		} else if res.Status == "error" {
			continue
		}
		fs, err := Lint(*req.Text, profileID)
		if res.Status == "error" {
			if res.Limit == nil || res.Limit.Name == "input" || res.Limit.Name == "output" {
				continue
			}
			fail, ok := err.(*Failure)
			if !ok || fail.Code != "limit_exceeded" || fail.Limit == nil || fail.Limit.Name != res.Limit.Name ||
				(res.Limit.Actual == nil) != (fail.Limit.Actual == nil) ||
				(res.Limit.Actual != nil && *res.Limit.Actual != *fail.Limit.Actual) {
				t.Fatalf("%s %.80q: Lint error %+v, want limit %+v", fn, *req.Text, err, res.Limit)
			}
			limits++
			continue
		}
		if err != nil {
			t.Fatalf("%s %.80q: Lint: %v", fn, *req.Text, err)
		}
		errs, warns := 0, 0
		for _, x := range fs {
			if x.Severity == "error" {
				errs++
			} else if x.Severity == "warn" {
				warns++
			}
		}
		if got := FormatFeedback(*req.Text, fs); got != res.Feedback {
			t.Fatalf("%s %.80q: feedback\n%s\nwant\n%s", fn, *req.Text, got, res.Feedback)
		}
		if len(fs) != res.IssueCount || errs != res.ErrorCount || warns != res.WarningCount {
			t.Fatalf("%s %.80q: counts %d/%d/%d", fn, *req.Text, len(fs), errs, warns)
		}
		if fn == "reviewTextJSON" {
			if got := Summary(fs, context, profileID); got != res.Summary {
				t.Fatalf("%s %.80q: summary %q, want %q", fn, *req.Text, got, res.Summary)
			}
		}
		// Sorting an already-sorted set must not move anything.
		cp := append([]Finding(nil), fs...)
		SortFindings(cp)
		for i := range cp {
			if cp[i] != fs[i] {
				t.Fatalf("SortFindings reordered a review's findings")
			}
		}
		checked++
	}
	if err := sc.Err(); err != nil {
		t.Fatal(err)
	}
	t.Logf("%d reviews rebuilt from Lint, %d limit errors matched", checked, limits)
	// Every successful review in the committed goldens, not a floor: a
	// truncated but well-formed golden file must fail here.
	if checked != goldenReviews || limits != goldenLimitErrors {
		t.Fatalf("rebuilt %d reviews and %d limit errors; the committed goldens hold %d and %d", checked, limits, goldenReviews, goldenLimitErrors)
	}
	if _, err := Lint("x", "nope-v1"); err == nil {
		t.Fatal("unknown profile accepted")
	}
}

func TestSummaryRejectsUnknownContext(t *testing.T) {
	if got := Summary(nil, "docs", "general-v1"); got != "" {
		t.Fatalf("Summary for an unknown context = %q, want empty", got)
	}
	if got := Summary(nil, "general", "general-v1"); got != "No Fair Copy findings for general writing (general-v1)." {
		t.Fatalf("Summary(general) = %q", got)
	}
	if got := Summary(nil, "custom", "mine"); got != "No Fair Copy findings for a custom profile (mine)." {
		t.Fatalf("Summary(custom) = %q", got)
	}
}
