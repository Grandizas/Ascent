import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { MoodEntry } from '~/types/mood'

// Supabase-like store: creation resolves only after a delay.
const store = ref<MoodEntry[]>([])
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useMoodEntries', () => ({
  entries: computed(() => store.value),
  addEntry: async (input: Pick<MoodEntry, 'level' | 'score'>) => {
    await new Promise(r => setTimeout(r, 20))
    const entry: MoodEntry = { id: String(store.value.length + 1), loggedAt: new Date().toISOString(), note: '', tags: [], ...input }
    store.value = [...store.value, entry]
    return entry
  },
  updateEntry: async (id: string, patch: Partial<MoodEntry>) => {
    store.value = store.value.map(e => (e.id === id ? { ...e, ...patch } : e))
  },
  removeEntry: async (id: string) => {
    store.value = store.value.filter(e => e.id !== id)
  },
}))

const { useMoodLog } = await import('./useMoodLog')

describe('useMoodLog', () => {
  it('creates one entry for rapid picks and applies the last one', async () => {
    store.value = []
    const log = useMoodLog()
    await Promise.all([log.log(2), log.log(4), log.log(5)])
    expect(store.value).toHaveLength(1)
    expect(store.value[0]).toMatchObject({ level: 5, score: 9 })
    expect(log.current.value?.id).toBe(store.value[0]!.id)
  })

  it('undo during creation removes the entry being created', async () => {
    store.value = []
    const log = useMoodLog()
    const pick = log.log(3)
    await log.undo()
    await pick
    expect(store.value).toHaveLength(0)
    expect(log.current.value).toBeNull()
  })
})
