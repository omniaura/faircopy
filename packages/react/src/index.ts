import { parse } from '@babel/parser'
import * as t from '@babel/types'
import type { Adapter, ExtractedText } from '@faircopy/core'

export interface ReactAdapterOptions {
  /** Lint string literals in JSX expression containers { 'like this' }. Default true. */
  lintExpressionStrings?: boolean
  /** Lint prose-named JSX attribute string values. Default true. */
  lintProseProps?: boolean | { props: string[] }
  /** Tags whose subtrees should be skipped entirely. */
  skipTags?: string[]
}

const DEFAULT_PROSE_PROPS = new Set([
  'label',
  'placeholder',
  'alt',
  'title',
  'aria-label',
  'aria-description',
  'tooltip',
  'description',
])

const DEFAULT_SKIP_TAGS = new Set(['script', 'style', 'code', 'pre', 'kbd'])

function buildSourceMap(text: string, startOffset: number): number[] {
  return Array.from({ length: text.length }, (_, i) => startOffset + i)
}

function getTagName(node: t.JSXOpeningElement): string | null {
  const { name } = node
  if (t.isJSXIdentifier(name)) return name.name
  if (t.isJSXMemberExpression(name)) return null // component, not a DOM tag
  return null
}

function hasIgnoreAttr(node: t.JSXOpeningElement): boolean {
  return node.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === 'data-faircopy-ignore',
  )
}

function getAttrName(attr: t.JSXAttribute): string | null {
  if (t.isJSXIdentifier(attr.name)) return attr.name.name
  if (t.isJSXNamespacedName(attr.name)) {
    return `${attr.name.namespace.name}:${attr.name.name.name}`
  }
  return null
}

function walkJSX(
  node: t.Node,
  extractions: ExtractedText[],
  opts: {
    lintExpressionStrings: boolean
    proseProps: Set<string> | false
    skipTags: Set<string>
  },
  skipping: boolean,
): void {
  if (t.isJSXElement(node)) {
    const opening = node.openingElement
    const tagName = getTagName(opening)?.toLowerCase() ?? null

    const shouldSkip =
      skipping ||
      (tagName !== null && opts.skipTags.has(tagName)) ||
      hasIgnoreAttr(opening)

    // Extract prose attributes (even at top level, before deciding to skip children)
    if (!shouldSkip && opts.proseProps !== false) {
      for (const attr of opening.attributes) {
        if (!t.isJSXAttribute(attr)) continue
        const name = getAttrName(attr)
        if (name === null || !opts.proseProps.has(name)) continue
        const val = attr.value
        if (!t.isStringLiteral(val)) continue
        const start = val.start
        if (start === null || start === undefined) continue
        const text = val.value
        if (!text.trim()) continue
        extractions.push({
          text,
          sourceMap: buildSourceMap(text, start + 1),
          meta: { type: 'jsx-attr', prop: name },
        })
      }
    }

    // Recurse into children
    for (const child of node.children) {
      walkJSX(child, extractions, opts, shouldSkip)
    }
    return
  }

  if (t.isJSXText(node)) {
    if (skipping) return
    const text = node.value
    if (!text.trim()) return
    const start = node.start
    if (start === null || start === undefined) return
    extractions.push({
      text,
      sourceMap: buildSourceMap(text, start),
      meta: { type: 'jsx-text' },
    })
    return
  }

  if (t.isJSXExpressionContainer(node)) {
    if (skipping) return
    if (!opts.lintExpressionStrings) return
    const expr = node.expression
    if (!t.isStringLiteral(expr)) return
    const start = expr.start
    if (start === null || start === undefined) return
    const text = expr.value
    if (!text.trim()) return
    extractions.push({
      text,
      sourceMap: buildSourceMap(text, start + 1),
      meta: { type: 'jsx-expression-string' },
    })
    return
  }

  if (t.isJSXFragment(node)) {
    for (const child of node.children) {
      walkJSX(child, extractions, opts, skipping)
    }
    return
  }
}

function isNode(value: unknown): value is t.Node {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    typeof (value as Record<string, unknown>)['type'] === 'string'
  )
}

function walkFile(
  node: t.Node,
  extractions: ExtractedText[],
  opts: {
    lintExpressionStrings: boolean
    proseProps: Set<string> | false
    skipTags: Set<string>
  },
): void {
  if (t.isJSXElement(node) || t.isJSXFragment(node)) {
    walkJSX(node, extractions, opts, false)
    return
  }

  // Recurse into any non-JSX node's children
  for (const key of Object.keys(node)) {
    const value = (node as unknown as Record<string, unknown>)[key]
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) {
          walkFile(child, extractions, opts)
        }
      }
    } else if (isNode(value)) {
      walkFile(value, extractions, opts)
    }
  }
}

export function react(options: ReactAdapterOptions = {}): Adapter {
  const lintExpressionStrings = options.lintExpressionStrings ?? true
  const skipTags = new Set([...DEFAULT_SKIP_TAGS, ...(options.skipTags ?? [])])

  const proseProps: Set<string> | false =
    options.lintProseProps === false
      ? false
      : options.lintProseProps !== null && typeof options.lintProseProps === 'object'
        ? new Set(options.lintProseProps.props)
        : new Set(DEFAULT_PROSE_PROPS)

  return {
    name: '@faircopy/react',
    extensions: ['.tsx', '.jsx'],

    async extract(_filePath, source): Promise<ExtractedText[]> {
      let ast: t.File
      try {
        ast = parse(source, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        })
      } catch {
        return []
      }

      const extractions: ExtractedText[] = []
      const opts = { lintExpressionStrings, proseProps, skipTags }

      walkFile(ast.program, extractions, opts)

      return extractions
    },
  }
}
