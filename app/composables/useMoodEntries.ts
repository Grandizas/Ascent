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

// Write bookkeeping. Module scope is fine: mutations only run in the browser,
// where there is one user per page load (sign-out reloads the app).
/** Per-entry write chains, so writes for one entry reach the database in order. */
const queues = new Map<string, Promise<void>>()
/** Debounced patches (note typing) not yet sent. */
const pending = new Map<string, { patch: MoodEntryPatch, timer: ReturnType<typeof setTimeout> }>()
/** Last state the database confirmed per entry; null = not in the database. */
const confirmed = new Map<string, MoodEntry | null>()
/** Entries with a failed write since their queue last drained. */
const failed = new Set<string>()

/**
 * The user's mood entries (shared state) and the mutations on them.
 *
 * Mutations are optimistic: state changes immediately and the write is queued
 * per entry, so an update can never reach the database before its insert.
 * When an entry's queue drains after a failure, the entry is rebuilt from the
 * last confirmed database state (plus any unsent note edit) and `syncError`
 * is set — so several failed writes in a row can't leave a stale value behind.
 */
export function useMoodEntries() {
  const supabase = useSupabaseClient()
  const entries = useState<MoodEntry[]>('mood-entries', () => [])
  const syncError = useState<string | null>('mood-entries-error', () => null)

  function setEntries(next: MoodEntry[]) {
    entries.value = next.sort(byLoggedAt)
  }

  /** Seeds the confirmed state the first time an entry is written in this session. */
  function seed(id: string, current: MoodEntry | null) {
    if (!confirmed.has(id)) confirmed.set(id, current && { ...current })
  }

  function reconcile(id: string) {
    const base = confirmed.get(id)
    const others = entries.value.filter(e => e.id !== id)
    if (!base) {
      const job = pending.get(id)
      if (job) clearTimeout(job.timer)
      pending.delete(id)
      setEntries(others)
      return
    }
    setEntries([...others, { ...base, ...pending.get(id)?.patch }])
  }

  function enqueue(id: string, write: () => PromiseLike<{ error: unknown }>, onSaved: () => void): Promise<void> {
    const run = (queues.get(id) ?? Promise.resolve()).then(async () => {
      const { error } = await write()
      if (error) {
        console.error('[mood-entries] write failed', error)
        failed.add(id)
        syncError.value = 'Couldn’t save that change. Check your connection and try again.'
      }
      else {
        onSaved()
      }
    })
    queues.set(id, run)
    return run.finally(() => {
      if (queues.get(id) !== run) return // more writes queued; reconcile after the last
      queues.delete(id)
      if (failed.delete(id)) reconcile(id)
    })
  }

  /**
   * Load the last `days` days (in `timeZone`), replacing what's in state.
   * Unsent and in-flight writes finish first, so nothing optimistic is lost.
   */
  async function loadRecent(timeZone: string, days = 31): Promise<void> {
    await Promise.all([...pending.keys()].map(id => flush(id)))
    await Promise.allSettled([...queues.values()])

    const from = zonedDate(addDays(dayKey(Date.now(), timeZone), -(days - 1)), 0, timeZone)
    const { data, error } = await supabase
      .from('mood_entries')
      .select(COLUMNS)
      .gte('logged_at', from.toISOString())
      .order('logged_at')
    if (error) throw error
    const loaded = (data ?? []).map(toEntry)
    if (!import.meta.server) loaded.forEach(entry => confirmed.set(entry.id, { ...entry }))

    // Anything written while the query ran keeps its local (newer) version.
    const busy = (id: string) => queues.has(id) || pending.has(id)
    const local = entries.value.filter(e => busy(e.id))
    setEntries([...loaded.filter(e => !busy(e.id)), ...local])
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
    confirmed.set(entry.id, null)

    enqueue(
      entry.id,
      () => supabase.from('mood_entries').insert({
        id: entry.id,
        logged_at: entry.loggedAt,
        level: entry.level,
        score: entry.score,
      }),
      () => confirmed.set(entry.id, { ...entry }),
    )
    return entry
  }

  /** Applies a patch to state; returns the entry as it was, or null if unknown. */
  function applyLocally(id: string, patch: MoodEntryPatch): MoodEntry | null {
    const before = entries.value.find(e => e.id === id)
    if (!before) return null
    setEntries(entries.value.map(e => (e.id === id ? { ...e, ...patch } : e)))
    return before
  }

  function persistPatch(id: string, patch: MoodEntryPatch) {
    return enqueue(
      id,
      () => supabase.from('mood_entries').update(patch).eq('id', id),
      () => {
        const base = confirmed.get(id)
        if (base) confirmed.set(id, { ...base, ...patch })
      },
    )
  }

  async function updateEntry(id: string, patch: MoodEntryPatch): Promise<void> {
    const before = applyLocally(id, patch)
    if (!before) return
    seed(id, before)
    await persistPatch(id, patch)
  }

  /**
   * Updates state now but saves after `delay` ms of quiet (typing a note).
   * Later patches for the same entry are merged into one write.
   */
  function updateEntrySoon(id: string, patch: MoodEntryPatch, delay = 600): void {
    const before = applyLocally(id, patch)
    if (!before) return
    seed(id, before)
    const existing = pending.get(id)
    if (existing) clearTimeout(existing.timer)
    pending.set(id, {
      patch: { ...existing?.patch, ...patch },
      timer: setTimeout(() => flush(id), delay),
    })
  }

  /** Saves any debounced patch for `id` right away. */
  async function flush(id: string): Promise<void> {
    const job = pending.get(id)
    if (!job) return
    clearTimeout(job.timer)
    pending.delete(id)
    await persistPatch(id, job.patch)
  }

  async function removeEntry(id: string): Promise<void> {
    const job = pending.get(id)
    if (job) {
      clearTimeout(job.timer)
      pending.delete(id)
    }
    const before = entries.value.find(e => e.id === id)
    if (!before) return
    seed(id, before)
    setEntries(entries.value.filter(e => e.id !== id))
    await enqueue(
      id,
      () => supabase.from('mood_entries').delete().eq('id', id),
      () => confirmed.set(id, null),
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
