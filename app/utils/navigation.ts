export type MobileGlyph = 'today' | 'timeline' | 'journeys' | 'insights' | 'journal'

export interface NavItem {
  label: string
  to: string
  /** Global keyboard shortcut, shown as a keycap in the sidebar. */
  shortcut: string
  /** Present when the item also appears in the mobile tab bar. */
  mobileGlyph?: MobileGlyph
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Today', to: '/', shortcut: 'T', mobileGlyph: 'today' },
  { label: 'Timeline', to: '/timeline', shortcut: 'L', mobileGlyph: 'timeline' },
  { label: 'Journeys', to: '/journeys', shortcut: 'J', mobileGlyph: 'journeys' },
  { label: 'Insights', to: '/insights', shortcut: 'I', mobileGlyph: 'insights' },
  { label: 'Journal', to: '/journal', shortcut: 'E', mobileGlyph: 'journal' },
  { label: 'Year review', to: '/review', shortcut: 'R' },
]

export const SETTINGS_NAV: NavItem = { label: 'Settings', to: '/settings', shortcut: ',' }

/**
 * Whether a nav item is active for the current path. Journey detail pages
 * highlight the journey in the sidebar list instead of "Journeys" (as in the design).
 */
export function isNavActive(item: Pick<NavItem, 'to'>, path: string): boolean {
  if (item.to === '/') return path === '/'
  if (item.to === '/journeys') return path === '/journeys' || path === '/journeys/new'
  return path === item.to || path.startsWith(`${item.to}/`)
}
