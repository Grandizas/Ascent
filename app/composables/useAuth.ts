import type { AuthError, Provider } from '@supabase/supabase-js'

// Apple was dropped (paid developer account, secret rotation every 6 months).
export type OAuthProvider = Extract<Provider, 'google'>

/** Result of an auth action: `error` is a sentence ready to show, or null. */
export interface AuthResult {
  error: string | null
}

const GENERIC_ERROR = 'Something went wrong. Try again in a moment.'

/**
 * Runs an auth call and turns anything it throws (as opposed to the AuthError
 * Supabase returns) into the generic message, so callers never get a rejected
 * promise and their loading state always resets.
 */
async function guarded<T extends AuthResult>(run: () => Promise<T>, fallback: Omit<T, 'error'>): Promise<T> {
  try {
    return await run()
  }
  catch (error) {
    console.error('[auth] unexpected failure', error)
    return { ...fallback, error: GENERIC_ERROR } as T
  }
}

/**
 * Supabase Auth actions used by the auth pages and the shell. Errors are
 * mapped to the product's tone; raw Supabase messages never reach the UI.
 * None of the actions reject.
 */
export function useAuth() {
  const supabase = useSupabaseClient()

  const origin = () => useRequestURL().origin
  /** Where the email / OAuth link lands; `next` must be an in-app path. */
  const callbackUrl = (next: string) => `${origin()}/confirm?next=${encodeURIComponent(safeNext(next))}`

  function signIn(email: string, password: string): Promise<AuthResult> {
    return guarded(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      return { error: error && describe(error, 'sign-in') }
    }, {})
  }

  /** `needsConfirmation` is true when the project requires email confirmation first. */
  function signUp(input: { name: string, email: string, password: string }): Promise<AuthResult & { needsConfirmation: boolean }> {
    return guarded(async () => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          emailRedirectTo: callbackUrl('/welcome'),
          // Read by the handle_new_user trigger to create the profile.
          data: {
            display_name: input.name.trim(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })
      return { error: error && describe(error, 'sign-up'), needsConfirmation: !error && !data.session }
    }, { needsConfirmation: false })
  }

  function signInWithProvider(provider: OAuthProvider, next: string): Promise<AuthResult> {
    return guarded(async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl(next) } })
      return { error: error && describe(error, 'oauth') }
    }, {})
  }

  /**
   * Supabase already answers "ok" for unknown addresses, so reporting real
   * failures (rate limits, email delivery) doesn't reveal whether an account exists.
   */
  function requestPasswordReset(email: string): Promise<AuthResult> {
    return guarded(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin()}/reset-password` })
      return { error: error && describe(error, 'reset') }
    }, {})
  }

  function updatePassword(password: string): Promise<AuthResult> {
    return guarded(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      return { error: error && describe(error, 'update-password') }
    }, {})
  }

  /** True once this browser no longer holds a session. */
  async function sessionCleared(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession()
      return !data.session
    }
    catch {
      return false
    }
  }

  /**
   * Signs out everywhere; if that fails, at least signs this browser out (local
   * scope needs no network). Reloads to /login only once the session is
   * confirmed gone, so no previous user's data stays in memory.
   */
  async function signOut(): Promise<AuthResult> {
    for (const scope of ['global', 'local'] as const) {
      try {
        const { error } = await supabase.auth.signOut({ scope })
        if (error) console.error(`[auth] sign-out (${scope}) failed`, error)
      }
      catch (error) {
        console.error(`[auth] sign-out (${scope}) threw`, error)
      }
      if (await sessionCleared()) {
        await reloadNuxtApp({ path: '/login', force: true })
        return { error: null }
      }
    }
    // Rare (e.g. browser storage blocked). Nothing in the design covers this, so tell the user plainly.
    const error = 'Couldn’t sign out. Reload the page and try again.'
    window.alert(error)
    return { error }
  }

  return { signIn, signUp, signInWithProvider, requestPasswordReset, updatePassword, signOut }
}

/** Only allow same-app paths as post-auth destinations. */
export function safeNext(next: unknown): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

function isRateLimit(error: AuthError) {
  return error.status === 429 || /rate.?limit/i.test(error.code ?? '')
}

function describe(error: AuthError, action: 'sign-in' | 'sign-up' | 'oauth' | 'reset' | 'update-password'): string {
  if (isRateLimit(error)) return 'Too many attempts. Wait a minute and try again.'
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Try again or reset it.'
    case 'email_not_confirmed':
      return 'Confirm your email first. The link is in your inbox.'
    case 'user_already_exists':
    case 'email_exists':
      return 'There’s already an account for that email. Log in instead.'
    case 'weak_password':
      return 'Choose a stronger password: at least 8 characters, mixing letters and numbers.'
    case 'same_password':
      return 'That’s your current password. Choose a new one.'
    case 'session_not_found':
    case 'session_expired':
      return 'This link has expired. Request a new one.'
  }
  if (action === 'oauth') return 'That sign-in option isn’t available right now. Use your email instead.'
  if (action === 'reset') return 'We couldn’t send the reset email. Try again in a moment.'
  return GENERIC_ERROR
}
