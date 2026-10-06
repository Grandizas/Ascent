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
  /** In-flight creation; later picks wait for it and update that entry instead of creating another. */
  let creating: Promise<void> | null = null

  const current = computed(() => entries.value.find(e => e.id === currentId.value) ?? null)

  async function log(level: MoodLevel) {
    const score = getMood(level).defaultScore
    pulseKey.value++

    if (creating) await creating
    if (current.value) {
      await updateEntry(current.value.id, { level, score })
      return
    }

    creating = addEntry({ level, score }).then((entry) => {
      currentId.value = entry.id
    })
    try {
      await creating
    }
    finally {
      creating = null
    }
  }

  async function update(patch: MoodEntryPatch) {
    if (creating) await creating
    if (current.value) await updateEntry(current.value.id, patch)
  }

  async function undo() {
    if (creating) await creating
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
