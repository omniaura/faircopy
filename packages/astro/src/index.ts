import { parse } from '@astrojs/compiler'
import type { Adapter, ExtractedText } from '@faircopy/core'

export interface AstroAdapterOptions {
  /** Frontmatter const identifiers whose string values should be linted. */
  proseIdentifiers?: string[]
  /** Lint specific HTML attribute values (alt, aria-label, etc.). Default false. */
  lintAttributes?: boolean | { attributes: string[] }
  /** Lint JSX expression string literals { 'like this' }. Default true. */
  lintExpressionStrings?: boolean
}

type AstroNode = {
  type?: string
  name?: string
  value?: string
  position?: { start?: { offset?: number }; end?: { offset?: number } }
  children?: AstroNode[]
  attributes?: AstroNode[]
}

const DEFAULT_PROSE_IDENTIFIERS = new Set([
  'title', 'description', 'subtitle', 'tagline', 'lede',
  'metaDescription', 'ogTitle', 'ogDescription', 'heading',
])

// Tags whose content should never be linted
const SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'kbd'])

export function astro(options: AstroAdapterOptions = {}): Adapter {
  const proseIds = new Set([
    ...DEFAULT_PROSE_IDENTIFIERS,
    ...(options.proseIdentifiers ?? []),
  ])

  return {
    name: '@faircopy/astro',
    extensions: ['.astro'],

    async extract(_filePath, source): Promise<ExtractedText[]> {
      let parsed: { ast: AstroNode }
      try {
        parsed = await parse(source, { position: true }) as { ast: AstroNode }
      } catch {
        return []
      }

      const extractions: ExtractedText[] = []

      // Collect byte ranges to skip (skip-tag contents + data-faircopy-ignore subtrees)
      const skipRanges: Array<{ start: number; end: number }> = []
      walkAst(parsed.ast, (node) => {
        if (node.type !== 'element') return
        const tag = node.name?.toLowerCase() ?? ''
        const hasIgnore = node.attributes?.some(a => a.name === 'data-faircopy-ignore')
        if (SKIP_TAGS.has(tag) || hasIgnore) {
          const start = node.position?.start?.offset
          const end = node.position?.end?.offset
          if (typeof start === 'number' && typeof end === 'number') {
            skipRanges.push({ start, end })
          }
        }
      })

      const inSkip = (offset: number) =>
        skipRanges.some(r => offset >= r.start && offset < r.end)

      // Extract template text nodes
      walkAst(parsed.ast, (node) => {
        if (node.type !== 'text') return
        const offset = node.position?.start?.offset
        if (typeof offset !== 'number') return
        if (inSkip(offset)) return

        const text = node.value ?? ''
        if (!text.trim()) return

        extractions.push({
          text,
          sourceMap: buildSourceMap(text, offset),
          meta: { type: 'text-node' },
        })
      })

      // Extract frontmatter string literals for configured identifiers
      walkAst(parsed.ast, (node) => {
        if (node.type !== 'frontmatter') return
        const fm = node.value ?? ''
        if (!fm.trim()) return

        // Find where the frontmatter content sits in the source
        const searchFrom = (node.position?.start?.offset ?? 0) + 3 // skip ---
        const fmBaseOffset = source.indexOf(fm, searchFrom)
        if (fmBaseOffset === -1) return

        extractFrontmatterStrings(fm, fmBaseOffset, proseIds, extractions)
      })

      return extractions
    },
  }
}

/**
 * Build a per-character source map for a substring starting at `startOffset`.
 * The map is character-index based (matching @astrojs/compiler's offsets).
 */
function buildSourceMap(text: string, startOffset: number): number[] {
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    map.push(startOffset + i)
  }
  return map
}

function extractFrontmatterStrings(
  fm: string,
  baseOffset: number,
  proseIds: Set<string>,
  extractions: ExtractedText[],
): void {
  // Match: const/let/var identifier = "string" or 'string'
  const re = /\b(?:const|let|var)\s+(\w+)\s*=\s*(["'])((?:[^\\]|\\.)*?)\2/g
  let m: RegExpExecArray | null
  while ((m = re.exec(fm)) !== null) {
    const [fullMatch, id, , value] = m
    if (!id || !value?.trim()) continue
    if (!proseIds.has(id)) continue

    // Offset of the opening quote within fm, then +1 to skip the quote itself
    const quoteIdx = m.index + fullMatch!.indexOf(m[2]!) + 1
    extractions.push({
      text: value,
      sourceMap: buildSourceMap(value, baseOffset + quoteIdx),
      meta: { type: 'frontmatter', identifier: id },
    })
  }
}

function walkAst(node: AstroNode, visit: (node: AstroNode) => void): void {
  if (!node || typeof node !== 'object') return
  visit(node)
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkAst(child, visit)
  }
}
