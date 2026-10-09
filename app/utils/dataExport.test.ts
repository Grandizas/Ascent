import { describe, expect, it } from 'vitest'
import { checkInsCsv, csvCell, exportFileName } from './dataExport'

describe('csvCell', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain')
    expect(csvCell(7)).toBe('7')
    expect(csvCell('a, b')).toBe('"a, b"')
    expect(csvCell('said "hi"')).toBe('"said ""hi"""')
    expect(csvCell('two\nlines')).toBe('"two\nlines"')
  })

  it('defuses spreadsheet formulas', () => {
    expect(csvCell('=SUM(A1)')).toBe('\'=SUM(A1)')
    expect(csvCell('-ish day')).toBe('\'-ish day')
    expect(csvCell('@home, again')).toBe('"\'@home, again"')
  })
})

describe('checkInsCsv', () => {
  it('writes one row per check-in in the user’s timezone', () => {
    const csv = checkInsCsv([
      { id: '1', logged_at: '2026-10-08T22:30:00+00:00', level: 4, score: 7, note: 'Long walk, then "quiet"', tags: ['Outside', 'Alone'] },
      { id: '2', logged_at: '2026-10-09T06:05:00+00:00', level: 2, score: 4, note: '', tags: [] },
    ], 'Europe/Vilnius')
    expect(csv.startsWith(String.fromCharCode(0xFEFF))).toBe(true)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'date,time,mood,intensity,tags,note,logged_at_utc',
      '2026-10-09,01:30,Good,7,Outside; Alone,"Long walk, then ""quiet""",2026-10-08T22:30:00.000Z',
      '2026-10-09,09:05,Low,4,,,2026-10-09T06:05:00.000Z',
      '',
    ])
  })
})

describe('exportFileName', () => {
  it('dates the files', () => {
    expect(exportFileName('2026-10-09', 'json')).toBe('ascent-export-2026-10-09.json')
    expect(exportFileName('2026-10-09', 'csv')).toBe('ascent-check-ins-2026-10-09.csv')
  })
})
