package faircopy

import (
	"bufio"
	"compress/gzip"
	"encoding/json"
	"os"
	"strings"
	"testing"
)

// minGoldenCalls is well under the 11,163 calls tools/goldens.mjs writes.
const minGoldenCalls = 10000

// TestParity replays every request in testdata/golden.jsonl.gz (generated
// from the @faircopy/chat bundle by tools/goldens.mjs) and requires the
// exact same output bytes. FAIRCOPY_GOLDEN points it at another golden file;
// CI uses that to check against goldens regenerated from a fresh build.
func TestParity(t *testing.T) {
	path := "testdata/golden.jsonl.gz"
	if p := os.Getenv("FAIRCOPY_GOLDEN"); p != "" {
		path = p
	}
	f, err := os.Open(path)
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
	calls, bad := 0, 0
	var examples []string
	for sc.Scan() {
		var row [3]*string
		if err := json.Unmarshal(sc.Bytes(), &row); err != nil {
			t.Fatal(err)
		}
		fn, want := *row[0], *row[2]
		var got string
		switch fn {
		case "reviewTextJSON":
			got = ReviewTextJSON(*row[1])
		case "reviewChatJSON":
			got = ReviewChatJSON(*row[1])
		case "describePresetsJSON":
			got = DescribePresetsJSON()
		default:
			t.Fatalf("unknown function %q", fn)
		}
		calls++
		if got != want {
			bad++
			if len(examples) < 20 {
				in := ""
				if row[1] != nil {
					in = *row[1]
				}
				if len(in) > 300 {
					in = in[:300] + "…"
				}
				examples = append(examples, fn+" "+in+"\n    got:  "+got+"\n    want: "+want)
			}
		}
	}
	if err := sc.Err(); err != nil {
		t.Fatal(err)
	}
	t.Logf("%d calls, %d mismatches", calls, bad)
	// A failed or truncated golden generation must not pass as "no mismatches".
	if calls < minGoldenCalls {
		t.Fatalf("%s holds %d calls; want at least %d", path, calls, minGoldenCalls)
	}
	if bad > 0 {
		t.Errorf("parity:\n%s", strings.Join(examples, "\n"))
	}
}
