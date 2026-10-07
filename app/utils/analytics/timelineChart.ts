// Chart models for the Timeline: line series per range, the year heatmap,
// journey lanes and journey start markers. Pure data; components only draw.

import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { type AxisTick, dayAxisPosition, dayAxisStart, dayAxisTicks, percentile } from '~/utils/chart'
import {
  addDays, type DayKey, dayKey, daysBetween, daysInMonth, formatDayKey, formatMonthDay, formatMonthYear, formatTime, minuteOfDay, monthShort, weekdayIndex,
} from '~/utils/date'
import { getMood, moodColorContinuous } from '~/utils/mood'
import { formatRange, summarizeScores } from './stats'
import { type DayStat, dailyStats, type Period } from './timeline'

export interface TooltipContent {
  color: string
  title: string
  /** Mono text right after the title, e.g. "7/10". */
  value?: string
  meta?: string
  body: string
  sub?: string
}

export interface ChartPoint {
  id: string
  /** 0–1 across the plot. */
  x: number
  /** Score or average (1–10). */
  v: number
  color: string
  /** Dot diameter and halo border, in px (the design's content-box sizes). */
  size: number
  border: number
  label: string
  tooltip: TooltipContent
}

export interface LineChartModel {
  line: { x: number, v: number }[]
  band: { x: number, lo: number, hi: number }[]
  average: number | null
  points: ChartPoint[]
  ticks: AxisTick[]
  /** Vertical separators (0–1), e.g. between days in a week. */
  dividers: number[]
}

const quote = (text: string) => `“${text.trim()}”`

/** Accessible name with everything the tooltip shows. */
const describe = (t: TooltipContent) => [`${t.title}, ${t.meta}.`, `${t.body}.`, t.sub && `${t.sub}.`].filter(Boolean).join(' ').replace(/([.!?…”])\./g, '$1')

function entryPoint(entry: MoodEntry, x: number, size: number, border: number, timeZone: string, withDate: boolean): ChartPoint {
  const mood = getMood(entry.level)
  const time = formatTime(entry.loggedAt, timeZone)
  const when = withDate ? `${formatMonthDay(dayKey(entry.loggedAt, timeZone))} ${time}` : time
  return {
    id: entry.id,
    x,
    v: entry.score,
    color: mood.color,
    size,
    border,
    label: `${mood.label} ${entry.score}/10, ${when}.${entry.note.trim() ? ` ${entry.note.trim()}` : ''}`,
    tooltip: {
      color: mood.color,
      title: `${mood.label} · ${entry.score}/10`,
      meta: when,
      body: entry.note.trim() || 'No note',
      sub: entry.tags.join(' · ') || 'No tags',
    },
  }
}

/** Tooltip for a whole day: the noted entry furthest from the day's average speaks for it. */
function dayTooltip(stat: DayStat, timeZone: string): TooltipContent {
  const telling = stat.entries
    .filter(e => e.note.trim())
    .sort((a, b) => Math.abs(b.score - stat.average) - Math.abs(a.score - stat.average))[0]
  const n = stat.entries.length
  return {
    color: moodColorContinuous(stat.average),
    title: `${formatDayKey(stat.day, { weekday: 'short' })} ${formatMonthDay(stat.day)}`,
    meta: `avg ${stat.average.toFixed(1)}`,
    body: telling ? `${formatTime(telling.loggedAt, timeZone)} — ${quote(telling.note)}` : 'No notes',
    sub: `${n} check-in${n === 1 ? '' : 's'} · range ${formatRange({ count: n, average: stat.average, min: stat.min, max: stat.max })}`,
  }
}

const withBand = <T>(rows: T[], band: (rows: T[]) => LineChartModel['band']) => (rows.length >= 7 ? band(rows) : [])

export function lineChartModel(entries: readonly MoodEntry[], period: Period, timeZone: string): LineChartModel {
  const average = summarizeScores(entries.map(e => e.score)).average
  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))

  switch (period.range) {
    case 'day': {
      const start = dayAxisStart(sorted.map(e => minuteOfDay(e.loggedAt, timeZone)))
      const points = sorted.map(e => entryPoint(e, dayAxisPosition(minuteOfDay(e.loggedAt, timeZone), start), 9, 2, timeZone, false))
      // Timeline centres every hour label, end ones included (Today's chart anchors them to the edges).
      const ticks = dayAxisTicks(start).map(t => ({ ...t, align: 'center' as const }))
      return { line: points.map(p => ({ x: p.x, v: p.v })), band: [], average, points, ticks, dividers: [] }
    }

    case 'week': {
      const days = dailyStats(sorted, timeZone)
      const column = (day: DayKey) => daysBetween(period.start, day)
      const within = (e: MoodEntry) => dayAxisPosition(minuteOfDay(e.loggedAt, timeZone))
      // Each day's average sits at the mean time of its check-ins (not the column
      // centre), so a day with one check-in has its line vertex on that dot.
      const meanTime = (list: MoodEntry[]) => list.reduce((sum, e) => sum + within(e), 0) / list.length
      return {
        line: days.map(d => ({ x: (column(d.day) + meanTime(d.entries)) / 7, v: d.average })),
        band: [],
        average,
        points: sorted.map((e) => {
          const day = dayKey(e.loggedAt, timeZone)
          return entryPoint(e, (column(day) + within(e)) / 7, 6, 1, timeZone, true)
        }),
        ticks: Array.from({ length: 7 }, (_, k) => {
          const day = addDays(period.start, k)
          return { x: (k + 0.5) / 7, label: `${formatDayKey(day, { weekday: 'short' })} ${Number(day.slice(8))}`, minor: false, align: 'center' as const }
        }),
        dividers: [1, 2, 3, 4, 5, 6].map(k => k / 7),
      }
    }

    case 'month': {
      const days = dailyStats(sorted, timeZone)
      const x = (day: DayKey) => (daysBetween(period.start, day) + 0.5) / 30
      return {
        line: days.map(d => ({ x: x(d.day), v: d.average })),
        band: withBand(days, rows => rows.map(d => ({ x: x(d.day), lo: d.min, hi: d.max }))),
        average,
        points: days.map((d) => {
          const tooltip = dayTooltip(d, timeZone)
          return { id: d.day, x: x(d.day), v: d.average, color: tooltip.color, size: 7, border: 2, label: describe(tooltip), tooltip }
        }),
        ticks: [0, 7, 14, 21, 28].map(k => ({ x: (k + 0.5) / 30, label: formatMonthDay(addDays(period.start, k)), minor: false, align: 'center' as const })),
        dividers: [],
      }
    }

    case 'all': {
      const months = monthsBetween(period.start, period.end)
      const byMonth = new Map<string, MoodEntry[]>()
      for (const e of sorted) {
        const key = dayKey(e.loggedAt, timeZone).slice(0, 7)
        byMonth.set(key, [...(byMonth.get(key) ?? []), e])
      }
      const n = months.length
      const rows = months.flatMap((month, i) => {
        const list = byMonth.get(month)
        if (!list?.length) return []
        const dailyAverages = dailyStats(list, timeZone).map(d => d.average)
        const avg = summarizeScores(list.map(e => e.score)).average!
        const best = [...list].filter(e => e.note.trim()).sort((a, b) => b.score - a.score)[0]
        const name = formatDayKey(`${month}-01`, { month: 'long', year: 'numeric' })
        const tooltip: TooltipContent = {
          color: moodColorContinuous(avg),
          title: name,
          meta: `avg ${avg.toFixed(1)}`,
          body: best ? `Best: ${quote(best.note)}` : 'No notes',
          sub: `${list.length} check-in${list.length === 1 ? '' : 's'}`,
        }
        return [{
          x: (i + 0.5) / n,
          avg,
          lo: percentile(dailyAverages, 0.1),
          hi: percentile(dailyAverages, 0.9),
          point: {
            id: month,
            x: (i + 0.5) / n,
            v: avg,
            color: tooltip.color,
            size: 7,
            border: 2,
            label: describe(tooltip),
            tooltip,
          } satisfies ChartPoint,
        }]
      })
      return {
        line: rows.map(r => ({ x: r.x, v: r.avg })),
        band: withBand(rows, rs => rs.map(r => ({ x: r.x, lo: r.lo, hi: r.hi }))),
        average,
        points: rows.map(r => r.point),
        ticks: months.flatMap((month, i) => (i === 0 || month.endsWith('-01')
          ? [{ x: (i + 0.5) / n, label: i === 0 ? formatMonthYear(month) : month.slice(0, 4), minor: false, align: 'center' as const }]
          : [])),
        dividers: [],
      }
    }

    case 'year':
      throw new Error('The year range is drawn as a heatmap; use yearHeatmapModel().')
  }
}

/** "YYYY-MM" for every month from `start` to `end`, inclusive. */
export function monthsBetween(start: DayKey, end: DayKey): string[] {
  const months: string[] = []
  let [y, m] = start.split('-').map(Number) as [number, number]
  const last = end.slice(0, 7)
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    months.push(key)
    if (key >= last) return months
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
}

// ── Year heatmap ────────────────────────────────────────────────────────

export interface HeatmapCell {
  day: DayKey | null
  color: string | null
  isToday: boolean
  stat: DayStat | null
  tooltip: TooltipContent | null
}

export interface HeatmapModel {
  /** Week columns, Monday-first. */
  columns: number
  /** Column-major, 7 rows per column (Mon … Sun); empty lead-in cells before 1 January. */
  cells: HeatmapCell[]
  months: { label: string, column: number }[]
}

export function yearHeatmapModel(entries: readonly MoodEntry[], year: number, today: DayKey, timeZone: string): HeatmapModel {
  const start = `${year}-01-01`
  const lead = weekdayIndex(start)
  const length = daysBetween(start, `${year}-12-31`) + 1
  const columns = Math.ceil((lead + length) / 7)
  const stats = new Map(dailyStats(entries, timeZone).map(s => [s.day, s]))

  const cells: HeatmapCell[] = Array.from({ length: lead + length }, (_, index) => {
    const offset = index - lead
    if (offset < 0) return { day: null, color: null, isToday: false, stat: null, tooltip: null }
    const day = addDays(start, offset)
    const stat = day <= today ? stats.get(day) ?? null : null
    return {
      day,
      color: stat ? moodColorContinuous(stat.average) : null,
      isToday: day === today,
      stat,
      tooltip: stat ? dayTooltip(stat, timeZone) : null,
    }
  })

  const months = Array.from({ length: 12 }, (_, m) => {
    const first = `${year}-${String(m + 1).padStart(2, '0')}-01`
    return { label: monthShort(m + 1), column: Math.floor((lead + daysBetween(start, first)) / 7) }
  })

  return { columns, cells, months }
}

// ── Journeys ────────────────────────────────────────────────────────────

export interface JourneyLane {
  journey: JourneySpan
  /** Bar position within the period, 0–1. */
  left: number
  width: number
}

export function journeyLanes(journeys: readonly JourneySpan[], period: Period, today: DayKey): JourneyLane[] {
  const end = period.end < today ? period.end : today
  const length = daysBetween(period.start, period.end) + 1
  return journeys.flatMap((journey) => {
    const jEnd = journey.end ?? today
    if (journey.start > end || jEnd < period.start) return []
    const from = journey.start > period.start ? journey.start : period.start
    const to = jEnd < period.end ? jEnd : period.end
    return [{ journey, left: daysBetween(period.start, from) / length, width: (daysBetween(from, to) + 1) / length }]
  })
}

export interface JourneyMarker {
  id: string
  label: string
  x: number
}

/** "Nicotine-free started" lines for journeys that began in the period (30-day and all-time charts). */
export function journeyMarkers(journeys: readonly JourneySpan[], period: Period): JourneyMarker[] {
  if (period.range !== 'month' && period.range !== 'all') return []
  const months = period.range === 'all' ? monthsBetween(period.start, period.end) : []
  const x = (day: DayKey) => {
    // At the start of the day, as in the design (points sit at day centres).
    if (period.range === 'month') return daysBetween(period.start, day) / 30
    const i = months.indexOf(day.slice(0, 7))
    const [y, m] = day.split('-').map(Number) as [number, number]
    return (i + (Number(day.slice(8)) - 1) / daysInMonth(y, m)) / months.length
  }
  return journeys
    // All time shows only the journeys still running, to keep the chart readable.
    .filter(j => j.start >= period.start && j.start <= period.end && (period.range === 'month' || j.status === 'active'))
    .map(j => ({ id: j.id, label: `${j.name.replace(/ · #\d+$/, '')} started`, x: x(j.start) }))
}
