export interface ScoreSummary {
  count: number
  average: number | null
  min: number | null
  max: number | null
}

export function summarizeScores(scores: readonly number[]): ScoreSummary {
  if (!scores.length) return { count: 0, average: null, min: null, max: null }
  return {
    count: scores.length,
    average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
    min: Math.min(...scores),
    max: Math.max(...scores),
  }
}

/** One decimal, or an em dash when there is no data. */
export function formatAverage(value: number | null): string {
  return value == null ? '—' : value.toFixed(1)
}

/** "3–8", or an em dash when there is no data. */
export function formatRange(summary: ScoreSummary): string {
  return summary.min == null || summary.max == null ? '—' : `${summary.min}–${summary.max}`
}
