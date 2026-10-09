import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fake Supabase auth: each sign-out scope can fail or throw, and may or may
// not clear the session.
let session: object | null = null
let behaviour: Record<'global' | 'local', { error?: object, throws?: boolean, clears: boolean }>
let resetError: object | null = null
let updateErrors: (object | null)[] = []
let rpcError: object | null = null

const auth = {
  getSession: async () => ({ data: { session } }),
  signOut: vi.fn(async ({ scope }: { scope: 'global' | 'local' | 'others' }) => {
    if (scope === 'others') return { error: null }
    const b = behaviour[scope]
    if (b.throws) throw new Error('storage blocked')
    if (b.clears) session = null
    return { error: b.error ?? null }
  }),
  resetPasswordForEmail: async () => ({ error: resetError }),
  updateUser: vi.fn(async () => ({ error: updateErrors.shift() ?? null })),
  reauthenticate: vi.fn(async () => ({ error: null })),
}
const rpc = vi.fn(async () => ({ error: rpcError }))

const reloadNuxtApp = vi.fn(async () => {})
const alert = vi.fn()
vi.stubGlobal('useSupabaseClient', () => ({ auth, rpc }))
vi.stubGlobal('useRequestURL', () => new URL('http://localhost:3001/'))
vi.stubGlobal('reloadNuxtApp', reloadNuxtApp)
vi.stubGlobal('window', { alert })

const { useAuth } = await import('./useAuth')

beforeEach(() => {
  session = { access_token: 'x' }
  resetError = null
  updateErrors = []
  rpcError = null
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

describe('changePassword', () => {
  it('changes it straight away when no reauthentication is needed', async () => {
    expect(await useAuth().changePassword('new password 1')).toEqual({ error: null, needsCode: false })
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new password 1', nonce: undefined })
    expect(auth.reauthenticate).not.toHaveBeenCalled()
  })

  it('asks for the emailed code when Supabase wants reauthentication, then sends it', async () => {
    updateErrors = [{ status: 400, code: 'reauthentication_needed', name: 'AuthApiError', message: '' }]
    expect(await useAuth().changePassword('new password 1')).toEqual({ error: null, needsCode: true })
    expect(auth.reauthenticate).toHaveBeenCalledOnce()

    expect(await useAuth().changePassword('new password 1', ' 123456 ')).toEqual({ error: null, needsCode: false })
    expect(auth.updateUser).toHaveBeenLastCalledWith({ password: 'new password 1', nonce: '123456' })
  })

  it('explains a wrong code', async () => {
    updateErrors = [{ status: 400, code: 'reauthentication_not_valid', name: 'AuthApiError', message: '' }]
    const { error } = await useAuth().changePassword('new password 1', '000000')
    expect(error).toBe('That code didn’t work. Use the one in the latest email.')
  })
})

describe('changeEmail', () => {
  it('sends the confirmation back to Settings', async () => {
    expect(await useAuth().changeEmail(' new@example.com ')).toEqual({ error: null })
    expect(auth.updateUser).toHaveBeenCalledWith(
      { email: 'new@example.com' },
      { emailRedirectTo: 'http://localhost:3001/confirm?next=%2Fsettings' },
    )
  })

  it('says when the address belongs to another account', async () => {
    updateErrors = [{ status: 422, code: 'email_exists', name: 'AuthApiError', message: '' }]
    expect((await useAuth().changeEmail('taken@example.com')).error).toBe('There’s already an account for that email.')
  })
})

describe('deleteAccount', () => {
  it('deletes, clears this browser’s session and leaves for /login', async () => {
    behaviour = { global: { clears: true }, local: { clears: true } }
    expect(await useAuth().deleteAccount()).toEqual({ error: null })
    expect(rpc).toHaveBeenCalledWith('delete_account')
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(reloadNuxtApp).toHaveBeenCalledWith({ path: '/login?deleted=1', force: true })
  })

  it('stays put and says nothing was removed when the delete fails', async () => {
    rpcError = { message: 'boom' }
    const { error } = await useAuth().deleteAccount()
    expect(error).toMatch(/Nothing was removed/)
    expect(auth.signOut).not.toHaveBeenCalled()
    expect(reloadNuxtApp).not.toHaveBeenCalled()
  })
})
