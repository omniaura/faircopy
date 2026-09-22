import type { Adapter, ExtractedText } from '@faircopy/core'

export interface TemplAdapterOptions {
  /** Lint Go string literals that look like prose. Default true. */
  lintGoStrings?: boolean
  /** Lint prose-bearing HTML attributes. Default true. */
  lintAttributes?: boolean | { attributes: string[] }
  /** Additional HTML tags whose contents should be skipped. */
  skipTags?: string[]
}

type Range = { start: number; end: number }

type Tag = Range & {
  name: string | null
  closing: boolean
  selfClosing: boolean
  source: string
}

const DEFAULT_PROSE_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'placeholder',
  'title',
])

const DEFAULT_SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'kbd'])
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

function mappedText(source: string, start: number, end: number, meta: Record<string, unknown>): ExtractedText | null {
  const raw = source.slice(start, end)
  const leading = raw.length - raw.trimStart().length
  const trailing = raw.length - raw.trimEnd().length
  const textStart = start + leading
  const textEnd = end - trailing
  const text = source.slice(textStart, textEnd)

  if (!looksLikeProse(text)) return null

  return {
    text,
    sourceMap: Array.from({ length: text.length }, (_, index) => textStart + index),
    meta,
  }
}

function looksLikeProse(text: string): boolean {
  const value = text.trim()
  if (!value || !/\p{L}/u.test(value)) return false
  if (/^(?:https?:|mailto:|tel:|file:|cid:|#)/i.test(value)) return false
  if (/^[\w./:@-]+$/.test(value) && !/^\p{L}+[.!?]?$/u.test(value)) return false
  if (value.includes(';') && /(?:^|\s)[a-z-]+\s*:/.test(value)) return false
  return true
}

function findTag(source: string, start: number): Tag | null {
  if (source.startsWith('<!--', start)) {
    const close = source.indexOf('-->', start + 4)
    return {
      start,
      end: close === -1 ? source.length : close + 3,
      name: null,
      closing: false,
      selfClosing: true,
      source: source.slice(start, close === -1 ? source.length : close + 3),
    }
  }

  const head = source.slice(start).match(/^<\s*(\/)?\s*([A-Za-z][\w:-]*)\b/)
  if (!head) {
    if (!/^<![A-Za-z]/.test(source.slice(start))) return null
  }

  let quote: string | null = null
  let escaped = false
  let braceDepth = 0
  for (let index = start + 1; index < source.length; index++) {
    const char = source[index]!
    if (quote !== null) {
      if (quote !== '`' && !escaped && char === '\\') {
        escaped = true
        continue
      }
      if (!escaped && char === quote) quote = null
      escaped = false
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === '{') {
      braceDepth++
      continue
    }
    if (char === '}' && braceDepth > 0) {
      braceDepth--
      continue
    }
    if (char !== '>' || braceDepth !== 0) continue

    const end = index + 1
    const tagSource = source.slice(start, end)
    return {
      start,
      end,
      name: head?.[2]?.toLowerCase() ?? null,
      closing: Boolean(head?.[1]),
      selfClosing: /\/\s*>$/.test(tagSource),
      source: tagSource,
    }
  }
  return null
}

function tagsIn(source: string): Tag[] {
  const tags: Tag[] = []
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '<') continue
    const tag = findTag(source, index)
    if (!tag) continue
    tags.push(tag)
    index = tag.end - 1
  }
  return tags
}

function splitVisibleText(source: string, start: number, end: number): Range[] {
  const ranges: Range[] = []
  let chunkStart = start
  let index = start

  const flush = (chunkEnd: number) => {
    if (chunkStart < chunkEnd) ranges.push({ start: chunkStart, end: chunkEnd })
  }

  while (index < end) {
    if (source.startsWith('{/*', index)) {
      flush(index)
      const close = source.indexOf('*/}', index + 3)
      index = close === -1 || close >= end ? end : close + 3
      chunkStart = index
      continue
    }

    if (source[index] === '{') {
      flush(index)
      index = skipBalanced(source, index, '{', '}', end)
      chunkStart = index
      continue
    }

    if (source[index] === '@') {
      flush(index)
      index++
      while (index < end && /[\w.]/.test(source[index]!)) index++
      while (index < end && /\s/.test(source[index]!)) index++
      if (source[index] === '(') index = skipBalanced(source, index, '(', ')', end)
      chunkStart = index
      continue
    }

    index++
  }
  flush(end)

  return ranges.flatMap((range) => {
    const lines: Range[] = []
    let lineStart = range.start
    for (let cursor = range.start; cursor <= range.end; cursor++) {
      if (cursor !== range.end && source[cursor] !== '\n') continue
      const lineEnd = cursor
      const value = source.slice(lineStart, lineEnd).trim()
      const isControlLine = /^(?:(?:if|for|switch)\b.*\{|(?:case\b.*|default)\s*:|else(?:\s+if\b.*)?\s*\{|[{}]+)$/.test(value)
      if (value && !isControlLine) {
        lines.push({ start: lineStart, end: lineEnd })
      }
      lineStart = cursor + 1
    }
    return lines
  })
}

function skipBalanced(source: string, start: number, open: string, close: string, limit = source.length): number {
  let depth = 0
  let quote: string | null = null
  let escaped = false
  for (let index = start; index < limit; index++) {
    const char = source[index]!
    if (quote !== null) {
      if (quote !== '`' && !escaped && char === '\\') {
        escaped = true
        continue
      }
      if (!escaped && char === quote) quote = null
      escaped = false
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === open) depth++
    if (char === close && --depth === 0) return index + 1
  }
  return limit
}

function extractAttribute(tag: Tag, name: string): { text: string; sourceMap: number[] } | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'is')
  const match = pattern.exec(tag.source)
  if (!match?.[2]) return null
  const value = match[2]
  if (!looksLikeProse(value)) return null
  const quotedValue = `${match[1]}${match[2]}${match[1]}`
  const valueOffset = match.index + match[0].lastIndexOf(quotedValue) + 1
  const start = tag.start + valueOffset
  return {
    text: value,
    sourceMap: Array.from({ length: value.length }, (_, index) => start + index),
  }
}

function extractHtml(
  source: string,
  tags: Tag[],
  proseAttributes: Set<string> | false,
  skipTags: Set<string>,
): { extractions: ExtractedText[]; visibleRanges: Range[]; skipRanges: Range[] } {
  const extractions: ExtractedText[] = []
  const visibleRanges: Range[] = []
  const skipRanges: Range[] = []
  const stack: Array<{ name: string; skip: boolean; start: number }> = []
  let previousEnd = 0

  for (const tag of tags) {
    const skipping = stack.some(entry => entry.skip)
    if (stack.length > 0 && !skipping && previousEnd < tag.start) {
      for (const range of splitVisibleText(source, previousEnd, tag.start)) {
        const extracted = mappedText(source, range.start, range.end, { type: 'html-text' })
        if (extracted) {
          extractions.push(extracted)
          visibleRanges.push({
            start: extracted.sourceMap[0]!,
            end: extracted.sourceMap.at(-1)! + 1,
          })
        }
      }
    }

    if (tag.name && !tag.closing && !skipping && proseAttributes !== false) {
      for (const attribute of proseAttributes) {
        const extracted = extractAttribute(tag, attribute)
        if (!extracted) continue
        extractions.push({ ...extracted, meta: { type: 'html-attribute', attribute } })
      }
    }

    if (tag.name && tag.closing) {
      const match = stack.map(entry => entry.name).lastIndexOf(tag.name)
      if (match !== -1) {
        for (const entry of stack.slice(match)) {
          if (entry.skip) skipRanges.push({ start: entry.start, end: tag.end })
        }
        stack.splice(match)
      }
    } else if (tag.name && !tag.selfClosing && !VOID_TAGS.has(tag.name)) {
      const ignored = /\bdata-faircopy-ignore(?:\s|=|>|\/)/i.test(tag.source)
      stack.push({ name: tag.name, skip: skipTags.has(tag.name) || ignored, start: tag.start })
    }

    previousEnd = tag.end
  }

  for (const entry of stack) {
    if (entry.skip) skipRanges.push({ start: entry.start, end: source.length })
  }

  return { extractions, visibleRanges, skipRanges }
}

function inside(offset: number, ranges: Range[]): boolean {
  return ranges.some(range => offset >= range.start && offset < range.end)
}

function decodeGoString(source: string, start: number, quote: '"' | '`'): { end: number; text: string; sourceMap: number[] } {
  let index = start + 1
  let text = ''
  const sourceMap: number[] = []

  while (index < source.length) {
    if (source[index] === quote) return { end: index + 1, text, sourceMap }

    if (quote === '`' || source[index] !== '\\') {
      text += source[index]
      sourceMap.push(index)
      index++
      continue
    }

    const escapeStart = index
    const kind = source[index + 1]
    const simple: Record<string, string> = {
      a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v',
      '\\': '\\', '"': '"', "'": "'",
    }
    let decoded: string | undefined = kind === undefined ? undefined : simple[kind]
    let width = 2

    if (kind === 'x' && /^[0-9A-Fa-f]{2}$/.test(source.slice(index + 2, index + 4))) {
      decoded = String.fromCodePoint(Number.parseInt(source.slice(index + 2, index + 4), 16))
      width = 4
    } else if ((kind === 'u' || kind === 'U') && new RegExp(`^[0-9A-Fa-f]{${kind === 'u' ? 4 : 8}}$`).test(
      source.slice(index + 2, index + (kind === 'u' ? 6 : 10)),
    )) {
      width = kind === 'u' ? 6 : 10
      const codePoint = Number.parseInt(source.slice(index + 2, index + width), 16)
      decoded = codePoint <= 0x10FFFF && !(codePoint >= 0xD800 && codePoint <= 0xDFFF)
        ? String.fromCodePoint(codePoint)
        : undefined
    } else if (kind && /^[0-7]{3}$/.test(source.slice(index + 1, index + 4))) {
      width = 4
      decoded = String.fromCodePoint(Number.parseInt(source.slice(index + 1, index + width), 8))
    }

    if (decoded === undefined) {
      decoded = source.slice(index, Math.min(index + width, source.length))
      width = decoded.length
    }
    text += decoded
    sourceMap.push(...Array.from({ length: decoded.length }, () => escapeStart))
    index += width
  }

  return { end: source.length, text, sourceMap }
}

function extractGoStrings(source: string, tagRanges: Range[], visibleRanges: Range[], skipRanges: Range[]): ExtractedText[] {
  const extractions: ExtractedText[] = []
  for (let index = 0; index < source.length;) {
    if (inside(index, tagRanges) || inside(index, skipRanges)) {
      index++
      continue
    }
    if (source.startsWith('//', index)) {
      const newline = source.indexOf('\n', index + 2)
      index = newline === -1 ? source.length : newline + 1
      continue
    }
    if (source.startsWith('/*', index)) {
      const close = source.indexOf('*/', index + 2)
      index = close === -1 ? source.length : close + 2
      continue
    }
    const quote = source[index]
    if (quote !== '"' && quote !== '`') {
      index++
      continue
    }

    const decoded = decodeGoString(source, index, quote)
    const contentStart = index + 1
    if (!inside(contentStart, visibleRanges) && looksLikeProse(decoded.text)) {
      extractions.push({
        text: decoded.text,
        sourceMap: decoded.sourceMap,
        meta: { type: 'go-string', quote: quote === '`' ? 'raw' : 'interpreted' },
      })
    }
    index = decoded.end
  }
  return extractions
}

export function templ(options: TemplAdapterOptions = {}): Adapter {
  const skipTags = new Set([...DEFAULT_SKIP_TAGS, ...(options.skipTags ?? []).map(tag => tag.toLowerCase())])
  const proseAttributes: Set<string> | false = options.lintAttributes === false
    ? false
    : typeof options.lintAttributes === 'object'
      ? new Set(options.lintAttributes.attributes.map(attribute => attribute.toLowerCase()))
      : new Set(DEFAULT_PROSE_ATTRIBUTES)

  return {
    name: '@faircopy/templ',
    extensions: ['.templ'],

    async extract(_filePath, source): Promise<ExtractedText[]> {
      const tags = tagsIn(source)
      const html = extractHtml(source, tags, proseAttributes, skipTags)
      const goStrings = options.lintGoStrings === false
        ? []
        : extractGoStrings(source, tags, html.visibleRanges, html.skipRanges)

      return [...html.extractions, ...goStrings].sort(
        (left, right) => (left.sourceMap[0] ?? 0) - (right.sourceMap[0] ?? 0),
      )
    },
  }
}
