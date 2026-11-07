package faircopy

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
)

func draft(tb testing.TB, n int) string {
	raw, err := os.ReadFile("testdata/corpus/drafts.txt")
	if err != nil {
		tb.Fatal(err)
	}
	paras := strings.Split(string(raw), "\n---\n")
	var b strings.Builder
	for i := 0; b.Len() < n; i++ {
		if b.Len() > 0 {
			b.WriteString("\n\n")
		}
		b.WriteString(strings.TrimSpace(paras[i%len(paras)]))
	}
	s := strings.ToValidUTF8(b.String()[:n], "")
	if i := strings.LastIndexByte(s, ' '); i > n-40 {
		s = s[:i]
	}
	return s
}

// BenchmarkReviewTextJSON is one general-v1 review through the JSON boundary.
func BenchmarkReviewTextJSON(b *testing.B) {
	for _, s := range []struct {
		name string
		n    int
	}{{"1KB", 1 << 10}, {"8KB", 8 << 10}, {"16KB", 16 << 10}} {
		req, _ := json.Marshal(map[string]any{"version": 1, "text": draft(b, s.n)})
		in := string(req)
		b.Run(s.name, func(b *testing.B) {
			b.ReportAllocs()
			for i := 0; i < b.N; i++ {
				ReviewTextJSON(in)
			}
		})
	}
}
