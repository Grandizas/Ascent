export type Point = readonly [x: number, y: number]

/**
 * Smooth SVG path through the points (Catmull-Rom converted to cubic Béziers,
 * tension 1/6, end points duplicated). Matches the curves in the design.
 */
export function smoothPath(points: readonly Point[]): string {
  if (points.length < 2) return ''

  const f = (n: number) => n.toFixed(1)
  let d = `M${f(points[0]![0])},${f(points[0]![1])}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`
  }

  return d
}

/**
 * Vertical position for a 1–10 score in a chart `height` units tall, leaving
 * `inset` above 10 and below 1 (design: 220 → 20…200, 280 → 20…260).
 */
export function scoreToY(score: number, height: number, inset = 20): number {
  return inset + ((10 - score) / 9) * (height - 2 * inset)
}

/** The design's day axis starts at 06:00. */
export const DAY_AXIS_DEFAULT_START = 360

/**
 * Start (minutes) of the day axis: 06:00, or earlier — on a 3-hour mark — when
 * any of `minutes` falls before 06:00, so early check-ins keep their real position.
 */
export function dayAxisStart(minutes: readonly number[]): number {
  const earliest = Math.min(DAY_AXIS_DEFAULT_START, ...minutes)
  return Math.max(0, Math.floor(earliest / 180) * 180)
}

/** Position (0–1) of a time of day on a `start`–24:00 axis. */
export function dayAxisPosition(minuteOfDay: number, start = DAY_AXIS_DEFAULT_START): number {
  return Math.min(1, Math.max(0, (minuteOfDay - start) / (1440 - start)))
}

/**
 * Left edge (px) for a tooltip `width` wide beside a point at `x` in a plot
 * `plotWidth` wide. As designed: right of the point up to 62% across, left
 * beyond. If the preferred side doesn't fit, use the other; if neither fits
 * (narrow screens), clamp the card inside the plot.
 */
export function placeTooltip(x: number, plotWidth: number, width: number, gap = 14): number {
  const fitsRight = x + gap + width <= plotWidth
  const fitsLeft = x - gap - width >= 0
  const preferLeft = x / plotWidth > 0.62
  if (preferLeft ? fitsLeft : !fitsRight && fitsLeft) return x - gap - width
  if (fitsRight) return x + gap
  return Math.min(Math.max(0, x - width / 2), plotWidth - width)
}

export interface AxisTick {
  /** Position on the axis, 0–1. */
  x: number
  label: string
  /** Rendered dimmer (09, 15, 21). */
  minor: boolean
  align: 'start' | 'center' | 'end'
}

/** Ticks every 3 hours on a `start`–24:00 day axis ("06:00" … "24:00"). */
export function dayAxisTicks(start = DAY_AXIS_DEFAULT_START): AxisTick[] {
  const startHour = start / 60
  const ticks: AxisTick[] = []
  for (let hour = startHour; hour <= 24; hour += 3) {
    ticks.push({
      x: (hour - startHour) / (24 - startHour),
      label: `${String(hour).padStart(2, '0')}:00`,
      minor: hour % 6 !== 0,
      align: hour === startHour ? 'start' : hour === 24 ? 'end' : 'center',
    })
  }
  return ticks
}

/** Value at percentile `p` (0–1) of `values`, nearest rank. */
export function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))]!
}
