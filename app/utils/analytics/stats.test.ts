import { describe, expect, it } from 'vitest'
import { formatAverage, formatRange, summarizeScores } from './stats'

describe('summarizeScores', () => {
  it('summarises the design sample day', () => {
    const s = summarizeScores([5, 4, 3, 5, 7, 8])
    expect(s.count).toBe(6)
    expect(formatAverage(s.average)).toBe('5.3')
    expect(formatRange(s)).toBe('3–8')
  })

  it('handles no data', () => {
    const s = summarizeScores([])
    expect(s).toEqual({ count: 0, average: null, min: null, max: null })
    expect(formatAverage(s.average)).toBe('—')
    expect(formatRange(s)).toBe('—')
  })
})
