import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { frontmatter } from 'micromark-extension-frontmatter'
import { gfm } from 'micromark-extension-gfm'
import { decodeString } from 'micromark-util-decode-string'
import type { Nodes } from 'mdast'
import { html } from '@faircopy/html'
import type { Adapter, ExtractedText } from '@faircopy/core'

/** CommonMark + GFM prose. MDX is intentionally not claimed as supported. */
export function markdown(): Adapter {
  const htmlAdapter = html()
  return {
    name: '@faircopy/markdown',
    extensions: ['.md', '.markdown'],
    async extract(filePath, source) {
      const root = fromMarkdown(source, {
        extensions: [frontmatter(['yaml', 'toml']), gfm()],
        mdastExtensions: [
          frontmatterFromMarkdown(['yaml', 'toml']),
          // The GFM autolink postprocessor synthesizes positionless text/link
          // nodes inside emphasis. Keep tokenizer positions and omit those
          // rewrites: URL-looking text is excluded by the HTML prose pass.
          gfmFromMarkdown().map(extension => ({ ...extension, transforms: [] })),
        ],
      })
      const results: ExtractedText[] = []
      const walk = async (node: Nodes): Promise<void> => {
        if (node.type === 'html') {
          const start = node.position!.start.offset!
          for (const segment of await htmlAdapter.extract(filePath, node.value)) {
            results.push({ ...segment, sourceMap: segment.sourceMap.map(offset => offset + start) })
          }
          return
        }
        if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell') {
          // Parse inline HTML as one fragment so code/ignored subtrees can span
          // several mdast nodes. Escape Markdown text to keep it literal HTML.
          let fragment = ''
          const fragmentMap: number[] = []
          const append = (text: string, offsets: number[], escape: boolean) => {
            for (let i = 0; i < text.length; i++) {
              const encoded = escape ? ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[text[i]!] ?? text[i]!) : text[i]!
              fragment += encoded
              fragmentMap.push(...Array(encoded.length).fill(offsets[i]!))
            }
          }
          const inline = (child: Nodes) => {
            const start = child.position!.start.offset!
            const end = child.position!.end.offset!
            if (child.type === 'text') {
              const text = child.value.replace(/\r\n?/g, '\n')
              const raw = source.slice(start, end)
              const decoded: string[] = []
              const offsets: number[] = []
              for (const match of raw.matchAll(/\\[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]|&(?:#x[\da-f]+|#\d+|[a-z][a-z\d]+);|\r\n?|[\s\S]/gi)) {
                const value = decodeString(match[0]).replace(/\r\n?/, '\n')
                for (let i = 0; i < value.length; i++) {
                  decoded.push(value[i]!)
                  offsets.push(start + match.index + (value === match[0] ? i : 0))
                }
              }
              // mdast removes block quote/list continuation prefixes from text.
              // Align its decoded value to the original token stream, backwards
              // within each line so those prefixes cannot steal a word's offset.
              const map: number[] = Array(text.length)
              let cursor = decoded.length - 1
              for (let i = text.length - 1; i >= 0; i--) {
                while (cursor >= 0 && decoded[cursor] !== text[i]) cursor--
                if (cursor < 0) throw new Error(`Cannot map Markdown text in ${filePath} at ${start}`)
                map[i] = offsets[cursor--]!
              }
              append(text, map, true)
            } else if (child.type === 'html') {
              append(child.value, Array.from({ length: child.value.length }, (_, i) => start + i), false)
            } else if (child.type === 'inlineCode' || child.type === 'image' || child.type === 'imageReference') {
              // A boundary prevents rules inventing phrases across omitted code.
              append('<code></code>', Array(13).fill(start), false)
            } else if (child.type === 'break') {
              append('\n', [start], true)
            } else if ('children' in child) {
              child.children.forEach(inline)
            }
          }
          node.children.forEach(inline)
          for (const segment of await htmlAdapter.extract(filePath, fragment)) {
            results.push({
              text: segment.text,
              sourceMap: segment.sourceMap.map(offset => fragmentMap[offset]!),
              meta: { type: `markdown-${node.type}` },
            })
          }
          return
        }
        if ('children' in node) for (const child of node.children) await walk(child)
      }
      await walk(root)
      return results
    },
  }
}
