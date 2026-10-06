import type { Profile } from '~/types/profile'

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
      .select('id, display_name, timezone, created_at')
      .eq('id', id)
      .single()
    if (error) throw error
    profile.value = {
      id: data.id,
      displayName: data.display_name,
      timezone: data.timezone,
      createdAt: data.created_at,
    }
    return profile.value
  }

  async function update(patch: { displayName?: string, timezone?: string }) {
    if (!profile.value) return
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: patch.displayName, timezone: patch.timezone })
      .eq('id', profile.value.id)
    if (error) throw error
    profile.value = { ...profile.value, ...patch }
  }

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
    const date = new Date(profile.value.createdAt)
    return `Since ${date.toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: profile.value.timezone })}`
  })

  return { profile, load, update, displayName, firstName, initials, memberSinceLabel }
}
