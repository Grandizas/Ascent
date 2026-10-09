// Year review: the year's arc by week, month by month, superlatives, moments,
// tags, journeys and a templated reflection. Pure functions, ported from the
// design's Year Review logic. Wording stays with associations.

import type { JourneySpan } from '~/types/journey'
import type { MoodEntry } from '~/types/mood'
import { addDays, type DayKey, dayKey, daysBetween, formatMonthDay, formatTime, minuteOfDay, monthShort, weekdayIndex } from '~/utils/date'
import { journeyBaseName } from '~/utils/journey'
import { MOODS, moodColorContinuous, type MoodLevel } from '~/utils/mood'

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
/** Tags too common to say much about one month (the design's choice). */
const EVERYDAY_TAGS: readonly string[] = ['Work', 'Caffeine']
/** A month needs this many check-ins to be "best", "hardest" or "most stable". */
const MIN_MONTH_ENTRIES = 20

const mean = (values: readonly number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null)
const scores = (entries: readonly MoodEntry[]) => entries.map(e => e.score)
const plural = (count: number, word: string) => `${count.toLocaleString('en-GB')} ${word}${count === 1 ? '' : 's'}`

// ── Years ─────────────────────────────────────────────────────────────
/** Every year from the first check-in to today, oldest first. */
export function reviewYears(firstDay: DayKey | null, today: DayKey): number[] {
  const last = Number(today.slice(0, 4))
  const first = firstDay ? Math.min(Number(firstDay.slice(0, 4)), last) : last
  return Array.from({ length: last - first + 1 }, (_, i) => first + i)
}

/** The last complete year with check-ins, or the current year when there is none. */
export function defaultReviewYear(firstDay: DayKey | null, today: DayKey): number {
  const current = Number(today.slice(0, 4))
  return firstDay && Number(firstDay.slice(0, 4)) < current ? current - 1 : current
}

/** "March to December", "January to today", "March to today", or null for a whole year. */
export function partialLabel(year: number, firstDay: DayKey | null, today: DayKey): string | null {
  const current = Number(today.slice(0, 4)) === year
  const firstThisYear = firstDay && Number(firstDay.slice(0, 4)) === year && firstDay.slice(5) !== '01-01'
  if (!current && !firstThisYear) return null
  const from = firstThisYear ? MONTHS_LONG[Number(firstDay!.slice(5, 7)) - 1] : 'January'
  return `${from} to ${current ? 'today' : 'December'}`
}

// ── Model ─────────────────────────────────────────────────────────────
export interface ReviewWeek {
  /** First day of the week. */
  start: DayKey
  average: number
  entries: number
  /** x of the week's middle, 0–1 across the year. */
  x: number
  /** The noted check-in furthest from the week's average, if any. */
  note: string | null
}

export interface ReviewMonth {
  /** 0–11. */
  month: number
  short: string
  average: number | null
  entries: number
  /** Daily averages, in day order (the mini bars). */
  days: number[]
  /** "Best month", "Hardest month", "Most stable", "More #Gym than usual", "No data" or ''. */
  label: string
  tone: 'best' | 'hardest' | 'stable' | 'plain'
}

export interface Superlative {
  key: string
  value: string
  /** A month-to-month change: the value is drawn "from → to". */
  to?: string
  sub: string
  /** Dot colour (CSS). */
  color: string
}

export interface ReviewMoment {
  id: string
  /** "Oct 5". */
  date: string
  score: number
  level: MoodLevel
  note: string
  /** "Sun 18:13 · Nicotine-free · Day 12 · #Gym". */
  context: string
}

export interface ReviewTag {
  tag: string
  count: number
  /** Share of the most used tag, 0–1. */
  width: number
  /** Mood when tagged minus the yearly average. */
  difference: number
}

export interface ReviewJourney {
  id: string
  name: string
  /** "1 Sep – 29 Nov", "24 Sep – now". */
  dates: string
  status: string
  tone: 'active' | 'completed' | 'other'
}

export interface ReviewLane {
  id: string
  name: string
  /** Share of the year, 0–1. */
  left: number
  width: number
  tone: 'active' | 'completed' | 'other'
}

export interface ReviewModel {
  year: number
  /** Check-ins from part of the year only ("March to December"). */
  partial: string | null
  counts: { checkIns: number, notes: number, journeys: number, completed: number }
  average: number | null
  arcTitle: string
  weeks: ReviewWeek[]
  months: ReviewMonth[]
  best: number | null
  hardest: number | null
  superlatives: Superlative[]
  moments: ReviewMoment[]
  tags: ReviewTag[]
  journeys: ReviewJourney[]
  lanes: ReviewLane[]
  reflection: string[]
}

export interface ReviewInput {
  year: number
  /** The year's check-ins. */
  entries: readonly MoodEntry[]
  journeys: readonly JourneySpan[]
  firstDay: DayKey | null
  today: DayKey
  timeZone: string
}

export function reviewModel({ year, entries, journeys, firstDay, today, timeZone }: ReviewInput): ReviewModel {
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const yearLength = daysBetween(yearStart, `${year + 1}-01-01`)
  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
  const dayOf = (e: MoodEntry) => dayKey(e.loggedAt, timeZone)
  const average = mean(scores(sorted))
  const noted = sorted.filter(e => e.note.trim())

  // The days the record covers this year.
  const from = firstDay && firstDay > yearStart ? firstDay : yearStart
  const to = today < yearEnd ? today : yearEnd
  const coveredDays = from <= to ? daysBetween(from, to) + 1 : 0
  const inDays = (start: DayKey, count: number) => {
    const end = addDays(start, count - 1)
    return sorted.filter((e) => {
      const d = dayOf(e)
      return d >= start && d <= end
    })
  }

  // ── Months ──
  const monthStats = MONTHS_LONG.map((_, m) => {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`
    const list = sorted.filter(e => dayOf(e).startsWith(key))
    const v = mean(scores(list))
    const byDay = new Map<DayKey, number[]>()
    for (const e of list) byDay.set(dayOf(e), [...(byDay.get(dayOf(e)) ?? []), e.score])
    const days = [...byDay].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, s]) => mean(s)!)
    const sd = v !== null && days.length > 2 ? Math.sqrt(days.reduce((s, x) => s + (x - v) ** 2, 0) / days.length) : null
    const tagCounts = new Map<string, number>()
    for (const e of list) for (const t of e.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    return { month: m, list, v, days, sd, tagCounts }
  })
  const valid = monthStats.filter(o => o.list.length >= MIN_MONTH_ENTRIES)
  const best = valid.length ? valid.reduce((a, b) => (b.v! > a.v! ? b : a)) : null
  const hardest = valid.length ? valid.reduce((a, b) => (b.v! < a.v! ? b : a)) : null
  const stableList = valid.filter(o => o.sd !== null)
  const stable = stableList.length ? stableList.reduce((a, b) => (b.sd! < a.sd! ? b : a)) : null

  const yearTagCounts = new Map<string, number>()
  for (const e of sorted) for (const t of e.tags) yearTagCounts.set(t, (yearTagCounts.get(t) ?? 0) + 1)
  const tagMean = (tag: string) => mean(scores(sorted.filter(e => e.tags.includes(tag))))!

  /** The tag over-represented in a month (lift against the year), optionally only above/below-average tags. */
  const topTag = (o: (typeof monthStats)[number], direction: -1 | 0 | 1 = 0): string | null => {
    let found: { tag: string, lift: number } | null = null
    for (const [tag, count] of o.tagCounts) {
      if (EVERYDAY_TAGS.includes(tag) || count < 4) continue
      if (direction !== 0 && average !== null && (direction > 0 ? tagMean(tag) <= average : tagMean(tag) >= average)) continue
      const lift = (count / o.list.length) / (yearTagCounts.get(tag)! / sorted.length)
      if (!found || lift > found.lift) found = { tag, lift }
    }
    return found?.tag ?? null
  }

  const months: ReviewMonth[] = monthStats.map((o) => {
    const tag = o.list.length ? topTag(o) : null
    const [label, tone]: [string, ReviewMonth['tone']] = o === best
      ? ['Best month', 'best']
      : o === hardest
        ? ['Hardest month', 'hardest']
        : o === stable
          ? ['Most stable', 'stable']
          : [o.list.length ? (tag ? `More #${tag} than usual` : '') : 'No data', 'plain']
    return { month: o.month, short: monthShort(o.month + 1), average: o.v, entries: o.list.length, days: o.days, label, tone }
  })

  // ── Weeks (the arc) ──
  const weeks: ReviewWeek[] = []
  for (let k = 0; k < coveredDays; k += 7) {
    const start = addDays(from, k)
    const list = inDays(start, Math.min(7, coveredDays - k))
    const v = mean(scores(list))
    if (v === null) continue
    const telling = list.filter(e => e.note.trim()).reduce<MoodEntry | null>((pick, e) => (!pick || Math.abs(e.score - v) > Math.abs(pick.score - v) ? e : pick), null)
    weeks.push({ start, average: v, entries: list.length, x: (daysBetween(yearStart, start) + 3.5) / yearLength, note: telling ? telling.note.trim() : null })
  }

  // ── Journeys ──
  const overlapping = journeys.filter(j => j.start <= to && (j.end ?? today) >= yearStart)
  const tone = (j: JourneySpan): ReviewJourney['tone'] => (j.status === 'active' ? 'active' : j.status === 'completed' ? 'completed' : 'other')
  const completed = overlapping.filter(j => j.status === 'completed' && j.end !== null && j.end <= yearEnd).length
  const lengthOf = (j: JourneySpan) => daysBetween(j.start, j.end ?? today) + 1
  const longest = overlapping.length ? overlapping.reduce((a, b) => (lengthOf(b) > lengthOf(a) ? b : a)) : null
  const dayMonth = (d: DayKey) => `${Number(d.slice(8, 10))} ${monthShort(Number(d.slice(5, 7)))}`
  const lanes: ReviewLane[] = overlapping.map((j) => {
    const s = j.start > yearStart ? j.start : yearStart
    const last = j.end ?? today
    const e = addDays(last < yearEnd ? last : yearEnd, 1)
    return { id: j.id, name: j.name, left: daysBetween(yearStart, s) / yearLength, width: daysBetween(s, e) / yearLength, tone: tone(j) }
  })

  // ── Superlatives ──
  const levels = [0, 0, 0, 0, 0]
  for (const e of sorted) levels[e.level - 1]!++
  const common = levels.indexOf(Math.max(...levels))
  let jump: { from: (typeof monthStats)[number], to: (typeof monthStats)[number], d: number } | null = null
  for (let k = 1; k < valid.length; k++) {
    if (valid[k]!.month - valid[k - 1]!.month !== 1) continue
    const d = valid[k]!.v! - valid[k - 1]!.v!
    if (d > 0 && (!jump || d > jump.d)) jump = { from: valid[k - 1]!, to: valid[k]!, d }
  }
  const monthLine = (o: (typeof monthStats)[number], direction: -1 | 1) => {
    const tag = topTag(o, direction)
    return `Averaged ${o.v!.toFixed(1)}.${tag ? ` #${tag} showed up more than usual.` : ''}`
  }
  const superlatives: Superlative[] = []
  if (best) superlatives.push({ key: 'Best month', value: MONTHS_LONG[best.month]!, sub: monthLine(best, 1), color: moodColorContinuous(best.v!) })
  if (hardest) superlatives.push({ key: 'Most difficult month', value: MONTHS_LONG[hardest.month]!, sub: monthLine(hardest, -1), color: moodColorContinuous(hardest.v!) })
  if (stable) superlatives.push({ key: 'Most stable month', value: MONTHS_LONG[stable.month]!, sub: `Days rarely strayed more than ${stable.sd!.toFixed(1)} from the month's average.`, color: 'var(--color-text-secondary)' })
  if (sorted.length) {
    const second = levels.map((count, k) => [count, k] as const).filter(([, k]) => k !== common).sort((a, b) => b[0] - a[0])[0]!
    const secondShare = Math.round((second[0] / sorted.length) * 100)
    superlatives.push({
      key: 'Most common mood',
      value: MOODS[common]!.label,
      sub: `${Math.round((levels[common]! / sorted.length) * 100)}% of check-ins.${secondShare >= 5 ? ` ${MOODS[second[1]]!.label} came next at ${secondShare}%.` : ''}`,
      color: MOODS[common]!.color,
    })
  }
  if (jump) {
    superlatives.push({
      key: 'Biggest positive change',
      value: monthShort(jump.from.month + 1),
      to: monthShort(jump.to.month + 1),
      sub: `Average rose ${jump.d.toFixed(1)} points, from ${jump.from.v!.toFixed(1)} to ${jump.to.v!.toFixed(1)}.`,
      color: 'var(--color-positive)',
    })
  }
  if (longest) {
    const word = { active: 'Still going', completed: 'Completed', setback: 'Ended with a setback', stopped: 'Paused' }[longest.status]
    superlatives.push({ key: 'Longest journey', value: journeyBaseName(longest.name), sub: `${plural(lengthOf(longest), 'day')} · ${word}`, color: 'var(--color-sage)' })
  }

  // ── Moments worth keeping: the three highest and two lowest notes ──
  const used = new Set<string>()
  const pick = (list: readonly MoodEntry[], count: number) => {
    const out: MoodEntry[] = []
    for (const e of list) {
      if (out.length >= count) break
      const text = e.note.trim()
      if (!used.has(text)) {
        used.add(text)
        out.push(e)
      }
    }
    return out
  }
  const byScore = (direction: 1 | -1) => [...noted].sort((a, b) => direction * (b.score - a.score) || a.loggedAt.localeCompare(b.loggedAt))
  const moments: ReviewMoment[] = [...pick(byScore(1), 3), ...pick(byScore(-1), 2)]
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((e) => {
      const day = dayOf(e)
      const journey = journeys.find(j => j.start <= day && day <= (j.end ?? today))
      return {
        id: e.id,
        date: formatMonthDay(day),
        score: e.score,
        level: e.level,
        note: e.note.trim(),
        context: [
          `${WEEKDAYS[weekdayIndex(day)]} ${formatTime(e.loggedAt, timeZone)}`,
          journey && `${journeyBaseName(journey.name)} · Day ${daysBetween(journey.start, day) + 1}`,
          e.tags.length && e.tags.map(t => `#${t}`).join(' '),
        ].filter(Boolean).join(' · '),
      }
    })

  // ── Tags ──
  const topTags = [...yearTagCounts].sort((a, b) => b[1] - a[1]).slice(0, 7)
  const tags: ReviewTag[] = topTags.map(([tag, count]) => ({ tag, count, width: count / topTags[0]![1], difference: tagMean(tag) - average! }))

  // ── Reflection ──
  // The first and last two months of what was recorded this year.
  const recordedFrom = sorted.length ? dayOf(sorted[0]!) : from
  const recordedTo = sorted.length ? dayOf(sorted.at(-1)!) : to
  const firstTwo = mean(scores(inDays(recordedFrom, 60)))
  const lastStart = addDays(recordedTo, -59)
  const lastTwo = mean(scores(inDays(lastStart > recordedFrom ? lastStart : recordedFrom, 60)))
  const partial = partialLabel(year, firstDay, today)
  const trend = firstTwo !== null && lastTwo !== null ? lastTwo - firstTwo : 0
  const arcTitle = trend > 0.15 ? 'A year that climbed' : trend < -0.15 ? 'A year that asked a lot' : 'A year with its own weather'
  const reflection: string[] = []
  if (sorted.length && firstTwo !== null && lastTwo !== null) {
    const shape = trend > 0.15 ? 'ended a little higher than it began' : trend < -0.15 ? 'ended a little lower than it began' : 'ended about where it began'
    const bestTag = best ? topTag(best, 1) : null
    reflection.push([
      partial && `This record covers ${partial}.`,
      `The year ${shape}: ${firstTwo.toFixed(1)} in its first two months, ${lastTwo.toFixed(1)} in its last two.`,
      best && `${MONTHS_LONG[best.month]} was the high point${bestTag ? `, with more #${bestTag} than usual` : ''}.`,
    ].filter(Boolean).join(' '))
    if (hardest) {
      const lows = hardest.list.filter(e => e.score <= 4)
      const lowTags = new Map<string, number>()
      for (const e of lows) for (const t of e.tags) if (!EVERYDAY_TAGS.includes(t)) lowTags.set(t, (lowTags.get(t) ?? 0) + 1)
      const top = [...lowTags].sort((a, b) => b[1] - a[1])[0]
      reflection.push(`${MONTHS_LONG[hardest.month]} was harder. ${top && top[1] >= 3
        ? `${top[1]} of its ${lows.length} low entries were tagged #${top[0]}, which may be worth looking at, or may just have been that kind of month.`
        : 'Its low entries didn’t share one obvious thread.'}`)
    }
    const evening = mean(scores(sorted.filter(e => minuteOfDay(e.loggedAt, timeZone) >= 18 * 60)))
    const morning = mean(scores(sorted.filter(e => minuteOfDay(e.loggedAt, timeZone) < 12 * 60)))
    reflection.push([
      overlapping.length && `You ran ${plural(overlapping.length, 'journey')} and finished ${completed}.`,
      evening !== null && morning !== null
        ? `Across all ${plural(sorted.length, 'check-in')}, evenings averaged ${evening.toFixed(1)} against ${morning.toFixed(1)} for mornings.`
        : `There were ${plural(sorted.length, 'check-in')} in all.`,
    ].filter(Boolean).join(' '))
  }

  return {
    year,
    partial,
    counts: { checkIns: sorted.length, notes: noted.length, journeys: overlapping.length, completed },
    average,
    arcTitle,
    weeks,
    months,
    best: best?.month ?? null,
    hardest: hardest?.month ?? null,
    superlatives,
    moments,
    tags,
    journeys: overlapping.map(j => ({ id: j.id, name: j.name, dates: `${dayMonth(j.start)} – ${j.end ? dayMonth(j.end) : 'now'}`, status: j.statusLabel, tone: tone(j) })),
    lanes,
    reflection,
  }
}

/** The arc's y scale: 3.25–7.75 (clamped), as a share from the top. */
export const arcY = (value: number) => 1 - (Math.max(3.25, Math.min(7.75, value)) - 3.25) / 4.5

/** "Your year so far, January to today." / "Your year, March to December." / "Your year, in your own words." */
export function reviewSubtitle(year: number, today: DayKey, partial: string | null): string {
  if (!partial) return 'Your year, in your own words.'
  return Number(today.slice(0, 4)) === year ? `Your year so far, ${partial}.` : `Your year, ${partial}.`
}
