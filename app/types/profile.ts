export interface Profile {
  id: string
  displayName: string
  /** IANA zone; decides what "today" means. */
  timezone: string
  /** True while the timezone follows the browser; false once picked in Settings. */
  timezoneAuto: boolean
  /** Tags offered when logging a mood, in order; null means the defaults. */
  tags: string[] | null
  /** ISO timestamp the account was created. */
  createdAt: string
}

export type ProfilePatch = Partial<Pick<Profile, 'displayName' | 'timezone' | 'timezoneAuto' | 'tags'>>
