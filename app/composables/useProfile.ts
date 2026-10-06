import { profileFixture } from '~/fixtures/shell'

/** Current user's profile. Backed by a fixture until phase 3. */
export function useProfile() {
  const profile = useState('profile', () => profileFixture)

  const initials = computed(() =>
    profile.value.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]!.toUpperCase())
      .join(''),
  )

  const memberSinceLabel = computed(() => {
    const date = new Date(profile.value.memberSince)
    return `Since ${date.toLocaleString('en-GB', { month: 'short' })} ${date.getFullYear()}`
  })

  return { profile, initials, memberSinceLabel }
}
