import { describe, expect, it } from 'vitest'
import { dayAxisPosition, dayAxisStart, placeTooltip, scoreToY, smoothPath } from './chart'

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

describe('scales', () => {
  it('maps scores like the design', () => {
    expect(scoreToY(10, 220)).toBe(20)
    expect(scoreToY(1, 220)).toBe(200)
    expect(scoreToY(1, 280)).toBe(260)
  })

  it('maps the 06:00–24:00 day axis', () => {
    expect(dayAxisPosition(360)).toBe(0)
    expect(dayAxisPosition(900)).toBe(0.5)
    expect(dayAxisPosition(1440)).toBe(1)
  })

  it('keeps the design axis unless something happens before 06:00', () => {
    expect(dayAxisStart([])).toBe(360)
    expect(dayAxisStart([514, 1182])).toBe(360)
    expect(dayAxisStart([300])).toBe(180) // 05:00 → axis from 03:00
    expect(dayAxisStart([45, 900])).toBe(0) // 00:45 → axis from 00:00
  })

  it('gives early check-ins distinct positions on an extended axis', () => {
    const start = dayAxisStart([60, 120])
    expect(dayAxisPosition(60, start)).not.toBe(dayAxisPosition(120, start))
    expect(dayAxisPosition(720, 0)).toBe(0.5)
  })
})

describe('placeTooltip', () => {
  it('follows the design on a wide plot', () => {
    expect(placeTooltip(400, 894, 290)).toBe(414) // right of the point
    expect(placeTooltip(700, 894, 290)).toBe(396) // past 62% → left
  })

  it('switches side when the preferred one does not fit', () => {
    expect(placeTooltip(330, 600, 290)).toBe(26) // 55%: prefers right, only left fits
    expect(placeTooltip(300, 610, 290)).toBe(314) // 49%: right fits
  })

  it('centres and clamps when neither side fits', () => {
    expect(placeTooltip(150, 317, 290)).toBe(5) // 150 − 145
    expect(placeTooltip(300, 317, 290)).toBe(27) // clamped to the right edge
  })

  it('keeps the card inside a narrow plot', () => {
    for (const x of [0, 50, 160, 262]) {
      const left = placeTooltip(x, 262, 262)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left + 262).toBeLessThanOrEqual(262)
    }
  })
})
