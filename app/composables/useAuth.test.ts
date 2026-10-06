import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fake Supabase auth: each sign-out scope can fail or throw, and may or may
// not clear the session.
let session: object | null = null
let behaviour: Record<'global' | 'local', { error?: object, throws?: boolean, clears: boolean }>
let resetError: object | null = null

const auth = {
  getSession: async () => ({ data: { session } }),
  signOut: vi.fn(async ({ scope }: { scope: 'global' | 'local' }) => {
    const b = behaviour[scope]
    if (b.throws) throw new Error('storage blocked')
    if (b.clears) session = null
    return { error: b.error ?? null }
  }),
  resetPasswordForEmail: async () => ({ error: resetError }),
}

const reloadNuxtApp = vi.fn(async () => {})
const alert = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ auth }))
vi.stubGlobal('useRequestURL', () => new URL('http://localhost:3001/'))
vi.stubGlobal('reloadNuxtApp', reloadNuxtApp)
vi.stubGlobal('window', { alert })

const { useAuth } = await import('./useAuth')

beforeEach(() => {
  session = { access_token: 'x' }
  resetError = null
  vi.clearAllMocks()
})

describe('signOut', () => {
  it('reloads to /login after a normal sign-out', async () => {
    behaviour = { global: { clears: true }, local: { clears: true } }
    expect(await useAuth().signOut()).toEqual({ error: null })
    expect(reloadNuxtApp).toHaveBeenCalledWith({ path: '/login', force: true })
    expect(auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('falls back to a local sign-out when the global one leaves the session', async () => {
    behaviour = { global: { error: { status: 500 }, clears: false }, local: { clears: true } }
    expect(await useAuth().signOut()).toEqual({ error: null })
    expect(auth.signOut).toHaveBeenLastCalledWith({ scope: 'local' })
    expect(reloadNuxtApp).toHaveBeenCalledOnce()
  })

  it('does not reload while the session is still there', async () => {
    behaviour = { global: { throws: true, clears: false }, local: { throws: true, clears: false } }
    const result = await useAuth().signOut()
    expect(result.error).toMatch(/Couldn’t sign out/)
    expect(reloadNuxtApp).not.toHaveBeenCalled()
    expect(alert).toHaveBeenCalledOnce()
  })
})

describe('requestPasswordReset', () => {
  it('succeeds quietly (Supabase also says ok for unknown addresses)', async () => {
    expect(await useAuth().requestPasswordReset('you@example.com')).toEqual({ error: null })
  })

  it('reports delivery failures instead of claiming an email was sent', async () => {
    resetError = { status: 500, code: 'unexpected_failure', name: 'AuthApiError', message: 'Error sending recovery email' }
    const { error } = await useAuth().requestPasswordReset('you@example.com')
    expect(error).toBe('We couldn’t send the reset email. Try again in a moment.')
  })

  it('reports rate limits', async () => {
    resetError = { status: 429, code: 'over_email_send_rate_limit', name: 'AuthApiError', message: 'rate limited' }
    const { error } = await useAuth().requestPasswordReset('you@example.com')
    expect(error).toMatch(/Too many attempts/)
  })
})
