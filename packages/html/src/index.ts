import { parseFragment } from 'parse5'
import type { DefaultTreeAdapterMap } from 'parse5'
import { decodeHTML } from 'entities'
import type { Adapter, ExtractedText } from '@faircopy/core'

const SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'kbd', 'samp', 'template', 'svg', 'math', 'noscript'])
const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'br', 'caption', 'dd', 'details', 'div', 'dl', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'section', 'summary', 'table', 'td', 'th', 'tr', 'ul',
])

/** Static visible text only: attributes and URL-looking text are excluded. */
export function html(): Adapter {
  return {
    name: '@faircopy/html',
    extensions: ['.html', '.htm'],
    async extract(_filePath, source) {
      const root = parseFragment(source, { sourceCodeLocationInfo: true })
      const results: ExtractedText[] = []
      let current: ExtractedText = { text: '', sourceMap: [], meta: { type: 'html-prose' } }
      const flush = () => {
        if (current.text.trim()) results.push(current)
        current = { text: '', sourceMap: [], meta: { type: 'html-prose' } }
      }
      const walk = (node: DefaultTreeAdapterMap['node']) => {
        if ('tagName' in node) {
          if (SKIP_TAGS.has(node.tagName) || node.attrs.some(attr =>
            attr.name === 'data-faircopy-ignore' || attr.name === 'hidden' ||
            (attr.name === 'aria-hidden' && attr.value === 'true'))) {
            flush()
            return
          }
          if (BLOCK_TAGS.has(node.tagName)) flush()
        }
        if (node.nodeName === '#text' && 'value' in node && node.sourceCodeLocation) {
          const start = node.sourceCodeLocation.startOffset
          const raw = source.slice(start, node.sourceCodeLocation.endOffset)
          // Decode one reference at a time so each output character still points
          // to its original source, including astral characters and CRLF input.
          const tokens = /&(?:#[xX][\da-fA-F]+;?|#\d+;?|[a-zA-Z][a-zA-Z\d]*;?)|\r\n?|[\s\S]/g
          for (const match of raw.matchAll(tokens)) {
            const text = match[0].startsWith('&') ? decodeHTML(match[0]) : match[0].replace(/\r\n?/, '\n')
            current.text += text
            current.sourceMap.push(...Array.from({ length: text.length }, (_, i) =>
              start + match.index + (text === match[0] ? i : 0)))
          }
        }
        if ('childNodes' in node) node.childNodes.forEach(walk)
        if ('tagName' in node && BLOCK_TAGS.has(node.tagName)) flush()
      }
      walk(root)
      flush()
      // Omit URL spans entirely, with boundaries so rules cannot join phrases
      // across them. Excluded characters must not inflate coverage counts.
      return results.flatMap(segment => {
        const parts: ExtractedText[] = []
        let start = 0
        const push = (end: number) => {
          const text = segment.text.slice(start, end)
          if (text.trim()) parts.push({ ...segment, text, sourceMap: segment.sourceMap.slice(start, end) })
        }
        for (const match of segment.text.matchAll(/(?:(?:https?|ftp):\/\/|www\.|mailto:)[^\s<>]+|\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi)) {
          push(match.index)
          start = match.index + match[0].length
        }
        push(segment.text.length)
        return parts
      })
    },
  }
}
