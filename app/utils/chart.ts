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

/** Position (0–1) of a time of day on a 06:00–24:00 axis, clamped. */
export function dayAxisPosition(minuteOfDay: number): number {
  return Math.min(1, Math.max(0, (minuteOfDay - 360) / 1080))
}
