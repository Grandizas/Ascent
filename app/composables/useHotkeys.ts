export type HotkeyHandler = (event: KeyboardEvent) => void

/**
 * Single-key shortcuts, as used throughout the design ("1–5 anywhere", T, J, N, Esc…).
 *
 * Keys are matched case-insensitively (`'t'` also fires for `T`). Prefix with
 * `shift+` to require Shift (`'shift+q'`); a `shift+` binding wins over the plain one.
 * Shortcuts are ignored while typing in a field and when Ctrl/Cmd/Alt is held,
 * except `Escape`, which always fires.
 *
 * Registered on mount, removed on unmount.
 */
export function useHotkeys(bindings: Record<string, HotkeyHandler>) {
  const map = new Map(Object.entries(bindings).map(([key, fn]) => [key.toLowerCase(), fn]))

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing) return

    const key = event.key.toLowerCase()
    if (key !== 'escape') {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditable(event.target)) return
    }

    const handler = (event.shiftKey && map.get(`shift+${key}`)) || map.get(key)
    handler?.(event)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}
