import type { MoodEntryPatch } from '~/types/mood'
import { getMood, type MoodLevel } from '~/utils/mood'

/**
 * The quick-log flow on Today: tap a mood (or press 1–5) to create an entry
 * stamped "now", then optionally refine intensity, tags and note until Done.
 * Tapping another mood while an entry is open changes that entry instead.
 */
export function useMoodLog() {
  const { entries, addEntry, updateEntry, removeEntry } = useMoodEntries()

  const currentId = ref<string | null>(null)
  /** Increments on every pick so the pulse animation can restart. */
  const pulseKey = ref(0)

  const current = computed(() => entries.value.find(e => e.id === currentId.value) ?? null)

  async function log(level: MoodLevel) {
    const score = getMood(level).defaultScore
    pulseKey.value++
    if (current.value) {
      await updateEntry(current.value.id, { level, score })
      return
    }
    const entry = await addEntry({ level, score })
    currentId.value = entry.id
  }

  async function update(patch: MoodEntryPatch) {
    if (current.value) await updateEntry(current.value.id, patch)
  }

  async function undo() {
    if (!current.value) return
    const id = current.value.id
    currentId.value = null
    await removeEntry(id)
  }

  function done() {
    currentId.value = null
  }

  return { current, pulseKey, log, update, undo, done }
}
