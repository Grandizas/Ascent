// The user's own tag list (Settings). Mirrors the profiles_tags_valid check
// in supabase/migrations/20261010120000_settings.sql.

export const MAX_TAGS = 40
export const MAX_TAG_LENGTH = 32

/** Trims and collapses inner whitespace, the form tags are stored in. */
export function normalizeTag(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

/** Adds a tag at the end, or explains why it can't be added. */
export function addTag(list: readonly string[], input: string): { tags: readonly string[], error: string | null } {
  const tag = normalizeTag(input)
  const fail = (error: string) => ({ tags: list, error })
  if (!tag) return fail('Type a tag first.')
  if (tag.length > MAX_TAG_LENGTH) return fail(`Keep tags to ${MAX_TAG_LENGTH} characters.`)
  const existing = list.find(t => t.toLowerCase() === tag.toLowerCase())
  if (existing) return fail(`“${existing}” is already in your list.`)
  if (list.length >= MAX_TAGS) return fail(`You can keep up to ${MAX_TAGS} tags.`)
  return { tags: [...list, tag], error: null }
}

export function removeTag(list: readonly string[], tag: string): readonly string[] {
  return list.filter(t => t !== tag)
}

export function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((tag, i) => tag === b[i])
}
