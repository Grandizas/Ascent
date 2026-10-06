import { describe, expect, it } from 'vitest'
import { smoothPath } from './chart'

describe('smoothPath', () => {
  it('needs at least two points', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([[0, 0]])).toBe('')
  })

  it('draws a straight segment for two points', () => {
    expect(smoothPath([[0, 0], [60, 30]])).toBe('M0.0,0.0 C10.0,5.0 50.0,25.0 60.0,30.0')
  })

  it('emits one cubic per segment', () => {
    const d = smoothPath([[0, 10], [10, 0], [20, 10], [30, 0]])
    expect(d.match(/C/g)).toHaveLength(3)
    expect(d.startsWith('M0.0,10.0')).toBe(true)
    expect(d.endsWith('30.0,0.0')).toBe(true)
  })
})
