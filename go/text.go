package faircopy

import (
	"strings"
	"unicode/utf8"
)

// JavaScript strings are UTF-16. Every range Fair Copy reports, every length
// limit and the bounded regex repetitions in the default rules count UTF-16
// code units, so the engine keeps two views of the text:
//
//   - the text itself, for the Unicode-aware (/u) phrase patterns;
//   - a "unit string" where each UTF-16 code unit is one rune, for the
//     patterns JavaScript runs without /u. A character outside the BMP becomes
//     two private-use runes standing in for its surrogates: like lone
//     surrogates they are not letters, digits, spaces or punctuation.
//
// In the unit string a rune index is a UTF-16 offset.

const (
	highStandIn = 0xF0000 // + (high surrogate - 0xD800): plane-15 private use
	lowStandIn  = 0xF0400 // + (low surrogate - 0xDC00)
)

type jsText struct {
	s     string // the text
	units string // one rune per UTF-16 unit
	// unitAt[i] is the UTF-16 offset of byte i of s (len(s)+1 entries).
	unitAt []int
	// uByteAt[k] is the byte offset in units of UTF-16 offset k.
	uByteAt []int
	n       int // UTF-16 length
}

func newJSText(s string) *jsText {
	t := &jsText{s: s, unitAt: make([]int, len(s)+1)}
	var b strings.Builder
	b.Grow(len(s))
	u := 0
	for i := 0; i < len(s); {
		// An invalid byte decodes as U+FFFD (one unit), as the JS host sees it.
		r, size := utf8.DecodeRuneInString(s[i:])
		for j := 0; j < size; j++ {
			t.unitAt[i+j] = u
		}
		i += size
		if r >= 0x10000 {
			r -= 0x10000
			b.WriteRune(highStandIn + (r >> 10))
			b.WriteRune(lowStandIn + (r & 0x3FF))
			u += 2
		} else {
			b.WriteRune(r)
			u++
		}
	}
	t.unitAt[len(s)] = u
	t.n = u
	t.units = b.String()
	t.uByteAt = make([]int, 0, u+1)
	for i := range t.units {
		t.uByteAt = append(t.uByteAt, i)
	}
	t.uByteAt = append(t.uByteAt, len(t.units))
	return t
}

// unit converts a byte offset in units to a UTF-16 offset.
func (t *jsText) unitOfUnitsByte(b int) int {
	// uByteAt is sorted; binary search.
	lo, hi := 0, len(t.uByteAt)-1
	for lo < hi {
		mid := (lo + hi) / 2
		if t.uByteAt[mid] < b {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

// utf16Len is String.prototype.length.
func utf16Len(s string) int {
	n := 0
	for _, r := range s {
		if r >= 0x10000 {
			n += 2
		} else {
			n++
		}
	}
	return n
}

// utf8ByteLength mirrors the bundle's utf8ByteLength over a JS string. For a
// valid Go string that is len(s); an invalid byte becomes U+FFFD (3 bytes),
// as it does when the host hands the string to JavaScript.
func utf8ByteLength(s string) int {
	if utf8.ValidString(s) {
		return len(s)
	}
	n := 0
	for _, r := range s {
		n += utf8.RuneLen(r)
	}
	return n
}

// jsSpace is the set JavaScript's \s matches. Go's \s is ASCII only.
const jsSpace = `\t\n\x{0b}\f\r \x{a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}`

func isJSSpace(r rune) bool {
	switch r {
	case '\t', '\n', '\v', '\f', '\r', ' ', 0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff:
		return true
	}
	return r >= 0x2000 && r <= 0x200a
}
