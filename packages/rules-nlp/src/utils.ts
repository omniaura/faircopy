import nlp from 'compromise'
import type { Diagnostic } from '@faircopy/core'
import type { DocView, JsonOffsetEntry, JsonOffsetTerm, MatchView } from './types.js'

export interface MatchOccurrence {
  text: string
  start: number
  end: number
}

export function createDoc(text: string): DocView {
  return nlp(text) as unknown as DocView
}

export function getMatchOccurrences(text: string, matches: MatchView): MatchOccurrence[] {
  const json = matches.json({ offset: true, text: true, terms: { offset: true } }) as JsonOffsetEntry[]

  return json.flatMap((entry) => {
    const start = entry.offset?.start ?? entry.terms?.[0]?.offset?.start
    const length = entry.offset?.length ?? sumTermLengths(entry.terms)

    if (typeof start !== 'number' || typeof length !== 'number' || length <= 0) {
      return []
    }

    return [{
      text: entry.text ?? text.slice(start, start + length),
      start,
      end: start + length,
    }]
  })
}

export function getOccurrenceRange(sourceMap: number[], occurrence: MatchOccurrence): Diagnostic['range'] | null {
  const start = sourceMap[occurrence.start]
  const end = sourceMap[occurrence.end - 1]
  if (start === undefined || end === undefined) return null

  return { start, end: end + 1 }
}

function sumTermLengths(terms: JsonOffsetTerm[] | undefined): number | undefined {
  if (!terms?.length) return undefined

  let total = 0
  for (const term of terms) {
    const length = term.offset?.length
    if (typeof length !== 'number') return undefined
    total += length
  }

  return total
}
