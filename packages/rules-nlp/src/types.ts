export interface JsonOffsetTerm {
  text?: string
  offset?: { start?: number; length?: number }
  tags?: string[]
}

export interface JsonOffsetEntry {
  text?: string
  offset?: { start?: number; length?: number }
  terms?: JsonOffsetTerm[]
}

export interface ValuesView extends MatchView {
  toNumber(): ValuesView
  out(format?: string): string[]
}

export interface MatchView {
  json(options?: unknown): JsonOffsetEntry[]
  values?(): ValuesView
}

export interface VerbView extends MatchView {
  json(options?: unknown): JsonOffsetEntry[]
}

export interface DocView extends MatchView {
  match(pattern: string): MatchView
  sentences(): MatchView
  terms(): MatchView
  verbs(): VerbView
}
