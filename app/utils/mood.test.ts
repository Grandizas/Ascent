import { describe, expect, it } from 'vitest'
import { getMood, levelFromScore, MOODS, moodColorContinuous } from './mood'

describe('levelFromScore', () => {
  it.each([
    [1, 1], [2, 1], [3, 2], [4, 2], [5, 3], [6, 3], [7, 4], [8, 4], [9, 5], [10, 5],
  ])('score %i → level %i', (score, level) => {
    expect(levelFromScore(score)).toBe(level)
  })
})

describe('getMood', () => {
  it('returns the mood for a level', () => {
    expect(getMood(1).label).toBe('Sad')
    expect(getMood(5).label).toBe('Great')
    expect(MOODS.map(m => m.defaultScore)).toEqual([2, 4, 5, 7, 9])
  })
})

describe('moodColorContinuous', () => {
  it('hits the anchors exactly', () => {
    expect(moodColorContinuous(2)).toBe('oklch(0.500 0.075 262.0)')
    expect(moodColorContinuous(5.5)).toBe('oklch(0.660 0.018 85.0)')
    expect(moodColorContinuous(9)).toBe('oklch(0.820 0.105 68.0)')
  })

  it('clamps outside the range', () => {
    expect(moodColorContinuous(0)).toBe(moodColorContinuous(2))
    expect(moodColorContinuous(10)).toBe(moodColorContinuous(9))
  })

  it('interpolates between anchors', () => {
    expect(moodColorContinuous(3)).toBe('oklch(0.540 0.068 247.0)')
  })
})
