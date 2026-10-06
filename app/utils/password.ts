export type PasswordScore = 0 | 1 | 2 | 3 | 4

/**
 * Rough strength (0–4) as in the design: +1 for ≥8 chars, +1 for ≥12,
 * +1 for mixed case, +1 for a digit or symbol.
 */
export function passwordScore(password: string): PasswordScore {
  if (!password) return 0
  const score = Number(password.length >= 8)
    + Number(password.length >= 12)
    + Number(/[a-z]/.test(password) && /[A-Z]/.test(password))
    + Number(/[\d\W]/.test(password))
  return Math.min(4, score) as PasswordScore
}

export const PASSWORD_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'] as const

export const MIN_PASSWORD_LENGTH = 8

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
