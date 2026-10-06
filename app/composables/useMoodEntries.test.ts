import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, type Ref } from 'vue'

// ── A tiny fake of the Supabase table: async, with injectable failures ──
type Row = { id: string, logged_at: string, level: number, score: number, note: string, tags: string[] }
const db = new Map<string, Row>()
let failures = 0
const settle = <T>(apply: () => T) => new Promise<{ error: unknown }>((resolve) => {
  setTimeout(() => {
    if (failures > 0) {
      failures--
      resolve({ error: new Error('network down') })
      return
    }
    apply()
    resolve({ error: null })
  }, 5)
})

const fakeClient = {
  from: () => ({
    insert: (row: Partial<Row>) => settle(() => db.set(row.id!, { note: '', tags: [], ...row } as Row)),
    update: (patch: Partial<Row>) => ({ eq: (_: string, id: string) => settle(() => db.has(id) && db.set(id, { ...db.get(id)!, ...patch })) }),
    delete: () => ({ eq: (_: string, id: string) => settle(() => db.delete(id)) }),
    select: () => ({ gte: () => ({ order: async () => ({ data: [...db.values()], error: null }) }) }),
  }),
}

const state = new Map<string, Ref<unknown>>()
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('useSupabaseClient', () => fakeClient)
vi.stubGlobal('useState', <T>(key: string, init: () => T) => {
  if (!state.has(key)) state.set(key, ref(init()))
  return state.get(key) as Ref<T>
})

const { useMoodEntries } = await import('./useMoodEntries')

const idle = () => new Promise(r => setTimeout(r, 60))
const row = (id: string, score = 5): Row => ({ id, logged_at: '2026-10-06T08:00:00.000Z', level: 3, score, note: '', tags: [] })

async function loadedStore(...rows: Row[]) {
  rows.forEach(r => db.set(r.id, r))
  const store = useMoodEntries()
  await store.loadRecent('UTC')
  return store
}

beforeEach(() => {
  db.clear()
  state.clear()
  failures = 0
})

describe('useMoodEntries reconciliation', () => {
  it('two failed updates in a row restore the last confirmed value', async () => {
    const store = await loadedStore(row('a', 5))
    failures = 2
    store.updateEntry('a', { score: 7 })
    store.updateEntry('a', { score: 8 })
    await idle()
    expect(store.entries.value[0]!.score).toBe(5)
    expect(store.syncError.value).toBeTruthy()
  })

  it('keeps a successful write when a later one fails', async () => {
    const store = await loadedStore(row('a', 5))
    store.updateEntry('a', { score: 7 })
    await idle()
    failures = 1
    store.updateEntry('a', { score: 9 })
    await idle()
    expect(store.entries.value[0]!.score).toBe(7)
    expect(db.get('a')!.score).toBe(7)
  })

  it('removes an entry whose insert failed, even after follow-up edits', async () => {
    const store = await loadedStore()
    failures = 1
    const entry = await store.addEntry({ level: 4, score: 7 })
    store.updateEntry(entry.id, { score: 8 })
    await idle()
    expect(store.entries.value).toHaveLength(0)
    expect(db.size).toBe(0)
  })

  it('restores an entry whose delete failed', async () => {
    const store = await loadedStore(row('a', 6))
    failures = 1
    store.removeEntry('a')
    expect(store.entries.value).toHaveLength(0)
    await idle()
    expect(store.entries.value.map(e => e.score)).toEqual([6])
  })

  it('keeps an unsent note when another write fails', async () => {
    const store = await loadedStore(row('a', 5))
    store.updateEntrySoon('a', { note: 'typing…' }, 1000)
    failures = 1
    store.updateEntry('a', { score: 9 })
    await idle()
    expect(store.entries.value[0]).toMatchObject({ score: 5, note: 'typing…' })
    await store.flush('a') // don't leave the debounce timer running into other tests
  })
})

describe('loadRecent', () => {
  it('waits for in-flight inserts and unsent notes instead of dropping them', async () => {
    const store = await loadedStore()
    const entry = await store.addEntry({ level: 4, score: 7 })
    store.updateEntrySoon(entry.id, { note: 'first mood' }, 1000)
    await store.loadRecent('UTC')
    expect(store.entries.value).toHaveLength(1)
    expect(store.entries.value[0]).toMatchObject({ id: entry.id, note: 'first mood' })
    expect(db.get(entry.id)!.note).toBe('first mood')
  })
})
