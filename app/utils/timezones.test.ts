import { describe, expect, it } from 'vitest'
import { formatOffset, timeZoneLabel, timeZoneName, timeZoneOffset, timeZoneOptions } from './timezones'

const summer = new Date('2026-07-01T12:00:00Z')
const winter = new Date('2026-01-15T12:00:00Z')

describe('timeZoneOffset', () => {
  it('follows daylight saving', () => {
    expect(timeZoneOffset('Europe/London', summer)).toBe(60)
    expect(timeZoneOffset('Europe/London', winter)).toBe(0)
    expect(timeZoneOffset('America/New_York', winter)).toBe(-300)
  })

  it('handles half-hour zones', () => {
    expect(timeZoneOffset('Asia/Kolkata', summer)).toBe(330)
  })
})

describe('labels', () => {
  it('formats offsets', () => {
    expect(formatOffset(0)).toBe('GMT')
    expect(formatOffset(60)).toBe('GMT+1')
    expect(formatOffset(-210)).toBe('GMT-3:30')
  })

  it('names zones readably', () => {
    expect(timeZoneName('America/Argentina/Buenos_Aires')).toBe('America / Argentina / Buenos Aires')
    expect(timeZoneLabel('Europe/Vilnius', summer)).toBe('(GMT+3) Europe / Vilnius')
  })
})

describe('timeZoneOptions', () => {
  it('sorts west to east, then by name, and adds missing zones', () => {
    const options = timeZoneOptions(winter, ['UTC', ''], ['Europe/Vilnius', 'Europe/London', 'America/New_York', 'Africa/Abidjan'])
    expect(options.map(o => o.value)).toEqual(['America/New_York', 'Africa/Abidjan', 'Europe/London', 'UTC', 'Europe/Vilnius'])
    expect(options[0]!.label).toBe('(GMT-5) America / New York')
  })

  it('lists the runtime zones by default', () => {
    expect(timeZoneOptions(winter).length).toBeGreaterThan(300)
  })
})
