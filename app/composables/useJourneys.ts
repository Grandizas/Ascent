import type { AttemptEndReason, Journey, JourneyRule, SetbackOutcome } from '~/types/journey'
import { type AttemptMood, isJourneyColor, type JourneyColor } from '~/utils/journey'

const JOURNEY_COLUMNS = `
  id, name, what_text, why_text, why_written_at, length_days, checkpoint_days, color, created_at,
  journey_rules (kind, label, suggested, position),
  journey_attempts (id, number, started_at, ended_at, end_reason, journey_setbacks (id, occurred_at, note, outcome))
`

/** Removed first, then allowed, so stored positions keep each column's order. */
const ordered = (rules: readonly JourneyRule[]) =>
  [...rules].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'remove' ? -1 : 1)).map(r => ({ kind: r.kind, label: r.label, suggested: r.suggested }))

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
  /** Set when the last load failed, so pages can tell "couldn't load" from "doesn't exist". */
  const loadFailed = useState('journeys-load-failed', () => false)

  async function load(): Promise<Journey[]> {
    const { data, error } = await supabase.from('journeys').select(JOURNEY_COLUMNS).order('created_at')
    loadFailed.value = !!error
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
          setbacks: [...a.journey_setbacks]
            .sort((x, y) => x.occurred_at.localeCompare(y.occurred_at))
            .map(s => ({ id: s.id, occurredAt: new Date(s.occurred_at).toISOString(), note: s.note, outcome: s.outcome as SetbackOutcome })),
        })),
    }))
    return journeys.value
  }

  /**
   * Creates the journey, its rules and attempt #1 together, then reloads the list. Returns the new id.
   * Once the database call succeeds the journey exists: a failed reload is only logged, so the
   * caller never offers a retry that would create it twice.
   */
  async function create(input: NewJourney): Promise<string> {
    const { data, error } = await supabase.rpc('create_journey', {
      p_name: input.name.trim(),
      p_what: input.what.trim(),
      p_why: input.why.trim(),
      p_length_days: input.lengthDays,
      p_checkpoint_days: input.checkpoints,
      p_color: input.color,
      p_rules: ordered(input.rules),
    })
    if (error) throw error
    await reloadAfterWrite()
    return data
  }

  /** After a successful write the change is saved: a failed reload is only logged, never offered as a retry. */
  async function reloadAfterWrite() {
    await load().catch(reloadError => console.error('[journeys] reload after a change failed', reloadError))
  }

  /**
   * Records a setback on the running attempt. "continued" keeps the climb;
   * "restarted" ends the attempt and opens the next, in one transaction.
   */
  async function recordSetback(journeyId: string, note: string, outcome: SetbackOutcome): Promise<void> {
    const { error } = await supabase.rpc('record_setback', { p_journey_id: journeyId, p_note: note.trim(), p_outcome: outcome })
    if (error) throw error
    await reloadAfterWrite()
  }

  /** Replaces the journey's rules (removed first, then allowed). */
  async function replaceRules(journeyId: string, rules: readonly JourneyRule[]): Promise<void> {
    const { error } = await supabase.rpc('replace_journey_rules', { p_journey_id: journeyId, p_rules: ordered(rules) })
    if (error) throw error
    await reloadAfterWrite()
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

  return { journeys, loadFailed, load, create, recordSetback, replaceRules, fetchAttemptMoods }
}
