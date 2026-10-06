let ticking = false

/** Current time (ms), refreshed every 20 s on the client — the design's cadence. */
export function useNow() {
  const now = useState('now', () => Date.now())

  if (import.meta.client && !ticking) {
    ticking = true
    onNuxtReady(() => {
      now.value = Date.now()
      setInterval(() => (now.value = Date.now()), 20_000)
    })
  }

  return now
}
