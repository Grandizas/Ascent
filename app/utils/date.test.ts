import { describe, expect, it } from 'vitest'
import {
  addDays, dayKey, formatClock, formatDayline, formatElapsed, formatTime,
  greeting, isValidTimeZone, minuteOfDay, zonedDate,
} from './date'

// 2026-10-05 19:43 UTC = 20:43 in London (BST, UTC+1) = 15:43 in New York (EDT).
const instant = Date.UTC(2026, 9, 5, 19, 43)

describe('zoned helpers', () => {
  it('reads the day and minute in the given zone', () => {
    expect(dayKey(instant, 'Europe/London')).toBe('2026-10-05')
    expect(minuteOfDay(instant, 'Europe/London')).toBe(20 * 60 + 43)
    expect(formatTime(instant, 'America/New_York')).toBe('15:43')
    expect(dayKey(instant, 'Asia/Tokyo')).toBe('2026-10-06')
  })

  it('round-trips through zonedDate', () => {
    for (const tz of ['UTC', 'Europe/London', 'America/New_York', 'Asia/Kolkata']) {
      const d = zonedDate('2026-10-05', 20 * 60 + 43, tz)
      expect(dayKey(d, tz)).toBe('2026-10-05')
      expect(minuteOfDay(d, tz)).toBe(1243)
    }
  })

  it('handles DST boundaries', () => {
    // Clocks go back in London on 25 Oct 2026.
    const d = zonedDate('2026-10-25', 12 * 60, 'Europe/London')
    expect(d.toISOString()).toBe('2026-10-25T12:00:00.000Z')
  })
})

describe('formatting', () => {
  it('formats clock times', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(1243)).toBe('20:43')
  })

  it('formats the day line', () => {
    expect(formatDayline(instant, 'Europe/London')).toBe('Monday · 5 October 2026 · 20:43')
  })

  it('greets by hour', () => {
    expect(greeting(8)).toBe('Good morning')
    expect(greeting(14)).toBe('Good afternoon')
    expect(greeting(20)).toBe('Good evening')
    expect(greeting(2)).toBe('Good evening')
  })

  it('formats elapsed time like the design', () => {
    const t = instant
    expect(formatElapsed(t, t + 30_000)).toBe('just now')
    expect(formatElapsed(t, t + 12 * 60_000)).toBe('12m ago')
    expect(formatElapsed(t, t + 121 * 60_000)).toBe('2h 1m ago')
    expect(formatElapsed(t, t + 3 * 24 * 60 * 60_000)).toBe('3d ago')
  })
})

describe('misc', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('validates time zones', () => {
    expect(isValidTimeZone('Europe/Vilnius')).toBe(true)
    expect(isValidTimeZone('Not/AZone')).toBe(false)
    expect(isValidTimeZone(undefined)).toBe(false)
  })
})
