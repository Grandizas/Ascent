export interface Profile {
  id: string
  displayName: string
  /** IANA zone; decides what "today" means. */
  timezone: string
  /** ISO timestamp the account was created. */
  createdAt: string
}
