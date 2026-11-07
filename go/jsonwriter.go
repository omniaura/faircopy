package faircopy

import (
	"strconv"
	"strings"
	"unicode/utf8"
)

// jsonWriter writes JSON exactly as JSON.stringify does for the values the
// engine produces: keys in insertion order, no spaces, integers, and strings
// escaped per ECMA-262 QuoteJSONString (", \, \b \f \n \r \t, other controls
// as \u00xx, everything else, U+2028 included, verbatim).
type jsonWriter struct {
	b     strings.Builder
	first []bool // per open container: no member written yet
	inKey bool   // a key was just written, so the next value is not a member
}

func (w *jsonWriter) member() {
	if w.inKey {
		w.inKey = false
		return
	}
	if n := len(w.first); n > 0 {
		if !w.first[n-1] {
			w.b.WriteByte(',')
		}
		w.first[n-1] = false
	}
}

func (w *jsonWriter) obj() *jsonWriter {
	w.member()
	w.b.WriteByte('{')
	w.first = append(w.first, true)
	return w
}

func (w *jsonWriter) arr() *jsonWriter {
	w.member()
	w.b.WriteByte('[')
	w.first = append(w.first, true)
	return w
}

func (w *jsonWriter) end() {
	w.b.WriteByte('}')
	w.first = w.first[:len(w.first)-1]
}

func (w *jsonWriter) endArr() {
	w.b.WriteByte(']')
	w.first = w.first[:len(w.first)-1]
}

func (w *jsonWriter) key(k string) *jsonWriter {
	w.member()
	quoteJSON(&w.b, k)
	w.b.WriteByte(':')
	w.inKey = true
	return w
}

func (w *jsonWriter) str(s string) *jsonWriter {
	w.member()
	quoteJSON(&w.b, s)
	return w
}

func (w *jsonWriter) num(n int) *jsonWriter {
	w.member()
	w.b.WriteString(strconv.Itoa(n))
	return w
}

func (w *jsonWriter) String() string { return w.b.String() }

const hexDigits = "0123456789abcdef"

func quoteJSON(b *strings.Builder, s string) {
	b.WriteByte('"')
	for i := 0; i < len(s); {
		r, size := utf8.DecodeRuneInString(s[i:])
		i += size
		switch r {
		case '"':
			b.WriteString(`\"`)
		case '\\':
			b.WriteString(`\\`)
		case '\b':
			b.WriteString(`\b`)
		case '\f':
			b.WriteString(`\f`)
		case '\n':
			b.WriteString(`\n`)
		case '\r':
			b.WriteString(`\r`)
		case '\t':
			b.WriteString(`\t`)
		default:
			if r < 0x20 {
				b.WriteString(`\u00`)
				b.WriteByte(hexDigits[r>>4])
				b.WriteByte(hexDigits[r&0xF])
				continue
			}
			b.WriteRune(r)
		}
	}
	b.WriteByte('"')
}
