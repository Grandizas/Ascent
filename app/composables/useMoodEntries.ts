import type { Database } from '~/types/database.types'
import type { MoodEntry, MoodEntryPatch } from '~/types/mood'
import { addDays, dayKey, zonedDate } from '~/utils/date'
import type { MoodLevel } from '~/utils/mood'

type Row = Pick<Database['public']['Tables']['mood_entries']['Row'], 'id' | 'logged_at' | 'level' | 'score' | 'note' | 'tags'>

const COLUMNS = 'id, logged_at, level, score, note, tags'

const toEntry = (row: Row): MoodEntry => ({
  id: row.id,
  loggedAt: new Date(row.logged_at).toISOString(),
  level: row.level as MoodLevel,
  score: row.score,
  note: row.note,
  tags: row.tags,
})

const byLoggedAt = (a: MoodEntry, b: MoodEntry) => a.loggedAt.localeCompare(b.loggedAt)

// Per-entry write queues and debounced patches. Module scope is fine: they
// only exist in the browser, where there is one user per page load.
const queues = new Map<string, Promise<unknown>>()
const pending = new Map<string, { patch: MoodEntryPatch, before: MoodEntry, timer: ReturnType<typeof setTimeout> }>()

/**
 * The user's mood entries (shared state) and the mutations on them.
 *
 * Mutations are optimistic: state changes immediately and the write is queued
 * per entry, so an update can never reach the database before its insert. If
 * a write fails, that change is rolled back and `syncError` is set.
 */
export function useMoodEntries() {
  const supabase = useSupabaseClient()
  const entries = useState<MoodEntry[]>('mood-entries', () => [])
  const syncError = useState<string | null>('mood-entries-error', () => null)

  function setEntries(next: MoodEntry[]) {
    entries.value = next.sort(byLoggedAt)
  }

  function enqueue(id: string, write: () => PromiseLike<{ error: unknown }>, rollback: () => void) {
    const run = (queues.get(id) ?? Promise.resolve()).then(async () => {
      const { error } = await write()
      if (error) {
        console.error('[mood-entries] write failed', error)
        rollback()
        syncError.value = 'Couldn’t save that change. Check your connection and try again.'
      }
    })
    queues.set(id, run)
    run.finally(() => queues.get(id) === run && queues.delete(id))
    return run
  }

  /** Load the last `days` days (in `timeZone`), replacing what's in state. */
  async function loadRecent(timeZone: string, days = 31): Promise<void> {
    const from = zonedDate(addDays(dayKey(Date.now(), timeZone), -(days - 1)), 0, timeZone)
    const { data, error } = await supabase
      .from('mood_entries')
      .select(COLUMNS)
      .gte('logged_at', from.toISOString())
      .order('logged_at')
    if (error) throw error
    setEntries((data ?? []).map(toEntry))
  }

  /** Adds an entry stamped now (or `loggedAt`); returns it immediately, saving in the background. */
  async function addEntry(input: { level: MoodLevel, score: number, loggedAt?: Date }): Promise<MoodEntry> {
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      loggedAt: (input.loggedAt ?? new Date()).toISOString(),
      level: input.level,
      score: input.score,
      note: '',
      tags: [],
    }
    setEntries([...entries.value, entry])
    syncError.value = null

    enqueue(
      entry.id,
      () => supabase.from('mood_entries').insert({
        id: entry.id,
        logged_at: entry.loggedAt,
        level: entry.level,
        score: entry.score,
      }),
      () => setEntries(entries.value.filter(e => e.id !== entry.id)),
    )
    return entry
  }

  function applyLocally(id: string, patch: MoodEntryPatch) {
    const before = entries.value.find(e => e.id === id)
    if (!before) return null
    setEntries(entries.value.map(e => (e.id === id ? { ...e, ...patch } : e)))
    return before
  }

  function persistPatch(id: string, patch: MoodEntryPatch, before: MoodEntry) {
    return enqueue(
      id,
      () => supabase.from('mood_entries').update(patch).eq('id', id),
      () => setEntries(entries.value.map(e => (e.id === id ? { ...e, ...pick(before, patch) } : e))),
    )
  }

  async function updateEntry(id: string, patch: MoodEntryPatch): Promise<void> {
    const before = applyLocally(id, patch)
    if (before) await persistPatch(id, patch, before)
  }

  /**
   * Updates state now but saves after `delay` ms of quiet (typing a note).
   * Later patches for the same entry are merged into one write.
   */
  function updateEntrySoon(id: string, patch: MoodEntryPatch, delay = 600): void {
    const before = applyLocally(id, patch)
    if (!before) return
    const existing = pending.get(id)
    if (existing) clearTimeout(existing.timer)
    pending.set(id, {
      patch: { ...existing?.patch, ...patch },
      // Roll back to the state before the first of the merged edits.
      before: existing?.before ?? before,
      timer: setTimeout(() => flush(id), delay),
    })
  }

  /** Saves any debounced patch for `id` right away. */
  async function flush(id: string): Promise<void> {
    const job = pending.get(id)
    if (!job) return
    clearTimeout(job.timer)
    pending.delete(id)
    await persistPatch(id, job.patch, job.before)
  }

  async function removeEntry(id: string): Promise<void> {
    const job = pending.get(id)
    if (job) {
      clearTimeout(job.timer)
      pending.delete(id)
    }
    const before = entries.value.find(e => e.id === id)
    if (!before) return
    setEntries(entries.value.filter(e => e.id !== id))
    await enqueue(
      id,
      () => supabase.from('mood_entries').delete().eq('id', id),
      () => setEntries([...entries.value, before]),
    )
  }

  return {
    // Read-only from the outside: change entries through the functions below.
    entries: computed(() => entries.value),
    syncError: computed(() => syncError.value),
    clearSyncError: () => (syncError.value = null),
    loadRecent,
    addEntry,
    updateEntry,
    updateEntrySoon,
    flush,
    removeEntry,
  }
}

function pick(entry: MoodEntry, patch: MoodEntryPatch): MoodEntryPatch {
  return Object.fromEntries(Object.keys(patch).map(k => [k, entry[k as keyof MoodEntryPatch]]))
}
