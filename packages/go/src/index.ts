import type { Adapter, ExtractedText } from '@faircopy/core'

export interface GoMessageCall {
  /** Function or method name whose argument contains user-facing copy. */
  name: string
  /** Zero-based argument index containing the message. */
  argumentIndex: number
}

export interface GoAdapterOptions {
  /** Calls to inspect. Match by the final identifier, so package aliases work. */
  calls: GoMessageCall[]
  /** Formatter function names whose first literal argument should be extracted. Default: Sprintf. */
  formatFunctions?: string[]
}

type Literal = { end: number; text: string; sourceMap: number[] }
type Range = { start: number; end: number }
type CallArguments = { ranges: Range[]; end: number }

const SIMPLE_ESCAPES: Record<string, string> = {
  a: '\x07',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  '\\': '\\',
  '"': '"',
  "'": "'",
}

function skipComment(source: string, start: number): number {
  if (source.startsWith('//', start)) {
    const newline = source.indexOf('\n', start + 2)
    return newline === -1 ? source.length : newline + 1
  }
  if (source.startsWith('/*', start)) {
    const close = source.indexOf('*/', start + 2)
    return close === -1 ? source.length : close + 2
  }
  return start
}

function quotedEnd(source: string, start: number): number {
  const quote = source[start]
  if (quote !== '"' && quote !== '`' && quote !== "'") return start

  if (quote === '`') {
    const close = source.indexOf('`', start + 1)
    return close === -1 ? source.length : close + 1
  }

  for (let index = start + 1; index < source.length; index++) {
    if (source[index] === '\n' || source[index] === '\r') return index
    if (source[index] === '\\') {
      index++
      continue
    }
    if (source[index] === quote) return index + 1
  }
  return source.length
}

function decodeString(source: string, start: number): Literal | null {
  const quote = source[start]
  if (quote !== '"' && quote !== '`') return null

  let index = start + 1
  let text = ''
  const sourceMap: number[] = []
  const append = (value: string, sourceOffset: number) => {
    text += value
    for (let i = 0; i < value.length; i++) sourceMap.push(sourceOffset)
  }

  while (index < source.length) {
    const char = source[index]!
    if (char === quote) return { end: index + 1, text, sourceMap }

    if (quote === '`') {
      // Go discards carriage returns in raw string values.
      if (char !== '\r') append(char, index)
      index++
      continue
    }

    if (char === '\n' || char === '\r') return null
    if (char !== '\\') {
      append(char, index)
      index++
      continue
    }

    const escapeStart = index
    const kind = source[index + 1]
    if (kind === undefined) return null
    let decoded = SIMPLE_ESCAPES[kind]
    let width = 2

    if (kind === 'x') {
      const hex = source.slice(index + 2, index + 4)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) return null
      decoded = String.fromCodePoint(Number.parseInt(hex, 16))
      width = 4
    } else if (kind === 'u' || kind === 'U') {
      const digits = kind === 'u' ? 4 : 8
      const hex = source.slice(index + 2, index + 2 + digits)
      if (!new RegExp(`^[0-9a-fA-F]{${digits}}$`).test(hex)) return null
      const codePoint = Number.parseInt(hex, 16)
      if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return null
      decoded = String.fromCodePoint(codePoint)
      width = 2 + digits
    } else if (/^[0-7]$/.test(kind)) {
      const octal = source.slice(index + 1, index + 4)
      if (!/^[0-7]{3}$/.test(octal)) return null
      const codePoint = Number.parseInt(octal, 8)
      if (codePoint > 0xff) return null
      decoded = String.fromCodePoint(codePoint)
      width = 4
    }

    if (decoded === undefined) return null
    append(decoded, escapeStart)
    index += width
  }

  return null
}

function skipTrivia(source: string, start: number): number {
  let index = start
  while (index < source.length) {
    if (/\s/.test(source[index]!)) {
      index++
      continue
    }
    const afterComment = skipComment(source, index)
    if (afterComment !== index) {
      index = afterComment
      continue
    }
    break
  }
  return index
}

function isIdentifierStart(char: string | undefined): boolean {
  return char === '_' || /\p{L}/u.test(char ?? '')
}

function isIdentifierPart(char: string | undefined): boolean {
  return char === '_' || /[\p{L}\p{N}]/u.test(char ?? '')
}

function readCallee(source: string, start: number): { name: string; end: number } | null {
  if (!isIdentifierStart(source[start])) return null
  let index = start
  let finalName = ''

  while (true) {
    if (!isIdentifierStart(source[index])) break
    const segmentStart = index++
    while (isIdentifierPart(source[index])) index++
    finalName = source.slice(segmentStart, index)
    if (source[index] !== '.' || !isIdentifierStart(source[index + 1])) break
    index++
  }

  return { name: finalName, end: index }
}

function callArguments(source: string, openParen: number): CallArguments | null {
  const args: Range[] = []
  const depth = { paren: 0, bracket: 0, brace: 0 }
  let argumentStart = openParen + 1

  for (let index = argumentStart; index < source.length;) {
    const afterComment = skipComment(source, index)
    if (afterComment !== index) {
      index = afterComment
      continue
    }

    const char = source[index]!
    if (char === '"' || char === '`' || char === "'") {
      index = quotedEnd(source, index)
      continue
    }

    if (char === '(') depth.paren++
    else if (char === ')') {
      if (depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
        if (argumentStart < index || args.length > 0) args.push({ start: argumentStart, end: index })
        return { ranges: args, end: index + 1 }
      }
      depth.paren--
    } else if (char === '[') depth.bracket++
    else if (char === ']') depth.bracket--
    else if (char === '{') depth.brace++
    else if (char === '}') depth.brace--
    else if (char === ',' && depth.paren === 0 && depth.bracket === 0 && depth.brace === 0) {
      args.push({ start: argumentStart, end: index })
      argumentStart = index + 1
    }
    index++
  }

  return null
}

function literalArgument(source: string, range: Range, formatFunctions: Set<string>): Literal | null {
  const start = skipTrivia(source, range.start)
  if (source[start] === '"' || source[start] === '`') {
    const literal = decodeString(source, start)
    return literal && skipTrivia(source, literal.end) === range.end ? literal : null
  }

  const callee = readCallee(source, start)
  if (!callee || !formatFunctions.has(callee.name)) return null
  const openParen = skipTrivia(source, callee.end)
  if (source[openParen] !== '(') return null
  const call = callArguments(source, openParen)
  if (!call?.ranges.length || skipTrivia(source, call.end) !== range.end) return null

  const formatRange = call.ranges[0]!
  const formatStart = skipTrivia(source, formatRange.start)
  if (source[formatStart] !== '"' && source[formatStart] !== '`') return null
  const literal = decodeString(source, formatStart)
  return literal && skipTrivia(source, literal.end) === formatRange.end ? literal : null
}

function extractMessages(
  source: string,
  calls: Map<string, number>,
  formatFunctions: Set<string>,
): ExtractedText[] {
  const extractions: ExtractedText[] = []

  for (let index = 0; index < source.length;) {
    const afterComment = skipComment(source, index)
    if (afterComment !== index) {
      index = afterComment
      continue
    }

    const char = source[index]!
    if (char === '"' || char === '`' || char === "'") {
      index = quotedEnd(source, index)
      continue
    }

    const callee = readCallee(source, index)
    if (!callee) {
      index++
      continue
    }

    const argumentIndex = calls.get(callee.name)
    if (argumentIndex !== undefined) {
      const openParen = skipTrivia(source, callee.end)
      if (source[openParen] === '(') {
        const call = callArguments(source, openParen)
        const range = call?.ranges[argumentIndex]
        const message = range ? literalArgument(source, range, formatFunctions) : null
        if (message?.text.trim()) {
          extractions.push({
            text: message.text,
            sourceMap: message.sourceMap,
            meta: { type: 'go-message', function: callee.name, argumentIndex },
          })
        }
      }
    }

    index = callee.end
  }

  return extractions.sort((left, right) => (left.sourceMap[0] ?? 0) - (right.sourceMap[0] ?? 0))
}

export function go(options: GoAdapterOptions): Adapter {
  const calls = new Map(options.calls.map(({ name, argumentIndex }) => [name.split('.').at(-1)!, argumentIndex]))
  const formatFunctions = new Set((options.formatFunctions ?? ['Sprintf']).map(name => name.split('.').at(-1)!))

  return {
    name: '@faircopy/go',
    extensions: ['.go'],
    async extract(_filePath, source) {
      return extractMessages(source, calls, formatFunctions)
    },
  }
}
