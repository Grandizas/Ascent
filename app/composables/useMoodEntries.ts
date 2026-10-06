import { buildMoodFixture } from '~/fixtures/mood'
import type { MoodEntry, MoodEntryPatch } from '~/types/mood'
import type { MoodLevel } from '~/utils/mood'

/**
 * The user's mood entries and the mutations on them.
 *
 * Backed by in-memory fixtures until phase 3; the async signatures are what the
 * Supabase-backed version will keep. Updates are applied optimistically.
 */
export function useMoodEntries() {
  const timeZone = useTimezone()
  const entries = useState<MoodEntry[]>('mood-entries', () => buildMoodFixture(Date.now(), timeZone.value))

  async function addEntry(input: { level: MoodLevel, score: number, loggedAt?: Date }): Promise<MoodEntry> {
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      loggedAt: (input.loggedAt ?? new Date()).toISOString(),
      level: input.level,
      score: input.score,
      note: '',
      tags: [],
    }
    entries.value = [...entries.value, entry]
    return entry
  }

  async function updateEntry(id: string, patch: MoodEntryPatch): Promise<void> {
    entries.value = entries.value.map(e => (e.id === id ? { ...e, ...patch } : e))
  }

  async function removeEntry(id: string): Promise<void> {
    entries.value = entries.value.filter(e => e.id !== id)
  }

  // Read-only from the outside: change entries through the functions below.
  return { entries: computed(() => entries.value), addEntry, updateEntry, removeEntry }
}
