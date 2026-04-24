export interface JsonOffsetTerm {
  offset?: { start?: number; length?: number }
}

export interface JsonOffsetEntry {
  text?: string
  offset?: { start?: number; length?: number }
  terms?: JsonOffsetTerm[]
}

export interface MatchView {
  json(options?: unknown): JsonOffsetEntry[]
}

export interface DocView extends MatchView {
  match(pattern: string): MatchView
}
