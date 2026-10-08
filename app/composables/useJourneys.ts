import type { AttemptEndReason, Journey, JourneyRule } from '~/types/journey'
import { type AttemptMood, isJourneyColor, type JourneyColor } from '~/utils/journey'

const JOURNEY_COLUMNS = `
  id, name, what_text, why_text, why_written_at, length_days, checkpoint_days, color, created_at,
  journey_rules (kind, label, suggested, position),
  journey_attempts (id, number, started_at, ended_at, end_reason)
`

export interface NewJourney {
  name: string
  what: string
  why: string
  lengthDays: number
  checkpoints: number[]
  color: JourneyColor
  rules: JourneyRule[]
}

/**
 * The user's journeys with their rules and attempts (shared state). Loaded by
 * the default layout, so the sidebar, Today, Timeline and Journal all read the same list.
 */
export function useJourneys() {
  const supabase = useSupabaseClient()
  const journeys = useState<Journey[]>('journeys', () => [])

  async function load(): Promise<Journey[]> {
    const { data, error } = await supabase.from('journeys').select(JOURNEY_COLUMNS).order('created_at')
    if (error) throw error
    journeys.value = data.map(row => ({
      id: row.id,
      name: row.name,
      what: row.what_text,
      why: row.why_text,
      whyWrittenAt: new Date(row.why_written_at).toISOString(),
      lengthDays: row.length_days,
      checkpoints: [...row.checkpoint_days].sort((a, b) => a - b),
      color: isJourneyColor(row.color) ? row.color : 'amber',
      createdAt: new Date(row.created_at).toISOString(),
      rules: [...row.journey_rules]
        .sort((a, b) => a.position - b.position)
        .map(r => ({ kind: r.kind === 'allow' ? 'allow' : 'remove', label: r.label, suggested: r.suggested })),
      attempts: [...row.journey_attempts]
        .sort((a, b) => a.number - b.number)
        .map(a => ({
          id: a.id,
          number: a.number,
          startedAt: new Date(a.started_at).toISOString(),
          endedAt: a.ended_at ? new Date(a.ended_at).toISOString() : null,
          endReason: a.end_reason as AttemptEndReason | null,
        })),
    }))
    return journeys.value
  }

  /** Creates the journey, its rules and attempt #1 together, then reloads the list. Returns the new id. */
  async function create(input: NewJourney): Promise<string> {
    const { data, error } = await supabase.rpc('create_journey', {
      p_name: input.name.trim(),
      p_what: input.what.trim(),
      p_why: input.why.trim(),
      p_length_days: input.lengthDays,
      p_checkpoint_days: input.checkpoints,
      p_color: input.color,
      // Removed first, then allowed, so positions keep each column's order.
      p_rules: [...input.rules].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'remove' ? -1 : 1)).map(r => ({ ...r })),
    })
    if (error) throw error
    await load()
    return data
  }

  /** Average mood during each attempt and in the 30 days before it. */
  async function fetchAttemptMoods(): Promise<AttemptMood[]> {
    const { data, error } = await supabase.rpc('journey_attempt_moods')
    if (error) throw error
    return data.map(row => ({
      attemptId: row.attempt_id,
      beforeAverage: row.before_average === null ? null : Number(row.before_average),
      beforeEntries: Number(row.before_entries),
      duringAverage: row.during_average === null ? null : Number(row.during_average),
      duringEntries: Number(row.during_entries),
    }))
  }

  return { journeys, load, create, fetchAttemptMoods }
}
