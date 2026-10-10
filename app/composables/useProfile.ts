import { monthShort, zonedParts } from '~/utils/date'
import { DEFAULT_TAGS } from '~/utils/mood'
import type { Profile, ProfilePatch } from '~/types/profile'

/** The signed-in user's profile (shared state). Loaded by the default layout. */
export function useProfile() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const profile = useState<Profile | null>('profile', () => null)

  async function load(): Promise<Profile | null> {
    const id = user.value?.sub
    if (!id) {
      profile.value = null
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, timezone, timezone_auto, tags, created_at')
      .eq('id', id)
      .single()
    if (error) throw error
    profile.value = {
      id: data.id,
      displayName: data.display_name,
      timezone: data.timezone,
      timezoneAuto: data.timezone_auto,
      tags: data.tags,
      createdAt: data.created_at,
    }
    return profile.value
  }

  /** Saves the given fields; fields left out (undefined) are untouched, `tags: null` resets them. */
  async function update(patch: ProfilePatch) {
    if (!profile.value) return
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: patch.displayName,
        timezone: patch.timezone,
        timezone_auto: patch.timezoneAuto,
        tags: patch.tags,
      })
      .eq('id', profile.value.id)
    if (error) throw error
    profile.value = { ...profile.value, ...patch }
  }

  /** Tags offered when logging a mood. */
  const tagOptions = computed<readonly string[]>(() => profile.value?.tags ?? DEFAULT_TAGS)

  const displayName = computed(() => profile.value?.displayName ?? '')
  const firstName = computed(() => displayName.value.split(/\s+/)[0] ?? '')

  const initials = computed(() =>
    displayName.value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]!.toUpperCase())
      .join(''),
  )

  const memberSinceLabel = computed(() => {
    if (!profile.value) return ''
    const { year, month } = zonedParts(new Date(profile.value.createdAt), profile.value.timezone)
    return `Since ${monthShort(month)} ${year}`
  })

  return { profile, load, update, tagOptions, displayName, firstName, initials, memberSinceLabel }
}
